import mongoose from "mongoose";

// Define schema for variant options
const variantOptionSchema = new mongoose.Schema({
  value: String,
  price: Number,
  sku: String,
  quantity: Number,
  costPrice: Number,
  margin: String,
  profit: Number,
  compareAtPrice: Number,
  stripeProductId: { type: String, unique: true }, // Add Stripe Product ID here
});

// Define schema for variants
const variantSchema = new mongoose.Schema({
  optionName: String,
  optionValues: [variantOptionSchema],
  images: [{ type: String }],
});

// Define the main product schema
const productsSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String },
  sku: { type: String, required: true },
  stripeProductId: { type: String, unique: true }, // Parent Stripe Product ID
  price: { type: Number, required: true, min: 0 },
  costPrice: { type: Number, required: true, min: 0 },
  profit: { type: Number, min: 0, required: true },
  margin: { type: String },
  inventoryType: {
    type: String,
    enum: ["track", "doNotTrack", "trackByOptions"],
    default: "track",
  },
  currentStock: { type: Number, min: 0 },
  lowStockLevel: { type: Number, min: 0 },
  stock: { type: Number, min: 0 },
  size: { type: String }, // Handle any size value
  images: [{ type: String }],
  subtitle: { type: String },
  compareAtPrice: { type: Number, min: 0 },
  seoTitle: { type: String },
  seoDescription: { type: String },
  seoKeywords: { type: String },
  time: { type: Date, default: Date.now },
  variants: [variantSchema], // List of variants
  roastLevel: { type: String },
  technicalData: {
    country: { type: String },
    region: { type: String },
    producer: { type: String },
    elevationRange: { type: String },
    dryingMethod: { type: String },
    processingMethod: { type: String },
    tasteNotes: { type: String },
  },
  reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: "Review" }], // Correctly placed reviews field
});

// Adding an index to the sku field for faster queries
productsSchema.index({ sku: 1 });

export const Products = mongoose.model("Product", productsSchema);
