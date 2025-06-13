import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  Activity, 
  Settings, 
  LogOut,
  Ruler,
  Crown
} from 'lucide-react';

const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigationItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['super_admin', 'admin'] },
    { path: '/customers', icon: Users, label: 'Customers', roles: ['super_admin', 'admin'] },
    { path: '/orders', icon: Package, label: 'Orders', roles: ['super_admin', 'admin'] },
    { path: '/status', icon: Activity, label: 'Status', roles: ['super_admin', 'admin', 'user'] },
    { path: '/size-chart', icon: Ruler, label: 'Size Chart', roles: ['super_admin', 'admin'] },
    { path: '/super-admin', icon: Crown, label: 'Super Admin', roles: ['super_admin'] }
  ];

  const filteredNavItems = navigationItems.filter(item => 
    item.roles.includes(user?.role || '')
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-lg min-h-screen">
          <div className="p-6 border-b border-pink-100">
            <h1 className="text-2xl font-bold text-pink-800">Shri Devi Tailoring</h1>
            <p className="text-sm text-pink-600 mt-1">Management System</p>
          </div>
          
          <nav className="mt-6">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-6 py-3 text-gray-700 hover:bg-pink-50 hover:text-pink-800 transition-colors ${
                    isActive ? 'bg-pink-100 text-pink-800 border-r-4 border-pink-500' : ''
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="absolute bottom-0 w-64 p-6 border-t border-pink-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">{user?.username}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role?.replace('_', ' ')}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Layout;