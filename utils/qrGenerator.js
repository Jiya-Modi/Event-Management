const QRCode = require('qrcode');

const generateQRCode = async (registration_id, quantity) => {
  const qrUrl =
    `http://192.168.1.138:3000/api/v1/user/check-in` +
    `?registration_id=${encodeURIComponent(registration_id)}` + //encodeURIComponent() makes a value safe to put inside a URL.
    `&quantity=${encodeURIComponent(quantity)}`;

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
