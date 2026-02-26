const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: path.join(__dirname, '../.env') });

const dump = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI;
        await mongoose.connect(mongoUri, {
            dbName: 'ProjectDB',
        });

        const leaves = await mongoose.connection.db.collection('leaves').find({}).toArray();
        const project = await mongoose.connection.db.collection('ProjectCollection').find({}).toArray();

        const data = {
            leaves,
            project
        };

        fs.writeFileSync('server/scripts/full_dump.json', JSON.stringify(data, null, 2));
        console.log('Full dump saved to server/scripts/full_dump.json');

        process.exit(0);
    } catch (error) {
        console.error('Dump failed:', error);
        process.exit(1);
    }
};

dump();
