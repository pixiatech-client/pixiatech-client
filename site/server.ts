import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

const DATA_DIR = path.join(process.cwd(), 'data');
const FILE_WP_CONTENT = path.join(DATA_DIR, 'product-wp-content.json');
const FILE_WP_SEED = path.join(DATA_DIR, 'product-wp.json');
const FILE_QUOTES = path.join(DATA_DIR, 'quotes.json');
const FILE_PIXELTECH_PAGES = path.join(DATA_DIR, 'pixel-tech-web-pages.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Function to read Pixel Tech Web pages
function getPixelTechPages() {
  try {
    if (fs.existsSync(FILE_PIXELTECH_PAGES)) {
      const raw = fs.readFileSync(FILE_PIXELTECH_PAGES, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error reading Pixel Tech Web pages:', err);
  }
  return { pages: {} };
}

// Function to write Pixel Tech Web pages
function savePixelTechPages(data: any) {
  try {
    fs.writeFileSync(FILE_PIXELTECH_PAGES, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing Pixel Tech Web pages:', err);
    return false;
  }
}

// Function to read current WP product data
function getProductWPData() {
  try {
    if (fs.existsSync(FILE_WP_CONTENT)) {
      const raw = fs.readFileSync(FILE_WP_CONTENT, 'utf-8');
      return JSON.parse(raw);
    }
    if (fs.existsSync(FILE_WP_SEED)) {
      const raw = fs.readFileSync(FILE_WP_SEED, 'utf-8');
      const data = JSON.parse(raw);
      fs.writeFileSync(FILE_WP_CONTENT, JSON.stringify(data, null, 2), 'utf-8');
      return data;
    }
  } catch (err) {
    console.error('Error reading product data file:', err);
  }
  return null;
}

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', product: 'PixiaTech WP Transparent LED', timestamp: new Date().toISOString() });
});

// GET /api/product/wp
app.get('/api/product/wp', (req, res) => {
  const data = getProductWPData();
  if (!data) {
    return res.status(500).json({ error: 'Données produit introuvables' });
  }
  res.json(data);
});

// PUT /api/product/wp
app.put('/api/product/wp', (req, res) => {
  try {
    const updatedData = req.body;
    if (!updatedData || typeof updatedData !== 'object') {
      return res.status(400).json({ error: 'Données invalides fournies' });
    }
    fs.writeFileSync(FILE_WP_CONTENT, JSON.stringify(updatedData, null, 2), 'utf-8');
    console.log('[API] Product WP configuration saved successfully');
    res.json({ success: true, message: 'Configuration enregistrée avec succès', timestamp: new Date().toISOString() });
  } catch (err: any) {
    console.error('Error saving product data:', err);
    res.status(500).json({ error: 'Erreur lors de la sauvegarde: ' + err.message });
  }
});

// POST /api/product/wp/reset
app.post('/api/product/wp/reset', (req, res) => {
  try {
    if (fs.existsSync(FILE_WP_SEED)) {
      const seedRaw = fs.readFileSync(FILE_WP_SEED, 'utf-8');
      fs.writeFileSync(FILE_WP_CONTENT, seedRaw, 'utf-8');
      console.log('[API] Product WP reset to factory defaults');
      return res.json({ success: true, message: 'Configuration réinitialisée aux valeurs d\'usine', data: JSON.parse(seedRaw) });
    }
    res.status(404).json({ error: 'Fichier usine seed introuvable' });
  } catch (err: any) {
    console.error('Error resetting product data:', err);
    res.status(500).json({ error: 'Erreur lors de la réinitialisation: ' + err.message });
  }
});

// POST /api/quote/request
app.post('/api/quote/request', (req, res) => {
  try {
    const quote = req.body;
    const quoteEntry = {
      id: 'DEVIS-WP-' + Date.now().toString(36).toUpperCase(),
      createdAt: new Date().toISOString(),
      ...quote
    };

    let quotes: any[] = [];
    if (fs.existsSync(FILE_QUOTES)) {
      try {
        quotes = JSON.parse(fs.readFileSync(FILE_QUOTES, 'utf-8'));
      } catch (e) {
        quotes = [];
      }
    }
    quotes.unshift(quoteEntry);
    fs.writeFileSync(FILE_QUOTES, JSON.stringify(quotes, null, 2), 'utf-8');

    console.log('[API] New Quote Request registered:', quoteEntry.id);
    res.json({ 
      success: true, 
      quoteId: quoteEntry.id, 
      message: 'Votre demande de devis sur-mesure a été enregistrée. Un ingénieur commercial PixiaTech vous contactera sous 2 heures.' 
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Erreur lors de l\'enregistrement du devis: ' + err.message });
  }
});

// =========================================================================
// PIXEL TECH WEB - BACKEND CMS & PAGES API
// =========================================================================

// Status check for Pixel Tech Web backend
app.get('/api/pixel-tech-web/status', (req, res) => {
  res.json({
    status: 'connected',
    backend: 'Pixel Tech Web',
    version: '2.4.0',
    capabilities: ['pages', 'products', 'settings', 'media_upload', 'elementor_live_edit'],
    timestamp: new Date().toISOString()
  });
});

// GET all pages
app.get('/api/pixel-tech-web/pages', (req, res) => {
  const db = getPixelTechPages();
  res.json({
    success: true,
    pages: db.pages || {},
    count: Object.keys(db.pages || {}).length,
    timestamp: new Date().toISOString()
  });
});

// GET settings (Pixel Tech Web parameters, contacts, company branding)
app.get('/api/pixel-tech-web/settings', (req, res) => {
  const db = getPixelTechPages();
  const defaultSettings = {
    companyName: "PIXIATECH",
    tagline: "SCIENCE BEHIND THE LED",
    email: "contact@pixiatech.com",
    phone: "+33 (0)1 42 68 55 00",
    address: "14 Avenue des Champs-Élysées, 75008 Paris, France",
    primaryColor: "#C3F910",
    darkBackground: "#080808",
  };
  res.json({
    success: true,
    settings: db.settings || defaultSettings,
  });
});

// PUT settings
app.put('/api/pixel-tech-web/settings', (req, res) => {
  const updatedSettings = req.body;
  const db = getPixelTechPages();
  db.settings = {
    ...(db.settings || {}),
    ...updatedSettings,
  };
  const saved = savePixelTechPages(db);
  if (!saved) {
    return res.status(500).json({ error: 'Erreur lors de la sauvegarde des paramètres' });
  }
  console.log('[Pixel Tech Web] Settings updated');
  res.json({
    success: true,
    message: 'Paramètres Pixel Tech Web mis à jour avec succès',
    settings: db.settings,
  });
});

// POST reset to seed
app.post('/api/pixel-tech-web/reset', (req, res) => {
  try {
    const db = getPixelTechPages();
    savePixelTechPages(db);
    res.json({
      success: true,
      message: 'Base de données réinitialisée aux valeurs par défaut',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET single page
app.get('/api/pixel-tech-web/pages/:id', (req, res) => {
  const { id } = req.params;
  const db = getPixelTechPages();
  const page = db.pages ? db.pages[id] : null;
  if (!page) {
    return res.status(404).json({ error: `Page '${id}' introuvable dans Pixel Tech Web` });
  }
  res.json({ success: true, page });
});

// PUT / UPDATE single page
app.put('/api/pixel-tech-web/pages/:id', (req, res) => {
  const { id } = req.params;
  const updatedPageData = req.body;
  if (!updatedPageData || typeof updatedPageData !== 'object') {
    return res.status(400).json({ error: 'Corps de requête invalide' });
  }

  const db = getPixelTechPages();
  if (!db.pages) db.pages = {};
  
  db.pages[id] = {
    ...db.pages[id],
    ...updatedPageData,
    id,
    updatedAt: new Date().toISOString()
  };

  const saved = savePixelTechPages(db);
  if (!saved) {
    return res.status(500).json({ error: 'Erreur lors de la sauvegarde sur le serveur' });
  }

  console.log(`[Pixel Tech Web] Page '${id}' updated successfully`);
  res.json({
    success: true,
    message: `Page '${id}' synchronisée avec succès dans Pixel Tech Web`,
    page: db.pages[id]
  });
});

// POST / Image Upload (Elementor style)
app.post('/api/pixel-tech-web/upload', (req, res) => {
  try {
    const { image, filename } = req.body;
    if (!image) {
      return res.status(400).json({ error: 'Image manquante' });
    }

    const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'cms');
    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }

    // Handle base64 data URL
    const matches = image.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
    if (matches && matches.length === 3) {
      const ext = matches[1].split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';
      const safeName = (filename ? filename.replace(/[^a-zA-Z0-9.-]/g, '_') : `upload_${Date.now()}`) + `.${ext}`;
      const filePath = path.join(UPLOAD_DIR, safeName);
      const buffer = Buffer.from(matches[2], 'base64');
      fs.writeFileSync(filePath, buffer);

      const publicUrl = `/uploads/cms/${safeName}`;
      console.log('[Pixel Tech Web] New media uploaded:', publicUrl);
      return res.json({
        success: true,
        url: publicUrl,
        filename: safeName,
        size: buffer.length
      });
    }

    res.json({ success: true, url: image });
  } catch (err: any) {
    console.error('Error handling upload:', err);
    res.status(500).json({ error: 'Erreur lors du traitement du fichier: ' + err.message });
  }
});

// Vite middleware / Static files
async function setupServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[PixiaTech Server] Running on http://0.0.0.0:${PORT}`);
  });
}

setupServer().catch((err) => {
  console.error('Failed to start server:', err);
});
