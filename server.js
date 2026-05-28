const express = require('express');
const basicAuth = require('express-basic-auth');
const path = require('path');
const { Firestore } = require('@google-cloud/firestore');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Firestore client ──
// On Cloud Run uses Application Default Credentials automatically.
// Locally: set GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
const db = new Firestore({
  projectId: process.env.FIRESTORE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT,
});
const STATE_REF = db.collection('planificacion').doc('state');

// ── Basic authentication ──
app.use(basicAuth({
  users: {
    'equipo_TI': '@ctuar!a3223',
    'emi.donoso': '@ctuariA123'
  },
  challenge: true,
  realm: 'ActuaLab',
  unauthorizedResponse: () => 'Acceso no autorizado.'
}));

app.use(express.json({ limit: '2mb' }));

// ── User identity endpoint ──
app.get('/api/me', (req, res) => {
  res.json({ user: req.auth.user });
});

// ── GET /api/data — load planning state from Firestore ──
app.get('/api/data', async (req, res) => {
  try {
    const snap = await STATE_REF.get();
    if (!snap.exists) {
      return res.json(null); // frontend uses defaults on null
    }
    res.json(snap.data());
  } catch (err) {
    console.error('Error reading Firestore:', err);
    res.status(500).json({ error: 'Error al cargar datos' });
  }
});

// ── POST /api/data — save planning state to Firestore ──
app.post('/api/data', async (req, res) => {
  // Only equipo_TI can write
  if (req.auth.user !== 'equipo_TI') {
    return res.status(403).json({ error: 'Sin permisos de escritura' });
  }
  try {
    const payload = { ...req.body, savedAt: new Date().toISOString() };
    await STATE_REF.set(payload);
    res.json({ ok: true, savedAt: payload.savedAt });
  } catch (err) {
    console.error('Error writing Firestore:', err);
    res.status(500).json({ error: 'Error al guardar datos' });
  }
});

// ── Static files ──
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
  console.log(`ActuaLab server running on port ${PORT}`);
});
