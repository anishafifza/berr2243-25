// import the MongoClient class from the MongoDB library
// install with "npm install mongodb"
// function node is run to code "node index.js"
const { MongoClient, Collection } = require('mongodb'); 


async function main() {
    // Replace <connection-string> with your MongDB URI
    const uri = "mongodb://localhost:27017/"
    const client = new MongoClient(uri);

    try {
        await client.connect();

        // Check if MongoDB is actually connected
        await client.db("admin").command({ ping: 1});
        console.log("Connected to MongoDB!"); // Now this prints only if the connection is successful

        const db = client.db("testDB");
        const collection = db.collection("users");


        // Insert a document
        await collection.insertOne({ name: "Anis Hafifza", age: 2002 });
        console.log("Document inserted");

        // Query the document
        const result = await collection.findOne({ name: "Anis Hafifza"});
        console.log("Query result:", result);
    } catch (err) {
        console.error("Error Connecting to MongoDB:", err);
    } finally {
        if (client.topology && client.topology.isConnected())
        {
        await client.close();
        console.log("MongoDB connection closed.");
        }
    }
}

main();