// models/user.js

module.exports = {
    getUserByEmail: async (db, email) => {
        return await db.collection('users').findOne({ email });
    },
    createUser: async (db, userData) => {
        return await db.collection('users').insertOne(userData);
    }
};
