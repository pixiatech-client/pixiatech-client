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

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
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
