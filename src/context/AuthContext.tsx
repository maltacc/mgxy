import { createContext, useContext, useState, type ReactNode } from 'react';

export interface AuthUser {
  name: string;
  email: string;
  picture: string;
  sub: string;
}

interface AuthContextType {
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;
}

const AuthContext = createContext<AuthContextType>({ user: null, setUser: () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(() => {
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem('tango_auth_user');
        if (raw) return JSON.parse(raw) as AuthUser;
      }
    } catch {}
    return null;
  });

  const setUser = (u: AuthUser | null) => {
    try {
      if (typeof localStorage !== 'undefined') {
        if (u) localStorage.setItem('tango_auth_user', JSON.stringify(u));
        else localStorage.removeItem('tango_auth_user');
      }
    } catch {}
    setUserState(u);
  };

  return <AuthContext.Provider value={{ user, setUser }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
