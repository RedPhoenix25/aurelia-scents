import express from 'express';
import { readData, writeData } from '../db.js';

const router = express.Router();
const SETTINGS_FILE = 'settings.json';

// GET settings
router.get('/', (req, res) => {
  const settings = readData(SETTINGS_FILE);
  res.json({ success: true, settings });
});

// PUT update settings (Admin)
router.put('/', (req, res) => {
  const current = readData(SETTINGS_FILE);
  const updated = {
    ...current,
    ...req.body
  };

  writeData(SETTINGS_FILE, updated);
  res.json({ success: true, settings: updated });
});

export default router;
