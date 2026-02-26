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

        const User = require('../models/User');
        const users = await User.find({}).select('name email role');
        console.log(JSON.stringify(users, null, 2));

        process.exit(0);
    } catch (error) {
        console.error('List failed:', error);
        process.exit(1);
    }
};

list();
