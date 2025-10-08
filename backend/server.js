const express = require('express');
const cors = require('cors');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const ffprobePath = require('ffprobe-static').path;
const { readSheet, listDriveMedia, auth, drive } = require('./google');
const { google } = require('googleapis');
const fs = require('fs');
const tmp = require('tmp');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
const baseUrl = `http://localhost:${PORT}`;

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

app.use(cors());
app.use(express.json());

// ----------------- Caching -----------------
const cache = {};
const videoCache = {}; // store processed video metadata
const CACHE_TTL = parseInt(process.env.CACHE_TTL_SECONDS || '60', 10);

function setCache(key, value) {
  cache[key] = { value, ts: Date.now() };
}

function getCache(key) {
  const item = cache[key];
  if (!item) return null;
  if (Date.now() - item.ts > CACHE_TTL * 1000) {
    delete cache[key];
    return null;
  }
  return item.value;
}

// ----------------- Helpers -----------------

// Download full video temporarily
async function downloadVideo(videoId) {
  const client = await auth.getClient();
  const driveWithAuth = google.drive({ version: 'v3', auth: client });

  return new Promise((resolve, reject) => {
    const tempFile = tmp.fileSync({ postfix: '.mp4' });
    const writeStream = fs.createWriteStream(tempFile.name);

    driveWithAuth.files.get(
      { fileId: videoId, alt: 'media' },
      { responseType: 'stream' },
      (err, response) => {
        if (err) return reject(err);
        response.data
          .pipe(writeStream)
          .on('finish', () => resolve(tempFile))
          .on('error', reject);
      }
    );
  });
}

// Get duration using ffprobe
async function getVideoDuration(filePath) {
  return new Promise((resolve, reject) => {
    ffmpeg(filePath).ffprobe((err, metadata) => {
      if (err) return reject(err);
      resolve(metadata.format.duration || 10); // fallback to 10s
    });
  });
}

// ----------------- Sheets API -----------------
app.get('/api/business-news', async (req, res) => {
  try {
    const cached = getCache('business-news');
    if (cached) return res.json(cached);

    const rows = await readSheet(process.env.SHEET_ID_BUSINESS, process.env.SHEET_RANGE_BUSINESS);
    setCache('business-news', rows);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/corp-news', async (req, res) => {
  try {
    const cached = getCache('corp-news');
    if (cached) return res.json(cached);

    const rows = await readSheet(process.env.SHEET_ID_CORP, process.env.SHEET_RANGE_CORP);
    setCache('corp-news', rows);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/employees', async (req, res) => {
  try {
    const cached = getCache('employees');
    if (cached) return res.json(cached);

    const rows = await readSheet(process.env.EMPLOYEE_SHEET_ID, process.env.SHEET_RANGE_EMPLOYEE);
    const files = await listDriveMedia(process.env.EMPLOYEE_IMAGE_FOLDER_ID);

    const imageMap = {};
    files.forEach(f => {
      if (f.type === 'image') imageMap[f.id] = `${baseUrl}/api/employee-images/${f.id}`;
    });

    const merged = rows.map((row, index) => {
      if (index === 0) return row; // header
      const url = row[2];
      const match = url.match(/\/d\/([a-zA-Z0-9_-]+)\//);
      const imageId = match?.[1];
      return [
        row[0],
        row[1],
        imageId ? imageMap[imageId] || `${baseUrl}/api/employee-images/${imageId}` : url
      ];
    });

    setCache('employees', merged);
    res.json(merged);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ----------------- Event Media -----------------
app.get('/api/event-media', async (req, res) => {
  try {
    const cached = getCache('event-media');
    if (cached) return res.json(cached);

    const files = await listDriveMedia(process.env.DRIVE_FOLDER_ID_EVENTS);

    const enriched = [];

    for (const file of files) {
      if (file.type === 'video') {
        // Check if duration is cached
        if (!videoCache[file.id]) {
          const tempFile = await downloadVideo(file.id);
          const durationSeconds = await getVideoDuration(tempFile.name);
          tempFile.removeCallback(); // cleanup

          videoCache[file.id] = {
            durationSeconds,
            name: file.name,
            url: `${baseUrl}/api/event-media/${file.id}`
          };
        }

        enriched.push({
          id: file.id,
          name: file.name,
          type: 'video',
          url: `${baseUrl}/api/event-media/${file.id}`,
          durationSeconds: videoCache[file.id].durationSeconds
        });
      } else {
        // For images, use default duration
        enriched.push({
          id: file.id,
          name: file.name,
          type: 'image',
          url: `${baseUrl}/api/event-media/${file.id}`,
          durationSeconds: 10
        });
      }
    }

    setCache('event-media', enriched);
    res.json(enriched);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ----------------- Stream video/images -----------------
app.get('/api/event-media/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const client = await auth.getClient();
    const driveWithAuth = google.drive({ version: 'v3', auth: client });
    const meta = await driveWithAuth.files.get({ fileId, fields: 'name, mimeType' });

    const response = await driveWithAuth.files.get({ fileId, alt: 'media' }, { responseType: 'stream' });

    res.setHeader('Content-Type', meta.data.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${meta.data.name}"`);
    response.data.pipe(res);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/employee-images/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const client = await auth.getClient();
    const driveWithAuth = google.drive({ version: 'v3', auth: client });
    const meta = await driveWithAuth.files.get({ fileId, fields:'name, mimeType' });

    res.setHeader('Content-Type', meta.data.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${meta.data.name}"`);

    const response = await driveWithAuth.files.get({ fileId, alt: 'media' }, { responseType: 'stream' });
    response.data.pipe(res);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ----------------- Health -----------------
app.get('/api/health', (req, res) => res.json({ ok: true }));

// ----------------- Start server -----------------
app.listen(PORT, () => console.log(`Backend listening on ${PORT}`));
