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
    <div className="login-container">
      <div className="login-mesh" />
      <div className="login-card glass-effect" style={{ maxWidth: '440px' }}>
        <div className="login-logo-container">
          <div className="logo-icon-wrapper">
            <Utensils size={36} color="white" />
          </div>
        </div>
        <h2 className="login-heading">Welcome Back</h2>
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
        <button onClick={onLogin} className="google-btn premium-btn" style={{ width: '100%', height: '3.5rem' }}>
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/layout/google.svg" width="22" alt="Google" />
          <span>Continue with Google</span>
        </button>
        <div className="login-footer">
          <p>Secure access for authorized personnel only.</p>
        </div>
      </div>
    </div>
  );
}
