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
    rating: 4.8
});

async function main() {
    const uri = "mongodb://localhost:27017/"
    const client = new MongoClient(uri);

    try {
        await driversCollection.connect();
        const db = client.db("testDB");
       
        const driversCollection = db.collection(`drivers`);

        for (const driver of drivers) {
            const result = await driversCollection.insertOne(driver);
            console.log(`New driver created with result: ${result.insertedId}`);
        }
    } 

    catch(err) {
        console.error("Error:", err);
    }

    finally {
        await client.close();
    }
}

main();