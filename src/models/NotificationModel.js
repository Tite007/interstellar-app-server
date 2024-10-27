// models/NotificationModel.js
import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product", // Match exactly with the Product model name
    required: true,
  },
  name: { type: String, required: true },
  email: { type: String, required: true },
  notified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

export const NotificationModel = mongoose.model(
  "Notification",
  notificationSchema
);
