import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import productsRouter from './routes/products.js';
import ordersRouter from './routes/orders.js';
import settingsRouter from './routes/settings.js';
import adminRouter from './routes/admin.js';
import collectionsRouter from './routes/collections.js';

import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure public/uploads directory exists
const uploadsDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Serve static frontend assets
app.use(express.static(path.join(__dirname, '../public')));

// Image Upload Endpoint (Direct device upload)
app.post('/api/upload', (req, res) => {
  const { imageBase64 } = req.body;
  if (!imageBase64) {
    return res.status(400).json({ success: false, error: 'No image data provided' });
  }

  try {
    const matches = imageBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ success: false, error: 'Invalid base64 image format' });
    }

    const mimeType = matches[1];
    const buffer = Buffer.from(matches[2], 'base64');
    let ext = mimeType.split('/')[1] || 'jpg';
    if (ext === 'jpeg') ext = 'jpg';
    ext = ext.replace(/[^a-z0-9]/gi, '');

    const filename = `perfume_${Date.now()}_${Math.floor(Math.random() * 1000)}.${ext}`;
    const filePath = path.join(uploadsDir, filename);

    fs.writeFileSync(filePath, buffer);
    const imageUrl = `/uploads/${filename}`;

    res.json({ success: true, imageUrl });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ success: false, error: 'Failed to process image upload' });
  }
});

// API Routes
app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/collections', collectionsRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString(), brand: 'Aurelia Scents' });
});

// Fallback to index.html for SPA-like navigation
app.get('*', (req, res) => {
  if (req.path.startsWith('/admin')) {
    res.sendFile(path.join(__dirname, '../public/admin.html'));
  } else {
    res.sendFile(path.join(__dirname, '../public/index.html'));
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`✨ Aurelia Scents Server running on http://localhost:${PORT}`);
  console.log(`👑 Mobile Storefront: http://localhost:${PORT}`);
  console.log(`📦 Admin Dashboard:  http://localhost:${PORT}/admin.html`);
});
