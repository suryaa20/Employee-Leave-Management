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

        const employees = await User.find({ email: 'employee1@gmail.com' });
        if (employees.length === 0) {
            console.log('Employee not found');
            process.exit(0);
        }
        if (employees.length > 1) {
            console.log(`WARNING: Found ${employees.length} users with email employee1@gmail.com`);
        }

        const employee = employees[0];

        console.log(`Current Employee: ${employee.name} (${employee._id})`);

        const leaves = await Leave.find({ employeeName: employee.name });
        console.log(`Found ${leaves.length} leaves with name "${employee.name}"`);

        leaves.forEach(l => {
            console.log(JSON.stringify(l, null, 2));
            console.log(`Match: ${l.employeeId.toString() === employee._id.toString()}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('Check failed:', error);
        process.exit(1);
    }
};

check();
