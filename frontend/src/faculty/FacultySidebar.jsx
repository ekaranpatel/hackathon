import React from 'react';
import { NavLink } from 'react-router-dom';

export default function FacultySidebar({ user, handleLogout }) {
  const location = useLocation();

  // Top featured card routes with specialized styles
  const topFeaturedItems = [
    {
      path: '/faculty/dashboard',
      label: 'Dashboard',
      icon: (
        <span className="text-sm select-none filter drop-shadow-[0_0_6px_rgba(192,132,252,0.8)]">
          🏠
        </span>
      ),
      activeStyle:
        'bg-[#191533] border-purple-500/70 text-purple-200 shadow-[0_0_20px_rgba(168,85,247,0.25)]',
      inactiveStyle:
        'bg-[#121124]/90 border-purple-500/40 text-purple-200 hover:border-purple-400/80 hover:bg-[#181530]',
      iconBoxBg: 'bg-[#261f47]',
    },
    {
      path: '/faculty/my-labs',
      label: 'My Labs',
      icon: (
        <span className="text-sm select-none filter drop-shadow-[0_0_6px_rgba(52,211,153,0.8)]">
          📊
        </span>
      ),
      activeStyle:
        'bg-gradient-to-r from-[#1ae3a8] to-[#10b981] border-emerald-300 text-slate-950 font-bold shadow-[0_0_25px_rgba(16,185,129,0.4)]',
      inactiveStyle:
        'bg-gradient-to-r from-[#1fe2a4] to-[#10b981] border-emerald-400/60 text-slate-950 font-bold hover:brightness-105',
      iconBoxBg: 'bg-emerald-950/20 text-slate-950',
    },
    {
      path: '/faculty/my-booking',
      label: 'My Bookings',
      icon: (
        <span className="text-sm select-none filter drop-shadow-[0_0_6px_rgba(244,63,94,0.8)]">
          📅
        </span>
      ),
      activeStyle:
        'bg-[#0b1c1e] border-[#10b981] text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.25)]',
      inactiveStyle:
        'bg-[#081518]/90 border-emerald-500/50 text-emerald-300 hover:border-emerald-400 hover:bg-[#0c1f22]',
      iconBoxBg: 'bg-[#122828]',
    },
  ];

  // Lower menu sections
  const menuSections = [
    {
      title: 'BOOKINGS',
      items: [
        {
          path: '/faculty/book-lab',
          label: 'Book Lab',
          icon: (
            <div className="w-6 h-6 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.4)]">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 12l10 10 10-10L12 2zm0 3.8L18.2 12 12 18.2 5.8 12 12 5.8z" />
              </svg>
            </div>
          ),
          badge: null,
        },
        {
          path: '/faculty/requests',
          label: 'Booking Requests',
          icon: (
            <div className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.4)]">
              <span className="text-xs">📋</span>
            </div>
          ),
          badge: '4',
        },
        {
          path: '/faculty/approved',
          label: 'Approved Bookings',
          icon: (
            <div className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.4)]">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          ),
          badge: null,
        },
        {
          path: '/faculty/calendar',
          label: 'Lab Schedule',
          icon: (
            <div className="w-6 h-6 rounded-lg bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-300 shadow-[0_0_8px_rgba(56,189,248,0.4)]">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
          ),
          badge: null,
        },
      ],
    },
    {
      title: 'SYSTEM',
      items: [
        {
          path: '/faculty/notifications',
          label: 'Notifications',
          icon: (
            <div className="w-6 h-6 rounded-lg bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
              <span className="text-xs">🔔</span>
            </div>
          ),
          badge: 'dot',
        },
      ],
    },
  ];

  return (
    <aside className="w-64 min-h-screen mt-6 rounded-2xl h-screen sticky top-0 px-4 py-5 flex flex-col font-sans select-none border-r border-white/10 bg-gradient-to-br from-white/5 to-zinc-900/80 transition-all duration-300 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      
      {/* Brand Header */}
      
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