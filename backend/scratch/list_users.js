require('dotenv').config();
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: String,
  isActive: Boolean
});
const User = mongoose.model('User', userSchema);

async function listUsers() {
  await mongoose.connect(process.env.MONGODB_URI);
  const users = await User.find({}, 'username isActive');
  console.log('--- USERS IN DATABASE ---');
  users.forEach(u => console.log(`- ${u.username} (Active: ${u.isActive})`));
  process.exit(0);
}

listUsers();
