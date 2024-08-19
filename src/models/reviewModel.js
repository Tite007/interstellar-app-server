import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
    required: true,
  },
  rating: {
    type: Number,
  },
  comment: {
    type: String,
    required: true,
  },
  time: {
    type: Date,
    default: Date.now,
  },
  replies: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Review",
    },
  ],
  parentReview: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Review",
    default: null, // Default to null for top-level reviews
  },
});

export const ReviewModel = mongoose.model("Review", reviewSchema);
