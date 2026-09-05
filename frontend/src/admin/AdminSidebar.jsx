import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function AdminSidebar({ user, handleLogout }) {
  const location = useLocation();

  // Navigation menu structure grouped by sections matching your wireframe
  const menuSections = [
    {
      title: 'MAIN',
      items: [
        { path: '/admin/dashboard', label: 'Dashboard', icon: '🏠' },
      ],
    },
    {
      title: 'MANAGEMENT',
      items: [
        { path: '/admin/labs', label: 'Labs', icon: '🏢' },
        { path: '/admin/resources', label: 'Resources', icon: '📦' },
        { path: '/admin/users', label: 'Users', icon: '👥' },
      ],
    },
    {
      title: 'BOOKINGS',
      items: [
        { path: '/admin/all-bookings', label: 'All Bookings', icon: '📘' },
        { path: '/admin/faculty-requests', label: 'Faculty Requests', icon: '🚀' },
        { path: '/admin/requests', label: 'Student Requests', icon: '🚀' },
        
      ],
    },
    {
      title: 'ANALYTICS',
      items: [
        { path: '/admin/analytics', label: 'Analytics', icon: '📊' },
      
      ],
    },
    {
      title: 'SYSTEM',
      items: [
        { path: '/admin/notifications', label: 'Notifications', icon: '🔔' },
       ],
    },
  ];

  return (
    <aside className="w-64 bg-[#0e1322] border-r border-gray-800 h-screen sticky top-0 flex flex-col justify-between p-4 select-none overflow-y-auto">
      
      {/* Top Header / Branding */}
      <div>
        <div className="flex items-center gap-2 px-3 py-3 mb-4 border-b border-gray-800">
          <span className="text-xl">🧪</span>
          <span className="text-lg font-bold text-gray-100 tracking-wide">
            LabSync
          </span>
          <span className="ml-auto text-[10px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded">
            ADMIN
          </span>
        </div>

        {/* Section Groups */}
        <div className="space-y-6">
          {menuSections.map((section) => (
            <div key={section.title}>
              {/* Category Section Title */}
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-500 px-3 mb-2">
                {section.title}
              </h4>

              {/* Navigation Items */}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const isActive = location.pathname === item.path;

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                        isActive
                          ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                          : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                      }`}
                    >
                      <span className="text-sm">{item.icon}</span>
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Footer: Logout */}
      <div className="pt-4 border-t border-gray-800 mt-6">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors"
        >
          <span className="text-sm">🚪</span>
          <span>Logout</span>
        </button>
      </div>

    </aside>
  );
}