import express from "express";
import { Products } from "../models/ProductModel.js";
import { Category } from "../models/categoriesModel.js"; // Category model

const router = express.Router();
router.post("/addProduct", async (req, res) => {
  const {
    name,
    description,
    parentCategory,
    subcategory,
    sku,
    price,
    stock,
    images,
    costPrice,
    profit,
    margin,
    size,
    inventoryType,
    currentStock,
    lowStockLevel,
    subtitle,
    compareAtPrice,
    seoTitle,
    seoDescription,
    seoKeywords,
    variants,
    roastLevel,
    technicalData,
    brand, // Added brand
    expirationDate, // Added expiration date
  } = req.body;

  // Debugging: Log the request body to ensure data is passed correctly
  console.log("Request Body:", req.body);

  try {
    const newProduct = new Products({
      name,
      description,
      parentCategory,
      subcategory,
      sku,
      price,
      stock,
      images,
      costPrice,
      profit,
      margin,
      size,
      inventoryType,
      currentStock,
      lowStockLevel,
      subtitle,
      compareAtPrice,
      seoTitle,
      seoDescription,
      seoKeywords,
      variants,
      roastLevel,
      technicalData,
      brand, // Include brand in new product creation
      expirationDate, // Include expiration date in new product creation
    });

    // Attempt to save the product
    await newProduct.save();

    // Respond with success
    res
      .status(201)
      .json({ message: "Product added successfully", product: newProduct });
  } catch (error) {
    console.error("Error adding product:", error.message); // Log the error message
    res
      .status(500)
      .json({ message: "Failed to add product", error: error.message });
  }
});

// Route to delete a product by _id
router.delete("/deleteProduct/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const deletedProduct = await Products.findByIdAndDelete(id);
    if (!deletedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to delete product", error: error.message });
  }
});

// Route to update a product by _id
router.put("/updateProduct/:id", async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  try {
    const updatedProduct = await Products.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
    if (!updatedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(200).json({
      message: "Product updated successfully",
      product: updatedProduct,
    });
  } catch (error) {
    console.error("Error updating product:", error);
    res
      .status(500)
      .json({ message: "Failed to update product", error: error.message });
  }
});

// Route to find a product by _id
router.get("/findProduct/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const product = await Products.findById(id).exec();
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(200).json(product);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to get product", error: error.message });
  }
});

// Route to get product variants by product _id
router.get("/getProductVariants/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const product = await Products.findById(id).select("variants").exec();
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(200).json({ variants: product.variants });
  } catch (error) {
    console.error("Error fetching product variants:", error);
    res.status(500).json({
      message: "Failed to get product variants",
      error: error.message,
    });
  }
});

// Route to find a variant by variant _id
router.get("/findVariant/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // Find the product that contains the variant with the given id
    const product = await Products.findOne(
      { "variants._id": id },
      { "variants.$": 1 }
    ).exec();

    if (!product || !product.variants.length) {
      return res.status(404).json({ message: "Variant not found" });
    }

    // The variant should be the first (and only) item in the product.variants array
    const variant = product.variants[0];
    res.status(200).json(variant);
  } catch (error) {
    console.error("Error fetching variant:", error);
    res.status(500).json({
      message: "Failed to get variant",
      error: error.message,
    });
  }
});

// Route to update a product variant by _id and variantId
router.put("/updateProductVariant/:id/:variantId", async (req, res) => {
  const { id, variantId } = req.params;
  const updateData = req.body;

  try {
    const product = await Products.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const variant = product.variants.id(variantId);
    if (!variant) {
      return res.status(404).json({ message: "Variant not found" });
    }

    Object.assign(variant, updateData);

    await product.save();
    res.status(200).json({ message: "Variant updated successfully", variant });
  } catch (error) {
    console.error("Error updating variant:", error);
    res
      .status(500)
      .json({ message: "Failed to update variant", error: error.message });
  }
});

// Route to delete a product variant by _id and variantId
router.delete("/deleteProductVariant/:id/:variantId", async (req, res) => {
  const { id, variantId } = req.params;

  try {
    const product = await Products.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const variant = product.variants.id(variantId);
    if (!variant) {
      return res.status(404).json({ message: "Variant not found" });
    }

    product.variants.pull({ _id: variantId });

    await product.save();
    res.status(200).json({ message: "Variant deleted successfully" });
  } catch (error) {
    console.error("Error deleting variant:", error);
    res
      .status(500)
      .json({ message: "Failed to delete variant", error: error.message });
  }
});

// Route to add a new variant to a product by _id
router.post("/addProductVariant/:id", async (req, res) => {
  const { id } = req.params;
  const newVariant = req.body;

  try {
    const product = await Products.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    product.variants.push(newVariant);

    await product.save();
    res.status(200).json({
      message: "Variant added successfully",
      variants: product.variants,
    });
  } catch (error) {
    console.error("Error adding variant:", error);
    res
      .status(500)
      .json({ message: "Failed to add variant", error: error.message });
  }
});

// Route to get all products
router.get("/getAllProducts", async (req, res) => {
  try {
    const products = await Products.find();
    res.status(200).json(products);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to get products", error: error.message });
  }
});

// New route to get only the technical data of a product by _id
router.get("/getTechnicalData/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const product = await Products.findById(id).select("technicalData").exec();
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(200).json({ technicalData: product.technicalData });
  } catch (error) {
    console.error("Error fetching technical data:", error);
    res
      .status(500)
      .json({ message: "Failed to get technical data", error: error.message });
  }
});

// Route to update the technical data of a product by _id
router.put("/updateTechnicalData/:id", async (req, res) => {
  const { id } = req.params;
  const technicalData = req.body;

  try {
    const product = await Products.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    product.technicalData = technicalData;

    await product.save();
    res
      .status(200)
      .json({ message: "Technical data updated successfully", technicalData });
  } catch (error) {
    console.error("Error updating technical data:", error);
    res.status(500).json({
      message: "Failed to update technical data",
      error: error.message,
    });
  }
});

// Fetch products by subcategory
router.get("/products/bySubcategory/:subcategoryId", async (req, res) => {
  const { subcategoryId } = req.params;

  try {
    const products = await Products.find({ subcategory: subcategoryId });

    if (!products || products.length === 0) {
      return res
        .status(404)
        .json({ message: "No products found for this subcategory" });
    }

    res.status(200).json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch products", error: error.message });
  }
});

// Route to search products, categories, and subcategories by name, brand, category, and keywords
router.get("/searchProducts", async (req, res) => {
  try {
    const {
      name,
      category,
      brand,
      minPrice,
      maxPrice,
      page = 1,
      limit = 10,
      sortBy = "name",
      sortOrder = "asc",
    } = req.query;

    // Create a query object that will hold all conditions
    let query = {};

    // If the product name is provided, search using regex for partial matches
    if (name) {
      query.name = { $regex: name, $options: "i" }; // Case-insensitive
    }

    // If the category is provided, search by category or subcategory
    if (category) {
      const matchedCategories = await Category.find({
        name: { $regex: new RegExp(category, "i") }, // Case-insensitive match for categories
      });

      // If no categories are found, return an empty result
      if (!matchedCategories.length) {
        return res.status(200).json({
          products: [],
          categories: [],
          subcategories: [],
          totalProducts: 0,
          totalPages: 1,
          currentPage: page,
        });
      }

      // Collect category IDs and subcategory IDs
      const categoryIds = matchedCategories.map((cat) => cat._id);
      const subcategoryIds = matchedCategories.flatMap((cat) =>
        cat.ancestors.concat(cat._id)
      );

      // Match products that belong to either the category or subcategory
      query.$or = [
        { parentCategory: { $in: categoryIds } }, // Parent category match
        { subcategory: { $in: subcategoryIds } }, // Subcategory match
      ];
    }

    // If the brand is provided, match it exactly or partially
    if (brand) {
      query.brand = { $regex: brand, $options: "i" }; // Partial match for brand
    }

    // If a price range is provided, filter by price
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice); // Price greater than or equal to minPrice
      if (maxPrice) query.price.$lte = parseFloat(maxPrice); // Price less than or equal to maxPrice
    }

    // Sorting
    const sortOption = {};
    sortOption[sortBy] = sortOrder === "asc" ? 1 : -1; // Sort order based on query params

    // Pagination: Calculate how many items to skip
    const skip = (page - 1) * limit;

    // Perform the search query in MongoDB with pagination, sorting, and population
    const products = await Products.find(query)
      .populate("parentCategory") // Populate the parent category
      .populate("subcategory") // Populate the subcategory
      .sort(sortOption) // Apply sorting
      .skip(skip) // Pagination: Skip records
      .limit(parseInt(limit)); // Limit number of results

    // Get the total count of products (without pagination)
    const totalProducts = await Products.countDocuments(query);

    // Fetch matching categories based on search term (for autocomplete)
    const categories = await Category.find({
      name: { $regex: new RegExp(name, "i") },
    })
      .populate("parent")
      .exec();

    // Return the results with categories and subcategories
    res.status(200).json({
      products,
      categories: categories.filter((cat) => !cat.parent), // Only return parent categories
      subcategories: categories.filter((cat) => cat.parent), // Only return subcategories
      totalProducts,
      totalPages: Math.ceil(totalProducts / limit),
      currentPage: parseInt(page),
    });
  } catch (error) {
    console.error("Error performing search:", error);
    res
      .status(500)
      .json({ message: "Failed to perform search", error: error.message });
  }
});

export { router as productsRouter };
