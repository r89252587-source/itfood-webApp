import { RouterProvider } from "react-router";
import { router } from "@/app/routes";
import { CartProvider } from "@/app/context/CartContext";
import { AuthProvider, useAuth } from "@/app/context/AuthContext";

function AdminBanner() {
  const { isAdminOwner } = useAuth();
  if (!isAdminOwner) return null;
  return (
    <div className="bg-amber-100 border-b border-amber-200 p-3 text-center flex flex-col sm:flex-row items-center justify-center gap-3 text-amber-900 text-sm font-medium z-50">
      <span>⚠️ You are logged in as a Restaurant Admin. Ordering capabilities are disabled.</span>
      <a 
        href="/admin" 
        className="px-4 py-1.5 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors text-xs font-bold shadow-sm"
      >
        Go to Dashboard
      </a>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <div className="w-full min-h-screen bg-gray-50 md:bg-gray-100 flex flex-col mx-auto">
          <div className="flex-1 w-full max-w-7xl mx-auto bg-white min-h-screen shadow-sm md:shadow-md relative flex flex-col">
            <AdminBanner />
            <RouterProvider router={router} />
          </div>
        </div>
      </CartProvider>
    </AuthProvider>
  );
}
