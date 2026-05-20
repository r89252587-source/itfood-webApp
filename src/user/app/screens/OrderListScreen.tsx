import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Clock, MapPin, ChevronRight, Loader2 } from "lucide-react";
import { BottomNav } from "@/app/components/BottomNav";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/app/context/AuthContext";

type OrderType = "pre-booking" | "takeaway" | "dine-in";
type OrderStatus = "confirmed" | "preparing" | "ready" | "completed";

interface Order {
  id: string;
  orderId: string;
  restaurantName: string;
  restaurantLocation: string;
  orderType: OrderType;
  status: OrderStatus;
  totalAmount: number;
  items: number;
  date: string;
  time: string;
}

export function OrderListScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        // We fetch orders and join with restaurants table
        const { data, error } = await supabase
          .from('orders')
          .select('*, restaurant:restaurants(*)') // Explicitly naming the join 'restaurant'
          .eq('user_uid', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Supabase Error:', error);
          // Fallback fetch without join if the join fails
          const { data: simpleData, error: simpleError } = await supabase
            .from('orders')
            .select('*')
            .eq('user_uid', user.id)
            .order('created_at', { ascending: false });
          
          if (simpleError) throw simpleError;
          setOrders(simpleData || []);
        } else {
          setOrders(data || []);
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-blue-100 text-blue-700";
      case "preparing":
        return "bg-yellow-100 text-yellow-700";
      case "ready":
        return "bg-green-100 text-green-700";
      case "cancelled":
        return "bg-red-100 text-red-700";
      case "completed":
        return "bg-gray-100 text-gray-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const getStatusLabel = (status: string) => {
    if (!status) return "Pending";
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const getOrderTypeLabel = (type: string) => {
    switch (type) {
      case "pre-booking":
        return "Pre-Booking";
      case "takeaway":
        return "Takeaway";
      case "dine-in":
        return "Dine-In";
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <Loader2 size={48} className="text-[#FF0031] animate-spin mb-4" />
        <h2 className="text-xl font-semibold">Loading your orders...</h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5] pb-20">
      {/* Header */}
      <div className="bg-white px-6 pt-12 pb-6 shadow-sm md:px-12 max-w-7xl mx-auto">
        <h1 className="text-2xl font-semibold text-[#1A1A1A] mb-1">My Orders</h1>
        <p className="text-[#6B6B6B] text-sm">{orders.length} orders</p>
      </div>

      {/* Orders List */}
      <div className="px-6 py-6 md:px-12 md:py-8 max-w-7xl mx-auto">
        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
            <h3 className="text-lg font-semibold text-[#1A1A1A] mb-2">No Orders Yet</h3>
            <p className="text-[#6B6B6B] mb-6">Start ordering from your favorite restaurants</p>
            <button
              onClick={() => navigate("/restaurants")}
              className="px-8 py-3 bg-[#FF0031] text-white rounded-xl font-medium hover:bg-[#E5002C] transition-colors"
            >
              Browse Restaurants
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {orders.map((order) => (
            <button
              key={order.id}
              onClick={() => navigate(`/order-status/${order.id}`)}
              className="w-full bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all text-left"
            >
              {/* Order Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-[#1A1A1A]">
                      {order.restaurant?.name || order.restaurants?.name || "QuickBite Restaurant"}
                    </h3>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        order.status
                      )}`}
                    >
                      {getStatusLabel(order.status)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[#6B6B6B]">
                    <MapPin size={14} />
                    <span className="truncate">{order.restaurant?.location || order.restaurants?.location || "Location not available"}</span>
                  </div>
                </div>
                <ChevronRight size={20} className="text-[#6B6B6B] flex-shrink-0 mt-1" />
              </div>

              {/* Order Details */}
              <div className="flex items-center justify-between py-3 border-t border-gray-100">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-xs text-[#6B6B6B] mb-1">Order ID</p>
                    <p className="font-semibold text-[#1A1A1A]">#{order.id.slice(0, 8).toUpperCase()}</p>
                  </div>
                  <div className="w-px h-8 bg-gray-200"></div>
                  <div>
                    <p className="text-xs text-[#6B6B6B] mb-1">Type</p>
                    <p className="font-medium text-[#1A1A1A] text-sm">
                      {getOrderTypeLabel(order.order_type)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-[#FF0031] text-lg">₹{order.total_amount}</p>
                </div>
              </div>

              {/* Order Time */}
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                <Clock size={14} className="text-[#6B6B6B]" />
                <p className="text-sm text-[#6B6B6B]">
                  {new Date(order.created_at).toLocaleDateString()} at {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </button>
          ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
