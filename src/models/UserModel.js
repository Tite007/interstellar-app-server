import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
  companyName: {
    type: String,
  },
  name: {
    type: String,
  },
  lastName: {
    type: String,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  phone: {
    type: String, // Change from Number to String
  },
  street: {
    type: String,
  },
  number: {
    type: String,
  },
  city: {
    type: String,
  },
  province: {
    type: String,
  },
  postalCode: {
    type: String,
  },
  country: {
    type: String,
  },
  admin: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  password: {
    type: String,
  },
  emailSubscribed: { type: Boolean, default: true }, // Added field
  smsSubscribed: { type: Boolean, default: false }, // Added field
  birthMonth: {
    type: String,
  },
  birthDay: {
    type: Number,
    min: 1,
    max: 31,
  },
  time: {
    type: Date,
    default: Date.now,
  },
  role: {
    type: String,
    enum: ["admin", "user"],
    default: "user",
  },
  // Add a reference to reviews
  reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: "Review" }],
});

// Method to encrypt password
userSchema.methods.encryptPassword = async function (password) {
  const salt = await bcrypt.genSalt(6);
  return bcrypt.hash(password, salt);
};

// Export the model
export const UserModel = mongoose.model("Users", userSchema);
