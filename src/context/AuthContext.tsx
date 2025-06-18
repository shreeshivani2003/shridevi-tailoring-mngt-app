import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { supabase } from '../lib/supabase';
import bcrypt from 'bcryptjs';

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

// Check if Supabase is configured
const isSupabaseConfigured = () => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  return !!(url && key && url !== 'your_supabase_url' && key !== 'your_supabase_anon_key');
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [supabaseConfigured, setSupabaseConfigured] = useState(false);

  // Load users from Supabase
  const loadUsers = async () => {
    try {
      if (!isSupabaseConfigured()) {
        setSupabaseConfigured(false);
        setUsers([]);
        return;
      }

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading users:', error);
        setUsers([]);
      } else {
        const mappedUsers = (data || []).map((user: any) => ({
          id: user.id,
          username: user.username,
          password: '', // Don't load passwords
          role: user.role,
          createdAt: new Date(user.created_at)
        }));
        setUsers(mappedUsers);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      setUsers([]);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      setSupabaseConfigured(isSupabaseConfigured());
      
      if (isSupabaseConfigured()) {
        await loadUsers();
        
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
      } else {
        // If Supabase is not configured, only allow super admin access
        const rememberedUser = localStorage.getItem('rememberedUser');
        if (rememberedUser) {
          const user = JSON.parse(rememberedUser);
          if (user.role === 'super_admin') {
            setUser(user);
          }
        }
      }
      
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (username: string, password: string, rememberMe: boolean = false): Promise<{success: boolean, user?: User, error?: string}> => {
    try {
      if (!isSupabaseConfigured()) {
        // Only allow super admin access when Supabase is not configured
        if (username === 'superadmin' && password === 'admin123') {
          const superAdmin: User = {
            id: 'super_admin_001',
            username: 'superadmin',
            password: '',
            role: 'super_admin',
            createdAt: new Date('2024-01-01')
          };
          
          setUser(superAdmin);
          
          if (rememberMe) {
            localStorage.setItem('rememberedUser', JSON.stringify(superAdmin));
            sessionStorage.removeItem('user');
          } else {
            sessionStorage.setItem('user', JSON.stringify(superAdmin));
            localStorage.removeItem('rememberedUser');
          }
          
          return { success: true, user: superAdmin };
        }
        
        return { success: false, error: 'Invalid credentials. Only super admin access is allowed.' };
      }

      // Supabase authentication
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single();

      if (error || !data) {
        return { success: false, error: 'Invalid username or password' };
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, data.password_hash);
      if (!isValidPassword) {
        return { success: false, error: 'Invalid username or password' };
      }

      const foundUser: User = {
        id: data.id,
        username: data.username,
        password: '',
        role: data.role,
        createdAt: new Date(data.created_at)
      };

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
      if (!isSupabaseConfigured()) {
        return { success: false, error: 'Sign up is not available. Please configure Supabase first.' };
      }

      // Check if username already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('username')
        .eq('username', username)
        .single();

      if (existingUser) {
        return { success: false, error: 'Username already exists' };
      }

      // Hash password
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      const newUser = {
        id: Date.now().toString(),
        username,
        password_hash: passwordHash,
        role: 'user', // New users get 'user' role by default
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('users')
        .insert([newUser])
        .select()
        .single();

      if (error) {
        console.error('Error creating user:', error);
        return { success: false, error: 'Failed to create account' };
      }

      const createdUser: User = {
        id: data.id,
        username: data.username,
        password: '',
        role: data.role,
        createdAt: new Date(data.created_at)
      };

      setUsers(prev => [createdUser, ...prev]);
      setUser(createdUser);
      sessionStorage.setItem('user', JSON.stringify(createdUser));
      
      return { success: true, user: createdUser };
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
      if (!isSupabaseConfigured()) {
        throw new Error('Supabase not configured');
      }

      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(userData.password, saltRounds);

      const newUser = {
        id: Date.now().toString(),
        username: userData.username,
        password_hash: passwordHash,
        role: userData.role,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('users')
        .insert([newUser])
        .select()
        .single();

      if (error) {
        throw error;
      }

      const createdUser: User = {
        id: data.id,
        username: data.username,
        password: '',
        role: data.role,
        createdAt: new Date(data.created_at)
      };

      setUsers(prev => [createdUser, ...prev]);
    } catch (error) {
      console.error('Error adding user:', error);
      throw error;
    }
  };

  const updateUser = async (id: string, userData: Partial<User>) => {
    try {
      if (!isSupabaseConfigured()) {
        throw new Error('Supabase not configured');
      }

      const updateData: any = {};
      if (userData.username !== undefined) updateData.username = userData.username;
      if (userData.role !== undefined) updateData.role = userData.role;
      if (userData.password) {
        const saltRounds = 10;
        updateData.password_hash = await bcrypt.hash(userData.password, saltRounds);
      }

      const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      const updatedUser: User = {
        id: data.id,
        username: data.username,
        password: '',
        role: data.role,
        createdAt: new Date(data.created_at)
      };

      setUsers(prev => prev.map(u => u.id === id ? updatedUser : u));
      
      // Update current user if it's the same user being updated
      if (user?.id === id) {
        setUser(updatedUser);
        
        // Update stored user data
        const rememberedUser = localStorage.getItem('rememberedUser');
        const sessionUser = sessionStorage.getItem('user');
        
        if (rememberedUser) {
          localStorage.setItem('rememberedUser', JSON.stringify(updatedUser));
        }
        if (sessionUser) {
          sessionStorage.setItem('user', JSON.stringify(updatedUser));
        }
      }
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  };

  const deleteUser = async (id: string) => {
    try {
      if (!isSupabaseConfigured()) {
        throw new Error('Supabase not configured');
      }

      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      setUsers(prev => prev.filter(u => u.id !== id));
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