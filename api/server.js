// Local development server for testing the API
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Stream handler
app.get('/api/stream', async (req, res) => {
  try {
    const id = req.query.id;
    if (!id) {
      return res.status(400).send('Missing id');
    }

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return res.status(500).send('GOOGLE_API_KEY not configured');
    }

    const range = req.headers.range || undefined;

    console.log(`[API] Request for file ID: ${id}`);
    console.log(`[API] Range header: ${range || 'none'}`);

    // First, get file metadata using Google Drive API
    const metadataUrl = `https://www.googleapis.com/drive/v3/files/${id}?fields=id,name,mimeType,size&key=${apiKey}`;
    console.log(`[API] Fetching metadata from: ${metadataUrl}`);
    
    const metadataRes = await fetch(metadataUrl);
    
    if (!metadataRes.ok) {
      const errorText = await metadataRes.text();
      console.error('[API] Metadata fetch failed:', errorText);
      return res.status(metadataRes.status).json({ error: `File not found: ${errorText}` });
    }

    const metadata = await metadataRes.json();
    console.log('[API] File metadata:', metadata);
    
    // Get download URL for the file
    // For large files, we need to use the alt=media endpoint
    const downloadUrl = `https://www.googleapis.com/drive/v3/files/${id}?alt=media&key=${apiKey}`;

    // Prepare headers for the download request
    const downloadHeaders = {};
    if (range) {
      downloadHeaders["Range"] = range;
    }

    console.log(`[API] Fetching file from: ${downloadUrl}`);

    const fileRes = await fetch(downloadUrl, {
      headers: downloadHeaders,
    });

    if (!fileRes.ok) {
      const errorText = await fileRes.text();
      console.error('[API] Download failed:', errorText);
      return res.status(fileRes.status).json({ error: `Download failed: ${errorText}` });
    }

    // Set response headers
    const mimeType = metadata.mimeType || fileRes.headers.get("content-type") || "video/mp4";
    res.setHeader("Content-Type", mimeType);
    res.setHeader("Accept-Ranges", "bytes");
    
    // Handle content length
    const contentLength = fileRes.headers.get("content-length");
    if (contentLength) {
      res.setHeader("Content-Length", contentLength);
    }
    
    // Handle range responses
    if (range && fileRes.status === 206) {
      const contentRange = fileRes.headers.get("content-range");
      if (contentRange) {
        res.setHeader("Content-Range", contentRange);
      }
      res.status(206);
    } else {
      res.status(200);
    }

    // Stream the response body
    const reader = fileRes.body.getReader();
    
    const pump = async () => {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            res.end();
            break;
          }
          res.write(Buffer.from(value));
        }
      } catch (err) {
        console.error('[API] Stream error:', err);
        if (!res.headersSent) {
          res.status(500).end();
        }
      }
    };

    pump();
  } catch (err) {
    console.error('[API] Handler error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Error: " + String(err) });
    }
  }
});

app.listen(PORT, () => {
  console.log(`\n🚀 Local API server running on http://localhost:${PORT}`);
  console.log(`🔑 API Key configured: ${process.env.GOOGLE_API_KEY ? 'Yes ✓' : 'No ✗'}`);
  if (process.env.GOOGLE_API_KEY) {
    console.log(`   Key: ${process.env.GOOGLE_API_KEY.substring(0, 20)}...`);
  }
  console.log(`\n📝 Test endpoint: http://localhost:${PORT}/api/stream?id=YOUR_FILE_ID\n`);
});
