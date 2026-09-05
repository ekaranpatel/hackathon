import React, { useState, useMemo } from 'react';
import { useSocket } from '../../context/SocketContext';

// Notification classification helpers
const isRequestType = (item = {}) => {
  const typeUpper = (item.type || '').toUpperCase();
  const titleUpper = (item.title || '').toUpperCase();
  const statusUpper = (item.status || '').toUpperCase();

  return (
    typeUpper.includes('REQUEST') ||
    typeUpper.includes('BOOKING_PLACED') ||
    typeUpper.includes('NEW_BOOKING') ||
    typeUpper.includes('LAB_BOOKED') ||
    typeUpper.includes('PENDING') ||
    titleUpper.includes('NEW BOOKING') ||
    titleUpper.includes('LAB BOOKED') ||
    titleUpper.includes('REQUEST') ||
    statusUpper === 'PENDING'
  );
};

const isCanceledType = (item = {}) => {
  const typeUpper = (item.type || '').toUpperCase();
  const statusUpper = (item.status || '').toUpperCase();
  const titleUpper = (item.title || '').toUpperCase();

  return (
    typeUpper.includes('CANCEL') ||
    typeUpper.includes('REJECT') ||
    statusUpper === 'CANCELLED' ||
    statusUpper === 'REJECTED' ||
    titleUpper.includes('REJECTED') ||
    titleUpper.includes('CANCELLED')
  );
};

const isApprovedType = (item = {}) => {
  const typeUpper = (item.type || '').toUpperCase();
  const statusUpper = (item.status || '').toUpperCase();
  const titleUpper = (item.title || '').toUpperCase();

  return (
    typeUpper.includes('APPROV') ||
    statusUpper === 'APPROVED' ||
    titleUpper.includes('APPROVED')
  );
};

export default function FacultyNotificationPage({ onAction }) {
  const {
    notifications = [],
    unreadCount = 0,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    fetchNotifications,
  } = useSocket();

  const [filter, setFilter] = useState('all'); // 'all' | 'unread' | 'requests'
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Manual refresh with error handling
  const handleRefresh = async () => {
    if (!fetchNotifications) return;
    setIsRefreshing(true);
    try {
      await fetchNotifications();
    } catch (err) {
      console.error('Failed to sync notifications:', err);
    } finally {
      setTimeout(() => setIsRefreshing(false), 400);
    }
  };

  // Filter logic aligned with SocketContext property schemas
  const filteredNotifications = useMemo(() => {
    if (!Array.isArray(notifications)) return [];

    return notifications.filter((item) => {
      const isUnread = !item.read && !item.isRead;
      if (filter === 'unread') return isUnread;
      if (filter === 'requests') return isRequestType(item);
      return true;
    });
  }, [notifications, filter]);

  const formatTime = (dateString) => {
    if (!dateString) return 'Just now';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Just now';

    const diffInSeconds = Math.floor((new Date() - date) / 1000);
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-slate-950 text-slate-100 min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white">Faculty Notifications</h1>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                {unreadCount} new
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time student lab booking requests, approvals, and system alerts.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {fetchNotifications && (
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-all disabled:opacity-50"
              title="Refresh Notifications"
            >
              <svg
                className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
          )}

          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-3 py-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 rounded-lg transition-all whitespace-nowrap"
            >
              ✓ Mark all read
            </button>
          )}

          {notifications.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to clear all notifications?')) {
                  clearNotifications();
                }
              }}
              className="px-3 py-1.5 text-xs font-semibold text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-lg transition-all whitespace-nowrap"
            >
              Clear all
            </button>
          )}

          {/* Tab Filters */}
          <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                filter === 'all' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                filter === 'unread' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Unread ({unreadCount})
            </button>
            <button
              onClick={() => setFilter('requests')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                filter === 'requests' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Requests
            </button>
          </div>
        </div>
      </div>

      {/* Notifications Render List */}
      <div className="space-y-3">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((item, index) => {
            const isRead = Boolean(item.read || item.isRead);
            const notificationId = item._id || item.id;

            const isPending = isRequestType(item);
            const isCanceled = isCanceledType(item);
            const isApproved = isApprovedType(item);

            let cardStyle = 'bg-slate-900/60 border-slate-800 hover:border-slate-700';
            let statusIcon = '🔔';
            let badgeTag = null;

            if (isPending) {
              cardStyle = 'bg-amber-950/20 border-amber-900/40 hover:border-amber-700/60';
              statusIcon = '⏳';
              badgeTag = { text: 'Action Needed', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' };
            } else if (isCanceled) {
              cardStyle = 'bg-rose-950/20 border-rose-900/40 hover:border-rose-700/60';
              statusIcon = '🚫';
              badgeTag = { text: 'Rejected / Canceled', color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' };
            } else if (isApproved) {
              cardStyle = 'bg-emerald-950/20 border-emerald-900/40 hover:border-emerald-700/60';
              statusIcon = '✅';
              badgeTag = { text: 'Approved', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
            }

            return (
              <div
                key={notificationId || item.createdAt || `notif-${index}`}
                onClick={() => !isRead && notificationId && markAsRead(notificationId)}
                className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer relative ${cardStyle} ${
                  !isRead ? 'ring-1 ring-indigo-500/40 bg-slate-900' : 'opacity-75'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <span className="text-lg mt-0.5 shrink-0">{statusIcon}</span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-semibold text-slate-100">
                          {item.title || 'Notification Update'}
                        </h3>

                        {badgeTag && (
                          <span className={`px-1.5 py-0.5 text-[10px] font-medium border rounded ${badgeTag.color}`}>
                            {badgeTag.text}
                          </span>
                        )}

                        {!isRead && (
                          <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" title="Unread" />
                        )}
                      </div>

                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                        {item.message}
                      </p>

                      {/* Direct Action Handler for Pending Requests */}
                      {isPending && onAction && (
                        <div className="flex items-center gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => onAction('APPROVE', item)}
                            className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-md transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => onAction('REJECT', item)}
                            className="px-2.5 py-1 text-[11px] font-semibold bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 rounded-md transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className="text-[10px] text-slate-500 whitespace-nowrap">
                      {formatTime(item.createdAt)}
                    </span>

                    {!isRead && notificationId && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notificationId);
                        }}
                        className="text-[11px] font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-16 bg-slate-900/40 rounded-xl border border-dashed border-slate-800">
            <p className="text-xs text-slate-400">
              {filter === 'unread'
                ? 'No unread notifications.'
                : filter === 'requests'
                ? 'No pending booking requests.'
                : 'No notifications yet.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}