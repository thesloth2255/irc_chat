const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();

const PORT = process.env.PORT || 3000;
const db = new sqlite3.Database('./messages.db');

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Initialize Database
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT,
        text TEXT
    )`);
});

// Serve Frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Get Messages
app.get('/messages', (req, res) => {
    db.all('SELECT * FROM messages ORDER BY id ASC LIMIT 100', [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(rows);
        }
    });
});

// Save a New Message
app.post('/messages', (req, res) => {
    // Fallback to a Unix timestamp if the username is missing
    const username = req.body.username || (() => {
        const now = Date.now();
        return [
            Math.floor(now / 10000000),
            Math.floor((now % 10000000) / 100000),
            Math.floor((now % 100000) / 1000),
            now % 1000
        ].join(":"); // Format as `1737:4:78:388`
    })();

    const text = req.body.text;

    // Insert the message into the database
    db.run('INSERT INTO messages (username, text) VALUES (?, ?)', [username, text], function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.status(201).json({ id: this.lastID });
        }
    });
});

// Start the Server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
