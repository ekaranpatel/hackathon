import React, { useState } from 'react';
import { createUser, loginUser } from '../../admin/services/Userservice';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/Authcontext';

export default function AuthPage({ onAuthSuccess }) {
  const { saveAuthSession } = useAuth();
  const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const REDIRECT_URI = window.location.origin;
  const navigate = useNavigate();

  const handleGoogleLogin = () => {
    if (!CLIENT_ID) {
      alert("Missing VITE_GOOGLE_CLIENT_ID in your .env file!");
      return;
    }

    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
      `&response_type=code` +
      `&scope=${encodeURIComponent('openid profile email')}` +
      `&prompt=consent`;

    window.location.href = googleAuthUrl;
  };

  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 🟢 Role Redirect (Handles case-insensitive roles: 'admin' or 'Admin')
  const handleRoleRedirect = (userData) => {
    const role = userData?.role?.toLowerCase();

    if (role === 'admin') {
      navigate('/admin/dashboard');
    } else {
      navigate('/resources');
    }
  };

  // Signup Handler
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await createUser(formData);
      // Safely extract data whether backend service returns res.data or res
      const data = res.data || res;

      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      if (data.user) {
        saveAuthSession(data.user, data.token);
      }

      if (onAuthSuccess) onAuthSuccess(data);
      handleRoleRedirect(data.user);
    } catch (err) {
      console.error('Register Error:', err);
      alert(err.response?.data?.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  // Login Handler
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await loginUser({
        email: formData.email,
        password: formData.password
      });

      // Safely extract data whether backend service returns res.data or res
      const data = res.data || res;

      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      if (data.user) {
        saveAuthSession(data.user, data.token);
      }

      if (onAuthSuccess) onAuthSuccess(data);
      handleRoleRedirect(data.user);
    } catch (err) {
      console.error('Login Error details:', err.response);
      alert(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-50vh bg-[#090d16] text-gray-100 flex justify-center p-4 font-sans">
      <div className="bg-[#0e1322] border border-gray-800 rounded-2xl p-8 max-w-md w-full shadow-2xl space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold text-white">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="text-xs text-gray-400">
            {isLogin ? 'Sign in to access your account' : 'Enter your details to sign up'}
          </p>
        </div>

        {/* Google Auth Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 bg-[#161b2c] hover:bg-[#1d233a] border border-gray-700/80 text-gray-200 py-2.5 rounded-lg text-sm font-medium transition-all duration-150"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.2 9 5 12 5z"
            />
            <path
              fill="#4285F4"
              d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
            />
            <path
              fill="#FBBC05"
              d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15s.7 5.3 1.9 7.7l3.7-2.9z"
            />
            <path
              fill="#34A853"
              d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.2-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"
            />
          </svg>
          {isLogin ? 'Sign in with Google' : 'Sign up with Google'}
        </button>

        {/* Divider */}
        <div className="relative flex items-center justify-center">
          <div className="border-t border-gray-800 w-full"></div>
          <span className="bg-[#0e1322] px-3 text-[10px] text-gray-500 uppercase tracking-wider font-mono absolute">
            Or continue with email
          </span>
        </div>

        {/* Form */}
        <form onSubmit={isLogin ? handleLoginSubmit : handleRegisterSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="text-xs text-gray-400 block mb-1">Full Name</label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="John Doe"
                className="w-full px-3.5 py-2 bg-[#161b2c] border border-gray-700/80 rounded-lg text-xs text-gray-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
          )}

          <div>
            <label className="text-xs text-gray-400 block mb-1">Email Address</label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="name@example.com"
              className="w-full px-3.5 py-2 bg-[#161b2c] border border-gray-700/80 rounded-lg text-xs text-gray-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1">Password</label>
            <input
              type="password"
              name="password"
              required
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full px-3.5 py-2 bg-[#161b2c] border border-gray-700/80 rounded-lg text-xs text-gray-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs py-2.5 rounded-lg transition-all shadow-md mt-2 disabled:opacity-50"
          >
            {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {/* Mode Switcher */}
        <div className="text-center pt-2 border-t border-gray-800">
          <p className="text-xs text-gray-400">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-indigo-400 hover:underline font-medium ml-1"
            >
              {isLogin ? 'Sign up' : 'Log in'}
            </button>
          </p>
        </div>

      </div>
    </div>
  );
}