import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const UPSTREAM_BASE = 'https://yesofficer.studybeepro.site';

// CORS & Security headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Range');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Cache batches in memory for lightning fast loads
let cachedBatches: any = null;
const batchesPath = path.join(__dirname, 'public', 'batches.json');
if (fs.existsSync(batchesPath)) {
  try {
    cachedBatches = JSON.parse(fs.readFileSync(batchesPath, 'utf-8'));
  } catch (e) {
    console.error('Error reading local batches.json:', e);
  }
}

// Endpoint: batches.json
app.get('/batches.json', (req: Request, res: Response) => {
  if (cachedBatches) {
    return res.json(cachedBatches);
  }
  const filePath = path.join(__dirname, 'public', 'batches.json');
  if (fs.existsSync(filePath)) {
    return res.sendFile(filePath);
  }
  res.status(404).json({ error: 'Batches not found' });
});

app.get('/api/batches', (req: Request, res: Response) => {
  if (cachedBatches) {
    return res.json(cachedBatches);
  }
  res.status(404).json({ error: 'Batches not found' });
});

// Endpoint: folder contents proxy
app.get('/get/folder_contentsv3', async (req: Request, res: Response) => {
  try {
    const courseId = req.query.course_id as string;
    const parentId = (req.query.parent_id as string) || '-1';
    const start = (req.query.start as string) || '0';

    if (!courseId) {
      return res.status(400).json({ status: 400, message: 'course_id is required' });
    }

    const upstreamUrl = `${UPSTREAM_BASE}/get/folder_contentsv3?course_id=${encodeURIComponent(courseId)}&parent_id=${encodeURIComponent(parentId)}&start=${encodeURIComponent(start)}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const upstreamRes = await fetch(upstreamUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Referer': UPSTREAM_BASE,
      },
    });
    clearTimeout(timeout);

    if (!upstreamRes.ok) {
      return res.status(upstreamRes.status).json({
        status: upstreamRes.status,
        message: `Upstream error: ${upstreamRes.statusText}`,
      });
    }

    const data = await upstreamRes.json();
    return res.json(data);
  } catch (error: any) {
    console.error('Error in /get/folder_contentsv3 proxy:', error);
    res.status(500).json({
      status: 500,
      message: error?.message || 'Failed to fetch folder contents',
    });
  }
});

// Endpoint: video details proxy
app.get('/get/fetchVideoDetailsById', async (req: Request, res: Response) => {
  try {
    const courseId = req.query.course_id as string;
    const videoId = req.query.video_id as string;

    if (!courseId || !videoId) {
      return res.status(400).json({ success: false, error: 'course_id and video_id are required' });
    }

    const upstreamUrl = `${UPSTREAM_BASE}/get/fetchVideoDetailsById?course_id=${encodeURIComponent(courseId)}&video_id=${encodeURIComponent(videoId)}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const upstreamRes = await fetch(upstreamUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Referer': UPSTREAM_BASE,
      },
    });
    clearTimeout(timeout);

    if (!upstreamRes.ok) {
      return res.status(upstreamRes.status).json({
        success: false,
        error: `Upstream video details error: ${upstreamRes.statusText}`,
      });
    }

    const data = await upstreamRes.json();
    return res.json(data);
  } catch (error: any) {
    console.error('Error in /get/fetchVideoDetailsById proxy:', error);
    res.status(500).json({
      success: false,
      error: error?.message || 'Failed to fetch video details',
    });
  }
});

// Endpoint: video & HLS stream proxy
app.get('/video', async (req: Request, res: Response) => {
  try {
    const targetUrl = req.query.url as string;
    if (!targetUrl) {
      return res.status(400).send('Missing url parameter');
    }

    // Proxy through upstream video endpoint which signs and resolves segments
    const proxyUrl = `${UPSTREAM_BASE}/video?url=${encodeURIComponent(targetUrl)}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    const upstreamRes = await fetch(proxyUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Referer': UPSTREAM_BASE,
      },
    });
    clearTimeout(timeout);

    if (!upstreamRes.ok) {
      // Fallback: try fetching targetUrl directly if upstream returned error
      try {
        const directRes = await fetch(targetUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            'Accept': '*/*',
          },
        });
        if (directRes.ok) {
          const contentType = directRes.headers.get('content-type') || 'video/mp2t';
          res.setHeader('Content-Type', contentType);
          const buf = await directRes.arrayBuffer();
          return res.send(Buffer.from(buf));
        }
      } catch (e) {
        // ignore direct fallback error
      }
      return res.status(upstreamRes.status).send(`Upstream video stream error: ${upstreamRes.status}`);
    }

    const contentType = upstreamRes.headers.get('content-type') || 'application/vnd.apple.mpegurl';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Access-Control-Allow-Origin', '*');

    // If it's a playlist (.m3u8), we send text
    if (contentType.includes('mpegurl') || targetUrl.includes('.m3u8')) {
      const text = await upstreamRes.text();
      return res.send(text);
    }

    // Binary TS segment
    const arrayBuffer = await upstreamRes.arrayBuffer();
    return res.send(Buffer.from(arrayBuffer));
  } catch (error: any) {
    console.error('Error in /video proxy:', error);
    res.status(500).send(error?.message || 'Video stream proxy error');
  }
});

// Endpoint: PDF proxy
app.get('/pdf', async (req: Request, res: Response) => {
  try {
    const pdfUrl = req.query.url as string;
    if (!pdfUrl) {
      return res.status(400).send('Missing url parameter');
    }

    // First try upstream /pdf endpoint
    const upstreamUrl = `${UPSTREAM_BASE}/pdf?url=${encodeURIComponent(pdfUrl)}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    const upstreamRes = await fetch(upstreamUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': UPSTREAM_BASE,
      },
    });
    clearTimeout(timeout);

    if (upstreamRes.ok) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline; filename="GB_STUDY_Notes.pdf"');
      res.setHeader('Access-Control-Allow-Origin', '*');
      const arrayBuffer = await upstreamRes.arrayBuffer();
      return res.send(Buffer.from(arrayBuffer));
    }

    // Fallback: fetch raw pdf directly
    const directRes = await fetch(pdfUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
    });

    if (directRes.ok) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline; filename="GB_STUDY_Notes.pdf"');
      res.setHeader('Access-Control-Allow-Origin', '*');
      const arrayBuffer = await directRes.arrayBuffer();
      return res.send(Buffer.from(arrayBuffer));
    }

    return res.status(404).send('PDF not found or could not be loaded');
  } catch (error: any) {
    console.error('Error in /pdf proxy:', error);
    res.status(500).send(error?.message || 'Failed to fetch PDF');
  }
});

// Endpoint: MPD proxy
app.get('/mpd', async (req: Request, res: Response) => {
  try {
    const targetUrl = req.query.url as string;
    if (!targetUrl) return res.status(400).send('Missing url');

    const upstreamUrl = `${UPSTREAM_BASE}/mpd?url=${encodeURIComponent(targetUrl)}`;
    const upstreamRes = await fetch(upstreamUrl, {
      headers: { 'Referer': UPSTREAM_BASE },
    });
    const text = await upstreamRes.text();
    res.setHeader('Content-Type', 'application/dash+xml');
    res.send(text);
  } catch (error: any) {
    res.status(500).send(error?.message || 'MPD proxy error');
  }
});

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`GB STUDY server listening on port ${PORT} (isProduction: ${isProduction})`);
  });
}

startServer();
