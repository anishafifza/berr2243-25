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

// User logout
app.post('/auth/logout', authenticate, async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    await db.collection('tokenBlacklist').insertOne({
        token,
        userId: req.user.userId,
        loggedOutAt: new Date()
    });
    res.status(200).json({ message: "Logged out successfully" });
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

// Admin : view all rides
app.get('/admin/rides', authenticate, authorize(['admin']), async (req, res) => {
    const rides = await db.collection('rides').find().toArray();
    res.status(200).json({ rides });
});


// View passenger
app.get('/driver/passengers', authenticate, authorize(['driver']), async (req, res) => {
    const passengers = await db.collection('users').find({ role: 'customer' }).toArray();
    res.status(200).json({ passengers });
});

//Passenger : view driver info
app.get('/drivers', authenticate, authorize(['customer']), async (req, res) => {
    const drivers = await db.collection('users').find({ role: 'driver' }).toArray();
    res.status(200).json({ drivers });
});


// Request ride (only for customer)
app.post('/rides', authenticate, authorize(['customer']), async (req, res) => {
    const rideData = {
        ...req.body,
        passengerId: req.user.userId,
        status: 'requested',
        createdAt: new Date()
    };
    await db.collection('rides').insertOne(rideData);
    res.status(201).json({ message: "Ride request submitted" });
});

// Admin: View all users
app.get('/admin/users', authenticate, authorize(['admin']), async (req, res) => {
    const users = await db.collection('users').find().toArray();
    res.status(200).json({ users });
});


// Passenger confirm ride
app.patch('/rides/:id/confirm', authenticate, authorize(['customer']), async (req, res) => {
    try {
        const rideId = req.params.id;

        // Optional: check if ride exists
        const ride = await db.collection('rides').findOne({ _id: new ObjectId(rideId) });
        if (!ride) {
            return res.status(404).json({ error: "Ride not found" });
        }

        if (ride.status !== 'accepted') {
            return res.status(400).json({ error: "Ride is not ready for confirmation" });
        }

        await db.collection('rides').updateOne(
            { _id: new ObjectId(rideId) },
            { $set: { status: 'confirmed' } }
        );
        res.status(200).json({ message: "Ride confirmed by passenger" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Passenger : accept ride → ini sepatutnya driver accept ride
app.patch('/rides/:id/accept', authenticate, authorize(['driver']), async (req, res) => {
    const rideId = req.params.id;

    // Optional: check if ride exists
    const ride = await db.collection('rides').findOne({ _id: new ObjectId(rideId) });
    if (!ride) {
        return res.status(404).json({ error: "Ride not found" });
    }

    await db.collection('rides').updateOne(
        { _id: new ObjectId(rideId) },
        {
            $set: {
                status: 'accepted',
                driverId: req.user.userId,
                acceptedAt: new Date()
            }
        }
    );
    res.status(200).json({ message: "Ride accepted by driver" });
});

// Passenger: view own rides
app.get('/rides/mine', authenticate, authorize(['customer']), async (req, res) => {
    const rides = await db.collection('rides').find({ passengerId: req.user.userId }).toArray();
    res.status(200).json({ rides });
});

// Driver: view rides assigned to them
app.get('/rides/assigned', authenticate, authorize(['driver']), async (req, res) => {
    const rides = await db.collection('rides').find({ driverId: req.user.userId }).toArray();
    res.status(200).json({ rides });
});


// Driver : update profile
app.patch('/users/:id', authenticate, async (req, res) => {
    const { name, email } = req.body;
    await db.collection('users').updateOne(
        { _id: new ObjectId(req.params.id) },
        { $set: { name, email } }
    );
    res.status(200).json({ message: "Profile updated" });
});

// Driver update availability
app.patch('/drivers/:id/availability', authenticate, authorize(['driver']), async (req, res) => {
    const { available } = req.body;
    await db.collection('users').updateOne(
        { _id: new ObjectId(req.params.id) },
        { $set: { available } }
    );
    res.status(200).json({ message: "Driver availability updated" });
});


// Admin: Delete user
app.delete('/admin/users/:id', authenticate, authorize(['admin']), async (req, res) => {
    await db.collection('users').deleteOne({ _id: new ObjectId(req.params.id) });
    res.status(204).send();
});

// Driver : delete account
app.delete('/users/:id', authenticate, async (req, res) => {
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
