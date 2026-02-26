const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      dbName : 'ProjectDB',
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Create default admin if not exists
    await createDefaultAdmin();
    
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const createDefaultAdmin = async () => {
  try {
    const User = require('../models/User');
    const adminExists = await User.findOne({ role: 'admin' });
    
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      await User.create({
        name: 'Admin User',
        email: 'admin@leavems.com',
        password: hashedPassword,
        role: 'admin',
        department: 'Management',
        leaveBalance: {
          annual: 0,
          sick: 0,
          casual: 0
        }
      });
      
      console.log('✅ Default admin created:');
      console.log('   Email: admin@leavems.com');
      console.log('   Password: admin123');
    }
  } catch (error) {
    console.error('Error creating admin:', error);
  }
};

module.exports = connectDB;