import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../context/SocketContext';  

export default function NotificationBell() {
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
 
  const { notifications, unreadCount, markAsRead } = useSocket();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (id, readStatus) => {
    if (!readStatus) {
      markAsRead(id);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title="Notifications"
        className="relative p-2 text-gray-400 hover:text-gray-100 bg-[#161b2c] hover:bg-gray-800 border border-gray-800 rounded-lg text-sm transition-colors flex items-center justify-center"
      >
        <span>🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-indigo-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button> 

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#111625] border border-gray-800 rounded-xl shadow-2xl z-50 overflow-hidden">
          {/* Dropdown Header */}
          <div className="p-3.5 border-b border-gray-800 flex items-center justify-between bg-[#0e1322]">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-gray-100">Notifications</h3>
              {unreadCount > 0 && (
                <span className="text-[10px] bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded-full font-medium">
                  {unreadCount} new
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                navigate('/notifications');
              }}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
            >
              View All →
            </button>
          </div>

          {/* Dropdown List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-gray-800/60">
            {notifications && notifications.length > 0 ? (
              notifications.slice(0, 5).map((item) => {
                const isCanceled = item.type === 'BOOKING_CANCELED';
                return (
                  <div
                    key={item._id || item.createdAt || Math.random()}
                    onClick={() => handleNotificationClick(item._id, item.read)}
                    className={`p-3 transition-colors cursor-pointer text-left flex items-start gap-3 ${
                      !item.read ? 'bg-[#161d31]/80' : 'hover:bg-[#161b2c]/50'
                    }`}
                  >
                    <span className="text-base mt-0.5">
                      {isCanceled ? '🚫' : '✅'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-gray-200 truncate">
                          {item.title}
                        </p>
                        {!item.read && (
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0"></span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-2 leading-relaxed">
                        {item.message}
                      </p>
                      <span className="text-[9px] text-gray-500 mt-1 block">
                        {item.createdAt
                          ? new Date(item.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'Just now'}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-xs text-gray-500">
                No notifications yet.
              </div>
            )}
          </div>

          {/* Dropdown Footer */}
          {notifications && notifications.length > 0 && (
            <div className="p-2.5 bg-[#0e1322] border-t border-gray-800 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  navigate('/notifications');
                }}
                className="text-xs font-semibold text-gray-300 hover:text-white transition-colors"
              >
                Go to Notification Center
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}