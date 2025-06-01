require('dotenv').config();
console.log("JWT_SECRET =", process.env.JWT_SECRET);

const jwtSecret = process.env.JWT_SECRET;

const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
app.use(express.json());

const saltRounds = 10;

// MongoDB Setup
const uri = "mongodb://localhost:27017"; // Replace with your Mongo URI if different
const client = new MongoClient(uri);
let db;

client.connect().then(() => {
  db = client.db('testDB'); // Replace with your DB name
  console.log("Connected to MongoDB");
});

// Step 1: Register User
app.post('/users', async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);
    const user = { ...req.body, password: hashedPassword };
    await db.collection('users').insertOne(user);
    res.status(201).json({ message: "User created" });
  } catch (err) {
    res.status(400).json({ error: "Registration failed" });
  }
});

// Step 2: Login and Return JWT Token
app.post('/auth/login', async (req, res) => {
  const user = await db.collection('users').findOne({ email: req.body.email });

  if (!user || !(await bcrypt.compare(req.body.password, user.password))) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = jwt.sign(
    { userId: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );

  res.status(200).json({ token }); // Return token to client
});

// Step 3: Middleware for Authentication and Role Checking
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};

const authorize = (roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: "Forbidden" });
  }
  next();
};

// Admin-Only Route
app.delete('/admin/users/:id', authenticate, authorize(['admin']), async (req, res) => {
  console.log("admin only");
  res.status(200).send("admin access");
});

// Start Server
app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});