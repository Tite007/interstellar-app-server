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
    console.log("Webhook triggered: checkout.session.completed");
    console.log("Session data:", JSON.stringify(session, null, 2));

    const customer = await findOrCreateCustomer(session.customer_details);
    console.log("Customer found or created:", customer.id);

    const lineItems = await getLineItemsWithProductDetails(session.id);
    console.log("Line items retrieved:", JSON.stringify(lineItems, null, 2));

    const orderData = await buildOrderData(session, customer, lineItems);
    console.log("Order data built:", JSON.stringify(orderData, null, 2));

    const order = await createOrder(orderData);
    console.log("Order created:", order);

    await updateProductStock(lineItems);
    console.log("Stock update completed");

    const { emailSubject, emailText, emailHtml } =
      generateOrderConfirmationEmail(customer, orderData, lineItems);
    await sendEmail(orderData.user, emailSubject, emailText, emailHtml);
    console.log("Order confirmation email sent.");
  } catch (error) {
    console.error("Error in handleCheckoutSessionCompleted:", error.stack);
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

const buildOrderData = async (session, customer, lineItems) => {
  return {
    user: customer.email,
    items: lineItems.map((item) => {
      const productId = item.productDetails.metadata.productId;
      const variantId = item.productDetails.metadata.variantId || null;
      const variantName = item.productDetails.metadata.variantName || null;

      return {
        productId: productId,
        variantId: variantId,
        name: item.description, // Full name with variant (e.g., "Finca Santa Rosa Washed - 1kg")
        variantName: variantName, // Still include for reference (e.g., "1kg")
        quantity: item.quantity,
        price: item.amount_total / item.quantity / 100,
        total: item.amount_total / 100,
        image: item.productDetails.images
          ? item.productDetails.images[0]
          : null,
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

const updateProductStock = async (lineItems) => {
  console.log("Starting stock update for line items:", lineItems.length);
  console.log("Line items:", JSON.stringify(lineItems, null, 2));

  for (const item of lineItems) {
    const productId = item.price.product.metadata.productId;
    const variantId = item.price.product.metadata.variantId || null;
    console.log(
      `Processing stock update - Product ID: ${productId}, Variant ID: ${variantId}, Quantity: ${item.quantity}`
    );

    const product = await Products.findById(productId);
    if (product) {
      console.log(
        `Product found: ${product.name}, Variants: ${JSON.stringify(product.variants, null, 2)}`
      );
      if (variantId && variantId !== "") {
        console.log(`Updating variant stock for Variant ID: ${variantId}`);
        updateVariantStock(product, variantId, item.quantity);
      } else {
        console.log(`Updating main product stock`);
        updateMainProductStock(product, item.quantity);
      }
      await product.save();
      const updatedVariant = variantId
        ? product.variants.find((v) => v._id.toString() === variantId)
        : null;
      console.log(
        `Product saved: ${product.name}, Updated stock: ${variantId ? updatedVariant?.optionValues[0]?.quantity : product.currentStock}`
      );
    } else {
      console.error(`Product not found for ID: ${productId}`);
    }
  }
};

const updateVariantStock = (product, variantId, quantity) => {
  const variant = product.variants.find((v) => v._id.toString() === variantId);
  if (variant) {
    const option = variant.optionValues[0];
    if (option) {
      if (option.quantity >= quantity) {
        option.quantity -= quantity;
        console.log(
          `Stock updated for variant ID: ${variantId}, new quantity: ${option.quantity}`
        );
      } else {
        console.error(
          `Insufficient stock for variant ID: ${variantId}, current: ${option.quantity}, requested: ${quantity}`
        );
        throw new Error(`Insufficient stock for variant ID: ${variantId}`);
      }
    } else {
      console.error(`No option values found for variant ID: ${variantId}`);
      throw new Error(`No option values found for variant ID: ${variantId}`);
    }
  } else {
    console.error(
      `Variant not found for ID: ${variantId} in product ${product._id}`
    );
    throw new Error(`Variant not found for ID: ${variantId}`);
  }
};

const updateMainProductStock = (product, quantity) => {
  if (product.currentStock >= quantity) {
    product.currentStock -= quantity;
    console.log(
      `Stock updated for product ID: ${product._id}, new quantity: ${product.currentStock}`
    );
  } else {
    console.error(
      `Insufficient stock for product ID: ${product._id}, current: ${product.currentStock}, requested: ${quantity}`
    );
    throw new Error(`Insufficient stock for product ID: ${product._id}`);
  }
};
