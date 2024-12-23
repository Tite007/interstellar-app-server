import express from "express";
import { Order } from "../models/OrderModel.js"; // Adjust the path as necessary
import mongoose from "mongoose";
import { Counter } from "../models/CounterModel.js"; // Adjust the path as necessary
import { UserModel } from "../models/UserModel.js";
import { sendFulfillmentEmail } from "../utils/fulfillmentEmail.js"; // Adjust the path to your email utility
import { Products } from "../models/ProductModel.js"; // Import product model

const router = express.Router();

// Route to update order tracking information
router.put("/updateOrderTracking/:id", async (req, res) => {
  const { id } = req.params;
  const { trackingNumber, carrier } = req.body;

  try {
    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { trackingNumber, carrier, fulfillmentStatus: "fulfilled" },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json(updatedOrder);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to update order", error: error.message });
  }
});

// Route to send fulfillment email
router.post("/sendFulfillmentEmail/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;
    const { userDetails, trackingNumber, carrier, orderData } = req.body;

    if (!userDetails || !trackingNumber || !carrier || !orderData) {
      return res.status(400).json({ error: "Missing required data" });
    }

    // Fetch the order from the database to get the product IDs
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Fetch product details for each item in the order
    const lineItemsWithImages = await Promise.all(
      order.items.map(async (item) => {
        // Fetch the product details by productId
        const product = await Products.findById(item.productId).exec();
        if (!product) {
          throw new Error(`Product with ID ${item.productId} not found`);
        }

        // Return the item with product images
        return {
          ...item.toObject(), // Convert the Mongoose object to a plain JS object
          productDetails: {
            ...item.productDetails,
            images: product.images, // Add the images from the product
          },
        };
      })
    );

    // Fulfillment status (you can pass this from the frontend or derive it from the order)
    const fulfillmentStatus = "Shipped"; // Example status, adjust as needed

    // Call the sendFulfillmentEmail function with the updated lineItems containing images
    await sendFulfillmentEmail({
      userDetails,
      trackingNumber,
      carrier,
      orderData,
      lineItems: lineItemsWithImages, // Updated lineItems with product images
      fulfillmentStatus,
    });

    res.status(200).json({ message: "Fulfillment email sent successfully" });
  } catch (error) {
    console.error("Error sending fulfillment email:", error);
    res.status(500).json({ error: "Failed to send fulfillment email" });
  }
});

// Route to create a new order
router.post("/create-order", async (req, res) => {
  console.log("Request body:", req.body);

  try {
    const {
      user,
      items,
      totalPrice,
      shippingInfo,
      subtotal,
      paymentStatus,
      customer_details,
    } = req.body;

    if (!user || !items || items.length === 0 || totalPrice == null) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Find or create user
    const name = customer_details?.name || "";
    const address = customer_details?.address || {};
    const [firstName, lastName] = name.split(" ");

    let userId;
    const existingUser = await UserModel.findOne({ email: user });

    if (existingUser) {
      if (firstName) existingUser.name = firstName;
      if (lastName) existingUser.lastName = lastName;
      if (address.line1) existingUser.street = address.line1;
      if (address.city) existingUser.city = address.city;
      if (address.state) existingUser.province = address.state;
      if (address.postal_code) existingUser.postalCode = address.postal_code;
      if (address.country) existingUser.country = address.country;

      await existingUser.save();
      userId = existingUser._id;
    } else {
      const newUser = new UserModel({
        email: user,
        name: firstName || "",
        lastName: lastName || "",
        street: address.line1 || "",
        city: address.city || "",
        province: address.state || "",
        postalCode: address.postal_code || "",
        country: address.country || "",
        phone: customer_details?.phone || "",
        admin: false,
        isActive: true,
        emailSubscribed: false,
        smsSubscribed: false,
      });
      const savedUser = await newUser.save();
      userId = savedUser._id;
    }

    // Increment order number
    const counter = await Counter.findByIdAndUpdate(
      { _id: "orderNumber" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    const orderNumber = counter.seq;

    // Create order
    const order = new Order({
      user: userId,
      items: items.map((item) => ({
        productId: item.productId, // Ensure this is passed as a string
        variantId: item.variantId || "",
        name: item.name,
        variantName: item.variantName || "",
        quantity: item.quantity,
        price: item.price,
        total: item.total,
      })),
      shippingInfo: {
        carrierName: shippingInfo.carrierName,
        shippingCost: shippingInfo.shippingCost,
        address: shippingInfo.address,
        shippingOption: shippingInfo.shippingOption,
      },
      subtotal,
      totalPrice,
      orderNumber,
      paymentStatus,
    });

    await order.save();

    res.status(201).json(order);
  } catch (error) {
    console.error("Order creation failed:", error);
    res.status(500).json({ message: error.message });
  }
});

// Route to delete a order by ID
router.delete("/deleteOrder/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const deletedOrder = await Order.findOneAndDelete({ _id: id });
    if (!deletedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }
    res.status(200).json({ message: "Order deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to delete order", error: error.message });
  }
});

// Add new route to fetch top 10 most sold products
router.get("/topProducts", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; // Default to page 1
    const limit = 10; // Limit to 10 products per page
    const skip = (page - 1) * limit; // Calculate how many documents to skip

    // Get paginated top products
    const topProducts = await Order.aggregate([
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.name",
          totalSold: { $sum: "$items.quantity" },
          totalRevenue: {
            $sum: { $multiply: ["$items.quantity", "$items.price"] },
          },
        },
      },
      {
        $project: {
          _id: 0,
          name: "$_id",
          totalSold: 1,
          totalRevenue: 1,
        },
      },
      { $sort: { totalSold: -1 } },
      { $skip: skip }, // Skip records based on page number
      { $limit: limit }, // Limit the number of results to 10
    ]);

    // Get total number of distinct products
    const totalProductsCount = await Order.aggregate([
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.name",
        },
      },
      {
        $count: "totalProducts", // Count distinct products
      },
    ]);

    const totalProducts =
      totalProductsCount.length > 0 ? totalProductsCount[0].totalProducts : 0;
    const totalPages = Math.ceil(totalProducts / limit); // Calculate total pages

    res.status(200).json({
      topProducts,
      totalPages,
      currentPage: page,
    });
  } catch (error) {
    console.error("Failed to fetch top products:", error);
    res.status(500).json({
      message: "Failed to fetch top products",
      error: error.message,
    });
  }
});

// Route to find an Order by ID
router.get("/findOrder/:id", async (req, res) => {
  const { id } = req.params;
  console.log("Finding order with ID:", id); // Log the ID being searched

  try {
    const order = await Order.findOne({ _id: id }).exec();
    console.log("Order found:", order); // Log the found order
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    res.status(200).json(order);
  } catch (error) {
    console.error("Error finding order:", error);
    res
      .status(500)
      .json({ message: "Failed to get order", error: error.message });
  }
});
// Route to get all orders (no changes here)
router.get("/getAllOrders", async (req, res) => {
  try {
    const orders = await Order.find().populate("user").exec();
    res.status(200).json(orders);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to get orders", error: error.message });
  }
});

router.get("/getCustomerSpending", async (req, res) => {
  try {
    const customerSpending = await Order.aggregate([
      {
        $group: {
          _id: "$user", // Group by the user field
          totalSpending: { $sum: "$totalPrice" }, // Sum totalPrice for each group
        },
      },
      {
        $lookup: {
          from: "users", // Assuming your users collection is named 'users'
          localField: "_id",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      {
        $unwind: "$userDetails", // Flatten the userDetails array
      },
      {
        $project: {
          _id: 1,
          totalSpending: 1,
          name: "$userDetails.name", // Include any other user fields you need
          email: "$userDetails.email",
        },
      },
    ]);

    res.status(200).json(customerSpending);
  } catch (error) {
    console.error("Failed to fetch customer spending:", error);
    res.status(500).json({ message: error.message });
  }
});

// Add this new route to fetch the total number of orders
router.get("/totalOrders", async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments({});
    res.status(200).json({ totalOrders });
  } catch (error) {
    console.error("Failed to fetch total orders:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch total orders", error: error.message });
  }
});

// Fetch orders for a specific user
router.get("/getUserOrders/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const orders = await Order.find({ user: userId });
    console.log(`Fetched orders for user ${userId}:`, orders);
    res.status(200).json(orders);
  } catch (error) {
    console.error("Error fetching user orders:", error);
    res.status(500).json({ message: "Error fetching user orders", error });
  }
});

export { router as orderRouter };
