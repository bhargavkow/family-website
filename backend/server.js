require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const connectDB = require('./src/config/db');

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy for secure cookies on Render/Vercel
app.set('trust proxy', 1);

// Connect to MongoDB
connectDB();

// CORS — allow frontend origin(s) with credentials
const origins = process.env.FRONTEND_URL 
  ? process.env.FRONTEND_URL.split(',').map(url => url.trim()) 
  : ['http://localhost:5173'];

app.use(cors({
  origin: origins,
  credentials: true,
}));

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());


// Routes

app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/members', require('./src/routes/members'));
app.use('/api/posts', require('./src/routes/posts'));
app.use('/api/messages', require('./src/routes/messages'));
app.use('/api/search', require('./src/routes/search'));
app.use('/api/admin', require('./src/routes/admin'));
app.use('/api/moments', require('./src/routes/moments'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({ message: err.message || 'Internal server error' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://192.168.1.45:${PORT}`);
});
