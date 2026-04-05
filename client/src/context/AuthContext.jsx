import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [gym, setGym] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('gymflow_token');
    const savedUser = localStorage.getItem('gymflow_user');
    if (token && savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed.user);
        setGym(parsed.gym);
      } catch {}
      // Verify token is still valid
      api.getProfile().then(res => {
        setUser(prev => ({ ...prev, ...res.data }));
      }).catch(() => {
        logout();
      }).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (credentials) => {
    const res = await api.login(credentials);
    const { user: u, gym: g, accessToken, refreshToken } = res.data;
    api.setTokens(accessToken, refreshToken);
    localStorage.setItem('gymflow_user', JSON.stringify({ user: u, gym: g }));
    setUser(u);
    setGym(g);
    return res;
  };

  const signup = async (data) => {
    const res = await api.signup(data);
    const { user: u, gym: g, accessToken, refreshToken } = res.data;
    api.setTokens(accessToken, refreshToken);
    localStorage.setItem('gymflow_user', JSON.stringify({ user: u, gym: g }));
    setUser(u);
    setGym(g);
    return res;
  };

  const googleAuth = async (data) => {
    const res = await api.googleAuth(data);
    const { user: u, gym: g, accessToken, refreshToken } = res.data;
    api.setTokens(accessToken, refreshToken);
    localStorage.setItem('gymflow_user', JSON.stringify({ user: u, gym: g }));
    setUser(u);
    setGym(g);
    return res;
  };

  const logout = () => {
    api.clearTokens();
    setUser(null);
    setGym(null);
  };

  return (
    <AuthContext.Provider value={{ user, gym, loading, login, signup, googleAuth, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
