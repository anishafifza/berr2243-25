// Install Express Library from the terminal
// function node is run to code "node index.js"

const express = require ('express'); // Node.js framework to build API's web app
const { MongoClient, ObjectId } = require('mongodb');
const port = 3000; // create port and server

const app = express();
app.use(express.json());

let db;

async function connectToMongoDB() {             // line 13 sampai 30 connect to mongoDB
    const uri = "mongodb://localhost:27017/"
    const client = new MongoClient(uri);

    try {
        await client.connect();
        console.log("Connected to MongoDB !");

        db = client.db("testDB");
    
    } catch (err) {
        console.error("Error:", err);
    } 
}
connectToMongoDB();

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});

// GET /rides = Fetch all rides

app.get('/rides', async (req, res) => {  // send a GET req to /rides, this fx is triggered
    try {
        const rides = await db.collection('rides').find().toArray(); // Find all doc in rides collecton & convert the result into an array
        res.status(200).json(rides); // sends the ride back to client as JSON with status 200 OK
    
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch rides" }); // If error happens ( like db issues), it sends a 500 internal server error
    }
});

// POST /rides - Create a new ride

app.post('/rides', async (req, res) => { // Handles POST req to create a new ride
    try {
        const result = await db.collection('rides').insertOne(req.body); // Inserts data from the (req.body) into the ride collection
        res.status(201).json({ id: result.insertedId }) // send back ID of the newly created ride
    
    } catch (err) { 
        res.status(400).json({ error: "Invalid ride data" }); // If something goes wrong ( missing / bad data ) it returns a 400 Bad req
    }
});

// PATCH /rides/:id - Update ride status
// PATCH/users/:id - Cancel a user status

app.patch('/users/:id', async (req, res) => { // Handles PATCH req to update a ride/user by its ID
    
    try {
        const result = await db.collection('users').updateOne(  // looks for a ride with the matching ID & updates the status field
            {
                 _id: new ObjectId(req.params.id) },
                 { $set: { status: req.body.status }}
            );

            if (result.modifiedCount === 0) { // if no ride was updated, it returns 404 Not Found
                return res.status(404).json({ error: "User not found"});
            }
            res.status(200).json({ updated: result.modifiedCount }); // if successful it returns how many rides were updated (usually 1)

            } catch (err) { // Catches errors like an invalid ID format / bad req data

                // Handle invalid ID format or DB errors
                res.status(400).json({ error: "Invalid user ID or data" });
            }     
});

// DELETE /rides/:id - Cancel a ride
// DELETE /users/:id - Cancel a user

app.delete('/users/:id', async (req, res) => { // Handles DELETE req to remove a ride or user by ID
    
    try {
        const result = await db.collection('users').deleteOne( // Deletes the ride with the matching ID from the db
            { _id: new ObjectId(req.params.id) }
        );

        if (result.deletedCount === 0) { // if nothing was deleted, the ride probably didn't exist - return 404
            return res.status(404).json({ error: "User not found"});
        }
        res.status(200).json({ deleted: result.deletedCount}); // on succes, res with hoe many rides were deleted

    } catch (err) { // catch & return 400 Bad req for invalid IDs / other errors
        res.status(400).json({ error: "Invalid user ID" });
    }
});

