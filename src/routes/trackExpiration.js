import express from "express";
import { Products } from "../models/ProductModel.js";
import { Category } from "../models/categoriesModel.js";

const router = express.Router();

// Enhanced Route to track products by expiration date with traffic light system
router.get("/trackExpiration", async (req, res) => {
  const {
    daysUntilExpire = 90,
    page = 1,
    limit = 10,
    sortBy = "daysToExpire",
    sortOrder = "asc",
    greenThreshold = 150,
    yellowThreshold = 60,
    category,
  } = req.query;

  try {
    const currentDate = new Date();
    const futureDate = new Date();
    futureDate.setDate(currentDate.getDate() + parseInt(daysUntilExpire));

    // Build the query dynamically based on category (if specified)
    const query = {
      expirationDate: { $lte: futureDate, $gte: currentDate },
    };
    if (category) {
      query.parentCategory = category;
    }

    // Query products with expiration dates within the range
    const products = await Products.find(query)
      .populate("parentCategory")
      .populate("subcategory")
      .sort([[sortBy, sortOrder === "asc" ? 1 : -1]]) // Sorting
      .skip((page - 1) * limit) // Pagination: skip previous pages
      .limit(parseInt(limit)) // Pagination: limit results per page
      .exec();

    if (!products.length) {
      return res
        .status(404)
        .json({ message: "No products found within the expiration range." });
    }

    // Categorize products into green, yellow, and red
    const productData = products.map((product) => {
      const daysToExpire = Math.ceil(
        (new Date(product.expirationDate) - currentDate) / (1000 * 60 * 60 * 24)
      );

      let status;
      if (daysToExpire > greenThreshold) {
        status = "green"; // Long-term expiration
      } else if (
        daysToExpire <= greenThreshold &&
        daysToExpire > yellowThreshold
      ) {
        status = "yellow"; // Warning expiration
      } else if (daysToExpire <= yellowThreshold) {
        status = "red"; // Urgent expiration
      }

      return {
        name: product.name,
        category: product.parentCategory?.name || "N/A",
        subcategory: product.subcategory?.name || "N/A",
        currentStock: product.currentStock,
        price: product.price,
        compareAtPrice: product.compareAtPrice,
        expirationDate: product.expirationDate,
        status, // Green, yellow, red
        daysToExpire, // For sorting purposes
      };
    });

    res.status(200).json({
      message: `Found ${productData.length} products expiring soon.`,
      page,
      totalProducts: productData.length,
      products: productData,
    });
  } catch (error) {
    console.error("Error fetching products by expiration date:", error);
    res.status(500).json({
      message: "Failed to track product expiration",
      error: error.message,
    });
  }
});

export { router as expirationRouter };
