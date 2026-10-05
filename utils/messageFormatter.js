const getMessage = (message, module) => {
  console.log(message);
  console.log(module);
  return message.replace('##', module);
};

module.exports = getMessage;
