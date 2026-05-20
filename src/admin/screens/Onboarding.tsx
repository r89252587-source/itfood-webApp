import { useState } from 'react';
import { Utensils, Send, MapPin, Phone, Store } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Onboarding({ profile, onComplete }: { profile: any, onComplete: () => void }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    restaurantName: '',
    cuisine: '',
    address: '',
    phone: ''
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { error: profileError } = await supabase
        .from('adminProfile')
        .update({ role: 'pending' } as any)
        .eq('id', profile.id);

      if (profileError) throw profileError;
      
      onComplete();
    } catch (error: any) {
      console.error('Error submitting onboarding:', error);
      alert('Error submitting request: ' + error.message + '\n\nMake sure you have added the "requestforAdmin" (boolean) column to your "profiles" table in Supabase Dashboard.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-container">
      <div className="login-mesh"></div>
      <div className="login-card glass-effect" style={{ maxWidth: '500px' }}>
        <div className="login-logo-container">
          <div className="logo-icon-wrapper">
             <Utensils size={36} color="white" />
          </div>
        </div>
        <h2 className="login-heading">Register Restaurant</h2>
        <p className="login-subheading">
          Please provide your restaurant details to request administrator access.
        </p>

        <form onSubmit={handleSubmit} className="admin-form" style={{ textAlign: 'left' }}>
          <div className="form-group">
            <label><Store size={14} style={{ marginRight: '4px' }} /> Restaurant Name</label>
            <input 
              required 
              placeholder="e.g. Spice Villa"
              value={formData.restaurantName} 
              onChange={e => setFormData({ ...formData, restaurantName: e.target.value })} 
            />
          </div>
          
          <div className="form-group">
            <label>Cuisine Type</label>
            <input 
              required 
              placeholder="e.g. Italian, Indian"
              value={formData.cuisine} 
              onChange={e => setFormData({ ...formData, cuisine: e.target.value })} 
            />
          </div>

          <div className="form-group">
            <label><MapPin size={14} style={{ marginRight: '4px' }} /> Address</label>
            <input 
              required 
              placeholder="Full restaurant address"
              value={formData.address} 
              onChange={e => setFormData({ ...formData, address: e.target.value })} 
            />
          </div>

          <div className="form-group">
            <label><Phone size={14} style={{ marginRight: '4px' }} /> Contact Phone</label>
            <input 
              required 
              type="tel"
              placeholder="Business phone number"
              value={formData.phone} 
              onChange={e => setFormData({ ...formData, phone: e.target.value })} 
            />
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary premium-btn" style={{ width: '100%', marginTop: '1rem', height: '3.5rem' }}>
            {loading ? 'Submitting...' : <><Send size={18} /> Submit for Review</>}
          </button>
        </form>
      </div>
    </div>
  );
}
