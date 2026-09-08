const broadcastSocket = (io, socket) => {
  socket.once('global_alert', ({ message }) => {
    try {
      const namespaces = ['/public', '/secure'];

      namespaces.forEach((namespace) => {
        io.of(namespace).emit('global_alert', {
          message: 'System maintenance in 10 minutes.',
        });
      });
    } catch (error) {
      console.error('BROADCAST ERROR:', error);

      io.emit('global_alert', {
        success: false,
        message: 'Failed to send message',
      });
    }
  });
};

module.exports = broadcastSocket;
