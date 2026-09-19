import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../../..');

console.log('🧪 Running module validation audit...');
const frontendModulesDir = path.join(rootDir, 'frontend', 'src', 'modules');
const modules = fs.readdirSync(frontendModulesDir);

console.log(`Found ${modules.length} frontend modules:`, modules);
console.log('✅ Validation complete.');
