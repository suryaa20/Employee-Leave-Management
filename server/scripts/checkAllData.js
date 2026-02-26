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

        const allLeaves = await Leave.find({});
        console.log(`Total leaves in database: ${allLeaves.length}`);

        for (const l of allLeaves) {
            console.log(`Leave: ${l._id}, Name: ${l.employeeName}, ID: ${l.employeeId}, Type: ${l.leaveType}, Status: ${l.status}`);
        }

        const users = await User.find({ name: /employee/i });
        console.log(`\nUsers with "employee" in name: ${users.length}`);
        for (const u of users) {
            console.log(`User: ${u.name}, ID: ${u._id}, Email: ${u.email}`);
        }

        process.exit(0);
    } catch (error) {
        console.error('Check failed:', error);
        process.exit(1);
    }
};

check();
