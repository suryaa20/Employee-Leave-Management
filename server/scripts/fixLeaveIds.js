const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const fix = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI;
        await mongoose.connect(mongoUri, {
            dbName: 'ProjectDB',
        });

        const User = require('../models/User');
        const Leave = require('../models/Leave');

        const employee1 = await User.findOne({ email: 'employee1@gmail.com' });
        if (!employee1) {
            console.log('User employee1@gmail.com not found');
            process.exit(1);
        }

        console.log(`Target User ID: ${employee1._id}`);

        // Update all leaves that have employeeName "employee1"
        const result = await Leave.updateMany(
            { employeeName: 'employee1' },
            { $set: { employeeId: employee1._id } }
        );

        console.log(`Successfully updated ${result.modifiedCount} leave records for employee1.`);
        process.exit(0);
    } catch (error) {
        console.error('Fix failed:', error);
        process.exit(1);
    }
};

fix();
