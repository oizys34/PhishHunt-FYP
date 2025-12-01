import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, AuthContextType, RegisterData, GoogleLoginPayload } from '../types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  const normalizeUser = useCallback((raw: Partial<User> & { id?: string | number }): User => {
    const email = raw.email ?? '';
    const baseName =
      raw.username ??
      raw.firstName ??
      (email ? email.split('@')[0] : '') ??
      'user';

    return {
      id: raw.id !== undefined ? String(raw.id) : '',
      username: baseName,
      email,
      firstName: raw.firstName ?? baseName,
      lastName: raw.lastName ?? '',
      isGuest: raw.isGuest ?? false
    };
  }, []);

  const persistUser = useCallback(
    (raw: Partial<User> & { id?: string | number }) => {
      const normalized = normalizeUser(raw);
      setUser(normalized);
      localStorage.setItem('phishhunt_user', JSON.stringify(normalized));
      return normalized;
    },
    [normalizeUser]
  );

  useEffect(() => {
    // Check for existing session on app load
    const savedUser = localStorage.getItem('phishhunt_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        persistUser(parsed);
      } catch (error) {
        console.warn('Failed to parse saved user from localStorage', error);
        localStorage.removeItem('phishhunt_user');
      }
    }
    setIsLoading(false);
  }, [persistUser]);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const response = await fetch(`${apiUrl}/api/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (response.status === 404) {
        setIsLoading(false);
        throw new Error('USER_NOT_FOUND');
      }

      if (response.status === 401) {
        const errorBody = await response.json().catch(() => ({}));
        setIsLoading(false);
        const message = typeof errorBody?.error === 'string' ? errorBody.error.toLowerCase() : '';
        if (message.includes('password')) {
          throw new Error('INVALID_PASSWORD');
        }
        throw new Error('INVALID_CREDENTIALS');
      }

      if (response.status === 409) {
        const conflict = await response.json().catch(() => ({}));
        setIsLoading(false);
        const errorMessage = typeof conflict?.error === 'string' ? conflict.error.toLowerCase() : '';
        if (errorMessage.includes('email')) {
          throw new Error('EMAIL_EXISTS');
        }
        if (errorMessage.includes('username')) {
          throw new Error('USERNAME_EXISTS');
        }
        throw new Error('CONFLICT');
      }

      if (!response.ok) {
        if (response.status === 409) {
          const conflict = await response.json().catch(() => ({}));
          setIsLoading(false);
          const message = typeof conflict?.error === 'string' ? conflict.error.toLowerCase() : '';
          if (message.includes('email')) {
            throw new Error('EMAIL_EXISTS');
          }
          if (message.includes('username')) {
            throw new Error('USERNAME_EXISTS');
          }
          throw new Error('CONFLICT');
        }
        setIsLoading(false);
        return false;
      }

      const result = await response.json();
      if (!result?.user) {
        setIsLoading(false);
        return false;
      }

      persistUser(result.user);
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      setIsLoading(false);
      throw error;
    }
  };

  const checkUsernameAvailability = useCallback(async (username: string): Promise<boolean> => {
    if (!username) {
      return false;
    }

    try {
      const response = await fetch(`${apiUrl}/api/users/check-username?username=${encodeURIComponent(username)}`);
      if (!response.ok) {
        return false;
      }
      const result = await response.json();
      return !!result.available;
    } catch (error) {
      console.error('Username availability check failed:', error);
      return false;
    }
  }, [apiUrl]);

  const generateUsernameFromEmail = useCallback(async (email: string): Promise<string> => {
    const base = email
      .split('@')[0]
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(0, 20)
      .toLowerCase() || 'user';

    let candidate = base;
    let suffix = 1;

    while (!(await checkUsernameAvailability(candidate))) {
      candidate = `${base}${suffix}`;
      suffix += 1;
    }

    return candidate;
  }, [checkUsernameAvailability]);

  const register = useCallback(async (data: RegisterData): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (response.status === 409) {
        const conflict = await response.json().catch(() => ({}));
        setIsLoading(false);
        const message = typeof conflict?.error === 'string' ? conflict.error.toLowerCase() : '';
        if (message.includes('email')) {
          throw new Error('EMAIL_EXISTS');
        }
        if (message.includes('username')) {
          throw new Error('USERNAME_EXISTS');
        }
        throw new Error('CONFLICT');
      }

      if (!response.ok) {
        setIsLoading(false);
        return false;
      }

      const result = await response.json();
      if (!result?.user) {
        setIsLoading(false);
        return false;
      }

      persistUser({
        ...result.user,
        firstName: result.user.firstName ?? data.firstName,
        lastName: result.user.lastName ?? data.lastName
      });
      setIsLoading(false);
      return true;
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  }, [apiUrl, persistUser]);

  const loginWithGoogle = useCallback(async (payload: GoogleLoginPayload): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/users/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        setIsLoading(false);
        return false;
      }

      const result = await response.json();
      if (!result?.user) {
        setIsLoading(false);
        return false;
      }

      persistUser(result.user);
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Google login failed:', error);
      setIsLoading(false);
      throw error;
    }
  }, [apiUrl]);

  const guestLogin = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/users/guest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Guest User' })
      });

      if (!response.ok) {
        setIsLoading(false);
        return false;
      }

      const result = await response.json();
      if (!result?.user) {
        setIsLoading(false);
        return false;
      }

      persistUser(result.user);
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Guest login failed:', error);
      setIsLoading(false);
      throw error;
    }
  }, [apiUrl, persistUser]);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('phishhunt_user');
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    login,
    register,
    checkUsernameAvailability,
    generateUsernameFromEmail,
    loginWithGoogle,
    guestLogin,
    logout,
    isLoading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
