import React from 'react';
import { NavLink } from 'react-router-dom';

export default function Sidebar() {
  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      path: '/student/dashboard',
      textColor: 'text-[#10b981]',
      hoverBorder: 'hover:border-[#10b981]/50',
      activeStyle: 'bg-[#122325]/90 border-[#10b981]/60 text-[#10b981] shadow-[0_0_15px_rgba(16,185,129,0.15)]',
      iconBoxBg: 'bg-[#1b2f2d]',
      icon: (
        <div className="grid grid-cols-2 gap-0.5 w-3.5 h-3.5">
          <span className="w-1.5 h-1.5 rounded-[2px] bg-[#f43f5e]" />
          <span className="w-1.5 h-1.5 rounded-[2px] bg-[#06b6d4]" />
          <span className="w-1.5 h-1.5 rounded-[2px] bg-[#10b981]" />
          <span className="w-1.5 h-1.5 rounded-[2px] bg-[#a855f7]" />
        </div>
      ),
    },
    {
      id: 'resources',
      label: 'Resources',
      path: '/resources',
      textColor: 'text-[#22d3ee]',
      hoverBorder: 'hover:border-[#22d3ee]/50',
      activeStyle: 'bg-[#0e2430]/90 border-[#22d3ee]/60 text-[#22d3ee] shadow-[0_0_15px_rgba(34,211,238,0.15)]',
      iconBoxBg: 'bg-[#13303d]',
      icon: (
        <svg className="w-4 h-4 text-[#22d3ee]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 5H9L8 4z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 2v2m4-2v2" />
        </svg>
      ),
    },
    {
      id: 'my-bookings',
      label: 'My Bookings',
      path: '/my-bookings',
      textColor: 'text-[#c084fc]',
      hoverBorder: 'hover:border-[#c084fc]/50',
      activeStyle: 'bg-[#1e1c31]/90 border-[#a855f7]/60 text-[#c084fc] shadow-[0_0_15px_rgba(168,85,247,0.15)]',
      iconBoxBg: 'bg-[#2b1f3d]',
      icon: (
        <span className="w-3.5 h-3.5 rounded-full bg-[#f43f5e] shadow-[0_0_6px_rgba(244,63,94,0.7)] flex items-center justify-center">
          <span className="w-1.5 h-1.5 rounded-full bg-white/90" />
        </span>
      ),
    },
    {
      id: 'schedule',
      label: 'Schedule',
      path: '/calendar',
      textColor: 'text-[#38bdf8]',
      hoverBorder: 'hover:border-[#38bdf8]/50',
      activeStyle: 'bg-[#121f31]/90 border-[#38bdf8]/60 text-[#38bdf8] shadow-[0_0_15px_rgba(56,189,248,0.15)]',
      iconBoxBg: 'bg-[#18283d]',
      icon: (
        <svg className="w-4 h-4 text-[#38bdf8]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      ),
    },
    {
      id: 'notifications',
      label: 'Notifications',
      path: '/notifications',
      textColor: 'text-[#34d399]',
      hoverBorder: 'hover:border-[#34d399]/50',
      activeStyle: 'bg-[#122420]/90 border-[#34d399]/60 text-[#34d399] shadow-[0_0_15px_rgba(52,211,153,0.15)]',
      iconBoxBg: 'bg-[#163328]',
      icon: <span className="text-sm select-none">🔔</span>,
    },
  ];

  return (
    <aside className="w-64 bg-[#0a0d18] border-r border-slate-800/80 min-h-screen px-4 py-5 flex flex-col gap-2 font-sans select-none">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-1 mb-4">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#3b82f6] to-[#2563eb] flex items-center justify-center text-white font-extrabold text-lg shadow-[0_0_18px_rgba(37,99,235,0.6)] shrink-0">
          L
        </div>
        <div className="flex flex-col">
          <span className="text-white font-bold text-base tracking-tight leading-tight">
            CampusVault
          </span>
          <span className="text-[10px] font-bold text-cyan-400 tracking-wider uppercase">
            Student Portal
          </span>
        </div>
      </div>

      {/* Section Subtitle */}
      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400/80 px-2 mt-1 mb-1">
        Navigation Sidebar
      </div>

      {/* Menu Cards */}
      <nav className="flex flex-col gap-2.5">
        {menuItems.map((item) => (
          <NavLink
            key={item.id}
            to={item.path}
            className={({ isActive }) =>
              `group flex items-center gap-3.5 px-3.5 py-3 rounded-2xl border transition-all duration-200 ${
                isActive
                  ? item.activeStyle
                  : `bg-[#0f1424]/90 border-slate-800/80 ${item.textColor} ${item.hoverBorder} hover:bg-[#131a30]`
              }`
            }
          >
            {/* Square Icon Pill */}
            <div className={`w-8 h-8 rounded-xl ${item.iconBoxBg} flex items-center justify-center shrink-0 shadow-inner`}>
              {item.icon}
            </div>

            {/* Nav Label */}
            <span className="text-sm font-semibold tracking-wide">
              {item.label}
            </span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}