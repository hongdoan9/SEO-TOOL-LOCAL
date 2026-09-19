import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../../..');

console.log('🔍 Checking Frontend ↔ Backend Route Compatibility...');

const serverJs = fs.readFileSync(path.join(rootDir, 'backend', 'server.js'), 'utf8');
const appJsx = fs.readFileSync(path.join(rootDir, 'frontend', 'src', 'App.jsx'), 'utf8');

// Simple pattern checks for route mismatches
const frontendEndpoints = [
  '/prep',
  '/create-assets',
  '/sync-drive',
  '/optimize-docs',
  '/optimize-pdf',
  '/optimize-sheet',
  '/translate-keys',
  '/create-lang-assets',
  '/optimize-lang-assets'
];

frontendEndpoints.forEach(ep => {
  const feHas = appJsx.includes(ep);
  const beHas = serverJs.includes(ep);
  if (feHas && !beHas) {
    console.log(`❌ Mismatch detected for endpoint segment: ${ep}`);
  } else if (feHas && beHas) {
    console.log(`✅ Endpoint segment present in both: ${ep}`);
  }
});
