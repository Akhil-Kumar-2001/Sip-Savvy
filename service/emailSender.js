const nodemailer = require('nodemailer')
require('dotenv').config()
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false, // Use `true` for port 465, `false` for all other ports
    auth: {
      user: process.env.SMTP_USERNAME,
      pass: process.env.SMTP_PASSWORD,
    },
  });
  
  // async..await is not allowed in global scope, must use a wrapper
  async function mailSender(OTP,userMail) {
    // send mail with defined transport object
    const info = await transporter.sendMail({
      from: process.env.SMTP_USERNAME,
      to: userMail,
      subject: "Your One-Time Password for Sip Savvy Account Verification", // Subject line
      html: `<h2>Sip Savvy</h2><br/> <b>${OTP}</b>`, // html body
    });
  
    console.log("Message sent: %s", info.messageId);
  }

  module.exports = mailSender
  
 