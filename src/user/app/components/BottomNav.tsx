import { Home, ShoppingBag, User } from "lucide-react";
import { useNavigate, useLocation } from "react-router";

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe z-50">
      <div className="w-full max-w-7xl mx-auto flex justify-around items-center h-16">
        <button
          onClick={() => navigate("/restaurants")}
          className={`flex flex-col items-center justify-center gap-1 px-6 py-2 transition-colors ${
            isActive("/restaurants") ? "text-[#FF0031]" : "text-[#6B6B6B]"
          }`}
        >
          <Home size={24} strokeWidth={isActive("/restaurants") ? 2.5 : 2} />
          <span className="text-xs">Home</span>
        </button>

        <button
          onClick={() => navigate("/order-status")}
          className={`flex flex-col items-center justify-center gap-1 px-6 py-2 transition-colors ${
            location.pathname.includes("/order-status") ? "text-[#FF0031]" : "text-[#6B6B6B]"
          }`}
        >
          <ShoppingBag size={24} strokeWidth={location.pathname.includes("/order-status") ? 2.5 : 2} />
          <span className="text-xs">Orders</span>
        </button>

        <button
          onClick={() => navigate("/profile")}
          className={`flex flex-col items-center justify-center gap-1 px-6 py-2 transition-colors ${
            isActive("/profile") ? "text-[#FF0031]" : "text-[#6B6B6B]"
          }`}
        >
          <User size={24} strokeWidth={isActive("/profile") ? 2.5 : 2} />
          <span className="text-xs">Profile</span>
        </button>
      </div>
    </div>
  );
}
