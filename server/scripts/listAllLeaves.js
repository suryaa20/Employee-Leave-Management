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

        const Leave = require('../models/Leave');
        const leaves = await Leave.find({});
        console.log('--- ALL LEAVES IN COLLECTION ---');
        console.log(JSON.stringify(leaves, null, 2));

        process.exit(0);
    } catch (error) {
        console.error('List failed:', error);
        process.exit(1);
    }
};

list();
