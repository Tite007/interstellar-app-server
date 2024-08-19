import { Products } from "../models/ProductModel.js";
import Stripe from "stripe";
import dotenv from "dotenv";
dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const handleCheckoutSessionCompleted = async (session) => {
  try {
    console.log("Session data:", session);

    const customer = await findOrCreateCustomer(session.customer_details);
    const lineItems = await getLineItems(session.id);
    const orderData = await buildOrderData(session, customer, lineItems);

    const order = await createOrder(orderData);
    console.log("Order created:", order);

    await updateProductStock(lineItems);
  } catch (error) {
    console.error("Error handling checkout session completed:", error);
    throw error;
  }
};

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

const getLineItems = async (sessionId) => {
  const lineItemsResponse =
    await stripe.checkout.sessions.listLineItems(sessionId);
  return lineItemsResponse.data;
};

const buildOrderData = async (session, customer, lineItems) => {
  return {
    user: customer.email,
    items: lineItems.map((item) => ({
      product: item.price.product, // Use the product ID from Stripe
      name: item.description,
      quantity: item.quantity,
      price: item.amount_total / item.quantity / 100,
      total: item.amount_total / 100,
    })),
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
  };
};

const createOrder = async (orderData) => {
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

  return response.json();
};

const updateProductStock = async (lineItems) => {
  const updatedMainProducts = new Set();

  for (const item of lineItems) {
    const [productName, variantValue] = item.description.split(" - ");
    const product = await Products.findOne({ name: productName });

    if (product) {
      updateMainProductStock(product, item.quantity, updatedMainProducts);
      updateVariantStock(product, variantValue, item.quantity);
      await product.save();
    } else {
      console.error(`Product not found: ${item.description}`);
    }
  }
};

const updateMainProductStock = (product, quantity, updatedMainProducts) => {
  if (!updatedMainProducts.has(product.name)) {
    product.currentStock -= quantity;
    updatedMainProducts.add(product.name);
  }
};

const updateVariantStock = (product, variantValue, quantity) => {
  for (const variant of product.variants) {
    for (const option of variant.optionValues) {
      if (option.value === variantValue) {
        option.quantity -= quantity;
      }
    }
  }
};
