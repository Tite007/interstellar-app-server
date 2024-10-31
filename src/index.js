import express from "express";
import cors from "cors";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import multer from "multer";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { userRouter } from "./routes/users.js";
import { productsRouter } from "./routes/products.js";
import { orderRouter } from "./routes/orders.js";
import { paymentRouter } from "./routes/paymentRoutes.js";
import { contentRouter } from "./routes/contentRoutes.js";
import { Products } from "./models/ProductModel.js"; // Ensure this import is correct
import { reviewRouter } from "./routes/reviewRoutes.js"; // Import the review router
import { categoryRouter } from "./routes/categoriesRoutes.js";
import { expirationRouter } from "./routes/trackExpiration.js"; // Import the expiration router
import { notificationRouter } from "./routes/notificationRoutes.js";
import { taxCodeRouter } from "./routes/taxCodeRoutes.js"; // Ensure the path is correct

dotenv.config();

const app = express();

app.use(cors());

// Apply express.json() middleware selectively, excluding the webhook route
app.use((req, res, next) => {
  if (req.originalUrl === "/payment/webhook") {
    next();
  } else {
    express.json()(req, res, next);
  }
});

// Define a simple route for the root URL
app.get("/", (req, res) => {
  res.send("API is running.");
});

// Use the userRouter for all '/auth' routes
app.use("/auth", userRouter);

// Use the productsRouter for all '/products' routes
app.use("/products", productsRouter);

// Use the orderRouter for all '/orders' routes
app.use("/orders", orderRouter);

// Use the paymentRouter for all '/payment' routes
app.use("/payment", paymentRouter);

// Use the contentRouter for all '/content' routes
app.use("/content", contentRouter);

// Use the reviewRouter for all '/reviews' routes
app.use("/reviews", reviewRouter); // Add this line

app.use("/categories", categoryRouter);

// Use the expiration router for expiration-related routes
app.use("/expiration", expirationRouter); // Add this line

app.use("/notifications", notificationRouter);

app.use("/taxcodes", taxCodeRouter);

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Configure AWS S3
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Set up multer to use memory storage
const storage = multer.memoryStorage();

const upload = multer({ storage });

app.post("/upload", upload.array("images", 3), async (req, res) => {
  try {
    console.log("Files received for upload:", req.files);

    const uploadResults = await Promise.all(
      req.files.map(async (file) => {
        const params = {
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: Date.now().toString() + "-" + file.originalname,
          Body: file.buffer,
          ContentType: file.mimetype,
        };
        const data = await s3Client.send(new PutObjectCommand(params));
        console.log("Uploaded file to S3:", data);
        return { Key: params.Key };
      })
    );

    const uploadedImages = req.files.map((file, index) => ({
      url: `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${uploadResults[index].Key}`,
    }));

    console.log("Uploaded images URLs:", uploadedImages);
    res.status(200).json(uploadedImages);
  } catch (err) {
    console.error("Error uploading files:", err);
    res.status(500).send("Error uploading files");
  }
});

//Function to delete images from products
app.post("/delete-images", async (req, res) => {
  const { images, productId } = req.body;

  try {
    // Delete images from S3
    await Promise.all(
      images.map(async (image) => {
        if (image) {
          const params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: image.split("/").pop(), // Extract the key from the URL
          };
          await s3Client.send(new DeleteObjectCommand(params));
        }
      })
    );

    // Update MongoDB to remove image references
    const product = await Products.findById(productId);
    if (product) {
      product.images = product.images.filter(
        (image) => image && !images.includes(image)
      );
      product.variants.forEach((variant) => {
        variant.images = variant.images.filter(
          (image) => image && !images.includes(image)
        );
      });
      await product.save();
    }

    res.status(200).send("Images deleted successfully");
  } catch (err) {
    console.error("Error deleting images:", err);
    res.status(500).send("Error deleting images");
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
