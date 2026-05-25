import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, ShoppingCart, Leaf, Star, MapPin, FileText, X, CalendarClock, ShoppingBag, UtensilsCrossed, Search } from "lucide-react";
import { useCart } from "@/app/context/CartContext";
import { useAuth } from "@/app/context/AuthContext";
import { Input } from "@/app/components/ui/input";
import { supabase } from "@/lib/supabase";

type Category = "all" | "veg" | "non-veg";
type FoodType = "all" | "starter" | "main" | "bread" | "dessert" | "beverage";
type OrderType = "pre-booking" | "takeaway" | "dine-in";

export function MenuScreen() {
  const navigate = useNavigate();
  const { restaurantId } = useParams();
  const { addToCart, updateQuantity, getTotalItems, getTotalPrice, getItemQuantity, setRestaurantId } = useCart();
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState<Category>("all");
  const [activeFoodType, setActiveFoodType] = useState<FoodType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrderType, setSelectedOrderType] = useState<OrderType>("pre-booking");
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [showReadMore, setShowReadMore] = useState(false);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const descRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (restaurantId) {
      setRestaurantId(restaurantId);
    }
  }, [restaurantId, setRestaurantId]);

  const [restaurant, setRestaurant] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<any>(null);

  function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 6371; // km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    return (R * c).toFixed(1);
  }

  useEffect(() => {
    if (user) {
      supabase.from('userProfile').select('latitude, longitude').eq('id', user.id).single().then(({ data }) => {
        if (data) setUserLocation(data);
      });
    }
  }, [user]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!restaurantId) return;

        // Fetch restaurant details
        const { data: restaurantData, error: restaurantError } = await supabase
          .from("restaurants")
          .select("*")
          .eq("id", restaurantId)
          .single();

        if (restaurantError) throw restaurantError;
        setRestaurant(restaurantData);

        // Fetch menu items
        const { data: menuData, error: menuError } = await supabase
          .from("menu_items")
          .select("*")
          .eq("restaurant_id", restaurantId);

        if (menuError) throw menuError;
        
        // Map snake_case to camelCase for the frontend
        const mappedItems = (menuData || []).map(item => ({
          ...item,
          foodType: item.food_type,
          halfPrice: item.half_price,
          fullPrice: item.full_price,
          hasPortions: item.has_portions,
          isCountable: item.is_countable
        }));
        setItems(mappedItems);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [restaurantId]);

  useEffect(() => {
    if (descRef.current && !isDescExpanded) {
      const { scrollHeight, clientHeight } = descRef.current;
      if (scrollHeight > clientHeight) {
        setShowReadMore(true);
      } else {
        setShowReadMore(false);
      }
    }
  }, [restaurant?.description]);

  const filteredItems = items.filter((item) => {
    // Filter by veg/non-veg category
    const categoryMatch = activeCategory === "all" || item.category === activeCategory;

    // Filter by food type (starter, main, etc.)
    const foodTypeMatch = activeFoodType === "all" || item.foodType === activeFoodType;

    // Filter by search query
    const searchMatch = searchQuery === "" ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());

    return categoryMatch && foodTypeMatch && searchMatch;
  });

  const handleAddToCartAuth = (item: any) => {
    if (!user) {
      sessionStorage.setItem("post_login_redirect", `/menu/${restaurantId}`);
      navigate("/login");
      return;
    }
    addToCart(item);
  };

  const handleUpdateQuantityAuth = (id: string, quantity: number, portion?: "half" | "full") => {
    if (!user) {
      sessionStorage.setItem("post_login_redirect", `/menu/${restaurantId}`);
      navigate("/login");
      return;
    }
    updateQuantity(id, quantity, portion);
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] pb-24">
      {/* Header with Restaurant Image */}
      <div className="relative">
        <div className="h-48 overflow-hidden">
          <img
            src={restaurant?.image}
            alt={restaurant?.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        </div>
        
        <button
          onClick={() => navigate("/restaurants")}
          className="absolute top-12 left-6 p-2 bg-white/90 backdrop-blur-sm rounded-lg hover:bg-white transition-colors"
        >
          <ArrowLeft size={24} className="text-[#1A1A1A]" />
        </button>

        <div className="absolute bottom-0 left-0 right-0 px-6 pb-4">
          <h1 className="text-2xl font-semibold text-white mb-1">
            {restaurant?.name}
          </h1>
          <p className="text-white/90 text-sm">{restaurant?.cuisine}</p>
        </div>
      </div>

      {/* Restaurant Details */}
      <div className="bg-white px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Star size={18} className="text-[#FF0031] fill-[#FF0031]" />
            <span className="font-semibold text-[#1A1A1A]">{restaurant?.rating}</span>
            <span className="text-[#6B6B6B] text-sm">Google Rating</span>
          </div>
          <div className="flex items-center gap-2">
            {userLocation?.latitude && restaurant?.latitude ? (
              <div className="flex items-center gap-1 bg-blue-50 text-blue-600 px-2 py-1 rounded-md text-sm font-medium">
                <MapPin size={14} />
                <span>{calculateDistance(userLocation.latitude, userLocation.longitude, restaurant.latitude, restaurant.longitude)} km away</span>
              </div>
            ) : (
              <>
                <MapPin size={18} className="text-[#6B6B6B]" />
                <span className="text-[#1A1A1A] font-medium">{restaurant?.distance || 'Distance unknown'}</span>
              </>
            )}
          </div>
        </div>
        {restaurant?.description && (
          <div className="mt-3 text-[#6B6B6B] text-sm">
            <p
              ref={descRef}
              className={`leading-relaxed transition-all ${
                isDescExpanded ? "" : "line-clamp-2"
              }`}
            >
              {restaurant.description}
            </p>
            {showReadMore && (
              <button
                onClick={() => setIsDescExpanded(!isDescExpanded)}
                className="text-[#FF0031] font-semibold mt-1 focus:outline-none hover:underline"
              >
                {isDescExpanded ? "Read Less" : "Read More..."}
              </button>
            )}
          </div>
        )}
        <div className="mt-3 flex items-start gap-2 border-t border-gray-100 pt-3">
          <MapPin size={18} className="text-[#6B6B6B] mt-0.5 flex-shrink-0" />
          <p className="text-[#6B6B6B] text-sm">{restaurant?.location}</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white px-6 py-4 shadow-sm sticky top-0 z-10">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B6B6B]" size={20} />
          <Input
            type="text"
            placeholder="Search for dishes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#F5F5F5] border-none rounded-lg focus:ring-2 focus:ring-[#FF0031]"
          />
        </div>

        {/* Veg/Non-Veg Category Filter */}
        <div className="flex gap-3 mb-3">
          <button
            onClick={() => setActiveCategory("all")}
            className={`px-6 py-2 rounded-full font-medium transition-colors ${
              activeCategory === "all"
                ? "bg-[#FF0031] text-white"
                : "bg-[#F5F5F5] text-[#6B6B6B]"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveCategory("veg")}
            className={`px-6 py-2 rounded-full font-medium transition-colors flex items-center gap-2 ${
              activeCategory === "veg"
                ? "bg-[#FF0031] text-white"
                : "bg-[#F5F5F5] text-[#6B6B6B]"
            }`}
          >
            <Leaf size={16} />
            Veg
          </button>
          <button
            onClick={() => setActiveCategory("non-veg")}
            className={`px-6 py-2 rounded-full font-medium transition-colors ${
              activeCategory === "non-veg"
                ? "bg-[#FF0031] text-white"
                : "bg-[#F5F5F5] text-[#6B6B6B]"
            }`}
          >
            Non-Veg
          </button>
        </div>

        {/* Food Type Filter */}
        <div className="flex gap-2 mb-3 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setActiveFoodType("all")}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
              activeFoodType === "all"
                ? "bg-[#1A1A1A] text-white"
                : "bg-[#F5F5F5] text-[#6B6B6B]"
            }`}
          >
            All Items
          </button>
          <button
            onClick={() => setActiveFoodType("starter")}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
              activeFoodType === "starter"
                ? "bg-[#1A1A1A] text-white"
                : "bg-[#F5F5F5] text-[#6B6B6B]"
            }`}
          >
            Starters
          </button>
          <button
            onClick={() => setActiveFoodType("main")}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
              activeFoodType === "main"
                ? "bg-[#1A1A1A] text-white"
                : "bg-[#F5F5F5] text-[#6B6B6B]"
            }`}
          >
            Main Course
          </button>
          <button
            onClick={() => setActiveFoodType("bread")}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
              activeFoodType === "bread"
                ? "bg-[#1A1A1A] text-white"
                : "bg-[#F5F5F5] text-[#6B6B6B]"
            }`}
          >
            Breads
          </button>
          <button
            onClick={() => setActiveFoodType("dessert")}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
              activeFoodType === "dessert"
                ? "bg-[#1A1A1A] text-white"
                : "bg-[#F5F5F5] text-[#6B6B6B]"
            }`}
          >
            Desserts
          </button>
          <button
            onClick={() => setActiveFoodType("beverage")}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
              activeFoodType === "beverage"
                ? "bg-[#1A1A1A] text-white"
                : "bg-[#F5F5F5] text-[#6B6B6B]"
            }`}
          >
            Beverages
          </button>
        </div>

        {/* Order Type Options - Compact */}
        <div className="flex gap-2">
          <button
            onClick={() => restaurant?.services.preBooking && setSelectedOrderType("pre-booking")}
            disabled={!restaurant?.services.preBooking}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              selectedOrderType === "pre-booking"
                ? "bg-[#FF0031] text-white"
                : restaurant?.services.preBooking
                ? "bg-[#F5F5F5] text-[#1A1A1A] hover:bg-gray-200"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            <CalendarClock size={14} />
            Pre-Booking
          </button>
          <button
            onClick={() => restaurant?.services.takeaway && setSelectedOrderType("takeaway")}
            disabled={!restaurant?.services.takeaway}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              selectedOrderType === "takeaway"
                ? "bg-[#FF0031] text-white"
                : restaurant?.services.takeaway
                ? "bg-[#F5F5F5] text-[#1A1A1A] hover:bg-gray-200"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            <ShoppingBag size={14} />
            Take Away
          </button>
          <button
            onClick={() => restaurant?.services.dineIn && setSelectedOrderType("dine-in")}
            disabled={!restaurant?.services.dineIn}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              selectedOrderType === "dine-in"
                ? "bg-[#FF0031] text-white"
                : restaurant?.services.dineIn
                ? "bg-[#F5F5F5] text-[#1A1A1A] hover:bg-gray-200"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            <UtensilsCrossed size={14} />
            Dine-In
          </button>
        </div>
      </div>

      {/* Menu Items */}
      <div className="px-6 py-6 md:px-12 md:py-8 space-y-4 md:space-y-6">
        {/* View PDF Button */}
        <button
          onClick={() => setShowPdfModal(true)}
          className="w-full bg-white rounded-2xl shadow-sm p-4 flex items-center justify-center gap-3 hover:shadow-md transition-shadow"
        >
          <FileText size={20} className="text-[#FF0031]" />
          <span className="text-[#1A1A1A] font-medium">View Full Menu PDF</span>
        </button>

        {loading ? (
          <div className="text-center py-12 bg-white rounded-2xl">
            <p className="text-[#6B6B6B] text-lg">Loading menu...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl">
            <p className="text-[#6B6B6B] text-lg">No items found</p>
            <p className="text-sm text-[#6B6B6B] mt-2">
              {searchQuery ? "Try a different search term" : "Try selecting a different category or filter"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {filteredItems.map((item: any) => {
              const halfQuantity = getItemQuantity(item.id, "half");
              const fullQuantity = getItemQuantity(item.id, "full");
              const regularQuantity = getItemQuantity(item.id);

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm p-4 flex gap-4"
                >
                  <div className="flex-1">
                    <div className="flex items-start gap-2 mb-2">
                      <div
                        className={`w-4 h-4 border-2 flex items-center justify-center mt-1 ${
                          item.category === "veg"
                            ? "border-green-600"
                            : "border-red-600"
                        }`}
                      >
                        <div
                          className={`w-2 h-2 rounded-full ${
                            item.category === "veg" ? "bg-green-600" : "bg-red-600"
                          }`}
                        ></div>
                      </div>
                      <h3 className="text-lg font-semibold text-[#1A1A1A]">
                        {item.name}
                      </h3>
                    </div>

                    <p
                      className={`text-[#6B6B6B] text-sm mb-3 ${expandedItemId === item.id ? "" : "line-clamp-2"}`}
                    >
                      {item.description}
                    </p>
                    {expandedItemId !== item.id && (
                      <button
                        onClick={() => setExpandedItemId(item.id)}
                        className="text-[#FF0031] font-semibold mt-1 focus:outline-none hover:underline"
                      >
                        Read more...
                      </button>
                    )}
                    {expandedItemId === item.id && (
                      <button
                        onClick={() => setExpandedItemId(null)}
                        className="text-[#FF0031] font-semibold mt-1 focus:outline-none hover:underline"
                      >
                        Read less
                      </button>
                    )}

                    {/* Price display based on item type */}
                    {item.hasPortions ? (
                      <div className="flex gap-4 mb-3">
                        <div>
                          <p className="text-xs text-[#6B6B6B]">Half</p>
                          <p className="text-[#1A1A1A] font-semibold">₹{item.halfPrice}</p>
                        </div>
                        <div>
                          <p className="text-xs text-[#6B6B6B]">Full</p>
                          <p className="text-[#1A1A1A] font-semibold">₹{item.fullPrice}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[#1A1A1A] font-semibold mb-3">₹{item.price}</p>
                    )}

                    {/* Action buttons based on item type */}
                    {item.hasPortions ? (
                      // Half/Full portion buttons
                      <div className="flex gap-3">
                        <div className="flex flex-col gap-2">
                          <span className="text-xs text-[#6B6B6B] font-medium">Half</span>
                          {halfQuantity === 0 ? (
                            <button
                              onClick={() => handleAddToCartAuth({ id: item.id, name: item.name, price: item.halfPrice, portion: "half" })}
                              className="px-6 py-2 bg-[#FF0031] text-white rounded-lg font-medium hover:bg-[#E5002C] transition-colors"
                            >
                              Add
                            </button>
                          ) : (
                            <div className="flex items-center gap-2 bg-[#FF0031] rounded-lg px-2 py-2">
                              <button
                                onClick={() => handleUpdateQuantityAuth(item.id, halfQuantity - 1, "half")}
                                className="text-white font-bold text-lg w-6 h-6 flex items-center justify-center"
                              >
                                −
                              </button>
                              <span className="text-white font-semibold w-6 text-center">
                                {halfQuantity}
                              </span>
                              <button
                                onClick={() => handleUpdateQuantityAuth(item.id, halfQuantity + 1, "half")}
                                className="text-white font-bold text-lg w-6 h-6 flex items-center justify-center"
                              >
                                +
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-2">
                          <span className="text-xs text-[#6B6B6B] font-medium">Full</span>
                          {fullQuantity === 0 ? (
                            <button
                              onClick={() => handleAddToCartAuth({ id: item.id, name: item.name, price: item.fullPrice, portion: "full" })}
                              className="px-6 py-2 bg-[#FF0031] text-white rounded-lg font-medium hover:bg-[#E5002C] transition-colors"
                            >
                              Add
                            </button>
                          ) : (
                            <div className="flex items-center gap-2 bg-[#FF0031] rounded-lg px-2 py-2">
                              <button
                                onClick={() => handleUpdateQuantityAuth(item.id, fullQuantity - 1, "full")}
                                className="text-white font-bold text-lg w-6 h-6 flex items-center justify-center"
                              >
                                −
                              </button>
                              <span className="text-white font-semibold w-6 text-center">
                                {fullQuantity}
                              </span>
                              <button
                                onClick={() => handleUpdateQuantityAuth(item.id, fullQuantity + 1, "full")}
                                className="text-white font-bold text-lg w-6 h-6 flex items-center justify-center"
                              >
                                +
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : item.isCountable ? (
                      // Quantity selector for breads (starts from 1)
                      regularQuantity === 0 ? (
                        <div className="flex items-center gap-3 bg-[#F5F5F5] rounded-lg px-3 py-2 w-fit">
                          <button
                            onClick={() => handleUpdateQuantityAuth(item.id, 1)}
                            className="text-[#1A1A1A] font-bold text-xl w-6 h-6 flex items-center justify-center"
                            disabled
                          >
                            −
                          </button>
                          <span className="text-[#1A1A1A] font-semibold w-8 text-center">
                            1
                          </span>
                          <button
                            onClick={() => handleAddToCartAuth({ id: item.id, name: item.name, price: item.price })}
                            className="text-[#FF0031] font-bold text-xl w-6 h-6 flex items-center justify-center"
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 bg-[#FF0031] rounded-lg px-3 py-2 w-fit">
                          <button
                            onClick={() => updateQuantity(item.id, regularQuantity - 1)}
                            className="text-white font-bold text-xl w-6 h-6 flex items-center justify-center"
                          >
                            −
                          </button>
                          <span className="text-white font-semibold w-8 text-center">
                            {regularQuantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, regularQuantity + 1)}
                            className="text-white font-bold text-xl w-6 h-6 flex items-center justify-center"
                          >
                            +
                          </button>
                        </div>
                      )
                    ) : (
                      // Regular add/quantity buttons
                      regularQuantity === 0 ? (
                        <button
                          onClick={() => handleAddToCartAuth({ id: item.id, name: item.name, price: item.price })}
                          className="px-8 py-2 bg-[#FF0031] text-white rounded-lg font-medium hover:bg-[#E5002C] transition-colors"
                        >
                          Add
                        </button>
                      ) : (
                        <div className="flex items-center gap-3 bg-[#FF0031] rounded-lg px-3 py-2 w-fit">
                          <button
                            onClick={() => updateQuantity(item.id, regularQuantity - 1)}
                            className="text-white font-bold text-xl w-6 h-6 flex items-center justify-center"
                          >
                            −
                          </button>
                          <span className="text-white font-semibold w-6 text-center">
                            {regularQuantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, regularQuantity + 1)}
                            className="text-white font-bold text-xl w-6 h-6 flex items-center justify-center"
                          >
                            +
                          </button>
                        </div>
                      )
                    )}
                  </div>

                  <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cart Button */}
      {getTotalItems() > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-20 bg-transparent pb-6">
          <div className="w-full max-w-7xl mx-auto px-6 md:px-12 flex justify-end">
            <button
              onClick={() => navigate("/cart")}
              className="w-full md:w-auto md:min-w-[300px] bg-[#FF0031] text-white rounded-xl py-4 px-6 flex items-center justify-between shadow-lg hover:bg-[#E5002C] transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="bg-white text-[#FF0031] rounded-lg px-3 py-1 font-semibold">
                  {getTotalItems()}
                </div>
                <span className="font-medium">View Cart</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">₹{getTotalPrice()}</span>
                <ShoppingCart size={20} />
              </div>
            </button>
          </div>
        </div>
      )}

      {/* PDF Modal */}
      {showPdfModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-[#1A1A1A]">
                {restaurant?.name} Menu
              </h2>
              <button
                onClick={() => setShowPdfModal(false)}
                className="p-2 hover:bg-[#F5F5F5] rounded-lg transition-colors"
              >
                <X size={24} className="text-[#1A1A1A]" />
              </button>
            </div>
            <div className="flex-1 overflow-auto">
              <iframe
                src="https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
                className="w-full h-full"
                title="Restaurant Menu PDF"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}