require('dotenv').config();
const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;
const saltRounds = 10;

app.use(express.json());
app.use(cors());

let db;

// MongoDB Connection
async function connectToMongoDB() {
    const client = new MongoClient(process.env.MONGODB_URI);
    try {
        await client.connect();
        db = client.db();
        console.log("Connected to MongoDB!");

        // Insert default admin if not exists
        const existingAdmin = await db.collection('users').findOne({ role: "admin" });
        if (!existingAdmin) {
            const hashedPassword = await bcrypt.hash("admin123", saltRounds);
            await db.collection('users').insertOne({
                name: "Admin",
                email: "admin@example.com",
                password: hashedPassword,
                role: "admin",
                status: "active"
            });
            console.log("Default admin account created.");
        }
    } catch (err) {
        console.error("MongoDB connection error:", err);
    }
}
connectToMongoDB();

// JWT Authentication Middleware
const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: "Unauthorized access" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch {
        res.status(401).json({ error: "Invalid token" });
    }
};

// Role-based Authorization Middleware
const authorize = (roles) => (req, res, next) => {
    if (!roles.includes(req.user.role)) {
        return res.status(403).json({ error: "Access denied" });
    }
    next();
};

// Register user (admin, driver, customer)
app.post('/register', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const user = {
            name,
            email,
            password: hashedPassword,
            role,
            status: 'active',
            available: role === 'driver' ? false : undefined
        };
        await db.collection('users').insertOne(user);
        res.status(201).json({ message: `${role} registered successfully` });
    } catch {
        res.status(400).json({ error: "Registration failed" });
    }
});

// User login
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
    res.status(200).json({ token, user: { id: user._id, name: user.name, role: user.role } });
});

// Get user profile
app.get('/users/:id', authenticate, async (req, res) => {
    try {
        const user = await db.collection('users').findOne({ _id: new ObjectId(req.params.id) });
        if (!user) return res.status(404).json({ error: "User not found" });
        res.status(200).json(user);
    } catch {
        res.status(400).json({ error: "Invalid ID" });
    }
});

// Request ride (only for customer)
app.post('/rides', authenticate, authorize(['customer']), async (req, res) => {
    await db.collection('rides').insertOne(req.body);
    res.status(201).json({ message: "Ride request submitted" });
});

// Admin: View all users
app.get('/admin/users', authenticate, authorize(['admin']), async (req, res) => {
    const users = await db.collection('users').find().toArray();
    res.status(200).json({ users });
});

// Admin: Delete user
app.delete('/admin/users/:id', authenticate, authorize(['admin']), async (req, res) => {
    await db.collection('users').deleteOne({ _id: new ObjectId(req.params.id) });
    res.status(204).send();
});

// Admin: System analytics
app.get('/admin/analytics', authenticate, authorize(['admin']), async (req, res) => {
    const totalUsers = await db.collection('users').countDocuments();
    const totalDrivers = await db.collection('users').countDocuments({ role: 'driver' });
    const availableDrivers = await db.collection('users').countDocuments({ role: 'driver', available: true });
    const totalRides = await db.collection('rides').countDocuments();

    res.status(200).json({ totalUsers, totalDrivers, availableDrivers, totalRides });
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
