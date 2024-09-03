import Stripe from "stripe";
import dotenv from "dotenv";
import fetch from "node-fetch";
import { Products } from "../models/ProductModel.js";
import mongoose from "mongoose";
import { sendEmail } from "../utils/email.js"; // Import the email utility
import { generateOrderConfirmationEmail } from "../utils/emailTemplates.js"; // Import the email template utility

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const handleCheckoutSessionCompleted = async (session) => {
  try {
    console.log("Session data:", session);

    const customer = await findOrCreateCustomer(session.customer_details);
    const lineItems = await getLineItemsWithProductDetails(session.id); // Get line items with product details
    const orderData = await buildOrderData(session, customer, lineItems);

    const order = await createOrder(orderData);
    console.log("Order created:", order);

    await updateProductStock(lineItems);

    // Generate and send the confirmation email
    const { emailSubject, emailText, emailHtml } =
      generateOrderConfirmationEmail(customer, orderData, lineItems);
    await sendEmail(orderData.user, emailSubject, emailText, emailHtml);
    console.log("Order confirmation email sent.");
  } catch (error) {
    console.error("Error handling checkout session completed:", error);
    throw error;
  }
};

// Create a new customer if one doesn't exist
const findOrCreateCustomer = async (customerDetails) => {
  if (!customerDetails) {
    throw new Error("Missing customer details in session");
  }

  const { email, name, address, phone } = customerDetails;
  const customers = await stripe.customers.list({ email, limit: 1 });

  if (customers.data.length > 0) {
    return customers.data[0];
  } else {
    return await stripe.customers.create({ email, name, address, phone });
  }
};

// Retrieve line items from the session
const getLineItemsWithProductDetails = async (sessionId) => {
  try {
    // Retrieve line items from the session
    const lineItemsResponse = await stripe.checkout.sessions.listLineItems(
      sessionId,
      {
        expand: ["data.price.product"], // Expand to get product details
      }
    );

    // Fetch product details for each line item
    const lineItems = await Promise.all(
      lineItemsResponse.data.map(async (item) => {
        const productId =
          typeof item.price.product === "string"
            ? item.price.product
            : item.price.product.id; // Ensure we have a string ID

        const product = await stripe.products.retrieve(productId);

        return {
          ...item,
          productDetails: product, // Attach the fetched product details, including images
        };
      })
    );

    return lineItems;
  } catch (error) {
    console.error("Error fetching line items or product details:", error);
    throw error; // Rethrow to handle this in your higher-level function
  }
};

// Build order data to send to your order creation API
const buildOrderData = async (session, customer, lineItems) => {
  return {
    user: customer.email,
    items: lineItems.map((item) => {
      const productId = item.productDetails.metadata.productId;
      const variantId = item.productDetails.metadata.variantId || null;

      return {
        productId: productId, // Use the productId directly as a string
        variantId: variantId, // Use the variantId directly as a string
        name: item.description,
        variantName: item.productDetails.metadata.variantName || null,
        quantity: item.quantity,
        price: item.amount_total / item.quantity / 100,
        total: item.amount_total / 100,
        image: item.productDetails.images
          ? item.productDetails.images[0]
          : null, // Correctly access the image
      };
    }),
    shippingInfo: {
      carrierName: "Your Carrier",
      shippingCost: session.shipping_cost.amount_total / 100,
      address: session.shipping_details.address,
      shippingOption: "Standard Shipping",
    },
    subtotal: session.amount_subtotal / 100,
    totalPrice: session.amount_total / 100,
    paymentStatus: session.payment_status,
    customer_details: session.customer_details,
    metadata: session.metadata,
  };
};

// Create an order in your database
const createOrder = async (orderData) => {
  try {
    // Send order data to your order creation API
    const response = await fetch(
      `${process.env.SERVER_API_BASE_URL}/orders/create-order`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to create order: ${response.statusText}`);
    }

    return await response.json(); // Return the order response from the server
  } catch (error) {
    console.error("Order creation failed:", error.message);
    throw error;
  }
};

// Update product stock in your database
const updateProductStock = async (lineItems) => {
  for (const item of lineItems) {
    const productId = item.price.product.metadata.productId; // Use string-based productId
    const product = await Products.findById(productId);

    if (product) {
      if (item.price.product.metadata.variantId) {
        // Handle variant stock update
        const variantId = item.price.product.metadata.variantId; // Use string-based variantId
        updateVariantStock(product, variantId, item.quantity);
      } else {
        // Handle main product stock update
        updateMainProductStock(product, item.quantity);
      }

      await product.save();
    } else {
      console.error(`Product not found: ${item.description}`);
    }
  }
};

// Update stock for the main product
const updateMainProductStock = (product, quantity) => {
  if (product.currentStock >= quantity) {
    product.currentStock -= quantity;
    console.log(`Stock updated for product ID: ${product._id}`);
  } else {
    console.error(`Insufficient stock for product ID: ${product._id}`);
    throw new Error(`Insufficient stock for product ID: ${product._id}`);
  }
};

// Update stock for a specific variant
const updateVariantStock = (product, variantId, quantity) => {
  // Find the variant that contains the correct option value
  const variant = product.variants.find((v) =>
    v.optionValues.some((opt) => opt._id.toString() === variantId)
  );

  if (variant) {
    // Now find the specific option value inside the located variant
    const option = variant.optionValues.find(
      (opt) => opt._id.toString() === variantId
    );

    if (option) {
      if (option.quantity >= quantity) {
        option.quantity -= quantity;
        console.log(`Stock updated for variant ID: ${variantId}`);
      } else {
        console.error(`Insufficient stock for variant ID: ${variantId}`);
        throw new Error(`Insufficient stock for variant ID: ${variantId}`);
      }
    } else {
      console.error(`Option not found for variant ID: ${variantId}`);
    }
  } else {
    console.error(`Variant not found for ID: ${variantId}`);
  }
};
