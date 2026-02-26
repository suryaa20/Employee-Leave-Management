const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const inspect = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI;
        await mongoose.connect(mongoUri, {
            dbName: 'ProjectDB',
        });

        const db = mongoose.connection.db;
        const users = await db.collection('users').find({}).toArray();

        console.log(`TOTAL USERS: ${users.length}`);
        users.forEach((user, i) => {
            console.log(`${i + 1}. [${user.role}] Name: "${user.name}", Email: "${user.email}", ID: ${user._id}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('Inspection failed:', error);
        process.exit(1);
    }
};

inspect();
