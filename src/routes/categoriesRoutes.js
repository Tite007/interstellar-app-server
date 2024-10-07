import express from "express";
import { Category } from "../models/categoriesModel.js"; // Ensure this import path is correct

const router = express.Router();

router.post("/addCategory", async (req, res) => {
  const { name } = req.body;

  try {
    // Create the top-level category with no parent
    const newCategory = new Category({
      name,
      parent: null, // Parent is null for top-level categories
      ancestors: [], // No ancestors for top-level categories
    });

    await newCategory.save();
    res.status(201).json(newCategory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/addSubcategory", async (req, res) => {
  const { name, parentId } = req.body;

  try {
    if (!parentId) {
      return res
        .status(400)
        .json({ message: "Parent category ID is required" });
    }

    const parentCategory = await Category.findById(parentId);
    if (!parentCategory) {
      return res.status(404).json({ message: "Parent category not found" });
    }

    // Create subcategory with the correct parent and ancestors
    const newSubcategory = new Category({
      name,
      parent: parentId, // Set parent to the provided parentId
      ancestors: [...parentCategory.ancestors, parentCategory._id], // Inherit parent's ancestors
    });

    await newSubcategory.save();
    res.status(201).json(newSubcategory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/categories", async (req, res) => {
  try {
    const categories = await Category.find().populate("parent").exec();
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/deleteCategory/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    const deleteCategoryAndSubcategories = async (categoryId) => {
      const subcategories = await Category.find({ parent: categoryId });

      await Promise.all(
        subcategories.map(async (subcategory) => {
          await deleteCategoryAndSubcategories(subcategory._id);
        })
      );

      await Category.findByIdAndDelete(categoryId);
    };

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
