import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Trash2, CalendarClock, ShoppingBag, UtensilsCrossed } from "lucide-react";
import { useCart } from "@/app/context/CartContext";
import { useAuth } from "@/app/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { useEffect } from "react";

type OrderType = "pre-booking" | "takeaway" | "dine-in";

export function CartScreen() {
  const navigate = useNavigate();
  const { cart, updateQuantity, removeFromCart, getTotalPrice, restaurantId, clearCart } = useCart();
  const { isAdminOwner } = useAuth();
  const [selectedOrderType, setSelectedOrderType] = useState<OrderType>("pre-booking");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const qrTable = sessionStorage.getItem("qr_table_number");
  const qrRestaurantId = sessionStorage.getItem("qr_restaurant_id");
  const isQROrder = qrTable && qrRestaurantId === restaurantId;

  const totalAmount = getTotalPrice();

  // For MVP, fetch the first restaurant from Supabase
  const [restaurant, setRestaurant] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRestaurant = async () => {
      try {
        if (!restaurantId) {
          setLoading(false);
          return;
        }
        const { data, error } = await supabase.from('restaurants').select('*').eq('id', restaurantId).single();
        if (error) throw error;
        setRestaurant(data);
      } catch (error) {
        console.error('Error fetching restaurant:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchRestaurant();
  }, [restaurantId]);

  const handleConfirmOrder = async () => {
    if (isQROrder) {
      await placeQROrder();
      return;
    }

    if (selectedOrderType === "pre-booking") {
      navigate('/pre-order-details');
    } else if (selectedOrderType === "takeaway") {
      navigate('/takeaway-details');
    } else if (selectedOrderType === "dine-in") {
      navigate('/dine-in-details');
    }
  };

  const placeQROrder = async () => {
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      let customerName: string | null = null;
      let customerPhone: string | null = null;

      if (user?.id) {
        const { data: profileData } = await supabase
          .from('userProfile')
          .select('full_name, phone')
          .eq('id', user.id)
          .maybeSingle();
        customerName = profileData?.full_name || user.user_metadata?.full_name || null;
        customerPhone = profileData?.phone || null;
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_uid: user?.id || null,
          customer_name: customerName,
          customer_phone: customerPhone,
          order_type: 'QR-Code',
          total_amount: totalAmount,
          table_number: qrTable,
          status: 'pending',
          otp: otp,
          restaurant_id: restaurantId,
          number_of_people: 1 // Default for QR
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = cart.map(item => ({
        order_id: orderData.id,
        menu_item_id: item.id,
        quantity: item.quantity,
        portion: item.portion || null
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      if (itemsError) throw itemsError;

      // Clear QR session state after successful order
      sessionStorage.removeItem("qr_order_type");
      sessionStorage.removeItem("qr_table_number");
      sessionStorage.removeItem("qr_restaurant_id");

      clearCart();
      
      const params = new URLSearchParams({
        orderId: orderData.id,
        otp: otp,
        total: totalAmount.toString(),
        orderType: "QR-Code",
        table: qrTable!
      });

      navigate(`/order-confirmation?${params.toString()}`);
    } catch (error: any) {
      console.error('Order Error:', error);
      alert(`Failed to place order: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex flex-col items-center justify-center px-6">
        <h2 className="text-2xl font-semibold text-[#1A1A1A] mb-2">Cart is Empty</h2>
        <p className="text-[#6B6B6B] mb-6 text-center">
          Add some delicious items to get started
        </p>
        <button
          onClick={() => navigate("/restaurants")}
          className="px-8 py-3 bg-[#FF0031] text-white rounded-xl font-medium hover:bg-[#E5002C] transition-colors"
        >
          Browse Restaurants
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5] pb-32 md:pb-12">
      {/* Header */}
      <div className="bg-white px-6 pt-12 pb-6 shadow-sm md:px-12 max-w-7xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={24} className="text-[#1A1A1A]" />
        </button>

        <h1 className="text-2xl font-semibold text-[#1A1A1A]">Your Cart</h1>
        <p className="text-[#6B6B6B] text-sm">{cart.length} items</p>
      </div>

      {/* Order Type Options - Compact (Hidden if QR Order) */}
      {!isQROrder && (
        <div className="bg-white px-6 py-4 shadow-sm">
          <div className="flex gap-2">
          <button
            onClick={() => restaurant?.services.preBooking && setSelectedOrderType("pre-booking")}
            disabled={!restaurant?.services.preBooking}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              selectedOrderType === "pre-booking"
                ? "bg-[#FF0031] text-white"
                : restaurant?.services.preBooking
                ? "bg-[#F5F5F5] text-[#1A1A1A] hover:bg-gray-200"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            <CalendarClock size={14} />
            Pre-Booking
          </button>
          <button
            onClick={() => restaurant?.services.takeaway && setSelectedOrderType("takeaway")}
            disabled={!restaurant?.services.takeaway}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              selectedOrderType === "takeaway"
                ? "bg-[#FF0031] text-white"
                : restaurant?.services.takeaway
                ? "bg-[#F5F5F5] text-[#1A1A1A] hover:bg-gray-200"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            <ShoppingBag size={14} />
            Take Away
          </button>
          <button
            onClick={() => restaurant?.services.dineIn && setSelectedOrderType("dine-in")}
            disabled={!restaurant?.services.dineIn}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              selectedOrderType === "dine-in"
                ? "bg-[#FF0031] text-white"
                : restaurant?.services.dineIn
                ? "bg-[#F5F5F5] text-[#1A1A1A] hover:bg-gray-200"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            <UtensilsCrossed size={14} />
            Dine-In
          </button>
        </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-6 max-w-7xl mx-auto md:px-12">
        <div className="flex-1">
          {/* Cart Items */}
          <div className="px-6 py-6 md:px-0 space-y-4">
        {cart.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-2xl p-4 flex items-center justify-between shadow-sm"
          >
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-[#1A1A1A] mb-1">
                {item.name}
              </h3>
              <p className="text-[#1A1A1A] font-semibold">₹{item.price}</p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 bg-[#F5F5F5] rounded-lg px-3 py-2">
                <button
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  className="text-[#1A1A1A] font-bold text-xl w-6 h-6 flex items-center justify-center"
                >
                  −
                </button>
                <span className="text-[#1A1A1A] font-semibold w-6 text-center">
                  {item.quantity}
                </span>
                <button
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  className="text-[#1A1A1A] font-bold text-xl w-6 h-6 flex items-center justify-center"
                >
                  +
                </button>
              </div>

              <button
                onClick={() => removeFromCart(item.id)}
                className="p-2 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 size={20} className="text-[#FF0031]" />
              </button>
            </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bill Summary */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] md:relative md:border-none md:shadow-sm md:rounded-2xl md:h-fit md:mt-6 w-full md:w-96">
        <div className="w-full mx-auto px-6 py-6 md:p-6">
          <div className="space-y-3 mb-4">
            <div className="flex items-center justify-between font-bold text-xl text-[#1A1A1A]">
              <span>Total Amount</span>
              <span className="text-[#FF0031]">₹{totalAmount}</span>
            </div>
          </div>

          <button
            onClick={handleConfirmOrder}
            disabled={isAdminOwner || isSubmitting}
            className={`w-full ${isAdminOwner ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#FF0031] hover:bg-[#E5002C]'} text-white rounded-xl py-4 font-medium transition-colors shadow-lg`}
          >
            {isAdminOwner ? "Ordering Disabled (Admin View)" : 
              isSubmitting ? "Placing Order..." :
              isQROrder ? `Place Order for Table ${qrTable}` :
              selectedOrderType === "pre-booking" ? "Confirm Pre-Order" :
              selectedOrderType === "takeaway" ? "Confirm Takeaway" :
              "Confirm Dine-In"}
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}