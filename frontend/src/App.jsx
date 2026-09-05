import React from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import StudentDashboard from '../src/student/components/StudentDashboard';  
import NotificationBell from '../src/student/components/NotificationBell';
import Navbar from '../src/navbar';
import MyBookings from '../src/student/pages/MyBooking';
import Sidebar from '../src/student/components/Sidebar';
import Loginpage from '../src/student/pages/Loginpage';
import StudentResourcePage from '../src/student/pages/Studentresource';
import ResourceDetails from '../src/student/pages/ResourceDetailpage';      
import { useAuth } from './context/Authcontext'; 

export default function App() {
  const { user, loading, handleLogout } = useAuth();
  const location = useLocation();

  const hasOAuthCode = new URLSearchParams(location.search).has('code');

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090d16] flex items-center justify-center text-indigo-400 font-bold gap-2">
        <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        Authenticating session with backend...
      </div>
    );
  } 

  const role = user?.role?.toLowerCase() || 'student';
  const isAdmin = role === 'admin';
  const isFaculty = role === 'faculty';

  const getInitialRedirect = () => {
    if (isAdmin) return '/admin/dashboard';
    if (isFaculty) return '/faculty/dashboard';
    return '/resources';  
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-gray-100 flex flex-col">
      {/* ToastContainer placed at top level to ensure high z-index fixed positioning */}
      <ToastContainer 
        position="top-right"
        theme="dark" 
        autoClose={3000} 
        pauseOnHover 
        closeOnClick 
      />

      <Navbar user={user} handleLogout={handleLogout} />

      <div className="flex flex-1 overflow-hidden">
        {/* Render Sidebars based on Role */}
        {isAdmin && <AdminSidebar user={user} handleLogout={handleLogout} />}
        {isFaculty && <FacultySidebar user={user} handleLogout={handleLogout} />}
        {!isAdmin && !isFaculty && <Sidebar user={user} />}

        <main className="flex-1 p-6 overflow-y-auto">
          <Routes>
            {/* Root Route Handler */}
            <Route 
              path="/" 
              element={
                hasOAuthCode ? (
                  <div className="text-indigo-400 font-semibold p-4">Processing Google Login...</div>
                ) : (
                  <Navigate to={getInitialRedirect()} replace />
                )
              } 
            />

            {/* Student / Shared Routes */}
            <Route path="/resources" element={<StudentResourcePage user={user} />} />
            <Route path="/Manual-login" element={<Loginpage />} />
            
        
            
          <Route path="/student/dashboard" element={<StudentDashboard user={user} />} />
            <Route path="/notifications" element={<NotificationBell />} />
            <Route path="/my-bookings" element={<MyBookings user={user} />} /> 

             
            {/* Faculty Protected Routes */}
            
            {/* Catch-all Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}