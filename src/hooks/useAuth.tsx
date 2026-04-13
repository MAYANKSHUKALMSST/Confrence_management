import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api, setToken, clearToken } from '@/integrations/supabase/client';
import type { AppRole, Profile } from '@/lib/types';

interface AuthUser {
  id: string;
  email: string;
}

interface AuthContextType {
  user: AuthUser | null;
  profile: Profile | null;
  role: AppRole;
  isAdmin: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  role: 'user',
  isAdmin: false,
  loading: true,
  signOut: async () => {},
  refreshSession: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole>('user');
  const [loading, setLoading] = useState(true);

  const loadSession = async () => {
    // Session is validated via HttpOnly cookie; no local token needed
    const { data, error } = await api.auth.getSession();
    if (error || !data) {
      setUser(null);
      setProfile(null);
      setRole('user');
      setLoading(false);
      return;
    }
    const session = data as any;
    setUser(session.user);
    setProfile(session.profile as Profile);
    setRole(session.role as AppRole);
    setLoading(false);
  };

  useEffect(() => {
    loadSession();
  }, []);

  const signOut = async () => {
    await api.auth.logout(); // clears HttpOnly cookie on server
    setUser(null);
    setProfile(null);
    setRole('user');
  };

  return (
    <AuthContext.Provider value={{ user, profile, role, isAdmin: role === 'admin', loading, signOut, refreshSession: loadSession }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
