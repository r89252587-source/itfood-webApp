import { useEffect } from "react";
import { useNavigate } from "react-router";
import { Utensils } from "lucide-react";

export function SplashScreen() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/login");
    }, 1000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#FF0031] flex flex-col items-center justify-center px-6">
      <div className="flex flex-col items-center gap-6">
        <div className="bg-white rounded-full p-8 shadow-2xl">
          <img src="/favicon.svg" alt="itFood Logo" className="w-24 h-24 object-cover" />

        </div>

        <h1 className="text-white text-4xl font-bold">itFood</h1>

        <p className="text-white/90 text-lg text-center max-w-xs">
          Scan • Order • Enjoy <br />
          Order before you arrive
        </p>

      </div>

      <div className="mt-12">
        <div className="flex gap-2">
          <div className="w-2 h-2 bg-white/50 rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-white/50 rounded-full animate-pulse" style={{ animationDelay: '200ms' }}></div>
          <div className="w-2 h-2 bg-white/50 rounded-full animate-pulse" style={{ animationDelay: '400ms' }}></div>
        </div>
      </div>
    </div>
  );
}
