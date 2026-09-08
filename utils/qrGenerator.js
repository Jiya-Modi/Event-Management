const QRCode = require('qrcode');

const generateQRCode = async (registration_id, quantity) => {
  const qrData = JSON.stringify({
    registration_id: registration_id,
    quantity: quantity,
  });

  const qrUrl = `http://192.168.1.138:3000/api/v1/user/check-in?registration_id=${registration_id}&quantity=${quantity}`;

  const qrBuffer = await QRCode.toBuffer(qrUrl, {
    type: 'png',
    width: 300,
    margin: 2,
  });

  return qrBuffer;
};

module.exports = {
  generateQRCode,
};
