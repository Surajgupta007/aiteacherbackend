const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const fs = require('fs');
const path = require('path');

console.log("🔥 SERVER FILE IS RUNNING");

// Load env vars
dotenv.config();
console.log("✅ ENV LOADED");

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('📁 Created uploads directory');
} else {
    console.log('📁 Uploads directory exists');
}

// Connect to database
if (process.env.MONGO_URI) {
    console.log("🔌 Connecting to MongoDB...");
    connectDB();
} else {
    console.log("⚠️ MongoDB URI not found, skipping DB connection.");
}

const app = express();

// Body parser
app.use(express.json());
console.log("✅ Express JSON middleware loaded");

// Enable CORS
const allowedOrigins = (process.env.CLIENT_URL || '')
    .split(',')
    .map(o => o.trim())
    .filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        console.log("🌍 Incoming request origin:", origin);

        if (!origin) return callback(null, true);

        if (allowedOrigins.length === 0) return callback(null, true);

        if (allowedOrigins.some(allowed => origin === allowed || origin.startsWith(allowed))) {
            return callback(null, true);
        }

        if (origin.includes('vercel.app')) {
            return callback(null, true);
        }

        console.log("❌ Blocked by CORS:", origin);
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true
}));

console.log("✅ CORS middleware loaded");

// Route files
console.log("📦 Loading route files...");
const auth = require('./routes/auth');
const documents = require('./routes/documents');
const ai = require('./routes/ai');
const flashcards = require('./routes/flashcards');
const quizzes = require('./routes/quizzes');
const revision = require('./routes/revision');

console.log("✅ Route files loaded");

// Set static folder for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
console.log("✅ Static uploads route set");

// Mount routers
app.use('/api/v1/auth', auth);
app.use('/api/v1/documents', documents);
app.use('/api/v1/ai', ai);
app.use('/api/v1/flashcards', flashcards);
app.use('/api/v1/quizzes', quizzes);
app.use('/api/v1/revision', revision);

console.log("✅ Routes mounted");

// Root route
app.get('/', (req, res) => {
    console.log("🏠 Root route hit");
    res.status(200).json({ success: true, message: 'Welcome to Antigravity API' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});