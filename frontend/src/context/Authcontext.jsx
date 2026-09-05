import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { BACKEND_URL } from '../student/pages/Api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const oauthProcessedRef = useRef(false); // Prevents React 18 StrictMode double execution

  // 1. Initialize state directly from localStorage
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('labUser');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [loading, setLoading] = useState(false);

  const saveAuthSession = (userData, token) => {
    localStorage.setItem('labUser', JSON.stringify(userData));
    localStorage.setItem('labToken', token);
    setUser(userData);
  };

  // --- EFFECT 1: Process Google OAuth Redirect Code ---
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    // Run only if code exists AND hasn't been processed yet
    if (code && !oauthProcessedRef.current) {
      oauthProcessedRef.current = true;
      setLoading(true);

      // Clean the ?code= parameter from browser URL bar immediately
      window.history.replaceState({}, document.title, window.location.pathname);

      // 🟢 Fix 1 & 2: Send request to /api/auth/google with explicit redirect_uri
      axios
        .post(`${BACKEND_URL}/auth/google`, {
          code,
          redirect_uri: window.location.origin, // e.g., "http://localhost:5173" or "https://lab-dynamix.vercel.app"
        })
        .then((res) => {
          const userData = res.data.user || res.data;
          const token = res.data.token || userData.token;

          if (userData && token) {
            saveAuthSession(userData, token);

            // Navigate based on user role
            const userRole = userData.role?.toLowerCase();
            if (userRole === 'admin') {
              navigate('/admin/dashboard');
            } else if (userRole === 'faculty') {
              navigate('/faculty/dashboard');
            } else {
              navigate('/resources');
            }
          } else {
            console.error('Backend response missing user or token:', res.data);
          }
        })
        .catch((err) => {
          console.error('OAuth authentication error:', err.response?.data || err.message);
          alert(err.response?.data?.message || 'Sign-in failed. Please try again.');
        })
        .finally(() => setLoading(false));
    }
  }, [navigate]);

  // --- EFFECT 2: Verify Existing Session / Token ---
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('code')) return;

      const token = localStorage.getItem('labToken');

      if (!token || token === 'undefined') {
        localStorage.removeItem('labUser');
        localStorage.removeItem('labToken');
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        // 🟢 Fix 1: Route endpoint includes /api/auth
        const res = await axios.get(`${BACKEND_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setUser(res.data);
        localStorage.setItem('labUser', JSON.stringify(res.data));
      } catch (err) {
        console.error('Session verification failed:', err.response?.data || err.message);

        if (err.response && err.response.status === 401) {
          localStorage.removeItem('labUser');
          localStorage.removeItem('labToken');
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, []);

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem('labUser');
    localStorage.removeItem('labToken');
    setUser(null);
    navigate('/Manual-login');
  };

  return (
    <AuthContext.Provider value={{ user, setUser, saveAuthSession, loading, handleLogout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to consume AuthContext cleanly
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};