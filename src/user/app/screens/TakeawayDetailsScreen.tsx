import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Clock } from "lucide-react";
import { useCart } from "@/app/context/CartContext";
import { supabase } from "@/lib/supabase";

export function TakeawayDetailsScreen() {
  const navigate = useNavigate();
  const { cart, clearCart, getTotalPrice, restaurantId } = useCart();
  const totalAmount = getTotalPrice();

  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Generate time slots in 15-minute intervals
  const timeSlots = useMemo(() => {
    const slots: string[] = [];
    const now = new Date();
    const currentMinutes = now.getMinutes();
    const roundedMinutes = Math.ceil(currentMinutes / 15) * 15;

    now.setMinutes(roundedMinutes);
    now.setSeconds(0);

    // Generate 16 slots (4 hours worth of 15-minute intervals)
    for (let i = 0; i < 16; i++) {
      const time = new Date(now.getTime() + i * 15 * 60 * 1000);
      const hours = time.getHours();
      const minutes = time.getMinutes();
      const ampm = hours >= 12 ? "PM" : "AM";
      const displayHours = hours % 12 || 12;
      const displayMinutes = minutes.toString().padStart(2, "0");
      slots.push(`${displayHours}:${displayMinutes} ${ampm}`);
    }

    return slots;
  }, []);

  const handleConfirmOrder = async () => {
    if (!selectedTimeSlot) {
      alert("Please select a pickup time");
      return;
    }

    if (cart.length === 0) {
      alert("Your cart is empty");
      return;
    }

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

      // 1. Insert Order
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_uid: user?.id || null,
          customer_name: customerName,
          customer_phone: customerPhone,
          order_type: 'takeaway',
          total_amount: totalAmount,
          arrival_time: selectedTimeSlot,
          status: 'pending',
          otp: otp,
          restaurant_id: restaurantId
        })
        .select()
        .single();

      if (orderError) {
        console.error('Supabase Order Error:', orderError);
        throw orderError;
      }

      // 2. Insert Order Items
      const orderItems = cart.map(item => ({
        order_id: orderData.id,
        menu_item_id: item.id,
        quantity: item.quantity,
        portion: item.portion || null
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        console.error('Supabase Order Items Error:', itemsError);
        throw itemsError;
      }

      // 3. Success - Clear cart and navigate
      clearCart();
      navigate(
        `/order-confirmation?orderId=${orderData.id}&otp=${otp}&total=${totalAmount}&orderType=takeaway&time=${encodeURIComponent(selectedTimeSlot)}`
      );
    } catch (error: any) {
      console.error('Full Error Details:', error);
      alert(`Failed to place order: ${error.message || 'Please try again.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] pb-32">
      {/* Header */}
      <div className="bg-white px-6 pt-12 pb-6 shadow-sm">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={24} className="text-[#1A1A1A]" />
        </button>

        <h1 className="text-2xl font-semibold text-[#1A1A1A]">Takeaway Details</h1>
        <p className="text-[#6B6B6B] text-sm">Select your pickup time</p>
      </div>

      {/* Content */}
      <div className="px-6 py-6 space-y-6">
        {/* Pickup Time Selection */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Clock size={24} className="text-[#FF0031]" />
            <h2 className="text-lg font-semibold text-[#1A1A1A]">
              Expected Pickup Time
            </h2>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {timeSlots.map((slot) => (
              <button
                key={slot}
                onClick={() => setSelectedTimeSlot(slot)}
                className={`py-3 px-2 rounded-xl font-medium text-sm transition-all ${selectedTimeSlot === slot
                    ? "bg-[#FF0031] text-white shadow-lg shadow-[#FF0031]/20"
                    : "bg-[#F5F5F5] text-[#1A1A1A] hover:bg-gray-200"
                  }`}
              >
                {slot}
              </button>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-gradient-to-br from-[#FF0031] to-[#E5002C] rounded-2xl p-6 text-white shadow-lg">
          <h3 className="font-semibold mb-4">Order Summary</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="opacity-90">Total Amount</span>
              <span className="font-semibold">₹{totalAmount}</span>
            </div>

            <div className="flex justify-between">
              <span className="opacity-90">Order Type</span>
              <span className="font-semibold">Takeaway</span>
            </div>
            {selectedTimeSlot && (
              <div className="flex justify-between">
                <span className="opacity-90">Pickup Time</span>
                <span className="font-semibold">{selectedTimeSlot}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirm Button - Fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
        <div className="max-w-3xl mx-auto px-6 py-6 md:px-12">
          <button
            onClick={handleConfirmOrder}
            disabled={!selectedTimeSlot || isSubmitting}
            className="w-full bg-[#FF0031] text-white rounded-xl py-4 font-medium hover:bg-[#E5002C] transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Placing Order..." : "Place Order"}
          </button>

          {!selectedTimeSlot && (
            <p className="text-center text-sm text-[#6B6B6B] mt-3">
              Please select a pickup time to continue
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
