import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingBag, BookOpen, Store, BarChart2,
  Users, LogOut, Utensils, Bell, Package, Clock,
  RefreshCw, Check, X, Plus, Edit2, Trash2, Save, IndianRupee, Menu
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet icon issue in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function isRestaurantProfileComplete(restaurant: any) {
  if (!restaurant) return false;
  return Boolean(
    String(restaurant.name || '').trim() &&
    String(restaurant.cuisine || '').trim() &&
    String(restaurant.location || '').trim() &&
    String(restaurant.phone || '').trim() &&
    String(restaurant.opening_hours || '').trim() &&
    String(restaurant.prep_time || '').trim()
  );
}

export default function Dashboard({ session: _session, profile, onSignOut }: { session: any, profile: any, onSignOut: () => Promise<any> | void }) {
  const userId = _session?.user?.id || null;
  const [orders, setOrders] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [restaurant, setRestaurant] = useState<any>(null);
  const [restaurantLoading, setRestaurantLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  // default to dashboard if root
  const currentPath = location.pathname.split('/')[1] || 'dashboard';

  useEffect(() => {
    fetchRestaurantData();
  }, []);

  useEffect(() => {
    if (restaurant?.id) {
      fetchOrders(restaurant.id);
      fetchMenu(restaurant.id);
    }
  }, [restaurant?.id]);

  useEffect(() => {
    if (!restaurantLoading && !isRestaurantProfileComplete(restaurant) && currentPath !== 'restaurants') {
      navigate('/restaurants', { replace: true });
    }
  }, [restaurantLoading, restaurant, currentPath, navigate]);

  async function fetchOrders(restId?: string) {
    const targetId = restId || restaurant?.id;
    if (!targetId) return;
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('restaurant_id', targetId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err: any) {
      console.error('Error fetching orders:', err);
    }
  }

  async function fetchMenu(restId?: string) {
    const targetId = restId || restaurant?.id;
    if (!targetId) return;
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('restaurant_id', targetId)
        .order('name');

      if (error) throw error;
      setMenuItems(data || []);
    } catch (err: any) {
      console.error('Error fetching menu:', err);
    }
  }

  async function fetchRestaurantData() {
    try {
      let data: any = null;
      let error: any = null;

      if (userId) {
        const byOwner = await supabase
          .from('restaurants')
          .select('*')
          .eq('owner_id', userId)
          .limit(1)
          .maybeSingle();
        data = byOwner.data;
        error = byOwner.error;
      } else {
        const fallback = await supabase
          .from('restaurants')
          .select('*')
          .limit(1)
          .maybeSingle();
        data = fallback.data;
        error = fallback.error;
      }

      if (error) throw error;
      const nextRestaurant = data || null;
      setRestaurant(nextRestaurant);
      return nextRestaurant;
    } catch (err: any) {
      console.error('Error fetching restaurant:', err);
      return null;
    } finally {
      setRestaurantLoading(false);
    }
  }

  return (
    <div className="dashboard-layout">
      <div className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)}></div>
      <Sidebar
        currentView={currentPath}
        setView={(v) => { navigate(v === 'dashboard' ? '/' : `/${v}`); setSidebarOpen(false); }}
        onSignOut={onSignOut}
        isOpen={sidebarOpen}
      />
      <main className="main-content">
        <Header
          viewTitle={currentPath}
          userProfile={profile}
          onMenuClick={() => setSidebarOpen(true)}
          onSignOut={onSignOut}
        />

        <Routes>
          <Route path="/" element={<DashboardView orders={orders} fetchOrders={fetchOrders} />} />
          <Route path="/orders" element={<OrdersView orders={orders} fetchOrders={fetchOrders} />} />
          <Route path="/menu" element={<MenuManagementView menuItems={menuItems} fetchMenu={fetchMenu} restaurantId={restaurant?.id} />} />
          <Route path="/restaurants" element={<SettingsView restaurant={restaurant} fetchRestaurant={fetchRestaurantData} onProfileCompleted={() => navigate('/', { replace: true })} />} />
          <Route path="/analytics" element={<AnalyticsView orders={orders} />} />
        </Routes>
      </main>
    </div>
  );
}


function Sidebar({ currentView, setView, onSignOut, isOpen }: { currentView: string, setView: (v: string) => void, onSignOut: () => void, isOpen: boolean }) {
  const links: { id: string, icon: any, label: string }[] = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'orders', icon: ShoppingBag, label: 'Orders' },
    { id: 'menu', icon: BookOpen, label: 'Menu Management' },
    { id: 'restaurants', icon: Store, label: 'Restaurants' },
    { id: 'analytics', icon: BarChart2, label: 'Analytics' },
  ];

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="logo">
        <Utensils />
        <span>QuickBite</span>
      </div>
      <ul className="nav-links">
        {links.map(link => (
          <li key={link.id} className="nav-item">
            <button
              onClick={() => setView(link.id)}
              className={`nav-link ${currentView === link.id ? 'active' : ''}`}
            >
              <link.icon size={20} />
              <span>{link.label}</span>
            </button>
          </li>
        ))}
      </ul>
      <ul className="nav-links" style={{ marginTop: 'auto', flex: 0 }}>
        <li className="nav-item">
          <button onClick={onSignOut} className="nav-link logout-link">
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </li>
      </ul>
    </aside>
  );
}

function Header({ viewTitle, userProfile, onMenuClick, onSignOut }: { viewTitle: string, userProfile: any, onMenuClick: () => void, onSignOut: () => void }) {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const titles: Record<string, string> = {
    dashboard: 'Dashboard Overview',
    orders: 'Orders Management',
    menu: 'Menu Management',
    restaurants: 'Restaurant Settings',
    analytics: 'Analytics & Reports'
  };

  return (
    <header>
      <div className="header-left">
        <button className="menu-toggle" onClick={onMenuClick}>
          <Menu size={24} />
        </button>
        <div className="header-title">
          <h1>{titles[viewTitle] || 'Dashboard'}</h1>
          <p className="welcome-text">Welcome back, Admin</p>
        </div>
      </div>
      <div className="user-profile">
        <div className="notifications hide-mobile">
          <button className="btn btn-ghost">
            <Bell size={20} />
          </button>
        </div>
        <div style={{ position: 'relative' }}>
          <button
            className="avatar"
            onClick={() => setProfileMenuOpen(prev => !prev)}
            style={{ border: 'none', cursor: 'pointer', padding: 0 }}
          >
            {userProfile?.avatar_url ? <img src={userProfile.avatar_url} style={{ width: '100%', height: '100%', borderRadius: '50%' }} /> : 'AD'}
          </button>
          {profileMenuOpen && (
            <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, minWidth: '150px', background: 'white', border: '1px solid #E2E8F0', borderRadius: '0.75rem', boxShadow: '0 10px 25px rgba(0,0,0,0.08)', zIndex: 100 }}>
              <button
                onClick={() => {
                  setProfileMenuOpen(false);
                  onSignOut();
                }}
                style={{ width: '100%', padding: '0.75rem 1rem', textAlign: 'left', background: 'transparent', border: 'none', color: '#DC2626', fontWeight: 600, cursor: 'pointer' }}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

// Data Views
function DashboardView({ orders, fetchOrders }: { orders: any[], fetchOrders: () => void }) {
  const [otpSearch, setOtpSearch] = useState('');
  const totalRevenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
  const pendingCount = orders.filter(o => o.status === 'pending').length;

  const confirmedOrders = orders.filter(o => o.status === 'confirmed');
  const filteredConfirmedOrders = otpSearch.trim()
    ? confirmedOrders.filter(o => o.otp && o.otp.includes(otpSearch.trim()))
    : confirmedOrders;

  return (
    <div className="dashboard-view-container animate-fade-in">
      <div className="stats-grid premium">
        <StatCard
          icon={Package}
          gradient="linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)"
          color="#ffffff"
          title="Total Orders"
          value={orders.length}
        />
        <StatCard
          icon={IndianRupee}
          gradient="linear-gradient(135deg, #10B981 0%, #059669 100%)"
          color="#ffffff"
          title="Total Revenue"
          value={`₹${totalRevenue.toLocaleString()}`}
        />
        <StatCard
          icon={Clock}
          gradient="linear-gradient(135deg, #F59E0B 0%, #D97706 100%)"
          color="#ffffff"
          title="Pending Orders"
          value={pendingCount}
        />
      </div>

      <div className="content-card premium-card" style={{ marginBottom: '2rem', border: '1px solid #10B981' }}>
        <div className="card-header modern" style={{ flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ flex: '1 1 auto' }}>
            <h2 className="text-lg font-bold" style={{ color: '#059669' }}>Confirmed Orders</h2>
            <p className="text-muted text-sm">Awaiting OTP verification from customer</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Search by OTP..."
              value={otpSearch}
              onChange={(e) => setOtpSearch(e.target.value.replace(/\D/g, '').slice(0, 6))}
              style={{
                padding: '0.6rem 1rem',
                borderRadius: '0.5rem',
                border: '1px solid #10B981',
                outline: 'none',
                width: '180px',
                letterSpacing: otpSearch ? '0.2em' : 'normal',
                fontFamily: otpSearch ? 'monospace' : 'inherit'
              }}
            />
            <button className="btn btn-primary premium-hover" style={{ background: '#10B981', color: 'white' }} onClick={fetchOrders}>
              <RefreshCw size={16} /> Refresh
            </button>
          </div>
        </div>
        <OrdersTable orders={filteredConfirmedOrders} onUpdate={fetchOrders} />
      </div>

      <div className="content-card premium-card">
        <div className="card-header modern">
          <div>
            <h2 className="text-lg font-bold">Recent Orders</h2>
            <p className="text-muted text-sm">Real-time order tracking</p>
          </div>
          <button className="btn btn-primary premium-hover" onClick={fetchOrders}>
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
        <OrdersTable orders={orders.slice(0, 5)} onUpdate={fetchOrders} />
      </div>
    </div>
  );
}

function OrdersView({ orders, fetchOrders }: { orders: any[], fetchOrders: () => void }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredOrders = orders.filter(order => {
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesSearch = !searchQuery.trim() ||
      order.id.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
      (order.otp && order.otp.includes(searchQuery.trim()));
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="animate-fade-in">
      <div className="content-card premium-card">
        <div className="card-header modern" style={{ paddingBottom: '1.5rem' }}>
          <div>
            <h2 className="text-lg font-bold">All Orders</h2>
            <p className="text-muted text-sm">Full order history and status</p>
          </div>
          <button className="btn btn-primary premium-hover" onClick={fetchOrders}>
            <RefreshCw size={16} /> Refresh
          </button>
        </div>

        <div className="filters-bar" style={{ display: 'flex', gap: '1rem', padding: '0 1.5rem 1.5rem 1.5rem', flexWrap: 'wrap' }}>
          <div className="search-wrapper" style={{ flex: 1, minWidth: '300px', position: 'relative' }}>
            <input
              type="text"
              placeholder="Search by Order ID or OTP..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.75rem', border: '1px solid #E2E8F0', outline: 'none' }}
            />
          </div>
          <div className="category-filters" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`btn ${statusFilter === status ? 'btn-primary' : ''}`}
                style={{
                  textTransform: 'capitalize',
                  padding: '0.75rem 1rem',
                  background: statusFilter === status ? 'var(--primary)' : 'white',
                  border: '1px solid #E2E8F0',
                  color: statusFilter === status ? 'white' : 'var(--text-main)'
                }}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        <OrdersTable orders={filteredOrders} onUpdate={fetchOrders} />
      </div>
    </div>
  );
}

function OrdersTable({ orders, onUpdate }: { orders: any[], onUpdate: () => void }) {
  const [verifyingOrder, setVerifyingOrder] = useState<any>(null);
  const [viewingOrder, setViewingOrder] = useState<any>(null);

  const getCustomerName = (order: any) =>
    order.customer_name || order.customer_full_name || order.full_name || order.name || 'Guest User';
  const getCustomerPhone = (order: any) =>
    order.customer_phone || order.phone || order.mobile || order.contact_phone || 'Not provided';
  const getExpectedTime = (order: any) => order.arrival_time || order.booking_time || null;
  const getPeopleCount = (order: any) => order.number_of_people ?? order.people_count ?? order.guests ?? null;

  async function updateStatus(id: string, status: string) {
    const { error } = await supabase.from('orders').update({ status }).eq('id', id);
    if (!error) onUpdate();
  }

  return (
    <div>
      <div className="table-responsive order-table-desktop">
        <table className="modern-table">
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Customer</th>
            <th>Type</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Date & Time</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.length === 0 ? (
            <tr>
              <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                No orders found
              </td>
            </tr>
          ) : orders.map((order, idx) => (
            <tr
              key={order.id}
              style={{ animationDelay: `${idx * 0.05}s`, cursor: 'pointer' }}
              className="table-row-animate hover-row"
              onClick={() => setViewingOrder(order)}
            >
              <td className="font-medium text-main">#{order.id.slice(0, 8).toUpperCase()}</td>
              <td>
                <div className="customer-cell">
                  <div className="customer-avatar">G</div>
                  <div className="customer-info">
                    <span className="customer-name">Guest User</span>
                    <span className="customer-id">ID: {order.id.slice(0, 4)}</span>
                  </div>
                </div>
              </td>
              <td>
                <span className="type-badge">
                  {order.order_type === 'pre-booking' ? 'Pre Booking' : order.order_type}
                </span>
              </td>
              <td className="font-bold">₹{order.total_amount}</td>
              <td><span className={`modern-badge status-${order.status || 'pending'}`}>{order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : 'Pending'}</span></td>
              <td className="text-muted">
                <div style={{ fontWeight: 500 }}>{new Date(order.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                <div style={{ fontSize: '0.8rem', marginTop: '0.2rem', color: '#94A3B8' }}>{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
              </td>
              <td>
                <div className="action-buttons" onClick={e => e.stopPropagation()}>
                  {(!order.status || order.status === 'pending') && (
                    <>
                      <button className="action-btn success tooltip" data-tip="Confirm" onClick={() => updateStatus(order.id, 'confirmed')}><Check size={16} /></button>
                      <button className="action-btn danger tooltip" data-tip="Cancel" onClick={() => updateStatus(order.id, 'cancelled')}><X size={16} /></button>
                    </>
                  )}
                  {order.status === 'confirmed' && (
                    <button className="btn btn-primary premium-hover" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', borderRadius: '0.5rem' }} onClick={() => setVerifyingOrder(order)}>
                      Verify & Complete
                    </button>
                  )}
                  {order.status === 'completed' && order.otp_verified_at && (
                    <span className="text-muted" style={{ fontSize: '0.75rem', display: 'block', marginTop: '0.2rem' }}>
                      Verified: {new Date(order.otp_verified_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
        </table>
      </div>

      <div className="order-cards-mobile">
        {orders.length === 0 ? (
          <div className="content-card" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
            No orders found
          </div>
        ) : orders.map((order, idx) => {
          const orderType = String(order.order_type || '').toLowerCase();
          const isDineIn = orderType === 'dine-in';
          const expectedTime = getExpectedTime(order);
          const people = getPeopleCount(order);

          return (
            <div key={order.id} className="content-card premium-card table-row-animate" style={{ animationDelay: `${idx * 0.05}s`, marginBottom: '0.9rem', padding: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                <p className="font-medium text-main">#{order.id.slice(0, 8).toUpperCase()}</p>
                <span className={`modern-badge status-${order.status || 'pending'}`}>{order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : 'Pending'}</span>
              </div>
              <div style={{ display: 'grid', gap: '0.35rem', fontSize: '0.85rem' }}>
                <div><strong>Customer:</strong> {getCustomerName(order)}</div>
                <div><strong>Phone:</strong> {getCustomerPhone(order)}</div>
                <div><strong>Type:</strong> {order.order_type === 'pre-booking' ? 'Pre Booking' : order.order_type}</div>
                <div><strong>Amount:</strong> ₹{order.total_amount}</div>
                {expectedTime && <div><strong>Expected Time:</strong> {expectedTime}</div>}
                {isDineIn && <div><strong>Persons:</strong> {people || 'Not provided'}</div>}
                <div><strong>Date:</strong> {new Date(order.created_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</div>
              </div>
              <div className="action-buttons" style={{ marginTop: '0.8rem' }}>
                {(!order.status || order.status === 'pending') && (
                  <>
                    <button className="action-btn success tooltip" data-tip="Confirm" onClick={() => updateStatus(order.id, 'confirmed')}><Check size={16} /></button>
                    <button className="action-btn danger tooltip" data-tip="Cancel" onClick={() => updateStatus(order.id, 'cancelled')}><X size={16} /></button>
                  </>
                )}
                {order.status === 'confirmed' && (
                  <button className="btn btn-primary premium-hover" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', borderRadius: '0.5rem' }} onClick={() => setVerifyingOrder(order)}>
                    Verify & Complete
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {verifyingOrder && (
        <OtpVerifyModal
          order={verifyingOrder}
          onClose={() => setVerifyingOrder(null)}
          onSuccess={() => { setVerifyingOrder(null); onUpdate(); }}
        />
      )}

      {viewingOrder && (
        <OrderDetailsModal
          order={viewingOrder}
          onClose={() => setViewingOrder(null)}
        />
      )}
    </div>
  );
}

function OrderDetailsModal({ order, onClose }: { order: any, onClose: () => void }) {
  const [items, setItems] = useState<any[]>([]);
  const [customerProfile, setCustomerProfile] = useState<any>(null);
  const [customerLoading, setCustomerLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const orderType = String(order.order_type || '').toLowerCase();
  const isDineIn = orderType === 'dine-in';
  const isPreBookingOrTakeaway = orderType === 'pre-booking' || orderType === 'takeaway';
  const peopleCount = order.number_of_people ?? order.people_count ?? order.guests ?? null;
  const expectedTime = order.arrival_time || order.booking_time || null;
  const reservationDate = order.reservation_date || order.booking_date || null;
  const customerName =
    order.customer_name ||
    order.customer_full_name ||
    order.full_name ||
    order.name ||
    customerProfile?.full_name ||
    'Guest User';
  const customerPhone =
    order.customer_phone ||
    order.phone ||
    order.mobile ||
    order.contact_phone ||
    customerProfile?.phone ||
    'Not provided';

  useEffect(() => {
    async function fetchCustomerProfile() {
      const uid = order.user_uid || order.user_id;
      if (!uid) return;
      setCustomerLoading(true);
      try {
        const { data: userProfileData } = await supabase
          .from('userProfile')
          .select('full_name, phone')
          .eq('id', uid)
          .maybeSingle();
        if (userProfileData && (userProfileData.full_name || userProfileData.phone)) {
          setCustomerProfile(userProfileData);
          return;
        }

        const { data: profilesData } = await supabase
          .from('profiles')
          .select('full_name, phone')
          .eq('id', uid)
          .maybeSingle();
        if (profilesData) {
          setCustomerProfile(profilesData);
        }
      } catch (err) {
        console.error('Error fetching customer profile:', err);
      } finally {
        setCustomerLoading(false);
      }
    }

    async function fetchItems() {
      try {
        const { data, error } = await supabase
          .from('order_items')
          .select(`
            id, quantity, portion,
            menu_items (name, image, price, half_price, full_price)
          `)
          .eq('order_id', order.id);

        if (!error && data) {
          setItems(data);
        }
      } catch (err) {
        console.error('Error fetching order items:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchCustomerProfile();
    fetchItems();
  }, [order.id]);

  return (
    <div className="modal" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
      <div className="modal-content" style={{ maxWidth: '600px', width: '90%', maxHeight: '90vh', overflowY: 'auto', padding: '0' }}>
        <div className="modal-header" style={{ padding: '1.5rem', borderBottom: '1px solid #E2E8F0', position: 'sticky', top: 0, background: 'white', zIndex: 10 }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Order #{order.id.slice(0, 8).toUpperCase()}
              <span className={`modern-badge status-${order.status || 'pending'}`} style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}>
                {order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : 'Pending'}
              </span>
            </h2>
            <p className="text-muted text-sm mt-1">
              {new Date(order.created_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
            </p>
          </div>
          <button className="btn-close" onClick={onClose}><X /></button>
        </div>

        <div style={{ padding: '1.5rem' }}>
          <div className="responsive-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem', background: '#F8FAFC', padding: '1rem', borderRadius: '0.75rem' }}>
            <div>
              <p className="text-muted text-xs uppercase tracking-wider mb-1">Order Type</p>
              <p className="font-semibold text-main capitalize">{order.order_type === 'pre-booking' ? 'Pre Booking' : order.order_type}</p>
            </div>
            <div>
              <p className="text-muted text-xs uppercase tracking-wider mb-1">Total Amount</p>
              <p className="font-bold text-[#10B981] text-lg">₹{order.total_amount}</p>
            </div>
            <div>
              <p className="text-muted text-xs uppercase tracking-wider mb-1">Customer Name</p>
              <p className="font-medium text-main">
                {customerLoading ? 'Loading...' : customerName}
              </p>
            </div>
            <div>
              <p className="text-muted text-xs uppercase tracking-wider mb-1">Customer Phone</p>
              <p className="font-medium text-main">
                {customerLoading ? 'Loading...' : customerPhone}
              </p>
            </div>
            {isPreBookingOrTakeaway && (
              <div style={{ gridColumn: '1 / -1' }}>
                <p className="text-muted text-xs uppercase tracking-wider mb-1">Expected Time</p>
                <p className="font-medium text-main">{expectedTime || 'Not provided'}</p>
              </div>
            )}
            {isDineIn && (
              <>
                <div>
                  <p className="text-muted text-xs uppercase tracking-wider mb-1">Number of Persons</p>
                  <p className="font-medium text-main">{peopleCount || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-muted text-xs uppercase tracking-wider mb-1">Expected Time</p>
                  <p className="font-medium text-main">{expectedTime || 'Not provided'}</p>
                </div>
                {reservationDate && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <p className="text-muted text-xs uppercase tracking-wider mb-1">Reservation Date</p>
                    <p className="font-medium text-main">{new Date(reservationDate).toLocaleDateString()}</p>
                  </div>
                )}
              </>
            )}
          </div>

          <h3 className="font-bold text-main mb-4">Order Items</h3>

          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>Loading items...</div>
          ) : items.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#64748B', background: '#F8FAFC', borderRadius: '0.75rem' }}>No items found for this order.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {items.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', border: '1px solid #E2E8F0', borderRadius: '0.75rem' }}>
                  <div style={{ width: '60px', height: '60px', borderRadius: '0.5rem', overflow: 'hidden', background: '#F1F5F9', flexShrink: 0 }}>
                    {item.menu_items?.image ? (
                      <img src={item.menu_items.image} alt={item.menu_items.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}>No Img</div>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <h4 className="font-bold text-main" style={{ fontSize: '1rem', margin: 0 }}>{item.menu_items?.name || 'Unknown Item'}</h4>
                      <span className="font-bold text-main">
                        ₹{item.portion === 'half' ? item.menu_items?.half_price : item.portion === 'full' ? item.menu_items?.full_price : item.menu_items?.price}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
                      <span className="text-muted text-sm">Qty: {item.quantity}</span>
                      <span className="text-muted text-sm font-medium">Subtotal: ₹{(item.portion === 'half' ? item.menu_items?.half_price : item.portion === 'full' ? item.menu_items?.full_price : item.menu_items?.price) * item.quantity}</span>
                    </div>
                    {item.portion && (
                      <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: '#F1F5F9', color: '#475569', borderRadius: '0.25rem', fontSize: '0.8rem', textTransform: 'capitalize' }}>
                        <strong>Portion:</strong> {item.portion}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function OtpVerifyModal({ order, onClose, onSuccess }: { order: any, onClose: () => void, onSuccess: () => void }) {
  const [otpInput, setOtpInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (otpInput.length !== 6) {
      setError('Please enter a 6-digit OTP');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', order.id)
        .eq('otp', otpInput)
        .single();

      if (fetchError || !data) {
        setError("Invalid OTP. Please check with the customer.");
        setLoading(false);
        return;
      }

      if (data.otp_expires_at && new Date(data.otp_expires_at) < new Date()) {
        setError("OTP has expired. Ask customer to regenerate.");
        setLoading(false);
        return;
      }

      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'completed',
          otp_verified_at: new Date().toISOString()
        })
        .eq('id', order.id);

      if (updateError) throw updateError;

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to verify OTP');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center', padding: '0' }}>
        <div className="modal-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
          <h2 style={{ fontSize: '1.25rem' }}>Verify Order OTP</h2>
          <button className="btn-close" onClick={onClose}><X /></button>
        </div>
        <form onSubmit={handleVerify} style={{ padding: '1.5rem 2rem' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            Enter the 6-digit OTP provided by the customer to complete order #{order.id.slice(0, 8).toUpperCase()}
          </p>

          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={otpInput}
            onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
            autoFocus
            style={{
              width: '100%',
              textAlign: 'center',
              fontSize: '2rem',
              letterSpacing: '0.5em',
              padding: '1rem',
              borderRadius: '0.75rem',
              border: '2px solid #E2E8F0',
              marginBottom: '1rem',
              outline: 'none'
            }}
            placeholder="------"
          />

          {error && <p style={{ color: '#DC2626', fontSize: '0.875rem', marginBottom: '1rem', fontWeight: 500 }}>{error}</p>}

          <button
            type="submit"
            disabled={loading || otpInput.length !== 6}
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.875rem', fontSize: '1rem' }}
          >
            {loading ? 'Verifying...' : 'Verify OTP & Complete Order'}
          </button>
        </form>
      </div>
    </div>
  );
}

function MenuManagementView({ menuItems, fetchMenu, restaurantId }: { menuItems: any[], fetchMenu: () => void, restaurantId?: string }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <>
      <div className="content-card premium-card animate-fade-in">
        <div className="card-header modern" style={{ paddingBottom: '2rem' }}>
          <div>
            <h2 className="text-lg font-bold">Menu Inventory</h2>
            <p className="text-muted text-sm">Manage your restaurant offerings</p>
          </div>
          <button className="btn btn-primary premium-hover" onClick={() => { setEditingItem(null); setModalOpen(true); }}>
            <Plus size={16} /> Add New Item
          </button>
        </div>

        <div className="filters-bar" style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          <div className="search-wrapper" style={{ flex: 1, minWidth: '300px', position: 'relative' }}>
            <input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.75rem', border: '1px solid #E2E8F0', outline: 'none' }}
            />
          </div>
          <div className="category-filters" style={{ display: 'flex', gap: '0.5rem' }}>
            {['all', 'veg', 'non-veg'].map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`btn ${selectedCategory === cat ? 'btn-primary' : ''}`}
                style={{ textTransform: 'capitalize', padding: '0.75rem 1.5rem', background: selectedCategory === cat ? 'var(--primary)' : 'white', border: '1px solid #E2E8F0', color: selectedCategory === cat ? 'white' : 'var(--text-main)' }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="table-responsive">
          <table className="modern-table">
            <thead>
              <tr>
                <th>Item Details</th>
                <th>Category</th>
                <th>Food Type</th>
                <th>Price</th>
                <th>Portions</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                    No menu items found.
                  </td>
                </tr>
              ) : filteredItems.map((item, idx) => (
                <tr key={item.id} style={{ animationDelay: `${idx * 0.03}s` }} className="table-row-animate">
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: '56px', height: '56px', borderRadius: '0.75rem', overflow: 'hidden', background: '#f1f5f9' }}>
                        <img src={item.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      <div>
                        <p style={{ fontWeight: '700', color: 'var(--text-main)' }}>{item.name}</p>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.description}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`modern-badge ${item.category === 'veg' ? 'status-confirmed' : 'status-cancelled'}`} style={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>
                      {item.category}
                    </span>
                  </td>
                  <td>
                    <span className="text-muted" style={{ textTransform: 'capitalize' }}>{item.food_type}</span>
                  </td>
                  <td style={{ fontWeight: '700' }}>
                    {item.has_portions ? (
                      <div style={{ fontSize: '0.85rem' }}>
                        <div>H: ₹{item.half_price}</div>
                        <div>F: ₹{item.full_price}</div>
                      </div>
                    ) : `₹${item.price}`}
                  </td>
                  <td>
                    <span className={`modern-badge ${item.has_portions ? 'status-preparing' : 'status-pending'}`}>
                      {item.has_portions ? 'Enabled' : 'Disabled'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="action-btn success tooltip" data-tip="Edit" onClick={() => { setEditingItem(item); setModalOpen(true); }}><Edit2 size={16} /></button>
                      <button className="action-btn danger tooltip" data-tip="Delete" onClick={() => deleteItem(item.id)}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <MenuModal
          item={editingItem}
          restaurantId={restaurantId}
          onClose={() => setModalOpen(false)}
          onSave={() => { setModalOpen(false); fetchMenu(); }}
        />
      )}
    </>
  );

  async function deleteItem(id: string) {
    if (!confirm('Delete this item?')) return;
    const { error } = await supabase.from('menu_items').delete().eq('id', id);
    if (!error) fetchMenu();
  }
}



function AnalyticsView({ orders }: { orders: any[] }) {
  const totalRevenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
  const avgOrderValue = orders.length > 0 ? (totalRevenue / orders.length).toFixed(2) : 0;

  return (
    <div className="animate-fade-in">
      <div className="stats-grid premium">
        <StatCard icon={IndianRupee} gradient="linear-gradient(135deg, #10B981 0%, #059669 100%)" title="Total Revenue" value={`₹${totalRevenue.toLocaleString()}`} />
        <StatCard icon={ShoppingBag} gradient="linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)" title="Avg Order Value" value={`₹${avgOrderValue}`} />
        <StatCard icon={Users} gradient="linear-gradient(135deg, #F59E0B 0%, #D97706 100%)" title="Total Customers" value={orders.length} />
      </div>
      <div className="content-card" style={{ marginTop: '2rem', padding: '4rem 2rem', textAlign: 'center' }}>
        <BarChart2 size={48} color="var(--primary)" style={{ opacity: 0.2, marginBottom: '1.5rem' }} />
        <h3 style={{ marginBottom: '0.5rem' }}>Analytics charts coming soon</h3>
        <p className="text-muted">Detailed performance metrics and trends will be displayed here.</p>
      </div>
    </div>
  )
}

function SettingsView({ restaurant, fetchRestaurant, onProfileCompleted }: { restaurant: any, fetchRestaurant: () => Promise<any> | void, onProfileCompleted?: () => void }) {
  const [formData, setFormData] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [openTime, setOpenTime] = useState('10:00');
  const [closeTime, setCloseTime] = useState('23:00');
  const [mapPosition, setMapPosition] = useState<any>(null);

  function parseOpeningHours(value: string | null | undefined) {
    const raw = (value || '').trim();
    const match = raw.match(/(\d{1,2}):(\d{2}).*?(\d{1,2}):(\d{2})/);
    if (!match) return { open: '10:00', close: '23:00' };
    return {
      open: `${match[1].padStart(2, '0')}:${match[2]}`,
      close: `${match[3].padStart(2, '0')}:${match[4]}`
    };
  }

  useEffect(() => {
    const base = restaurant || {
      name: '',
      cuisine: '',
      location: '',
      latitude: null,
      longitude: null,
      opening_hours: '',
      phone: '',
      prep_time: '',
      rating: '',
      description: '',
      image: '',
      services: { preBooking: true, takeaway: true, dineIn: true },
    };
    setFormData({ ...base });
    const parsed = parseOpeningHours(base.opening_hours);
    setOpenTime(parsed.open);
    setCloseTime(parsed.close);

    if (base.latitude && base.longitude) {
      setMapPosition({ lat: parseFloat(base.latitude), lng: parseFloat(base.longitude) });
    } else {
      setMapPosition(null);
    }
  }, [restaurant]);

  const handleLocationUpdate = async (lat: number, lng: number) => {
    setFormData((prev: any) => ({ ...prev, latitude: lat, longitude: lng }));
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await response.json();
      if (data && data.display_name) {
        setFormData((prev: any) => ({ ...prev, location: data.display_name, latitude: lat, longitude: lng }));
      }
    } catch (e) {
      console.error("Reverse geocoding failed", e);
    }
  };

  const handleLocateMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setMapPosition({ lat, lng });
          handleLocationUpdate(lat, lng);
        },
        (error) => {
          console.error("Geolocation error:", error);
          alert("Could not get current location. Please allow location access or click on the map.");
        }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  if (!formData) return null;

  return (
    <div className="content-card premium-card animate-fade-in" style={{ maxWidth: '900px', margin: '0 auto', background: 'white', borderRadius: '1.25rem' }}>
      <div className="card-header modern" style={{ background: 'transparent', padding: '2rem 2.5rem', borderBottom: '1px solid #E2E8F0' }}>
        <div>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#1E293B' }}>Restaurant Profile</h2>
          {saveMessage && (
            <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: saveMessage.type === 'success' ? '#059669' : '#DC2626' }}>
              {saveMessage.text}
            </p>
          )}
        </div>
        <button
          className="btn btn-primary premium-hover"
          onClick={handleSave}
          disabled={isSaving}
          style={{ background: '#FC0A3D', color: 'white', opacity: isSaving ? 0.7 : 1, cursor: isSaving ? 'not-allowed' : 'pointer' }}
        >
          <Save size={16} /> {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
      <div className="admin-form" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="form-row">
          <div className="form-group">
            <label>Restaurant Name</label>
            <input value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Cuisine Type</label>
            <input value={formData.cuisine || ''} onChange={e => setFormData({ ...formData, cuisine: e.target.value })} />
          </div>
        </div>
        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <label style={{ margin: 0 }}>Restaurant Location</label>
            <button
              type="button"
              onClick={handleLocateMe}
              className="btn btn-ghost"
              style={{ fontSize: '0.85rem', padding: '0.4rem 0.75rem', color: '#10B981', border: '1px solid #10B981', display: 'flex', alignItems: 'center', gap: '0.4rem', borderRadius: '0.5rem' }}
            >
              📍 Use Current Location
            </button>
          </div>
          <div style={{ height: '300px', width: '100%', borderRadius: '0.75rem', overflow: 'hidden', marginBottom: '1rem', border: '2px solid #E2E8F0', zIndex: 0 }}>
            <MapContainer center={mapPosition || { lat: 20.5937, lng: 78.9629 }} zoom={mapPosition ? 15 : 4} style={{ height: '100%', width: '100%', zIndex: 1 }}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap'
              />
              <MapPanController position={mapPosition} />
              <LocationMarker position={mapPosition} setPosition={setMapPosition} onLocationUpdate={handleLocationUpdate} />
            </MapContainer>
          </div>
          <textarea
            placeholder="Address will auto-fill when you click on the map..."
            value={formData.location || ''}
            onChange={e => setFormData({ ...formData, location: e.target.value })}
            rows={2}
            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #E2E8F0', outline: 'none' }}
          />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Opening Hours</label>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <input type="time" value={openTime} onChange={e => setOpenTime(e.target.value)} />
              <span style={{ color: '#64748B', fontWeight: 600 }}>to</span>
              <input type="time" value={closeTime} onChange={e => setCloseTime(e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label>Contact Phone</label>
            <input value={formData.phone || ''} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Preparation Time</label>
            <input placeholder="20-25 min" value={formData.prep_time || ''} onChange={e => setFormData({ ...formData, prep_time: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Rating (Display only)</label>
            <input readOnly style={{ backgroundColor: '#F8FAFC', color: '#64748B' }} value={formData.rating || ''} />
          </div>
        </div>
        <div className="form-group">
          <label>Restaurant Description</label>
          <textarea value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={4} />
        </div>
        <div className="form-group">
          <label>Cover Image URL</label>
          <input value={formData.image || ''} onChange={e => setFormData({ ...formData, image: e.target.value })} />
        </div>
        <div className="form-group">
          <label style={{ marginBottom: '0.5rem' }}>Enabled Services</label>
          <div className="services-toggles" style={{ display: 'flex', gap: '2rem', background: '#F8FAFC', padding: '1.25rem', borderRadius: '0.75rem' }}>
            <label className="checkbox-label">
              <input type="checkbox" checked={formData.services?.preBooking || false} onChange={e => setFormData({ ...formData, services: { ...formData.services, preBooking: e.target.checked } })} /> Pre-Order
            </label>
            <label className="checkbox-label">
              <input type="checkbox" checked={formData.services?.takeaway || false} onChange={e => setFormData({ ...formData, services: { ...formData.services, takeaway: e.target.checked } })} /> Takeaway
            </label>
            <label className="checkbox-label">
              <input type="checkbox" checked={formData.services?.dineIn || false} onChange={e => setFormData({ ...formData, services: { ...formData.services, dineIn: e.target.checked } })} /> Dine-In
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  async function handleSave() {
    try {
      setIsSaving(true);
      setSaveMessage(null);

      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      // Prepare payload to match database schema
      const submissionData = { ...formData };

      if (userId) {
        submissionData.owner_id = userId;
      }

      // Handle opening hours
      submissionData.opening_hours = `${openTime} - ${closeTime}`;

      // Fix numeric rating (Postgres DECIMAL cannot be "")
      if (submissionData.rating === "" || submissionData.rating === null || submissionData.rating === undefined) {
        submissionData.rating = 5.0; // Default rating
      } else {
        const parsedRating = parseFloat(submissionData.rating);
        submissionData.rating = isNaN(parsedRating) ? 5.0 : parsedRating;
      }

      // Ensure required fields for NOT NULL constraints
      if (!submissionData.image) {
        submissionData.image = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&q=80';
      }

      if (!submissionData.distance) {
        submissionData.distance = '0.5 km';
      }

      const timeoutMs = 15000;
      const withTimeout = <T,>(promise: Promise<T>, label: string) =>
        Promise.race<T>([
          promise,
          new Promise<T>((_, reject) =>
            setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs / 1000}s`)), timeoutMs)
          ),
        ]);

      const isNew = !formData.id;
      const query = isNew
        ? supabase.from('restaurants').insert(submissionData).select('*').single()
        : supabase.from('restaurants').update(submissionData).eq('id', formData.id).select('*').single();

      const { data, error } = await withTimeout(Promise.resolve(query), 'Save request');

      if (error) throw error;
      if (!data) {
        throw new Error('No restaurant row was updated. Check restaurant ID and update permissions (RLS policy).');
      }

      // If this was a new restaurant, link it to the adminProfile
      if (isNew && data.id && userId) {
        const { error: adminProfileError } = await supabase
          .from('adminProfile')
          .update({ restaurant_id: data.id })
          .eq('id', userId);

        if (adminProfileError) {
          const { error: profileError } = await supabase
            .from('profiles')
            .update({ restaurant_id: data.id } as any)
            .eq('id', userId);
          if (profileError) {
            console.error('Failed to link restaurant_id to adminProfile/profiles:', { adminProfileError, profileError });
          }
        }
      }

      setFormData({ ...data });
      await Promise.resolve(fetchRestaurant());
      setSaveMessage({ type: 'success', text: 'Settings saved successfully.' });
      if (isRestaurantProfileComplete(data)) {
        onProfileCompleted?.();
      }
    } catch (err: any) {
      console.error('Error saving restaurant settings:', err);
      const message = String(err?.message || '');
      if (err?.code === '42501' || message.toLowerCase().includes('row-level security')) {
        setSaveMessage({ type: 'error', text: 'Database RLS blocked this action. Apply admin-panel/supabase/admin-panel-rls.sql in Supabase SQL Editor, then try again.' });
      } else
        if (String(err?.message || '').toLowerCase().includes('timed out')) {
          setSaveMessage({ type: 'error', text: 'Save request timed out after 15s. Please check your Supabase network/RLS setup.' });
        } else {
          setSaveMessage({ type: 'error', text: err.message || 'Failed to save settings.' });
        }
    } finally {
      setIsSaving(false);
    }
  }
}

// Utils
function StatCard({ icon: Icon, bg, gradient, color, title, value }: any) {
  return (
    <div className="stat-card premium-stat-card" style={gradient ? { background: gradient, color: 'white' } : {}}>
      <div className="stat-icon premium-stat-icon" style={gradient ? { backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' } : { backgroundColor: bg, color }}>
        <Icon size={24} />
      </div>
      <div className="stat-info">
        <h3 style={gradient ? { color: 'rgba(255,255,255,0.8)' } : {}}>{title}</h3>
        <p style={gradient ? { color: 'white' } : {}}>{value}</p>
      </div>
      {gradient && <div className="stat-card-glow" style={{ background: gradient }}></div>}
    </div>
  );
}

function MenuModal({ item, restaurantId, onClose, onSave }: any) {
  const [formData, setFormData] = useState<any>(item || {
    name: '',
    description: '',
    category: 'veg',
    food_type: 'starter',
    has_portions: false,
    price: 0,
    half_price: 0,
    full_price: 0,
    image: '',
    restaurant_id: restaurantId || null,
    is_countable: true
  });

  async function handleSubmit(e: any) {
    e.preventDefault();
    try {
      const submissionData = { ...formData };
      if (submissionData.has_portions) {
        submissionData.price = null;
      } else {
        submissionData.half_price = null;
        submissionData.full_price = null;
      }

      const result = item
        ? await supabase.from('menu_items').update(submissionData).eq('id', item.id)
        : await supabase.from('menu_items').insert(submissionData);

      if (result.error) {
        console.error('Supabase error:', result.error);
        alert('Error: ' + result.error.message);
      } else {
        onSave();
      }
    } catch (err: any) {
      console.error('Submit error:', err);
      alert('An unexpected error occurred: ' + err.message);
    }
  }

  return (
    <div className="modal" style={{ display: 'flex' }}>
      <div className="modal-content">
        <div className="modal-header">
          <h2>{item ? 'Edit Item' : 'Add Item'}</h2>
          <button className="btn-close" onClick={onClose}><X /></button>
        </div>
        <form onSubmit={handleSubmit} className="admin-form">
          <div className="form-group">
            <label>Name</label>
            <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={2} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Category</label>
              <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                <option value="veg">Veg</option>
                <option value="non-veg">Non-Veg</option>
              </select>
            </div>
            <div className="form-group">
              <label>Type</label>
              <select value={formData.food_type} onChange={e => setFormData({ ...formData, food_type: e.target.value })}>
                <option value="starter">Starter</option>
                <option value="main">Main Course</option>
                <option value="bread">Bread</option>
                <option value="dessert">Dessert</option>
                <option value="beverage">Beverage</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="checkbox-label">
              <input type="checkbox" checked={formData.has_portions} onChange={e => setFormData({ ...formData, has_portions: e.target.checked })} /> Half/Full Portions
            </label>
          </div>
          {!formData.has_portions ? (
            <div className="form-group">
              <label>Price (₹)</label>
              <input type="number" required value={formData.price} onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })} />
            </div>
          ) : (
            <div className="form-row">
              <div className="form-group">
                <label>Half Price (₹)</label>
                <input type="number" required value={formData.half_price} onChange={e => setFormData({ ...formData, half_price: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="form-group">
                <label>Full Price (₹)</label>
                <input type="number" required value={formData.full_price} onChange={e => setFormData({ ...formData, full_price: parseFloat(e.target.value) || 0 })} />
              </div>
            </div>
          )}
          <div className="form-group">
            <label>Image URL</label>
            <input type="url" value={formData.image} onChange={e => setFormData({ ...formData, image: e.target.value })} />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Item</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function LocationMarker({ position, setPosition, onLocationUpdate }: any) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
      onLocationUpdate(e.latlng.lat, e.latlng.lng);
    },
  });

  return position === null ? null : (
    <Marker position={position}></Marker>
  );
}

function MapPanController({ position }: { position: any }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo(position, 16);
    }
  }, [position, map]);
  return null;
}
