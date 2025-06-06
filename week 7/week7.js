const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const app = express();
const PORT = 3000;

const uri = 'mongodb://localhost:27017';
const client = new MongoClient(uri);

let db;

async function seedData() {
  db = client.db('testDB');
  const usersCollection = db.collection('users');
  const ridesCollection = db.collection('rides');

  await usersCollection.deleteMany({});
  await ridesCollection.deleteMany({});

  const userResult = await usersCollection.insertMany([
    { name: "Alice", email: "alice@example.com", role: "customer", phone: "0111111111" },
    { name: "Bob", email: "bob@example.com", role: "customer", phone: "0222222222" },
    { name: "Charlie", email: "charlie@example.com", role: "driver", phone: "0333333333", vehicle: "Perodua Bezza" }
  ]);

  const aliceId = userResult.insertedIds['0'];
  const bobId = userResult.insertedIds['1'];
  const driverId = userResult.insertedIds['2'];

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

// API Endpoint
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

// Start server
async function startServer() {
  try {
    await client.connect();
    await seedData();
    app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
  } catch (err) {
    console.error("❌ Failed to start server:", err);
  }
}

startServer();
