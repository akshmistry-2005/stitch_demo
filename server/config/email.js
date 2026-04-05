const nodemailer = require('nodemailer');
require('dotenv').config();

let transporter;

if (process.env.SMTP_HOST && process.env.SMTP_USER) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
} else {
  // Dev mode: log emails to console
  transporter = {
    sendMail: async (options) => {
      console.log('\n📧 ===== DEV EMAIL =====');
      console.log(`To: ${options.to}`);
      console.log(`Subject: ${options.subject}`);
      console.log(`Body: ${options.text || options.html}`);
      console.log('========================\n');
      return { messageId: 'dev-' + Date.now() };
    }
  };
  console.log('📧 Email running in DEV mode (logging to console)');
}

module.exports = transporter;
