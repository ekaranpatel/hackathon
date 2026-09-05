import React from 'react';
import { NavLink } from 'react-router-dom';

export default function FacultySidebar({ user, handleLogout }) {
<<<<<<< HEAD
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
=======
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
>>>>>>> 87c8d12102de5c29ec428441307be4c29bad3a9f
        },
      ],
    },
    {
      title: 'SYSTEM',
      items: [
<<<<<<< HEAD
        {
          path: '/faculty/notifications',
          label: 'Notifications',
          icon: (
            <div className="w-6 h-6 rounded-lg bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
              <span className="text-xs">🔔</span>
            </div>
          ),
          badge: 'dot',
=======
        { 
          path: '/faculty/notifications', 
          label: 'Notifications', 
          icon: '🔔',
          textColor: 'text-[#34d399]',
          hoverBorder: 'hover:border-[#34d399]/50',
          activeStyle: 'bg-[#122420]/90 border-[#34d399]/60 text-[#34d399] shadow-[0_0_15px_rgba(52,211,153,0.15)]',
          iconBoxBg: 'bg-[#163328]' 
>>>>>>> 87c8d12102de5c29ec428441307be4c29bad3a9f
        },
      ],
    },
  ];

  return (
<<<<<<< HEAD
    <aside className="w-64 bg-[#070b18] border-r border-slate-800/80 h-screen sticky top-0 flex flex-col justify-between p-3.5 select-none overflow-y-auto font-sans [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      
      {/* Top Header & Navigation Group */}
      <div className="space-y-4">
        
        {/* Brand Header */}
        <Link to="/" className="flex items-center gap-3 px-2 pt-2 pb-1 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-b from-[#3b82f6] to-[#6366f1] p-[1.5px] shadow-[0_0_18px_rgba(59,130,246,0.6)] group-hover:scale-105 transition-transform">
            <div className="w-full h-full rounded-[10px] bg-gradient-to-b from-blue-500 to-indigo-600 flex items-center justify-center text-white font-extrabold text-base">
              L
            </div>
          </div>
          <div className="flex flex-col text-left">
            <span className="font-extrabold text-lg text-white tracking-tight leading-none group-hover:text-cyan-300 transition-colors">
              CampusVault
            </span>
            <span className="text-[9px] font-bold text-cyan-400 tracking-wider uppercase mt-1">
              Faculty Console
            </span>
          </div>
        </Link>

        {/* Top 3 Featured Cards (Dashboard, My Labs, My Bookings) */}
        <div className="space-y-2.5 pt-1">
          {topFeaturedItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl border transition-all duration-200 ${
                  isActive ? item.activeStyle : item.inactiveStyle
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-xl ${item.iconBoxBg} flex items-center justify-center shrink-0 shadow-inner`}
                >
                  {item.icon}
                </div>
                <span className="text-xs font-bold tracking-wide">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Lower Grouped Menu Sections */}
        <div className="space-y-4 pt-2">
          {menuSections.map((section) => (
            <div key={section.title} className="space-y-1">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 px-3 mb-1.5">
                {section.title}
              </h4>

              <div className="space-y-1">
                {section.items.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`group flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 ${
                        isActive
                          ? 'bg-slate-800/80 text-white border border-slate-700/80 shadow-[0_0_12px_rgba(255,255,255,0.05)]'
                          : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.04]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {item.icon}
                        <span className="tracking-normal font-semibold">
                          {item.label}
                        </span>
                      </div>

                      {/* Pill Badge Counters / Indicator Dot */}
                      {item.badge === 'dot' ? (
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
                      ) : item.badge ? (
                        <span className="w-5 h-5 rounded-full bg-[#0a1e28] border border-cyan-500/60 text-cyan-300 text-[10px] font-bold flex items-center justify-center shadow-[0_0_8px_rgba(6,182,212,0.4)]">
                          {item.badge}
                        </span>
                      ) : null}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Faculty Profile Card & Logout Footer */}
      <div className="pt-3 border-t border-slate-800/80 mt-4">
        <div className="flex items-center justify-between p-2 rounded-2xl bg-[#0d1326]/90 border border-slate-800 shadow-md">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="relative shrink-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-600 p-[1px] shadow-[0_0_10px_rgba(6,182,212,0.3)]">
                <div className="w-full h-full bg-[#0c1020] rounded-[11px] flex items-center justify-center font-bold text-xs text-white">
                  {user?.name ? user.name.slice(0, 2).toUpperCase() : 'RV'}
                </div>
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-[#070b18] rounded-full shadow-[0_0_6px_#34d399]" />
            </div>

            <div className="flex flex-col text-left truncate leading-tight">
              <span className="text-xs font-bold text-white truncate">
                {user?.name || 'Dr. Robert Vance'}
              </span>
              <span className="text-[9px] text-slate-400 truncate">
                {user?.department || 'Dept of Computer Science & Robotics'}
              </span>
            </div>
          </div>

          <span className="px-2 py-0.5 rounded-md bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 text-[9px] font-bold shrink-0 ml-1">
            Verified
          </span>
        </div>

        {handleLogout && (
          <button
            onClick={handleLogout}
            className="w-full mt-2 py-1.5 px-3 rounded-xl text-[11px] font-semibold text-rose-400/90 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-all flex items-center justify-center gap-1.5"
          >
            <span>🚪</span>
            <span>Sign Out</span>
          </button>
        )}
=======
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
>>>>>>> 87c8d12102de5c29ec428441307be4c29bad3a9f
      </div>

    </aside>
  );
}