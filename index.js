const { MongoClient, Collection } = require('mongodb');

async function main() {
    // Replace <connection-string> with your MongDB URI
    const uri = "mongodb://localhost:27017/"
    const client = new MongoClient(uri);

    try {
        //
        console.log("Connected to MongoDB!");

        const db = client.db("testDB");
        const collection = db.collection("users");


        // Insert a document
        await collection.insertOne({ name: "Anis Hafifza", age: 2002 });
        console.log("Document inserted");

        // Query the document
        const result = await collection.findOne({ name: "Anis Hafifza"});
        console.log("Query result:", result);
    } catch (err) {
        console.error("Error:", err);
    } finally {
        await client.close();
    }
}

main();