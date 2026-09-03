import express from 'express';
import { readData, writeData } from '../db.js';

const router = express.Router();
const COLLECTIONS_FILE = 'collections.json';

// GET all collections (public — sorted by order)
router.get('/', (req, res) => {
  let collections = readData(COLLECTIONS_FILE);
  if (!Array.isArray(collections)) collections = [];
  collections.sort((a, b) => (a.order || 0) - (b.order || 0));
  res.json({ success: true, count: collections.length, collections });
});

// PUT bulk-replace all collections (Admin)
router.put('/', (req, res) => {
  const { collections } = req.body;

  if (!Array.isArray(collections)) {
    return res.status(400).json({ success: false, error: 'collections must be an array' });
  }

  // Validate & normalize each collection
  const cleaned = collections.map((c, i) => ({
    id: c.id || `coll-${Date.now()}-${i}`,
    name: (c.name || '').trim(),
    description: (c.description || '').trim(),
    category: c.category || 'Oud',
    image: c.image || '',
    order: c.order !== undefined ? c.order : i + 1
  }));

  writeData(COLLECTIONS_FILE, cleaned);
  res.json({ success: true, count: cleaned.length, collections: cleaned });
});

export default router;
