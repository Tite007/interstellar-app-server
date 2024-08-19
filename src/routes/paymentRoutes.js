// server/routes/paymentRoutes.js

import express from "express";
import Stripe from "stripe";
import dotenv from "dotenv";
import { Order } from "../models/OrderModel.js"; // Adjust the path as necessary
import fetch from "node-fetch"; // Ensure node-fetch is installed
import { Products } from "../models/ProductModel.js"; // Import Products model
import { handleCheckoutSessionCompleted } from "../hanlders/webhookHandlers.js"; // Import the handler

dotenv.config();

const router = express.Router();

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Function to get shipping options - using variant and product image
const getShippingOptions = () => [
  {
    shipping_rate_data: {
      display_name: "Standard Shipping",
      delivery_estimate: {
        minimum: { unit: "day", value: 5 },
        maximum: { unit: "day", value: 7 },
      },
      fixed_amount: {
        amount: 500,
        currency: "usd",
      },
      type: "fixed_amount",
    },
  },
  {
    shipping_rate_data: {
      display_name: "Express Shipping",
      delivery_estimate: {
        minimum: { unit: "day", value: 1 },
        maximum: { unit: "day", value: 2 },
      },
      fixed_amount: {
        amount: 1500,
        currency: "usd",
      },
      type: "fixed_amount",
    },
  },
];

// Function to map items to line items
const mapItemToLineItem = (item, products) => {
  const [productName, variantValue] = item.name.split(" - ");
  const product = products.find((p) => p.name === productName);
  if (!product) {
    throw new Error(`Product not found for name: ${productName}`);
  }

  const variant = product.variants?.find((v) =>
    v.optionValues.some((ov) => ov.value === variantValue)
  );

  const variantOption = variant?.optionValues.find(
    (v) => v.value === variantValue
  );
  const name = variantOption
    ? `${product.name} - ${variantOption.value}`
    : product.name;
  const price = variantOption ? variantOption.price : product.price;
  const image = (variant && variant.images?.[0]) || product.images?.[0] || null;

  const productData = {
    name: name,
  };

  if (image) {
    productData.images = [image];
  }

  return {
    price_data: {
      currency: "usd",
      product_data: productData,
      unit_amount: Math.round(price * 100),
    },
    adjustable_quantity: {
      enabled: true,
      minimum: 1,
      maximum: 10,
    },
    quantity: item.quantity,
  };
};

// Route to create a checkout session
router.post("/checkout", async (req, res) => {
  try {
    const { items, YOUR_DOMAIN } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).send({ error: "No items provided" });
    }

    const productNames = items.map((item) => item.name.split(" - ")[0]);
    const products = await Products.find({ name: { $in: productNames } });

    if (products.length === 0) {
      return res.status(400).send({ error: "No products found" });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: items.map((item) => mapItemToLineItem(item, products)),
      mode: "payment",
      success_url: `${YOUR_DOMAIN}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${YOUR_DOMAIN}/cancel`,
      shipping_address_collection: {
        allowed_countries: ["US", "CA"],
      },
      shipping_options: getShippingOptions(),
    });

    res.json({ id: session.id });
  } catch (error) {
    console.error(`Error creating checkout session: ${error.message}`);
    res.status(400).send({ error: error.message });
  }
});

// Route to create a checkout session for existent customer
router.post("/create-checkout-session", async (req, res) => {
  const { items, userInfo, YOUR_DOMAIN, orderId } = req.body; // Accept orderId from the request

  let customerId = "";

  // Check if userInfo already has a stripeCustomerId
  if (userInfo.stripeCustomerId) {
    customerId = userInfo.stripeCustomerId;
  } else {
    try {
      // Search for an existing customer by email
      const customers = await stripe.customers.list({
        email: userInfo.email,
        limit: 1,
      });
      if (customers.data.length > 0) {
        // If an existing customer is found, use their ID
        customerId = customers.data[0].id;
      } else {
        // If no existing customer is found, create a new one
        const newCustomer = await stripe.customers.create({
          email: userInfo.email,
          name: `${userInfo.name} ${userInfo.lastName}`,
          // Add any additional customer information here
        });
        customerId = newCustomer.id;
        // Remember to update your database with the new stripeCustomerId for this user
      }
    } catch (error) {
      return res.status(400).send({ error: error.message });
    }
  }

  try {
    // Create the checkout session with the (new or existing) customerId
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      shipping_address_collection: {
        allowed_countries: ["US", "CA"],
      },
      customer: customerId,
      line_items: items.map((item) => ({
        price_data: {
          currency: "usd",
          product_data: {
            name: item.name,
          },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity,
      })),
      mode: "payment",
      success_url: `${YOUR_DOMAIN}/admin/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${YOUR_DOMAIN}/cancel`,
      metadata: {
        customerName: `${userInfo.name} ${userInfo.lastName}`,
      },
      invoice_creation: {
        enabled: true,
      },
      client_reference_id: orderId, // Use the order ID as client_reference_id
    });

    res.json({ id: session.id });
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
});

// webhook route to handle events
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
      console.log("✅ Success:", event.id);

      // Process the Stripe event here
      switch (event.type) {
        case "checkout.session.completed":
          await handleCheckoutSessionCompleted(event.data.object);
          break;

        default:
          console.log(`Unhandled event type ${event.type}`);
      }

      res.json({ received: true });
    } catch (err) {
      console.error(`Webhook Error: ${err.message}`, err);
      res.status(400).send(`Webhook Error: ${err.message}`);
    }
  }
);

// New route to retrieve a Stripe checkout session by ID
router.get("/stripe/sessions/:sessionId", async (req, res) => {
  const { sessionId } = req.params;

  try {
    // Retrieve the checkout session from Stripe using the session ID
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // Respond with the session data
    res.json(session);
  } catch (error) {
    // Handle any errors that occur during the session retrieval
    console.error("Error retrieving Stripe session:", error.message);
    res.status(500).json({ error: error.message });
  }
});

router.get("/stripe/products/:productId", async (req, res) => {
  const { productId } = req.params;
  console.log(`Received request for product ID: ${productId}`);

  try {
    const product = await stripe.products.retrieve(productId);

    if (!product.active) {
      console.warn(`Product with ID ${productId} is inactive`);
    }

    console.log("Product retrieved successfully:", product);
    res.json(product);
  } catch (error) {
    console.error("Error retrieving Stripe product:", error.message);

    if (error.type === "StripeInvalidRequestError") {
      res.status(404).json({ error: "Product not found" });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// Route to retrieve a checkout session and line items
router.get(
  "/stripe/checkout-sessions/:sessionId/line-items",
  async (req, res) => {
    try {
      const lineItems = await stripe.checkout.sessions.listLineItems(
        req.params.sessionId
      );
      res.json(lineItems);
    } catch (error) {
      console.error("Failed to retrieve line items:", error);
      res.status(400).json({ error: error.message });
    }
  }
);

// New route to retrieve an event and order details
router.get("/stripe/events/:eventId", async (req, res) => {
  const { eventId } = req.params;

  try {
    const event = await stripe.events.retrieve(eventId);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      const order = await Order.findById(session.client_reference_id);

      if (order) {
        res.json({
          event,
          order,
        });
      } else {
        res.status(404).json({ error: "Order not found" });
      }
    } else {
      res.status(400).json({ error: "Event type not supported" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route to create a customer
router.post("/create-customer", async (req, res) => {
  const { email, name, address, phone, shipping } = req.body;
  try {
    const customer = await stripe.customers.create({
      email,
      name,
      address,
      phone,
      shipping,
    });
    res.json({ customer });
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
});

// Route to get Stripe balance
router.get("/stripe/balance", async (req, res) => {
  try {
    const balance = await stripe.balance.retrieve();
    res.json(balance);
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
});

const fetchAllTransactions = async () => {
  let transactions = [];
  let hasMore = true;
  let startingAfter = null;

  while (hasMore) {
    const params = {
      limit: 100,
    };

    if (startingAfter) {
      params.starting_after = startingAfter;
    }

    const response = await stripe.balanceTransactions.list(params);

    transactions = transactions.concat(response.data);
    hasMore = response.has_more;

    if (hasMore) {
      startingAfter = response.data[response.data.length - 1].id;
    }
  }

  return transactions;
};

// Route to get Stripe balance transactions
router.get("/stripe/balance-transactions", async (req, res) => {
  try {
    const balanceTransactions = await fetchAllTransactions();
    res.json(balanceTransactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(400).send({ error: error.message });
  }
});

export { router as paymentRouter };
