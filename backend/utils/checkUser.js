import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.model.js';

dotenv.config();

const checkUser = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: 'WMS'
    });
    console.log('✅ Connected to MongoDB\n');

    const email = process.argv[2] || 'ecosystemnirma@gmail.com';
    console.log(`🔍 Checking user with email: ${email}\n`);

    // Find user with password
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

    if (!user) {
      console.log('❌ User not found in database');
      console.log('\n📋 All users in database:');
      const allUsers = await User.find({}).select('-password');
      allUsers.forEach(u => {
        console.log(`  - ${u.email} (${u.name}, ${u.role}, Active: ${u.isActive})`);
      });
      process.exit(1);
    }

    console.log('✅ User found:');
    console.log(`   Name: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Active: ${user.isActive}`);
    console.log(`   Password exists: ${user.password ? 'Yes' : 'No'}`);
    console.log(`   Password length: ${user.password ? user.password.length : 0}`);
    console.log(`   Password starts with: ${user.password ? user.password.substring(0, 10) + '...' : 'N/A'}`);

    // Test password comparison
    const testPassword = process.argv[3];
    if (testPassword) {
      console.log(`\n🔐 Testing password: ${testPassword}`);
      const isMatch = await user.comparePassword(testPassword);
      console.log(`   Password match: ${isMatch ? '✅ YES' : '❌ NO'}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

checkUser();
