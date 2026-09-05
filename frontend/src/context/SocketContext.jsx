import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { useAuth } from './Authcontext';
import { BACKEND_URL } from '../student/pages/Api';

const SOCKET_URL = BACKEND_URL ? BACKEND_URL.replace(/\/api\/?$/, '') : 'http://localhost:5000';

const getToken = () => localStorage.getItem('labToken') || localStorage.getItem('token');

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem('labUser') || localStorage.getItem('user') || '{}');
  } catch {
    return {};
  }
};

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();

  const storedUser = getStoredUser();
  const currentUser = user || storedUser;
  const activeUserId = currentUser?._id || currentUser?.id;

  // Track latest user object in a ref to avoid socket reconnect loops on reference changes
  const userRef = useRef(currentUser);
  useEffect(() => {
    userRef.current = currentUser;
  }, [currentUser]);

  // Fetch initial notifications from REST endpoint
  const fetchNotifications = useCallback(async () => {
    const token = getToken();
    if (!token || !activeUserId) return;

    try {
      const res = await axios.get(`${BACKEND_URL}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data?.success) {
        const list = res.data.notifications || [];
        setNotifications(list);
        setUnreadCount(list.filter((n) => !n.read && !n.isRead).length);
      }
    } catch (err) {
      console.error('Failed to fetch initial notifications:', err);
    }
  }, [activeUserId]);

  useEffect(() => {
    if (!activeUserId) return;

    fetchNotifications();

    const newSocket = io(SOCKET_URL, {
      query: { userId: String(activeUserId) },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      withCredentials: true,
    });

    newSocket.on('connect', () => {
      console.log('⚡ Socket Connected! ID:', newSocket.id);

      const latestUser = userRef.current;
      newSocket.emit('join_user_room', String(activeUserId));

      if (latestUser && (latestUser.category || latestUser.department || latestUser.role)) {
        newSocket.emit('join_room', latestUser);
      }
    });

    newSocket.on('connect_error', (err) => {
      console.error('❌ Socket Connection Error:', err.message);
    });

    // Deduplicate incoming websocket payloads before updating state
    const handleIncomingNotification = (rawNotif, customEventName = null) => {
      const notifId = String(rawNotif._id || rawNotif.bookingId || rawNotif.id || `notif-${Date.now()}`);

      setNotifications((prev) => {
        const exists = prev.some((n) => String(n._id || n.id) === notifId);
        if (exists) return prev;

        setUnreadCount((count) => count + 1);
        return [
          {
            _id: notifId,
            title: rawNotif.title || 'Notification',
            message: rawNotif.message || '',
            type: rawNotif.type || 'INFO',
            read: false,
            createdAt: rawNotif.createdAt || new Date().toISOString(),
          },
          ...prev,
        ];
      });

      if (customEventName) {
        window.dispatchEvent(new CustomEvent(customEventName, { detail: rawNotif }));
      }
    };

    // Socket Event Listeners
    newSocket.on('notification_received', (data) => {
      handleIncomingNotification(data);
    });

    newSocket.on('NEW_BOOKING_REQUEST', (data) => {
      handleIncomingNotification(
        {
          ...data,
          title: data.title || 'New Booking Request',
          message: data.message || `New booking request from ${data.studentName || 'a student'}.`,
          type: 'BOOKING_PLACED',
        },
        'newBookingRequest'
      );
    });

    const handleBookingStatusUpdate = (data) => {
      handleIncomingNotification(
        {
          ...data,
          title: `Booking ${data.status}`,
          message: data.message || `Your booking request was ${data.status?.toLowerCase()}.`,
          type: data.type || 'STATUS_CHANGE',
        },
        'bookingStatusUpdated'
      );
    };

    newSocket.on('BOOKING_STATUS_UPDATED', handleBookingStatusUpdate);
    newSocket.on('booking_status_changed', handleBookingStatusUpdate);

    const handleSlotUpdate = (data) => {
      window.dispatchEvent(new CustomEvent('slotUpdated', { detail: data }));
    };

    newSocket.on('slot_updated', handleSlotUpdate);
    newSocket.on('slotUpdated', handleSlotUpdate);

    setSocket(newSocket);

    return () => {
      newSocket.off('connect');
      newSocket.off('connect_error');
      newSocket.off('notification_received');
      newSocket.off('NEW_BOOKING_REQUEST');
      newSocket.off('BOOKING_STATUS_UPDATED');
      newSocket.off('booking_status_changed');
      newSocket.off('slot_updated');
      newSocket.off('slotUpdated');
      newSocket.disconnect();
    };
  }, [activeUserId, fetchNotifications]);

  const markAsRead = async (id = null) => {
    const token = getToken();

    if (id) {
      // Optimistic UI update
      setNotifications((prev) =>
        prev.map((n) => (String(n._id || n.id) === String(id) ? { ...n, read: true, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      try {
        await axios.put(
          `${BACKEND_URL}/notifications/${id}/read`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (err) {
        console.error('Failed to mark notification as read:', err);
        fetchNotifications();
      }
    } else {
      setUnreadCount(0);
    }
  };

  const markAllAsRead = async () => {
    const token = getToken();
    if (!token) return;

    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true, isRead: true })));

    try {
      await axios.put(
        `${BACKEND_URL}/notifications/mark-all-read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error('Failed to mark all as read:', err);
      fetchNotifications();
    }
  };

  const clearNotifications = useCallback(async () => {
    const token = getToken();
    if (!token) return;

    setNotifications([]);
    setUnreadCount(0);

    try {
      await axios.delete(`${BACKEND_URL}/notifications/clear-all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (error) {
      console.error('Error clearing notifications:', error);
      fetchNotifications();
    }
  }, [fetchNotifications]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        clearNotifications,
        fetchNotifications,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    return {
      socket: null,
      notifications: [],
      unreadCount: 0,
      markAsRead: () => {},
      markAllAsRead: () => {},
      clearNotifications: () => {},
      fetchNotifications: () => {},
    };
  }
  return context;
};