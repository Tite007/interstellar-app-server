export const generateOrderConfirmationEmail = (
  customer,
  orderData,
  lineItems
) => {
  const emailSubject = `Order Confirmation - Your Order #${orderData._id}`;

  const emailText = `
    Thank you for your order, ${customer.name}!
    
    Here are the details of your purchase:
    
    ${lineItems
      .map((item) => {
        const price = item.price?.unit_amount
          ? (item.price.unit_amount / 100).toFixed(2)
          : "0.00"; // Fallback to "0.00" if price is undefined
        const total = item.amount_total
          ? (item.amount_total / 100).toFixed(2)
          : "0.00"; // Fallback to "0.00" if total is undefined
        const itemTax = item.amount_tax
          ? (item.amount_tax / 100).toFixed(2)
          : "0.00"; // Tax amount for each item
        return `${item.quantity} x ${item.description} - $${price} (Tax: $${itemTax}) (Total: $${total})`;
      })
      .join("\n")}
    
    Shipping Address:
    ${orderData.shippingInfo.address.line1 || ""}, ${
    orderData.shippingInfo.address.city || ""
  }, ${orderData.shippingInfo.address.state || ""}, ${
    orderData.shippingInfo.address.postal_code || ""
  }, ${orderData.shippingInfo.address.country || ""}
    
    Subtotal: $${orderData.subtotal?.toFixed(2) || "0.00"}
    Tax: $${
      lineItems.reduce((acc, item) => acc + (item.amount_tax || 0), 0) / 100
    } // Total tax from all line items
    Shipping: $${orderData.shippingInfo?.shippingCost?.toFixed(2) || "0.00"}
    Total: $${orderData.totalPrice?.toFixed(2) || "0.00"}
    
    Your order will be shipped soon. You will receive a confirmation email when your order is on its way.
    
    Thank you for shopping with us!
  `;

  const emailHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Confirmation</title>
    </head>
    <body style="font-family: 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif; line-height: 1.6; color: #333; background-color: #f6f9fc; padding: 20px; margin: 0;">
      <table cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
      <!-- Header with Logo -->   
      <tr>
          <td style="padding: 30px; background-color: #FF4747; text-align: left;">
            <table cellpadding="0" cellspacing="0" style="width: 100%;">
              <tr>
                <td style="width: 120px; vertical-align: middle;">
                  <img src="https://logos-muchio.s3.us-west-2.amazonaws.com/muchio-logo-600x600.webp" alt="Muchio" style="width: 120px; height: auto;">
                </td>
                <td style="vertical-align: middle; padding-left: 20px;">
                  <h1 style="color: #ffffff; font-size: 24px; margin: 0; font-weight: 600;">Order Confirmation</h1>
                </td>
              </tr>
            </table>
          </td>
        </tr>
                <!-- Main Content -->
  <tr>
          <td style="padding: 40px 30px;">
            <p style="font-size: 16px; margin-bottom: 30px; color: #1a1a1a;">Thank you for your order, ${
              customer.name
            }!</p>
            <!-- Order Details Section -->
            <h2 style="font-size: 20px; color: #FF4747; padding-bottom: 10px; margin-bottom: 20px; border-bottom: 2px solid #FF4747;">Order Details</h2>

            ${lineItems
              .map((item, index) => {
                const price = item.price?.unit_amount
                  ? (item.price.unit_amount / 100).toFixed(2)
                  : "0.00";
                const total = item.amount_total
                  ? (item.amount_total / 100).toFixed(2)
                  : "0.00";
                const itemTax = item.amount_tax
                  ? (item.amount_tax / 100).toFixed(2)
                  : "0.00";
                return `
                  <table cellpadding="0" cellspacing="0" style="width: 100%; margin-bottom: 20px; border-bottom: ${
                    index < lineItems.length - 1 ? "1px solid #e0e0e0" : "none"
                  };">
                    <tr>
                      <td style="padding: 0 0 20px 0; vertical-align: top;">
                        <img src="${
                          item.productDetails.images?.[0] || ""
                        }" alt="${
                  item.description
                }" style="width: 100px; height: auto; border-radius: 8px; border: 1px solid rgba(0,0,0,0.1);">
                      </td>
                      <td style="padding: 0 0 20px 20px; vertical-align: top;">
                        <h3 style="font-size: 16px; margin: 0 0 8px 0; color: #1a1a1a;">${
                          item.description
                        }</h3>
                        <p style="font-size: 14px; color: #666; margin: 0 0 5px 0;">
                          Quantity: ${item.quantity || 1} | SKU: ${
                  item.productDetails.sku || "N/A"
                } | Tax: $${itemTax}
                        </p>
                        <p style="font-size: 16px; font-weight: bold; margin: 10px 0 0 0;">
                          $${price}
                        </p>
                      </td>
                    </tr>
                  </table>
                `;
              })
              .join("")}
            <!-- Order Summary -->

            <table cellpadding="0" cellspacing="0" style="width: 100%; margin-top: 30px; background-color: #f8f9fa; border-radius: 8px; overflow: hidden;">
              <tr>
                <td style="padding: 15px 20px; border-bottom: 1px solid rgba(0,0,0,0.1);">Subtotal</td>
                <td style="padding: 15px 20px; text-align: right; border-bottom: 1px solid rgba(0,0,0,0.1);">
                  $${orderData.subtotal?.toFixed(2) || "0.00"}
                </td>
              </tr>
              <tr>
                <td style="padding: 15px 20px; border-bottom: 1px solid rgba(0,0,0,0.1);">Tax</td>
                <td style="padding: 15px 20px; text-align: right; border-bottom: 1px solid rgba(0,0,0,0.1);">
                  $${(
                    lineItems.reduce(
                      (acc, item) => acc + (item.amount_tax || 0),
                      0
                    ) / 100
                  ).toFixed(2)}
                </td>
              </tr>
              <tr>
               <td style="padding: 15px 20px; border-bottom: 1px solid rgba(0,0,0,0.1);">Shipping</td>
                <td style="padding: 15px 20px; text-align: right; border-bottom: 1px solid rgba(0,0,0,0.1);">
                  $${orderData.shippingInfo?.shippingCost?.toFixed(2) || "0.00"}
                </td>
              </tr>
              <tr>
                <td style="padding: 15px 20px; font-size: 18px; font-weight: 600; color: #FF4747;">
                  Total
                </td>
                <td style="padding: 15px 20px; font-size: 18px; font-weight: 600; text-align: right; color: #FF4747;">
                  $${orderData.totalPrice?.toFixed(2) || "0.00"} CAD
                </td>
              </tr>
            </table>

            <!-- Shipping Address -->
            <div style="margin-top: 30px; padding: 20px; background-color: #f8f9fa; border-radius: 8px;">
              <h3 style="font-size: 16px; margin: 0 0 10px 0; color: #1a1a1a;">Shipping Address</h3>
              <p style="font-size: 14px; color: #666; margin: 0;">
                ${orderData.shippingInfo.address.line1 || ""}<br>
                ${orderData.shippingInfo.address.city || ""}, ${
    orderData.shippingInfo.address.state || ""
  } ${orderData.shippingInfo.address.postal_code || ""}<br>
                ${orderData.shippingInfo.address.country || ""}
              </p>
            </div>

            <!-- Footer Message -->
            <div style="margin-top: 40px; text-align: center; padding-top: 30px; border-top: 1px solid rgba(0,0,0,0.1);">
              <p style="font-size: 14px; color: #666; margin-bottom: 20px;">
                Your order will be shipped soon. You will receive a confirmation email when your order is on its way.
              </p>
              <table cellpadding="0" cellspacing="0" style="width: 100%; margin-top: 20px;">
                <tr>
                  <td style="text-align: center;">
                    <img src="https://logos-muchio.s3.us-west-2.amazonaws.com/muchio_logo.webp" alt="Muchio" style="width: 100px; height: auto;">
                  </td>
                </tr>
              </table>
            </div>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return { emailSubject, emailText, emailHtml };
};
