import { useState } from 'react';
import { Utensils, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Login({ onLogin, authError }: { onLogin: () => void; authError?: string | null }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
    }
    setLoading(false);
  };

  return (
    <div className="login-container" style={{ backgroundColor: '#FFFFFF', color: '#1A1A1A' }}>
      <div className="login-mesh" style={{ opacity: 0.05 }} />
      <div className="login-card glass-effect" style={{ maxWidth: '440px', backgroundColor: '#FFFFFF', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}>
        <div className="login-logo-container">
          <div className="logo-icon-wrapper">
            <img src="/favicon.svg" alt="itFood Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '10px' }} />
          </div>
        </div>
        <h2 className="login-heading" style={{ color: '#000000' }}>Welcome Back</h2>
        <p className="login-subheading">
          Sign in to manage your restaurant orders, menu, and staff.
        </p>

        {/* Email / Password Form */}
        <form onSubmit={handleEmailLogin} className="admin-form" style={{ textAlign: 'left' }}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              required
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p style={{ color: 'var(--danger)', marginBottom: '0.5rem' }}>{error}</p>}
          <button type="submit" disabled={loading} className="btn btn-primary premium-btn" style={{ width: '100%', marginTop: '1rem', height: '3.5rem' }}>
            {loading ? <Loader2 size={18} /> : 'Login with Email'}
          </button>
        </form>

        <hr style={{ margin: '2rem 0', borderColor: 'rgba(255,255,255,0.1)' }} />
        {/* Google Login */}
        {(authError) && <p style={{ color: '#FCA5A5', marginBottom: '0.75rem', fontSize: '0.875rem' }}>{authError}</p>}
        
        <button onClick={onLogin} className="google-btn premium-btn" style={{ width: '100%', height: '3.5rem', backgroundColor: '#FFFFFF', color: '#1A1A1A', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', borderRadius: '12px' }}>
          <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
            <path d="M19.9895 10.1871C19.9895 9.36767 19.9214 8.76973 19.7742 8.14966H10.1992V11.848H15.8195C15.7062 12.7671 15.0943 14.1512 13.7346 15.0813L13.7155 15.2051L16.7429 17.4969L16.9527 17.5174C18.879 15.7789 19.9895 13.221 19.9895 10.1871Z" fill="#4285F4" />
            <path d="M10.1993 19.9313C12.9527 19.9313 15.2643 19.0454 16.9527 17.5174L13.7346 15.0813C12.8734 15.6682 11.7176 16.0779 10.1993 16.0779C7.50243 16.0779 5.21352 14.3395 4.39759 11.9366L4.27799 11.9466L1.13003 14.3273L1.08887 14.4391C2.76588 17.6945 6.21061 19.9313 10.1993 19.9313Z" fill="#34A853" />
            <path d="M4.39748 11.9366C4.18219 11.3166 4.05759 10.6521 4.05759 9.96565C4.05759 9.27909 4.18219 8.61473 4.38615 7.99466L4.38045 7.8626L1.19304 5.44366L1.08875 5.49214C0.397576 6.84305 0.000976562 8.36008 0.000976562 9.96565C0.000976562 11.5712 0.397576 13.0882 1.08875 14.4391L4.39748 11.9366Z" fill="#FBBC05" />
            <path d="M10.1993 3.85336C12.1142 3.85336 13.406 4.66168 14.1425 5.33717L17.0207 2.59107C15.253 0.985496 12.9527 0 10.1993 0C6.2106 0 2.76588 2.23672 1.08887 5.49214L4.38626 7.99466C5.21352 5.59183 7.50242 3.85336 10.1993 3.85336Z" fill="#EB4335" />
          </svg>
          <span>Continue with Google</span>
        </button>


        <div className="login-footer">
          <p>Secure access for authorized personnel only.</p>
        </div>
      </div>
    </div>
  );
}
