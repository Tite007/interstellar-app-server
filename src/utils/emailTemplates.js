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
    ${orderData.shippingInfo.address.line1}, ${
    orderData.shippingInfo.address.city
  }, ${orderData.shippingInfo.address.state}, ${
    orderData.shippingInfo.address.postal_code
  }, ${orderData.shippingInfo.address.country}
    
    Subtotal: $${orderData.subtotal.toFixed(2)}
    Shipping: $${orderData.shippingInfo.shippingCost.toFixed(2)}
    Total: $${orderData.totalPrice.toFixed(2)}
    
    Your order will be shipped soon. You will receive a confirmation email when your order is on its way.
    
    Thank you for shopping with us!
  `;

  const emailHtml = `
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Purchase Confirmation</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 20px;
            background-color: #f9f9f9;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 10px;
            background-color: #ffffff;
          }
          h1 {
            font-size: 24px;
            font-weight: bold;
            text-align: center;
            margin-bottom: 20px;
          }
          .item {
            border: 1px solid #ddd;
            margin-bottom: 20px;
            background-color: #fff;
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .item-image img {
            width: 100%;
            max-width: 300px;
            height: auto;
            margin-bottom: 15px;
          }
          .item-details {
            width: 100%;
            padding: 15px;
            text-align: center;
          }
          .item-details h2 {
            font-size: 20px;
            margin: 0 0 10px;
          }
          .item-details p {
            margin: 0 0 5px;
          }
          .item-details p:last-of-type {
            margin-bottom: 10px;
          }
          .item-details .price {
            font-size: 18px;
            font-weight: bold;
          }
          .order-summary, .order-total {
            background-color: #fff;
            padding: 15px;
            border: 1px solid #ddd;
          }
          .order-summary p, .order-total p {
            display: flex;
            justify-content: space-between;
            margin: 5px 0;
          }
          .order-summary p {
            display: flex;
            justify-content: space-between;
          }
          .order-total {
            border-top: 2px solid #333;
            margin-top: 20px;
            padding-top: 10px;
          }
          .order-total p {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
          }
          .total-text {
            font-size: 20px;
            font-weight: bold;
          }
          .total-price {
            font-size: 24px;
            font-weight: bold;
          }
          .currency {
            font-size: 18px;
          }
          .shipping-address {
            margin-top: 20px;
            background-color: #fff;
            padding: 15px;
            border: 1px solid #ddd;
          }
          .shipping-address h3 {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          /* Ensuring proper spacing between columns on large screens */
          @media only screen and (min-width: 600px) {
            .order-summary p, .order-total p {
              justify-content: space-between;
              display: flex;
            }
            .order-summary p span {
              width: 80%; /* Ensure both sides have enough space */
            }
            .total-text {
              text-align: left;
              width: 50%;
            }
            .total-price {
              text-align: right;
              width: 50%;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
        <h1>Order Confirmation</h1>
        <p>Thank you for your order, ${customer.name}!</p>
        <p>Here are the details of your purchase:</p>
          <h1>Items Purchased</h1>
          
          ${lineItems
            .map(
              (item) => `
          <div class="item">
              <div class="item-image">
                  <img src="${item.productDetails.images[0]}" alt="${
                item.description
              }">
              </div>
              <div class="item-details">
                  <h2>${item.description}</h2>
                  <p>${item.productDetails.color || "N/A"}</p>
                  <p>Size: ${item.productDetails.size || "N/A"} Qty: ${
                item.quantity
              }</p>
                  <p>${item.productDetails.sku || "N/A"}</p>
                  <p class="price">$${(item.price.unit_amount / 100).toFixed(
                    2
                  )}</p>
              </div>
          </div>
          `
            )
            .join("")}
    
          <div class="order-summary">
              <p>
                  <span>Subtotal (${lineItems.length} item${
    lineItems.length > 1 ? "s" : ""
  })</span>
                  <span>$${orderData.subtotal.toFixed(2)}</span>
              </p>
              <p>
                  <span>Standard Shipping</span>
                  <span>$${orderData.shippingInfo.shippingCost.toFixed(
                    2
                  )}</span>
              </p>
              <p>
                  <span>GST/HST</span>
                  <span>$${(orderData.totalPrice * 0.05).toFixed(2)}</span>
              </p>
              <p>
                  <span>PST</span>
                  <span>$${(orderData.totalPrice * 0.07).toFixed(2)}</span>
              </p>
          </div>
    
          <div class="order-total">
              <p>
                  <span class="total-text">Order Total</span>
                  <span>
                      <span class="total-price">$${orderData.totalPrice.toFixed(
                        2
                      )}</span>
                      <br>
                      <span class="currency">CAD</span>
                  </span>
              </p>
          </div>
    
          <div class="shipping-address">
              <h3>Shipping Address:</h3>
              <p>
                  ${orderData.shippingInfo.address.line1},<br>
                  ${orderData.shippingInfo.address.city},<br>
                  ${orderData.shippingInfo.address.state},<br>
                  ${orderData.shippingInfo.address.postal_code},<br>
                  ${orderData.shippingInfo.address.country}
              </p>
              <p>Shipping Method: Standard Shipping</p>
              <p>Estimated Delivery: ${new Date(
                Date.now() + 7 * 24 * 60 * 60 * 1000
              ).toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}</p>
          </div>
    
          <p>Your order will be shipped soon. You will receive a confirmation email when your order is on its way.</p>
          <p>Thank you for shopping with us!</p>
        </div>
      </body>
    </html>
  `;

  return { emailSubject, emailText, emailHtml };
};
