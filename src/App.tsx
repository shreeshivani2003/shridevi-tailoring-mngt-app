import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import Login from './components/Login';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Customers from './components/Customers';
import Orders from './components/Orders';
import OrderDetail from './components/OrderDetail';
import Status from './components/Status';
import SizeChart from './components/SizeChart';
import SuperAdmin from './components/SuperAdmin';

const ProtectedRoute: React.FC<{ children: React.ReactNode, allowedRoles?: string[] }> = ({ 
  children, 
  allowedRoles = [] 
}) => {
  const { isAuthenticated, user } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role || '')) {
    // Redirect users to status page if they try to access restricted areas
    if (user?.role === 'user') {
      return <Navigate to="/status" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  
  return (
    <Routes>
      <Route 
        path="/login" 
        element={
          isAuthenticated ? (
            user?.role === 'user' ? 
              <Navigate to="/status" replace /> : 
              <Navigate to="/dashboard" replace />
          ) : (
            <Login />
          )
        } 
      />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route 
          index 
          element={
            user?.role === 'user' ? 
              <Navigate to="/status" replace /> : 
              <Navigate to="/dashboard" replace />
          } 
        />
        <Route 
          path="dashboard" 
          element={
            <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="customers" 
          element={
            <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
              <Customers />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="customers/:customerId" 
          element={
            <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
              <Customers />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="orders" 
          element={
            <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
              <Orders />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="orders/:orderId" 
          element={
            <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
              <OrderDetail />
            </ProtectedRoute>
          } 
        />
        <Route path="status" element={<Status />} />
        <Route 
          path="size-chart" 
          element={
            <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
              <SizeChart />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="super-admin" 
          element={
            <ProtectedRoute allowedRoles={['super_admin']}>
              <SuperAdmin />
            </ProtectedRoute>
          } 
        />
      </Route>
      <Route path="*" element={
        <Navigate to={user?.role === 'user' ? "/status" : "/dashboard"} replace />
      } />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <Router>
          <AppRoutes />
        </Router>
      </DataProvider>
    </AuthProvider>
  );
}

export default App;