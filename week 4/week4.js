// Install Express Library from the terminal
// function node is run to code "node index.js"

const express = require ('express'); // Node.js framework to build API's web app
const { MongoClient, ObjectId, MongoDBCollectionNamespace } = require('mongodb');
const port = 3000; // create port and server

const app = express();
app.use(express.json());

const cors = require('cors'); // link your web app dengan API
app.use(cors());

let db;

async function connectToMongoDB() {             // line 13 sampai 30 connect to mongoDB
    const uri = "mongodb://localhost:27017/"
    const client = new MongoClient(uri);

    try {
        await client.connect();
        console.log("Connected to MongoDB !");

        db = client.db("testDB");

        const existingAdmin = await db.collection('users').findOne({ role: "admin"});

        if (!existingAdmin){
            await db.collection('users').insertOne({
                name: "Admin",
                email: "admin@gmail.com",
                password: "admin123",
                role: "admin",
                status: "active"
            });
            console.log("Default admin inserted.");
        } else {
            console.log("Admin already exist.");
        }
    
    } catch (err) {
        console.error("Error:", err);
    } 
}
connectToMongoDB();

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});

// GET /users/:id = Fetch all users ( view profile )

app.get('/users/:id', async (req, res) => {  // send a GET req to /rides, this fx is triggered
    try {
        const user = await db.collection('users').findOne({_id: new ObjectId(req.params.id)});
        if (!user) 
            return res.status(404).json({ error: "User not found"});
        res.status(200).json(user); // sends the ride back to client as JSON with status 200 OK
    
    } catch (err) {
        res.status(400).json({ error: "Invalid ID or server error" }); // If error happens ( like db issues), it sends a 400 invalid id or internal server error
    }
});

// GET /drivers/:id = Fetch all rides ( view profile )

app.get('/drivers/:id', async (req, res) => {  // send a GET req to /rides, this fx is triggered
    try {
        const driver = await db.collection('drivers').findOne({_id: new ObjectId(req.params.id)});
        if (!driver) 
            return res.status(404).json({ error: "Driver not found"});
        res.status(200).json(driver); // sends the ride back to client as JSON with status 200 OK
    
    } catch (err) {
        res.status(400).json({ error: "Invalid ID or server error" }); // If error happens ( like db issues), it sends a 400 invalid id or internal server error
    }
});

// GET /admin/analytics - System overview

app.get('/admin/analytics', async (req, res) => {
    try {
        const totalUsers = await db.collection('users').countDocuments();
        const totalDrivers = await db.collection('drivers').countDocuments();
        const availableDrivers = await db.collection('drivers').countDocuments({ available: true });
        const totalRides = await db.collection('rides').countDocuments();

        res.status(200).json ({
            totalUsers,
            totalDrivers,
            totalRides,
            availableDrivers
        });
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch analytics" });
    }
});

// GET /admin/users - View all users (customers + drivers)

app.get('/admin/users', async (req, res) => {
    try {
        const user = await db.collection('users').find().toArray();
        const driver = await db.collection('drivers').find().toArray();

        res.status(200).json({
            user,
            driver
        })
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch users"});
    }
});

// POST /users/:id - Customer Registration

app.post('/users', async (req, res) => { // Handles POST req to customer registration
    try {
        const result = await db.collection('users').insertOne(req.body); // Inserts data from the (req.body) into the user collection
        res.status(201).json({ id: result.insertedId }) // send back ID of the newly created user
    
    } catch (err) { 
        res.status(400).json({ error: "Registration failed" }); // If something goes wrong ( missing / bad data ) it returns a 400 Bad req
    }
});

// POST /drivers - Driver Registration

app.post('/drivers', async (req, res) => { // Handles POST req to driver registration
    try {
        const result = await db.collection('drivers').insertOne(req.body); // Inserts data from the (req.body) into the driver collection
        res.status(201).json({ id: result.insertedId }) // send back ID of the newly created driver
    
    } catch (err) { 
        res.status(400).json({ error: "Registration failed !" }); // If something goes wrong ( missing / bad data ) it returns a 400 Bad req
    }
});

//POST /rides - request ride

app.post('/rides', async (req, res) => {
    try {
        const result = await db.collection('rides').insertOne(req.body);
        res.status(201).json({ id: result.insertedId});
    } catch (err) {
        res.status(400).json({ error: "Failed to request ride"});
    }
});

// POST customer/login - customer login

app.post('/users/login', async (req, res) => { // Handles POST req to customer login
    const { email, password } = req.body;

    try {
        const user = await db.collection('users').findOne({email, password}); // find data from the (req.body) into the user collection
        
        if (!user) {
            return res.status(401).json({ error: "Invalid email or password" }) //unauthorized
        }
        
        if (user.status === "blocked"){
            return res.status(403).json({ error: "Your account has been blocked" });
        }
    
        res.status(200).json({ //if successfull it returns 200 OK to login
            message: "Login successful",
            id: user._id,
            name: user.name,
            role: user.role
        });

    } catch (err) { 
        res.status(400).json({ error: "Something went wrong" }); // If something goes wrong ( missing / bad data ) it returns a 400 Bad req
    }
});

// POST driver/login - driver login

app.post('/drivers/login', async (req, res) => { // Handles POST req to customer login
    const { email, password } = req.body;

    try {
        const driver = await db.collection('drivers').findOne({email, password}); // find data from the (req.body) into the user collection
        if (!driver) {
           return res.status(401).json({ error: "Invalid email or password" }) //unauthorized
        }
    
        res.status(200).json({ //if successfull it returns 200 OK to login
            message: "Login successful",
            id: driver._id,
            name: driver.name,
            role: driver.role
        });
        
    } catch (err) { 
        res.status(400).json({ error: "Something went wrong" }); // If something goes wrong ( missing / bad data ) it returns a 400 Bad req
    }
});


// PATCH/users/:id -

app.patch('/users/:id', async (req, res) => { // Handles PATCH req to update a ride/user by its ID
    
    try {

        const updateData = req.body;
        const result = await db.collection('users').updateOne(  // looks for a ride with the matching ID & updates the status field
            {
                 _id: new ObjectId(req.params.id) },
                 { $set: updateData }
            );

            if (result.modifiedCount === 0) { // if no ride was updated, it returns 404 Not Found
                return res.status(404).json({ error: "User not found or not changes"});
            }
            res.status(200).json({ message: "User profile updated"}); // if successful it returns how many rides were updated (usually 1)

            } catch (err) { // Catches errors like an invalid ID format / bad req data

                // Handle invalid ID format or DB errors
                res.status(400).json({ error: "Invalid ride ID or data" });
            }     
});

// PATCH /drivers/:id - Update ride status

app.patch('/drivers/:id', async (req, res) => { // Handles PATCH req to update a ride/user by its ID
    
    try {

        const updateData = req.body;
        const result = await db.collection('drivers').updateOne(  // looks for a ride with the matching ID & updates the status field
            {
                 _id: new ObjectId(req.params.id) },
                 { $set: updateData }
            );

            if (result.modifiedCount === 0) { // if no ride was updated, it returns 404 Not Found
                return res.status(404).json({ error: "Driver not found or not changes"});
            }
            res.status(200).json({ message: "Driver profile updated"}); // if successful it returns how many rides were updated (usually 1)

            } catch (err) { // Catches errors like an invalid ID format / bad req data

                // Handle invalid ID format or DB errors
                res.status(400).json({ error: "Invalid driver ID or data" });
            }     
});

// PATCH /drivers/:id/availability - Update driver availability

app.patch('/drivers/:id/availability', async (req, res) => {
    try {
        const {available} = req.body; // true or false

        const result = await db.collection('drivers').updateOne(
            {_id: new ObjectId(req.params.id)},
            {$set: {available}}
        );
        if (result.modifiedCount === 0) {
            res.status(404).json({ error: `Driver not found or no changes`});    
        }
        res.status(200).json({ message: `Driver availability set to ${available}`});
    } catch (err) {
        res.status(400).json({ error: "Invalid driver ID or request" });
    }
});

// PATCH /admin/users/:id/block - Block or unblock user

app.patch('/admin/users/:id/block', async (req, res) => {
    
    const { role } = req.body; // ambil kedua-dua status & role dari body
    if (role !== 'admin') {
      return res.status(403).json({ error: "Access denied. Admins only." });
    }

    try {
    const { status } = req.body; // should be "active" or "blocked"
    const result = await db.collection('users').updateOne(
        {_id: new ObjectId(req.params.id)},
        { $set: {status} }
    );
    if (result.modifiedCount === 0) {
        return res.status(204).json({ error: "No content" })
    }
    res.status(200).json({ message: `User status updated to '${status}'`});
 } catch (err) {
    res.status(400).json({ error: "Invalid user ID or request body" });
 }
});

// DELETE /users/:id - Cancel a user

app.delete('/users/:id', async (req, res) => { // Handles DELETE req to remove a ride or user by ID
    const { role } = req.body; // body kena ada "role": "admin"

    if (role !== 'admin') {
        return res.status(403).json({ error: "Access denied. Admins only." });
    }

    try {
        const result = await db.collection('users').deleteOne( // Deletes the ride with the matching ID from the db
            { _id: new ObjectId(req.params.id) }
        );

        if (result.deletedCount === 0) { // if nothing was deleted, the ride probably didn't exist - return 404
            return res.status(404).json({ error: "User not found"});
        }
        res.status(200).json({ message: "User deleted"}); // on succes, res with hoe many rides were deleted

    } catch (err) { // catch & return 400 Bad req for invalid IDs / other errors
        res.status(400).json({ error: "Invalid user ID" });
    }
});

// DELETE /drivers/:id - Cancel a driver

app.delete('/drivers/:id', async (req, res) => { // Handles DELETE req to remove a ride or user by ID
    const { role } = req.body; // body kena ada "role": "admin"

    if (role !== 'admin') {
        return res.status(403).json({ error: "Access denied. Admins only." });
    }
    try {
        const result = await db.collection('drivers').deleteOne( // Deletes the ride with the matching ID from the db
            { _id: new ObjectId(req.params.id) }
        );

        if (result.deletedCount === 0) { // if nothing was deleted, the ride probably didn't exist - return 404
            return res.status(404).json({ error: "Driver not found"});
        }
        res.status(200).json({ message: "Driver deleted"}); // on succes, res with hoe many rides were deleted

    } catch (err) { // catch & return 400 Bad req for invalid IDs / other errors
        res.status(400).json({ error: "Invalid driver ID" });
    }
});


