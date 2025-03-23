# BERR2243: DATABASE AND CLOUD SYSTEM

## WEEK 1 EXERCISE: Environment Setup, Git Workflows & Hello MongoDB

## Project Description 
Set up core developement tools, learn basic Git workflows, and create simple a NodeJS script that connect to MongoDB.


## Installation Steps :

**Step 1: Install Development Tools**

1. **Install VSCode** 
- Download from https://code.visualstudio.com/
- Download the LTS version from https://nodejs.org/
- Follow the  https://www.mongodb.com/docs/manual/administration/install-community/
- Start MongoDB Service :
```sh
mongod --dbpath /path/to/data/directory
```

2. **Install Git**
- Download from https://git-scm.com/
- Configure Git username/email:

```sh
git config --global user.name "Your Name"
git config --global user.email "your@email.com"
```
3. **Install MongoDB Compass (Optional)**
- Download from https://www.mongodb.com/products/compass

**Step 2 : Project Setup**

1. **Create a Github Account**
- https://education.github.com/pack
- Create a new Git Repository

![alt text](<Screenshot 2025-03-22 014125-1.jpg>)

2. **Initialize a Node.js project**
```sh
npm iniy -y
```
3. **Install the MongoDB Driver :**
```sh
npm install mongodb
```
**Step 3 : Usage**
1. **Run the script :**
```sh
node index.js
```

2. **Expected console output :**
```sh
Connected to MongoDB !
Document inserted
Query result : { _id: objectId('...'), name: ('Your Name'), Age: ('Your Age')}
```
3. **Verify in MongoDB Compass :**
- Connect to your MongoDB
- Navigate to `testDB.user` collection to view the inserted document

**Setup 4 : Git Workflow**

1. **Initialize Git Repository :**

```sh
git init
```
2. **Create branches :**

```sh
git branch <branch-name>
git checkout <branch-name>
```

3. **Commit and Push Changes :**

```sh
git add .
git commit -m "Initial commit: Setup documentation"
git push -u origin main
```

**Troubleshooting Issues**

- **MongoDB connection issues :** Ensure MongoDB serving is running and Verify MongoDB is listening on the correct port `27017`

- **Git Error** Check remote repositories

- **Node.js Script Fails to Connect to MongoDB :** 
1. Ensure you use `await client.connect()` when connecting to MongoDB
2. Double-check the connection string in index.js : 
`const uri = "mongodb://localhost:27017";`

- **MongoDB Data Not Appearing in Compass**

1. Refresh MongoDB Compass
2. Ensure the correct database and collection are selected
3. Verify data insertion with MongoDB shell:
```sh
use testDB  
db.users.find().pretty()
```

**Project Structure**
1. index.js
2. package.json
3. .gitignore
4. README.md

