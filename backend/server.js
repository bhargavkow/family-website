require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const connectDB = require('./src/config/db');
const compression = require('compression');
const os = require('os');

const app = express();
app.use(compression());
const PORT = process.env.PORT || 5000;

// Trust proxy for secure cookies on Render/Vercel
app.set('trust proxy', 1);

// Connect to MongoDB
connectDB();

// ─── CORS ────────────────────────────────────────────────────────────────────
// Allows: localhost (dev), any LAN IP (phone/tablet on same Wi-Fi), production
app.use(cors({
  origin: (origin, callback) => {
    // Allow server-to-server / Postman (no origin header)
    if (!origin) return callback(null, true);

    // Always allow localhost / 127.0.0.1 on any port
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }

    // Allow any LAN IP range on any port (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
    if (/^http:\/\/(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)\d{1,3}\.\d{1,3}(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }

    // Allow explicitly configured production origins
    const prodOrigins = process.env.FRONTEND_URL
      ? process.env.FRONTEND_URL.split(',').map(u => u.trim())
      : [];
    if (prodOrigins.some(o => origin === o || origin.startsWith(o))) {
      return callback(null, true);
    }

    // Block everything else
    console.warn(`⚠️  CORS blocked: ${origin}`);
    callback(new Error(`CORS: ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Routes
app.use('/api/auth',    require('./src/routes/auth'));
app.use('/api/members', require('./src/routes/members'));
app.use('/api/posts',   require('./src/routes/posts'));
app.use('/api/messages',require('./src/routes/messages'));
app.use('/api/search',  require('./src/routes/search'));
app.use('/api/admin',   require('./src/routes/admin'));
app.use('/api/moments', require('./src/routes/moments'));
app.use('/api/events',  require('./src/routes/events'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({ message: err.message || 'Internal server error' });
});

// Get local LAN IP for display
const getLocalIP = () => {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) return net.address;
    }
  }
  return 'localhost';
};

app.listen(PORT, '0.0.0.0', () => {
  const ip = getLocalIP();
  console.log(`🚀 Server running:`);
  console.log(`   Local:   http://localhost:${PORT}`);
  console.log(`   Network: http://${ip}:${PORT}`);
});
