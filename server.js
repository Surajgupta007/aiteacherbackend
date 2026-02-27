const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const fs = require('fs');
const path = require('path');

// Load env vars
dotenv.config();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('Created uploads directory');
}

// Connect to database
if (process.env.MONGO_URI) {
    connectDB();
} else {
    console.log("MongoDB URI not found, passing DB connection for now.");
}

const app = express();

// Body parser
app.use(express.json());

// Enable CORS
app.use(cors({
    origin: process.env.CLIENT_URL || '*',
    credentials: true
}));

// Route files
const auth = require('./routes/auth');
const documents = require('./routes/documents');
const ai = require('./routes/ai');
const flashcards = require('./routes/flashcards');
const quizzes = require('./routes/quizzes');
const revision = require('./routes/revision');

// Set static folder for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mount routers
app.use('/api/v1/auth', auth);
app.use('/api/v1/documents', documents);
app.use('/api/v1/ai', ai);
app.use('/api/v1/flashcards', flashcards);
app.use('/api/v1/quizzes', quizzes);
app.use('/api/v1/revision', revision);

app.get('/', (req, res) => {
    res.status(200).json({ success: true, message: 'Welcome to Antigravity API' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`));
