const { Server } = require('socket.io');
const { ROLES } = require('./common/constants');

const socketAuthMiddleware = require('./middleware/socket.middleware');

const registerPaymentSocket = require('./socket/payment.socket');

const joinEventRoomSocket = require('./socket/eventRoom.socket');

const sendEventMessageSocket = require('./socket/sendRoomMessage.socket');

const sendGlobalMessageSocket = require('./socket/sendGlobalMessage.socket');
const broadcastSocket = require('./socket/broadcast.socket');

let io;
let publicIo;
let secureIo;

const initializeSocket = (server) => {
  io = new Server(server, {
    //"Create a Socket.IO server and attach it to this HTTP server.
    cors: {
      //Cross-Origin Resource Sharing
      origin: '*',
      methods: ['GET', 'POST', 'DELETE'],
    },
  });

  publicIo = io.of('/public');

  publicIo.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    sendGlobalMessageSocket(publicIo, socket);
  });

  secureIo = io.of('/secure');

  secureIo.use(socketAuthMiddleware);

  secureIo.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);
    console.log('Authenticated user connected:', socket.user);

    const userId = socket.user.id;

    if (socket.user.role === ROLES.SUPER_ADMIN) {
      socket.join('admin_dashboard');

      console.log(`Admin ${userId} joined room admin_dashboard`);
    } else if (socket.user.role === ROLES.ORGANIZER) {
      socket.join(`organizer_${userId}`);

      console.log(`Organizer ${userId} joined room organizer_${userId}`);
    } else {
      socket.join(`user_${userId}`);

      console.log(`User ${userId} joined room user_${userId}`);
    }

    console.log(socket.user.role);

    registerPaymentSocket(secureIo, socket);

    joinEventRoomSocket(secureIo, socket);

    sendEventMessageSocket(secureIo, socket);
  });

  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    broadcastSocket(io, socket);
  });

  return { io, publicIo, secureIo };
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO is not initialized');
  }

  return { io, publicIo, secureIo };
};

module.exports = {
  initializeSocket,
  getIO,
};

//Temporary Disconnection
// const io = new Server(server, {
//   connectionStateRecovery: { maxDisconnectionDuration: 2 * 60 * 1000 },
// });
