import express from "express";
import { Category } from "../models/categoriesModel.js"; // Ensure this import path is correct

const router = express.Router();

// Route to create a category or subcategory
router.post("/addCategory", async (req, res) => {
  const { name, parentId } = req.body;

  try {
    let ancestors = [];

    // If parentId exists, this is a subcategory, and we need to fetch parent details
    if (parentId) {
      const parentCategory = await Category.findById(parentId);
      if (!parentCategory) {
        return res.status(404).json({ message: "Parent category not found" });
      }

      // Set ancestors as the parent's ancestors plus the parent itself
      ancestors = [...parentCategory.ancestors, parentCategory._id];
    }

    // Create the new category with the correct parent and ancestors
    const newCategory = new Category({
      name,
      parent: parentId || null, // Parent is null for top-level categories
      ancestors, // Empty for top-level categories, filled for subcategories
    });

    await newCategory.save();
    res.status(201).json(newCategory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Route to get all categories (with nested subcategories)
router.get("/categories", async (req, res) => {
  try {
    const categories = await Category.find().populate("parent").exec();
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Route to delete a category and its subcategories
router.delete("/deleteCategory/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // Find the category to be deleted
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    // Delete the category and all its subcategories recursively
    const deleteCategoryAndSubcategories = async (categoryId) => {
      // Find subcategories
      const subcategories = await Category.find({ parent: categoryId });

      // Recursively delete subcategories
      await Promise.all(
        subcategories.map(async (subcategory) => {
          await deleteCategoryAndSubcategories(subcategory._id);
        })
      );

      // Delete the category itself
      await Category.findByIdAndDelete(categoryId);
    };

    // Start the deletion process
    await deleteCategoryAndSubcategories(id);

    res
      .status(200)
      .json({ message: "Category and its subcategories deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Correctly export the router
export const categoryRouter = router;
