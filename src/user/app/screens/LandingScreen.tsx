import { useNavigate } from "react-router";
import { Utensils, CalendarClock, ShoppingBag, UtensilsCrossed, ArrowRight, Store } from "lucide-react";
import itFoodLogo from "../../../../graphic/itfood-icon.png";

export function LandingScreen() {
  const navigate = useNavigate();

  const features = [
    {
      title: "Pre-Booking",
      description: "Order your food before you arrive and skip the waiting line entirely.",
      icon: CalendarClock,
      color: "bg-blue-50 text-blue-600",
    },
    {
      title: "Takeaway",
      description: "Quick and easy pickup. Your food will be ready when you arrive.",
      icon: ShoppingBag,
      color: "bg-green-50 text-green-600",
    },
    {
      title: "Dine-In",
      description: "Reserve your table and pre-order your meals for a seamless dining experience.",
      icon: UtensilsCrossed,
      color: "bg-purple-50 text-purple-600",
    },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Navigation / Header */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-gray-100 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="bg-white rounded-full p-1 border shadow-sm">
            <img
              src={itFoodLogo}
              alt="itFood Logo"
              className="w-8 h-8 object-contain"
            />
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#1A1A1A] tracking-tight">
              itFood
            </span>

            <p className="text-gray-500 text-lg font-medium">
              - Scan • Order • Enjoy
            </p>
          </div>
        </div>

        
        <button
          onClick={() => navigate("/login")}
          className="px-6 py-2 bg-gray-100 text-[#1A1A1A] rounded-full font-medium hover:bg-gray-200 transition-colors"
        >
          Sign In
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="px-6 py-16 md:py-24 max-w-5xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-[#1A1A1A] mb-6 tracking-tight">
            Order before you arrive, <br className="hidden md:block" />
            <span className="text-[#FF0031]">dine without the wait.</span>
          </h1>
          <p className="text-lg md:text-xl text-[#6B6B6B] mb-10 max-w-2xl mx-auto">
            Experience seamless dining with our smart pre-ordering system. Whether you are dining in or taking away, your food is ready when you are.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate("/login")}
              className="w-full sm:w-auto px-8 py-4 bg-[#FF0031] text-white rounded-xl font-medium text-lg hover:bg-[#E5002C] transition-colors shadow-lg shadow-[#FF0031]/20 flex items-center justify-center gap-2"
            >
              Start Ordering <ArrowRight size={20} />
            </button>
          </div>
        </section>

        {/* What We Provide Section */}
        <section className="px-6 py-16 bg-[#F5F5F5]">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-[#1A1A1A] mb-4">What We Provide</h2>
              <p className="text-[#6B6B6B] max-w-2xl mx-auto">
                Choose the dining experience that fits your schedule perfectly.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div key={index} className="bg-white p-8 rounded-3xl shadow-sm hover:shadow-md transition-shadow text-center md:text-left">
                    <div className={`w-16 h-16 ${feature.color} rounded-2xl flex items-center justify-center mb-6 mx-auto md:mx-0`}>
                      <Icon size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-[#1A1A1A] mb-3">{feature.title}</h3>
                    <p className="text-[#6B6B6B] leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      {/* Footer Section */}
      <footer className="bg-white border-t border-gray-100 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-baseline gap-2 opacity-80">
            <img src={itFoodLogo} alt="itFood Logo" className="w-5 h-5 object-contain self-center" />
            <span className="text-xl font-bold text-[#1A1A1A]">itFood</span>
            <span className="text-sm font-medium text-[#6B6B6B]">- Scan • Order • Enjoy</span>
          </div>

          <div className="text-sm text-[#6B6B6B]">
            © {new Date().getFullYear()} itFood. All rights reserved.
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <span className="text-sm text-[#6B6B6B]">Are you a restaurant partner?</span>
            <a
              href="/admin"
              className="flex items-center gap-2 px-5 py-2.5 bg-[#1A1A1A] text-white rounded-lg font-medium hover:bg-black transition-colors"
            >
              <Store size={18} />
              Login for Restaurant
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
