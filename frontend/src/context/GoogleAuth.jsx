import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { BACKEND_URL } from "../pages/Api";

export function UserLogin() {
  const navigate = useNavigate();
  const oauthProcessedRef = useRef(false); // 🟢 FIX 1: Prevents double execution in React Strict Mode

  // Initialize state directly from localStorage
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('labUser');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [loading, setLoading] = useState(false);

  // --- EFFECT 1: Process Google OAuth Redirect Code ---
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    // Run only if code exists AND hasn't been processed yet
    if (code && !oauthProcessedRef.current) {
      oauthProcessedRef.current = true;
      setLoading(true);

      // Clean the ?code= parameter from browser URL immediately
      window.history.replaceState({}, document.title, window.location.pathname);

      // 🟢 FIX 2: Send redirect_uri along with code to fix 'unauthorized_client'
      const redirectUri = window.location.origin; // e.g. "http://localhost:5173"

      axios.post(`${BACKEND_URL}/auth/google`, { 
        code, 
        redirect_uri: redirectUri 
      })
        .then((res) => {
          const userData = res.data.user || res.data;
          const token = res.data.token || userData.token;

          if (userData && token) {
            localStorage.setItem('labUser', JSON.stringify(userData));
            localStorage.setItem('labToken', token);

            setUser(userData);

            // Navigate based on role
            const userRole = userData.role?.toLowerCase();
            if (userRole === 'admin') {
              navigate('/admin/dashboard');
            } else if (userRole === 'faculty') {
              navigate('/faculty/dashboard');
            } else {
              navigate('/resources');
            }
          } else {
            console.error("Backend response missing user or token:", res.data);
          }
        })
        .catch((err) => {
          console.error("OAuth authentication error:", err.response?.data || err.message);
          alert("Sign-in failed. Please try again.");
        })
        .finally(() => setLoading(false));
    }
  }, [navigate]);

  // --- EFFECT 2: Verify Existing Session / Token ---
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      // Skip session check if an incoming OAuth code is being processed
      if (urlParams.get('code')) return;

      const token = localStorage.getItem('labToken');

      // Guard against missing or "undefined" string tokens
      if (!token || token === 'undefined' || token === 'null') {
        localStorage.removeItem('labUser');
        localStorage.removeItem('labToken');
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get(`${BACKEND_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        setUser(res.data);
        localStorage.setItem('labUser', JSON.stringify(res.data));
      } catch (err) {
        console.error("Session verification failed:", err.response?.data || err.message);
        
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
    navigate('/');
  };

  return { user, setUser, loading, handleLogout };
}