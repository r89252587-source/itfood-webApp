import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { useCart } from "@/app/context/CartContext";

export function OrderConfirmationScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { clearCart } = useCart();

  const orderId = searchParams.get("orderId") || "12345";
  const otp = searchParams.get("otp") || orderId.slice(0, 6).toUpperCase();
  const total = searchParams.get("total") || "0";
  const orderType = searchParams.get("orderType") || "pre-booking";
  const numberOfPeople = searchParams.get("people") || "";
  const arrivalTime = searchParams.get("time") || "";
  const date = searchParams.get("date") || "";
  const tableNumber = searchParams.get("table") || "";

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  const getOrderTypeLabel = () => {
    if (orderType === "takeaway") return "Takeaway";
    if (orderType === "dine-in") return "Dine-In Reservation";
    if (orderType === "QR-Code") return "Table Order";
    return "Pre-Order";
  };

  const getSuccessMessage = () => {
    if (orderType === "takeaway") return "Your takeaway order has been placed successfully";
    if (orderType === "dine-in") return "Your table has been reserved successfully";
    if (orderType === "QR-Code") return "Your table order has been placed successfully";
    return "Your pre-order has been placed successfully";
  };

  const getInstructionMessage = () => {
    if (orderType === "takeaway") return "Your food will be ready for pickup at the selected time. Show this OTP to the staff when collecting.";
    if (orderType === "dine-in") return "Your table is reserved. Show this OTP to the staff when you arrive at the restaurant.";
    if (orderType === "QR-Code") return "Your food will be prepared and served to your table.";
    return "Your food will be ready when you arrive. Just show this OTP to the staff.";
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col">
      {/* Success Animation */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-12">
        <div className="mb-8 animate-bounce">
          <CheckCircle2 size={80} className="text-green-500" strokeWidth={2} />
        </div>

        <h1 className="text-3xl font-bold text-[#1A1A1A] mb-2 text-center">
          {getOrderTypeLabel()} Confirmed!
        </h1>
        <p className="text-[#6B6B6B] text-center mb-8">
          {getSuccessMessage()}
        </p>

        {/* OTP Card */}
        <div className="bg-white rounded-2xl p-6 shadow-lg w-full max-w-sm mb-6 border-2 border-[#FF0031]/10">
          <div className="text-center mb-6">
            <p className="text-[#6B6B6B] text-sm mb-2 font-medium uppercase tracking-widest">Verification OTP</p>
            <h2 className="text-5xl font-bold text-[#FF0031] tracking-[0.2em] px-4">
              {otp}
            </h2>
            <p className="text-xs text-[#6B6B6B] mt-4 italic">
              Show this code to the restaurant staff
            </p>
          </div>

          <div className="border-t border-dashed border-gray-200 pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[#6B6B6B] text-sm">Order ID</span>
              <span className="text-xs font-mono text-gray-400">#{orderId.slice(0, 8).toUpperCase()}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[#6B6B6B]">Order Type</span>
              <span className="font-semibold text-[#FF0031] capitalize">
                {orderType === "pre-booking" ? "Pre-Booking" : orderType === "takeaway" ? "Takeaway" : orderType === "QR-Code" ? "Table Order" : "Dine-In"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#6B6B6B]">Total Amount</span>
              <span className="font-semibold text-[#1A1A1A]">₹{total}</span>
            </div>

            {numberOfPeople && (
              <div className="flex items-center justify-between">
                <span className="text-[#6B6B6B]">Number of People</span>
                <span className="font-semibold text-[#1A1A1A]">{numberOfPeople}</span>
              </div>
            )}
            {date && (
              <div className="flex items-center justify-between">
                <span className="text-[#6B6B6B]">Date</span>
                <span className="font-semibold text-[#1A1A1A]">{date}</span>
              </div>
            )}
            {arrivalTime && (
              <div className="flex items-center justify-between">
                <span className="text-[#6B6B6B]">
                  {orderType === "takeaway" ? "Pickup Time" : orderType === "dine-in" ? "Time Slot" : "Expected Arrival"}
                </span>
                <span className="font-semibold text-[#FF0031]">{arrivalTime}</span>
              </div>
            )}
            {tableNumber && (
              <div className="flex items-center justify-between">
                <span className="text-[#6B6B6B]">Table Number</span>
                <span className="font-semibold text-[#1A1A1A]">#{tableNumber}</span>
              </div>
            )}
          </div>
        </div>

        {/* Order Status */}
        <div className="bg-white rounded-2xl p-6 shadow-lg w-full max-w-sm mb-6">
          <div className="flex items-center gap-4">
            <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
            <div className="flex-1">
              <h3 className="font-semibold text-[#1A1A1A] mb-1">Order Status</h3>
              <p className="text-[#6B6B6B] text-sm">Confirmed - Being prepared</p>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 w-full max-w-sm">
          <h3 className="font-semibold text-[#1A1A1A] mb-2">
            📱 {orderType === "dine-in" ? "Your Table is Reserved" : orderType === "QR-Code" ? "Sit back and relax" : "Show this Order ID"}
          </h3>
          <p className="text-sm text-[#6B6B6B]">
            {getInstructionMessage()}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white border-t border-gray-200 shadow-lg">
        <div className="max-w-3xl mx-auto px-6 py-6 space-y-3 md:px-12">
          <button
            onClick={() => navigate(`/order-status/${orderId}`)}
            className="w-full bg-[#FF0031] text-white rounded-xl py-4 font-medium hover:bg-[#E5002C] transition-colors shadow-lg flex items-center justify-center gap-2"
          >
            Track Order
            <ArrowRight size={20} />
          </button>

          <button
            onClick={() => navigate("/restaurants")}
            className="w-full bg-[#F5F5F5] text-[#1A1A1A] rounded-xl py-4 font-medium hover:bg-gray-200 transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}