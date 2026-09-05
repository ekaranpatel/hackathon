import React from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import StudentDashboard from '../src/student/components/StudentDashboard';
import Navbar from './navbar';
import Sidebar from '../src/student/components/Sidebar';      
import AdminSidebar from '../src/admin/AdminSidebar';   
import AdminDashboard from '../src/admin/AdminDashboard';
import StudentResourcePage from './student/pages/studentresource';
import AdminResource from "./admin/pages/AdminResource";  
import AdminUsers from "./admin/pages/AdminUser";
import FacultySidebar from "./faculty/FacultySidebar";
import FacultyDashboard from "./faculty/pages/FacultyDash";
import Loginpage from "./student/pages/Loginpage";
import NotificationBell from "./student/components/NotificationBell";
import Lab from "./admin/pages/Lab";
import AllBookings from "./admin/pages/AllBookings"
import FacultyApprovedBookings from "./faculty/pages/facultyapproved";
import ResourceDetails from "./student/pages/ResourceDetailpage";
import FacultyLab from "./faculty/pages/FacultyLabs";
import BookingDetail from "./student/pages/BookingDetail";
import AdminFacultyRequest from "./admin/pages/FacultyRequest"
import StudentRequest from "./admin/pages/StudentRequest";
import MyBookings from "./student/pages/MyBooking";
import FacultyNOtifications from "./faculty/pages/Notification";
import StudentBookingRequest from "./faculty/pages/Bookingrequest";
import Labbooking from "./faculty/pages/Labbooking"
import Labschedule from "./faculty/pages/Labschedule"
import BookinglabDetail from "./faculty/pages/BookinglabDetail"
import ScheduleDetail from './faculty/pages/Scheduledetail'
import FacultyLabBooking from "./faculty/pages/Labbooking"
import { useAuth } from '../src/context/Authcontext'; 

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
            
            {/* Support both singular and plural paths to prevent redirect wipes */}
            <Route path="/resource/:id" element={<ResourceDetails user={user} />} />
            <Route path="/resources/:id" element={<ResourceDetails user={user} />} />
            <Route path="/student/dashboard" element={<StudentDashboard user={user} />} />
            <Route path="/notifications" element={<NotificationBell />} />
            <Route path="/my-bookings" element={<MyBookings user={user} />} />

            <Route path="/booking/:id" element={<BookingDetail user={user} />} />
            {/* Faculty Protected Routes */}
            <Route 
              path="/faculty/dashboard" 
              element={isFaculty ? <FacultyDashboard user={user} /> : <Navigate to="/" replace />} 
            /> 
            <Route 
              path="/faculty/my-labs" 
              element={isFaculty ? <FacultyLab user={user} /> : <Navigate to="/" replace />} 
            />
            <Route 
              path="/faculty/requests" 
              element={isFaculty ? <StudentBookingRequest user={user} /> : <Navigate to="/" replace />} />
            <Route path="/faculty/approved" 
              element={isFaculty ? <FacultyApprovedBookings user={user} /> : <Navigate to="/" replace />} 
            />
            <Route 
              path="/faculty/notifications" 
              element={isFaculty ? <FacultyNOtifications user={user} /> : <Navigate to="/" replace />} 
            />
            
            <Route 
              path="/faculty/book-lab" 
              element={isFaculty ? <Labbooking user={user} /> : <Navigate to="/" replace />} 
            />
            <Route 
              path="/faculty/calendar" 
              element={isFaculty ? <Labschedule user={user} /> : <Navigate to="/" replace />} 
            />
            <Route 
              path="/faculty/:id/bookinglabdetail" 
              element={isFaculty ? <BookinglabDetail user={user} /> : <Navigate to="/" replace />} 
            />
            <Route 
              path="/faculty/my-booking" 
              element={isFaculty ? <FacultyLabBooking user={user} /> : <Navigate to="/" replace />} 
            />
            <Route 
              path="/faculty/Shedule-detail/:id" 
              element={isFaculty ? <ScheduleDetail user={user} /> : <Navigate to="/" replace />} 
            />
            
            
            {/* Admin Protected Routes */}
            <Route 
              path="/admin/dashboard" 
              element={isAdmin ? <AdminDashboard user={user} /> : <Navigate to="/" replace />} 
            />
            <Route 
              path="/admin/labs" 
              element={isAdmin ? <Lab user={user} /> : <Navigate to="/" replace />} 
            />
            <Route 
              path="/admin/resources" 
              element={isAdmin ? <AdminResource user={user} /> : <Navigate to="/" replace />} 
            />
            <Route 
              path="/admin/users" 
              element={isAdmin ? <AdminUsers user={user} /> : <Navigate to="/" replace />} 
            />
            <Route 
              path="/admin/requests" 
              element={isAdmin ? <StudentRequest user={user} /> : <Navigate to="/" replace />} 
            />
            <Route 
              path="/admin/faculty-requests" 
              element={isAdmin ? < AdminFacultyRequest  user={user} /> : <Navigate to="/" replace />} 
            />
            <Route 
              path="/admin/all-bookings" 
              element={isAdmin ? < AllBookings   user={user} /> : <Navigate to="/" replace />} 
            />

            {/* Catch-all Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}