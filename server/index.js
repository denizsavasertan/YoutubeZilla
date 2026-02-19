import express from 'express';
import cors from 'cors';
import { getInfo, downloadVideo, DOWNLOAD_DIR } from './downloader.js';
import path from 'path';

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// Endpoint to get video info
app.use('/api/info', async (req, res) => {
    const { url } = req.query;
    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    // Check if the URL is a playlist
    const urlObj = new URL(url);
    if (urlObj.searchParams.has('list')) {
        return res.status(400).json({ error: 'Playlists are not supported. Please use a single video URL.' });
    }
    try {
        const info = await getInfo(url);
        res.json(info);
    } catch (error) {
        console.error('Error fetching info:', error);
        res.status(500).json({ error: 'Failed to fetch video info', details: error.message });
    }
});

// Endpoint to start download
app.use('/api/download', async (req, res) => {
    const { url, formatId, mode, audioFormat, container } = req.body;
    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }
    try {
        const result = await downloadVideo(url, formatId, mode, audioFormat, container);
        res.json({ success: true, path: result });
    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({ error: 'Download failed' });
    }
});

// Endpoint to open file in explorer
app.use('/api/reveal', (req, res) => {
    let { path: filePath } = req.body;
    if (!filePath) {
        return res.status(400).json({ error: 'Path is required' });
    }

    if (filePath === 'downloads') {
        filePath = DOWNLOAD_DIR;
    }

    // Use explorer /select to highlight the file if it's a file, or just open if dir
    // Simple check: if it looks like a directory or is the download dir, just open it.
    if (filePath === DOWNLOAD_DIR) {
        require('child_process').exec(`start "" "${filePath}"`);
    } else {
        require('child_process').exec(`explorer /select,"${filePath}"`, (error) => {
            if (error) {
                console.error('Reveal error:', error);
                // Fallback to opening the folder
                require('child_process').exec(`start "" "${path.dirname(filePath)}"`);
            }
        });
    }
    res.json({ success: true });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
