const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');
const app = express();
const PORT = 3000;

// MongoDB connection
const uri = 'mongodb://localhost:27017';
const client = new MongoClient(uri);

app.use(cors());
app.use(express.json()); // penting untuk baca JSON dari Postman

let db;

// 🧪 Seed data
async function seedData() {
  db = client.db('testDB');
  const usersCollection = db.collection('users');
  const ridesCollection = db.collection('rides');

  // Kosongkan collection dulu
  await usersCollection.deleteMany({});
  await ridesCollection.deleteMany({});

  // Masukkan pengguna contoh
  const userResult = await usersCollection.insertMany([
    {
      name: "Alice",
      email: "alice@example.com",
      password: "alice123",
      role: "customer",
      phone: "0111111111"
    },
    {
      name: "Bob",
      email: "bob@example.com",
      password: "bob123",
      role: "customer",
      phone: "0222222222"
    },
    {
      name: "Charlie",
      email: "charlie@example.com",
      password: "charlie123",
      role: "driver",
      phone: "0333333333",
      vehicle: "Perodua Bezza"
    }
  ]);

  const aliceId = userResult.insertedIds['0'];
  const bobId = userResult.insertedIds['1'];
  const driverId = userResult.insertedIds['2'];

  // Masukkan data perjalanan (rides)
  await ridesCollection.insertMany([
    {
      userId: aliceId,
      driverId: driverId,
      origin: "UTeM",
      destination: "Melaka Sentral",
      status: "completed",
      fare: 20.50,
      distance: 10.5
    },
    {
      userId: aliceId,
      driverId: driverId,
      origin: "Mydin MITC",
      destination: "Aeon Ayer Keroh",
      status: "completed",
      fare: 17.30,
      distance: 10.2
    },
    {
      userId: bobId,
      driverId: driverId,
      origin: "UTeM",
      destination: "Taman Bukit Beruang",
      status: "completed",
      fare: 18.75,
      distance: 9.8
    }
  ]);

  console.log("✅ Seed data inserted");
}

// 📊 API Analytics Penumpang
app.get('/analytics/passengers', async (req, res) => {
  try {
    const ridesCollection = db.collection('rides');

    const pipeline = [
      { $match: { status: "completed" } },
      {
        $group: {
          _id: "$userId",
          totalRides: { $sum: 1 },
          totalFare: { $sum: "$fare" },
          avgDistance: { $avg: "$distance" }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user"
        }
      },
      { $unwind: "$user" },
      {
        $project: {
          _id: 0,
          name: "$user.name",
          totalRides: 1,
          totalFare: 1,
          avgDistance: 1
        }
      }
    ];

    const result = await ridesCollection.aggregate(pipeline).toArray();
    res.json(result);
  } catch (err) {
    console.error("❌ Error in API:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

// 🔐 API Login
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const user = await db.collection('users').findOne({ email, password });

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    res.json({
      message: "Login successful",
      user: {
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error("❌ Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// 🚀 Mula server
async function startServer() {
  try {
    await client.connect();
    await seedData(); // optional kalau nak reset data setiap kali
    app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
  } catch (err) {
    console.error("❌ Failed to start server:", err);
  }
}

startServer();
