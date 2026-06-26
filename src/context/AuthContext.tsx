import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface User {
  token: string;
  email: string;
  role: 'Pharmacist' | 'Assistant Pharmacist' | 'Cashier' | 'Doctor';
  name?: string;
  contact?: string;
  docId?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, isDoctor: boolean, rememberMe?: boolean) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  signup: (userData: any, isDoctor: boolean) => Promise<{ success: boolean; message: string }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const email = localStorage.getItem('email') || sessionStorage.getItem('email');
    const role = (localStorage.getItem('role') || sessionStorage.getItem('role')) as User['role'] | null;
    const expiration = localStorage.getItem('expiration') || sessionStorage.getItem('expiration');

    if (token && email && role && expiration) {
      const expirationDate = new Date(expiration);
      if (expirationDate > new Date()) {
        return {
          token,
          email,
          role,
          name: localStorage.getItem('name') || sessionStorage.getItem('name') || undefined,
          docId: localStorage.getItem('docId') || sessionStorage.getItem('docId') || undefined,
        };
      }
    }
    return null;
  });
  const logoutTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('email');
    localStorage.removeItem('role');
    localStorage.removeItem('name');
    localStorage.removeItem('docId');
    localStorage.removeItem('expiration');

    sessionStorage.removeItem('token');
    sessionStorage.removeItem('email');
    sessionStorage.removeItem('role');
    sessionStorage.removeItem('name');
    sessionStorage.removeItem('docId');
    sessionStorage.removeItem('expiration');
    
    setUser(null);
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }
  }, []);

  const setAuthTimeout = useCallback((durationMs: number) => {
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
    }
    logoutTimerRef.current = setTimeout(() => {
      logout();
    }, durationMs);
  }, [logout]);

  const login = async (email: string, password: string, isDoctor: boolean, rememberMe = true) => {
    try {
      const url = isDoctor ? '/api/doctorUser/doctorLogin' : '/api/user/login';
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();

      if (!response.ok || data.token === 'error' || !data.token) {
        return { success: false, message: data.message || 'Authentication failed' };
      }

      const role = isDoctor ? 'Doctor' : data.role;
      const expirationDate = new Date(new Date().getTime() + (data.expiresIn || 3600) * 1000);

      const storage = rememberMe ? localStorage : sessionStorage;

      storage.setItem('token', data.token);
      storage.setItem('email', email);
      storage.setItem('role', role);
      storage.setItem('expiration', expirationDate.toISOString());

      if (isDoctor) {
        storage.setItem('name', data.name || '');
        storage.setItem('docId', data.docId || '');
      }

      setUser({
        token: data.token,
        email,
        role,
        name: data.name,
        docId: data.docId,
      });

      setAuthTimeout((data.expiresIn || 3600) * 1000);
      return { success: true, message: data.message || 'Logged in successfully' };
    } catch (err: any) {
      return { success: false, message: 'Server error connection failed' };
    }
  };

  const signup = async (userData: any, isDoctor: boolean) => {
    try {
      const url = isDoctor ? '/api/doctorUser/doctorSignup' : '/api/user/signup';
      const isFormData = userData instanceof FormData;
      const headers: HeadersInit = {};
      if (!isFormData) {
        headers['Content-Type'] = 'application/json';
      }
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: isFormData ? userData : JSON.stringify(userData),
      });
      const data = await response.json();

      if (!response.ok) {
        return { success: false, message: data.error?.message || data.message || 'Signup failed' };
      }
      return { success: true, message: data.message || 'Account created successfully' };
    } catch (err) {
      return { success: false, message: 'Server error connection failed' };
    }
  };

  // Setup auto-logout timer on mount if user is logged in
  useEffect(() => {
    const expiration = localStorage.getItem('expiration') || sessionStorage.getItem('expiration');
    if (user && expiration) {
      const expirationDate = new Date(expiration);
      const now = new Date();
      const remainingTime = expirationDate.getTime() - now.getTime();
      if (remainingTime > 0) {
        setAuthTimeout(remainingTime);
      } else {
        logout();
      }
    }
  }, [user, setAuthTimeout, logout]);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, signup }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
