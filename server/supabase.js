import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env manually if process.env doesn't have it (zero dependency)
function loadEnv() {
  const envPath = path.join(__dirname, '../.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    content.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    });
  }
}
loadEnv();

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_KEY || '';

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY);

const headers = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json'
};

/**
 * Ensures the public storage bucket exists for perfume images
 */
export async function ensureStorageBucket(bucketName = 'perfume-images') {
  if (!isSupabaseConfigured) return;
  try {
    const res = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        id: bucketName,
        name: bucketName,
        public: true,
        file_size_limit: 15728640 // 15MB
      })
    });
    // 200 OK or 409 Conflict (already exists) are both fine
    if (res.ok || res.status === 409 || res.status === 400) {
      // Bucket is ready
    }
  } catch (err) {
    console.warn('Note on Supabase bucket creation:', err.message);
  }
}

/**
 * Upload an image buffer directly to Supabase Storage and return the public CDN URL
 */
export async function uploadImageToSupabase(filename, buffer, mimeType = 'image/jpeg', bucketName = 'perfume-images') {
  if (!isSupabaseConfigured) return null;

  try {
    const cleanFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${bucketName}/${cleanFilename}`;

    const res = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': mimeType,
        'x-upsert': 'true'
      },
      body: buffer
    });

    if (res.ok) {
      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${bucketName}/${cleanFilename}`;
      return publicUrl;
    } else {
      const errText = await res.text();
      console.error('Supabase image upload failed:', res.status, errText);
      return null;
    }
  } catch (err) {
    console.error('Supabase image upload error:', err);
    return null;
  }
}

/**
 * Read data document from Supabase `store_data` table
 */
export async function fetchFromSupabase(key) {
  if (!isSupabaseConfigured) return null;

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/store_data?key=eq.${encodeURIComponent(key)}&select=*`, {
      method: 'GET',
      headers
    });

    if (res.ok) {
      const rows = await res.json();
      if (Array.isArray(rows) && rows.length > 0) {
        return rows[0].data;
      }
    } else {
      const errText = await res.text();
      console.warn(`Supabase fetch failed for ${key}:`, errText);
    }
  } catch (err) {
    console.warn(`Supabase fetch error for ${key}:`, err.message);
  }
  return null;
}

/**
 * Save data document to Supabase `store_data` table (upsert)
 */
export async function saveToSupabase(key, data) {
  if (!isSupabaseConfigured) return false;

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/store_data`, {
      method: 'POST',
      headers: {
        ...headers,
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify({
        key,
        data,
        updated_at: new Date().toISOString()
      })
    });

    if (res.ok) {
      return true;
    } else {
      const errText = await res.text();
      console.error(`Supabase save error for ${key}:`, errText);
      return false;
    }
  } catch (err) {
    console.error(`Supabase save error for ${key}:`, err.message);
    return false;
  }
}
