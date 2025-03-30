const { MongoClient} = require('mongodb');

const drivers = [
    {
        name: "John Doe",
        vehicleType: "Sedan",
        isAvailable: true,
        rating: 4.8
    },
    {
        name: "Alice",
        vehicleType: "SUV",
        isAvailable: false,
        rating: 4.5
    }
];

// show the data in the console
console.log(drivers);

// TODO: show the all the drivers name in the console
drivers.forEach(driver => {console.log(driver.name);});

// TODO: add additional driver to the drivers array
drivers.push({
    name: "David",
    vehicleType: "Truck",
    isAvailable: true,
    rating: 4.6
});

async function main() 
{
    const uri = "mongodb://localhost:27017/"
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db("testDB");
       
        const driversCollection = db.collection("drivers"); // Insert Drivers into MongoDB

        // for (const driver of drivers) {
        //     const result = await driversCollection.insertOne(driver);
        //     console.log(`New driver created with result: ${result.insertedId}`);
        // }
        
        // Query and Update Drivers
        // const availableDrivers = await db.collection('drivers').find(
        //     {
        //         isAvailable: true,
        //         rating: { $gte: 4.5 }
        //     }).toArray();
        //     console.log("Available drivers:", availableDrivers);

        // Update
        // const updateResult = await db.collection('drivers').updateOne(
        //     { name: "John Doe" },
        //     { $inc: { rating: 0.1 } }
        // );
        // console.log(`Drivers updated with result: ${updateResult}`);

        // Delete - Task 6
        const deleteResult = await db.collection('drivers').deleteOne({ isAvailable: false });
        console.log(`Driver delete with result: ${deleteResult}`);
        }
    finally 
    {
        await client.close();
    }
}

main();