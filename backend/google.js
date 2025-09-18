const { google } = require('googleapis');
require('dotenv').config();
const path = require('path');

const auth = new google.auth.GoogleAuth({
    keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    scopes: [
        'https://www.googleapis.com/auth/spreadsheets.readonly',
        'https://www.googleapis.com/auth/drive.readonly',
    ]
});

const sheets = google.sheets({ version: 'v4' })
const drive = google.drive({ version: 'v3' })

async function readSheet(sheedId, range) {
    const client = await auth.getClient();
    const res = await sheets.spreadsheets.values.get({
        spreadsheetId: sheedId,
        range,
        auth: client,
    });

    return res.data.values || []
}


async function listDriveMedia(folderId) {
    const client = await auth.getClient();
    const res = await drive.files.list({
        q: `'${folderId}' in parents and trashed=false`,
        fields: 'files(id, name, mimeType, webContentLink, webViewLink)',
        orderBy: 'name',
        pageSize: 100,
        auth: client,
    });

    return res.data.files.map(file => ({
        id: file.id,
        name: file.name,
        type: file.mimeType.startsWith('video') ? 'video' : 'image',
        url: file.webContentLink || file.webviewLink,
    }));
}

module.exports = { readSheet, listDriveMedia, auth, drive }