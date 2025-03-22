const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user"); // Ensure models/user.js exists
const router = express.Router();
require("dotenv").config();
console.log("ENV VARIABLES LOADED:", process.env);
console.log("JWT_SECRET:", process.env.JWT_SECRET);

// Test GET route
router.get("/", (req, res) => {
  res.send("Auth API is working");
});

// Register Route
router.post("/register", async (req, res) => {
  try {
    console.log("Register Request Body:", req.body);
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({ email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Error in /register:", error.message);
    res
      .status(500)
      .json({ message: `Internal Server Error: ${error.message}` });
  }
});

// Login Route
router.post("/login", async (req, res) => {
  try {
    console.log("Login Request Body:", req.body);
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      console.log("User not found:", email);
      return res.status(400).json({ message: "Invalid credentials" });
    }

    console.log("User found:", user.email);

    const isMatch = await bcrypt.compare(password, user.password);
    console.log("Password Match:", isMatch);

    if (!isMatch) {
      console.log("Incorrect password for:", email);
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is missing in .env file");
      return res
        .status(500)
        .json({ message: "Internal Server Error: JWT_SECRET not set" });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({ message: "Login successful", token });
  } catch (error) {
    console.error("Error in login route:", error.message);
    res
      .status(500)
      .json({ message: `Internal Server Error: ${error.message}` });
  }
});

module.exports = router;
