import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  host: "email-smtp.us-east-1.amazonaws.com", // SES SMTP endpoint
  port: 465, // Use port 465 for SSL or 587 for STARTTLS
  secure: true, // true for port 465, false for other ports
  auth: {
    user: process.env.AWS_SES_SMTP_USER, // Your SMTP Username from the .env file
    pass: process.env.AWS_SES_SMTP_PASSWORD, // Your SMTP Password from the .env file
  },
});

export const sendEmail = (to, subject, text, html = "") => {
  const mailOptions = {
    from: '"Muchio Shop" <no-reply@interstellar-inc.com>', // Sender address
    to, // Recipient address
    subject, // Subject line
    text, // Plain text body
    html, // HTML body (optional)
  };

  // Wrap sendMail in a Promise to correctly use async/await
  return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.error("Error sending email:", err);
        reject(err); // Reject the promise if an error occurs
      } else {
        console.log("Email sent:", info.response);
        resolve(info.response); // Resolve the promise with the response
      }
    });
  });
};
