// models/categoriesModel.js

import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    default: null,
  }, // Self-referencing to store parent category
  ancestors: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }], // For hierarchy path
  image: { type: String, default: null }, // Add image field to store S3 URL
});

// Create the Category model
export const Category = mongoose.model("Category", categorySchema);
