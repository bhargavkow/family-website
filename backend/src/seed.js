require('dotenv').config();
const connectDB = require('./config/db');
const User = require('./models/User');

const seed = async () => {
  await connectDB();

  const existing = await User.findOne({ username: 'admin' });
  if (existing) {
    console.log('⚠️  Admin user already exists. Skipping seed.');
    process.exit(0);
  }

  await User.create({
    username: 'admin',
    name: 'Family Admin',
    password: process.env.ADMIN_PASSWORD || 'Admin@1234',
    bio: 'Family website administrator',
    isAdmin: true,
    isActive: true,
  });

  console.log('✅ Admin user created!');
  console.log('   Username: admin');
  console.log(`   Password: ${process.env.ADMIN_PASSWORD || 'Admin@1234'}`);
  console.log('   ⚠️  Change the password after first login!');
  process.exit(0);
};

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
