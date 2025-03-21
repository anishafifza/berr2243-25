# BERR2243: DATABASE AND CLOUD SYSTEM

## WEEK 1 EXERCISE: Environment Setup, Git Workflows & Hello MongoDB

## Objective: 
Set up core developement tools, learn basic Git workflows, and create simple a NodeJS script that connect to MongoDB.

## Exercise Overview:
**Tools to Install**

1. **VSCode**: Code Editor.
2. **NodeJS & npm**: JavaScript runtime and package manager.
3. **MongoDB**: Database (local or cloud instance).
4. **Git**: Version control system.
5. **MongoDB Compass**: GUI for MongoDB (optional).

## Lab Procedures:

**Step 1: Install Development Tools**

1. **Install VSCode** 
- Download from https://code.visualstudio.com/
- Install recommended extensions: **MongoDB for VSCode**

2. **Install NodeJS & npm**
- Download the LTS version from https://nodejs.org/
- Verify installation:

```sh
node -v
npm -v
```
3. **Install MongoDB**
- Follow https://www.mongodb.com/docs/manual/administration/install-community/
- Start MongoDB service

4. **Install Git**
- Download from https://git-scm.com/
- Configure Git username/email:

```sh
git config --global user.name "Your Name"
git config --global user.email "your@email.com"
```

5. **Install MongoDB Compass (Optional)**
- Download from https://www.mongodb.com/products/compass

**Step 2: Git Basics & Repository Setup**

1. **Create a Github Account**
- https://education.github.com/pack
- Create a new Git Repository
![alt text](<Screenshot 2025-03-22 014125-1.jpg>)

2. **Create a README.md File**
- Documents your installation steps

3. **Commit and Push to GitHub**

```sh
git add .
git commit -m "Initial commit: Setup documentation"
git branch -M main
git remote add origin https://github.com/anishafifza/berr2243-25.git
git push -u origin main
```

**Step 3: Create a "Hello MongoDB" NodeJS Script**

1. **Initialize a NodeJS Project**
```sh
npm init -y
```
2. **Install MongoDB Driver**
```sh
npm install mongodb
```
3. **Create index.js**
```sh
const { MongoClient, Collection } = require('mongodb');

async function main() {
    // Replace <connection-string> with your MongDB URI
    const uri = "mongodb://localhost:27017/"
    const client = new MongoClient(uri);

    try {
        await client.connect();
        console.log("Connected to MongoDB!");

        const db = client.db("testDB");
        const collection = db.collection("users");


        // Insert a document
        await collection.insertOne({ name: "Anis", age: 23 });
        console.log("Document inserted");

        // Query the document
        const result = await collection.findOne({ name: "Anis"});
        console.log("Query result:", result);
    } catch (err) {
        console.error("Error:", err);
    } finally {
        await client.close();
    }
}

main();
```
4. **Run the Script**
```sh
node index.js
```
5. **Verify in MongoDB Compass**
- Connect to you MongoDB instance and check the testDB database

**Step4: Push Code to GitHub**

1. Create a file **.gitignore**
2. Add the node_modules into the .gitignore file
```sh
# dependencies
/node_modules
```

3. **Commit Changes**
```sh
git add .
git commit -m "Add NodeJS script and MongoDB connection"
```
4. **Push to GitHub**


