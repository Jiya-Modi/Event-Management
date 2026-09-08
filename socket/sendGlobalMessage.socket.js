const sendGlobalMessageSocket = (publicIo, socket) => {
  socket.on('send_global_message', ({ message }) => {
    try {
      publicIo.emit('global_message', {
        success: true,
        message,
      });

      console.log(`Global Message emitted.`);
    } catch (error) {
      console.error('Global MESSAGE ERROR:', error);

      publicIo.emit('global_message', {
        success: false,
        message: 'Failed to send message',
      });
    }
  });
};

module.exports = sendGlobalMessageSocket;
