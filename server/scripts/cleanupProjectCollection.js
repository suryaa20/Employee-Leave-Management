const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const cleanup = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI;
        await mongoose.connect(mongoUri, {
            dbName: 'ProjectDB',
        });

        const db = mongoose.connection.db;

        // Delete known stray documents or leaves from the collection
        const result = await db.collection('ProjectCollection').deleteMany({
            $or: [
                { _id: new mongoose.Types.ObjectId('699e17a78d999f9933a68e0e') },
                { leaveType: { $exists: true } },
                { amount: { $exists: true } }
            ]
        });

        console.log(`Successfully removed ${result.deletedCount} stray documents from ProjectCollection.`);

        process.exit(0);
    } catch (error) {
        console.error('Cleanup failed:', error);
        process.exit(1);
    }
};

cleanup();
