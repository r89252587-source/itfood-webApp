import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, CheckCircle2, Clock, PackageCheck, Plus, Loader2 } from "lucide-react";
import { BottomNav } from "@/app/components/BottomNav";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/app/context/AuthContext";

export function OrderStatusScreen() {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const { user } = useAuth();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAddItems, setShowAddItems] = useState(false);
  const [orderItems, setOrderItems] = useState<any[]>([]);

  useEffect(() => {
    if (!orderId || !user?.id) return;

    const fetchOrderAndItems = async () => {
      try {
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .eq('user_uid', user.id)
          .single();

        if (orderError) throw orderError;
        setOrder(orderData);

        const { data: itemsData, error: itemsError } = await supabase
          .from('order_items')
          .select(`
            id, quantity, portion,
            menu_items (name, image, price, half_price, full_price)
          `)
          .eq('order_id', orderId);

        if (itemsError) throw itemsError;
        setOrderItems(itemsData || []);

      } catch (error) {
        console.error('Error fetching order details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderAndItems();

    // Subscribe to real-time status changes
    const channel = supabase
      .channel(`order-${orderId}`)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'orders',
        filter: `id=eq.${orderId}`
      }, payload => {
        setOrder(payload.new);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, user?.id]);

  const orderStatus = order?.status || "pending";

  const statusSteps = [
    {
      id: "pending",
      label: "Order Placed",
      icon: Clock,
      completed: true, // Always true if order exists
    },
    {
      id: "confirmed",
      label: "Order Confirmed",
      icon: CheckCircle2,
      completed: orderStatus === "confirmed" || orderStatus === "completed",
    },
    {
      id: "completed",
      label: "Order Completed",
      icon: PackageCheck,
      completed: orderStatus === "completed",
    },
  ];

  const extraItems = [
    { id: "e1", name: "Butter Roti", price: 15 },
    { id: "e2", name: "Plain Rice", price: 80 },
    { id: "e3", name: "Raita", price: 50 },
    { id: "e4", name: "Coke (330ml)", price: 40 },
    { id: "e5", name: "Mineral Water", price: 20 },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <Loader2 size={48} className="text-[#FF0031] animate-spin mb-4" />
        <h2 className="text-xl font-semibold">Loading Order...</h2>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
          <ArrowLeft size={32} className="text-[#FF0031]" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Order Not Found</h2>
        <p className="text-[#6B6B6B] mb-8">We couldn't find the order with ID #{orderId.slice(0, 8)}</p>
        <button 
          onClick={() => navigate("/restaurants")}
          className="w-full py-4 bg-[#FF0031] text-white rounded-xl font-medium"
        >
          Go Back Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5] pb-20">
      {/* Header */}
      <div className="bg-white px-6 pt-12 pb-6 shadow-sm md:px-12 max-w-7xl mx-auto">
        <button
          onClick={() => navigate("/order-status")}
          className="mb-4 p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={24} className="text-[#1A1A1A]" />
        </button>

        <h1 className="text-2xl font-semibold text-[#1A1A1A] mb-1">Order Details</h1>
        <div className="flex justify-between items-center mt-2">
          <p className="text-[#6B6B6B] text-sm">
            Type: <span className="font-semibold capitalize text-[#1A1A1A]">{order?.order_type === 'pre-booking' ? 'Pre-Booking' : order?.order_type || 'Takeaway'}</span>
          </p>
          <p className="text-[#6B6B6B] text-sm font-mono bg-gray-100 px-2 py-1 rounded">OTP: {order?.otp || '------'}</p>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6 md:px-12 max-w-7xl mx-auto md:grid md:grid-cols-2 md:gap-8 md:space-y-0">
        <div className="space-y-6">
        {/* Order OTP Card */}
        <div className="bg-gradient-to-br from-[#FF0031] to-[#E5002C] rounded-2xl p-6 text-white shadow-lg">
          <p className="text-white/80 text-sm mb-2 font-medium uppercase tracking-wider">Verification OTP</p>
          <h2 className="text-5xl font-bold tracking-[0.2em] mb-4">{order?.otp || '------'}</h2>
          <p className="text-white/90 text-sm italic">
            Show this OTP to the restaurant staff when you arrive
          </p>
        </div>

        {/* Progress Timeline */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold text-[#1A1A1A] mb-6">Order Progress</h3>
          
          <div className="space-y-6">
            {statusSteps.map((step, index) => {
              const Icon = step.icon;
              const isLast = index === statusSteps.length - 1;
              
              return (
                <div key={step.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        step.completed
                          ? "bg-green-500 text-white"
                          : "bg-gray-200 text-gray-400"
                      }`}
                    >
                      <Icon size={24} />
                    </div>
                    {!isLast && (
                      <div
                        className={`w-1 h-12 mt-2 ${
                          step.completed ? "bg-green-500" : "bg-gray-200"
                        }`}
                      ></div>
                    )}
                  </div>
                  
                  <div className="flex-1 pt-2">
                    <h4
                      className={`font-semibold mb-1 ${
                        step.completed ? "text-[#1A1A1A]" : "text-[#6B6B6B]"
                      }`}
                    >
                      {step.label}
                    </h4>
                    <p className="text-sm text-[#6B6B6B]">
                      {step.completed ? (
                        step.id === "completed" && orderStatus === "completed" ? (
                          <span className="text-green-600 font-medium">
                            Order is complete! 🎉
                          </span>
                        ) : (
                          <span className="text-green-600">Done</span>
                        )
                      ) : (
                        <span>
                          Pending
                          {step.id === "confirmed" && (
                            <span className="block text-xs mt-1 text-red-500 font-medium">
                              Your order is not confirmed by restaurant yet!
                            </span>
                          )}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Order Progress Info */}
          <div className="mt-4 text-center">
            {orderStatus === "completed" ? (
              <p className="text-green-600 font-bold">
                Order successfully verified and completed!
              </p>
            ) : orderStatus === "cancelled" ? (
              <p className="text-red-600 font-bold">
                This order was cancelled.
              </p>
            ) : (
              <p className="text-[#6B6B6B] text-sm">
                Last updated: {new Date(order?.created_at).toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>

        {/* Estimated Time */}
        {orderStatus !== "completed" && orderStatus !== "cancelled" && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center gap-3">
            <Clock size={24} className="text-blue-600" />
            <div>
              <h4 className="font-semibold text-[#1A1A1A]">
                {order?.order_type === 'dine-in' ? 'Reservation Details' : 'Expected Arrival Time'}
              </h4>
              <p className="text-sm text-[#6B6B6B]">
                {order?.arrival_time ? (
                  <>
                    <span className="font-medium text-[#1A1A1A]">{order.arrival_time}</span>
                    {order?.order_type === 'dine-in' && order?.number_of_people ? (
                      <span> • {order.number_of_people} People</span>
                    ) : null}
                  </>
                ) : (
                  'Not specified'
                )}
              </p>
            </div>
          </div>
        )}
        </div>

        <div className="space-y-6">
        {/* Ordered Items */}
        {orderItems.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h3 className="font-semibold text-[#1A1A1A] mb-4">Ordered Items</h3>
            <div className="space-y-4">
              {orderItems.map((item) => (
                <div key={item.id} className="flex gap-4 border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-[#F5F5F5] flex-shrink-0">
                    {item.menu_items?.image ? (
                      <img src={item.menu_items.image} alt={item.menu_items.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No Img</div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium text-[#1A1A1A]">{item.menu_items?.name || 'Unknown Item'}</h4>
                      <span className="font-medium text-[#1A1A1A]">
                        ₹{(item.portion === 'half' ? item.menu_items?.half_price : item.portion === 'full' ? item.menu_items?.full_price : item.menu_items?.price) * item.quantity}
                      </span>
                    </div>
                    <div className="text-sm text-[#6B6B6B] mt-1 flex justify-between">
                      <span>Qty: {item.quantity}</span>
                      {item.portion && (
                        <span className="capitalize px-2 py-0.5 bg-gray-100 rounded text-xs">{item.portion} Portion</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add Extra Items */}
        {orderStatus !== "completed" && orderStatus !== "cancelled" && (
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
            <button
              onClick={() => setShowAddItems(!showAddItems)}
              className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#FF0031] rounded-full flex items-center justify-center">
                  <Plus size={20} className="text-white" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-[#1A1A1A]">Add Extra Items</h3>
                  <p className="text-sm text-[#6B6B6B]">Drinks, rotis, and more</p>
                </div>
              </div>
              <div
                className={`transition-transform ${
                  showAddItems ? "rotate-45" : "rotate-0"
                }`}
              >
                <Plus size={20} className="text-[#6B6B6B]" />
              </div>
            </button>

            {showAddItems && (
              <div className="px-6 pb-6 space-y-3 border-t border-gray-200 pt-4">
                {extraItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-[#F5F5F5] rounded-xl"
                  >
                    <div>
                      <h4 className="font-medium text-[#1A1A1A]">{item.name}</h4>
                      <p className="text-sm text-[#6B6B6B]">₹{item.price}</p>
                    </div>
                    <button className="px-6 py-2 bg-[#FF0031] text-white rounded-lg text-sm font-medium hover:bg-[#E5002C] transition-colors">
                      Add
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Restaurant Info */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold text-[#1A1A1A] mb-4">Restaurant Details</h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-[#6B6B6B] mb-1">Name</p>
              <p className="font-medium text-[#1A1A1A]">Spice Villa</p>
            </div>
            <div>
              <p className="text-sm text-[#6B6B6B] mb-1">Address</p>
              <p className="font-medium text-[#1A1A1A]">
                123, MG Road, Indiranagar, Bangalore - 560038
              </p>
            </div>
            <div>
              <p className="text-sm text-[#6B6B6B] mb-1">Phone</p>
              <p className="font-medium text-[#1A1A1A]">+91 98765 43210</p>
            </div>
          </div>
        </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
