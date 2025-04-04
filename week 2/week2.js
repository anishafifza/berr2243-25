const { MongoClient} = require('mongodb');

//  Define Drivers as a JavaScript Variable - Task 1
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

// show the data in the console - Task 2
console.log(drivers);

// TODO: show the all the drivers name in the console - Task 2
drivers.forEach(driver => {console.log(driver.name);});

// TODO: add additional driver to the drivers array - Task 2
drivers.push({
    name: "Alex",
    vehicleType: "Truck",
    isAvailable: false,
    rating: 4.7
});

async function main() 
{
    const uri = "mongodb://localhost:27017/"
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db("testDB");
       
        const driversCollection = db.collection("drivers");

        // Insert Drivers into MongoDB Task 3
        // for (const driver of drivers) {
        //     const result = await driversCollection.insertOne(driver);
        //     console.log(`New driver created with result: ${result.insertedId}`);
        // }
        
        // Query and Update Drivers - Task 4
        // const availableDrivers = await db.collection('drivers').find(
        //     {
        //         isAvailable: true,
        //         rating: { $gte: 4.5 }
        //     }).toArray();
        //     console.log("Available drivers:", availableDrivers);

        // Update - Task 5
        // const updateResult = await db.collection('drivers').updateMany(
        //     { isAvailable: true },
        //     { $inc: { rating: 0.1 } }
        // );
        // console.log(`Drivers updated with result: ${updateResult}`);

        // // Delete - Task 6
        // const deleteResult = await db.collection('drivers').deleteMany({ isAvailable: false });
        // console.log(`Driver delete with result: ${deleteResult}`);

        }
    
        finally 
    {
        await client.close();
    }
}

main();