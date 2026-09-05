import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './context/Authcontext';
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
    <header className="sticky top-4 z-50 w-full px-4 sm:px-8 max-w-[1440px] mx-auto">
      {/* Outer Floating Pill Bar */}
      <nav className="relative flex items-center justify-between gap-4 sm:gap-6 px-5 py-3 rounded-2xl bg-gradient-to-r from-[#030b20] via-[#05102d] to-[#040c24] border border-cyan-500/40 shadow-[0_10px_35px_rgba(0,0,0,0.6),0_0_20px_rgba(6,182,212,0.15)] backdrop-blur-xl">
        
        {/* Ambient Top Glow Line */}
        <div className="absolute inset-x-8 -top-[1px] h-[1px] bg-gradient-to-r from-cyan-400 via-indigo-500 to-fuchsia-500 opacity-75 pointer-events-none" />

        {/* 1. Brand Logo & Title */}
        <div 
          onClick={() => navigate('/')} 
          className="flex items-center gap-3 cursor-pointer shrink-0"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-b from-[#3b82f6] to-[#8b5cf6] p-[1.5px] shadow-[0_0_18px_rgba(59,130,246,0.5)]">
            <div className="w-full h-full rounded-[10px] bg-gradient-to-b from-blue-500/90 to-indigo-600/90 flex items-center justify-center font-extrabold text-white text-lg tracking-tight">
              L
            </div>  
          </div>
          <span className="font-bold text-xl text-white tracking-normal font-sans hidden sm:inline-block">
            LabDynamix
          </span>
        </div>

        {/* 2. Global Glowing Search Bar */}
        <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-xl mx-4">
          <div className="relative w-full rounded-xl p-[1px] bg-gradient-to-r from-cyan-500/60 via-blue-500/30 to-purple-500/60 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
            <div className="relative flex items-center w-full bg-[#070e24]/90 rounded-xl">
              <span className="pl-4 text-cyan-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m1.85-5.65a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search labs, equipment, resources..."
                className="w-full bg-transparent pl-3 pr-4 py-2 text-sm text-slate-200 placeholder-slate-400 focus:outline-none"
              />
            </div>
          </div>
        </form>

        {/* 3. Actions: Notifications, Theme Toggle, Auth CTA */}
        <div className="flex items-center gap-3 shrink-0">
          
          {/* Notification Bell Component */}
          <NotificationBell />

          {/* Dark Mode Toggle Button */}
          <button 
            type="button"
            title="Toggle Theme"
            className="p-2.5 rounded-xl bg-slate-900/60 border border-blue-500/30 hover:border-blue-400/60 text-slate-300 hover:text-white transition-all duration-150"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          </button>

          {/* User Logged In / Sign In Button */}
          {user ? (
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-[0_0_12px_rgba(6,182,212,0.4)]">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <button 
                onClick={handleLogout}
                className="text-xs font-semibold text-rose-300 bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 px-3.5 py-2 rounded-xl transition-all"
              >
                Logout
              </button>
            </div>
          ) : (
            <button 
              onClick={() => navigate('/Manual-login')}  
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-[#0072ff] via-[#4d5bf7] to-[#b026ff] hover:brightness-110 active:scale-95 transition-all shadow-[0_0_20px_rgba(77,91,247,0.5)] border border-white/20"
            >
              <svg className="w-4 h-4 text-cyan-200" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              <span>Sign In / Login</span>
            </button>
          )}

        </div>
      </nav>
    </header>
  );
}