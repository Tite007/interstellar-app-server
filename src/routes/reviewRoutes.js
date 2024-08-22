import express from "express";
import { ReviewModel } from "../models/reviewModel.js"; // Ensure this path is correct
import { Products } from "../models/ProductModel.js";
import { UserModel } from "../models/UserModel.js"; // Ensure this is the correct path
import { Order } from "../models/OrderModel.js"; // Adjust the path as necessary
import mongoose from "mongoose";

const router = express.Router();

// GET /reviews/hasPurchased/:productId - Check if a user has purchased the product
router.get("/hasPurchased/:productId", async (req, res) => {
  const { productId } = req.params;
  const { userId } = req.query; // Get userId from query params

  try {
    // Check if the user has purchased the product or any of its variants
    const hasPurchased = await userHasPurchasedProduct(userId, productId);

    // Send the result back to the client
    res.status(200).json({ hasPurchased });
  } catch (error) {
    console.error("Error checking purchase status:", error);
    res.status(500).json({ message: "Error checking purchase status" });
  }
});

async function userHasPurchasedProduct(userId, productId) {
  try {
    // Fetch all orders for the user
    const orders = await Order.find({ user: userId });

    // Iterate over each order
    for (const order of orders) {
      // Iterate over each item in the order
      for (const item of order.items) {
        // Check if the productId matches either the productId or the variantId
        if (item.productId === productId || item.variantId === productId) {
          console.log(`Product found in order:`, order);
          return true;
        }
      }
    }

    console.log(`No order found for this user and product.`);
    return false;
  } catch (error) {
    console.error("Error checking purchase status:", error);
    throw error;
  }
}

// POST /reviews/addReview - Add a new review or reply
router.post("/addReview", async (req, res) => {
  const { productId, userId, rating, comment, replyTo } = req.body;

  try {
    // Check if the user has purchased the product
    const hasPurchased = await userHasPurchasedProduct(userId, productId);
    if (!hasPurchased) {
      return res.status(403).json({
        message:
          "Only users who have purchased this product can write a review.",
      });
    }

    // Create a new review or reply
    let review = new ReviewModel({
      product: productId,
      user: userId,
      rating: replyTo ? null : rating,
      comment,
      parentReview: replyTo || null,
    });

    await review.save();

    // Update the user model to include the review
    await UserModel.findByIdAndUpdate(userId, {
      $push: { reviews: review._id },
    });

    // Update the product model to include the review
    await Products.findByIdAndUpdate(productId, {
      $push: { reviews: review._id },
    });

    // If the review is a reply to another review
    if (replyTo) {
      const parentReview = await ReviewModel.findById(replyTo);
      if (parentReview) {
        parentReview.replies.push(review._id);
        await parentReview.save();
      }
    }

    // Populate the user field before sending the response
    review = await review.populate("user", "name email _id");

    res.status(201).json(review);
  } catch (error) {
    console.error("Error adding review:", error);
    res.status(500).json({ message: "Error adding review" });
  }
});
// POST /replies/addReply - Add a reply to an existing review
router.post("/addReply", async (req, res) => {
  const { productId, userId, comment, parentReviewId } = req.body;

  try {
    // Check if the user has purchased the product
    const hasPurchased = await userHasPurchasedProduct(userId, productId);
    if (!hasPurchased) {
      return res.status(403).json({
        message:
          "Only users who have purchased this product can reply to a review.",
      });
    }

    // Create a new reply
    let reply = new ReviewModel({
      product: productId,
      user: userId,
      comment,
      parentReview: parentReviewId,
      rating: null, // Replies don't have ratings
    });

    await reply.save();

    // Find the parent review and add the reply to its replies array
    const parentReview = await ReviewModel.findById(parentReviewId);
    if (parentReview) {
      parentReview.replies.push(reply._id);
      await parentReview.save();
    }

    // Populate the user field before sending the response
    reply = await reply.populate("user", "name email _id");

    res.status(201).json(reply);
  } catch (error) {
    console.error("Error adding reply:", error);
    res.status(500).json({ message: "Error adding reply" });
  }
});

// GET /reviews/getByProduct/:productId - Get all top-level reviews for a product with nested replies
router.get("/getByProduct/:productId", async (req, res) => {
  const { productId } = req.params;

  try {
    // Fetch all top-level reviews (parentReview is null) for the product
    const reviews = await ReviewModel.find({
      product: productId,
      parentReview: null,
    })
      .populate("user", "name email _id") // Populate user details for the review
      .populate({
        path: "replies",
        populate: { path: "user", select: "name email _id" }, // Populate user details for the replies
      })
      .select("product user rating comment time replies"); // Select the necessary fields

    res.status(200).json(reviews);
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({ message: "Error fetching reviews" });
  }
});

// GET /reviews/:reviewId - Get a specific review by ID, including its replies
router.get("/getReview/:reviewId", async (req, res) => {
  const { reviewId } = req.params;

  try {
    const review = await ReviewModel.findById(reviewId)
      .select("product user rating comment time replies") // Select only these fields
      .populate("user", "name email _id") // Populate name, email, and _id fields from the user
      .populate("product", "name _id") // Populate name and _id fields from the product (if needed)
      .populate({
        path: "replies",
        populate: { path: "user", select: "name email _id" }, // Populate user details in replies, including _id
      });

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    res.status(200).json(review);
  } catch (error) {
    console.error("Error fetching review:", error);
    res.status(500).json({ message: "Error fetching review" });
  }
});

// GET /reviews/getByUser/:userId - Get all reviews by a specific user
router.get("/getByUser/:userId", async (req, res) => {
  try {
    const user = await UserModel.findById(req.params.userId)
      .populate({
        path: "reviews",
        select: "product rating comment time replies", // Select only these fields from the reviews
        populate: [
          { path: "product", select: "name _id" }, // Populate product details correctly
          {
            path: "replies",
            select: "comment user time",
            populate: { path: "user", select: "name email _id" },
          }, // Populate replies and their user details
        ],
      })
      .select("name lastName email"); // Only select these fields from the user

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user.reviews); // Return only the reviews
  } catch (error) {
    console.error("Error fetching user with reviews:", error);
    res.status(500).json({ message: "Error fetching user with reviews" });
  }
});

// DELETE /reviews/delete/:reviewId - Delete a review or reply
router.delete("/delete/:reviewId", async (req, res) => {
  const { reviewId } = req.params;

  try {
    const review = await ReviewModel.findById(reviewId);

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    const userId = review.user;
    const productId = review.product;

    // If the review is a reply, remove it from the parent's replies array
    if (review.parentReview) {
      const parentReview = await ReviewModel.findById(review.parentReview);
      if (parentReview) {
        parentReview.replies.pull(review._id);
        await parentReview.save();
      }
    } else {
      // If the review is not a reply, handle nested replies
      await ReviewModel.deleteMany({ _id: { $in: review.replies } });
    }

    // Remove the review from the user's reviews array
    const user = await UserModel.findById(userId);
    if (user) {
      user.reviews.pull(review._id);
      await user.save();
    }

    // Remove the review from the product's reviews array
    const product = await Products.findById(productId);
    if (product) {
      product.reviews.pull(review._id);
      await product.save();
    }

    // Finally, delete the review itself
    await review.deleteOne();

    res.status(200).json({ message: "Review deleted" });
  } catch (error) {
    console.error("Error deleting review:", error);
    res.status(500).json({ message: "Error deleting review" });
  }
});

export { router as reviewRouter };
