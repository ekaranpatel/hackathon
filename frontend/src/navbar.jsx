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
    <header className="sticky top-4 z-50 w-full px-4 sm:px-8 max-w-[1440px] mx-auto">
      {/* Outer Floating Pill Bar with Gradient Border & Deep Glow */}
      <nav className="relative flex items-center justify-between gap-4 sm:gap-6 px-5 py-3 rounded-2xl bg-gradient-to-r from-[#030b20] via-[#05102d] to-[#040c24] border border-cyan-500/40 shadow-[0_10px_35px_rgba(0,0,0,0.6),0_0_20px_rgba(6,182,212,0.15)] backdrop-blur-xl">
        
        {/* Ambient Top Glow Line */}
        <div className="absolute inset-x-8 -top-[1px] h-[1px] bg-gradient-to-r from-cyan-400 via-indigo-500 to-fuchsia-500 opacity-75 pointer-events-none" />

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
          {/* Glass-style 'L' icon */}
          <div className="w-10 h-10 rounded-xl bg-gradient-to-b from-[#3b82f6] to-[#8b5cf6] p-[1.5px] shadow-[0_0_18px_rgba(59,130,246,0.5)]">
            <div className="w-full h-full rounded-[10px] bg-gradient-to-b from-blue-500/90 to-indigo-600/90 flex items-center justify-center font-extrabold text-white text-lg tracking-tight">
              L
            </div>
          </div>
          <span className="font-bold text-xl text-white tracking-normal font-sans">
            LabDynamix
          </span>
        </div>

        {/* 2. Search Bar with Glowing Edge */}
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
                placeholder="Search labs, books, resources..."
                className="w-full bg-transparent pl-3 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-400 focus:outline-none"
              />
            </div>
          </div>
        </form>

        {/* 3. Actions: Notifications, Theme Toggle, Auth CTA */}
        <div className="flex items-center gap-3 shrink-0">
          
          {/* Notification Button with Badge */}
          <button 
            type="button"
            className="relative p-2.5 rounded-xl bg-slate-900/60 border border-blue-500/30 hover:border-blue-400/60 text-slate-300 hover:text-white transition-all duration-150"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-gradient-to-r from-rose-500 to-indigo-500 text-[10px] font-bold text-white shadow-[0_0_8px_rgba(244,63,94,0.7)]">
              3
            </span>
          </button>

          {/* Dark Mode Moon Button */}
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
              {/* Key Icon */}
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