import React from 'react';
import { NavLink } from 'react-router-dom';

export default function AdminSidebar({ user, handleLogout }) {
  // Navigation menu structure updated with student sidebar styling parameters
  const menuSections = [
    {
      title: 'MAIN',
      items: [
        { 
          path: '/admin/dashboard', 
          label: 'Dashboard', 
          icon: '🏠',
          textColor: 'text-[#10b981]', // Green
          hoverBorder: 'hover:border-[#10b981]/50',
          activeStyle: 'bg-[#122325]/90 border-[#10b981]/60 text-[#10b981] shadow-[0_0_15px_rgba(16,185,129,0.15)]',
          iconBoxBg: 'bg-[#1b2f2d]',
        },
      ],
    },
    {
      title: 'MANAGEMENT',
      items: [
        { 
          path: '/admin/labs', 
          label: 'Labs', 
          icon: '🏢',
          textColor: 'text-[#22d3ee]', // Cyan
          hoverBorder: 'hover:border-[#22d3ee]/50',
          activeStyle: 'bg-[#0e2430]/90 border-[#22d3ee]/60 text-[#22d3ee] shadow-[0_0_15px_rgba(34,211,238,0.15)]',
          iconBoxBg: 'bg-[#13303d]',
        },
        { 
          path: '/admin/resources', 
          label: 'Resources', 
          icon: '📦',
          textColor: 'text-[#c084fc]', // Purple
          hoverBorder: 'hover:border-[#c084fc]/50',
          activeStyle: 'bg-[#1e1c31]/90 border-[#a855f7]/60 text-[#c084fc] shadow-[0_0_15px_rgba(168,85,247,0.15)]',
          iconBoxBg: 'bg-[#2b1f3d]',
        },
        { 
          path: '/admin/users', 
          label: 'Users', 
          icon: '👥',
          textColor: 'text-[#38bdf8]', // Sky Blue
          hoverBorder: 'hover:border-[#38bdf8]/50',
          activeStyle: 'bg-[#121f31]/90 border-[#38bdf8]/60 text-[#38bdf8] shadow-[0_0_15px_rgba(56,189,248,0.15)]',
          iconBoxBg: 'bg-[#18283d]',
        },
      ],
    },
    {
      title: 'BOOKINGS',
      items: [
        { 
          path: '/admin/all-bookings', 
          label: 'All Bookings', 
          icon: '📘',
          textColor: 'text-[#f43f5e]', // Rose
          hoverBorder: 'hover:border-[#f43f5e]/50',
          activeStyle: 'bg-[#2a1622]/90 border-[#f43f5e]/60 text-[#f43f5e] shadow-[0_0_15px_rgba(244,63,94,0.15)]',
          iconBoxBg: 'bg-[#3a1d2d]',
        },
        { 
          path: '/admin/faculty-requests', 
          label: 'Faculty Requests', 
          icon: '👨‍🏫',
          textColor: 'text-[#fbbf24]', // Amber
          hoverBorder: 'hover:border-[#fbbf24]/50',
          activeStyle: 'bg-[#282116]/90 border-[#fbbf24]/60 text-[#fbbf24] shadow-[0_0_15px_rgba(251,191,36,0.15)]',
          iconBoxBg: 'bg-[#382b1c]',
        },
        { 
          path: '/admin/requests', 
          label: 'Student Requests', 
          icon: '🎓',
          textColor: 'text-[#f97316]', // Orange
          hoverBorder: 'hover:border-[#f97316]/50',
          activeStyle: 'bg-[#291b15]/90 border-[#f97316]/60 text-[#f97316] shadow-[0_0_15px_rgba(249,115,22,0.15)]',
          iconBoxBg: 'bg-[#3b231a]',
        },
      ],
    },
    {
      title: 'ANALYTICS',
      items: [
        { 
          path: '/admin/analytics', 
          label: 'Analytics', 
          icon: '📊',
          textColor: 'text-[#e879f9]', // Fuchsia
          hoverBorder: 'hover:border-[#e879f9]/50',
          activeStyle: 'bg-[#27172b]/90 border-[#e879f9]/60 text-[#e879f9] shadow-[0_0_15px_rgba(232,121,249,0.15)]',
          iconBoxBg: 'bg-[#371f3b]',
        },
      ],
    },
    {
      title: 'SYSTEM',
      items: [
        { 
          path: '/admin/notifications', 
          label: 'Notifications', 
          icon: '🔔',
          textColor: 'text-[#34d399]', // Teal
          hoverBorder: 'hover:border-[#34d399]/50',
          activeStyle: 'bg-[#122420]/90 border-[#34d399]/60 text-[#34d399] shadow-[0_0_15px_rgba(52,211,153,0.15)]',
          iconBoxBg: 'bg-[#163328]',
        },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-[#0a0d18] border-r border-slate-800/80 h-screen sticky top-0 flex flex-col px-4 py-5 font-sans select-none overflow-y-auto">
      
      {/* Top Header / Branding */}
      <div className="flex items-center gap-3 px-1 mb-8 mt-2">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#4f46e5] to-[#7c3aed] flex items-center justify-center text-white text-xl shadow-[0_0_18px_rgba(79,70,229,0.5)] shrink-0">
          🧪
        </div>
        <div className="flex flex-col">
          <span className="text-white font-bold text-base tracking-tight leading-tight">
            LabSync
          </span>
          <span className="text-[10px] font-bold text-indigo-400 tracking-wider uppercase bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 rounded w-max mt-0.5">
            Admin Portal
          </span>
        </div>
      </div>

      {/* Section Groups */}
      <div className="space-y-6 flex-1">
        {menuSections.map((section) => (
          <div key={section.title} className="flex flex-col gap-2">
            {/* Category Section Title */}
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400/80 px-2 mb-1">
              {section.title}
            </div>

            {/* Navigation Items */}
            <nav className="flex flex-col gap-2.5">
              {section.items.map((item) => (
                <NavLink
                  key={item.path}
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
                    <span className="text-sm select-none">{item.icon}</span>
                  </div>

                  {/* Nav Label */}
                  <span className="text-sm font-semibold tracking-wide">
                    {item.label}
                  </span>
                </NavLink>
              ))}
            </nav>
          </div>
        ))}
      </div>

      {/* Bottom Footer: Logout */}
      <div className="mt-8 pt-4 border-t border-slate-800/80">
        <button
          onClick={handleLogout}
          className="w-full group flex items-center gap-3.5 px-3.5 py-3 rounded-2xl border border-slate-800/80 bg-[#0f1424]/90 text-rose-500 hover:border-rose-500/50 hover:bg-[#15111c] transition-all duration-200"
        >
           <div className="w-8 h-8 rounded-xl bg-[#2a1622] flex items-center justify-center shrink-0 shadow-inner">
             <span className="text-sm select-none">🚪</span>
           </div>
          <span className="text-sm font-semibold tracking-wide">Logout</span>
        </button>
      </div>

    </aside>
  );
}