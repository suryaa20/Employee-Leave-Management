const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const verify = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI;
        await mongoose.connect(mongoUri, {
            dbName: 'ProjectDB',
        });

        const db = mongoose.connection.db;

        const usersCount = await db.collection('users').countDocuments();
        const leavesCount = await db.collection('leaves').countDocuments();
        const reimbursementsCount = await db.collection('reimbursements').countDocuments();
        const oldCollectionCount = await db.collection('ProjectCollection').countDocuments();

        console.log('--- Verification Results ---');
        console.log(`Users collection: ${usersCount} documents`);
        console.log(`Leaves collection: ${leavesCount} documents`);
        console.log(`Reimbursements collection: ${reimbursementsCount} documents`);
        console.log(`Old ProjectCollection: ${oldCollectionCount} documents`);

        // Check if new collections are NOT empty if old was NOT empty
        if (oldCollectionCount > 0 && (usersCount + leavesCount + reimbursementsCount) === 0) {
            console.error('ERROR: Migration seems to have failed to move data!');
        } else {
            console.log('SUCCESS: Data is present in new collections.');
        }

        process.exit(0);
    } catch (error) {
        console.error('Verification failed:', error);
        process.exit(1);
    }
};

verify();
