// routes/userRoutes.js

import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { UserModel } from "../models/UserModel.js";

const router = express.Router();

const validatePhoneNumber = (phone) => {
  const phoneRegex = /^(\+\d{1,2}\s?)?1?\-?\(?\d{3}\)?\d{3}\-?\d{4}$/; // This is just an example regex
  return phoneRegex.test(phone);
};

router.post("/register", async (req, res) => {
  try {
    let { name, lastName, email, password, birthMonth, birthDay } = req.body;

    // Ensure birthMonth is a string and birthDay is a number
    if (typeof birthMonth !== "string") {
      return res.status(400).json({ message: "Birth month must be a string." });
    }

    // Check if user already exists
    const existingUser = await UserModel.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ message: "The user already exists" });
    }

    // Encrypt the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user instance
    const newUser = new UserModel({
      name,
      lastName,
      email,
      password: hashedPassword,
      birthMonth,
      birthDay,
    });

    // Save the new user to the database
    await newUser.save();

    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});

router.post("/addUser", async (req, res) => {
  try {
    let {
      name,
      lastName,
      email,
      street,
      number,
      city,
      province,
      postalCode,
      country,
      phone,
      password,
      admin,
      isActive,
      emailSubscribed,
      smsSubscribed,
      birthMonth,
      birthDay,
    } = req.body;

    // Example: Validate phone number
    if (!validatePhoneNumber(phone)) {
      return res.status(400).json({ message: "Invalid phone number format." });
    }

    const userExists = await UserModel.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new UserModel({
      name,
      lastName,
      email,
      street,
      number,
      city,
      province,
      postalCode,
      country,
      phone, // No change needed here since it's now a string
      password: hashedPassword,
      admin,
      isActive,
      emailSubscribed,
      smsSubscribed,
      birthMonth,
      birthDay,
    });

    await newUser.save();

    res
      .status(201)
      .json({ message: "User added successfully", userId: newUser._id });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error adding user", error: error.message });
  }
});

// Update user
router.put("/updateUser/:id", async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  try {
    // Check if a new password is provided in the request
    if (updateData.password) {
      // Hash the new password before updating
      updateData.password = await bcrypt.hash(updateData.password, 10);
    } else {
      // If no password is provided, remove it from the updateData to keep the existing password
      delete updateData.password;
    }

    // Find the user by ID and update their data
    const updatedUser = await UserModel.findByIdAndUpdate(id, updateData, {
      new: true, // Return the updated document
    });

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to update user", error: error.message });
  }
});
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  console.log("Login attempt:", { email });

  try {
    const user = await UserModel.findOne({ email });
    if (!user) {
      console.log("User does not exist:", email);
      return res.status(401).json({ message: "The user does not exist" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.log("Invalid password for user:", email);
      return res.status(401).json({ message: "The password is not valid" });
    }

    const token = jwt.sign({ id: user._id }, "secret"); // Use a more secure secret in production
    console.log("Login successful for user:", email);

    res.json({
      token,
      userId: user._id,
      name: user.name,
      lastName: user.lastName,
      role: user.role,
      email: user.email, // Ensure email is included in the response
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/admin-login", async (req, res) => {
  const { email, password } = req.body;
  console.log("Admin login attempt:", { email });

  try {
    const user = await UserModel.findOne({ email, role: "admin" });
    if (!user) {
      console.log("User does not exist or is not an admin:", email);
      return res
        .status(401)
        .json({ message: "You are not an authorized user" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.log("Invalid password for user:", email);
      return res.status(401).json({ message: "The password is not valid" });
    }

    const token = jwt.sign({ id: user._id }, "secret"); // Use a more secure secret in production
    console.log("Admin login successful for user:", email);

    res.json({
      token,
      userId: user._id,
      name: user.name,
      lastName: user.lastName,
      role: user.role,
      email: user.email, // Ensure email is included in the response
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/findUser/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const user = await UserModel.findOne({ _id: id }).exec();
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to get user", error: error.message });
  }
});

router.delete("/deleteUser/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const deletedUser = await UserModel.findOneAndDelete({ _id: id });
    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to delete user", error: error.message });
  }
});

router.get("/findCustomer/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const user = await UserModel.findOne({ _id: id }).exec();
    if (!user) {
      return res.status(404).json({ message: "Customer not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to get customer", error: error.message });
  }
});

router.put("/updateUser/:id", async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  try {
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    const updateUser = await UserModel.findOneAndUpdate(
      { _id: id },
      updateData,
      {
        new: true,
      }
    );
    if (!updateUser) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({
      message: "User updated successfully",
      user: updateUser,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to update user", error: error.message });
  }
});

router.get("/getAllUsers", async (req, res) => {
  const users = await UserModel.find();

  res.status(200).json(users);
});

export { router as userRouter };
