const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const dataDir = path.join(__dirname, 'backups');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
}

// Save user data
app.post('/api/backup', (req, res) => {
    try {
        const { deviceId, meals, dailyTarget, recentFoods } = req.body;

        if (!deviceId) {
            return res.status(400).json({ error: 'Device ID required' });
        }

        const backupFile = path.join(dataDir, `${deviceId}.json`);
        const data = {
            meals,
            dailyTarget,
            recentFoods,
            lastSaved: new Date().toISOString()
        };

        fs.writeFileSync(backupFile, JSON.stringify(data, null, 2));
        res.json({ success: true, message: 'Data backed up successfully', lastSaved: data.lastSaved });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Backup failed' });
    }
});

// Restore user data
app.get('/api/restore/:deviceId', (req, res) => {
    try {
        const { deviceId } = req.params;
        const backupFile = path.join(dataDir, `${deviceId}.json`);

        if (!fs.existsSync(backupFile)) {
            return res.status(404).json({ error: 'No backup found for this device' });
        }

        const data = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
        res.json({ success: true, data });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Restore failed' });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'Server is running' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`CalTrac backup server running on port ${PORT}`);
});
