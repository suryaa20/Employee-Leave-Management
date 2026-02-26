const mongoose = require('mongoose');
require('dotenv').config();

const fixOrphans = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, { dbName: 'ProjectDB' });
        console.log('Connected to MongoDB (ProjectDB)');

        const User = mongoose.model('User', new mongoose.Schema({ name: String }));
        const Leave = mongoose.model('Leave', new mongoose.Schema({ employeeId: mongoose.Schema.Types.ObjectId, employeeName: String }));
        const Reimbursement = mongoose.model('Reimbursement', new mongoose.Schema({ employeeId: mongoose.Schema.Types.ObjectId, employeeName: String }));

        const emp1 = await User.findOne({ name: /employee1/i });
        if (emp1) {
            console.log(`Target User: \${emp1.name} (ID: \${emp1._id})`);

            const leaveRes = await Leave.updateMany(
                { employeeName: /employee1/i, employeeId: { $ne: emp1._id } },
                { $set: { employeeId: emp1._id } }
            );
            console.log(`Leaves updated: \${leaveRes.modifiedCount}`);

            const reimbRes = await Reimbursement.updateMany(
                { employeeName: /employee1/i, employeeId: { $ne: emp1._id } },
                { $set: { employeeId: emp1._id } }
            );
            console.log(`Reimbursements updated: \${reimbRes.modifiedCount}`);
        } else {
            console.log('User employee1 not found.');
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

fixOrphans();
