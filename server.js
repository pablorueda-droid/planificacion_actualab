const express = require('express');
const basicAuth = require('express-basic-auth');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Basic authentication
app.use(basicAuth({
  users: {
    'pablo': 'actuaria2026'
  },
  challenge: true,
  realm: 'ActuaLab',
  unauthorizedResponse: () => 'Acceso no autorizado.'
}));

// Serve the HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve static files from public folder
app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
  console.log(`ActuaLab server running on port ${PORT}`);
});
