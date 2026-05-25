import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Utensils, Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/app/context/AuthContext";

export function LoginScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, profile } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const authError = searchParams.get("error_description");
    if (authError) {
      setError(authError);
    }
  }, [searchParams]);

  useEffect(() => {
    if (user && profile) {
      const redirectUrl = sessionStorage.getItem("post_login_redirect");
      if (!profile.phone || !profile.full_name) {
        navigate("/complete-profile");
      } else if (redirectUrl) {
        sessionStorage.removeItem("post_login_redirect");
        navigate(redirectUrl);
      } else {
        navigate("/restaurants");
      }
    }
  }, [user, profile, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      // Let the useEffect handle the navigation
    } catch (err: any) {
      setError(err.message || "An error occurred during login");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      window.localStorage.setItem('oauth_target', 'user');
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (err: any) {
      window.localStorage.removeItem('oauth_target');
      setError(err.message || "An error occurred with Google login");
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col md:items-center md:justify-center">
      <div className="w-full max-w-md mx-auto md:p-8 md:bg-white md:shadow-lg md:rounded-3xl md:border md:border-gray-100">
        {/* Header */}
        <div className="px-6 pt-12 pb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-[#FF0031] rounded-full p-3">
              <Utensils size={32} className="text-white" strokeWidth={2} />
            </div>
            <h1 className="text-3xl font-bold text-[#1A1A1A]">itFood- Scan • Order • Enjoy </h1>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 px-6 pt-4">
          <h2 className="text-2xl font-semibold text-[#1A1A1A] mb-2">Welcome Back!</h2>
          <p className="text-[#6B6B6B] mb-8">Sign in to continue ordering</p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email Input */}
            <div>
              <label className="block text-[#1A1A1A] mb-2">Email Address</label>
              <div className="relative">
                <Mail size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B6B6B]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full pl-12 pr-4 py-4 bg-[#F5F5F5] rounded-xl border-none outline-none focus:ring-2 focus:ring-[#FF0031] text-[#1A1A1A] placeholder:text-[#6B6B6B]"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-[#1A1A1A] mb-2">Password</label>
              <div className="relative">
                <Lock size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B6B6B]" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-12 pr-12 py-4 bg-[#F5F5F5] rounded-xl border-none outline-none focus:ring-2 focus:ring-[#FF0031] text-[#1A1A1A] placeholder:text-[#6B6B6B]"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B6B6B] hover:text-[#1A1A1A]"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Forgot Password */}
            <div className="text-right">
              <button type="button" className="text-[#FF0031] hover:underline">
                Forgot Password?
              </button>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-[#FF0031] text-white rounded-xl font-medium hover:bg-[#E5002C] transition-colors shadow-lg shadow-[#FF0031]/20 flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Signing in...
                </>
              ) : (
                "Login"
              )}
            </button>

            {/* Divider */}
            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#E5E5E5]"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-4 text-[#6B6B6B]">or</span>
              </div>
            </div>

            {/* Google Login */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full py-4 bg-white border-2 border-[#E5E5E5] rounded-xl font-medium hover:bg-[#F5F5F5] transition-colors flex items-center justify-center gap-3"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M19.9895 10.1871C19.9895 9.36767 19.9214 8.76973 19.7742 8.14966H10.1992V11.848H15.8195C15.7062 12.7671 15.0943 14.1512 13.7346 15.0813L13.7155 15.2051L16.7429 17.4969L16.9527 17.5174C18.879 15.7789 19.9895 13.221 19.9895 10.1871Z" fill="#4285F4" />
                <path d="M10.1993 19.9313C12.9527 19.9313 15.2643 19.0454 16.9527 17.5174L13.7346 15.0813C12.8734 15.6682 11.7176 16.0779 10.1993 16.0779C7.50243 16.0779 5.21352 14.3395 4.39759 11.9366L4.27799 11.9466L1.13003 14.3273L1.08887 14.4391C2.76588 17.6945 6.21061 19.9313 10.1993 19.9313Z" fill="#34A853" />
                <path d="M4.39748 11.9366C4.18219 11.3166 4.05759 10.6521 4.05759 9.96565C4.05759 9.27909 4.18219 8.61473 4.38615 7.99466L4.38045 7.8626L1.19304 5.44366L1.08875 5.49214C0.397576 6.84305 0.000976562 8.36008 0.000976562 9.96565C0.000976562 11.5712 0.397576 13.0882 1.08875 14.4391L4.39748 11.9366Z" fill="#FBBC05" />
                <path d="M10.1993 3.85336C12.1142 3.85336 13.406 4.66168 14.1425 5.33717L17.0207 2.59107C15.253 0.985496 12.9527 0 10.1993 0C6.2106 0 2.76588 2.23672 1.08887 5.49214L4.38626 7.99466C5.21352 5.59183 7.50242 3.85336 10.1993 3.85336Z" fill="#EB4335" />
              </svg>
              <span className="text-[#1A1A1A]">Continue with Google</span>
            </button>
          </form>
        </div>

        {/* Footer - Register */}
        <div className="px-6 pb-8 pt-4">
          {/* <div className="text-center mb-4">
          <p className="text-[#6B6B6B]">
            Don't have an account?{" "}
            <button className="text-[#FF0031] font-medium hover:underline">
              Register Now
            </button>
          </p>
        </div> */}
          <p className="text-xs text-[#6B6B6B] text-center">
            By continuing, you agree to our{" "}
            <span className="text-[#FF0031]">Terms of Service</span> and{" "}
            <span className="text-[#FF0031]">Privacy Policy</span>
          </p>
        </div>
      </div>
    </div>
  );
}
