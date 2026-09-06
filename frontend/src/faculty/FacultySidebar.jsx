import React from 'react';
import { NavLink } from 'react-router-dom';

export default function FacultySidebar({ user, handleLogout }) {
  // Faculty navigation menu sections grouped with new styling properties
  const menuSections = [
    {
      title: 'MAIN',
      items: [
        { 
          path: '/faculty/dashboard', 
          label: 'Dashboard', 
          icon: '🏠',
          textColor: 'text-[#10b981]',
          hoverBorder: 'hover:border-[#10b981]/50',
          activeStyle: 'bg-[#122325]/90 border-[#10b981]/60 text-[#10b981] shadow-[0_0_15px_rgba(16,185,129,0.15)]',
          iconBoxBg: 'bg-[#1b2f2d]' 
        },
      ],
    },
    {
      title: 'MANAGEMENT',
      items: [
        { 
          path: '/faculty/my-labs', 
          label: 'My Labs', 
          icon: '📊',
          textColor: 'text-[#22d3ee]',
          hoverBorder: 'hover:border-[#22d3ee]/50',
          activeStyle: 'bg-[#0e2430]/90 border-[#22d3ee]/60 text-[#22d3ee] shadow-[0_0_15px_rgba(34,211,238,0.15)]',
          iconBoxBg: 'bg-[#13303d]'
        },
        { 
          path: '/faculty/my-booking', 
          label: 'My Bookings', 
          icon: '📅',
          textColor: 'text-[#c084fc]',
          hoverBorder: 'hover:border-[#c084fc]/50',
          activeStyle: 'bg-[#1e1c31]/90 border-[#a855f7]/60 text-[#c084fc] shadow-[0_0_15px_rgba(168,85,247,0.15)]',
          iconBoxBg: 'bg-[#2b1f3d]' 
        },
      ],
    },
    {
      title: 'BOOKINGS',
      items: [
        { 
          path: '/faculty/book-lab', 
          label: 'Book Lab', 
          icon: '🔷',
          textColor: 'text-[#38bdf8]',
          hoverBorder: 'hover:border-[#38bdf8]/50',
          activeStyle: 'bg-[#121f31]/90 border-[#38bdf8]/60 text-[#38bdf8] shadow-[0_0_15px_rgba(56,189,248,0.15)]',
          iconBoxBg: 'bg-[#18283d]' 
        },
        { 
          path: '/faculty/requests', 
          label: 'Booking Requests', 
          icon: '📋',
          textColor: 'text-[#f472b6]',
          hoverBorder: 'hover:border-[#f472b6]/50',
          activeStyle: 'bg-[#311224]/90 border-[#f472b6]/60 text-[#f472b6] shadow-[0_0_15px_rgba(244,114,182,0.15)]',
          iconBoxBg: 'bg-[#3d182b]' 
        },
        { 
          path: '/faculty/approved', 
          label: 'Approved Bookings', 
          icon: '✅',
          textColor: 'text-[#fbbf24]',
          hoverBorder: 'hover:border-[#fbbf24]/50',
          activeStyle: 'bg-[#312a12]/90 border-[#fbbf24]/60 text-[#fbbf24] shadow-[0_0_15px_rgba(251,191,36,0.15)]',
          iconBoxBg: 'bg-[#3d3318]' 
        },
        { 
          path: '/faculty/calendar', 
          label: 'Lab Schedule', 
          icon: '📆',
          textColor: 'text-[#a78bfa]',
          hoverBorder: 'hover:border-[#a78bfa]/50',
          activeStyle: 'bg-[#1f1a30]/90 border-[#a78bfa]/60 text-[#a78bfa] shadow-[0_0_15px_rgba(167,139,250,0.15)]',
          iconBoxBg: 'bg-[#28213f]' 
        },
      ],
    },
    {
      title: 'SYSTEM',
      items: [
        { 
          path: '/faculty/notifications', 
          label: 'Notifications', 
          icon: '🔔',
          textColor: 'text-[#34d399]',
          hoverBorder: 'hover:border-[#34d399]/50',
          activeStyle: 'bg-[#122420]/90 border-[#34d399]/60 text-[#34d399] shadow-[0_0_15px_rgba(52,211,153,0.15)]',
          iconBoxBg: 'bg-[#163328]' 
        },
      ],
    },
  ];

  return (
    <aside className="w-64 min-h-screen h-screen sticky top-0 px-4 py-5 flex flex-col font-sans select-none border-r border-white/10 bg-gradient-to-br from-white/5 to-zinc-900/80 transition-all duration-300 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-1 mb-6 border-b border-white/5 pb-4">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white text-xl shadow-[0_0_18px_rgba(16,185,129,0.4)] shrink-0">
          🧪
        </div>
        <div className="flex flex-col">
          <span className="text-white font-bold text-base tracking-tight leading-tight">
            LabSync
          </span>
          <span className="text-[10px] font-bold text-emerald-400 tracking-wider uppercase">
            Faculty Portal
          </span>
        </div>
      </div>

      {/* Navigation Sections */}
      <nav className="flex flex-col gap-6 flex-grow">
        {menuSections.map((section) => (
          <div key={section.title} className="flex flex-col gap-2.5">
            {/* Section Subtitle */}
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400/80 px-2 mt-1 mb-1">
              {section.title}
            </div>

            {/* Menu Cards */}
            {section.items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `group flex items-center gap-3.5 px-3.5 py-3 rounded-2xl border transition-all duration-200 ${
                    isActive
                      ? item.activeStyle
                      : `bg-[#03021e]/90 border-slate-800/80 ${item.textColor} ${item.hoverBorder} hover:bg-[#131a30]`
                  }`
                }
              >
                {/* Square Icon Pill */}
                <div className={`w-8 h-8 rounded-xl ${item.iconBoxBg} flex items-center justify-center shrink-0 shadow-inner text-sm`}>
                  {item.icon}
                </div>

                {/* Nav Label */}
                <span className="text-sm font-semibold tracking-wide">
                  {item.label}
                </span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Bottom Footer: User Badge & Logout */}
      <div className="pt-4 mt-8 space-y-2 border-t border-white/10">
        {user && (
          <div className="px-3.5 py-3 rounded-2xl bg-[#03021e]/50 border border-slate-800/80 mb-2 flex flex-col">
            <p className="text-sm font-semibold text-gray-200 truncate">
              {user.name || 'Faculty Member'}
            </p>
            <p className="text-[11px] text-gray-500 truncate mt-0.5">
              {user.email || user.department || 'Faculty Dashboard'}
            </p>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="w-full group flex items-center gap-3.5 px-3.5 py-3 rounded-2xl border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 hover:border-rose-500/40 text-rose-400 transition-all duration-200"
        >
          <div className="w-8 h-8 rounded-xl bg-rose-500/10 flex items-center justify-center shrink-0 text-sm">
            🚪
          </div>
          <span className="text-sm font-semibold tracking-wide">Logout</span>
        </button>
      </div>

    </aside>
  );
}