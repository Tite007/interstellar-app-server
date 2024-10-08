import express from "express";
import { Products } from "../models/ProductModel.js";

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

export { router as productsRouter };
