const { Server } = require('socket.io');

let io;

function initSocket(server) {

  const allowedOrigins = [
    'http://localhost:5173',
    process.env.CLIENT_URL
  ].filter(Boolean);

  io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // Join tenant-specific room
    socket.on('join:gym', (tenantId) => {
      if (tenantId) {
        socket.join(`gym:${tenantId}`);
        console.log(`Socket ${socket.id} joined gym:${tenantId}`);
      }
    });

    // Leave tenant room
    socket.on('leave:gym', (tenantId) => {
      if (tenantId) {
        socket.leave(`gym:${tenantId}`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });

  return io;
}

function getIO() {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
}

module.exports = { initSocket, getIO };