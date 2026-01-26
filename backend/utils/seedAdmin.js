import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.model.js';

dotenv.config();

const seedAdmin = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: 'WMS'
    });
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'Admin' });
    if (existingAdmin) {
      console.log('Admin user already exists');
      process.exit(0);
    }

    // Create admin user
    const admin = await User.create({
      name: 'Admin',
      email: 'admin@wms.com',
      password: 'admin123', // Change this in production!
      role: 'Admin'
    });

    console.log('Admin user created successfully:');
    console.log('Email: admin@wms.com');
    console.log('Password: admin123');
    console.log('⚠️  Please change the password after first login!');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  }
};

seedAdmin();
