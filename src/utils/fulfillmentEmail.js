import { sendEmail } from "../utils/email.js";

// Fulfillment email with order data, product images, and process steps
export const sendFulfillmentEmail = async ({
  userDetails,
  trackingNumber,
  carrier,
  orderData,
  lineItems,
  fulfillmentStatus, // Expecting status like "Processing", "Shipped", "Delivered"
}) => {
  // Ensure the orderData and lineItems are passed
  if (!orderData || !lineItems || lineItems.length === 0) {
    throw new Error("Order data and line items are required.");
  }

  const trackingUrl = generateTrackingUrl(carrier, trackingNumber);

  const emailSubject = `Your Order is ${fulfillmentStatus} - Tracking #${trackingNumber}`;

  // Generate fulfillment process steps
  const processSteps = `
    <div style="display: flex; justify-content: space-between; margin: 20px 0;">
      <div style="text-align: center; ${
        fulfillmentStatus === "Processing" ||
        fulfillmentStatus === "Shipped" ||
        fulfillmentStatus === "Delivered"
          ? "color: green;"
          : "color: grey;"
      }">
        ✔ Processing
      </div>
      <div style="text-align: center; ${
        fulfillmentStatus === "Shipped" || fulfillmentStatus === "Delivered"
          ? "color: green;"
          : "color: grey;"
      }">
        ✔ Shipped
      </div>
      <div style="text-align: center; ${
        fulfillmentStatus === "Delivered" ? "color: green;" : "color: grey;"
      }">
        ○ Delivered
      </div>
    </div>
  `;

  // Product details including images
  const productDetailsHtml = lineItems
    .map(
      (item) => `
        <div style="border: 1px solid #ddd; margin-bottom: 20px; padding: 10px;">
          <div class="item-image" style="text-align: center; margin-bottom: 15px;">
            <img src="${item.productDetails.images[0]}" alt="${
        item.description
      }" style="width: 100%; max-width: 300px; height: auto;">
          </div>
          <div class="item-details">
            <h3>${item.description}</h3>
            <p>Size: ${item.productDetails.size || "N/A"}</p>
            <p>Quantity: ${item.quantity}</p>
            <p>Price: $${(item.price.unit_amount / 100).toFixed(2)}</p>
          </div>
        </div>
      `
    )
    .join("");

  // Order summary details (reusing format from confirmation)
  const orderSummaryHtml = `
    <div style="margin-top: 20px;">
      <p>Subtotal (${lineItems.length} item${
    lineItems.length > 1 ? "s" : ""
  }): $${orderData.subtotal.toFixed(2)}</p>
      <p>Standard Shipping: $${orderData.shippingInfo.shippingCost.toFixed(
        2
      )}</p>
      <p>GST/HST: $${(orderData.totalPrice * 0.05).toFixed(2)}</p>
      <p>PST: $${(orderData.totalPrice * 0.07).toFixed(2)}</p>
    </div>
    <div style="border-top: 2px solid #333; margin-top: 20px; padding-top: 10px;">
      <p style="font-weight: bold;">Order Total: $${orderData.totalPrice.toFixed(
        2
      )} CAD</p>
    </div>
  `;

  const emailHtml = `
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Fulfillment</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #f9f9f9;
            padding: 20px;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #fff;
            padding: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Your Order is ${fulfillmentStatus}</h1>
          <p>Hello ${userDetails.name},</p>
          <p>Your order is currently ${fulfillmentStatus}. Here are the details:</p>

          <!-- Fulfillment Process Visualization -->
          ${processSteps}

          <!-- Product Details -->
          <h2>Order Details</h2>
          ${productDetailsHtml}

          <!-- Order Summary -->
          <h2>Order Summary</h2>
          ${orderSummaryHtml}

          <!-- Tracking Information -->
          <p>Carrier: ${carrier}</p>
          <p>Tracking Number: ${trackingNumber}</p>
          <p>
            <a href="${trackingUrl}" target="_blank" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-align: center; text-decoration: none; display: inline-block; border-radius: 5px;">
              Track Package
            </a>
          </p>
          
          <p>Thank you for shopping with us!</p>
        </div>
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

// Helper function to generate tracking URL
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
