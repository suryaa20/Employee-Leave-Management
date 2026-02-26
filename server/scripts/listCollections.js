const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const list = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI;
        await mongoose.connect(mongoUri, {
            dbName: 'ProjectDB',
        });

        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();

        console.log('--- Collections in ProjectDB ---');
        for (let col of collections) {
            const count = await db.collection(col.name).countDocuments();
            console.log(`${col.name}: ${count}`);
        }

        process.exit(0);
    } catch (error) {
        console.error('List collections failed:', error);
        process.exit(1);
    }
};

list();
