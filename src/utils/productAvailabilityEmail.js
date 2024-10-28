// src/utils/ProductAvailabilityEmail.js

export const generateProductAvailabilityEmail = (
  customerName,
  productName,
  productUrl,
  productImageUrl // Add image URL parameter
) => {
  const emailSubject = `Good News! ${productName} is Now Available`;

  const emailText = `
    Hi ${customerName},

    We’re excited to let you know that ${productName} is back in stock!

    You can purchase it now by visiting the link below:
    ${productUrl}

    Don’t wait too long! This popular product may sell out again soon.

    Thank you for choosing us!
    The Interstellar Inc. Team
  `;

  const emailHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Product Availability Notification</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <table cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
        <tr>
          <td style="padding: 24px; background-color: #046cec; text-align: center;">
            <h1 style="color: #ffffff; font-size: 24px; margin: 0;">${productName} is Back in Stock!</h1>
          </td>
        </tr>
        <tr>
          <td style="padding: 24px; text-align: center;">
            <img src="${productImageUrl}" alt="${productName}" style="width: 100%; max-width: 300px; border-radius: 8px; margin-bottom: 20px;">
            <p style="font-size: 16px;">Hi ${customerName},</p>
            <p style="font-size: 16px;">We’re excited to inform you that <strong>${productName}</strong> is now available for purchase!</p>
            <p style="font-size: 16px;">Don’t miss out on this popular item. Click the link below to buy now:</p>
            <p style="text-align: center; margin: 20px 0;">
              <a href="${productUrl}" style="background-color: #046cec; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-size: 16px;">Buy ${productName}</a>
            </p>
            <p style="font-size: 16px;">Thank you for shopping with us!</p>
            <p style="font-size: 16px;">The Interstellar Inc. Team</p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return { emailSubject, emailText, emailHtml };
};
