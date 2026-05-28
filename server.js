const express    = require('express');
const passport   = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const cookieSession = require('cookie-session');
const path       = require('path');
const { Firestore } = require('@google-cloud/firestore');

// ── Config ──
const ALLOWED_DOMAIN = 'actuaria.com';
const WRITE_EMAILS   = [
  'raimundo.frohlich@actuaria.com',
  'pablo.rueda@actuaria.com',
];
const PORT = process.env.PORT || 3000;

// ── Firestore ──
const db = new Firestore({
  projectId: process.env.FIRESTORE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT,
});
const STATE_REF = db.collection('planificacion').doc('state');

// ── Google OAuth strategy ──
passport.use(new GoogleStrategy(
  {
    clientID:     process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL:  process.env.OAUTH_CALLBACK_URL || '/auth/google/callback',
  },
  (accessToken, refreshToken, profile, done) => {
    const email = (profile.emails?.[0]?.value || '').toLowerCase();
    if (!email.endsWith('@' + ALLOWED_DOMAIN)) {
      return done(null, false, { message: 'Dominio no autorizado' });
    }
    done(null, {
      email,
      name: profile.displayName,
      avatar: profile.photos?.[0]?.value || null,
      canWrite: WRITE_EMAILS.includes(email),
    });
  }
));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

// ── Express app ──
const app = express();

app.use(cookieSession({
  name: 'actualab_session',
  keys: [process.env.SESSION_SECRET || 'actualab-dev-secret-2026'],
  maxAge: 8 * 60 * 60 * 1000, // 8 h
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
}));

// Compatibility shim for passport + cookie-session
app.use((req, res, next) => {
  if (req.session && !req.session.regenerate) {
    req.session.regenerate = (cb) => cb();
    req.session.save = (cb) => cb();
  }
  next();
});

app.use(passport.initialize());
app.use(passport.session());
app.use(express.json({ limit: '2mb' }));

// ── Auth middleware ──
function requireAuth(req, res, next) {
  if (req.isAuthenticated()) return next();
  if (req.path.startsWith('/api/')) {
    return res.status(401).json({ error: 'No autenticado', redirect: '/login' });
  }
  res.redirect('/login');
}

// ── Auth routes ──
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login?error=dominio' }),
  (req, res) => res.redirect('/')
);

app.get('/auth/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.redirect('/login');
  });
});

// ── Protected API ──
app.use(requireAuth);

app.get('/api/me', (req, res) => {
  res.json({
    email:    req.user.email,
    name:     req.user.name,
    avatar:   req.user.avatar,
    canWrite: req.user.canWrite,
  });
});

app.get('/api/data', async (req, res) => {
  try {
    const snap = await STATE_REF.get();
    res.json(snap.exists ? snap.data() : null);
  } catch (err) {
    console.error('Firestore read error:', err);
    res.status(500).json({ error: 'Error al cargar datos' });
  }
});

app.post('/api/data', async (req, res) => {
  if (!req.user.canWrite) {
    return res.status(403).json({ error: 'Sin permisos de escritura' });
  }
  try {
    const payload = { ...req.body, savedAt: new Date().toISOString() };
    await STATE_REF.set(payload);
    res.json({ ok: true, savedAt: payload.savedAt });
  } catch (err) {
    console.error('Firestore write error:', err);
    res.status(500).json({ error: 'Error al guardar datos' });
  }
});

// ── Static files (protected) ──
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
  console.log(`ActuaLab server running on port ${PORT}`);
});
