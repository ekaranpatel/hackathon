import React from 'react';
import { NavLink } from 'react-router-dom'; // 1. Import NavLink

export default function Sidebar() {
  // 2. Add the 'path' property to each menu item
  const menuItems = [
    { id: 'timeline', label: 'Dashboard', icon: '📊', path: '/student/dashboard' },
    { id: 'equipments', label: 'Resources', icon: '🔬', path: '/resources' },
    { id: 'my-bookings', label: 'My Bookings', icon: '🎟️', path: '/my-bookings' },
    { id: 'schedule', label: 'Schedule', icon: '📅', path: '/calendar' },
    { id: 'notifications', label: 'Notifications', icon: '🔔', path: '/notifications' },
   
  ];

  return (
    <aside className="w-64 bg-[#0e1322] border-r border-gray-800 min-h-[calc(100vh-4rem)] p-4 hidden md:flex flex-col gap-1 sticky top-16">
      <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500 px-3 mb-2">
        Navigation Sidebar
      </div>
      
      {menuItems.map((item) => {
        return (
          <NavLink
            key={item.id}
            to={item.path} // 3. Change button to NavLink and pass path
            className={({ isActive }) => // 4. NavLink provides isActive out of the box
              `w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                isActive
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                  : 'text-gray-400 hover:text-gray-100 hover:bg-white/5'
              }`
            }
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </NavLink>
        );
      })}
    </aside>
  );
}
