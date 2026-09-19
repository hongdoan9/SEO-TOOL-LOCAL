import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '../seo_tool.db');

const db = new sqlite3.Database(dbPath);

db.all("SELECT id, main_key, drive_folder, pdf_results, optimize_results FROM google_stacks", [], (err, rows) => {
  if (err) {
    console.error(err);
    db.close();
    return;
  }
  console.log("=== DANH SÁCH GOOGLE STACKS ===");
  rows.forEach(row => {
    console.log(`ID: ${row.id} | Main Key: ${row.main_key}`);
    console.log(`Drive Folder: ${row.drive_folder}`);
    console.log(`Optimize Results: ${row.optimize_results ? row.optimize_results.substring(0, 100) + '...' : 'NULL'}`);
    console.log(`PDF Results: ${row.pdf_results ? row.pdf_results.substring(0, 100) + '...' : 'NULL'}`);
    console.log("-----------------------------------------");
  });
  db.close();
});
