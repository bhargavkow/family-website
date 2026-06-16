require('dotenv').config();
const connectDB = require('./config/db');
const User = require('./models/User');

const seed = async () => {
  await connectDB();

  const adminUsername = process.env.ADMIN_USERNAME;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminUsername || !adminPassword) {
    console.error('❌  ADMIN_USERNAME and ADMIN_PASSWORD must both be set in your .env file. Aborting seed.');
    process.exit(1);
  }

  const existing = await User.findOne({ username: adminUsername });
  if (existing) {
    console.log('⚠️  Admin user already exists. Skipping seed.');
    process.exit(0);
  }

  await User.create({
    username: adminUsername,
    name: 'Family Admin',
    password: adminPassword,
    bio: 'Family website administrator',
    isAdmin: true,
    isActive: true,
  });

  console.log('✅ Admin user created!');
  console.log(`   Username: ${adminUsername}`);
  console.log('   Password: (set via ADMIN_PASSWORD in .env)');
  console.log('   ⚠️  Change the password after first login!');
  process.exit(0);
};

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
