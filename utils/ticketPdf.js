const PDFDocument = require('pdfkit');

const generateTicketPDF = ({
  quantity,
  registration,
  user,
  event,
  ticket,
  qrBuffer,
}) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 40,
    });

    const chunks = [];

    doc.on('data', (chunk) => {
      chunks.push(chunk);
    });

    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(chunks);
      resolve(pdfBuffer);
    });

    doc.on('error', reject);

    doc.fontSize(28).font('Helvetica-Bold').text('EVENT TICKET', {
      align: 'center',
    });

    doc
      .moveDown(0.5)
      .fontSize(12)
      .font('Helvetica')
      .text('Your registration has been confirmed', {
        align: 'center',
      });

    // Divider
    doc.moveDown(1).moveTo(40, doc.y).lineTo(555, doc.y).stroke();

    doc.moveDown(1);

    doc
      .fontSize(22)
      .font('Helvetica-Bold')
      .text(event.title || event.name, {
        align: 'center',
      });

    doc.moveDown(0.5);

    doc
      .fontSize(11)
      .font('Helvetica')
      .text('Thank you for registering for this event.', {
        align: 'center',
      });

    doc.moveDown(1.5);

    const boxX = 40;
    const boxY = doc.y;
    const boxWidth = 515;
    const boxHeight = 125;

    doc.roundedRect(boxX, boxY, boxWidth, boxHeight, 8).stroke();

    doc
      .fontSize(11)
      .font('Helvetica-Bold')
      .text('REGISTRATION DETAILS', boxX + 20, boxY + 15);

    doc
      .fontSize(11)
      .font('Helvetica')
      .text(
        `Registration ID: ${registration.registration_id}`,
        boxX + 20,
        boxY + 42,
      );

    doc.text(`Name: ${user.name}`, boxX + 20, boxY + 65);

    doc.text(`Email: ${user.email}`, boxX + 20, boxY + 88);

    doc.y = boxY + boxHeight + 25;

    doc.fontSize(16).font('Helvetica-Bold').text('TICKET DETAILS');

    doc.moveDown(0.7);

    doc.fontSize(12).font('Helvetica').text(`Ticket Type: ${ticket.name}`);

    doc.moveDown(0.4);

    doc.text(`Quantity: ${quantity}`);

    doc.moveDown(0.4);

    doc.text(`Price: ${ticket.price * quantity}`);

    doc.moveDown(1.5);

    doc.fontSize(16).font('Helvetica-Bold').text('EVENT CHECK-IN', {
      align: 'center',
    });

    doc.moveDown(0.5);

    doc
      .fontSize(11)
      .font('Helvetica')
      .text('Scan the QR code below at the event entrance.', {
        align: 'center',
      });

    doc.moveDown(1);

    const qrSize = 180;
    const qrX = (doc.page.width - qrSize) / 2;

    doc.image(qrBuffer, qrX, doc.y, {
      width: qrSize,
      height: qrSize,
    });

    doc.y += qrSize + 15;

    doc.fontSize(10).text('This QR code is unique to your registration.', {
      align: 'center',
    });

    doc
      .fontSize(9)
      .font('Helvetica')
      .text('This is an electronically generated ticket.', 40, 760, {
        width: 515,
        align: 'center',
      });

    doc
      .fontSize(9)
      .text('Please do not share your QR code with anyone else.', 40, 775, {
        width: 515,
        align: 'center',
      });

    doc.end();
  });
};

module.exports = {
  generateTicketPDF,
};
