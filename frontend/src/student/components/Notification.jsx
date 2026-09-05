import React, { useState } from 'react';

import { useSocket } from '../../context/SocketContext';



export default function NotificationPage() {

  const { notifications, markAsRead, markAllAsRead, clearNotifications } = useSocket();

  const [filter, setFilter] = useState('all');



  const unreadCount = notifications.filter((n) => !n.read && !n.isRead).length;



  const filteredNotifications = notifications.filter((item) => {

    const isUnread = !item.read && !item.isRead;

    if (filter === 'unread') return isUnread;

    return true;

  });



  return (

    <div className="max-w-3xl mx-auto p-6 bg-slate-950 text-slate-100 min-h-screen">

      {/* Header */}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800 mb-6">

        <div>

          <h1 className="text-2xl font-bold tracking-tight text-white">Notifications</h1>

          <p className="text-xs text-slate-400 mt-1">

            Real-time updates regarding your resource bookings and cancellations.

          </p>

        </div>



        <div className="flex items-center gap-3">

          {/* Mark All as Read Button */}

          {unreadCount > 0 && (

            <button

              onClick={markAllAsRead}

              className="px-3 py-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 rounded-lg transition-all whitespace-nowrap"

            >

              ✓ Mark all as read

            </button>

          )}



          {/* Clear All Button */}

          {notifications.length > 0 && (

            <button

              onClick={clearNotifications}

              className="px-3 py-1.5 text-xs font-semibold text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-lg transition-all whitespace-nowrap"

            >

              Clear all

            </button>

          )}



          {/* Filter Controls */}

          <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800">

            <button

              onClick={() => setFilter('all')}

              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${

                filter === 'all'

                  ? 'bg-slate-800 text-white shadow-sm'

                  : 'text-slate-400 hover:text-slate-200'

              }`}

            >

              All ({notifications.length})

            </button>

            <button

              onClick={() => setFilter('unread')}

              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${

                filter === 'unread'

                  ? 'bg-slate-800 text-white shadow-sm'

                  : 'text-slate-400 hover:text-slate-200'

              }`}

            >

              Unread ({unreadCount})

            </button>

          </div>

        </div>

      </div>



      {/* List Section */}

      <div className="space-y-3">

        {filteredNotifications.length > 0 ? (

          filteredNotifications.map((item, index) => {

            const isRead = item.read || item.isRead;

            const notificationId = item._id || item.id;



            // Normalized status checks (case-insensitive)

            const statusUpper = (item.status || '').toUpperCase();

            const typeUpper = (item.type || '').toUpperCase();

            const titleUpper = (item.title || '').toUpperCase();



            const isCanceledOrRejected =

              typeUpper.includes('CANCEL') ||

              typeUpper.includes('REJECT') ||

              statusUpper === 'CANCELLED' ||

              statusUpper === 'REJECTED' ||

              titleUpper.includes('REJECTED') ||

              titleUpper.includes('CANCELLED');



            const isApproved =

              typeUpper.includes('APPROV') ||

              statusUpper === 'APPROVED' ||

              titleUpper.includes('APPROVED');



            // Card Style Variants

            let cardStyle = 'bg-slate-900/60 border-slate-800 hover:border-slate-700';

            let statusIcon = '🔔';



            if (isCanceledOrRejected) {

              cardStyle = 'bg-rose-950/20 border-rose-900/40 hover:border-rose-700/60';

              statusIcon = '🚫';

            } else if (isApproved) {

              cardStyle = 'bg-emerald-950/20 border-emerald-900/40 hover:border-emerald-700/60';

              statusIcon = '✅';

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

                    <span className="text-lg mt-0.5">{statusIcon}</span>

                    <div>

                      <div className="flex items-center gap-2">

                        <h3 className="text-sm font-semibold text-slate-100">

                          {item.title || 'Notification Update'}

                        </h3>

                        {!isRead && (

                          <span

                            className="w-2 h-2 rounded-full bg-indigo-500 shrink-0"

                            title="Unread"

                          ></span>

                        )}

                      </div>

                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">

                        {item.message}

                      </p>

                    </div>

                  </div>



                  <div className="flex flex-col items-end gap-2 shrink-0">

                    <span className="text-[10px] text-slate-500 whitespace-nowrap">

                      {item.createdAt

                        ? new Date(item.createdAt).toLocaleTimeString([], {

                            hour: '2-digit',

                            minute: '2-digit',

                          })

                        : 'Just now'}

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

              {filter === 'unread' ? 'No unread notifications.' : 'No notifications yet.'}

            </p>

          </div>

        )}

      </div>

    </div>

  );

}