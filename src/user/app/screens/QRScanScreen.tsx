import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useCart } from "@/app/context/CartContext";
import { Loader2 } from "lucide-react";

export function QRScanScreen() {
  const { qrId } = useParams();
  const navigate = useNavigate();
  const { setRestaurantId } = useCart();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function processQRCode() {
      if (!qrId) {
        setError("Invalid QR Code link.");
        return;
      }

      try {
        const { data, error: dbError } = await supabase
          .from("qr_codes")
          .select("restaurant_id, table_number")
          .eq("id", qrId)
          .single();

        if (dbError || !data) {
          console.error(dbError);
          setError("QR Code not found or invalid.");
          return;
        }

        // Save QR code details to session storage
        sessionStorage.setItem("qr_order_type", "QR-Code");
        sessionStorage.setItem("qr_table_number", data.table_number);
        sessionStorage.setItem("qr_restaurant_id", data.restaurant_id);
        
        // Update Cart Context
        setRestaurantId(data.restaurant_id);

        // Redirect to menu page
        navigate(`/menu/${data.restaurant_id}`, { replace: true });
      } catch (err: any) {
        console.error("Error processing QR code:", err);
        setError("An error occurred while processing the QR code.");
      }
    }

    processQRCode();
  }, [qrId, navigate, setRestaurantId]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-6 text-center">
        <h2 className="text-2xl font-bold text-red-600 mb-2">Oops!</h2>
        <p className="text-gray-600 mb-6">{error}</p>
        <button
          onClick={() => navigate("/")}
          className="px-6 py-2 bg-[#FF0031] text-white rounded-lg font-medium"
        >
          Go to Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <Loader2 size={48} className="animate-spin text-[#FF0031] mb-4" />
      <p className="text-gray-600 font-medium">Processing QR Code...</p>
    </div>
  );
}
