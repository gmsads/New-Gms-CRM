let Server;
try {
  Server = require('socket.io').Server;
} catch (err) {
  console.warn('[SocketManager] socket.io not installed yet. Realtime events will be disabled.');
}

const jwt = require('jsonwebtoken');

let io;

const initSocket = (server) => {
  if (!Server) {
    console.warn('[SocketManager] Cannot initialize Socket.IO because it is not installed.');
    return null;
  }

  io = new Server(server, {
    cors: {
      origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Authentication Middleware
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication error: Token missing'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
      socket.user = decoded; // { id, role, ... }
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  // Keep track of connected active user sockets to prevent ghost sessions
  const activeUsers = new Map();

  io.on('connection', (socket) => {
    const userId = socket.user.id;

    // Duplicate Connection Prevention: disconnect older socket if same user connects
    if (activeUsers.has(userId)) {
      const oldSocket = activeUsers.get(userId);
      oldSocket.emit('force_disconnect', { message: 'Logged in from another location.' });
      oldSocket.disconnect(true);
    }
    
    activeUsers.set(userId, socket);
    console.log(`[Socket] User connected: ${userId} (${socket.user.role})`);

    // 1. Join Personal User Room
    socket.join(`user_${userId}`);

    // 2. Join Role Room
    if (socket.user.role) {
      socket.join(`role_${socket.user.role}`);
    }

    // 3. Handle explicit room joins (e.g. for specific records)
    socket.on('join_room', (roomName) => {
      socket.join(roomName);
    });

    socket.on('leave_room', (roomName) => {
      socket.leave(roomName);
    });

    // Heartbeat / Ping Check
    socket.on('ping', (cb) => {
      if (typeof cb === 'function') cb({ status: 'ok', time: new Date() });
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] User disconnected: ${userId}`);
      if (activeUsers.get(userId) === socket) {
        activeUsers.delete(userId);
      }
    });
  });

  return io;
};

const getIo = () => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};

// Broadcasting utilities
const broadcastToUser = (userId, eventName, payload) => {
  if (io) io.to(`user_${userId}`).emit(eventName, payload);
};

const broadcastToRole = (role, eventName, payload) => {
  if (io) io.to(`role_${role}`).emit(eventName, payload);
};

const broadcastToAll = (eventName, payload) => {
  if (io) io.emit(eventName, payload);
};

module.exports = {
  initSocket,
  getIo,
  broadcastToUser,
  broadcastToRole,
  broadcastToAll
};
