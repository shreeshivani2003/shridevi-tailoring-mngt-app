import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string, rememberMe?: boolean) => Promise<{success: boolean, user?: User, error?: string}>;
  signUp: (username: string, password: string) => Promise<{success: boolean, user?: User, error?: string}>;
  logout: () => void;
  isAuthenticated: boolean;
  users: User[];
  addUser: (userData: Omit<User, 'id' | 'createdAt'>) => void;
  updateUser: (id: string, userData: Partial<User>) => void;
  deleteUser: (id: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Initial mock users data
const initialUsers: User[] = [
  {
    id: '1',
    username: 'superadmin',
    password: 'admin123',
    role: 'super_admin',
    createdAt: new Date('2024-01-01')
  },
  {
    id: '2',
    username: 'admin',
    password: 'admin123',
    role: 'admin',
    createdAt: new Date('2024-01-02')
  },
  {
    id: '3',
    username: 'user',
    password: 'user123',
    role: 'user',
    createdAt: new Date('2024-01-03')
  }
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(() => {
    const savedUsers = localStorage.getItem('users');
    return savedUsers ? JSON.parse(savedUsers) : initialUsers;
  });

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    // Save users to localStorage whenever users array changes
    localStorage.setItem('users', JSON.stringify(users));
  }, [users]);

  const login = async (username: string, password: string, rememberMe: boolean = false): Promise<{success: boolean, user?: User, error?: string}> => {
    const foundUser = users.find(u => u.username === username && u.password === password);
    
    if (foundUser) {
      setUser(foundUser);
      
      if (rememberMe) {
        localStorage.setItem('rememberedUser', JSON.stringify(foundUser));
        // Remove session storage if remember me is checked
        sessionStorage.removeItem('user');
      } else {
        sessionStorage.setItem('user', JSON.stringify(foundUser));
        // Remove remembered user if remember me is not checked
        localStorage.removeItem('rememberedUser');
      }
      
      return { success: true, user: foundUser };
    }
    
    return { success: false, error: 'Invalid username or password' };
  };

  const signUp = async (username: string, password: string): Promise<{success: boolean, user?: User, error?: string}> => {
    // Check if username already exists
    const existingUser = users.find(u => u.username === username);
    if (existingUser) {
      return { success: false, error: 'Username already exists' };
    }

    const newUser: User = {
      id: Date.now().toString(),
      username,
      password,
      role: 'user', // New users get 'user' role by default
      createdAt: new Date()
    };

    setUsers(prev => [...prev, newUser]);
    setUser(newUser);
    sessionStorage.setItem('user', JSON.stringify(newUser));
    
    return { success: true, user: newUser };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('rememberedUser');
    sessionStorage.removeItem('user');
  };

  const addUser = (userData: Omit<User, 'id' | 'createdAt'>) => {
    const newUser: User = {
      ...userData,
      id: Date.now().toString(),
      createdAt: new Date()
    };
    setUsers(prev => [...prev, newUser]);
  };

  const updateUser = (id: string, userData: Partial<User>) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...userData } : u));
    
    // Update current user if it's the same user being updated
    if (user?.id === id) {
      const updatedUser = { ...user, ...userData };
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
  };

  const deleteUser = (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
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
      deleteUser
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