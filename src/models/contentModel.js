// server/src/models/contentModel.js
import mongoose from "mongoose";

const authorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  url: { type: String },
  type: { type: String, default: "Person" },
});

const seoSchema = new mongoose.Schema({
  title: { type: String },
  excerpt: { type: String },
  keywords: { type: String },
});

const contentSchema = new mongoose.Schema(
  {
    headline: { type: String, required: true },
    image: [{ type: String }],
    datePublished: { type: Date, required: true },
    dateModified: { type: Date },
    author: [authorSchema],
    content: { type: String, required: true },
    status: { type: String, enum: ["draft", "published"], required: true },
    seo: seoSchema, // Add SEO fields
  },
  {
    timestamps: true, // This option will add createdAt and updatedAt fields
  }
);

const Content = mongoose.model("Content", contentSchema);

export default Content;
