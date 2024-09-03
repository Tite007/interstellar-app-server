//original code
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
        const price = item.price.unit_amount
          ? (item.price.unit_amount / 100).toFixed(2)
          : "0.00";
        const total = ((item.price.unit_amount * item.quantity) / 100).toFixed(
          2
        );
        return `${item.quantity} x ${item.description} - $${price} (Total: $${total})`;
      })
      .join("\n")}
    
    Shipping Address:
    ${orderData.shippingInfo.address.line1}, ${orderData.shippingInfo.address.city}, ${orderData.shippingInfo.address.state}, ${orderData.shippingInfo.address.postal_code}, ${orderData.shippingInfo.address.country}
    
    Subtotal: $${orderData.subtotal.toFixed(2)}
    Shipping: $${orderData.shippingInfo.shippingCost.toFixed(2)}
    Total: $${orderData.totalPrice.toFixed(2)}
    
    Your order will be shipped soon. You will receive a confirmation email when your order is on its way.
    
    Thank you for shopping with us!
  `;

  const emailHtml = `
    <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            color: #333;
            line-height: 1.5;
            padding: 12px;
          }
          h1 {
            font-size: 24px;
            color: #333;
          }
          h3 {
            font-size: 18px;
            color: #555;
            margin-top: 20px;
          }
          p {
            font-size: 14px;
            color: #555;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          th, td {
            padding: 10px;
            text-align: left;
            border-bottom: 1px solid #ddd;
          }
          th {
            background-color: #f8f8f8;
          }
          .total-row th, .total-row td {
            text-align: right;
            font-weight: bold;
          }
          .product-image {
            width: 50px;
            height: 50px;
            object-fit: cover;
            border-radius: 8px;
          }
        </style>
      </head>
      <body>
        <h1>Thank you for your order, ${customer.name}!</h1>
        <p>Here are the details of your purchase:</p>
        <table>
          <thead>
            <tr>
              <th>Image</th>
              <th>Description</th>
              <th style="text-align: right;">Qty</th>
              <th style="text-align: right;">Unit Price</th>
              <th style="text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${lineItems
              .map((item) => {
                const price = item.price.unit_amount
                  ? (item.price.unit_amount / 100).toFixed(2)
                  : "0.00";
                const total = (
                  (item.price.unit_amount * item.quantity) /
                  100
                ).toFixed(2);
                return `
                    <tr>
                      <td><img src="${item.productDetails.images[0]}" alt="${item.description}" class="product-image" /></td>
                      <td>${item.description}</td>
                      <td style="text-align: right;">${item.quantity}</td>
                      <td style="text-align: right;">$${price}</td>
                      <td style="text-align: right;">$${total}</td>
                    </tr>
                  `;
              })
              .join("")}
          </tbody>
          <tfoot>
            <tr class="total-row">
              <th colspan="4">Subtotal:</th>
              <td>$${orderData.subtotal.toFixed(2)}</td>
            </tr>
            <tr class="total-row">
              <th colspan="4">Shipping (Standard Shipping):</th>
              <td>$${orderData.shippingInfo.shippingCost.toFixed(2)}</td>
            </tr>
            <tr class="total-row">
              <th colspan="4">Total:</th>
              <td>$${orderData.totalPrice.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
        <h3>Shipping Address:</h3>
        <p>
          ${orderData.shippingInfo.address.line1},<br>
          ${orderData.shippingInfo.address.city},<br>
          ${orderData.shippingInfo.address.state},<br>
          ${orderData.shippingInfo.address.postal_code},<br>
          ${orderData.shippingInfo.address.country}
        </p>
        <p>Your order will be shipped soon. You will receive a confirmation email when your order is on its way.</p>
        <p>Thank you for shopping with us!</p>
      </body>
    </html>
  `;

  return { emailSubject, emailText, emailHtml };
};
