// routes/notificationRoutes.js
import express from "express";
import { NotificationModel } from "../models/NotificationModel.js";
import { generateProductAvailabilityEmail } from "../utils/ProductAvailabilityEmail.js";
import { sendEmail } from "../utils/email.js";
import { Products } from "../models/ProductModel.js"; // Alias import to `Products`
import { Category } from "../models/categoriesModel.js";

const router = express.Router();
const BASE_URL = process.env.BASE_URL || "http://localhost:3000"; // Fallback for local

// Route to request a notification for a specific product
router.post("/request", async (req, res) => {
  const { productId, name, email } = req.body;

  try {
    const existingNotification = await NotificationModel.findOne({
      product: productId,
      email,
    });
    if (existingNotification) {
      return res.status(400).json({
        message:
          "Notification request already exists for this product and email",
      });
    }

    const notification = new NotificationModel({
      product: productId,
      name,
      email,
    });
    await notification.save();

    res.status(201).json({
      message: "Notification request created successfully",
      notification,
    });
  } catch (error) {
    console.error("Error creating notification request:", error);
    res.status(500).json({ message: "Failed to create notification request" });
  }
});

// Route to fetch all notification requests (for admin dashboard)
router.get("/all", async (req, res) => {
  try {
    const notifications = await NotificationModel.find()
      .populate("product", "name")
      .exec();

    res.status(200).json(notifications);
  } catch (error) {
    console.error("Error fetching notification requests:", error);
    res.status(500).json({
      message: "Failed to fetch notifications",
      error: error.message,
      stack: error.stack,
    });
  }
});

// Route to delete a specific notification request by ID
router.delete("/:notificationId", async (req, res) => {
  const { notificationId } = req.params;

  try {
    const deletedNotification =
      await NotificationModel.findByIdAndDelete(notificationId);
    if (!deletedNotification) {
      return res
        .status(404)
        .json({ message: "Notification request not found" });
    }

    res
      .status(200)
      .json({ message: "Notification request deleted successfully" });
  } catch (error) {
    console.error("Error deleting notification request:", error);
    res.status(500).json({ message: "Failed to delete notification request" });
  }
});

// Route to generate email content for a specific product notification
router.post("/generate-email-content", async (req, res) => {
  const { customerName, productId } = req.body;

  try {
    const product = await Products.findById(productId)
      .populate({ path: "parentCategory", strictPopulate: false })
      .populate({ path: "subcategory", strictPopulate: false });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Fetching category and subcategory names to format URL
    const category = await Category.findById(product.parentCategory);
    const subcategory = await Category.findById(product.subcategory);

    const categoryName = category
      ? category.name.toLowerCase().replace(/\s+/g, "-")
      : "default-category";
    const subcategoryName = subcategory
      ? subcategory.name.toLowerCase().replace(/\s+/g, "-")
      : "default-subcategory";
    const productName = product.name.toLowerCase().replace(/\s+/g, "-");

    // Building product URL using BASE_URL from environment
    const productUrl = `${BASE_URL}/categories/${categoryName}/${subcategoryName}/${productName}?productId=${productId}`;

    // Select an image for the product
    const productImageUrl = product.images[0] || ""; // Assuming images[0] is the main image; adjust as needed

    // Generate email content
    const { emailSubject, emailText, emailHtml } =
      generateProductAvailabilityEmail(
        customerName,
        product.name,
        productUrl,
        productImageUrl // Pass the image URL to the email generator
      );

    res.status(200).json({ emailSubject, emailText, emailHtml });
  } catch (error) {
    console.error("Error generating email content:", error);
    res.status(500).json({ message: "Failed to generate email content" });
  }
});

// Route to send a notification email for a specific product
router.post("/send-email", async (req, res) => {
  const { notificationId, email, emailSubject, emailText, emailHtml } =
    req.body;

  try {
    await sendEmail(email, emailSubject, emailText, emailHtml);

    await NotificationModel.findByIdAndUpdate(notificationId, {
      notified: true,
    });

    res
      .status(200)
      .json({ message: "Notification email sent and status updated" });
  } catch (error) {
    console.error("Failed to send notification email:", error);
    res.status(500).json({ message: "Failed to send notification email" });
  }
});

export { router as notificationRouter };
