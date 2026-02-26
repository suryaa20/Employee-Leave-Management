const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const check = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI;
        await mongoose.connect(mongoUri, {
            dbName: 'ProjectDB',
        });

        const User = require('../models/User');
        const Leave = require('../models/Leave');

        const users = await User.find({ email: 'employee1@gmail.com' });
        console.log(`Found ${users.length} users with email employee1@gmail.com`);
        for (const u of users) {
            const leaves = await Leave.countDocuments({ employeeId: u._id });
            console.log(`User: ${u.name}, ID: ${u._id}, Role: ${u.role}, Leaves: ${leaves}`);
        }

        process.exit(0);
    } catch (error) {
        console.error('Check failed:', error);
        process.exit(1);
    }
};

check();
