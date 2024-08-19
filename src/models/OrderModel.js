import mongoose from "mongoose";

// Define a schema for order items
const orderItemSchema = new mongoose.Schema({
  product: {
    type: String, // Change to String
    required: true,
  },
  variant: {
    type: String, // Change to String
    required: false,
  },
  name: {
    type: String,
    required: true,
  },
  variantName: {
    type: String,
    required: false,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  price: {
    type: Number,
    required: true,
  },
  total: {
    type: Number,
    required: true,
  },
});

// Define a schema for shipping information
const shippingInfoSchema = new mongoose.Schema({
  carrierName: {
    type: String,
    required: true,
  },
  shippingCost: {
    type: Number,
    required: true,
  },
  shippingOption: {
    type: String,
    required: true, // Add this line
  },
  address: {
    type: Object, // Add this line if you want to store the address as an object
    required: true, // Add this line if you want to make it required
  },
});

// Define a schema for tax information
const taxInfoSchema = new mongoose.Schema({
  taxName: {
    type: String,
    required: true,
  },
  taxPercentage: {
    type: Number,
    required: true,
  },
});

// Define the main Order schema
const OrderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    items: [orderItemSchema],
    subtotal: {
      type: Number,
      required: true,
    },
    shippingInfo: shippingInfoSchema,
    taxInfo: taxInfoSchema,
    totalPrice: {
      type: Number,
      required: true,
    },
    orderNumber: {
      type: Number,
      unique: true,
    },
    paymentStatus: {
      type: String,
      default: "pending",
    },
    paymentEventId: {
      type: String,
    },
    trackingNumber: {
      type: String,
    },
    carrier: {
      type: String,
    },
    fulfillmentStatus: {
      type: String,
      default: "unfulfilled",
    },
  },
  { timestamps: true }
);

export const Order = mongoose.model("Order", OrderSchema);
