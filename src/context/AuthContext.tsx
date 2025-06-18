import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string, rememberMe?: boolean) => Promise<{success: boolean, user?: User, error?: string}>;
  signUp: (username: string, password: string) => Promise<{success: boolean, user?: User, error?: string}>;
  logout: () => void;
  isAuthenticated: boolean;
  users: User[];
  addUser: (userData: Omit<User, 'id' | 'createdAt'>) => Promise<void>;
  updateUser: (id: string, userData: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  loading: boolean;
  supabaseConfigured: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users for consistent authentication
const mockUsers: User[] = [
  {
    id: 'super_admin_001',
    username: 'superadmin',
    password: '',
    role: 'super_admin',
    createdAt: new Date('2024-01-01')
  },
  {
    id: 'admin_001',
    username: 'admin',
    password: '',
    role: 'admin',
    createdAt: new Date('2024-01-01')
  },
  {
    id: 'user_001',
    username: 'user',
    password: '',
    role: 'user',
    createdAt: new Date('2024-01-01')
  }
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [loading, setLoading] = useState(true);
  const [supabaseConfigured, setSupabaseConfigured] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      setSupabaseConfigured(false); // Always use mock mode for consistency
      
      // Check for remembered user
      const rememberedUser = localStorage.getItem('rememberedUser');
      if (rememberedUser) {
        setUser(JSON.parse(rememberedUser));
      } else {
        // Check for session user
        const sessionUser = sessionStorage.getItem('user');
        if (sessionUser) {
          setUser(JSON.parse(sessionUser));
        }
      }
      
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (username: string, password: string, rememberMe: boolean = false): Promise<{success: boolean, user?: User, error?: string}> => {
    try {
      // Mock authentication - predefined credentials
      let foundUser: User | null = null;
      
      if (username === 'superadmin' && password === 'admin123') {
        foundUser = mockUsers.find(u => u.username === 'superadmin') || null;
      } else if (username === 'admin' && password === 'admin123') {
        foundUser = mockUsers.find(u => u.username === 'admin') || null;
      } else if (username === 'user' && password === 'user123') {
        foundUser = mockUsers.find(u => u.username === 'user') || null;
      }
      
      if (!foundUser) {
        return { success: false, error: 'Invalid username or password' };
      }

      setUser(foundUser);
      
      if (rememberMe) {
        localStorage.setItem('rememberedUser', JSON.stringify(foundUser));
        sessionStorage.removeItem('user');
      } else {
        sessionStorage.setItem('user', JSON.stringify(foundUser));
        localStorage.removeItem('rememberedUser');
      }
      
      return { success: true, user: foundUser };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'An error occurred during login' };
    }
  };

  const signUp = async (username: string, password: string): Promise<{success: boolean, user?: User, error?: string}> => {
    try {
      // Check if username already exists
      const existingUser = users.find(u => u.username === username);
      if (existingUser) {
        return { success: false, error: 'Username already exists' };
      }

      // Create new user
      const newUser: User = {
        id: `user_${Date.now()}`,
        username,
        password: '',
        role: 'user',
        createdAt: new Date()
      };

      setUsers(prev => [...prev, newUser]);
      
      return { success: true, user: newUser };
    } catch (error) {
      console.error('Sign up error:', error);
      return { success: false, error: 'An error occurred during sign up' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('rememberedUser');
    sessionStorage.removeItem('user');
  };

  const addUser = async (userData: Omit<User, 'id' | 'createdAt'>) => {
    try {
      // Create new user
      const newUser: User = {
        id: `user_${Date.now()}`,
        username: userData.username,
        password: '',
        role: userData.role,
        createdAt: new Date()
      };

      setUsers(prev => [...prev, newUser]);
    } catch (error) {
      console.error('Error adding user:', error);
      throw error;
    }
  };

  const updateUser = async (id: string, userData: Partial<User>) => {
    try {
      const updatedUser = users.find(u => u.id === id);
      if (!updatedUser) {
        throw new Error('User not found');
      }

      const updatedUserData: User = { ...updatedUser, ...userData };

      const updatedUsers = users.map(u => u.id === id ? updatedUserData : u);
      setUsers(updatedUsers);
      
      // Update current user if it's the same user being updated
      if (user?.id === id) {
        setUser(updatedUserData);
        
        // Update stored user data
        const rememberedUser = localStorage.getItem('rememberedUser');
        const sessionUser = sessionStorage.getItem('user');
        
        if (rememberedUser) {
          localStorage.setItem('rememberedUser', JSON.stringify(updatedUserData));
        }
        if (sessionUser) {
          sessionStorage.setItem('user', JSON.stringify(updatedUserData));
        }
      }
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  };

  const deleteUser = async (id: string) => {
    try {
      const updatedUsers = users.filter(u => u.id !== id);
      setUsers(updatedUsers);
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      signUp,
      logout,
      isAuthenticated: !!user,
      users,
      addUser,
      updateUser,
      deleteUser,
      loading,
      supabaseConfigured
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};