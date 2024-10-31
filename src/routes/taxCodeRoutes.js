import express from "express";
import { TaxCode } from "../models/taxCodeModel.js";

const router = express.Router();

// Route to fetch tax codes with optional search, pagination, and sorting
router.get("/all", async (req, res) => {
  const { name, page = 1, limit = 10 } = req.query;
  const query = name ? { name: { $regex: name, $options: "i" } } : {};

  try {
    // Count total tax codes for pagination metadata
    const totalTaxCodes = await TaxCode.countDocuments(query);
    const totalPages = Math.ceil(totalTaxCodes / limit);

    // Fetch tax codes, sorted by popularity and then by category
    const taxCodes = await TaxCode.find(query)
      .sort({ popular: -1, category: 1 }) // Sort by popularity first, then by category
      .skip((page - 1) * parseInt(limit))
      .limit(parseInt(limit));

    // Group tax codes by category for organized front-end display
    const groupedTaxCodes = taxCodes.reduce((acc, taxCode) => {
      const category = taxCode.category || "Other";
      if (!acc[category]) acc[category] = [];
      acc[category].push(taxCode);
      return acc;
    }, {});

    // Send response with pagination and structured tax codes
    res.json({
      taxCodes: groupedTaxCodes,
      pagination: {
        totalItems: totalTaxCodes,
        currentPage: parseInt(page),
        totalPages: totalPages,
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching tax codes", error: error.message });
  }
});

// Route to fetch a single tax code by stripeTaxCode
router.get("/findByStripeCode/:stripeTaxCode", async (req, res) => {
  const { stripeTaxCode } = req.params;

  try {
    const taxCode = await TaxCode.findOne({ stripeTaxCode });
    if (!taxCode) {
      return res.status(404).json({ message: "Tax code not found" });
    }
    res.status(200).json(taxCode);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching tax code",
      error: error.message,
    });
  }
});

// Add a new route for searching tax codes by name
router.get("/searchTaxCodes", async (req, res) => {
  const { name, page = 1, limit = 10 } = req.query;
  const query = name ? { name: { $regex: name, $options: "i" } } : {};

  try {
    // Fetch tax codes matching the search query
    const taxCodes = await TaxCode.find(query)
      .sort({ popular: -1, category: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json(taxCodes);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching tax codes", error: error.message });
  }
});

export const taxCodeRouter = router;
