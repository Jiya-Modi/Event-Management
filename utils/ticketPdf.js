const puppeteer = require('puppeteer');

const generateTicketPdf = async (ticketData) => {
  const browser = await puppeteer.launch({
    headless: true,
  });

  try {
    const page = await browser.newPage();

    //  Convert QR Buffer → Base64
    //  Puppeteer cannot directly use a Buffer
    //  inside an HTML <img>.

    const qrBase64 = ticketData.qrBuffer.toString('base64');

    const html = `
      <!DOCTYPE html>

      <html>

      <head>

        <meta charset="UTF-8">

        <style>

          * {
            box-sizing: border-box;
          }

          body {
            font-family: Arial, sans-serif;
            padding: 40px;
            background: #f5f5f5;
          }

          .ticket {
            border: 2px solid #222;
            border-radius: 12px;
            padding: 30px;
            width: 600px;
            margin: auto;
            background: white;
          }

          h1 {
            margin-bottom: 30px;
            text-align: center;
          }

          .row {
            margin: 12px 0;
            font-size: 16px;
          }

          .label {
            font-weight: bold;
          }

          .qr {
            text-align: center;
            margin-top: 30px;
          }

          .qr img {
            width: 180px;
            height: 180px;
          }

        </style>

      </head>

      <body>

        <div class="ticket">

          <h1>
            ${ticketData.eventTitle}
          </h1>

          <div class="row">
            <span class="label">
              Registration ID:
            </span>

            ${ticketData.registrationId}
          </div>

          <div class="row">
            <span class="label">
              Name:
            </span>

            ${ticketData.userName}
          </div>

          <div class="row">
            <span class="label">
              Email:
            </span>

            ${ticketData.email}
          </div>

          <div class="row">
            <span class="label">
              Date:
            </span>

            ${new Date(ticketData.eventDate).toLocaleString()}
          </div>

          <div class="row">
            <span class="label">
              Location:
            </span>

            ${ticketData.location || 'N/A'}
          </div>

          <div class="row">
            <span class="label">
              Quantity:
            </span>

            ${ticketData.quantity}
          </div>

          <div class="row">
            <span class="label">
              Ticket:
            </span>

            ${ticketData.ticketName || 'N/A'}
          </div>

          <div class="row">
            <span class="label">
              Price:
            </span>

            ₹${ticketData.ticketPrice}
          </div>

          <div class="qr">

            <img
              src="data:image/png;base64,${qrBase64}"
              alt="Ticket QR Code"
            />

          </div>

        </div>

      </body>

      </html>
    `;

    await page.setContent(html, {
      waitUntil: 'networkidle0',
    });

    const ticketPdf = await page.pdf({
      format: 'A4',
      printBackground: true,
    });

    return ticketPdf;
  } finally {
    await browser.close();
  }
};

module.exports = {
  generateTicketPdf,
};
