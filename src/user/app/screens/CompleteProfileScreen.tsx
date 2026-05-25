import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/app/context/AuthContext";
import { User, Phone } from "lucide-react";

export function CompleteProfileScreen() {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      // Pre-fill if we have metadata
      setName(user.user_metadata?.full_name || user.email?.split('@')[0] || "");
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    if (!name || !phone) {
      alert("Please fill in both fields");
      return;
    }

    setLoading(true);
    try {
      await supabase.from('userProfile').update({
        full_name: name,
        phone: phone,
        is_phoneVerified: 'not verified'
      }).eq('id', user.id);

      await refreshProfile();
      
      const redirectUrl = sessionStorage.getItem("post_login_redirect");
      if (redirectUrl) {
        sessionStorage.removeItem("post_login_redirect");
        navigate(redirectUrl);
      } else {
        navigate("/restaurants");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to save profile details");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white p-6 flex flex-col justify-center items-center">
      <div className="w-full max-w-md md:max-w-xl mx-auto bg-white md:p-10 md:rounded-2xl md:shadow-sm">
        <h1 className="text-3xl font-bold text-[#1A1A1A] mb-2 text-center">Complete Profile</h1>
        <p className="text-[#6B6B6B] mb-8 text-center">
          Please provide your details before ordering.
        </p>

        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Full Name</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B6B6B]" size={20} />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-[#F5F5F5] rounded-xl border-none outline-none focus:ring-2 focus:ring-[#FF0031]"
                placeholder="Enter your name"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B6B6B]" size={20} />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-[#F5F5F5] rounded-xl border-none outline-none focus:ring-2 focus:ring-[#FF0031]"
                placeholder="Enter your phone number"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-[#FF0031] text-white rounded-xl font-medium shadow-lg shadow-[#FF0031]/25 hover:bg-[#E5002C] transition-colors disabled:opacity-70 mt-4"
          >
            {loading ? "Saving..." : "Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}
