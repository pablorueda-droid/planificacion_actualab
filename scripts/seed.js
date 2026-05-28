/**
 * seed.js — Carga el estado inicial de planificación en Firestore.
 *
 * Uso:
 *   FIRESTORE_PROJECT_ID=tu-proyecto node scripts/seed.js path/al/archivo.json
 *
 * Requiere:
 *   - GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
 *     (o autenticación ADC activa: gcloud auth application-default login)
 *   - FIRESTORE_PROJECT_ID=tu-proyecto-gcp
 */

const { Firestore } = require('@google-cloud/firestore');
const fs = require('fs');
const path = require('path');

const jsonPath = process.argv[2];
if (!jsonPath) {
  console.error('Uso: node scripts/seed.js <ruta-al-json>');
  process.exit(1);
}

const projectId = process.env.FIRESTORE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT;
if (!projectId) {
  console.error('ERROR: Define FIRESTORE_PROJECT_ID o GOOGLE_CLOUD_PROJECT');
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(path.resolve(jsonPath), 'utf-8'));
// Strip export metadata, keep only planning fields
const { _app, _version, _exportedAt, ...payload } = data;
payload.savedAt = new Date().toISOString();
payload.seededAt = payload.savedAt;

const db = new Firestore({ projectId });

(async () => {
  try {
    await db.collection('planificacion').doc('state').set(payload);
    console.log(`✓ Datos cargados en Firestore (proyecto: ${projectId})`);
    console.log(`  Proyectos: ${Object.keys(payload.assignments || {}).length}`);
    console.log(`  Encargados: ${Object.keys(payload.projectLeads || {}).length}`);
  } catch (err) {
    console.error('✗ Error:', err.message);
    process.exit(1);
  }
})();
