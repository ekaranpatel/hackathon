


const { Server } = require('socket.io');

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    // Helper to validate non-empty string IDs
    const isValidId = (id) => Boolean(id && id !== 'undefined' && id !== 'null');

    const rawUserId = socket.handshake.query.userId;
    const userId = isValidId(rawUserId) ? String(rawUserId) : null;

    console.log(`⚡ Socket connected: ${socket.id} (UserId: ${userId || 'Guest'})`);

    // 1. Join user-specific room during initial handshake (query param)
    if (userId) {
      socket.join(`user_${userId}`);
      socket.join(userId); // Naked ID fallback
      console.log(`👤 Socket ${socket.id} auto-joined user rooms: user_${userId}`);
    }

    // 2. Explicit join for user room
    socket.on('join_user_room', (id) => {
      if (isValidId(id)) {
        const cleanId = String(id);
        socket.join(`user_${cleanId}`);
        socket.join(cleanId);
        console.log(`👤 Socket ${socket.id} joined room: user_${cleanId}`);
      }
    });

    // 3. Standalone join for category/department rooms
    socket.on('join_category_room', (category) => {
      if (isValidId(category)) {
        const cleanCat = String(category).trim().toUpperCase();
        socket.join(`category_${cleanCat}`);
        socket.join(`dept_${cleanCat}`);
        console.log(`🏫 Socket ${socket.id} joined department rooms: category_${cleanCat} & dept_${cleanCat}`);
      }
    });

    socket.on('join_dept_room', (dept) => {
      if (isValidId(dept)) {
        const cleanDept = String(dept).trim().toUpperCase();
        socket.join(`dept_${cleanDept}`);
        socket.join(`category_${cleanDept}`);
        console.log(`🏫 Socket ${socket.id} joined department rooms: dept_${cleanDept} & category_${cleanDept}`);
      }
    });

    // 4. Join resource room for live slot updates
    socket.on('join_resource_room', (resourceId) => {
      if (isValidId(resourceId)) {
        const room = `resource_${String(resourceId)}`;
        socket.join(room);
        console.log(`📦 Socket ${socket.id} joined room: ${room}`);
      }
    });

    // 5. Leave resource room on unmount
    socket.on('leave_resource_room', (resourceId) => {
      if (isValidId(resourceId)) {
        const room = `resource_${String(resourceId)}`;
        socket.leave(room);
        console.log(`📦 Socket ${socket.id} left room: ${room}`);
      }
    });

    // 6. Comprehensive user & department registration
    socket.on('join_room', (user) => {
      if (!user || typeof user !== 'object') return;

      // Join personal user rooms
      const uId = user._id || user.id;
      if (isValidId(uId)) {
        const cleanId = String(uId);
        socket.join(`user_${cleanId}`);
        socket.join(cleanId);
        console.log(`👤 Socket ${socket.id} joined room: user_${cleanId}`);
      }

      // Join both category and department room aliases for faculty/admin sync
      const userCategory = user.category || user.department;
      if (isValidId(userCategory)) {
        const formattedCat = String(userCategory).trim().toUpperCase();
        const categoryRoom = `category_${formattedCat}`;
        const deptRoom = `dept_${formattedCat}`;

        socket.join(categoryRoom);
        socket.join(deptRoom);
        console.log(`🏫 Faculty/User ${socket.id} joined: ${categoryRoom} & ${deptRoom}`);
      }
    });

    // 7. Disconnect handler
    socket.on('disconnect', () => {
      console.log(`🔥 Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

module.exports = { initSocket, getIO };