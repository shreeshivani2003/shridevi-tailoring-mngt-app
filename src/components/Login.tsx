import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { User, Lock, AlertCircle, UserPlus, Eye, EyeOff } from 'lucide-react';

const Login: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password');
      return;
    }

    if (isSignUp) {
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters long');
        return;
      }
    }

    setLoading(true);
    
    try {
      let success;
      let userRole;
      
      if (isSignUp) {
        const result = await signUp(username, password);
        success = result.success;
        userRole = result.user?.role;
        if (!success) {
          setError(result.error || 'Failed to create account');
        }
      } else {
        const result = await login(username, password, rememberMe);
        success = result.success;
        userRole = result.user?.role;
        if (!success) {
          setError(result.error || 'Invalid username or password');
        }
      }
      
      if (success) {
        // Role-based redirect
        if (userRole === 'user') {
          navigate('/status');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-rose-50 to-pink-200 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-pink-800 mb-2">Shri Devi Tailoring</h1>
          <p className="text-pink-600">Management System</p>
        </div>

        {/* Login/Signup toggle */}
        <div className="flex mb-6">
          <button
            type="button"
            onClick={() => setIsSignUp(false)}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-l-lg transition-colors ${
              !isSignUp 
                ? 'bg-pink-500 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => setIsSignUp(true)}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-r-lg transition-colors ${
              isSignUp 
                ? 'bg-pink-500 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <div className="relative">
              <User className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                placeholder="Enter unique username"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                placeholder="Enter password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {isSignUp && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                  placeholder="Confirm password"
                />
              </div>
            </div>
          )}

          {!isSignUp && (
            <div className="flex items-center">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
              />
              <label htmlFor="rememberMe" className="ml-2 text-sm text-gray-700">
                Remember me
              </label>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white py-3 rounded-lg font-medium hover:from-pink-600 hover:to-rose-600 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              'Processing...'
            ) : (
              <>
                {isSignUp ? <UserPlus className="w-5 h-5" /> : <User className="w-5 h-5" />}
                {isSignUp ? 'Create Account' : 'Sign In'}
              </>
            )}
          </button>
        </form>

        {isSignUp && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-700 font-medium mb-1">New Account Info:</p>
            <p className="text-xs text-blue-600">
              New accounts are created with 'User' role by default. 
              Contact Super Admin to upgrade permissions.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;