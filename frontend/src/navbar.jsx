import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/Authcontext';
import NotificationBell from './student/components/NotificationBell';

export default function Navbar({ user: propUser, handleLogout: propLogout, onSearch }) {
  const navigate = useNavigate();
  const auth = useAuth() || {};

   const user = propUser || auth.user;
  const handleLogout = propLogout || auth.logout;

  const [searchTerm, setSearchTerm] = useState('');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (onSearch) onSearch(searchTerm);
  };

  return (
    <nav className="bg-[#0e1322] border-b border-gray-800 h-16 sticky top-0 z-50 px-4 sm:px-6 flex items-center justify-between shadow-md">
      {/* 1. Logo */}
      <div 
        className="flex items-center gap-2.5 cursor-pointer select-none"
        onClick={() => navigate('/')}
      >
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-black text-white text-sm shadow-sm">
          L
        </div>
        <span className="font-extrabold text-lg text-gray-100 tracking-tight">
          LabDynamix
        </span>
      </div>

      {/* 2. Global Search Bar */}
      <form onSubmit={handleSearchSubmit} className="hidden sm:block flex-1 max-w-md mx-6">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 text-xs">
            🔍
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search lab equipment, bookings, or token logs..."
            className="w-full bg-[#161b2c] border border-gray-800 rounded-lg pl-9 pr-4 py-1.5 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
      </form>

      {/* 3. Actions & Profile */}
      <div className="flex items-center gap-3 sm:gap-4">
     
        <NotificationBell />

        {/* Dark Mode */}
        <button 
          title="Toggle Theme"
          className="p-2 text-gray-400 hover:text-gray-100 bg-[#161b2c] hover:bg-gray-800 border border-gray-800 rounded-lg text-sm transition-colors"
        >
          🌙
        </button>

        <div className="h-6 w-px bg-gray-800 hidden sm:block"></div>

        {/* User Card */}
        <div className="flex items-center">
          {user ? (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm ring-2 ring-indigo-500/30">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>

              <div className="hidden md:flex flex-col text-left leading-tight">
                <span className="text-sm font-semibold text-gray-200 truncate max-w-[120px]">
                  {user.name ? user.name.split(' ')[0] : user.email?.split('@')[0]}
                </span>
                {user.role && (
                  <span className="text-[10px] text-indigo-400 font-medium capitalize">
                    {user.role}
                  </span>
                )}
              </div>

              <button 
                onClick={handleLogout} 
                className="ml-1 text-xs font-bold text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
              >
                <span>Logout</span>
                <span>🚪</span>
              </button>
            </div>
          ) : (
            <button 
              onClick={() => navigate('/Manual-login')}  
              className="text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-lg transition-colors shadow-sm flex items-center gap-1.5"
            >
              <span>🔑</span>
              <span>Sign In / Login</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}