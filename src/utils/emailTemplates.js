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
          : "0.00";
        const total = item.amount_total
          ? (item.amount_total / 100).toFixed(2)
          : "0.00";
        const itemTax = item.amount_tax
          ? (item.amount_tax / 100).toFixed(2)
          : "0.00";
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
    Tax: $${(
      lineItems.reduce((acc, item) => acc + (item.amount_tax || 0), 0) / 100
    ).toFixed(2)}
    Shipping: $${orderData.shippingInfo?.shippingCost?.toFixed(2) || "0.00"}
    Total: $${orderData.totalPrice?.toFixed(2) || "0.00"}
  `;

  const emailHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Confirmation</title>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    </head>
    <body style="font-family: 'Inter', sans-serif; background-color: #f6f9fc; padding: 20px; margin: 0;">
      <table cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <tr>
          <td style="padding: 30px; background-color: #FF4747; text-align: left;">
            <table cellpadding="0" cellspacing="0" style="width: 100%;">
              <tr>
                <td style="width: 120px; vertical-align: middle; text-align: left;">
                  <img src="https://logos-muchio.s3.us-west-2.amazonaws.com/muchio-logo-600x600.webp" alt="Muchio" style="width: 120px; height: auto; display: block;">
                </td>
                <td style="text-align: left; vertical-align: middle; padding-left: 20px;">
                  <h1 style="color: #ffffff; font-size: 24px; margin: 0; font-weight: 600;">Order Confirmation</h1>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding: 40px 30px;">
            <p style="font-size: 16px; margin-bottom: 30px; color: #1a1a1a;">Thank you for your order, ${
              customer.name
            }!</p>
            <h2 style="font-size: 20px; color: #FF4747;">Order Details</h2>
            ${lineItems
              .map((item) => {
                const price = item.price?.unit_amount
                  ? (item.price.unit_amount / 100).toFixed(2)
                  : "0.00";
                return `<p>${item.quantity} x ${item.description} - $${price}</p>`;
              })
              .join("")}
            <h3>Shipping Address</h3>
            <p>${orderData.shippingInfo.address.line1 || ""}, ${
    orderData.shippingInfo.address.city || ""
  }, ${orderData.shippingInfo.address.state || ""}, ${
    orderData.shippingInfo.address.postal_code || ""
  }, ${orderData.shippingInfo.address.country || ""}</p>
            <h3>Order Summary</h3>
            <p>Subtotal: $${orderData.subtotal?.toFixed(2) || "0.00"}</p>
            <p>Tax: $${(
              lineItems.reduce((acc, item) => acc + (item.amount_tax || 0), 0) /
              100
            ).toFixed(2)}</p>
            <p>Shipping: $${
              orderData.shippingInfo?.shippingCost?.toFixed(2) || "0.00"
            }</p>
            <p>Total: $${orderData.totalPrice?.toFixed(2) || "0.00"} CAD</p>
          </td>
        </tr>
        <tr>
          <td style="padding: 20px; text-align: center; background-color: #f8f9fa;">
            <img src="https://logos-muchio.s3.us-west-2.amazonaws.com/muchio_logo.webp" alt="Muchio" style="width: 100px;">
            <p style="font-size: 14px; color: #666; margin-top: 10px;">Your order will be shipped soon. You will receive a confirmation email when your order is on its way.</p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return { emailSubject, emailText, emailHtml };
};
