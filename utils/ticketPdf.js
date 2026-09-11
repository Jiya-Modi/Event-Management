const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const generateTicketPdf = async (ticketData) => {
  const browser = await puppeteer.launch({
    //puppeteer.launch() -> starts the browser

    headless: true, //headless:true -> chrome runs without its UI
  });

  try {
    const page = await browser.newPage(); //opens new tab

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">

        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 40px;
          }

          .ticket {
            border: 2px solid #222;
            border-radius: 12px;
            padding: 30px;
            width: 600px;
            margin: auto;
          }

          h1 {
            margin-bottom: 30px;
          }

          .row {
            margin: 12px 0;
          }

          .label {
            font-weight: bold;
          }
        </style>
      </head>

      <body>

        <div class="ticket">

          <h1>${ticketData.eventTitle}</h1>

          <div class="row">
            <span class="label">Registration ID:</span>
            ${ticketData.registrationId}
          </div>

          <div class="row">
            <span class="label">Name:</span>
            ${ticketData.userName}
          </div>

          <div class="row">
            <span class="label">Email:</span>
            ${ticketData.email}
          </div>

          <div class="row">
            <span class="label">Date:</span>
            ${ticketData.eventDate}
          </div>

          <div class="row">
            <span class="label">Location:</span>
            ${ticketData.location}
          </div>

        </div>

      </body>
      </html>
    `;

    await page.setContent(html, {
      //page.goto
      //html, specific-url
      waitUntil: 'networkidle0', //load, domcontent loaded, networkidle0
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

// Registration
//      ↓
// Generate HTML ticket
//      ↓
// Puppeteer opens HTML
//      ↓
// Chrome renders HTML + CSS
//      ↓
// Puppeteer generates PDF
//      ↓
// ticket.pdf

//Browser, Page, Element
