const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const migrate = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            console.error('MONGODB_URI is not defined in .env');
            process.exit(1);
        }

        console.log('Connecting to MongoDB...');
        await mongoose.connect(mongoUri, {
            dbName: 'ProjectDB',
        });
        console.log('Connected.');

        const db = mongoose.connection.db;
        const oldCollection = db.collection('ProjectCollection');

        console.log('Fetching documents from ProjectCollection...');
        const documents = await oldCollection.find({}).toArray();
        console.log(`Found ${documents.length} documents.`);

        const users = [];
        const leaves = [];
        const reimbursements = [];

        documents.forEach(doc => {
            if (doc.email && doc.password) {
                users.push(doc);
            } else if (doc.leaveType) {
                leaves.push(doc);
            } else if (doc.amount && (doc.category || doc.title)) {
                reimbursements.push(doc);
            } else {
                console.warn('Unknown document type:', doc._id);
            }
        });

        console.log(`Identified: ${users.length} users, ${leaves.length} leaves, ${reimbursements.length} reimbursements.`);

        if (users.length > 0) {
            console.log('Migrating users...');
            await db.collection('users').insertMany(users);
            console.log('Users migrated.');
        }

        if (leaves.length > 0) {
            console.log('Migrating leaves...');
            await db.collection('leaves').insertMany(leaves);
            console.log('Leaves migrated.');
        }

        if (reimbursements.length > 0) {
            console.log('Migrating reimbursements...');
            await db.collection('reimbursements').insertMany(reimbursements);
            console.log('Reimbursements migrated.');
        }

        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

migrate();
