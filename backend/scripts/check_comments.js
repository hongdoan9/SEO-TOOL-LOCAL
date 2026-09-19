import sqlite3 from 'sqlite3';
import { google } from 'googleapis';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '../seo_tool.db');

const db = new sqlite3.Database(dbPath);

const queryGet = (sql, params = []) => new Promise((resolve, reject) => {
  db.get(sql, params, (err, row) => err ? reject(err) : resolve(row));
});

async function main() {
  try {
    const stack = await queryGet('SELECT * FROM google_stacks WHERE id = 1');
    if (!stack) {
      console.log("Không tìm thấy stack ID 1");
      return;
    }

    const settingsRows = await new Promise((resolve, reject) => {
      db.all('SELECT key, value FROM settings WHERE project_id = ?', [stack.project_id], (err, rows) => {
        err ? reject(err) : resolve(rows);
      });
    });

    const settings = {};
    settingsRows.forEach(r => { settings[r.key] = r.value; });

    const oauth2Client = new google.auth.OAuth2(
      settings.google_client_id,
      settings.google_client_secret
    );
    
    const tokens = {
      access_token: settings.google_access_token,
      refresh_token: settings.google_refresh_token,
      expiry_date: parseInt(settings.google_token_expiry)
    };
    oauth2Client.setCredentials(tokens);

    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    const pdfResults = JSON.parse(stack.pdf_results || '[]');
    console.log("=== DANH SÁCH FILE PDF VÀ COMMENTS ===");
    for (const file of pdfResults) {
      console.log(`\nKey: ${file.keyField} | File ID: ${file.pdfFileId} | Title: ${file.title}`);
      if (!file.pdfFileId) {
        console.log("-> File này chưa được tạo hoặc không có ID");
        continue;
      }

      try {
        const res = await drive.comments.list({
          fileId: file.pdfFileId,
          fields: 'comments(id, content, author(displayName), createdTime)'
        });
        const comments = res.data.comments || [];
        console.log(`-> Tìm thấy ${comments.length} bình luận trên Google Drive:`);
        comments.forEach((c, i) => {
          console.log(`   [Bình luận ${i + 1}] ID: ${c.id}`);
          console.log(`   Tác giả: ${c.author?.displayName || 'Unknown'}`);
          console.log(`   Ngày tạo: ${c.createdTime}`);
          console.log(`   Nội dung:\n${c.content}`);
          console.log("   -----------------------------------");
        });
      } catch (err) {
        console.error(`-> Lỗi khi list comment cho file ${file.pdfFileId}:`, err.message);
      }
    }
  } catch (err) {
    console.error("Lỗi chính:", err);
  } finally {
    db.close();
  }
}

main();
