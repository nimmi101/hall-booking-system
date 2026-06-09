const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  let transporter;

  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      family: 4, // Force IPv4 for Nodemailer socket
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  } else {
    console.log('Using Ethereal email for testing (no EMAIL_USER/EMAIL_PASS provided)');
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }

  const mailOptions = {
    from: process.env.EMAIL_USER ? `Schedulix <${process.env.EMAIL_USER}>` : '"Schedulix Test" <test@schedulix.com>',
    to: options.email,
    subject: options.subject,
    html: options.message,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`Email sent: ${info.messageId}`);
  
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
  }

  return info;
};

module.exports = sendEmail;
 
