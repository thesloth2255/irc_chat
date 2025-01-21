const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();

const PORT = process.env.PORT || 3000;
const dbPath = path.resolve(__dirname, 'messages.db');
const db = new sqlite3.Database(dbPath);

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
    const username = req.body.username || Date.now().toString();
    const text = req.body.text;

    if (!text || typeof text !== 'string' || text.trim() === '' || text.length > 500) {
        return res.status(400).json({ error: 'Invalid message text.' });
    }

    db.run('INSERT INTO messages (username, text) VALUES (?, ?)', [username, text], function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            // Cleanup old messages
            db.run('DELETE FROM messages WHERE id NOT IN (SELECT id FROM messages ORDER BY id DESC LIMIT 100)', []);
            res.status(201).json({ id: this.lastID });
        }
    });
});

// Delete All Messages (NEW ROUTE)
app.delete('/messages', (req, res) => {
    console.log('DELETE /messages route called'); // Debug log to confirm the route is being hit
    db.run('DELETE FROM messages', [], function (err) {
        if (err) {
            console.error('Error deleting messages:', err.message);
            res.status(500).json({ error: 'Failed to delete messages.' });
        } else {
            console.log('All messages deleted.');
            res.status(200).json({ success: true, message: 'All messages deleted.' });
        }
    });
});

// Start the Server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
