// server/src/routes/contentRoutes.js
import express from "express";
import Content from "../models/contentModel.js";

const router = express.Router();

// Create new content
router.post("/", async (req, res) => {
  try {
    const content = new Content(req.body);
    await content.save();
    res.status(201).json(content);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get all content
router.get("/", async (req, res) => {
  try {
    const contents = await Content.find();
    res.json(contents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single content by ID
router.get("/:id", async (req, res) => {
  try {
    const content = await Content.findById(req.params.id);
    if (!content) return res.status(404).json({ message: "Content not found" });
    res.json(content);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update content by ID
router.put("/:id", async (req, res) => {
  try {
    const content = await Content.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!content) return res.status(404).json({ message: "Content not found" });
    res.json(content);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete content by ID
router.delete("/:id", async (req, res) => {
  try {
    const content = await Content.findByIdAndDelete(req.params.id);
    if (!content) return res.status(404).json({ message: "Content not found" });
    res.json({ message: "Content deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export { router as contentRouter };
