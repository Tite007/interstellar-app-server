import { sendEmail } from "../utils/email.js";

// Function to send fulfillment email to the customer
export const sendFulfillmentEmail = async ({
  userDetails,
  trackingNumber,
  carrier,
  orderData,
  lineItems,
  fulfillmentStatus,
}) => {
  if (!orderData || !lineItems || lineItems.length === 0) {
    throw new Error("Order data and line items are required.");
  }

  const trackingUrl = generateTrackingUrl(carrier, trackingNumber);
  const emailSubject = `Your Order is ${fulfillmentStatus} - Tracking #${trackingNumber}`;

  // Extract shipping address from orderData
  const { address } = orderData.shippingInfo;
  const shippingAddress = `
    ${address.line1},<br />
    ${address.line2 ? address.line2 + "," : ""}<br />
    ${address.city}, ${address.state}, ${address.postal_code},<br />
    ${address.country}
  `;

  // Add personalized greeting with user's name
  const userName = `${userDetails.firstName || "Customer"} ${
    userDetails.lastName || ""
  }`.trim();

  // Process steps now using tables for consistent layout
  const processSteps = `
    <table style="width: 100%; margin-bottom: 32px;">
      <tr>
        <td style="text-align: center;">
          <div style="width: 32px; height: 32px; background-color: #22c55e; border-radius: 50%; display: inline-block;">
            <span style="color: white; font-size: 24px;">✔</span>
          </div>
          <span style="display: block; color: #22c55e; font-size: 14px;">Processing</span>
        </td>
        <td style="width: 100px; border-top: 4px solid ${
          fulfillmentStatus === "Processing" ? "#d1d5db" : "#22c55e"
        };"></td>
        <td style="text-align: center;">
          <div style="width: 32px; height: 32px; background-color: ${
            fulfillmentStatus === "Processing" ? "#d1d5db" : "#22c55e"
          }; border-radius: 50%; display: inline-block;">
            <span style="color: white; font-size: 24px;">🚚</span>
          </div>
          <span style="display: block; color: ${
            fulfillmentStatus === "Processing" ? "#6b7280" : "#22c55e"
          }; font-size: 14px;">Shipped</span>
        </td>
        <td style="width: 100px; border-top: 4px solid ${
          fulfillmentStatus === "Delivered" ? "#22c55e" : "#d1d5db"
        };"></td>
        <td style="text-align: center;">
          <div style="width: 32px; height: 32px; background-color: ${
            fulfillmentStatus === "Delivered" ? "#22c55e" : "#d1d5db"
          }; border-radius: 50%; display: inline-block;">
            <span style="color: ${
              fulfillmentStatus === "Delivered" ? "white" : "#6b7280"
            }; font-size: 24px;">📦</span>
          </div>
          <span style="display: block; color: ${
            fulfillmentStatus === "Delivered" ? "#22c55e" : "#6b7280"
          }; font-size: 14px;">Delivered</span>
        </td>
      </tr>
    </table>
  `;

  const productDetailsHtml = lineItems
    .map(
      (item) => `
        <table style="width: 100%; margin-bottom: 24px;">
          <tr>
            <td style="width: 96px;"> 
              <img src="${item.productDetails.images[0]}" alt="${
        item.description
      }" style="width: 96px; height: 96px; object-fit: cover;">
            </td>
            <td style="padding-left: 16px;">
              <h2 style="font-size: 20px; font-weight: 600; margin: 0;">${
                item.description || item.name || "N/A"
              }</h2>
              <p style="margin: 4px 0;">Size: ${
                item.productDetails.size || "N/A"
              }</p>
              <p style="margin: 4px 0;">Qty: ${item.quantity}</p>
              <p style="font-weight: bold;">CAD ${(
                item.price.unit_amount / 100
              ).toFixed(2)}</p>
            </td>
          </tr>
        </table>
      `
    )
    .join("");

  const orderSummaryHtml = `
    <table style="width: 100%; background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
      <tr>
        <td><strong>Order summary</strong></td>
      </tr>
      <tr>
        <td>Subtotal (${lineItems.length} item${
    lineItems.length > 1 ? "s" : ""
  })</td>
        <td style="text-align: right;">CAD ${orderData.subtotal.toFixed(2)}</td>
      </tr>
      <tr>
        <td>Standard Shipping</td>
        <td style="text-align: right;">CAD ${orderData.shippingInfo.shippingCost.toFixed(
          2
        )}</td>
      </tr>
      <tr>
        <td>GST/HST</td>
        <td style="text-align: right;">CAD ${(
          orderData.totalPrice * 0.05
        ).toFixed(2)}</td>
      </tr>
      <tr>
        <td>PST</td>
        <td style="text-align: right;">CAD ${(
          orderData.totalPrice * 0.07
        ).toFixed(2)}</td>
      </tr>
      <tr style="border-top: 1px solid #d1d5db; margin-top: 16px; padding-top: 16px;">
        <td><strong>Total</strong></td>
        <td style="text-align: right;"><strong>CAD ${orderData.totalPrice.toFixed(
          2
        )}</strong></td>
      </tr>
    </table>
  `;

  const emailHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Tracking</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <table style="width: 100%; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
        <tr>
          <td style="padding: 24px;">
            <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 24px;">Hi ${userName}, here is your tracking information</h1>
            
            ${processSteps}

             <table style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
              <tr>
                <td><strong>Tracking Information:</strong></td>
              </tr>
              <tr>
                <td>Carrier: ${carrier}</td>
              </tr>
              <tr>
                <td>Tracking Number: ${trackingNumber}</td>
              </tr>
              <tr>
                <td style="padding-top: 16px;">
                  <a href="${trackingUrl}" target="_blank" style="background-color: #22c55e; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Track Package</a>
                </td>
              </tr>
            </table>

            <h2 style="font-size: 20px; font-weight: 600; margin-bottom: 16px;">Shipping Address</h2>
            <p style="margin-bottom: 24px;">${shippingAddress}</p>
            
            <h2 style="font-size: 20px; font-weight: 600; margin-bottom: 16px;">Products</h2>
            ${productDetailsHtml}
            
            ${orderSummaryHtml}
            
           
            
            <p>Thank you for shopping with us!</p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  try {
    await sendEmail(userDetails.email, emailSubject, "", emailHtml);
    console.log("Fulfillment email sent successfully");
  } catch (error) {
    console.error("Error sending fulfillment email:", error);
    throw error;
  }
};

// Helper function to generate tracking URL (unchanged)
const generateTrackingUrl = (carrier, trackingNumber) => {
  switch (carrier.toLowerCase()) {
    case "ups":
      return `https://www.ups.com/track?loc=en_CA&tracknum=${trackingNumber}`;
    case "fedex":
      return `https://www.fedex.com/fedextrack/?tracknumbers=${trackingNumber}`;
    case "dhl":
      return `https://www.dhl.com/en/express/tracking.html?AWB=${trackingNumber}`;
    default:
      return "";
  }
};
