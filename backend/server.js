const express = require('express');
const cors = require('cors')
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static')
const ffprobePath = require('ffprobe-static').path;
const { readSheet, listDriveMedia, auth, drive } = require('./google');
const { google } = require('googleapis')
const { error } = require('console');
require('dotenv').config(); 


const app = express()
const PORT = process.env.PORT || 3001;
const baseUrl = process.env.BACKEND_URL //|| `http://localhost:${PORT}`;
ffmpeg.setFfmpegPath(ffmpegPath)
ffmpeg.setFfprobePath(ffprobePath);

app.use(cors());
app.use(express.json());


//cache
const cache = {}
const CACHE_TTL = parseInt(process.env.CACHE_TTL_SECONDS || '60', 10)

function setCache(key, value){
    cache[key] = { value, ts: Date.now() };
}

function getCache(key){
    const item = cache[key];
    if (!item){
        return null
    }
    if (Date.now() - item.ts > CACHE_TTL * 1000){
        delete cache[key];
        return null;
    }
    return item.value
}

//GET details from business sheet
app.get('/api/business-news', async (req, res) => {
    try {
        const cached = getCache('business-news');
        if (cached) {
            return res.json(cached);
        }

        const rows = await readSheet(process.env.SHEET_ID_BUSINESS, process.env.SHEET_RANGE_BUSINESS);
        setCache('business-news', rows);
        res.json(rows);
    } catch (err) {
        console.error('business-news error', err);
        res.status(500).json({error: err.message});
    }
});

//GET details from corp sheet
app.get('/api/corp-news', async (req, res) => {
    try {
        const cached = getCache('corp-news');
        if (cached) {
            return res.json(cached)
        }

        const rows = await readSheet(process.env.SHEET_ID_CORP, process.env.SHEET_RANGE_CORP);
        setCache('corp-news', rows);
        res.json(rows);
    } catch (err){
        console.error('corp-news error', err);
        res.status(500).json({ error: err.message })
    }
});

//GET details from employees sheet
app.get('/api/employees', async (req, res) => {
  try {
    const cached = getCache('employees');
    if (cached) {
      return res.json(cached);
    }

    const rows = await readSheet(process.env.EMPLOYEE_SHEET_ID, process.env.SHEET_RANGE_EMPLOYEE);
    const files = await listDriveMedia(process.env.EMPLOYEE_IMAGE_FOLDER_ID);

    const imageMap = {};
    files.forEach(f => {
      if (f.type === 'image') {
        imageMap[f.id] = `${baseUrl}/api/employee-images/${f.id}`;
      }
    });

    const merged = rows.map((row, index) => {
      if (index === 0) return row; // header row

      let imageId = null;
      const url = row[2];

      // Try to extract fileId if it's a Google Drive link
      const match = url.match(/\/d\/([a-zA-Z0-9_-]+)\//);
      if (match && match[1]) {
        imageId = match[1];
      }

      return [
        row[0], // Employee name
        row[1], // Employee detail
        imageId ? (imageMap[imageId] || `${baseUrl}/api/employee-images/${imageId}`) : url
      ];
    });

    setCache('employees', merged);
    res.json(merged);
  } catch (err) {
    console.error('employee error', err);
    res.status(500).json({ error: err.message });
  }
});


//GET details from event sheet
app.get('/api/event-details', async (req, res) => {
    try {
        const cached = getCache('event-details');
        if (cached) {
            return res.json(cached)
        }

        const rows = await readSheet(process.env.SHEET_ID_EVENT, process.env.SHEET_RANGE_EVENT);
        setCache('event-details', rows);
        res.json(rows);
    } catch (err){ 
        console.error('event-detail error', err);
        res.status(500).json({ error: err.message })
    }
});

//list media
app.get('/api/event-media', async (req, res) => {
  try {
    const cached = getCache('event-media');
    if (cached) return res.json(cached);

    const files = await listDriveMedia(process.env.DRIVE_FOLDER_ID_EVENTS);

    const enriched = await Promise.all(
      files.map(async (file) => {
        let durationSeconds = 10; 

        if (file.type === 'video') {
          try {
            const client = await auth.getClient();
            const driveWithAuth = google.drive({ version: 'v3', auth: client });

            const streamResponse = await driveWithAuth.files.get(
              { fileId: file.id, alt: 'media' },
              { responseType: 'stream' }
            );

            durationSeconds = await new Promise((resolve, reject) => {
              ffmpeg(streamResponse.data).ffprobe((err, metadata) => {
                if (err) return reject(err);
                resolve(metadata.format.duration + 2); 
              });
            });
          } catch (err) {
            console.error('Error getting video duration for', file.name, err);
            durationSeconds = 60;
          }
        }

        return {
          ...file,
          url: `${baseUrl}/api/event-media/${file.id}`,
          durationSeconds,
        };
      })
    );

    setCache('event-media', enriched);
    res.json(enriched);
  } catch (err) {
    console.error('event-media error', err);
    res.status(500).json({ error: err.message });
  }
});

//stream media
app.get('/api/event-media/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;

    
    const client = await auth.getClient();
    const driveWithAuth = google.drive({ version: 'v3', auth: client });

    
    const meta = await driveWithAuth.files.get({
      fileId,
      fields: 'name, mimeType',
    });

   
    const response = await driveWithAuth.files.get(
      { fileId, alt: 'media' },
      { responseType: 'stream' }
    );

    res.setHeader('Content-Type', meta.data.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${meta.data.name}"`);
    response.data.pipe(res);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

//stream image
app.get('/api/employee-images/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const client = await auth.getClient();
    const driveWithAuth = google.drive({ version: 'v3', auth: client });

    const meta = await driveWithAuth.files.get({
      fileId,
      fields:'name, mimeType'
    });

    res.setHeader('Content-Type', meta.data.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${meta.data.name}"`);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('ETag', fileId + '-' + new Date(meta.data.modifiedTime).getTime());

    const response = await driveWithAuth.files.get(
      { fileId, alt: 'media' },
      { responseType: 'stream' }
    );

    response.data.pipe(res)

  } catch (err) {
    console.error('employee image stream error', err);
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/health', (req, res) => res.json({ ok: true }));


app.listen(PORT, () => {
    console.log(`Backend listening on ${PORT}`);
    
})