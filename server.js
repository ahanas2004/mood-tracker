require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// In-memory "database" (replace with real DB in production)
let moodsDB = [];

// Load initial data if file exists
const DATA_FILE = path.join(__dirname, 'data', 'moods.json');
try {
    if (fs.existsSync(DATA_FILE)) {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        // ✅ Corrected: Assign to moodsDB after parsing
        moodsDB = JSON.parse(data);
    }
} catch (err) {
    console.error('Error loading mood data:', err.message);
    moodsDB = []; // Fallback to empty array in case of error
}

// Save data to file
function saveData() {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(moodsDB, null, 2));
    } catch (err) {
        console.error('Error saving mood data:', err.message);
    }
}

// API Routes
app.get('/api/moods', (req, res) => {
    res.json(moodsDB);
});

app.post('/api/moods', (req, res) => {
    const { mood, note } = req.body;

    // ✅ Validate mood correctly (between 1 and 5)
    if (!mood || isNaN(mood) || mood < 1 || mood > 5) {
        return res.status(400).json({ error: 'Invalid mood value. Must be between 1 and 5.' });
    }

    const newEntry = {
        id: Date.now(),
        mood: parseInt(mood),
        note: note || '',
        date: new Date().toISOString()
    };

    // ✅ Add new mood to moodsDB
    moodsDB.push(newEntry);
    saveData();

    res.status(201).json(newEntry);
});

// Serve frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
