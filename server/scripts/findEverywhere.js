const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const find = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI;
        await mongoose.connect(mongoUri, {
            dbName: 'ProjectDB',
        });

        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('Collections:', collections.map(c => c.name));

        for (const col of collections) {
            const count = await mongoose.connection.db.collection(col.name).countDocuments();
            console.log(`- ${col.name}: ${count} documents`);

            // Search for "employee1" or leave-like data in every collection
            const sample = await mongoose.connection.db.collection(col.name).find({
                $or: [
                    { employeeName: /employee1/i },
                    { name: /employee1/i },
                    { email: /employee1/i },
                    { leaveType: { $exists: true } }
                ]
            }).toArray();

            if (sample.length > 0) {
                console.log(`  Found ${sample.length} possible matches in ${col.name}:`);
                sample.forEach(s => {
                    console.log(`    ID: ${s._id}, Name: ${s.name || s.employeeName}, Data: ${JSON.stringify(s).substring(0, 100)}...`);
                });
            }
        }

        process.exit(0);
    } catch (error) {
        console.error('Find failed:', error);
        process.exit(1);
    }
};

find();
