const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();

const PORT = process.env.PORT || 3000;
const db = new sqlite3.Database(path.resolve(__dirname, 'messages.db'));

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Initialize Database
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT,
        text TEXT
    )`, (err) => {
        if (err) {
            console.error('Error initializing database:', err.message);
        } else {
            console.log('Database initialized');
        }
    });
});

// Serve Frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Get Messages
app.get('/messages', (req, res) => {
    db.all('SELECT * FROM messages ORDER BY id ASC LIMIT 100', [], (err, rows) => {
        if (err) {
            console.error('Error fetching messages:', err.message);
            res.status(500).json({ error: err.message });
        } else {
            res.json(rows);
        }
    });
});

// Save a New Message
app.post('/messages', (req, res) => {
    console.log('Received POST /messages:', req.body);

    const username = req.body.username || Date.now().toString();
    const text = req.body.text;

    if (!text || typeof text !== 'string' || text.trim() === '' || text.length > 500) {
        console.error('Invalid message text:', text);
        return res.status(400).json({ error: 'Invalid message text.' });
    }

    db.run('INSERT INTO messages (username, text) VALUES (?, ?)', [username, text], function (err) {
        if (err) {
            console.error('Database insert error:', err.message);
            res.status(500).json({ error: err.message });
        } else {
            console.log('Message inserted:', { id: this.lastID, username, text });

            // Cleanup old messages (optional)
            db.run('DELETE FROM messages WHERE id NOT IN (SELECT id FROM messages ORDER BY id DESC LIMIT 100)', [], (err) => {
                if (err) {
                    console.error('Error cleaning up old messages:', err.message);
                }
            });

            res.status(201).json({ id: this.lastID });
        }
    });
});

// Start the Server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
