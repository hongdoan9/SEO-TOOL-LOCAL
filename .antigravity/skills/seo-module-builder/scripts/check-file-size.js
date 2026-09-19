import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../../..');

const MAX_LINES = 300;
let warnings = [];

function checkDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) return;
  const items = fs.readdirSync(dirPath);

  for (const item of items) {
    if (item === 'node_modules' || item === 'dist' || item === '.git' || item === 'uploads') continue;
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      checkDirectory(fullPath);
    } else if (item.endsWith('.js') || item.endsWith('.jsx')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const lineCount = content.split('\n').length;
      if (lineCount > MAX_LINES) {
        const relativePath = path.relative(rootDir, fullPath);
        warnings.push({ path: relativePath, lines: lineCount });
      }
    }
  }
}

console.log('🔍 Đang kiểm tra dung lượng file (giới hạn <= 300 dòng)...');
checkDirectory(path.join(rootDir, 'frontend', 'src'));
checkDirectory(path.join(rootDir, 'backend'));

if (warnings.length > 0) {
  console.log(`⚠️  Phát hiện ${warnings.length} file vượt quá ${MAX_LINES} dòng:`);
  warnings.forEach(w => {
    console.log(`   - 🔴 ${w.path}: ${w.lines} dòng (Cần tách nhỏ!)`);
  });
} else {
  console.log('✅  Tất cả các file đều tuân thủ giới hạn <= 300 dòng code!');
}
