const { MongoClient} = require('mongodb');

async function main() 
{
    const uri = "mongodb://localhost:27017/"
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db("testDB");
        const usersCollection = db.collection("users");

        // Insert to users
            const result = await usersCollection.insertMany([
                {
                    name: "Anis",
                    email: "anisExample@gmail.com",
                    role: "customer",
                    phone: "01156290047"
                },
                {
                    name: "Ain",
                    email: "ainExample@gmail.com",
                    role: "driver",
                    phone: "0123456789",
                    vehicle: "Perodua Myvi"
                }
            ]);

            console.log(" Inserted user IDs: ", result.insertedIds);
        } catch (err) {
            console.error(" Error inserting data: ", err);

        } finally {
            await client.close();
        }
        }
main();