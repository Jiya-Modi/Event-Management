const getMessage = (message, module) => {
  return message.replace('##', module);
};

module.exports = getMessage;
