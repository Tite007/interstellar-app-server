import { sendEmail } from "../utils/email.js";

export const sendFulfillmentEmail = async ({
  userDetails,
  trackingNumber,
  carrier,
}) => {
  const emailSubject = `Your Order has been Shipped - Tracking #${trackingNumber}`;
  const emailText = `
    Hello ${userDetails.name},
    
    Your order has been shipped! Here are the tracking details:
    
    Carrier: ${carrier}
    Tracking Number: ${trackingNumber}
    
    You can track your order at the carrier's website using the tracking number provided.
    
    Thank you for shopping with us!
  `;

  const emailHtml = `
    <h1>Your Order has been Shipped!</h1>
    <p>Hello ${userDetails.name},</p>
    <p>Your order has been shipped! Here are the tracking details:</p>
    <ul>
      <li><strong>Carrier:</strong> ${carrier}</li>
      <li><strong>Tracking Number:</strong> ${trackingNumber}</li>
    </ul>
    <p>You can track your order at the carrier's website using the tracking number provided.</p>
    <p>Thank you for shopping with us!</p>
  `;

  try {
    await sendEmail(userDetails.email, emailSubject, emailText, emailHtml);
    console.log("Fulfillment email sent successfully");
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};
