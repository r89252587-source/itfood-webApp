import { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import Login from './screens/Login';
import AccountStatus from './screens/AccountStatus';
import Dashboard from './screens/Dashboard';
import Onboarding from './screens/Onboarding';

interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string;
  role: 'pending' | 'admin' | 'rejected';
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  const loadProfile = async (user: User) => {
    try {
      setError(null);
      let { data, error: profileError } = await supabase
        .from('adminProfile')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code === 'PGRST116') {
        // Create new profile if one doesn't exist
        const { data: newProfile, error: createError } = await supabase
          .from('adminProfile')
          .insert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || '',
            avatar_url: user.user_metadata?.avatar_url || '',
            role: 'pending'
          })
          .select('*')
          .single();

        if (createError) throw createError;
        data = newProfile;
      } else if (profileError) {
        throw profileError;
      }

      setProfile(data as Profile);
    } catch (err: any) {
      console.error('Profile error:', err);
      setError(err.message || 'Failed to load user profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session }, error: sessionError }) => {
      if (sessionError) {
        console.error('Session error:', sessionError);
        setError(sessionError.message);
        setLoading(false);
      } else {
        setSession(session);
        if (session) {
          loadProfile(session.user);
        } else {
          setLoading(false);
        }
      }
    });

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        setLoading(true);
        loadProfile(session.user);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loginWithGoogle = async () => {
    setAuthError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) setAuthError(error.message);
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      setSession(null);
      setProfile(null);
    } catch (err) {
      console.error('Error during sign out:', err);
    } finally {
      setLoading(false);
    }
  };

  const onOnboardingComplete = async () => {
    if (session) {
      setLoading(true);
      await loadProfile(session.user);
    }
  };

  const canAccessDashboard = profile?.role === 'admin';
  const hasSubmittedRestaurantData = !!profile;

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0F172A', gap: '1rem' }}>
        <Loader2 style={{ width: '40px', height: '40px', color: '#3B82F6', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: '#94A3B8' }}>Initializing Application...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0F172A', padding: '2rem', textAlign: 'center' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <span style={{ fontSize: '2rem' }}>⚠️</span>
        </div>
        <h2 style={{ marginBottom: '0.75rem', color: 'white', fontSize: '1.5rem', fontWeight: 700 }}>Connection Error</h2>
        <pre style={{ color: '#FCA5A5', maxWidth: '500px', marginBottom: '2rem', whiteSpace: 'pre-wrap', fontSize: '0.875rem', lineHeight: 1.6, textAlign: 'left', background: 'rgba(239,68,68,0.1)', padding: '1rem 1.5rem', borderRadius: '0.75rem', border: '1px solid rgba(239,68,68,0.2)' }}>{error}</pre>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={() => window.location.reload()} className="btn btn-primary" style={{ padding: '0.75rem 2rem' }}>
            Try Again
          </button>
          <button onClick={signOut} className="btn" style={{ padding: '0.75rem 2rem', background: '#1E293B', color: 'white', border: '1px solid #334155', borderRadius: '0.5rem', cursor: 'pointer' }}>
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter basename="/admin">
      <Routes>
        <Route
          path="/login"
          element={
            !session ? (
              <Login onLogin={loginWithGoogle} authError={authError} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/onboarding"
          element={
            !session ? (
              <Navigate to="/login" replace />
            ) : canAccessDashboard ? (
              <Navigate to="/" replace />
            ) : hasSubmittedRestaurantData ? (
              <Navigate to="/account-status" replace />
            ) : (
              <Onboarding profile={profile} onComplete={onOnboardingComplete} />
            )
          }
        />
        <Route
          path="/account-status"
          element={
            !session ? (
              <Navigate to="/login" replace />
            ) : canAccessDashboard ? (
              <Navigate to="/" replace />
            ) : (
              <AccountStatus onSignOut={signOut} />
            )
          }
        />
        <Route
          path="/*"
          element={
            !session ? (
              <Navigate to="/login" replace />
            ) : !profile ? (
              <Navigate to="/onboarding" replace />
            ) : canAccessDashboard ? (
              <Dashboard session={session} profile={profile} onSignOut={signOut} />
            ) : hasSubmittedRestaurantData ? (
              <Navigate to="/account-status" replace />
            ) : (
              <Navigate to="/onboarding" replace />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
