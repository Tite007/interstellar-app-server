// routes/categoriesRoutes.js
import express from "express";
import { Category } from "../models/categoriesModel.js";
import mongoose from "mongoose"; // Add this import
import multer from "multer";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

const router = express.Router();

// Configure AWS S3
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Set up multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// POST: Add a top-level category with an optional image
router.post("/addCategory", upload.single("image"), async (req, res) => {
  const { name } = req.body;
  let imageUrl = null;

  try {
    // If an image is uploaded, save it to S3
    if (req.file) {
      const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `${Date.now()}-${req.file.originalname}`,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
      };
      const data = await s3Client.send(new PutObjectCommand(params));
      imageUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${params.Key}`;
    }

    const newCategory = new Category({
      name,
      parent: null,
      ancestors: [],
      image: imageUrl,
    });

    await newCategory.save();
    res.status(201).json(newCategory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST: Add a subcategory with an optional image
router.post("/addSubcategory", upload.single("image"), async (req, res) => {
  const { name, parentId } = req.body;
  let imageUrl = null;

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

    // If an image is uploaded, save it to S3
    if (req.file) {
      const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `${Date.now()}-${req.file.originalname}`,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
      };
      const data = await s3Client.send(new PutObjectCommand(params));
      imageUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${params.Key}`;
    }

    const newSubcategory = new Category({
      name,
      parent: parentId,
      ancestors: [...parentCategory.ancestors, parentCategory._id],
      image: imageUrl,
    });

    await newSubcategory.save();
    res.status(201).json(newSubcategory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT: Update a category (including image)
router.put("/updateCategory/:id", upload.single("image"), async (req, res) => {
  const { id } = req.params;
  const { name, parentId } = req.body;
  let imageUrl = null;

  try {
    // Validate the category ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid category ID" });
    }

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    // If an image is uploaded, save it to S3 and delete the old one if it exists
    if (req.file) {
      const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `${Date.now()}-${req.file.originalname}`,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
      };
      await s3Client.send(new PutObjectCommand(params));
      imageUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${params.Key}`;

      if (category.image) {
        const oldKey = category.image.split("/").pop();
        await s3Client.send(
          new DeleteObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: oldKey,
          })
        );
      }
    }

    // Update category fields
    category.name = name || category.name;
    category.image = imageUrl || category.image;

    if (parentId) {
      if (!mongoose.Types.ObjectId.isValid(parentId)) {
        return res.status(400).json({ message: "Invalid parent category ID" });
      }
      const parentCategory = await Category.findById(parentId);
      if (!parentCategory) {
        return res.status(404).json({ message: "Parent category not found" });
      }
      category.parent = parentId;
      category.ancestors = [...parentCategory.ancestors, parentCategory._id];
    } else {
      category.parent = null;
      category.ancestors = [];
    }

    await category.save();
    res.status(200).json(category);
  } catch (error) {
    console.error("Error in updateCategory:", error);
    res.status(500).json({ message: error.message });
  }
});

// Existing routes (GET and DELETE) remain unchanged
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

      // Recursively delete subcategories
      await Promise.all(
        subcategories.map(async (subcategory) => {
          await deleteCategoryAndSubcategories(subcategory._id);
        })
      );

      // Delete the category's image from S3 if it exists
      const categoryToDelete = await Category.findById(categoryId);
      if (categoryToDelete.image) {
        const key = categoryToDelete.image.split("/").pop(); // Extract the S3 key from the URL
        const params = {
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: key,
        };
        await s3Client.send(new DeleteObjectCommand(params));
      }

      // Delete the category from MongoDB
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

// New route to remove an image from a category without deleting the category
router.put("/removeCategoryImage/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    if (category.image) {
      const key = category.image.split("/").pop(); // Extract the S3 key
      const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
      };
      await s3Client.send(new DeleteObjectCommand(params));
      category.image = null; // Remove the image reference
      await category.save();
    }

    res.status(200).json({ message: "Image removed successfully", category });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/categories/:name", async (req, res) => {
  const { name } = req.params;

  try {
    const category = await Category.findOne({
      name: { $regex: new RegExp(`^${name}$`, "i") },
    }).exec();

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    const subcategories = await Category.find({ parent: category._id }).exec();
    res.status(200).json({ category, subcategories });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export const categoryRouter = router;
