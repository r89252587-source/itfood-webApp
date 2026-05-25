import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { supabase } from "@/lib/supabase";
import {
  User,
  MapPin,
  CreditCard,
  Bell,
  HelpCircle,
  FileText,
  Shield,
  LogOut,
  ChevronRight,
  Edit,
  Mail,
  Phone
} from "lucide-react";
import { BottomNav } from "@/app/components/BottomNav";
import { useAuth } from "@/app/context/AuthContext";

export function ProfileScreen() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const [locationLoading, setLocationLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<any>(null);
  const [profileData, setProfileData] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (user) {
      const fetchProfile = async () => {
        const { data } = await supabase.from('userProfile').select('*').eq('id', user.id).single();
        if (data) {
          setProfileData(data);
          setUserLocation(data);
          setEditName(data.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || "");
          setEditPhone(data.phone || "");
        }
      };
      fetchProfile();
    }
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    try {
      await supabase.from('userProfile').update({
        full_name: editName,
        phone: editPhone
      }).eq('id', user.id);
      setProfileData({ ...profileData, full_name: editName, phone: editPhone });
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Failed to save profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  const handleGetLocation = async () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        try {
          // Reverse Geocoding
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
          const data = await response.json();
          const address = data?.display_name || "Unknown Location";

          // Save to Supabase
          if (user) {
            await supabase.from('userProfile').update({
              latitude: lat,
              longitude: lng,
              address: address
            }).eq('id', user.id);
          }

          setUserLocation({ latitude: lat, longitude: lng, address });
        } catch (error) {
          console.error("Error saving location:", error);
          alert("Failed to fetch address details.");
        } finally {
          setLocationLoading(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        alert("Could not get current location. Please allow location access.");
        setLocationLoading(false);
      }
    );
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#FF0031] to-[#E5002C] px-6 pt-12 pb-8 text-white md:px-12 max-w-7xl mx-auto">
        <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-semibold mb-6">My Profile</h1>

        {/* User Info Card */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
              <User size={32} className="text-[#FF0031]" />
            </div>
            <div className="flex-1">
              {isEditing ? (
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-white/20 text-white placeholder:text-white/50 border border-white/30 rounded px-2 py-1 mb-1 outline-none focus:border-white"
                  placeholder="Full Name"
                />
              ) : (
                <h2 className="text-xl font-semibold text-white">
                  {profileData?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || "User"}
                </h2>
              )}
              <p className="text-white/80 text-sm">itFood Member</p>
            </div>
            {isEditing ? (
              <button onClick={handleSaveProfile} disabled={savingProfile} className="px-3 py-1 bg-white text-[#FF0031] rounded-lg font-medium text-sm">
                {savingProfile ? "..." : "Save"}
              </button>
            ) : (
              <button onClick={() => setIsEditing(true)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <Edit size={20} className="text-white" />
              </button>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-3 text-white/90">
              <Mail size={16} />
              <span className="text-sm">{user?.email}</span>
            </div>
            <div className="flex items-center gap-3 text-white/90">
              <Phone size={16} />
              {isEditing ? (
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full bg-white/20 text-white placeholder:text-white/50 border border-white/30 rounded px-2 py-1 outline-none focus:border-white text-sm"
                  placeholder="Phone Number"
                />
              ) : (
                <span className="text-sm">{profileData?.phone || "Not provided"}</span>
              )}
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* Menu Options */}
      <div className="px-6 py-6 space-y-4 max-w-3xl mx-auto md:px-12">
        {/* Account Section */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
          <div className="px-5 py-3 border-b border-gray-100">
            <h3 className="font-semibold text-[#1A1A1A]">Account</h3>
          </div>

          <div className="px-5 py-4 border-b border-gray-100">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-[#F5F5F5] rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <MapPin size={20} className="text-[#FF0031]" />
              </div>
              <div className="text-left flex-1">
                <p className="font-medium text-[#1A1A1A]">My Location</p>
                {userLocation?.address ? (
                  <p className="text-sm text-[#6B6B6B] mt-1 mb-3">{userLocation.address}</p>
                ) : (
                  <p className="text-sm text-[#6B6B6B] mt-1 mb-3">No location saved yet</p>
                )}
                
                <button 
                  onClick={handleGetLocation}
                  disabled={locationLoading}
                  className="w-full py-2.5 bg-blue-50 text-blue-600 rounded-xl text-sm font-medium hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
                >
                  <MapPin size={16} />
                  {locationLoading ? 'Finding you...' : 'Use Current Location'}
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={() => {}}
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-[#F5F5F5] rounded-full flex items-center justify-center">
                <CreditCard size={20} className="text-[#FF0031]" />
              </div>
              <div className="text-left">
                <p className="font-medium text-[#1A1A1A]">Payment Methods</p>
                <p className="text-sm text-[#6B6B6B]">Manage cards and UPI</p>
              </div>
            </div>
            <ChevronRight size={20} className="text-[#6B6B6B]" />
          </button>
        </div>

        {/* Preferences Section */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
          <div className="px-5 py-3 border-b border-gray-100">
            <h3 className="font-semibold text-[#1A1A1A]">Preferences</h3>
          </div>

          <button
            onClick={() => {}}
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-[#F5F5F5] rounded-full flex items-center justify-center">
                <Bell size={20} className="text-[#FF0031]" />
              </div>
              <div className="text-left">
                <p className="font-medium text-[#1A1A1A]">Notifications</p>
                <p className="text-sm text-[#6B6B6B]">Order updates & offers</p>
              </div>
            </div>
            <ChevronRight size={20} className="text-[#6B6B6B]" />
          </button>
        </div>

        {/* Support Section */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
          <div className="px-5 py-3 border-b border-gray-100">
            <h3 className="font-semibold text-[#1A1A1A]">Support & Legal</h3>
          </div>

          <button
            onClick={() => {}}
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors border-b border-gray-100"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-[#F5F5F5] rounded-full flex items-center justify-center">
                <HelpCircle size={20} className="text-[#FF0031]" />
              </div>
              <div className="text-left">
                <p className="font-medium text-[#1A1A1A]">Help & Support</p>
                <p className="text-sm text-[#6B6B6B]">FAQs and contact us</p>
              </div>
            </div>
            <ChevronRight size={20} className="text-[#6B6B6B]" />
          </button>

          <button
            onClick={() => {}}
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors border-b border-gray-100"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-[#F5F5F5] rounded-full flex items-center justify-center">
                <FileText size={20} className="text-[#FF0031]" />
              </div>
              <div className="text-left">
                <p className="font-medium text-[#1A1A1A]">Terms & Conditions</p>
                <p className="text-sm text-[#6B6B6B]">Read our terms</p>
              </div>
            </div>
            <ChevronRight size={20} className="text-[#6B6B6B]" />
          </button>

          <button
            onClick={() => {}}
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-[#F5F5F5] rounded-full flex items-center justify-center">
                <Shield size={20} className="text-[#FF0031]" />
              </div>
              <div className="text-left">
                <p className="font-medium text-[#1A1A1A]">Privacy Policy</p>
                <p className="text-sm text-[#6B6B6B]">Your data protection</p>
              </div>
            </div>
            <ChevronRight size={20} className="text-[#6B6B6B]" />
          </button>
        </div>

        {/* App Info */}
        <div className="bg-white rounded-2xl p-5 shadow-sm text-center">
          <p className="text-sm text-[#6B6B6B] mb-1">itFood Version</p>
          <p className="font-semibold text-[#1A1A1A]">1.0.0</p>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full bg-white rounded-2xl p-5 shadow-sm flex items-center justify-center gap-3 hover:bg-red-50 transition-colors group"
        >
          <LogOut size={20} className="text-[#FF0031]" />
          <span className="font-semibold text-[#FF0031]">Logout</span>
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
