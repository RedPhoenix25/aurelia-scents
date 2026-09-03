import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { isSupabaseConfigured, fetchFromSupabase, saveToSupabase, ensureStorageBucket } from './supabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');

// Ensure local data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-memory synchronized cache
const memoryCache = {};

// Helper to read raw local JSON file
function readLocalFile(filename) {
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) {
    return filename === 'settings.json' ? {} : [];
  }
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Error reading local ${filename}:`, err);
    return filename === 'settings.json' ? {} : [];
  }
}

// Helper to write local JSON file
function writeLocalFile(filename, data) {
  const filePath = path.join(DATA_DIR, filename);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error(`Error writing local ${filename}:`, err);
    return false;
  }
}

/**
 * Initialize database and sync with Supabase cloud
 */
export async function initDb() {
  const files = ['products.json', 'collections.json', 'orders.json', 'settings.json'];

  // Load initial state from local files first
  for (const file of files) {
    memoryCache[file] = readLocalFile(file);
  }

  if (isSupabaseConfigured) {
    console.log('⚡ Connecting to Supabase Cloud Database & Storage...');
    try {
      await ensureStorageBucket('perfume-images');

      for (const file of files) {
        const key = file.replace('.json', '');
        const cloudData = await fetchFromSupabase(key);

        if (cloudData !== null && cloudData !== undefined) {
          // Supabase has saved data -> sync to memory cache and local mirror
          memoryCache[file] = cloudData;
          writeLocalFile(file, cloudData);
          console.log(`✅ Loaded ${key} from Supabase (${Array.isArray(cloudData) ? cloudData.length + ' items' : 'ready'})`);
        } else {
          // Supabase is empty for this key -> seed it from local data
          const localData = memoryCache[file];
          await saveToSupabase(key, localData);
          console.log(`🌱 Seeded ${key} to Supabase`);
        }
      }
      console.log('✨ Supabase Cloud Persistence active!');
    } catch (err) {
      console.error('⚠️ Supabase sync error, using local fallback:', err.message);
    }
  } else {
    console.log('📁 Supabase not configured, using local file storage.');
  }
}

/**
 * Synchronously read data (returns from live synchronized cache)
 */
export function readData(filename) {
  if (memoryCache[filename] !== undefined) {
    return memoryCache[filename];
  }
  const data = readLocalFile(filename);
  memoryCache[filename] = data;
  return data;
}

/**
 * Write data (updates cache, updates local mirror, and pushes to Supabase)
 */
export function writeData(filename, data) {
  memoryCache[filename] = data;
  writeLocalFile(filename, data);

  if (isSupabaseConfigured) {
    const key = filename.replace('.json', '');
    saveToSupabase(key, data).catch(err => {
      console.error(`Failed to push ${key} to Supabase:`, err);
    });
  }

  return true;
}
