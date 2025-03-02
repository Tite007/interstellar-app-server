// src/utils/passwordRecoveryEmail.js
import { sendEmail } from "./email.js"; // Same directory, so use ./email.js
import dotenv from "dotenv";

dotenv.config();

export const sendRecoverPasswordEmail = async (email, userName, resetToken) => {
  try {
    // Create the reset link using the FRONTEND_URL from .env
    const resetLink = `https://www.interstellar-inc.com/reset-password?token=${resetToken}`;

    // Email content
    const emailSubject = "Recover Your Password";
    const emailText = `
      Hello ${userName || "User"},
      
      You requested to recover your password. Click the link below to reset it:
      ${resetLink}
      
      This link will expire in 1 hour. If you didn’t request this, please ignore this email.
      
      Regards,
      Your Company
    `;
    const emailHtml = `
      <h2>Recover Your Password</h2>
      <p>Hello ${userName || "User"},</p>
      <p>You requested to recover your password. Click the link below to reset it:</p>
      <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background-color: #FF4747; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
      <p>This link will expire in 1 hour. If you didn’t request this, please ignore this email.</p>
      <p>Regards,<br>Your Company</p>
    `;

    // Send the email using the existing sendEmail function
    await sendEmail(email, emailSubject, emailText, emailHtml);
  } catch (error) {
    console.error("Error sending recover password email:", error);
    throw new Error("Failed to send recover password email");
  }
};
