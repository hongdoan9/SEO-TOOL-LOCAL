import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { query } from './db.js';
import { google } from 'googleapis';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import multer from 'multer';
import JSZip from 'jszip';
import { Readable } from 'stream';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Cấu hình multer lưu tạm thời
const tempUploadDir = path.join(__dirname, 'uploads', 'temp');
if (!fs.existsSync(tempUploadDir)) {
  fs.mkdirSync(tempUploadDir, { recursive: true });
}
const upload = multer({ dest: tempUploadDir });

// API: Lấy danh sách Users (Tượng trưng)
app.get('/api/users', async (req, res) => {
  try {
    const users = await query.all('SELECT * FROM users');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Tạo User mới (Tượng trưng)
app.post('/api/users', async (req, res) => {
  const { name, avatar } = req.body;
  if (!name) return res.status(400).json({ error: 'Tên người dùng là bắt buộc' });
  try {
    const seed = Math.random().toString(36).substring(7);
    const userAvatar = avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}`;
    const result = await query.run('INSERT INTO users (name, avatar) VALUES (?, ?)', [name, userAvatar]);
    res.status(201).json({ id: result.id, name, avatar: userAvatar });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Xóa User
app.delete('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Xóa tất cả các dự án thuộc user này
    await query.run('DELETE FROM projects WHERE user_id = ?', [id]);
    await query.run('DELETE FROM users WHERE id = ?', [id]);
    res.json({ message: 'Đã xóa người dùng và các dự án liên quan thành công', id: parseInt(id) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Lấy tất cả dự án của một User cụ thể
app.get('/api/projects/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const projects = await query.all('SELECT * FROM projects WHERE user_id = ? ORDER BY created_at DESC', [userId]);
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Tạo dự án mới cho User
app.post('/api/projects', async (req, res) => {
  const userId = req.body.userId || req.body.user_id;
  const { name, description } = req.body;
  if (!userId || !name) {
    return res.status(400).json({ error: 'Thiếu userId hoặc tên dự án' });
  }
  try {
    const result = await query.run(
      'INSERT INTO projects (user_id, name, description) VALUES (?, ?, ?)',
      [userId, name, description || '']
    );
    const newProject = await query.get('SELECT * FROM projects WHERE id = ?', [result.id]);
    res.status(201).json(newProject);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Xóa dự án
app.delete('/api/projects/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await query.run('DELETE FROM projects WHERE id = ?', [id]);
    res.json({ message: 'Đã xóa dự án thành công', id: parseInt(id) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Lấy cấu hình cài đặt settings của một dự án cụ thể
app.get('/api/settings/:projectId', async (req, res) => {
  const { projectId } = req.params;
  try {
    const settingsList = await query.all('SELECT * FROM settings WHERE project_id = ?', [projectId]);
    const settingsObj = settingsList.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});
    res.json(settingsObj);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Cập nhật hoặc lưu cấu hình cài đặt settings của một dự án cụ thể
app.post('/api/settings/:projectId', async (req, res) => {
  const { projectId } = req.params;
  const settingsObj = req.body;
  try {
    for (const [key, value] of Object.entries(settingsObj)) {
      await query.run(
        'INSERT OR REPLACE INTO settings (project_id, key, value) VALUES (?, ?, ?)',
        [projectId, key, typeof value === 'object' ? JSON.stringify(value) : String(value)]
      );
    }
    res.json({ message: 'Đã cập nhật cấu hình thành công' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Lấy thông tin doanh nghiệp theo projectId
app.get('/api/business-info/:projectId', async (req, res) => {
  const { projectId } = req.params;
  try {
    const info = await query.get('SELECT * FROM business_info WHERE project_id = ?', [projectId]);
    if (info) {
      info.phones = info.phones ? JSON.parse(info.phones) : [];
      info.addresses = info.addresses ? JSON.parse(info.addresses) : [];
      res.json(info);
    } else {
      res.json({
        project_id: parseInt(projectId),
        website: '',
        brand: '',
        company_name: '',
        founded_date: '',
        owner: '',
        tax_code: '',
        industry: '',
        products: '',
        features: '',
        employees: '',
        activity_area: '',
        usp: '',
        achievements: '',
        certificates: '',
        search_id: '',
        phones: [],
        addresses: [],
        nap: '',
        bio1: '',
        bio2: '',
        bio3: ''
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Lưu hoặc cập nhật thông tin doanh nghiệp theo projectId
app.post('/api/business-info/:projectId', async (req, res) => {
  const { projectId } = req.params;
  const info = req.body;
  try {
    await query.run(
      `INSERT OR REPLACE INTO business_info (
        project_id, website, brand, company_name, founded_date, owner, tax_code,
        industry, products, features, employees, activity_area, usp, achievements, certificates,
        search_id, phones, addresses, nap, bio1, bio2, bio3
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        projectId,
        info.website || '',
        info.brand || '',
        info.company_name || '',
        info.founded_date || '',
        info.owner || '',
        info.tax_code || '',
        info.industry || '',
        info.products || '',
        info.features || '',
        info.employees || '',
        info.activity_area || '',
        info.usp || '',
        info.achievements || '',
        info.certificates || '',
        info.search_id || '',
        JSON.stringify(info.phones || []),
        JSON.stringify(info.addresses || []),
        info.nap || '',
        info.bio1 || '',
        info.bio2 || '',
        info.bio3 || ''
      ]
    );
    res.json({ message: 'Đã lưu thông tin doanh nghiệp thành công' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Lấy danh sách Google Stacks của dự án
app.get('/api/google-stacks/:projectId', async (req, res) => {
  const { projectId } = req.params;
  try {
    const stacks = await query.all('SELECT * FROM google_stacks WHERE project_id = ? ORDER BY created_at DESC', [projectId]);
    res.json(stacks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Tạo một bộ Google Stack mới
app.post('/api/google-stacks/:projectId', async (req, res) => {
  const { projectId } = req.params;
  const { url, brand, main_key, drive_folder, phone, address } = req.body;

  if (!url || !brand || !main_key || !drive_folder) {
    return res.status(400).json({ error: 'Vui lòng nhập đầy đủ các trường thông tin!' });
  }

  if (drive_folder.includes('?usp=')) {
    return res.status(400).json({ error: 'Đường dẫn thư mục Google Drive không được phép chứa tham số "?usp="' });
  }

  try {
    const result = await query.run(
      `INSERT INTO google_stacks (project_id, url, brand, main_key, drive_folder, phone, address) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [projectId, url, brand, main_key, drive_folder, phone || '', address || '']
    );
    const newStack = await query.get('SELECT * FROM google_stacks WHERE id = ?', [result.id]);
    res.status(201).json(newStack);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Xóa một bộ Google Stack
app.delete('/api/google-stacks/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await query.run('DELETE FROM google_stacks WHERE id = ?', [id]);
    res.json({ message: 'Đã xóa bộ Google Stack thành công', id: parseInt(id) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Lấy chi tiết một bộ Google Stack theo ID
app.get('/api/google-stacks/detail/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const stack = await query.get('SELECT * FROM google_stacks WHERE id = ?', [id]);
    if (stack) {
      stack.keywords = stack.keywords ? JSON.parse(stack.keywords) : null;
      stack.assets = stack.assets ? JSON.parse(stack.assets) : null;
      res.json(stack);
    } else {
      res.status(404).json({ error: 'Không tìm thấy bộ Google Stack' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Lưu bộ từ khóa tối ưu cho Google Stack
app.post('/api/google-stacks/keywords/:id', async (req, res) => {
  const { id } = req.params;
  const keywordsObj = req.body;
  try {
    await query.run(
      'UPDATE google_stacks SET keywords = ? WHERE id = ?',
      [JSON.stringify(keywordsObj), id]
    );
    res.json({ message: 'Đã lưu bộ từ khóa tối ưu thành công!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper: Khởi tạo Google OAuth2 Client
async function getGoogleOAuthClient(projectId) {
  const settingsList = await query.all('SELECT * FROM settings WHERE project_id = ?', [projectId]);
  const settingsObj = settingsList.reduce((acc, curr) => {
    acc[curr.key] = curr.value;
    return acc;
  }, {});

  const clientId = settingsObj.google_client_id;
  const clientSecret = settingsObj.google_client_secret;
  const redirectUri = settingsObj.google_redirect_uri || 'http://localhost:5000/api/google/callback';

  if (!clientId || !clientSecret) {
    throw new Error('Chưa cấu hình Google Client ID hoặc Client Secret cho dự án này!');
  }

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUri
  );

  const accessToken = settingsObj.google_access_token;
  const refreshToken = settingsObj.google_refresh_token;

  if (accessToken || refreshToken) {
    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken
    });
  }

  return oauth2Client;
}

// Helper: Trích xuất folder ID từ link Drive
function extractFolderId(url) {
  if (!url) return null;
  const match = url.match(/folders\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

// Helper: Trích xuất File hoặc Document ID từ link Google Docs/Drive
function extractFileId(url) {
  if (!url) return null;
  const folderMatch = url.match(/folders\/([a-zA-Z0-9-_]+)/);
  if (folderMatch) return folderMatch[1];
  
  const dMatch = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (dMatch) return dMatch[1];

  const documentMatch = url.match(/document\/d\/([a-zA-Z0-9-_]+)/);
  if (documentMatch) return documentMatch[1];

  return null;
}

// Helper: Chạy song song concurrency pool
async function runConcurrent(limit, items, fn) {
  const results = [];
  const executing = [];
  for (const item of items) {
    const p = Promise.resolve().then(() => fn(item));
    results.push(p);
    if (limit <= items.length) {
      const e = p.then(() => executing.splice(executing.indexOf(e), 1));
      executing.push(e);
      if (executing.length >= limit) {
        await Promise.race(executing);
      }
    }
  }
  return Promise.all(results);
}

// API: Lấy Google Auth URL
app.get('/api/google/auth-url/:projectId', async (req, res) => {
  const { projectId } = req.params;
  try {
    const oauth2Client = await getGoogleOAuthClient(projectId);
    const scopes = [
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/drive.file'
    ];
    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
      state: projectId
    });
    res.json({ url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Callback nhận mã Google OAuth và lưu token
app.get('/api/google/callback', async (req, res) => {
  const { code, state } = req.query;
  const projectId = state;
  if (!code || !projectId) {
    return res.status(400).send('Thiếu mã code xác thực hoặc projectId');
  }

  try {
    const oauth2Client = await getGoogleOAuthClient(projectId);
    const { tokens } = await oauth2Client.getToken(code);

    await query.run(
      'INSERT OR REPLACE INTO settings (project_id, key, value) VALUES (?, ?, ?)',
      [projectId, 'google_access_token', tokens.access_token]
    );
    if (tokens.refresh_token) {
      await query.run(
        'INSERT OR REPLACE INTO settings (project_id, key, value) VALUES (?, ?, ?)',
        [projectId, 'google_refresh_token', tokens.refresh_token]
      );
    }
    res.redirect(`http://localhost:5173/?google_oauth=success&project_id=${projectId}`);
  } catch (error) {
    res.status(500).send(`Lỗi xác thực Google OAuth: ${error.message}`);
  }
});

// API: Kiểm tra trạng thái liên kết Google OAuth của dự án
app.get('/api/google/status/:projectId', async (req, res) => {
  const { projectId } = req.params;
  try {
    const settingsList = await query.all('SELECT * FROM settings WHERE project_id = ?', [projectId]);
    const settingsObj = settingsList.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});
    
    const hasToken = !!(settingsObj.google_access_token || settingsObj.google_refresh_token);
    res.json({ connected: hasToken });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Chạy tạo 39 tài sản Google Drive song song và xuất bản web
app.post('/api/google-stacks/run-assets/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const stack = await query.get('SELECT * FROM google_stacks WHERE id = ?', [id]);
    if (!stack) return res.status(404).json({ error: 'Không tìm thấy bộ Google Stack' });

    const keywords = stack.keywords ? JSON.parse(stack.keywords) : null;
    if (!keywords) return res.status(400).json({ error: 'Bộ Google Stack chưa cấu hình từ khóa ở Bước 1!' });

    const folderId = extractFolderId(stack.drive_folder);
    if (!folderId) return res.status(400).json({ error: 'Đường dẫn Drive Folder không đúng định dạng!' });

    const oauth2Client = await getGoogleOAuthClient(stack.project_id);
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    const driveV2 = google.drive({ version: 'v2', auth: oauth2Client });

    const assetsMeta = [
      { keyField: 'key_chinh_local', keyLabel: 'Key chính + Local', type: 'document' },
      ...Array.from({ length: 14 }, (_, i) => ({ keyField: `lsi_${i+1}`, keyLabel: `LSI keywords ${i+1}`, type: 'document' })),
      ...Array.from({ length: 6 }, (_, i) => ({ keyField: `cluster_${i+1}`, keyLabel: `Cluster key ${i+1}`, type: 'document' })),
      ...Array.from({ length: 15 }, (_, i) => ({ keyField: `lsi_${i+15}`, keyLabel: `LSI keywords ${i+15}`, type: 'document' })),
      
      { keyField: 'lsi_10', keyLabel: 'Google Sheet (LSI 10)', type: 'spreadsheet' },
      { keyField: 'lsi_11', keyLabel: 'Google Slide (LSI 11)', type: 'presentation' },
      { keyField: 'lsi_12', keyLabel: 'Google Form (LSI 12)', type: 'form' },
      { keyField: 'lsi_13', keyLabel: 'Google Drawing (LSI 13)', type: 'drawing' }
    ];

    const createAndPublishAsset = async (meta) => {
      let title = keywords[meta.keyField] || '';
      if (!title.trim()) {
        title = `${meta.keyLabel} (Chưa điền)`;
      }

      let mimeType = 'application/vnd.google-apps.document';
      if (meta.type === 'spreadsheet') mimeType = 'application/vnd.google-apps.spreadsheet';
      else if (meta.type === 'presentation') mimeType = 'application/vnd.google-apps.presentation';
      else if (meta.type === 'form') mimeType = 'application/vnd.google-apps.form';
      else if (meta.type === 'drawing') mimeType = 'application/vnd.google-apps.drawing';

      try {
        let fileId = '';
        let driveUrl = '';

        if (meta.type === 'form') {
          // Tạo bằng Google Forms API v1
          const formsApi = google.forms({ version: 'v1', auth: oauth2Client });
          const newForm = await formsApi.forms.create({
            requestBody: {
              info: {
                title: title
              }
            }
          });
          fileId = newForm.data.formId;

          try {
            await drive.files.update({
              fileId: fileId,
              addParents: folderId,
              requestBody: {
                name: title
              },
              fields: 'id, parents, name'
            });
          } catch (moveErr) {
            console.error(`Không thể di chuyển và đặt tên Form:`, moveErr.message);
          }

          const formFile = await drive.files.get({
            fileId: fileId,
            fields: 'webViewLink'
          });
          driveUrl = formFile.data.webViewLink;
        } else {
          // Tạo mới file rỗng
          const fileMetadata = {
            name: title,
            mimeType: mimeType,
            parents: [folderId]
          };
          const file = await drive.files.create({
            requestBody: fileMetadata,
            fields: 'id, name, webViewLink'
          });
          fileId = file.data.id;
          driveUrl = file.data.webViewLink;
        }

        await drive.permissions.create({
          fileId: fileId,
          requestBody: {
            role: 'reader',
            type: 'anyone'
          }
        });

        let pubUrl = '';
        if (meta.type !== 'form') {
          try {
            const revList = await driveV2.revisions.list({ fileId: fileId });
            const revisions = revList.data.items || [];
            const revisionId = revisions.length > 0 ? revisions[revisions.length - 1].id : '1';

            const revUpdate = await driveV2.revisions.update({
              fileId: fileId,
              revisionId: revisionId,
              resource: {
                published: true,
                publishAuto: true
              }
            });

            pubUrl = revUpdate.data.publishedLink || driveUrl;
          } catch (revErr) {
            console.error(`Không thể publish revision cho ${title}:`, revErr.message);
            pubUrl = driveUrl;
          }
        } else {
          pubUrl = `https://docs.google.com/forms/d/${fileId}/viewform`;
        }

        return {
          keyField: meta.keyField + (meta.type !== 'document' ? `_${meta.type}` : ''),
          keyLabel: meta.keyLabel,
          title: title,
          type: meta.type,
          driveUrl: driveUrl,
          pubUrl: pubUrl,
          checked: false
        };
      } catch (err) {
        console.error(`Lỗi khi tạo tài sản ${title}:`, err.message);
        return {
          keyField: meta.keyField,
          keyLabel: meta.keyLabel,
          title: title,
          type: meta.type,
          driveUrl: '',
          pubUrl: '',
          error: err.message,
          checked: false
        };
      }
    };

    const createdAssets = await runConcurrent(5, assetsMeta, createAndPublishAsset);

    await query.run(
      'UPDATE google_stacks SET assets = ? WHERE id = ?',
      [JSON.stringify(createdAssets), id]
    );

    res.json({ message: 'Tạo tài sản Google Stack thành công!', assets: createdAssets });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Sao chép 10 tệp Docs chính làm tệp đệm Templates sạch (trước khi tối ưu)
app.post('/api/google-stacks/create-temp-templates/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const stack = await query.get('SELECT * FROM google_stacks WHERE id = ?', [id]);
    if (!stack) return res.status(404).json({ error: 'Không tìm thấy bộ Google Stack' });

    const assets = stack.assets ? JSON.parse(stack.assets) : [];
    if (assets.length === 0) {
      return res.status(400).json({ error: 'Chưa tạo tài sản Google Stack ở Bước 3!' });
    }

    const keywords = stack.keywords ? JSON.parse(stack.keywords) : {};
    const folderId = extractFolderId(stack.drive_folder);
    if (!folderId) return res.status(400).json({ error: 'Đường dẫn Drive Folder không đúng định dạng!' });

    const oauth2Client = await getGoogleOAuthClient(stack.project_id);
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    const { brand } = await getBusinessNapInfo(stack.project_id);
    const templateFolderName = `Templates - ${brand || 'Stack'}`;

    // Tạo thư mục đệm Templates
    const templateFolder = await drive.files.create({
      requestBody: {
        name: templateFolderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [folderId]
      },
      fields: 'id, webViewLink'
    });
    const templateFolderId = templateFolder.data.id;

    const languagesData = stack.languages_data ? JSON.parse(stack.languages_data) : {};
    languagesData.temp_folder_url = templateFolder.data.webViewLink;
    languagesData.temp_folder_id = templateFolderId;
    languagesData.temp_docs = {};

    const lsiFields = Array.from({ length: 10 }, (_, i) => `lsi_${i + 5}`);
    
    for (const keyField of lsiFields) {
      // Tìm tệp Docs chính tương ứng
      const origDocAsset = assets.find(a => a.keyField === keyField);
      if (!origDocAsset || !origDocAsset.driveUrl) continue;

      const origDocFileId = extractFileId(origDocAsset.driveUrl);
      if (!origDocFileId) continue;

      try {
        const copiedFile = await drive.files.copy({
          fileId: origDocFileId,
          requestBody: {
            name: `[Template] ${origDocAsset.title}`,
            parents: [templateFolderId]
          },
          fields: 'id, webViewLink'
        });
        languagesData.temp_docs[keyField] = {
          id: copiedFile.data.id,
          driveUrl: copiedFile.data.webViewLink
        };
      } catch (copyErr) {
        console.error(`Lỗi copy template ${keyField}:`, copyErr.message);
      }
    }

    await query.run(
      'UPDATE google_stacks SET languages_data = ? WHERE id = ?',
      [JSON.stringify(languagesData), id]
    );

    res.json({ message: 'Đã sao chép 10 tệp Docs làm tệp đệm Templates sạch thành công!', languages_data: languagesData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Lưu trạng thái checkbox tick soạn content của tài sản
app.post('/api/google-stacks/assets-checked/:id', async (req, res) => {
  const { id } = req.params;
  const { keyField, checked } = req.body;
  try {
    const stack = await query.get('SELECT assets FROM google_stacks WHERE id = ?', [id]);
    if (!stack || !stack.assets) return res.status(404).json({ error: 'Không tìm thấy tài sản' });

    const assets = JSON.parse(stack.assets);
    const updatedAssets = assets.map(a => {
      if (a.keyField === keyField) {
        return { ...a, checked: !!checked };
      }
      return a;
    });

    await query.run(
      'UPDATE google_stacks SET assets = ? WHERE id = ?',
      [JSON.stringify(updatedAssets), id]
    );
    res.json({ message: 'Cập nhật trạng thái thành công', assets: updatedAssets });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Reset danh sách tài sản Google Stack
app.post('/api/google-stacks/reset-assets/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await query.run('UPDATE google_stacks SET assets = NULL WHERE id = ?', [id]);
    res.json({ message: 'Đã reset bộ tài sản Google Stack!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper: sanitize tên file an toàn cho SEO và Windows (giữ nguyên khoảng trắng)
function sanitizeFilename(name) {
  if (!name) return 'unnamed';
  // Chỉ loại bỏ ký tự cấm đặt tên file: \ / : * ? " < > |
  return name.replace(/[\\/:*?"<>|]/g, '').trim();
}

// API: Lấy thông tin tài sản Step 4
app.get('/api/google-stacks/step4/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const stack = await query.get('SELECT * FROM google_stacks WHERE id = ?', [id]);
    if (!stack) return res.status(404).json({ error: 'Không tìm thấy bộ Google Stack' });

    const keywords = stack.keywords ? JSON.parse(stack.keywords) : {};
    const assets = stack.assets ? JSON.parse(stack.assets) : [];

    const getDocLink = (keyField) => {
      const asset = assets.find(a => a.keyField === keyField);
      if (asset) return asset.pubUrl || asset.driveUrl || 'Không có';
      return 'Không có';
    };

    let step4Data = [];
    if (stack.step4_data) {
      step4Data = JSON.parse(stack.step4_data);
      
      // Đồng bộ/cập nhật lại link docs mới nhất từ Bước 3
      step4Data = step4Data.map(item => {
        let updated = { ...item };
        if (item.keyField && item.docLink !== 'Không có') {
          const currentLink = getDocLink(item.keyField);
          updated.docLink = currentLink;
        }
        // Tự động điền link Google Drawing nếu đã được tạo ở Bước 3 và chưa có link
        if (item.name === 'Google Drawing' && (!item.assetLink || item.assetLink === 'Không có' || item.assetLink.trim() === '')) {
          const drawingLink = getDocLink('lsi_13_drawing');
          if (drawingLink && drawingLink !== 'Không có') {
            updated.assetLink = drawingLink;
          }
        }
        return updated;
      });
    } else {
      // Khởi tạo bảng Step 4 mặc định theo yêu cầu của người dùng
      step4Data = [
        { id: 1, name: "Google site view", editable: false, keyField: "main_key", docLink: "Không có", assetLink: "" },
        { id: 2, name: "Google My Maps", editable: false, keyField: "key_chinh_local", docLink: getDocLink('key_chinh_local'), assetLink: "" },
        { id: 3, name: "GMB post", editable: false, keyField: "main_key", docLink: "Không có", assetLink: "" },
        { id: 4, name: "Youtube", editable: false, keyField: "lsi_1", docLink: getDocLink('lsi_1'), assetLink: "" },
        { id: 5, name: "Twitter", editable: false, keyField: "lsi_2", docLink: getDocLink('lsi_2'), assetLink: "" },
        { id: 6, name: "Pinterest", editable: false, keyField: "lsi_3", docLink: getDocLink('lsi_3'), assetLink: "" },
        { id: 7, name: "Linkedin", editable: true, keyField: "lsi_4", docLink: getDocLink('lsi_4'), assetLink: "" },
        { id: 8, name: "Google Drawing", editable: false, keyField: "lsi_13", docLink: getDocLink('lsi_13'), assetLink: getDocLink('lsi_13_drawing') === 'Không có' ? '' : getDocLink('lsi_13_drawing') },
        { id: 9, name: "Calendar", editable: false, keyField: "lsi_14", docLink: getDocLink('lsi_14'), assetLink: "" },
        { id: 10, name: "Quora", editable: true, keyField: "cluster_1", docLink: getDocLink('cluster_1'), assetLink: "" },
        { id: 11, name: "Blogger", editable: true, keyField: "cluster_2", docLink: getDocLink('cluster_2'), assetLink: "" },
        { id: 12, name: "Medium", editable: true, keyField: "cluster_3", docLink: getDocLink('cluster_3'), assetLink: "" },
        { id: 13, name: "Instagram", editable: true, keyField: "cluster_4", docLink: getDocLink('cluster_4'), assetLink: "" },
        { id: 14, name: "500px", editable: true, keyField: "cluster_5", docLink: getDocLink('cluster_5'), assetLink: "" },
        { id: 15, name: "Diigo", editable: true, keyField: "cluster_6", docLink: getDocLink('cluster_6'), assetLink: "" },
        
        // 3 Hàng cuối (Upload file)
        { id: 16, name: "Video upload", editable: false, keyField: "main_key", docLink: "Không có", assetLink: "", isUpload: true, fileType: "video", accept: ".mp4" },
        { id: 17, name: "Script upload", editable: false, keyField: "main_key", docLink: "Không có", assetLink: "", isUpload: true, fileType: "script", accept: ".txt" },
        { id: 18, name: "KML upload", editable: false, keyField: "lsi_local", docLink: "Không có", assetLink: "", isUpload: true, fileType: "kml", accept: ".kml" }
      ];
    }

    const step4Images = stack.step4_images ? JSON.parse(stack.step4_images) : [];
    res.json({ 
      step4_data: step4Data, 
      step4_images: step4Images,
      sheet_created_url: stack.sheet_created_url || '',
      image_folder_url: stack.image_folder_url || '',
      optimize_results: stack.optimize_results ? JSON.parse(stack.optimize_results) : [],
      pdf_results: stack.pdf_results ? JSON.parse(stack.pdf_results) : [],
      button3_results: stack.button3_results ? JSON.parse(stack.button3_results) : null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Lưu cấu hình bảng tài sản Step 4
app.post('/api/google-stacks/step4/:id', async (req, res) => {
  const { id } = req.params;
  const { step4_data } = req.body;
  try {
    await query.run(
      'UPDATE google_stacks SET step4_data = ? WHERE id = ?',
      [JSON.stringify(step4_data), id]
    );
    res.json({ message: 'Đã lưu cấu hình tài sản thành công!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Upload file đơn lẻ (Video, Script, KML) cho Step 4
app.post('/api/google-stacks/step4/upload-file/:id', upload.single('file'), async (req, res) => {
  const { id } = req.params;
  const { fileType } = req.body; // 'video' | 'script' | 'kml'
  const file = req.file;

  if (!file) {
    return res.status(400).json({ error: 'Không tìm thấy file upload!' });
  }

  try {
    const stack = await query.get('SELECT * FROM google_stacks WHERE id = ?', [id]);
    if (!stack) {
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      return res.status(404).json({ error: 'Không tìm thấy bộ Google Stack' });
    }

    const keywords = stack.keywords ? JSON.parse(stack.keywords) : {};
    
    let keyVal = '';
    if (fileType === 'video' || fileType === 'script') {
      keyVal = stack.main_key || 'main_key';
    } else if (fileType === 'kml') {
      keyVal = keywords.lsi_local || 'lsi_local';
    }

    const ext = path.extname(file.originalname) || (fileType === 'video' ? '.mp4' : fileType === 'script' ? '.txt' : '.kml');
    const newFilename = sanitizeFilename(keyVal) + ext;
    const targetDir = path.join(__dirname, 'uploads', 'stacks', String(id), 'files');
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const targetPath = path.join(targetDir, newFilename);
    if (fs.existsSync(targetPath)) {
      fs.unlinkSync(targetPath);
    }

    fs.renameSync(file.path, targetPath);

    let step4Data = stack.step4_data ? JSON.parse(stack.step4_data) : [];
    if (step4Data.length === 0) {
      return res.status(400).json({ error: 'Bảng tài sản chưa được khởi tạo!' });
    }

    const fileUrl = `/uploads/stacks/${id}/files/${newFilename}`;
    step4Data = step4Data.map(item => {
      if (item.isUpload && item.fileType === fileType) {
        return {
          ...item,
          assetLink: fileUrl,
          fileInfo: {
            filename: newFilename,
            originalName: file.originalname,
            size: file.size,
            uploadedAt: new Date().toISOString()
          }
        };
      }
      return item;
    });

    await query.run(
      'UPDATE google_stacks SET step4_data = ? WHERE id = ?',
      [JSON.stringify(step4Data), id]
    );

    res.json({ message: 'Upload file thành công!', step4_data: step4Data });
  } catch (error) {
    if (file && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
    res.status(500).json({ error: error.message });
  }
});

// API: Upload đồng thời tối đa 12 ảnh, tự động đổi tên theo LSI từ 30 đến 41
app.post('/api/google-stacks/step4/upload-images/:id', upload.array('images', 12), async (req, res) => {
  const { id } = req.params;
  const files = req.files;

  if (!files || files.length === 0) {
    return res.status(400).json({ error: 'Không tìm thấy ảnh upload!' });
  }

  try {
    const stack = await query.get('SELECT * FROM google_stacks WHERE id = ?', [id]);
    if (!stack) {
      files.forEach(f => { if (fs.existsSync(f.path)) fs.unlinkSync(f.path); });
      return res.status(404).json({ error: 'Không tìm thấy bộ Google Stack' });
    }

    const keywords = stack.keywords ? JSON.parse(stack.keywords) : {};
    
    const targetDir = path.join(__dirname, 'uploads', 'stacks', String(id), 'images');
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const uploadedImages = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const num = 30 + i;
      if (num > 41) {
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        continue;
      }

      const keyField = `lsi_${num}`;
      const keyLabel = `LSI keywords ${num}`;
      const keywordVal = keywords[keyField] || `${keyLabel}`;

      const ext = path.extname(file.originalname) || '.jpg';
      const newFilename = sanitizeFilename(keywordVal) + ext;
      const targetPath = path.join(targetDir, newFilename);

      if (fs.existsSync(targetPath)) {
        fs.unlinkSync(targetPath);
      }

      fs.renameSync(file.path, targetPath);

      uploadedImages.push({
        keyField,
        keyLabel,
        title: keywords[keyField] || '',
        filename: newFilename,
        url: `/uploads/stacks/${id}/images/${newFilename}`,
        size: file.size,
        uploadedAt: new Date().toISOString()
      });
    }

    await query.run(
      'UPDATE google_stacks SET step4_images = ? WHERE id = ?',
      [JSON.stringify(uploadedImages), id]
    );

    res.json({ message: `Đã upload thành công ${uploadedImages.length} ảnh!`, step4_images: uploadedImages });
  } catch (error) {
    if (files && files.length > 0) {
      files.forEach(f => {
        if (fs.existsSync(f.path)) fs.unlinkSync(f.path);
      });
    }
    res.status(500).json({ error: error.message });
  }
});

// API: Đồng bộ tài sản Step 4 lên Google Drive
app.post('/api/google-stacks/step4/sync-drive/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const stack = await query.get('SELECT * FROM google_stacks WHERE id = ?', [id]);
    if (!stack) return res.status(404).json({ error: 'Không tìm thấy bộ Google Stack' });

    const keywords = stack.keywords ? JSON.parse(stack.keywords) : {};
    const step4Data = stack.step4_data ? JSON.parse(stack.step4_data) : [];
    const step4Images = stack.step4_images ? JSON.parse(stack.step4_images) : [];

    if (!stack.drive_folder) {
      return res.status(400).json({ error: 'Thư mục Drive chính chưa được cấu hình!' });
    }
    const parentFolderId = extractFolderId(stack.drive_folder);
    if (!parentFolderId) {
      return res.status(400).json({ error: 'Đường dẫn Drive Folder không đúng định dạng!' });
    }

    const oauth2Client = await getGoogleOAuthClient(stack.project_id);
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    const driveV2 = google.drive({ version: 'v2', auth: oauth2Client });

    // Helper: Share public cho file
    const makePublic = async (fileId) => {
      try {
        await drive.permissions.create({
          fileId: fileId,
          requestBody: {
            role: 'reader',
            type: 'anyone'
          }
        });
      } catch (e) {
        console.error(`Lỗi share public ${fileId}:`, e.message);
      }
    };

    // 1. Tạo thư mục ảnh con: {Key chính - Image folder}
    const mainKey = stack.main_key || 'main_key';
    const folderName = `${mainKey} - Image folder`;
    console.log(`Đang tạo folder ảnh: ${folderName}`);
    const folderMetadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentFolderId]
    };
    const newFolder = await drive.files.create({
      requestBody: folderMetadata,
      fields: 'id, webViewLink'
    });
    const imageFolderId = newFolder.data.id;
    const imageFolderUrl = newFolder.data.webViewLink;
    await makePublic(imageFolderId);

    // Mảng gom tất cả các upload promises để chạy song song hiệu suất cao
    const promises = [];

    // --- Task 1: Tạo và Publish Google Sheet ---
    let sheetUrl = '';
    const createSheetPromise = async () => {
      console.log(`Đang tạo Google Sheet trống: ${mainKey}`);
      const sheetMetadata = {
        name: mainKey,
        mimeType: 'application/vnd.google-apps.spreadsheet',
        parents: [parentFolderId]
      };
      const newSheet = await drive.files.create({
        requestBody: sheetMetadata,
        fields: 'id, webViewLink'
      });
      const sheetId = newSheet.data.id;
      sheetUrl = newSheet.data.webViewLink;
      await makePublic(sheetId);

      // Publish to web tự động update như các link docs lúc trước
      try {
        const revList = await driveV2.revisions.list({ fileId: sheetId });
        const revisions = revList.data.items || [];
        const revisionId = revisions.length > 0 ? revisions[revisions.length - 1].id : '1';
        
        await driveV2.revisions.update({
          fileId: sheetId,
          revisionId: revisionId,
          resource: {
            published: true,
            publishAuto: true
          }
        });
      } catch (revErr) {
        console.error(`Không thể publish sheet revision:`, revErr.message);
      }
    };
    promises.push(createSheetPromise());

    // --- Task 2: Upload 12 ảnh song song ---
    const updatedImages = new Array(step4Images.length);
    const imagesDir = path.join(__dirname, 'uploads', 'stacks', String(id), 'images');
    
    step4Images.forEach((img, idx) => {
      const uploadImageTask = async () => {
        const localPath = path.join(imagesDir, img.filename);
        if (fs.existsSync(localPath)) {
          // Tính toán tên file ảnh chuẩn không gạch nối từ từ khóa LSI tương ứng
          const keyField = img.keyField;
          const keywordVal = keywords[keyField] || img.title || `LSI keywords ${keyField.replace('lsi_', '')}`;
          const ext = path.extname(img.filename) || '.jpg';
          const cleanNameOnDrive = sanitizeFilename(keywordVal) + ext;

          console.log(`Đang upload ảnh lên Drive song song: ${cleanNameOnDrive}`);
          const media = {
            mimeType: 'image/jpeg',
            body: fs.createReadStream(localPath)
          };
          const fileMetadata = {
            name: cleanNameOnDrive,
            parents: [imageFolderId]
          };
          const driveFile = await drive.files.create({
            requestBody: fileMetadata,
            media: media,
            fields: 'id, webViewLink'
          });
          await makePublic(driveFile.data.id);
          
          updatedImages[idx] = {
            ...img,
            filename: cleanNameOnDrive, // Đồng bộ lại tên file không gạch nối vào DB
            driveFileId: driveFile.data.id,
            driveUrl: driveFile.data.webViewLink
          };
        } else {
          updatedImages[idx] = img;
        }
      };
      promises.push(uploadImageTask());
    });

    // --- Task 3: Upload 3 file đính kèm song song (Video, Script, KML) ---
    const filesDir = path.join(__dirname, 'uploads', 'stacks', String(id), 'files');
    const updatedStep4Data = [...step4Data];
    
    updatedStep4Data.forEach((item, idx) => {
      if (item.isUpload && item.assetLink) {
        const uploadFileTask = async () => {
          const localFilename = item.fileInfo.filename;
          const localPath = path.join(filesDir, localFilename);
          if (fs.existsSync(localPath)) {
            let keyVal = '';
            if (item.fileType === 'video' || item.fileType === 'script') {
              keyVal = stack.main_key || 'main_key';
            } else if (item.fileType === 'kml') {
              keyVal = keywords.lsi_local || 'lsi_local';
            }
            const ext = path.extname(localFilename) || (item.fileType === 'video' ? '.mp4' : item.fileType === 'script' ? '.txt' : '.kml');
            const cleanNameOnDrive = sanitizeFilename(keyVal) + ext;

            console.log(`Đang upload file đính kèm lên Drive song song: ${cleanNameOnDrive}`);
            let mimeType = 'application/octet-stream';
            if (item.fileType === 'video') mimeType = 'video/mp4';
            else if (item.fileType === 'script') mimeType = 'text/plain';
            else if (item.fileType === 'kml') mimeType = 'application/vnd.google-earth.kml+xml';

            const media = {
              mimeType: mimeType,
              body: fs.createReadStream(localPath)
            };
            const fileMetadata = {
              name: cleanNameOnDrive,
              parents: [parentFolderId]
            };
            const driveFile = await drive.files.create({
              requestBody: fileMetadata,
              media: media,
              fields: 'id, webViewLink'
            });
            await makePublic(driveFile.data.id);

            updatedStep4Data[idx] = {
              ...item,
              driveUrl: driveFile.data.webViewLink,
              assetLink: driveFile.data.webViewLink,
              localUrl: item.assetLink,
              fileInfo: {
                ...item.fileInfo,
                filename: cleanNameOnDrive // Đồng bộ lại tên file không gạch nối vào DB
              }
            };
          }
        };
        promises.push(uploadFileTask());
      }
    });

    // Chạy song song tất cả các request Google API
    await Promise.all(promises);

    // 5. Cập nhật cơ sở dữ liệu SQLite
    await query.run(
      'UPDATE google_stacks SET step4_data = ?, step4_images = ?, sheet_created_url = ?, image_folder_url = ? WHERE id = ?',
      [
        JSON.stringify(updatedStep4Data),
        JSON.stringify(updatedImages),
        sheetUrl,
        imageFolderUrl,
        id
      ]
    );

    res.json({
      message: 'Đồng bộ tài sản lên Google Drive thành công!',
      step4_data: updatedStep4Data,
      step4_images: updatedImages,
      sheet_created_url: sheetUrl,
      image_folder_url: imageFolderUrl
    });

  } catch (error) {
    console.error('Lỗi khi đồng bộ lên Drive:', error);
    res.status(500).json({ error: error.message });
  }
});

// API: Tối ưu hóa tài sản Google Docs (Bước 5)
app.post('/api/google-stacks/optimize-docs/:id', async (req, res) => {
  const { id } = req.params;
  const { targetKeys } = req.body || {};
  try {
    const stack = await query.get('SELECT * FROM google_stacks WHERE id = ?', [id]);
    if (!stack) return res.status(404).json({ error: 'Không tìm thấy bộ Google Stack' });

    const keywords = stack.keywords ? JSON.parse(stack.keywords) : {};
    const assets = stack.assets ? JSON.parse(stack.assets) : [];
    const step4Data = stack.step4_data ? JSON.parse(stack.step4_data) : [];

    // Lọc ra danh sách tài sản Google Docs (type: document) đã có link Drive
    let docsAssets = assets.filter(a => a.type === 'document' && a.driveUrl);
    if (targetKeys && Array.isArray(targetKeys) && targetKeys.length > 0) {
      docsAssets = docsAssets.filter(a => targetKeys.includes(a.keyField));
    }
    if (docsAssets.length === 0) {
      return res.json({ message: 'Không có tài liệu nào cần tối ưu hóa!', results: [] });
    }

    const oauth2Client = await getGoogleOAuthClient(stack.project_id);
    const docs = google.docs({ version: 'v1', auth: oauth2Client });

    // Lấy tên mạng xã hội hàng 7 từ step4Data
    const row7Asset = step4Data.find(item => item.id === 7) || { name: 'LinkedIn', assetLink: '' };
    const row7Name = row7Asset.name || 'LinkedIn';

    // Tạo Map hỗ trợ lấy link tài sản ở Bước 4 nhanh chóng
    const step4Map = {};
    step4Data.forEach(item => {
      step4Map[item.name] = item.assetLink || '';
    });

    const siteViewLink = step4Map['Google site view'] || '';
    const myMapsLink = step4Map['Google My Maps'] || '';
    const gmbLink = step4Map['GMB post'] || '';
    const youtubeLink = step4Map['Youtube'] || '';
    const twitterLink = step4Map['Twitter'] || '';
    const pinterestLink = step4Map['Pinterest'] || '';
    const row7Link = step4Map[row7Name] || row7Asset.assetLink || '';

    const driveFolderLink = stack.drive_folder || '';
    const sheetLink = stack.sheet_created_url || '';
    const imageFolderLink = stack.image_folder_url || '';

    // Hàm tối ưu hóa từng tệp Docs
    const optimizeSingleDoc = async (asset) => {
      const documentId = extractFileId(asset.driveUrl);
      if (!documentId) return { keyField: asset.keyField, status: 'error', message: 'Không trích xuất được Document ID' };

      const ownKey = asset.keyField;
      const ownTitle = keywords[ownKey] || asset.title || '';
      const ownPubLink = asset.pubUrl || asset.driveUrl || '';

      try {
        // 1. Lấy nội dung tài liệu hiện tại
        const docRes = await docs.documents.get({ documentId });
        const doc = docRes.data;
        const namedRanges = doc.namedRanges || {};

        const deleteRequests = [];

        // 2. Kiểm tra nếu có Named Range cũ (opt_zone hoặc rel_zone) thì xóa sạch text cũ trước
        // Xóa từ dưới lên trên để không bị lệch index
        if (namedRanges['rel_zone']) {
          const ranges = namedRanges['rel_zone'].namedRanges[0].ranges || [];
          ranges.forEach(r => {
            deleteRequests.push({
              deleteContentRange: {
                range: {
                  segmentId: r.segmentId || '',
                  startIndex: r.startIndex,
                  endIndex: r.endIndex
                }
              }
            });
          });
        }

        if (namedRanges['opt_zone']) {
          const ranges = namedRanges['opt_zone'].namedRanges[0].ranges || [];
          ranges.forEach(r => {
            deleteRequests.push({
              deleteContentRange: {
                range: {
                  segmentId: r.segmentId || '',
                  startIndex: r.startIndex,
                  endIndex: r.endIndex
                }
              }
            });
          });
        }

        if (deleteRequests.length > 0) {
          // Gửi request xóa
          await docs.documents.batchUpdate({
            documentId,
            requestBody: { requests: deleteRequests }
          });
        }

        // 3. Get lại nội dung document mới sau khi đã xóa các khối cũ để lấy index chính xác
        const freshDocRes = await docs.documents.get({ documentId });
        const freshDoc = freshDocRes.data;
        const bodyContent = freshDoc.body.content || [];

        // Tìm vị trí chèn sau Intro paragraph (Paragraph thứ 2 có chứa text)
        let paragraphCount = 0;
        let optInsertIndex = 1;
        
        for (let i = 0; i < bodyContent.length; i++) {
          const element = bodyContent[i];
          if (element.paragraph) {
            const text = element.paragraph.elements?.map(el => el.textRun?.content || '').join('') || '';
            if (text.trim().length > 0) {
              paragraphCount++;
              if (paragraphCount === 2) {
                // Đây chính là Intro paragraph
                optInsertIndex = element.endIndex - 1; // Chèn ngay trước ký tự \n của Intro
                break;
              }
            }
          }
        }

        // Vị trí chèn Bài viết liên quan ở cuối tài liệu
        const lastElement = bodyContent[bodyContent.length - 1];
        const relInsertIndex = lastElement.endIndex - 1;

        // Lấy các giá trị Anchor text từ từ khóa
        const keyChinhVal = keywords.key_chinh || stack.main_key || 'Key chính';
        const keyChinhLocalVal = keywords.key_chinh_local || 'Key chính + Local';
        const lsi1Val = keywords.lsi_1 || 'LSI keywords 1';
        const lsi2Val = keywords.lsi_2 || 'LSI keywords 2';
        const lsi3Val = keywords.lsi_3 || 'LSI keywords 3';
        const lsi4Val = keywords.lsi_4 || 'LSI keywords 4';

        // 4. Xây dựng khối văn bản tối ưu chèn sau Intro
        const optLines = [
          `${ownTitle}: ${ownTitle}`,
          `Website: ${keyChinhVal}`,
          `Google site view: ${keyChinhVal}`,
          `Google My Maps: ${keyChinhLocalVal}`,
          `GMB post: ${keyChinhVal}`,
          `Youtube: ${lsi1Val}`,
          `Twitter: ${lsi2Val}`,
          `Pinterest: ${lsi3Val}`,
          `${row7Name}: ${lsi4Val}`,
          `Drive Folder: ${keyChinhVal}`,
          `Google Sheet link: ${keyChinhVal}`,
          `Drive folder image: ${keyChinhVal}`
        ];

        // Dùng soft line break \u000b (Shift+Enter) để các dòng sát nhau, chỉ cách trên/dưới 1 dòng trống bằng \n
        const optText = '\n' + optLines.join('\u000b') + '\n';
        
        // 5. Xây dựng khối văn bản "Bài viết liên quan"
        let relatedKeys = [];
        const numPattern = /\d+/;
        const ownNumMatch = ownKey.match(numPattern);
        const ownNum = ownNumMatch ? parseInt(ownNumMatch[0], 10) : null;

        if (ownKey.startsWith('cluster_')) {
          relatedKeys = ['cluster_1', 'cluster_2', 'cluster_3', 'cluster_4', 'cluster_5', 'cluster_6'];
        } else if (ownKey === 'key_chinh_local' || (ownNum >= 1 && ownNum <= 4)) {
          relatedKeys = ['key_chinh_local', 'lsi_1', 'lsi_2', 'lsi_3', 'lsi_4'];
        } else if (ownNum >= 5 && ownNum <= 9) {
          relatedKeys = ['lsi_5', 'lsi_6', 'lsi_7', 'lsi_8', 'lsi_9'];
        } else if (ownNum >= 10 && ownNum <= 14) {
          relatedKeys = ['lsi_10', 'lsi_11', 'lsi_12', 'lsi_13', 'lsi_14'];
        } else if (ownNum >= 15 && ownNum <= 19) {
          relatedKeys = ['lsi_15', 'lsi_16', 'lsi_17', 'lsi_18', 'lsi_19'];
        } else if (ownNum >= 20 && ownNum <= 24) {
          relatedKeys = ['lsi_20', 'lsi_21', 'lsi_22', 'lsi_23', 'lsi_24'];
        } else if (ownNum >= 25 && ownNum <= 29) {
          relatedKeys = ['lsi_25', 'lsi_26', 'lsi_27', 'lsi_28', 'lsi_29'];
        }

        const relLines = [
          '',
          'Bài viết liên quan:'
        ];
        
        relatedKeys.forEach(k => {
          const keyTitle = keywords[k] || '';
          if (keyTitle.trim()) {
            relLines.push(keyTitle);
          }
        });
        relLines.push(''); // Dòng trống cuối cùng

        const relText = relLines.join('\n');

        // Bắt đầu chuẩn bị các requests batchUpdate
        // Chèn từ cuối tài liệu lên đầu để không làm lệch index
        const insertRequests = [];

        // --- BƯỚC A: Chèn "Bài viết liên quan" ở cuối ---
        insertRequests.push({
          insertText: {
            location: { index: relInsertIndex },
            text: relText
          }
        });

        // Định dạng links trong "Bài viết liên quan" (link Docs Drive, không pub)
        let currentRelOffset = relInsertIndex + 1 + relLines[1].length + 1; // qua dòng trống và dòng nhãn
        
        for (let j = 2; j < relLines.length - 1; j++) {
          const keyTitle = relLines[j];
          const k = relatedKeys[j - 2];
          const relatedAsset = assets.find(a => a.keyField === k);
          const relatedDriveUrl = relatedAsset?.driveUrl || '';

          if (relatedDriveUrl) {
            insertRequests.push({
              updateTextStyle: {
                range: {
                  startIndex: currentRelOffset,
                  endIndex: currentRelOffset + keyTitle.length
                },
                textStyle: {
                  link: { url: relatedDriveUrl }
                },
                fields: 'link'
              }
            });
          }
          currentRelOffset += keyTitle.length + 1;
        }

        // Tạo Named Range 'rel_zone'
        insertRequests.push({
          createNamedRange: {
            name: 'rel_zone',
            range: {
              startIndex: relInsertIndex,
              endIndex: relInsertIndex + relText.length
            }
          }
        });

        // --- BƯỚC B: Chèn khối tối ưu sau Intro ---
        insertRequests.push({
          insertText: {
            location: { index: optInsertIndex },
            text: optText
          }
        });

        // Định dạng links trong khối tối ưu
        let currentOptOffset = optInsertIndex + 1; // bỏ qua dòng trống đầu tiên

        // Dòng 0: `${ownTitle}: ${ownTitle}` -> chèn link pub của chính nó
        const ownTitleLineText = optLines[0];
        const ownTitleLinkStart = currentOptOffset + ownTitle.length + 2; // bỏ qua `${ownTitle}: `
        if (ownPubLink) {
          insertRequests.push({
            updateTextStyle: {
              range: {
                startIndex: ownTitleLinkStart,
                endIndex: ownTitleLinkStart + ownTitle.length
              },
              textStyle: {
                link: { url: ownPubLink }
              },
              fields: 'link'
            }
          });
        }
        currentOptOffset += ownTitleLineText.length + 1; // +1 cho \u000b

        // Dòng 1: Website link
        const websiteLineText = optLines[1];
        const websiteLinkStart = currentOptOffset + 'Website: '.length;
        if (stack.url) {
          insertRequests.push({
            updateTextStyle: {
              range: {
                startIndex: websiteLinkStart,
                endIndex: websiteLinkStart + keyChinhVal.length
              },
              textStyle: {
                link: { url: stack.url }
              },
              fields: 'link'
            }
          });
        }
        currentOptOffset += websiteLineText.length + 1;

        // Dòng 2: Google site view
        const siteLineText = optLines[2];
        const siteLinkStart = currentOptOffset + 'Google site view: '.length;
        if (siteViewLink) {
          insertRequests.push({
            updateTextStyle: {
              range: {
                startIndex: siteLinkStart,
                endIndex: siteLinkStart + keyChinhVal.length
              },
              textStyle: {
                link: { url: siteViewLink }
              },
              fields: 'link'
            }
          });
        }
        currentOptOffset += siteLineText.length + 1;

        // Dòng 3: Google My Maps
        const mapsLineText = optLines[3];
        const mapsLinkStart = currentOptOffset + 'Google My Maps: '.length;
        if (myMapsLink) {
          insertRequests.push({
            updateTextStyle: {
              range: {
                startIndex: mapsLinkStart,
                endIndex: mapsLinkStart + keyChinhLocalVal.length
              },
              textStyle: {
                link: { url: myMapsLink }
              },
              fields: 'link'
            }
          });
        }
        currentOptOffset += mapsLineText.length + 1;

        // Dòng 4: GMB post
        const gmbLineText = optLines[4];
        const gmbLinkStart = currentOptOffset + 'GMB post: '.length;
        if (gmbLink) {
          insertRequests.push({
            updateTextStyle: {
              range: {
                startIndex: gmbLinkStart,
                endIndex: gmbLinkStart + keyChinhVal.length
              },
              textStyle: {
                link: { url: gmbLink }
              },
              fields: 'link'
            }
          });
        }
        currentOptOffset += gmbLineText.length + 1;

        // Dòng 5: Youtube
        const ytLineText = optLines[5];
        const ytLinkStart = currentOptOffset + 'Youtube: '.length;
        if (youtubeLink) {
          insertRequests.push({
            updateTextStyle: {
              range: {
                startIndex: ytLinkStart,
                endIndex: ytLinkStart + lsi1Val.length
              },
              textStyle: {
                link: { url: youtubeLink }
              },
              fields: 'link'
            }
          });
        }
        currentOptOffset += ytLineText.length + 1;

        // Dòng 6: Twitter
        const twLineText = optLines[6];
        const twLinkStart = currentOptOffset + 'Twitter: '.length;
        if (twitterLink) {
          insertRequests.push({
            updateTextStyle: {
              range: {
                startIndex: twLinkStart,
                endIndex: twLinkStart + lsi2Val.length
              },
              textStyle: {
                link: { url: twitterLink }
              },
              fields: 'link'
            }
          });
        }
        currentOptOffset += twLineText.length + 1;

        // Dòng 7: Pinterest
        const pinLineText = optLines[7];
        const pinLinkStart = currentOptOffset + 'Pinterest: '.length;
        if (pinterestLink) {
          insertRequests.push({
            updateTextStyle: {
              range: {
                startIndex: pinLinkStart,
                endIndex: pinLinkStart + lsi3Val.length
              },
              textStyle: {
                link: { url: pinterestLink }
              },
              fields: 'link'
            }
          });
        }
        currentOptOffset += pinLineText.length + 1;

        // Dòng 8: Row 7 Asset
        const row7LineText = optLines[8];
        const row7LinkStart = currentOptOffset + row7Name.length + 2;
        if (row7Link) {
          insertRequests.push({
            updateTextStyle: {
              range: {
                startIndex: row7LinkStart,
                endIndex: row7LinkStart + lsi4Val.length
              },
              textStyle: {
                link: { url: row7Link }
              },
              fields: 'link'
            }
          });
        }
        currentOptOffset += row7LineText.length + 1;

        // Dòng 9: Drive Folder
        const folderLineText = optLines[9];
        const folderLinkStart = currentOptOffset + 'Drive Folder: '.length;
        if (driveFolderLink) {
          insertRequests.push({
            updateTextStyle: {
              range: {
                startIndex: folderLinkStart,
                endIndex: folderLinkStart + keyChinhVal.length
              },
              textStyle: {
                link: { url: driveFolderLink }
              },
              fields: 'link'
            }
          });
        }
        currentOptOffset += folderLineText.length + 1;

        // Dòng 10: Google Sheet link
        const sheetLineText = optLines[10];
        const sheetLinkStart = currentOptOffset + 'Google Sheet link: '.length;
        if (sheetLink) {
          insertRequests.push({
            updateTextStyle: {
              range: {
                startIndex: sheetLinkStart,
                endIndex: sheetLinkStart + keyChinhVal.length
              },
              textStyle: {
                link: { url: sheetLink }
              },
              fields: 'link'
            }
          });
        }
        currentOptOffset += sheetLineText.length + 1;

        // Dòng 11: Drive folder image
        const imgFolderLineText = optLines[11];
        const imgFolderLinkStart = currentOptOffset + 'Drive folder image: '.length;
        if (imageFolderLink) {
          insertRequests.push({
            updateTextStyle: {
              range: {
                startIndex: imgFolderLinkStart,
                endIndex: imgFolderLinkStart + keyChinhVal.length
              },
              textStyle: {
                link: { url: imageFolderLink }
              },
              fields: 'link'
            }
          });
        }
        currentOptOffset += imgFolderLineText.length + 1;

        // Tạo Named Range 'opt_zone'
        insertRequests.push({
          createNamedRange: {
            name: 'opt_zone',
            range: {
              startIndex: optInsertIndex,
              endIndex: optInsertIndex + optText.length
            }
          }
        });

        // Gửi toàn bộ request batchUpdate chèn và link hóa
        await docs.documents.batchUpdate({
          documentId,
          requestBody: { requests: insertRequests }
        });

        console.log(`Tối ưu hóa thành công Google Docs: ${ownTitle}`);
        return { keyField: asset.keyField, title: ownTitle, status: 'success' };
      } catch (err) {
        console.error(`Lỗi tối ưu hóa Google Docs [${ownTitle}]:`, err.message);
        return { keyField: asset.keyField, title: ownTitle, status: 'error', message: err.message };
      }
    };

    // Chạy song song Concurrency Pool 5 luồng
    const results = [];
    const limit = 5;
    const activePromises = [];

    for (const asset of docsAssets) {
      const p = optimizeSingleDoc(asset).then(res => {
        results.push(res);
        activePromises.splice(activePromises.indexOf(p), 1);
      });
      activePromises.push(p);

      if (activePromises.length >= limit) {
        await Promise.race(activePromises);
      }
    }
    await Promise.all(activePromises);

    // Cập nhật và lưu optimize_results vào SQLite DB
    let finalResults = [];
    if (targetKeys && Array.isArray(targetKeys) && targetKeys.length > 0) {
      const prevResults = stack.optimize_results ? JSON.parse(stack.optimize_results) : [];
      finalResults = prevResults.map(oldRes => {
        const updated = results.find(n => n.keyField === oldRes.keyField);
        return updated ? updated : oldRes;
      });
      results.forEach(r => {
        if (!finalResults.some(f => f.keyField === r.keyField)) {
          finalResults.push(r);
        }
      });
    } else {
      finalResults = results;
    }

    await query.run(
      'UPDATE google_stacks SET optimize_results = ? WHERE id = ?',
      [JSON.stringify(finalResults), id]
    );

    const successCount = finalResults.filter(r => r.status === 'success').length;
    const errorCount = finalResults.filter(r => r.status === 'error').length;

    res.json({
      message: `Đã tối ưu hóa xong tài sản Google Docs! Thành công: ${successCount}, Thất bại: ${errorCount}`,
      results: finalResults
    });

  } catch (error) {
    console.error('Lỗi khi tối ưu hóa Docs:', error);
    res.status(500).json({ error: error.message });
  }
});

// API: Tạo và tối ưu hóa tài sản PDF (Bước 5 - Button 2)
app.post('/api/google-stacks/optimize-pdf/:id', async (req, res) => {
  const { id } = req.params;
  const { targetKeys } = req.body || {};
  try {
    const stack = await query.get('SELECT * FROM google_stacks WHERE id = ?', [id]);
    if (!stack) return res.status(404).json({ error: 'Không tìm thấy bộ Google Stack' });

    const keywords = stack.keywords ? JSON.parse(stack.keywords) : {};
    const assets = stack.assets ? JSON.parse(stack.assets) : [];
    const step4Data = stack.step4_data ? JSON.parse(stack.step4_data) : [];

    // 5 keywords mục tiêu: lsi_5 đến lsi_9
    const targetPdfKeys = ['lsi_5', 'lsi_6', 'lsi_7', 'lsi_8', 'lsi_9'];
    
    // Lọc danh sách cần xử lý
    let runKeys = [...targetPdfKeys];
    if (targetKeys && Array.isArray(targetKeys) && targetKeys.length > 0) {
      runKeys = runKeys.filter(k => targetKeys.includes(k));
    }

    if (runKeys.length === 0) {
      return res.json({ message: 'Không có tài sản PDF nào cần tối ưu hóa!', results: [] });
    }

    // Google API client
    const oauth2Client = await getGoogleOAuthClient(stack.project_id);
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    // Trích xuất parent folder ID (thư mục Drive chính của bộ Stack)
    const parentFolderId = extractFolderId(stack.drive_folder);
    if (!parentFolderId) {
      return res.status(400).json({ error: 'Không lấy được thư mục cha Google Drive chính của bộ Stack!' });
    }

    // Bản đồ lấy nhanh link tài sản Bước 4
    const step4Map = {};
    step4Data.forEach(item => {
      step4Map[item.name] = item.assetLink || '';
    });
    const row7Asset = step4Data.find(item => item.id === 7) || { name: 'LinkedIn', assetLink: '' };
    const row7Name = row7Asset.name || 'LinkedIn';

    const siteViewLink = step4Map['Google site view'] || '';
    const myMapsLink = step4Map['Google My Maps'] || '';
    const gmbLink = step4Map['GMB post'] || '';
    const youtubeLink = step4Map['Youtube'] || '';
    const twitterLink = step4Map['Twitter'] || '';
    const pinterestLink = step4Map['Pinterest'] || '';
    const row7Link = step4Map[row7Name] || row7Asset.assetLink || '';
    const driveFolderLink = stack.drive_folder || '';
    const sheetLink = stack.sheet_created_url || '';
    const imageFolderLink = stack.image_folder_url || '';

    // Khôi phục kết quả PDF cũ để có đầy đủ link PDF của cả 5 file
    const prevPdfResults = stack.pdf_results ? JSON.parse(stack.pdf_results) : [];
    
    // Khởi tạo bảng kết quả tạm thời
    const tempResultsMap = {};
    // Đổ kết quả cũ vào
    prevPdfResults.forEach(r => {
      tempResultsMap[r.keyField] = r;
    });
    // Đặt mặc định cho các key chưa có
    targetPdfKeys.forEach(k => {
      if (!tempResultsMap[k]) {
        tempResultsMap[k] = { keyField: k, title: keywords[k] || k, status: 'pending', pdfUrl: '', pdfFileId: '' };
      }
    });

    // --- GIAI ĐOẠN 1: TẠO FILE PDF SONG SONG ---
    const createPdfSingle = async (keyField) => {
      const relatedAsset = assets.find(a => a.keyField === keyField);
      if (!relatedAsset || !relatedAsset.driveUrl) {
        return { keyField, status: 'error', message: 'Không tìm thấy file Docs tương ứng đã tạo ở Bước 3!' };
      }

      const docFileId = extractFileId(relatedAsset.driveUrl);
      if (!docFileId) {
        return { keyField, status: 'error', message: 'Không trích xuất được file ID của Google Docs!' };
      }

      const pdfName = keywords[keyField] || relatedAsset.title || keyField;

      try {
        // Tải Docs dưới dạng PDF stream
        const exportRes = await drive.files.export({
          fileId: docFileId,
          mimeType: 'application/pdf'
        }, { responseType: 'stream' });

        // Upload PDF lên Drive chính
        const uploadRes = await drive.files.create({
          requestBody: {
            name: pdfName,
            parents: [parentFolderId]
          },
          media: {
            mimeType: 'application/pdf',
            body: exportRes.data
          },
          fields: 'id, webViewLink'
        });

        return {
          keyField,
          title: pdfName,
          status: 'success',
          pdfUrl: uploadRes.data.webViewLink,
          pdfFileId: uploadRes.data.id
        };
      } catch (err) {
        console.error(`Lỗi tạo PDF cho ${keyField}:`, err.message);
        return {
          keyField,
          title: pdfName,
          status: 'error',
          message: `Lỗi API Google: ${err.message}`
        };
      }
    };

    // Chạy song song tạo PDF cho các target key được yêu cầu
    const newPdfOutputs = await Promise.all(runKeys.map(k => createPdfSingle(k)));
    
    // Cập nhật kết quả Giai đoạn 1 vào tempResultsMap
    newPdfOutputs.forEach(out => {
      tempResultsMap[out.keyField] = out;
    });

    // --- GIAI ĐOẠN 2: CHÈN COMMENT LẦN LƯỢT CHO CÁC FILE PDF THÀNH CÔNG ---
    
    // Dựng Comment 1
    const comment1Lines = [
      `Website: ${stack.url || ''}`,
      `Google site view: ${siteViewLink}`,
      `Google My Maps: ${myMapsLink}`,
      `GMB post: ${gmbLink}`,
      `Youtube: ${youtubeLink}`,
      `Twitter: ${twitterLink}`,
      `Pinterest: ${pinterestLink}`,
      `${row7Name}: ${row7Link}`,
      `Drive Folder: ${driveFolderLink}`,
      `Google Sheet link: ${sheetLink}`,
      `Drive folder image: ${imageFolderLink}`
    ];
    const comment1Text = comment1Lines.join('\n');

    // Dựng Comment 2
    const comment2Lines = targetPdfKeys.map(k => keywords[k] || k);
    const comment2Text = comment2Lines.join('\n');

    // Dựng Comment 3 (Gồm link PDF của cả 5 file đã tạo)
    const comment3Lines = targetPdfKeys.map(k => tempResultsMap[k]?.pdfUrl).filter(url => url);
    const comment3Text = comment3Lines.join('\n');

    // Duyệt qua các runKeys, nếu có trạng thái success thì tiến hành chèn comment
    for (const keyField of runKeys) {
      const item = tempResultsMap[keyField];
      if (item.status !== 'success' || !item.pdfFileId) continue;

      try {
        // Comment 1: Liên kết thực thể
        await drive.comments.create({
          fileId: item.pdfFileId,
          fields: 'id',
          requestBody: { content: comment1Text }
        });

        // Comment 2: 5 Từ khóa LSI
        await drive.comments.create({
          fileId: item.pdfFileId,
          fields: 'id',
          requestBody: { content: comment2Text }
        });

        // Comment 3: 5 Link file PDF
        if (comment3Text.trim()) {
          await drive.comments.create({
            fileId: item.pdfFileId,
            fields: 'id',
            requestBody: { content: comment3Text }
          });
        }
      } catch (err) {
        console.error(`Gặp lỗi khi tạo comment cho ${keyField}:`, err.message);
        tempResultsMap[keyField].status = 'error';
        tempResultsMap[keyField].message = `Lỗi chèn comment: ${err.message}`;
      }
    }

    // Đổ kết quả ra mảng và lưu vào SQLite
    const finalPdfResults = targetPdfKeys.map(k => tempResultsMap[k]);
    await query.run(
      'UPDATE google_stacks SET pdf_results = ? WHERE id = ?',
      [JSON.stringify(finalPdfResults), id]
    );

    const successCount = finalPdfResults.filter(r => r.status === 'success').length;
    const errorCount = finalPdfResults.filter(r => r.status === 'error').length;

    res.json({
      message: `Đã tối ưu xong PDF! Thành công: ${successCount}, Thất bại: ${errorCount}`,
      results: finalPdfResults
    });

  } catch (error) {
    console.error('Lỗi khi tạo/tối ưu PDF:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper: Trích xuất Calendar ID từ link lịch chia sẻ
function extractCalendarId(url) {
  if (!url) return null;
  if (!url.includes('calendar.google.com')) {
    return url.trim();
  }
  try {
    const urlObj = new URL(url);
    const src = urlObj.searchParams.get('src');
    if (src) return decodeURIComponent(src);
  } catch (e) {
    const match = url.match(/[?&]src=([^&]+)/);
    if (match && match[1]) return decodeURIComponent(match[1]);
  }
  return null;
}

// Helper: Chuyển đổi JSON Google Docs sang HTML cơ bản cho Calendar
function convertDocToHtml(doc) {
  let html = '';
  if (!doc.body || !doc.body.content) return '';
  
  doc.body.content.forEach(element => {
    if (element.paragraph && element.paragraph.elements) {
      let paraHtml = '';
      element.paragraph.elements.forEach(el => {
        if (el.textRun && el.textRun.content) {
          let text = el.textRun.content;
          text = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
          
          const style = el.textRun.textStyle || {};
          if (style.bold) text = `<b>${text}</b>`;
          if (style.italic) text = `<i>${text}</i>`;
          if (style.underline) text = `<u>${text}</u>`;
          if (style.link && style.link.url) {
            text = `<a href="${style.link.url}">${text}</a>`;
          }
          paraHtml += text;
        }
      });
      
      if (paraHtml.trim() !== '') {
        html += paraHtml.replace(/\n$/, '<br/>');
      } else {
        html += '<br/>';
      }
    }
  });
  return html;
}

// Helper: Tạo 3 comments lần lượt cho tệp Drive
async function createFileComments(drive, fileId, comments) {
  for (const content of comments) {
    if (!content || !content.trim()) continue;
    try {
      await drive.comments.create({
        fileId: fileId,
        fields: 'id',
        requestBody: {
          content: content
        }
      });
    } catch (err) {
      console.error(`Lỗi khi tạo comment cho file ${fileId}:`, err.message);
    }
  }
}

// API: Tối ưu hóa Google Sheet LSI 10 (Bước 5 - Button 3)
app.post('/api/google-stacks/optimize-sheet/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const stack = await query.get('SELECT * FROM google_stacks WHERE id = ?', [id]);
    if (!stack) return res.status(404).json({ error: 'Không tìm thấy bộ Google Stack' });

    const keywords = stack.keywords ? JSON.parse(stack.keywords) : {};
    const assets = stack.assets ? JSON.parse(stack.assets) : [];
    const step4Data = stack.step4_data ? JSON.parse(stack.step4_data) : [];
    const step4Images = stack.step4_images ? JSON.parse(stack.step4_images) : [];

    // 1. Tìm thông tin Google Sheet (lsi_10_spreadsheet)
    const sheetAsset = assets.find(a => a.keyField === 'lsi_10_spreadsheet');
    if (!sheetAsset || !sheetAsset.driveUrl) {
      return res.status(400).json({ error: 'Không tìm thấy Google Sheet tương ứng của LSI 10 được tạo ở Bước 3!' });
    }

    const spreadsheetId = extractFileId(sheetAsset.driveUrl);
    if (!spreadsheetId) {
      return res.status(400).json({ error: 'Không trích xuất được Spreadsheet ID!' });
    }

    // Google API clients
    const oauth2Client = await getGoogleOAuthClient(stack.project_id);
    const sheets = google.sheets({ version: 'v4', auth: oauth2Client });
    const docs = google.docs({ version: 'v1', auth: oauth2Client });

    // 2. Tìm file Docs của lsi_10 để lấy bài viết gốc thô
    const docAsset = assets.find(a => a.keyField === 'lsi_10');
    let rawDocText = '';
    if (docAsset && docAsset.driveUrl) {
      const docFileId = extractFileId(docAsset.driveUrl);
      if (docFileId) {
        try {
          const docData = await docs.documents.get({ documentId: docFileId });
          const freshDoc = docData.data;
          const namedRanges = freshDoc.namedRanges || {};
          const optRange = namedRanges['opt_zone']?.namedRanges[0]?.ranges?.[0];
          const relRange = namedRanges['rel_zone']?.namedRanges[0]?.ranges?.[0];

          if (freshDoc.body && freshDoc.body.content) {
            freshDoc.body.content.forEach(element => {
              if (element.paragraph && element.paragraph.elements) {
                const isInsideOpt = optRange && (element.startIndex >= optRange.startIndex && element.endIndex <= optRange.endIndex);
                const isInsideRel = relRange && (element.startIndex >= relRange.startIndex && element.endIndex <= relRange.endIndex);

                if (!isInsideOpt && !isInsideRel) {
                  element.paragraph.elements.forEach(el => {
                    if (el.textRun && el.textRun.content) {
                      rawDocText += el.textRun.content;
                    }
                  });
                }
              }
            });
          }
        } catch (docErr) {
          console.error("Lỗi khi đọc file Docs của LSI 10:", docErr.message);
        }
      }
    }

    // 3. Chuẩn bị dữ liệu điền vào Sheet
    const lsi10Val = keywords.lsi_10 || 'LSI keywords 10';
    const lsi11Val = keywords.lsi_11 || 'LSI keywords 11';
    const lsi12Val = keywords.lsi_12 || 'LSI keywords 12';
    const lsi13Val = keywords.lsi_13 || 'LSI keywords 13';
    const lsi14Val = keywords.lsi_14 || 'LSI keywords 14';

    const keyChinhVal = keywords.key_chinh || stack.main_key || 'Key chính';
    const keyChinhLocalVal = keywords.key_chinh_local || 'Key chính + Local';
    const lsi1Val = keywords.lsi_1 || 'LSI keywords 1';
    const lsi2Val = keywords.lsi_2 || 'LSI keywords 2';
    const lsi3Val = keywords.lsi_3 || 'LSI keywords 3';
    const lsi4Val = keywords.lsi_4 || 'LSI keywords 4';

    // Map các link thực thể từ Step 4
    const step4Map = {};
    step4Data.forEach(item => {
      step4Map[item.name] = item.assetLink || '';
    });
    const row7Asset = step4Data.find(item => item.id === 7) || { name: 'LinkedIn', assetLink: '' };
    const row7Name = row7Asset.name || 'LinkedIn';

    const siteViewLink = step4Map['Google site view'] || '';
    const myMapsLink = step4Map['Google My Maps'] || '';
    const gmbLink = step4Map['GMB post'] || '';
    const youtubeLink = step4Map['Youtube'] || '';
    const twitterLink = step4Map['Twitter'] || '';
    const pinterestLink = step4Map['Pinterest'] || '';
    const row7Link = step4Map[row7Name] || row7Asset.assetLink || '';
    const driveFolderLink = stack.drive_folder || '';
    const sheetLink = stack.sheet_created_url || '';
    const imageFolderLink = stack.image_folder_url || '';

    // LSI 10-14 links
    const lsi10SheetUrl = sheetAsset.driveUrl;
    const lsi11SlideUrl = assets.find(a => a.keyField === 'lsi_11_presentation')?.driveUrl || '';
    const lsi12FormUrl = assets.find(a => a.keyField === 'lsi_12_form')?.driveUrl || '';
    const lsi13DrawingUrl = step4Map['Google Drawing'] || '';
    const lsi14CalendarUrl = step4Map['Calendar'] || '';

    // Link pub của chính Google Sheet này (lấy link 2PACX- từ Google API)
    let ownPubLink = '';
    try {
      const driveV2 = google.drive({ version: 'v2', auth: oauth2Client });
      const revList = await driveV2.revisions.list({ fileId: spreadsheetId });
      const revisions = revList.data.items || [];
      const revisionId = revisions.length > 0 ? revisions[revisions.length - 1].id : '1';
      
      const revUpdate = await driveV2.revisions.update({
        fileId: spreadsheetId,
        revisionId: revisionId,
        resource: {
          published: true,
          publishAuto: true
        }
      });
      ownPubLink = revUpdate.data.publishedLink || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/pubhtml`;
    } catch (revErr) {
      console.error("Lỗi lấy link pub cho Sheet:", revErr.message);
      ownPubLink = sheetAsset.pubUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/pubhtml`;
    }

    // 4. Viết các lệnh API batchUpdate cho Google Sheet
    // Hàng 2 chèn ảnh từ B2 đến M2: index cột từ 1 đến 12
    const imageValues = [];
    for (let i = 0; i < 12; i++) {
      const img = step4Images[i];
      if (img && img.driveFileId) {
        imageValues.push(`=IMAGE("https://lh3.googleusercontent.com/d/${img.driveFileId}")`);
      } else {
        imageValues.push('');
      }
    }

    // Xây dựng danh sách ô cần ghi
    // Sheet mặc định có sheetId: 0
    const sheetId = 0;
    const requests = [];

    const cellDataRows = Array.from({ length: 14 }, () => Array.from({ length: 13 }, () => ({
      userEnteredValue: {}
    })));

    // Điền A1
    cellDataRows[0][0].userEnteredValue = { stringValue: lsi10Val };
    cellDataRows[0][0].userEnteredFormat = { textFormat: { bold: true } };

    // Điền A2
    cellDataRows[1][0].userEnteredValue = { stringValue: rawDocText || 'Nội dung bài viết LSI 10 trống' };
    cellDataRows[1][0].userEnteredFormat = { wrapStrategy: "WRAP" };

    // Điền ảnh từ B2 đến M2 (Row index 1, Col index 1 đến 12)
    for (let i = 0; i < 12; i++) {
      cellDataRows[1][i + 1].userEnteredValue = { formulaValue: imageValues[i] };
    }

    // Điền A3:A14 (Row index 2 đến 13)
    const labelA = [
      `${lsi10Val}:`,
      "Website:",
      "Google site view:",
      "Google My Maps:",
      "GMB post:",
      "Youtube:",
      "Twitter:",
      "Pinterest:",
      `${row7Name}:`,
      "Drive Folder:",
      "Google Sheet link:",
      "Drive folder image:"
    ];
    labelA.forEach((lbl, idx) => {
      cellDataRows[idx + 2][0].userEnteredValue = { stringValue: lbl };
      cellDataRows[idx + 2][0].userEnteredFormat = { textFormat: { bold: true } };
    });

    // Điền B3:B14 (Row index 2 đến 13)
    const linksB = [
      { url: ownPubLink, anchor: lsi10Val },
      { url: stack.url || '', anchor: keyChinhVal },
      { url: siteViewLink, anchor: keyChinhVal },
      { url: myMapsLink, anchor: keyChinhLocalVal },
      { url: gmbLink, anchor: keyChinhVal },
      { url: youtubeLink, anchor: lsi1Val },
      { url: twitterLink, anchor: lsi2Val },
      { url: pinterestLink, anchor: lsi3Val },
      { url: row7Link, anchor: lsi4Val },
      { url: driveFolderLink, anchor: keyChinhVal },
      { url: sheetLink, anchor: keyChinhVal },
      { url: imageFolderLink, anchor: keyChinhVal }
    ];
    linksB.forEach((item, idx) => {
      if (item.url) {
        // Sử dụng dấu chấm phẩy ';' thay vì dấu phẩy ',' cho Google Sheets vùng Việt Nam
        cellDataRows[idx + 2][1].userEnteredValue = { formulaValue: `=HYPERLINK("${item.url}"; "${item.anchor.replace(/"/g, '""')}")` };
      } else {
        cellDataRows[idx + 2][1].userEnteredValue = { stringValue: '' };
      }
    });

    // Điền C3 (Row index 2, Col index 2)
    cellDataRows[2][2].userEnteredValue = { stringValue: "Thông tin liên quan" };
    cellDataRows[2][2].userEnteredFormat = { textFormat: { bold: true }, horizontalAlignment: "CENTER" };

    // Điền C4:C8 (Row index 3 đến 7)
    const linksC = [
      { url: lsi10SheetUrl, anchor: lsi10Val },
      { url: lsi11SlideUrl, anchor: lsi11Val },
      { url: lsi12FormUrl, anchor: lsi12Val },
      { url: lsi13DrawingUrl, anchor: lsi13Val },
      { url: lsi14CalendarUrl, anchor: lsi14Val }
    ];
    linksC.forEach((item, idx) => {
      if (item.url) {
        cellDataRows[idx + 3][2].userEnteredValue = { formulaValue: `=HYPERLINK("${item.url}"; "${item.anchor.replace(/"/g, '""')}")` };
      } else {
        cellDataRows[idx + 3][2].userEnteredValue = { stringValue: '' };
      }
    });

    // Cập nhật giá trị vào các ô (updateCells)
    requests.push({
      updateCells: {
        rows: cellDataRows.map(r => ({ values: r })),
        fields: "userEnteredValue,userEnteredFormat(textFormat,wrapStrategy,horizontalAlignment)",
        range: {
          sheetId: sheetId,
          startRowIndex: 0,
          endRowIndex: 14,
          startColumnIndex: 0,
          endColumnIndex: 13
        }
      }
    });

    // Thêm viền sẫm màu (borders) cho toàn bộ vùng làm việc (A1:M14)
    requests.push({
      updateBorders: {
        range: {
          sheetId: sheetId,
          startRowIndex: 0,
          endRowIndex: 14,
          startColumnIndex: 0,
          endColumnIndex: 13
        },
        top: { style: "SOLID", width: 1, color: { red: 0.7, green: 0.7, blue: 0.7 } },
        bottom: { style: "SOLID", width: 1, color: { red: 0.7, green: 0.7, blue: 0.7 } },
        left: { style: "SOLID", width: 1, color: { red: 0.7, green: 0.7, blue: 0.7 } },
        right: { style: "SOLID", width: 1, color: { red: 0.7, green: 0.7, blue: 0.7 } },
        innerHorizontal: { style: "SOLID", width: 1, color: { red: 0.8, green: 0.8, blue: 0.8 } },
        innerVertical: { style: "SOLID", width: 1, color: { red: 0.8, green: 0.8, blue: 0.8 } }
      }
    });

    // Đặt kích thước hàng 2 cao 250px (Row index 1)
    requests.push({
      updateDimensionProperties: {
        range: {
          sheetId: sheetId,
          dimension: "ROWS",
          startIndex: 1,
          endIndex: 2
        },
        properties: { pixelSize: 250 },
        fields: "pixelSize"
      }
    });

    // Đặt kích thước cột A rộng 350px (Col index 0)
    requests.push({
      updateDimensionProperties: {
        range: {
          sheetId: sheetId,
          dimension: "COLUMNS",
          startIndex: 0,
          endIndex: 1
        },
        properties: { pixelSize: 350 },
        fields: "pixelSize"
      }
    });

    // Đặt kích thước cột B đến M rộng 250px (Col index 1 đến 13)
    requests.push({
      updateDimensionProperties: {
        range: {
          sheetId: sheetId,
          dimension: "COLUMNS",
          startIndex: 1,
          endIndex: 13
        },
        properties: { pixelSize: 250 },
        fields: "pixelSize"
      }
    });

    // Thực hiện batchUpdate Google Sheets
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: spreadsheetId,
      requestBody: { requests }
    });

    const sheetResult = {
      keyField: 'lsi_10_spreadsheet',
      title: lsi10Val,
      status: 'success',
      driveUrl: sheetAsset.driveUrl,
      optimizedAt: new Date().toISOString()
    };

    // --- GIAI ĐOẠN 5: TỐI ƯU HÓA GOOGLE SLIDES (LSI 11) ---
    const slideAsset = assets.find(a => a.keyField === 'lsi_11_presentation');
    let slideResult = null;
    
    if (slideAsset && slideAsset.driveUrl) {
      const presentationId = extractFileId(slideAsset.driveUrl);
      if (presentationId) {
        try {
          const slidesApi = google.slides({ version: 'v1', auth: oauth2Client });
          
          // 1. Đọc bài viết gốc của Docs lsi_11
          const lsi11DocAsset = assets.find(a => a.keyField === 'lsi_11');
          let rawLsi11Text = '';
          if (lsi11DocAsset && lsi11DocAsset.driveUrl) {
            const lsi11DocId = extractFileId(lsi11DocAsset.driveUrl);
            if (lsi11DocId) {
              try {
                const docData = await docs.documents.get({ documentId: lsi11DocId });
                const freshDoc = docData.data;
                const namedRanges = freshDoc.namedRanges || {};
                const optRange = namedRanges['opt_zone']?.namedRanges[0]?.ranges?.[0];
                const relRange = namedRanges['rel_zone']?.namedRanges[0]?.ranges?.[0];

                if (freshDoc.body && freshDoc.body.content) {
                  freshDoc.body.content.forEach(element => {
                    if (element.paragraph && element.paragraph.elements) {
                      const isInsideOpt = optRange && (element.startIndex >= optRange.startIndex && element.endIndex <= optRange.endIndex);
                      const isInsideRel = relRange && (element.startIndex >= relRange.startIndex && element.endIndex <= relRange.endIndex);

                      if (!isInsideOpt && !isInsideRel) {
                        element.paragraph.elements.forEach(el => {
                          if (el.textRun && el.textRun.content) {
                            rawLsi11Text += el.textRun.content;
                          }
                        });
                      }
                    }
                  });
                }
              } catch (docErr) {
                console.error("Lỗi khi đọc file Docs của LSI 11:", docErr.message);
              }
            }
          }
          if (!rawLsi11Text) rawLsi11Text = 'Nội dung bài viết LSI 11 trống.';

          // 2. Lấy danh sách trang Slide hiện tại
          const presData = await slidesApi.presentations.get({ presentationId });
          const existingSlides = presData.data.slides || [];
          const numSlides = existingSlides.length;

          const slideRequests = [];

          // 3. Tạo các slide mới cho đủ 14 slide
          const neededSlides = 14;
          const slideIds = [];
          
          // Thêm slide đầu tiên có sẵn
          if (numSlides > 0) {
            slideIds.push(existingSlides[0].objectId);
          }

          // Tạo thêm các slide mới
          for (let i = numSlides; i < neededSlides; i++) {
            const newSlideId = `slide_page_${Date.now()}_${i}`;
            slideRequests.push({
              createSlide: {
                objectId: newSlideId,
                insertionIndex: i
              }
            });
            slideIds.push(newSlideId);
          }

          // Để các slide mới được tạo trước, ta thực hiện đợt batchUpdate 1
          if (slideRequests.length > 0) {
            await slidesApi.presentations.batchUpdate({
              presentationId,
              requestBody: { requests: slideRequests }
            });
          }

          // Lấy lại danh sách slide thực tế từ Google để đảm bảo ID chính xác
          const freshPresData = await slidesApi.presentations.get({ presentationId });
          const finalSlides = freshPresData.data.slides || [];
          const finalSlideIds = finalSlides.map(s => s.objectId);

          const contentRequests = [];

          // --- THIẾT LẬP SLIDE 1 (TRANG BÌA) ---
          const slide1Id = finalSlideIds[0];
          
          // Xóa tất cả các phần tử mặc định hiện có trên Slide 1 để tạo trang trống
          const slide1 = finalSlides[0];
          if (slide1.pageElements) {
            slide1.pageElements.forEach(el => {
              contentRequests.push({ deleteObject: { objectId: el.objectId } });
            });
          }

          // Tạo 3 Text Box trên Slide 1
          const box1Id = `slide1_box1_${Date.now()}`;
          const box2Id = `slide1_box2_${Date.now()}`;
          const box3Id = `slide1_box3_${Date.now()}`;

          // Box 1 (Tiêu đề lớn)
          contentRequests.push({
            createShape: {
              objectId: box1Id,
              shapeType: 'RECTANGLE',
              elementProperties: {
                pageObjectId: slide1Id,
                size: {
                  width: { magnitude: 640, unit: 'PT' },
                  height: { magnitude: 70, unit: 'PT' }
                },
                transform: {
                  scaleX: 1,
                  scaleY: 1,
                  translateX: 40,
                  translateY: 20,
                  unit: 'PT'
                }
              }
            }
          });
          // Xóa viền và nền của Shape để giống Textbox
          contentRequests.push({
            updateShapeProperties: {
              objectId: box1Id,
              shapeProperties: {
                outline: { propertyState: 'NOT_RENDERED' },
                shapeBackgroundFill: { propertyState: 'NOT_RENDERED' }
              },
              fields: 'outline,shapeBackgroundFill'
            }
          });

          // Box 2 (Liên kết thực thể)
          contentRequests.push({
            createShape: {
              objectId: box2Id,
              shapeType: 'RECTANGLE',
              elementProperties: {
                pageObjectId: slide1Id,
                size: {
                  width: { magnitude: 310, unit: 'PT' },
                  height: { magnitude: 280, unit: 'PT' }
                },
                transform: {
                  scaleX: 1,
                  scaleY: 1,
                  translateX: 40,
                  translateY: 100,
                  unit: 'PT'
                }
              }
            }
          });
          contentRequests.push({
            updateShapeProperties: {
              objectId: box2Id,
              shapeProperties: {
                outline: { propertyState: 'NOT_RENDERED' },
                shapeBackgroundFill: { propertyState: 'NOT_RENDERED' }
              },
              fields: 'outline,shapeBackgroundFill'
            }
          });

          // Box 3 (Tài sản chéo)
          contentRequests.push({
            createShape: {
              objectId: box3Id,
              shapeType: 'RECTANGLE',
              elementProperties: {
                pageObjectId: slide1Id,
                size: {
                  width: { magnitude: 310, unit: 'PT' },
                  height: { magnitude: 280, unit: 'PT' }
                },
                transform: {
                  scaleX: 1,
                  scaleY: 1,
                  translateX: 370,
                  translateY: 100,
                  unit: 'PT'
                }
              }
            }
          });
          contentRequests.push({
            updateShapeProperties: {
              objectId: box3Id,
              shapeProperties: {
                outline: { propertyState: 'NOT_RENDERED' },
                shapeBackgroundFill: { propertyState: 'NOT_RENDERED' }
              },
              fields: 'outline,shapeBackgroundFill'
            }
          });

          // Ghi văn bản vào Box 1
          const lsi11Val = keywords.lsi_11 || 'LSI keywords 11';
          contentRequests.push({
            insertText: {
              objectId: box1Id,
              text: lsi11Val
            }
          });
          // Định dạng Box 1 cỡ chữ 52pt, in đậm, căn giữa
          contentRequests.push({
            updateTextStyle: {
              objectId: box1Id,
              style: {
                fontSize: { magnitude: 52, unit: 'PT' },
                bold: true
              },
              fields: 'fontSize,bold'
            }
          });
          contentRequests.push({
            updateParagraphStyle: {
              objectId: box1Id,
              style: {
                alignment: 'CENTER'
              },
              fields: 'alignment'
            }
          });

          // Xây dựng văn bản & Index Hyperlink cho Box 2 (Liên kết thực thể)
          const itemsB = [
            { label: 'Website: ', url: stack.url || '', anchor: keyChinhVal },
            { label: 'Google site view: ', url: siteViewLink, anchor: keyChinhVal },
            { label: 'Google My Maps: ', url: myMapsLink, anchor: keyChinhLocalVal },
            { label: 'GMB post: ', url: gmbLink, anchor: keyChinhVal },
            { label: 'Youtube: ', url: youtubeLink, anchor: lsi1Val },
            { label: 'Twitter: ', url: twitterLink, anchor: lsi2Val },
            { label: 'Pinterest: ', url: pinterestLink, anchor: lsi3Val },
            { label: `${row7Name}: `, url: row7Link, anchor: lsi4Val },
            { label: 'Drive Folder: ', url: driveFolderLink, anchor: keyChinhVal },
            { label: 'Google Sheet link: ', url: sheetLink, anchor: keyChinhVal },
            { label: 'Drive folder image: ', url: imageFolderLink, anchor: keyChinhVal }
          ];

          let textB = '';
          const stylesB = [];

          itemsB.forEach(item => {
            if (item.url) {
              const startIdx = textB.length + item.label.length;
              const endIdx = startIdx + item.anchor.length;
              textB += `${item.label}${item.anchor}\n`;
              stylesB.push({ startIdx, endIdx, url: item.url });
            } else {
              textB += `${item.label}\n`;
            }
          });

          // Ghi text B vào Box 2
          contentRequests.push({
            insertText: {
              objectId: box2Id,
              text: textB
            }
          });
          // Set font size 11 cho toàn bộ Box 2 và căn lề trái
          contentRequests.push({
            updateTextStyle: {
              objectId: box2Id,
              style: {
                fontSize: { magnitude: 11, unit: 'PT' }
              },
              fields: 'fontSize'
            }
          });
          contentRequests.push({
            updateParagraphStyle: {
              objectId: box2Id,
              style: {
                alignment: 'START'
              },
              fields: 'alignment'
            }
          });
          // Apply link cho từng neo từ khóa của Box 2
          stylesB.forEach(st => {
            contentRequests.push({
              updateTextStyle: {
                objectId: box2Id,
                textRange: {
                  type: 'FIXED_RANGE',
                  startIndex: st.startIdx,
                  endIndex: st.endIdx
                },
                style: {
                  link: { url: st.url },
                  underline: true
                },
                fields: 'link,underline'
              }
            });
          });

          // Xây dựng văn bản & Index Hyperlink cho Box 3 (Tài sản chéo)
          const itemsC = [
            { label: 'Google sheet: ', url: lsi10SheetUrl, anchor: lsi10Val },
            { label: 'Google slide: ', url: slideAsset.driveUrl || '', anchor: lsi11Val },
            { label: 'Google Forms: ', url: lsi12FormUrl, anchor: lsi12Val },
            { label: 'Google Drawing: ', url: lsi13DrawingUrl, anchor: lsi13Val },
            { label: 'Calendar: ', url: lsi14CalendarUrl, anchor: lsi14Val }
          ];

          let textC = '';
          const stylesC = [];

          itemsC.forEach(item => {
            if (item.url) {
              const startIdx = textC.length + item.label.length;
              const endIdx = startIdx + item.anchor.length;
              textC += `${item.label}${item.anchor}\n`;
              stylesC.push({ startIdx, endIdx, url: item.url });
            } else {
              textC += `${item.label}\n`;
            }
          });

          // Ghi text C vào Box 3
          contentRequests.push({
            insertText: {
              objectId: box3Id,
              text: textC
            }
          });
          // Set font size 11 cho toàn bộ Box 3 và căn lề trái
          contentRequests.push({
            updateTextStyle: {
              objectId: box3Id,
              style: {
                fontSize: { magnitude: 11, unit: 'PT' }
              },
              fields: 'fontSize'
            }
          });
          contentRequests.push({
            updateParagraphStyle: {
              objectId: box3Id,
              style: {
                alignment: 'START'
              },
              fields: 'alignment'
            }
          });
          // Apply link cho từng neo từ khóa của Box 3
          stylesC.forEach(st => {
            contentRequests.push({
              updateTextStyle: {
                objectId: box3Id,
                textRange: {
                  type: 'FIXED_RANGE',
                  startIndex: st.startIdx,
                  endIndex: st.endIdx
                },
                style: {
                  link: { url: st.url },
                  underline: true
                },
                fields: 'link,underline'
              }
            });
          });

          // --- SPEAKER NOTES CHO SLIDE 1 ---
          const keysList = Object.keys(keywords).map(k => keywords[k]).filter(val => typeof val === 'string' && val.trim() !== '');
          const notesText = keysList.join('\n');
          if (notesText) {
            try {
              const slide1NotesPageId = slide1.slideProperties?.notesPage?.objectId || `${slide1Id}_notes`;
              const notesPageData = await slidesApi.presentations.pages.get({
                presentationId,
                pageId: slide1NotesPageId
              });
              const notesElements = notesPageData.data.pageElements || [];
              const notesBody = notesElements.find(el => el.shape && el.shape.placeholder && (el.shape.placeholder.type === 'SPEAKER_NOTES' || el.shape.placeholder.type === 'BODY'));
              if (notesBody) {
                contentRequests.push({
                  insertText: {
                    objectId: notesBody.objectId,
                    text: notesText
                  }
                });
              }
            } catch (notesErr) {
              console.error("Không tìm thấy placeholder Speaker Notes trên Slide 1:", notesErr.message);
            }
          }

          // --- THIẾT LẬP SLIDE 2 (BÀI VIẾT THÔ) ---
          const slide2Id = finalSlideIds[1];
          const slide2 = finalSlides[1];
          
          if (slide2 && slide2.pageElements) {
            slide2.pageElements.forEach(el => {
              contentRequests.push({ deleteObject: { objectId: el.objectId } });
            });
          }

          const slide2BoxId = `slide2_box_${Date.now()}`;
          contentRequests.push({
            createShape: {
              objectId: slide2BoxId,
              shapeType: 'RECTANGLE',
              elementProperties: {
                pageObjectId: slide2Id,
                size: {
                  width: { magnitude: 640, unit: 'PT' },
                  height: { magnitude: 325, unit: 'PT' }
                },
                transform: {
                  scaleX: 1,
                  scaleY: 1,
                  translateX: 40,
                  translateY: 40,
                  unit: 'PT'
                }
              }
            }
          });
          contentRequests.push({
            updateShapeProperties: {
              objectId: slide2BoxId,
              shapeProperties: {
                outline: { propertyState: 'NOT_RENDERED' },
                shapeBackgroundFill: { propertyState: 'NOT_RENDERED' }
              },
              fields: 'outline,shapeBackgroundFill'
            }
          });

          contentRequests.push({
            insertText: {
              objectId: slide2BoxId,
              text: rawLsi11Text
            }
          });
          contentRequests.push({
            updateTextStyle: {
              objectId: slide2BoxId,
              style: {
                fontSize: { magnitude: 10, unit: 'PT' }
              },
              fields: 'fontSize'
            }
          });
          contentRequests.push({
            updateParagraphStyle: {
              objectId: slide2BoxId,
              style: {
                alignment: 'START'
              },
              fields: 'alignment'
            }
          });

          // --- THIẾT LẬP SLIDE 3 ĐẾN SLIDE 14 (NHÚNG 12 ẢNH) ---
          for (let i = 0; i < 12; i++) {
            const slideId = finalSlideIds[i + 2];
            const slide = finalSlides[i + 2];
            if (!slideId) continue;

            if (slide && slide.pageElements) {
              slide.pageElements.forEach(el => {
                contentRequests.push({ deleteObject: { objectId: el.objectId } });
              });
            }

            const img = step4Images[i];
            if (img && img.driveFileId) {
              const directImgUrl = `https://lh3.googleusercontent.com/d/${img.driveFileId}`;
              contentRequests.push({
                createImage: {
                  elementProperties: {
                    pageObjectId: slideId,
                    size: {
                      width: { magnitude: 640, unit: 'PT' },
                      height: { magnitude: 325, unit: 'PT' }
                    },
                    transform: {
                      scaleX: 1,
                      scaleY: 1,
                      translateX: 40,
                      translateY: 40,
                      unit: 'PT'
                    }
                  },
                  url: directImgUrl
                }
              });
            }
          }

          // Thực hiện tất cả các batchUpdate của Slide
          if (contentRequests.length > 0) {
            await slidesApi.presentations.batchUpdate({
              presentationId,
              requestBody: { requests: contentRequests }
            });
          }

          slideResult = {
            keyField: 'lsi_11_presentation',
            title: lsi11Val,
            status: 'success',
            driveUrl: slideAsset.driveUrl,
            optimizedAt: new Date().toISOString()
          };

        } catch (slideErr) {
          console.error("Lỗi khi tối ưu Google Slides:", slideErr);
          slideResult = {
            keyField: 'lsi_11_presentation',
            title: keywords.lsi_11 || 'LSI keywords 11',
            status: 'error',
            message: slideErr.message
          };
        }
      }
    }

    // --- GIAI ĐOẠN 6: TỐI ƯU HÓA GOOGLE FORMS (LSI 12) ---
    // Nạp lại assets mới từ DB vì Slides vừa cập nhật assets
    const freshStack = await query.get('SELECT assets FROM google_stacks WHERE id = ?', [id]);
    const currentAssets = freshStack.assets ? JSON.parse(freshStack.assets) : assets;
    
    const formAsset = currentAssets.find(a => a.keyField === 'lsi_12_form');
    let formResult = null;

    if (formAsset && formAsset.driveUrl) {
      const formId = extractFileId(formAsset.driveUrl);
      if (formId) {
        try {
          const formsApi = google.forms({ version: 'v1', auth: oauth2Client });

          // 1. Đọc bài viết gốc của Docs lsi_12
          const lsi12DocAsset = currentAssets.find(a => a.keyField === 'lsi_12');
          let rawLsi12Text = '';
          if (lsi12DocAsset && lsi12DocAsset.driveUrl) {
            const lsi12DocId = extractFileId(lsi12DocAsset.driveUrl);
            if (lsi12DocId) {
              try {
                const docData = await docs.documents.get({ documentId: lsi12DocId });
                const freshDoc = docData.data;
                const namedRanges = freshDoc.namedRanges || {};
                const optRange = namedRanges['opt_zone']?.namedRanges[0]?.ranges?.[0];
                const relRange = namedRanges['rel_zone']?.namedRanges[0]?.ranges?.[0];

                if (freshDoc.body && freshDoc.body.content) {
                  freshDoc.body.content.forEach(element => {
                    if (element.paragraph && element.paragraph.elements) {
                      const isInsideOpt = optRange && (element.startIndex >= optRange.startIndex && element.endIndex <= optRange.endIndex);
                      const isInsideRel = relRange && (element.startIndex >= relRange.startIndex && element.endIndex <= relRange.endIndex);

                      if (!isInsideOpt && !isInsideRel) {
                        element.paragraph.elements.forEach(el => {
                          if (el.textRun && el.textRun.content) {
                            rawLsi12Text += el.textRun.content;
                          }
                        });
                      }
                    }
                  });
                }
              } catch (docErr) {
                console.error("Lỗi khi đọc file Docs của LSI 12:", docErr.message);
              }
            }
          }
          if (!rawLsi12Text) rawLsi12Text = 'Nội dung bài viết LSI 12 trống.';

          const lsi12Val = keywords.lsi_12 || 'LSI keywords 12';

          // 2. Dựng nội dung mô tả biểu mẫu (Form Description)
          const formDescriptionLines = [
            rawLsi12Text,
            "",
            `Website: ${stack.url || ''}`,
            `Google site view: ${siteViewLink}`,
            `Google My Maps: ${myMapsLink}`,
            `GMB post: ${gmbLink}`,
            `Youtube: ${youtubeLink}`,
            `Twitter: ${twitterLink}`,
            `Pinterest: ${pinterestLink}`,
            `${row7Name}: ${row7Link}`,
            `Drive Folder: ${driveFolderLink}`,
            `Google Sheet link: ${sheetLink}`,
            `Drive folder image: ${imageFolderLink}`,
            "",
            "Thông tin liên quan:",
            `Google sheet: ${lsi10SheetUrl}`,
            `Google slide: ${slideAsset?.driveUrl || ''}`,
            `Google Forms: ${formAsset.driveUrl}`,
            `Google Drawing: ${lsi13DrawingUrl}`,
            `Calendar: ${lsi14CalendarUrl}`
          ];
          const formDescription = formDescriptionLines.join('\n');

          // 3. Lấy thông tin Form hiện tại để xóa sạch câu hỏi
          const existingForm = await formsApi.forms.get({ formId });
          const items = existingForm.data.items || [];
          
          const formRequests = [];

          // Xóa toàn bộ câu hỏi (items) cũ với index giảm dần
          for (let i = items.length - 1; i >= 0; i--) {
            formRequests.push({
              deleteItem: {
                location: {
                  index: i
                }
              }
            });
          }

          // Cập nhật thông tin mô tả biểu mẫu (Form description) và tiêu đề
          formRequests.push({
            updateFormInfo: {
              info: {
                title: lsi12Val,
                description: formDescription
              },
              updateMask: 'title,description'
            }
          });

          // Thực hiện batchUpdate Google Form
          await formsApi.forms.batchUpdate({
            formId: formId,
            requestBody: { requests: formRequests }
          });

          // 4. Lấy link điền form trực tiếp sử dụng ID tệp Drive (tương thích 100% không cần qua responderUri/chuyển hướng)
          const directPubUrl = `https://docs.google.com/forms/d/${formId}/viewform`;

          formResult = {
            keyField: 'lsi_12_form',
            title: lsi12Val,
            status: 'success',
            driveUrl: formAsset.driveUrl, // Trả về link edit gốc
            pubUrl: directPubUrl,         // Trả về link điền trực tiếp cực kỳ ổn định
            optimizedAt: new Date().toISOString()
          };

          // Đồng bộ directPubUrl vào trường pubUrl của Form trong database SQLite
          const updatedAssets = currentAssets.map(a => {
            if (a.keyField === 'lsi_12_form') {
              return { ...a, pubUrl: directPubUrl };
            }
            return a;
          });
          
          await query.run(
            'UPDATE google_stacks SET assets = ? WHERE id = ?',
            [JSON.stringify(updatedAssets), id]
          );

        } catch (formErr) {
          console.error("Lỗi khi tối ưu Google Forms:", formErr);
          formResult = {
            keyField: 'lsi_12_form',
            title: keywords.lsi_12 || 'LSI keywords 12',
            status: 'error',
            message: formErr.message
          };
        }
      }
    }

    // --- GIAI ĐOẠN 8: TỐI ƯU HÓA COMMENTS FILE UPLOAD (VIDEO, SCRIPT, KML) ---
    let uploadCommentsResult = null;
    try {
      const drive = google.drive({ version: 'v3', auth: oauth2Client });
      
      const videoLink = step4Map['Video upload'] || '';
      const scriptLink = step4Map['Script upload'] || '';
      const kmlLink = step4Map['KML upload'] || '';
      
      const videoId = extractFileId(videoLink);
      const scriptId = extractFileId(scriptLink);
      const kmlId = extractFileId(kmlLink);

      // Chuẩn bị nội dung 3 comments
      const comment1 = [
        `Website: ${stack.url || ''}`,
        `Google site view: ${siteViewLink}`,
        `Google My Maps: ${myMapsLink}`,
        `GMB post: ${gmbLink}`,
        `Youtube: ${youtubeLink}`,
        `Twitter: ${twitterLink}`,
        `Pinterest: ${pinterestLink}`,
        `${row7Name}: ${row7Link}`,
        `Drive Folder: ${driveFolderLink}`,
        `Google Sheet link: ${sheetLink}`,
        `Drive folder image: ${imageFolderLink}`
      ].join('\n');

      const keyChinhVal = keywords.key_chinh || stack.main_key || 'Key chính';
      const lsiLocalVal = keywords.key_chinh_local || '';
      const comment2 = `${keyChinhVal}\n${lsiLocalVal}`;

      const comment3 = [videoLink, scriptLink, kmlLink].filter(link => link).join('\n');

      const uploadFiles = [
        { id: videoId, name: 'Video upload' },
        { id: scriptId, name: 'Script upload' },
        { id: kmlId, name: 'KML upload' }
      ].filter(f => f.id);

      // Comment lần lượt cho từng file
      for (const f of uploadFiles) {
        await createFileComments(drive, f.id, [comment1, comment2, comment3]);
      }

      uploadCommentsResult = {
        status: 'success',
        message: `Đã comment tối ưu thành công ${uploadFiles.length} file upload.`
      };
    } catch (commentErr) {
      console.error("Lỗi khi comment file upload:", commentErr);
      uploadCommentsResult = {
        status: 'error',
        message: commentErr.message
      };
    }

    // --- GIAI ĐOẠN 9: TỐI ƯU HÓA COMMENTS 12 HÌNH ẢNH ---
    let imageCommentsResult = null;
    try {
      const drive = google.drive({ version: 'v3', auth: oauth2Client });

      const comment1 = [
        `Website: ${stack.url || ''}`,
        `Google site view: ${siteViewLink}`,
        `Google My Maps: ${myMapsLink}`,
        `GMB post: ${gmbLink}`,
        `Youtube: ${youtubeLink}`,
        `Twitter: ${twitterLink}`,
        `Pinterest: ${pinterestLink}`,
        `${row7Name}: ${row7Link}`,
        `Drive Folder: ${driveFolderLink}`,
        `Google Sheet link: ${sheetLink}`,
        `Drive folder image: ${imageFolderLink}`
      ].join('\n');

      const comment2Lines = [];
      for (let i = 30; i <= 41; i++) {
        comment2Lines.push(keywords[`lsi_${i}`] || `LSI keywords ${i}`);
      }
      const comment2Image = comment2Lines.join('\n');

      const comment3Image = step4Images.map(im => `https://drive.google.com/file/d/${im.driveFileId}/view?usp=drivesdk`).join('\n');

      // Chạy chèn bình luận song song 12 hình ảnh
      await runConcurrent(4, step4Images, async (img) => {
        if (img && img.driveFileId) {
          await createFileComments(drive, img.driveFileId, [comment1, comment2Image, comment3Image]);
        }
      });

      imageCommentsResult = {
        status: 'success',
        message: `Đã comment tối ưu thành công 12 hình ảnh thực thể.`
      };
    } catch (imgCommErr) {
      console.error("Lỗi khi comment hình ảnh:", imgCommErr);
      imageCommentsResult = {
        status: 'error',
        message: imgCommErr.message
      };
    }

    const finalResult = {
      sheetResult,
      slideResult,
      formResult,
      uploadCommentsResult,
      imageCommentsResult
    };

    await query.run(
      'UPDATE google_stacks SET button3_results = ? WHERE id = ?',
      [JSON.stringify(finalResult), id]
    );

    res.json({
      message: 'Tối ưu hóa Google Sheet LSI 10, Slides LSI 11, Forms LSI 12 & Comments thành công!',
      result: finalResult
    });

  } catch (error) {
    console.error('Lỗi khi tối ưu hóa Sheet/Slide:', error);
    res.status(500).json({ error: error.message });
  }
});


// ==========================================
// BƯỚC 6: KHỐI HÀM VÀ API SCALE ĐA NGÔN NGỮ
// ==========================================

// Trình dịch text bằng API miễn phí của Google Translate
async function translateTextFree(text, targetLang) {
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=vi&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data && data[0]) {
      return data[0].map(x => x[0]).join('');
    }
  } catch (err) {
    console.error(`Lỗi dịch free sang ${targetLang}:`, err.message);
  }
  return text;
}

// Trình dịch gộp miễn phí của Google Translate (Batch Translation)
async function translateTextBatch(blocks, targetLang) {
  if (!blocks || blocks.length === 0) return [];
  const delimiter = "\n$$$\n";
  
  // Chia nhỏ mảng blocks thành các chunks để tránh lỗi URL quá dài
  const chunks = [];
  let currentChunk = [];
  let currentLength = 0;
  
  for (const block of blocks) {
    const estimatedLen = encodeURIComponent(block + delimiter).length;
    if (currentLength + estimatedLen > 3000 && currentChunk.length > 0) {
      chunks.push(currentChunk);
      currentChunk = [block];
      currentLength = estimatedLen;
    } else {
      currentChunk.push(block);
      currentLength += estimatedLen;
    }
  }
  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }

  const results = [];
  for (const chunk of chunks) {
    const chunkMerged = chunk.join(delimiter);
    const translatedMerged = await translateTextFree(chunkMerged, targetLang);
    const translatedBlocks = translatedMerged.split(/\s*\n\s*\$\$\$\s*\n\s*/).map(s => s.trim());
    
    // Nếu số lượng tách ra không khớp, ta chạy fallback dịch tuần tự từng câu
    if (translatedBlocks.length !== chunk.length) {
      console.warn(`Lệch số lượng dịch gộp [${targetLang}]: Gốc ${chunk.length}, Dịch ${translatedBlocks.length}. Đang chạy fallback dịch tuần tự...`);
      for (const singleBlock of chunk) {
        const singleTrans = await translateTextFree(singleBlock, targetLang);
        results.push(singleTrans.trim());
      }
    } else {
      translatedBlocks.forEach(tb => results.push(tb));
    }
  }

  return results;
}

// Dịch loại trừ Brand, Phone, Address sử dụng dịch gộp (Batch Translation) cho an toàn
async function transexept(text, targetLang, brand, phone, address, projectId, modelName) {
  if (!text || !text.trim()) return '';
  let tempText = text;
  
  const replacements = [];
  if (brand && brand.trim()) {
    const regex = new RegExp(escapeRegExp(brand), 'gi');
    tempText = tempText.replace(regex, '___BRAND_HOLDER___');
    replacements.push({ holder: '___BRAND_HOLDER___', value: brand });
  }
  if (phone && phone.trim()) {
    const regex = new RegExp(escapeRegExp(phone), 'gi');
    tempText = tempText.replace(regex, '___PHONE_HOLDER___');
    replacements.push({ holder: '___PHONE_HOLDER___', value: phone });
  }
  if (address && address.trim()) {
    const regex = new RegExp(escapeRegExp(address), 'gi');
    tempText = tempText.replace(regex, '___ADDR_HOLDER___');
    replacements.push({ holder: '___ADDR_HOLDER___', value: address });
  }

  // Dịch bằng Google Translate miễn phí
  let translated = await translateTextFree(tempText, targetLang);

  replacements.forEach(rep => {
    const holderRegex = new RegExp(escapeRegExp(rep.holder), 'gi');
    translated = translated.replace(holderRegex, rep.value);
  });

  return translated;
}

// Trích xuất thông tin doanh nghiệp (NAP) của dự án từ SQLite schema phẳng thực tế
async function getBusinessNapInfo(projectId) {
  const infoRow = await query.get('SELECT * FROM business_info WHERE project_id = ?', [projectId]);
  let brand = '';
  let phone = '';
  let address = '';

  if (infoRow) {
    brand = infoRow.brand || '';
    if (infoRow.phones) {
      try {
        const phones = JSON.parse(infoRow.phones);
        if (phones && phones.length > 0) {
          phone = phones[0].number || '';
        }
      } catch (e) {
        console.error("Lỗi parse phones:", e.message);
      }
    }
    if (infoRow.addresses) {
      try {
        const addresses = JSON.parse(infoRow.addresses);
        if (addresses && addresses.length > 0) {
          address = addresses[0].address || '';
        }
      } catch (e) {
        console.error("Lỗi parse addresses:", e.message);
      }
    }
  }
  return { brand, phone, address };
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getLanguageFullName(code) {
  const map = {
    'ar': 'Arabic',
    'hi': 'Hindi',
    'ru': 'Russian',
    'zh': 'Chinese',
    'en': 'English',
    'ja': 'Japanese',
    'de': 'German',
    'es': 'Spanish',
    'pt': 'Portuguese',
    'fr': 'French',
    'bn': 'Bengali',
    'pl': 'Polish',
    'fi': 'Finnish',
    'ko': 'Korean',
    'it': 'Italian'
  };
  return map[code] || code;
}

// Logic dịch Google Doc bảo toàn hình ảnh và style định dạng gốc bằng dịch gộp
async function translateAndPreserveDoc(docs, drive, origDocFileId, targetFolderId, docTitle, lang, brand, phone, address, projectId, modelName, oauth2Client) {
  try {
    // 1. Export as DOCX
    const exportRes = await drive.files.export({
      fileId: origDocFileId,
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    }, { responseType: 'arraybuffer' });

    // 2. Load into JSZip
    const zip = await JSZip.loadAsync(exportRes.data);
    
    // 3. Read word/document.xml
    const docXmlFile = zip.file('word/document.xml');
    if (!docXmlFile) {
      throw new Error("Cannot find word/document.xml in exported DOCX");
    }
    let xmlContent = await docXmlFile.async('string');

    // 4. Extract all <w:t> texts
    const textRegex = /<w:t([^>]*)>([\s\S]*?)<\/w:t>/g;
    const textsToTranslate = [];
    
    let match;
    while ((match = textRegex.exec(xmlContent)) !== null) {
      const rawText = match[2];
      
      // Decode XML entities
      let decodedText = rawText
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'");

      const trimmed = decodedText.trim();
      
      // Skip empty, very short (<= 2 chars), or brand name
      if (trimmed.length > 2 && trimmed.toLowerCase() !== brand.toLowerCase()) {
        textsToTranslate.push(decodedText);
      }
    }
    
    // Unique list to translate
    const uniqueTexts = Array.from(new Set(textsToTranslate));
    const translationMap = new Map();
    
    if (uniqueTexts.length > 0) {
      const translatedTexts = await translateTextBatch(uniqueTexts, lang);
      uniqueTexts.forEach((text, i) => {
        if (translatedTexts[i]) {
          translationMap.set(text, translatedTexts[i]);
        }
      });
    }
    
    // 5. Replace texts in XML
    let newXmlContent = xmlContent.replace(textRegex, (match, attrs, rawText) => {
      let decodedText = rawText
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'");
        
      const trimmed = decodedText.trim();
      if (trimmed.length > 2 && trimmed.toLowerCase() !== brand.toLowerCase() && translationMap.has(decodedText)) {
        let translated = translationMap.get(decodedText);
        // Re-encode XML entities
        translated = translated
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&apos;');
        return `<w:t${attrs}>${translated}</w:t>`;
      }
      return match;
    });

    // 6. Save modified XML back to zip
    zip.file('word/document.xml', newXmlContent);
    
    // 7. Generate new .docx buffer
    const newDocxBuffer = await zip.generateAsync({ type: 'nodebuffer' });
    
    // 8. Upload to Google Drive and convert to Google Doc
    const uploadRes = await drive.files.create({
      requestBody: {
        name: docTitle,
        parents: [targetFolderId],
        mimeType: 'application/vnd.google-apps.document'
      },
      media: {
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        body: Readable.from(newDocxBuffer)
      },
      fields: 'id, webViewLink'
    });
    
    const newDocId = uploadRes.data.id;
    const driveUrl = uploadRes.data.webViewLink;
    
    // 9. Set permissions to public reader
    await drive.permissions.create({
      fileId: newDocId,
      requestBody: { role: 'reader', type: 'anyone' }
    });
    
    // 10. Publish to web
    let pubUrl = '';
    try {
      const driveV2 = google.drive({ version: 'v2', auth: oauth2Client });
      const revList = await driveV2.revisions.list({ fileId: newDocId });
      const revisions = revList.data.items || [];
      const revisionId = revisions.length > 0 ? revisions[revisions.length - 1].id : '1';
      
      const revUpdate = await driveV2.revisions.update({
        fileId: newDocId,
        revisionId: revisionId,
        resource: { published: true, publishAuto: true }
      });
      pubUrl = revUpdate.data.publishedLink || `https://docs.google.com/document/d/${newDocId}/pub`;
    } catch (revErr) {
      pubUrl = `https://docs.google.com/document/d/${newDocId}/pub`;
    }
    
    return {
      driveUrl: driveUrl,
      pubUrl: pubUrl
    };
    
  } catch (err) {
    console.error(`Lỗi dịch đè tài liệu DOCX [${lang}]:`, err.message);
    return { driveUrl: '', pubUrl: '' };
  }
}

// Hàm tối ưu hóa đơn lẻ một tệp Docs đa ngôn ngữ
async function optimizeSingleLangDoc(docs, drive, assetKey, lang, transKeys, keywords, langObj, step4Data, stack, ownPubLink, brand, phone, address, modelName) {
  const docAsset = langObj.docs[assetKey];
  if (!docAsset || docAsset.status !== 'success') return;

  const docId = extractFileId(docAsset.driveUrl);
  if (!docId) return;

  const step4Map = {};
  step4Data.forEach(item => {
    step4Map[item.name] = item.assetLink || '';
  });
  const row7Asset = step4Data.find(item => item.id === 7) || { name: 'LinkedIn', assetLink: '' };
  const row7Name = row7Asset.name || 'LinkedIn';

  const siteViewLink = step4Map['Google site view'] || '';
  const myMapsLink = step4Map['Google My Maps'] || '';
  const gmbLink = step4Map['GMB post'] || '';
  const youtubeLink = step4Map['Youtube'] || '';
  const twitterLink = step4Map['Twitter'] || '';
  const pinterestLink = step4Map['Pinterest'] || '';
  const row7Link = step4Map[row7Name] || row7Asset.assetLink || '';
  const driveFolderLink = stack.drive_folder || '';
  const sheetLink = stack.sheet_created_url || '';
  const imageFolderLink = stack.image_folder_url || '';

  const keyChinhVal = transKeys.key_chinh || keywords.key_chinh || stack.main_key || '';
  const keyChinhLocalVal = transKeys.key_chinh_local || keywords.key_chinh_local || '';
  const lsi1Val = transKeys.lsi_1 || keywords.lsi_1 || '';
  const lsi2Val = transKeys.lsi_2 || keywords.lsi_2 || '';
  const lsi3Val = transKeys.lsi_3 || keywords.lsi_3 || '';
  const lsi4Val = transKeys.lsi_4 || keywords.lsi_4 || '';
  const ownTitle = transKeys[assetKey] || keywords[assetKey] || '';

  const langFullName = getLanguageFullName(lang);
  const driveTranslateName = brand ? `${brand} - ${langFullName}` : `${langFullName}`;

  const optLines = [
    `${ownTitle}: ${ownTitle}`,
    `Website: ${keyChinhVal}`,
    `Google site view: ${keyChinhVal}`,
    `Google My Maps: ${keyChinhLocalVal}`,
    `GMB post: ${keyChinhVal}`,
    `Youtube: ${lsi1Val}`,
    `Twitter: ${lsi2Val}`,
    `Pinterest: ${lsi3Val}`,
    `${row7Name}: ${lsi4Val}`,
    `Drive Folder: ${keyChinhVal}`,
    `Drive Folder - ${langFullName}: ${driveTranslateName}`,
    `Google Sheet link: ${keyChinhVal}`,
    `Drive folder image: ${keyChinhVal}`
  ];

  // Đảm bảo phần tối ưu thêm được cách xuống dòng trước sau nó 1 cái và chỉ dùng định dạng paragraph
  const optText = '\n\n' + optLines.join('\n') + '\n\n';

  let relatedKeys = [];
  const numPattern = /\d+/;
  const ownNumMatch = assetKey.match(numPattern);
  const ownNum = ownNumMatch ? parseInt(ownNumMatch[0], 10) : null;

  if (ownNum >= 5 && ownNum <= 9) {
    relatedKeys = ['lsi_5', 'lsi_6', 'lsi_7', 'lsi_8', 'lsi_9'];
  } else if (ownNum >= 10 && ownNum <= 14) {
    relatedKeys = ['lsi_10', 'lsi_11', 'lsi_12', 'lsi_13', 'lsi_14'];
  }

  const relTitleVn = 'Bài viết liên quan:';
  const relTitleTrans = await transexept(relTitleVn, lang, brand, phone, address, stack.project_id, modelName);

  const relLines = [
    relTitleTrans
  ];

  relatedKeys.forEach(k => {
    const keyTitle = transKeys[k] || keywords[k] || '';
    if (keyTitle.trim()) {
      relLines.push(keyTitle);
    }
  });

  // Đảm bảo phần tối ưu thêm được cách xuống dòng trước sau nó 1 cái và chỉ dùng định dạng paragraph
  const relText = '\n\n' + relLines.join('\n') + '\n\n';

  const docData = await docs.documents.get({ documentId: docId });
  const namedRanges = docData.data.namedRanges || {};
  const deleteRequests = [];
  if (namedRanges['opt_zone']) {
    namedRanges['opt_zone'].namedRanges.forEach(nr => {
      deleteRequests.push({ deleteNamedRange: { namedRangeId: nr.namedRangeId } });
    });
  }
  if (namedRanges['rel_zone']) {
    namedRanges['rel_zone'].namedRanges.forEach(nr => {
      deleteRequests.push({ deleteNamedRange: { namedRangeId: nr.namedRangeId } });
    });
  }

  if (deleteRequests.length > 0) {
    await docs.documents.batchUpdate({
      documentId: docId,
      requestBody: { requests: deleteRequests }
    });
  }

  const freshDocData = await docs.documents.get({ documentId: docId });
  const freshBodyContent = freshDocData.data.body?.content || [];

  let paragraphCount = 0;
  let optInsertIndex = 1;
  for (let i = 0; i < freshBodyContent.length; i++) {
    const element = freshBodyContent[i];
    if (element.paragraph) {
      const text = element.paragraph.elements?.map(el => el.textRun?.content || '').join('') || '';
      if (text.trim().length > 0) {
        paragraphCount++;
        if (paragraphCount === 2) {
          optInsertIndex = element.endIndex - 1;
          break;
        }
      }
    }
  }

  const lastElement = freshBodyContent[freshBodyContent.length - 1];
  const relInsertIndex = lastElement.endIndex - 1;

  const insertRequests = [];

  insertRequests.push({
    insertText: {
      location: { index: relInsertIndex },
      text: relText
    }
  });

  // Bỏ qua 2 ký tự \n\n đầu tiên + tiêu đề + 1 ký tự \n sau tiêu đề
  let currentRelOffset = relInsertIndex + 2 + relTitleTrans.length + 1;
  for (let j = 0; j < relatedKeys.length; j++) {
    const k = relatedKeys[j];
    const keyTitle = transKeys[k] || keywords[k] || '';
    if (!keyTitle.trim()) continue;

    let relatedDriveUrl = langObj.docs[k]?.driveUrl || '';

    if (relatedDriveUrl) {
      insertRequests.push({
        updateTextStyle: {
          range: {
            startIndex: currentRelOffset,
            endIndex: currentRelOffset + keyTitle.length
          },
          textStyle: { link: { url: relatedDriveUrl } },
          fields: 'link'
        }
      });
    }
    currentRelOffset += keyTitle.length + 1;
  }

  insertRequests.push({
    createNamedRange: {
      name: 'rel_zone',
      range: {
        startIndex: relInsertIndex,
        endIndex: relInsertIndex + relText.length
      }
    }
  });

  insertRequests.push({
    insertText: {
      location: { index: optInsertIndex },
      text: optText
    }
  });

  // Bỏ qua 2 ký tự \n\n đầu tiên
  let currentOptOffset = optInsertIndex + 2;

  // Dòng 0: ownTitle: ownTitle
  const ownTitleLineText = optLines[0];
  const ownTitleLinkStart = currentOptOffset + ownTitle.length + 2;
  if (ownPubLink) {
    insertRequests.push({
      updateTextStyle: {
        range: {
          startIndex: ownTitleLinkStart,
          endIndex: ownTitleLinkStart + ownTitle.length
        },
        textStyle: { link: { url: ownPubLink } },
        fields: 'link'
      }
    });
  }
  currentOptOffset += ownTitleLineText.length + 1;

  // Dòng 1: Website
  const websiteLineText = optLines[1];
  const websiteLinkStart = currentOptOffset + 'Website: '.length;
  if (stack.url) {
    insertRequests.push({
      updateTextStyle: {
        range: {
          startIndex: websiteLinkStart,
          endIndex: websiteLinkStart + keyChinhVal.length
        },
        textStyle: { link: { url: stack.url } },
        fields: 'link'
      }
    });
  }
  currentOptOffset += websiteLineText.length + 1;

  // Dòng 2: Google site view
  const siteLineText = optLines[2];
  const siteLinkStart = currentOptOffset + 'Google site view: '.length;
  if (siteViewLink) {
    insertRequests.push({
      updateTextStyle: {
        range: {
          startIndex: siteLinkStart,
          endIndex: siteLinkStart + keyChinhVal.length
        },
        textStyle: { link: { url: siteViewLink } },
        fields: 'link'
      }
    });
  }
  currentOptOffset += siteLineText.length + 1;

  // Dòng 3: Google My Maps
  const mapsLineText = optLines[3];
  const mapsLinkStart = currentOptOffset + 'Google My Maps: '.length;
  if (myMapsLink) {
    insertRequests.push({
      updateTextStyle: {
        range: {
          startIndex: mapsLinkStart,
          endIndex: mapsLinkStart + keyChinhLocalVal.length
        },
        textStyle: { link: { url: myMapsLink } },
        fields: 'link'
      }
    });
  }
  currentOptOffset += mapsLineText.length + 1;

  // Dòng 4: GMB post
  const gmbLineText = optLines[4];
  const gmbLinkStart = currentOptOffset + 'GMB post: '.length;
  if (gmbLink) {
    insertRequests.push({
      updateTextStyle: {
        range: {
          startIndex: gmbLinkStart,
          endIndex: gmbLinkStart + keyChinhVal.length
        },
        textStyle: { link: { url: gmbLink } },
        fields: 'link'
      }
    });
  }
  currentOptOffset += gmbLineText.length + 1;

  // Dòng 5: Youtube
  const ytLineText = optLines[5];
  const ytLinkStart = currentOptOffset + 'Youtube: '.length;
  if (youtubeLink) {
    insertRequests.push({
      updateTextStyle: {
        range: {
          startIndex: ytLinkStart,
          endIndex: ytLinkStart + lsi1Val.length
        },
        textStyle: { link: { url: youtubeLink } },
        fields: 'link'
      }
    });
  }
  currentOptOffset += ytLineText.length + 1;

  // Dòng 6: Twitter
  const twLineText = optLines[6];
  const twLinkStart = currentOptOffset + 'Twitter: '.length;
  if (twitterLink) {
    insertRequests.push({
      updateTextStyle: {
        range: {
          startIndex: twLinkStart,
          endIndex: twLinkStart + lsi2Val.length
        },
        textStyle: { link: { url: twitterLink } },
        fields: 'link'
      }
    });
  }
  currentOptOffset += twLineText.length + 1;

  // Dòng 7: Pinterest
  const pinLineText = optLines[7];
  const pinLinkStart = currentOptOffset + 'Pinterest: '.length;
  if (pinterestLink) {
    insertRequests.push({
      updateTextStyle: {
        range: {
          startIndex: pinLinkStart,
          endIndex: pinLinkStart + lsi3Val.length
        },
        textStyle: { link: { url: pinterestLink } },
        fields: 'link'
      }
    });
  }
  currentOptOffset += pinLineText.length + 1;

  // Dòng 8: Hàng 7 tài sản
  const row7LineText = optLines[8];
  const row7LinkStart = currentOptOffset + row7Name.length + 2;
  if (row7Link) {
    insertRequests.push({
      updateTextStyle: {
        range: {
          startIndex: row7LinkStart,
          endIndex: row7LinkStart + lsi4Val.length
        },
        textStyle: { link: { url: row7Link } },
        fields: 'link'
      }
    });
  }
  currentOptOffset += row7LineText.length + 1;

  // Dòng 9: Drive Folder gốc
  const folderLineText = optLines[9];
  const folderLinkStart = currentOptOffset + 'Drive Folder: '.length;
  if (driveFolderLink) {
    insertRequests.push({
      updateTextStyle: {
        range: {
          startIndex: folderLinkStart,
          endIndex: folderLinkStart + keyChinhVal.length
        },
        textStyle: { link: { url: driveFolderLink } },
        fields: 'link'
      }
    });
  }
  currentOptOffset += folderLineText.length + 1;

  // Dòng 10: Drive Folder translate mới
  const driveLangLineText = optLines[10];
  const driveLangLinkStart = currentOptOffset + `Drive Folder - ${langFullName}: `.length;
  if (langObj.folder_url) {
    insertRequests.push({
      updateTextStyle: {
        range: {
          startIndex: driveLangLinkStart,
          endIndex: driveLangLinkStart + driveTranslateName.length
        },
        textStyle: { link: { url: langObj.folder_url } },
        fields: 'link'
      }
    });
  }
  currentOptOffset += driveLangLineText.length + 1;

  // Dòng 11: Google Sheet link (lấy link sheet của ngôn ngữ phụ này)
  const sheetLineText = optLines[11];
  const sheetLinkStart = currentOptOffset + 'Google Sheet link: '.length;
  if (sheetLink) {
    insertRequests.push({
      updateTextStyle: {
        range: {
          startIndex: sheetLinkStart,
          endIndex: sheetLinkStart + keyChinhVal.length
        },
        textStyle: { link: { url: sheetLink } },
        fields: 'link'
      }
    });
  }
  currentOptOffset += sheetLineText.length + 1;

  // Dòng 12: Drive folder image
  const imgFolderLineText = optLines[12];
  const imgFolderLinkStart = currentOptOffset + 'Drive folder image: '.length;
  if (imageFolderLink) {
    insertRequests.push({
      updateTextStyle: {
        range: {
          startIndex: imgFolderLinkStart,
          endIndex: imgFolderLinkStart + keyChinhVal.length
        },
        textStyle: { link: { url: imageFolderLink } },
        fields: 'link'
      }
    });
  }
  currentOptOffset += imgFolderLineText.length + 1;

  insertRequests.push({
    createNamedRange: {
      name: 'opt_zone',
      range: {
        startIndex: optInsertIndex,
        endIndex: optInsertIndex + optText.length
      }
    }
  });

  await docs.documents.batchUpdate({
    documentId: docId,
    requestBody: { requests: insertRequests }
  });
}

// API: Dịch bộ từ khóa sang 15 ngôn ngữ (Button 1)
app.post('/api/google-stacks/translate-keys/:id', async (req, res) => {
  const { id } = req.params;
  const { model } = req.body || {};
  const modelName = model || 'google/gemini-2.5-flash:free';

  try {
    const stack = await query.get('SELECT * FROM google_stacks WHERE id = ?', [id]);
    if (!stack) return res.status(404).json({ error: 'Không tìm thấy bộ Google Stack' });

    const keywords = stack.keywords ? JSON.parse(stack.keywords) : {};
    const { brand, phone, address } = await getBusinessNapInfo(stack.project_id);

    const keysToTranslate = [
      'key_chinh',
      'key_chinh_local',
      ...Array.from({ length: 14 }, (_, i) => `lsi_${i+1}`)
    ];

    const lang_arr = ['ar','hi','ru','zh','en','ja','de','es','pt','fr','bn','pl','fi','ko','it'];
    
    let languagesData = stack.languages_data ? JSON.parse(stack.languages_data) : {};
    if (!languagesData.translated_keys) {
      languagesData.translated_keys = {};
    }

    const translateAllForLang = async (lang) => {
      if (!languagesData.translated_keys[lang]) {
        languagesData.translated_keys[lang] = {};
      }
      
      const langKeys = languagesData.translated_keys[lang];

      const originalTexts = keysToTranslate.map(keyField => {
        return keyField === 'key_chinh' ? stack.main_key : (keywords[keyField] || '');
      });

      const indicesToTranslate = [];
      const textsToTranslate = [];

      originalTexts.forEach((text, idx) => {
        const keyField = keysToTranslate[idx];
        if (langKeys[keyField] && langKeys[keyField].trim()) return;

        if (!text || !text.trim()) {
          langKeys[keyField] = '';
          return;
        }

        if (keyField === 'key_chinh' && brand && text.toLowerCase().trim() === brand.toLowerCase().trim()) {
          langKeys[keyField] = text;
          return;
        }

        indicesToTranslate.push(idx);
        textsToTranslate.push(text);
      });

      if (textsToTranslate.length > 0) {
        try {
          const translatedTexts = await translateTextBatch(textsToTranslate, lang);
          indicesToTranslate.forEach((origIdx, transIdx) => {
            const keyField = keysToTranslate[origIdx];
            langKeys[keyField] = translatedTexts[transIdx] || originalTexts[origIdx];
          });
        } catch (err) {
          console.error(`Lỗi dịch gộp từ khóa sang ${lang}:`, err.message);
          indicesToTranslate.forEach(origIdx => {
            const keyField = keysToTranslate[origIdx];
            langKeys[keyField] = originalTexts[origIdx];
          });
        }
      }

      // Đảm bảo không bị trống key_chinh
      if (!langKeys.key_chinh || !langKeys.key_chinh.trim()) {
        langKeys.key_chinh = stack.main_key || '';
      }
    };

    await runConcurrent(3, lang_arr, translateAllForLang);

    await query.run(
      'UPDATE google_stacks SET languages_data = ? WHERE id = ?',
      [JSON.stringify(languagesData), id]
    );

    res.json({
      message: 'Dịch bộ từ khóa thành công!',
      translated_keys: languagesData.translated_keys
    });

  } catch (error) {
    console.error('Lỗi khi dịch từ khóa:', error);
    res.status(500).json({ error: error.message });
  }
});

// API: Tạo tài sản đa ngôn ngữ (Button 2)
app.post('/api/google-stacks/create-lang-assets/:id', async (req, res) => {
  const { id } = req.params;
  const { model } = req.body || {};
  const modelName = model || 'google/gemini-2.5-flash:free';

  try {
    const stack = await query.get('SELECT * FROM google_stacks WHERE id = ?', [id]);
    if (!stack) return res.status(404).json({ error: 'Không tìm thấy bộ Google Stack' });

    const keywords = stack.keywords ? JSON.parse(stack.keywords) : {};
    const assets = stack.assets ? JSON.parse(stack.assets) : [];
    const step4Images = stack.step4_images ? JSON.parse(stack.step4_images) : [];

    const languagesData = stack.languages_data ? JSON.parse(stack.languages_data) : {};
    const translatedKeysMap = languagesData.translated_keys || {};

    if (Object.keys(translatedKeysMap).length === 0) {
      return res.status(400).json({ error: 'Chưa có dữ liệu từ khóa dịch! Vui lòng dịch từ khóa trước.' });
    }

    const { brand, phone, address } = await getBusinessNapInfo(stack.project_id);
    const parentFolderId = extractFolderId(stack.drive_folder);
    if (!parentFolderId) {
      return res.status(400).json({ error: 'Đường dẫn Drive Folder gốc không đúng định dạng!' });
    }

    const oauth2Client = await getGoogleOAuthClient(stack.project_id);
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    const docs = google.docs({ version: 'v1', auth: oauth2Client });

    const lang_arr = ['ar','hi','ru','zh','en','ja','de','es','pt','fr','bn','pl','fi','ko','it'];
    
    if (!languagesData.assets) {
      languagesData.assets = {};
    }

    const processSingleLang = async (lang) => {
      if (!languagesData.assets[lang]) {
        languagesData.assets[lang] = {
          status: 'pending',
          folder_url: '',
          docs: {},
          sheet_url: '',
          slide_url: '',
          form_url: '',
          drawing_url: '',
          error: ''
        };
      }

      const langObj = languagesData.assets[lang];
      const transKeys = translatedKeysMap[lang] || {};

      try {
        let folderId = '';
        if (!langObj.folder_url) {
          const keyChinhVal = transKeys.key_chinh || stack.main_key || '';
          let folderName = '';
          
          if (brand && keyChinhVal.toLowerCase().trim() === brand.toLowerCase().trim()) {
            const langFullName = getLanguageFullName(lang);
            folderName = `${brand} - ${langFullName}`;
          } else {
            folderName = keyChinhVal;
          }

          const fileMetadata = {
            name: folderName,
            mimeType: 'application/vnd.google-apps.folder',
            parents: [parentFolderId]
          };

          const newFolder = await drive.files.create({
            requestBody: fileMetadata,
            fields: 'id, webViewLink'
          });

          await drive.permissions.create({
            fileId: newFolder.data.id,
            requestBody: { role: 'reader', type: 'anyone' }
          });

          folderId = newFolder.data.id;
          langObj.folder_url = newFolder.data.webViewLink;
        } else {
          folderId = extractFolderId(langObj.folder_url);
        }

        if (!langObj.docs) langObj.docs = {};
        const lsiFields = Array.from({ length: 10 }, (_, i) => `lsi_${i+5}`);

        const getTitle = (k) => {
          if (k === 'key_chinh') return transKeys.key_chinh || stack.main_key;
          return transKeys[k] || keywords[k] || `${k} (${lang})`;
        };

        for (const keyField of lsiFields) {
          if (langObj.docs[keyField] && langObj.docs[keyField].status === 'success') {
            continue;
          }

          langObj.docs[keyField] = { status: 'pending', driveUrl: '', pubUrl: '' };

          let origDocFileId = '';
          if (languagesData.temp_docs && languagesData.temp_docs[keyField] && languagesData.temp_docs[keyField].id) {
            origDocFileId = languagesData.temp_docs[keyField].id;
          } else {
            const origDocAsset = assets.find(a => a.keyField === keyField);
            if (origDocAsset && origDocAsset.driveUrl) {
              origDocFileId = extractFileId(origDocAsset.driveUrl);
            }
          }

          if (!origDocFileId) {
            langObj.docs[keyField].status = 'error';
            langObj.docs[keyField].error = 'Không tìm thấy file đệm sạch hoặc tệp Docs tiếng Việt gốc';
            continue;
          }

          try {
            const docTitle = getTitle(keyField);
            const docResult = await translateAndPreserveDoc(
              docs,
              drive,
              origDocFileId,
              folderId,
              docTitle,
              lang,
              brand,
              phone,
              address,
              stack.project_id,
              modelName,
              oauth2Client
            );

            langObj.docs[keyField] = {
              status: 'success',
              driveUrl: docResult.driveUrl,
              pubUrl: docResult.pubUrl
            };
          } catch (docErr) {
            langObj.docs[keyField].status = 'error';
            langObj.docs[keyField].error = docErr.message;
          }
        }

        if (!langObj.sheet_url) {
          const origSheetAsset = assets.find(a => a.keyField === 'lsi_10_spreadsheet');
          if (origSheetAsset && origSheetAsset.driveUrl) {
            const origSheetId = extractFileId(origSheetAsset.driveUrl);
            if (origSheetId) {
              const sheetTitle = getTitle('lsi_10');
              const newSheet = await drive.files.copy({
                fileId: origSheetId,
                requestBody: {
                  name: sheetTitle,
                  parents: [folderId]
                },
                fields: 'id, webViewLink'
              });

              const newSheetId = newSheet.data.id;
              await drive.permissions.create({
                fileId: newSheetId,
                requestBody: { role: 'reader', type: 'anyone' }
              });

              let pubUrl = '';
              try {
                const driveV2 = google.drive({ version: 'v2', auth: oauth2Client });
                const revUpdate = await driveV2.revisions.update({
                  fileId: newSheetId,
                  revisionId: '1',
                  resource: { published: true, publishAuto: true }
                });
                pubUrl = revUpdate.data.publishedLink || `https://docs.google.com/spreadsheets/d/${newSheetId}/pubhtml`;
              } catch (pubErr) {
                pubUrl = `https://docs.google.com/spreadsheets/d/${newSheetId}/pubhtml`;
              }

              langObj.sheet_url = newSheet.data.webViewLink;
              langObj.sheet_pub_url = pubUrl;
            }
          }
        }

        if (!langObj.slide_url) {
          const origSlideAsset = assets.find(a => a.keyField === 'lsi_11_presentation');
          if (origSlideAsset && origSlideAsset.driveUrl) {
            const origSlideId = extractFileId(origSlideAsset.driveUrl);
            if (origSlideId) {
              const slideTitle = getTitle('lsi_11');
              const newSlide = await drive.files.copy({
                fileId: origSlideId,
                requestBody: {
                  name: slideTitle,
                  parents: [folderId]
                },
                fields: 'id, webViewLink'
              });

              await drive.permissions.create({
                fileId: newSlide.data.id,
                requestBody: { role: 'reader', type: 'anyone' }
              });

              langObj.slide_url = newSlide.data.webViewLink;
            }
          }
        }

        if (!langObj.form_url) {
          try {
            const formTitle = getTitle('lsi_12');
            const formsApi = google.forms({ version: 'v1', auth: oauth2Client });
            const newForm = await formsApi.forms.create({
              requestBody: {
                info: {
                  title: formTitle
                }
              }
            });
            const newFormId = newForm.data.formId;

            // Di chuyển Form vào thư mục ngôn ngữ và đổi tên
            await drive.files.update({
              fileId: newFormId,
              addParents: folderId,
              requestBody: {
                name: formTitle
              },
              fields: 'id, parents, name'
            });

            // Lấy webViewLink chỉnh sửa của Form bằng Drive API
            const formFile = await drive.files.get({
              fileId: newFormId,
              fields: 'webViewLink'
            });

            await drive.permissions.create({
              fileId: newFormId,
              requestBody: { role: 'reader', type: 'anyone' }
            });

            langObj.form_url = formFile.data.webViewLink;
            langObj.form_view_url = `https://docs.google.com/forms/d/${newFormId}/viewform`;
          } catch (formCreateErr) {
            console.error('Lỗi khi tạo Form đa ngôn ngữ mới:', formCreateErr.message);
          }
        }

        if (!langObj.drawing_url) {
          const step4Data = stack.step4_data ? JSON.parse(stack.step4_data) : [];
          const origDrawingAsset = step4Data.find(item => item.name === 'Google Drawing');
          if (origDrawingAsset && origDrawingAsset.assetLink) {
            const origDrawingId = extractFileId(origDrawingAsset.assetLink);
            if (origDrawingId) {
              const drawingTitle = getTitle('lsi_13');
              const newDrawing = await drive.files.copy({
                fileId: origDrawingId,
                requestBody: {
                  name: drawingTitle,
                  parents: [folderId]
                },
                fields: 'id, webViewLink'
              });

              await drive.permissions.create({
                fileId: newDrawing.data.id,
                requestBody: { role: 'reader', type: 'anyone' }
              });

              langObj.drawing_url = newDrawing.data.webViewLink;
            }
          }
        }

        langObj.status = 'success';
        langObj.error = '';

      } catch (err) {
        console.error(`Lỗi khi tạo tài sản cho ${lang}:`, err.message);
        langObj.status = 'error';
        langObj.error = err.message;
      }
    };

    await runConcurrent(2, lang_arr, processSingleLang);

    await query.run(
      'UPDATE google_stacks SET languages_data = ? WHERE id = ?',
      [JSON.stringify(languagesData), id]
    );

    const successLangs = Object.keys(languagesData.assets).filter(l => languagesData.assets[l].status === 'success');
    const failedLangs = Object.keys(languagesData.assets).filter(l => languagesData.assets[l].status === 'error');

    res.json({
      message: `Tạo tài sản đa ngôn ngữ hoàn tất! Thành công: ${successLangs.length}/15`,
      assets: languagesData.assets,
      failed: failedLangs
    });

  } catch (error) {
    console.error('Lỗi khi tạo tài sản đa ngôn ngữ:', error);
    res.status(500).json({ error: error.message });
  }
});

// API: Dọn dẹp tài sản đệm (Templates)
app.post('/api/google-stacks/clean-temp-assets/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const stack = await query.get('SELECT * FROM google_stacks WHERE id = ?', [id]);
    if (!stack) return res.status(404).json({ error: 'Không tìm thấy bộ Google Stack' });

    const languagesData = stack.languages_data ? JSON.parse(stack.languages_data) : {};
    const tempFolderId = languagesData.temp_folder_id;

    if (tempFolderId) {
      const oauth2Client = await getGoogleOAuthClient(stack.project_id);
      const drive = google.drive({ version: 'v3', auth: oauth2Client });
      try {
        await drive.files.delete({ fileId: tempFolderId });
      } catch (deleteErr) {
        console.error('Không thể xóa thư mục đệm trên Drive (có thể đã bị xóa trước đó):', deleteErr.message);
      }
    }

    languagesData.temp_folder_url = '';
    languagesData.temp_folder_id = '';
    languagesData.temp_docs = {};

    await query.run(
      'UPDATE google_stacks SET languages_data = ? WHERE id = ?',
      [JSON.stringify(languagesData), id]
    );

    res.json({ message: 'Đã dọn dẹp các tệp đệm Templates thành công!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Tối ưu hóa tài sản đa ngôn ngữ (Button 3)
app.post('/api/google-stacks/optimize-lang-assets/:id', async (req, res) => {
  const { id } = req.params;
  const { model, mode } = req.body || {};
  const modelName = model || 'google/gemini-2.5-flash:free';
  const optMode = mode || 'all'; // mặc định là 'all' để tối ưu toàn bộ nếu không truyền

  try {
    const stack = await query.get('SELECT * FROM google_stacks WHERE id = ?', [id]);
    if (!stack) return res.status(404).json({ error: 'Không tìm thấy bộ Google Stack' });

    const keywords = stack.keywords ? JSON.parse(stack.keywords) : {};
    const step4Data = stack.step4_data ? JSON.parse(stack.step4_data) : [];
    const step4Images = stack.step4_images ? JSON.parse(stack.step4_images) : [];

    const languagesData = stack.languages_data ? JSON.parse(stack.languages_data) : {};
    const translatedKeysMap = languagesData.translated_keys || {};
    const langAssetsMap = languagesData.assets || {};

    if (Object.keys(langAssetsMap).length === 0) {
      return res.status(400).json({ error: 'Chưa tạo tài sản đa ngôn ngữ! Vui lòng tạo tài sản trước.' });
    }

    const { brand, phone, address } = await getBusinessNapInfo(stack.project_id);

    const oauth2Client = await getGoogleOAuthClient(stack.project_id);
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    const docs = google.docs({ version: 'v1', auth: oauth2Client });
    const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

    const lang_arr = ['ar','hi','ru','zh','en','ja','de','es','pt','fr','bn','pl','fi','ko','it'];
    
    let languagesOptResults = stack.languages_opt_results ? JSON.parse(stack.languages_opt_results) : {};

    const optimizeAllForLang = async (lang) => {
      if (optMode === 'all' || !languagesOptResults[lang]) {
        languagesOptResults[lang] = {
          status: 'pending',
          docs: {},
          sheet_status: 'pending',
          slide_status: 'pending',
          form_status: 'pending',
          error: ''
        };
      }

      const optResult = languagesOptResults[lang];
      const langObj = langAssetsMap[lang];
      const transKeys = translatedKeysMap[lang] || {};

      if (!langObj || langObj.status !== 'success') {
        optResult.status = 'error';
        optResult.error = 'Tài sản ngôn ngữ này chưa được tạo thành công ở Button 2';
        return;
      }

      try {
        if (optResult.sheet_status !== 'success' && langObj.sheet_url) {
          try {
            const sheetId = extractFileId(langObj.sheet_url);
            if (sheetId) {
              const lsi10Val = transKeys.lsi_10 || keywords.lsi_10 || 'LSI 10';
              
              let rawDocText = '';
              const lsi10DocAsset = langObj.docs['lsi_10'];
              if (lsi10DocAsset && lsi10DocAsset.driveUrl) {
                const lsi10DocId = extractFileId(lsi10DocAsset.driveUrl);
                if (lsi10DocId) {
                  try {
                    const lsi10DocData = await docs.documents.get({ documentId: lsi10DocId });
                    const freshDoc = lsi10DocData.data;
                    const namedRanges = freshDoc.namedRanges || {};
                    const optRange = namedRanges['opt_zone']?.namedRanges[0]?.ranges?.[0];
                    const relRange = namedRanges['rel_zone']?.namedRanges[0]?.ranges?.[0];

                    if (freshDoc.body && freshDoc.body.content) {
                      freshDoc.body.content.forEach(element => {
                        if (element.paragraph && element.paragraph.elements) {
                          const isInsideOpt = optRange && (element.startIndex >= optRange.startIndex && element.endIndex <= optRange.endIndex);
                          const isInsideRel = relRange && (element.startIndex >= relRange.startIndex && element.endIndex <= relRange.endIndex);

                          if (!isInsideOpt && !isInsideRel) {
                            element.paragraph.elements.forEach(el => {
                              if (el.textRun && el.textRun.content) {
                                rawDocText += el.textRun.content;
                              }
                            });
                          }
                        }
                      });
                    }
                  } catch (docReadErr) {
                    console.error("Lỗi đọc bài viết thô Sheet dịch:", docReadErr.message);
                  }
                }
              }

              const cellDataRows = Array.from({ length: 14 }, () => Array.from({ length: 13 }, () => ({
                userEnteredValue: {}
              })));

              cellDataRows[0][0].userEnteredValue = { stringValue: lsi10Val };
              cellDataRows[0][0].userEnteredFormat = { textFormat: { bold: true } };

              cellDataRows[1][0].userEnteredValue = { stringValue: rawDocText || 'Nội dung bài viết LSI 10' };
              cellDataRows[1][0].userEnteredFormat = { wrapStrategy: "WRAP" };

              const imageValues = [];
              for (let idx = 0; idx < 12; idx++) {
                const img = step4Images[idx];
                if (img && img.driveFileId) {
                  imageValues.push(`=IMAGE("https://lh3.googleusercontent.com/d/${img.driveFileId}")`);
                } else {
                  imageValues.push('');
                }
              }
              for (let idx = 0; idx < 12; idx++) {
                cellDataRows[1][idx + 1].userEnteredValue = { formulaValue: imageValues[idx] };
              }

              const row7Asset = step4Data.find(item => item.id === 7) || { name: 'LinkedIn', assetLink: '' };
              const row7Name = row7Asset.name || 'LinkedIn';
              const sheetAsset = langObj;

              const labelA = [
                `${transKeys.lsi_10 || 'LSI 10'}:`,
                "Website:",
                "Google site view:",
                "Google My Maps:",
                "GMB post:",
                "Youtube:",
                "Twitter:",
                "Pinterest:",
                `${row7Name}:`,
                "Drive Folder:",
                "Google Sheet link:",
                "Drive folder image:"
              ];
              for (let idx = 0; idx < labelA.length; idx++) {
                cellDataRows[idx + 2][0].userEnteredValue = { stringValue: labelA[idx] };
              }

              const step4Map = {};
              step4Data.forEach(item => {
                step4Map[item.name] = item.assetLink || '';
              });
              const siteViewLink = step4Map['Google site view'] || '';
              const myMapsLink = step4Map['Google My Maps'] || '';
              const gmbLink = step4Map['GMB post'] || '';
              const youtubeLink = step4Map['Youtube'] || '';
              const twitterLink = step4Map['Twitter'] || '';
              const pinterestLink = step4Map['Pinterest'] || '';
              const row7Link = step4Map[row7Name] || row7Asset.assetLink || '';
              const driveFolderLink = stack.drive_folder || '';
              const sheetLink = stack.sheet_created_url || '';
              const imageFolderLink = stack.image_folder_url || '';

              const keyChinhVal = transKeys.key_chinh || keywords.key_chinh || stack.main_key || '';
              const keyChinhLocalVal = transKeys.key_chinh_local || keywords.key_chinh_local || '';
              const lsi1Val = transKeys.lsi_1 || keywords.lsi_1 || '';
              const lsi2Val = transKeys.lsi_2 || keywords.lsi_2 || '';
              const lsi3Val = transKeys.lsi_3 || keywords.lsi_3 || '';
              const lsi4Val = transKeys.lsi_4 || keywords.lsi_4 || '';

              const valueB = [
                `=HYPERLINK("${sheetAsset.sheet_pub_url}";"${transKeys.lsi_10}")`,
                `=HYPERLINK("${stack.url}";"${keyChinhVal}")`,
                `=HYPERLINK("${siteViewLink}";"${keyChinhVal}")`,
                `=HYPERLINK("${myMapsLink}";"${keyChinhLocalVal}")`,
                `=HYPERLINK("${gmbLink}";"${keyChinhVal}")`,
                `=HYPERLINK("${youtubeLink}";"${lsi1Val}")`,
                `=HYPERLINK("${twitterLink}";"${lsi2Val}")`,
                `=HYPERLINK("${pinterestLink}";"${lsi3Val}")`,
                `=HYPERLINK("${row7Link}";"${lsi4Val}")`,
                `=HYPERLINK("${driveFolderLink}";"${keyChinhVal}")`,
                `=HYPERLINK("${sheetLink}";"${keyChinhVal}")`,
                `=HYPERLINK("${imageFolderLink}";"${keyChinhVal}")`
              ];
              for (let idx = 0; idx < valueB.length; idx++) {
                cellDataRows[idx + 2][1].userEnteredValue = { formulaValue: valueB[idx] };
              }

              const relInfoVn = 'Thông tin liên quan:';
              const relInfoTrans = await transexept(relInfoVn, lang, brand, phone, address, stack.project_id, modelName);
              cellDataRows[2][2].userEnteredValue = { stringValue: relInfoTrans };

              const drawingLink = langObj.drawing_url || '';
              const calendarLink = step4Map['Calendar'] || '';

              const valueC = [
                `=HYPERLINK("${langObj.sheet_url}";"${transKeys.lsi_10}")`,
                `=HYPERLINK("${langObj.slide_url}";"${transKeys.lsi_11}")`,
                `=HYPERLINK("${langObj.form_url}";"${transKeys.lsi_12}")`,
                `=HYPERLINK("${drawingLink}";"${transKeys.lsi_13}")`,
                `=HYPERLINK("${calendarLink}";"${transKeys.lsi_14}")`
              ];
              for (let idx = 0; idx < valueC.length; idx++) {
                cellDataRows[idx + 3][2].userEnteredValue = { formulaValue: valueC[idx] };
              }

              await sheets.spreadsheets.batchUpdate({
                spreadsheetId: sheetId,
                requestBody: {
                  requests: [
                    {
                      updateCells: {
                        rows: cellDataRows.map(row => ({ values: row })),
                        fields: 'userEnteredValue,userEnteredFormat',
                        range: {
                          sheetId: 0,
                          startRowIndex: 0,
                          endRowIndex: 14,
                          startColumnIndex: 0,
                          endColumnIndex: 13
                        }
                      }
                    },
                    {
                      updateDimensionProperties: {
                        range: {
                          sheetId: 0,
                          dimension: 'ROWS',
                          startIndex: 1,
                          endIndex: 2
                        },
                        properties: { pixelSize: 250 },
                        fields: 'pixelSize'
                      }
                    },
                    {
                      updateDimensionProperties: {
                        range: {
                          sheetId: 0,
                          dimension: 'COLUMNS',
                          startIndex: 1,
                          endIndex: 13
                        },
                        properties: { pixelSize: 250 },
                        fields: 'pixelSize'
                      }
                    }
                  ]
                }
              });

              optResult.sheet_status = 'success';
            }
          } catch (sheetErr) {
            console.error(`Lỗi tối ưu Sheet [${lang}]:`, sheetErr.message);
            optResult.sheet_status = `error: ${sheetErr.message}`;
          }
        }

        if (optResult.slide_status !== 'success' && langObj.slide_url) {
          try {
            const slideId = extractFileId(langObj.slide_url);
            if (slideId) {
              const slides = google.slides({ version: 'v1', auth: oauth2Client });

              let rawSlideDocText = '';
              const lsi11DocAsset = langObj.docs['lsi_11'];
              if (lsi11DocAsset && lsi11DocAsset.driveUrl) {
                const lsi11DocId = extractFileId(lsi11DocAsset.driveUrl);
                if (lsi11DocId) {
                  try {
                    const lsi11DocData = await docs.documents.get({ documentId: lsi11DocId });
                    const freshDoc = lsi11DocData.data;
                    const namedRanges = freshDoc.namedRanges || {};
                    const optRange = namedRanges['opt_zone']?.namedRanges[0]?.ranges?.[0];
                    const relRange = namedRanges['rel_zone']?.namedRanges[0]?.ranges?.[0];

                    if (freshDoc.body && freshDoc.body.content) {
                      freshDoc.body.content.forEach(element => {
                        if (element.paragraph && element.paragraph.elements) {
                          const isInsideOpt = optRange && (element.startIndex >= optRange.startIndex && element.endIndex <= optRange.endIndex);
                          const isInsideRel = relRange && (element.startIndex >= relRange.startIndex && element.endIndex <= relRange.endIndex);

                          if (!isInsideOpt && !isInsideRel) {
                            element.paragraph.elements.forEach(el => {
                              if (el.textRun && el.textRun.content) {
                                rawSlideDocText += el.textRun.content;
                              }
                            });
                          }
                        }
                      });
                    }
                  } catch (e) {
                    console.error("Lỗi đọc bài viết thô Slide dịch:", e.message);
                  }
                }
              }

              const presentation = await slides.presentations.get({ presentationId: slideId });
              const origSlides = presentation.data.slides || [];
              const deleteRequests = [];

              const lsi11Val = transKeys.lsi_11 || keywords.lsi_11 || 'LSI 11';
              const row7Asset = step4Data.find(item => item.id === 7) || { name: 'LinkedIn', assetLink: '' };
              const row7Name = row7Asset.name || 'LinkedIn';
              const step4Map = {};
              step4Data.forEach(item => {
                step4Map[item.name] = item.assetLink || '';
              });
              const siteViewLink = step4Map['Google site view'] || '';
              const myMapsLink = step4Map['Google My Maps'] || '';
              const gmbLink = step4Map['GMB post'] || '';
              const youtubeLink = step4Map['Youtube'] || '';
              const twitterLink = step4Map['Twitter'] || '';
              const pinterestLink = step4Map['Pinterest'] || '';
              const row7Link = step4Map[row7Name] || row7Asset.assetLink || '';
              const driveFolderLink = stack.drive_folder || '';
              const sheetLink = stack.sheet_created_url || '';
              const imageFolderLink = stack.image_folder_url || '';

              const keyChinhVal = transKeys.key_chinh || keywords.key_chinh || stack.main_key || '';
              const keyChinhLocalVal = transKeys.key_chinh_local || keywords.key_chinh_local || '';
              const lsi1Val = transKeys.lsi_1 || keywords.lsi_1 || '';
              const lsi2Val = transKeys.lsi_2 || keywords.lsi_2 || '';
              const lsi3Val = transKeys.lsi_3 || keywords.lsi_3 || '';
              const lsi4Val = transKeys.lsi_4 || keywords.lsi_4 || '';

              const text2Lines = [
                { label: 'Website: ', text: keyChinhVal, url: stack.url },
                { label: 'Google site view: ', text: keyChinhVal, url: siteViewLink },
                { label: 'Google My Maps: ', text: keyChinhLocalVal, url: myMapsLink },
                { label: 'GMB post: ', text: keyChinhVal, url: gmbLink },
                { label: 'Youtube: ', text: lsi1Val, url: youtubeLink },
                { label: 'Twitter: ', text: lsi2Val, url: twitterLink },
                { label: 'Pinterest: ', text: lsi3Val, url: pinterestLink },
                { label: `${row7Name}: `, text: lsi4Val, url: row7Link },
                { label: 'Drive Folder: ', text: keyChinhVal, url: driveFolderLink },
                { label: 'Google Sheet link: ', text: keyChinhVal, url: sheetLink },
                { label: 'Drive folder image: ', text: keyChinhVal, url: imageFolderLink }
              ];
              const text2 = text2Lines.map(item => `${item.label}${item.text}`).join('\n');

              const drawingLink = langObj.drawing_url || '';
              const calendarLink = step4Map['Calendar'] || '';
              const text3Lines = [
                { label: 'Google sheet: ', text: transKeys.lsi_10 || 'LSI 10', url: langObj.sheet_url },
                { label: 'Google slide: ', text: transKeys.lsi_11 || 'LSI 11', url: langObj.slide_url },
                { label: 'Google Forms: ', text: transKeys.lsi_12 || 'LSI 12', url: langObj.form_url },
                { label: 'Google Drawing: ', text: transKeys.lsi_13 || 'LSI 13', url: drawingLink },
                { label: 'Calendar: ', text: transKeys.lsi_14 || 'LSI 14', url: calendarLink }
              ];
              const text3 = text3Lines.map(item => `${item.label}${item.text}`).join('\n');

              const slideRequests = [];
              const slide1Id = 'slide1_id';
              
              slideRequests.push({
                createSlide: {
                  objectId: slide1Id,
                  insertionIndex: 0
                }
              });

              const titleBoxId = 'title_box_id';
              slideRequests.push({
                createShape: {
                  objectId: titleBoxId,
                  shapeType: 'TEXT_BOX',
                  elementProperties: {
                    pageObjectId: slide1Id,
                    size: { width: { magnitude: 650, unit: 'PT' }, height: { magnitude: 70, unit: 'PT' } },
                    transform: { scaleX: 1, scaleY: 1, translateX: 30, translateY: 30, unit: 'PT' }
                  }
                }
              }, {
                insertText: {
                  objectId: titleBoxId,
                  text: lsi11Val
                }
              }, {
                updateTextStyle: {
                  objectId: titleBoxId,
                  style: { fontSize: { magnitude: 52, unit: 'PT' }, bold: true },
                  fields: 'fontSize,bold',
                  textRange: { type: 'ALL' }
                }
              });

              const entitiesBoxId = 'entities_box_id';
              slideRequests.push({
                createShape: {
                  objectId: entitiesBoxId,
                  shapeType: 'TEXT_BOX',
                  elementProperties: {
                    pageObjectId: slide1Id,
                    size: { width: { magnitude: 300, unit: 'PT' }, height: { magnitude: 300, unit: 'PT' } },
                    transform: { scaleX: 1, scaleY: 1, translateX: 30, translateY: 120, unit: 'PT' }
                  }
                }
              }, {
                insertText: {
                  objectId: entitiesBoxId,
                  text: text2
                }
              }, {
                updateTextStyle: {
                  objectId: entitiesBoxId,
                  style: { fontSize: { magnitude: 11, unit: 'PT' } },
                  fields: 'fontSize',
                  textRange: { type: 'ALL' }
                }
              });

              let offset2 = 0;
              text2Lines.forEach(item => {
                const lineText = `${item.label}${item.text}`;
                const start = offset2 + item.label.length;
                const end = start + item.text.length;
                
                if (item.text && item.url) {
                  slideRequests.push({
                    updateTextStyle: {
                      objectId: entitiesBoxId,
                      style: { link: { url: item.url } },
                      fields: 'link',
                      textRange: {
                        type: 'FIXED_RANGE',
                        startIndex: start,
                        endIndex: end
                      }
                    }
                  });
                }
                offset2 += lineText.length + 1;
              });

              const internalBoxId = 'internal_box_id';
              slideRequests.push({
                createShape: {
                  objectId: internalBoxId,
                  shapeType: 'TEXT_BOX',
                  elementProperties: {
                    pageObjectId: slide1Id,
                    size: { width: { magnitude: 300, unit: 'PT' }, height: { magnitude: 150, unit: 'PT' } },
                    transform: { scaleX: 1, scaleY: 1, translateX: 350, translateY: 120, unit: 'PT' }
                  }
                }
              }, {
                insertText: {
                  objectId: internalBoxId,
                  text: text3
                }
              }, {
                updateTextStyle: {
                  objectId: internalBoxId,
                  style: { fontSize: { magnitude: 11, unit: 'PT' } },
                  fields: 'fontSize',
                  textRange: { type: 'ALL' }
                }
              });

              let offset3 = 0;
              text3Lines.forEach(item => {
                const lineText = `${item.label}${item.text}`;
                const start = offset3 + item.label.length;
                const end = start + item.text.length;

                if (item.text && item.url) {
                  slideRequests.push({
                    updateTextStyle: {
                      objectId: internalBoxId,
                      style: { link: { url: item.url } },
                      fields: 'link',
                      textRange: {
                        type: 'FIXED_RANGE',
                        startIndex: start,
                        endIndex: end
                      }
                    }
                  });
                }
                offset3 += lineText.length + 1;
              });

              const slide2Id = 'slide2_id';
              const contentBoxId = 'content_box_id';
              slideRequests.push({
                createSlide: {
                  objectId: slide2Id,
                  insertionIndex: 1
                }
              }, {
                createShape: {
                  objectId: contentBoxId,
                  shapeType: 'TEXT_BOX',
                  elementProperties: {
                    pageObjectId: slide2Id,
                    size: { width: { magnitude: 660, unit: 'PT' }, height: { magnitude: 500, unit: 'PT' } },
                    transform: { scaleX: 1, scaleY: 1, translateX: 30, translateY: 30, unit: 'PT' }
                  }
                }
              }, {
                insertText: {
                  objectId: contentBoxId,
                  text: rawSlideDocText || 'Nội dung bài viết LSI 11'
                }
              }, {
                updateTextStyle: {
                  objectId: contentBoxId,
                  style: { fontSize: { magnitude: 10, unit: 'PT' } },
                  fields: 'fontSize',
                  textRange: { type: 'ALL' }
                }
              });

              for (let imgIdx = 0; imgIdx < 12; imgIdx++) {
                const img = step4Images[imgIdx];
                if (img && img.driveFileId) {
                  const slideImgId = `slide_img_${imgIdx}`;
                  slideRequests.push({
                    createSlide: {
                      objectId: slideImgId,
                      insertionIndex: 2 + imgIdx
                    }
                  }, {
                    createImage: {
                      objectId: `image_element_${imgIdx}`,
                      url: `https://lh3.googleusercontent.com/d/${img.driveFileId}`,
                      elementProperties: {
                        pageObjectId: slideImgId,
                        size: { width: { magnitude: 600, unit: 'PT' }, height: { magnitude: 450, unit: 'PT' } },
                        transform: { scaleX: 1, scaleY: 1, translateX: 60, translateY: 40, unit: 'PT' }
                      }
                    }
                  });
                }
              }

              origSlides.forEach(s => {
                deleteRequests.push({ deleteObject: { objectId: s.objectId } });
              });

              await slides.presentations.batchUpdate({
                presentationId: slideId,
                requestBody: { requests: slideRequests }
              });

              if (deleteRequests.length > 0) {
                await slides.presentations.batchUpdate({
                  presentationId: slideId,
                  requestBody: { requests: deleteRequests }
                });
              }

              optResult.slide_status = 'success';
            }
          } catch (slideErr) {
            console.error(`Lỗi tối ưu Slide [${lang}]:`, slideErr.message);
            optResult.slide_status = `error: ${slideErr.message}`;
          }
        }

        if (optResult.form_status !== 'success' && langObj.form_url) {
          try {
            const formId = extractFileId(langObj.form_url);
            if (formId) {
              const forms = google.forms({ version: 'v1', auth: oauth2Client });

              let rawFormDocText = '';
              const lsi12DocAsset = langObj.docs['lsi_12'];
              if (lsi12DocAsset && lsi12DocAsset.driveUrl) {
                const lsi12DocId = extractFileId(lsi12DocAsset.driveUrl);
                if (lsi12DocId) {
                  try {
                    const lsi12DocData = await docs.documents.get({ documentId: lsi12DocId });
                    const freshDoc = lsi12DocData.data;
                    const namedRanges = freshDoc.namedRanges || {};
                    const optRange = namedRanges['opt_zone']?.namedRanges[0]?.ranges?.[0];
                    const relRange = namedRanges['rel_zone']?.namedRanges[0]?.ranges?.[0];

                    if (freshDoc.body && freshDoc.body.content) {
                      freshDoc.body.content.forEach(element => {
                        if (element.paragraph && element.paragraph.elements) {
                          const isInsideOpt = optRange && (element.startIndex >= optRange.startIndex && element.endIndex <= optRange.endIndex);
                          const isInsideRel = relRange && (element.startIndex >= relRange.startIndex && element.endIndex <= relRange.endIndex);

                          if (!isInsideOpt && !isInsideRel) {
                            element.paragraph.elements.forEach(el => {
                              if (el.textRun && el.textRun.content) {
                                rawFormDocText += el.textRun.content;
                              }
                            });
                          }
                        }
                      });
                    }
                  } catch (e) {
                    console.error("Lỗi đọc bài viết thô Form dịch:", e.message);
                  }
                }
              }

              const formObj = await forms.forms.get({ formId });
              const items = formObj.data.items || [];
              const deleteRequests = [];
              items.forEach((item, index) => {
                deleteRequests.push({ deleteItem: { location: { index: 0 } } });
              });

              if (deleteRequests.length > 0) {
                await forms.forms.batchUpdate({
                  formId,
                  requestBody: { requests: deleteRequests }
                });
              }

              const step4Map = {};
              step4Data.forEach(item => {
                step4Map[item.name] = item.assetLink || '';
              });
              const row7Asset = step4Data.find(item => item.id === 7) || { name: 'LinkedIn', assetLink: '' };
              const row7Name = row7Asset.name || 'LinkedIn';
              const siteViewLink = step4Map['Google site view'] || '';
              const myMapsLink = step4Map['Google My Maps'] || '';
              const gmbLink = step4Map['GMB post'] || '';
              const youtubeLink = step4Map['Youtube'] || '';
              const twitterLink = step4Map['Twitter'] || '';
              const pinterestLink = step4Map['Pinterest'] || '';
              const row7Link = step4Map[row7Name] || row7Asset.assetLink || '';
              const driveFolderLink = stack.drive_folder || '';
              const sheetLink = stack.sheet_created_url || '';
              const imageFolderLink = stack.image_folder_url || '';

              const drawingLink = langObj.drawing_url || '';
              const calendarLink = step4Map['Calendar'] || '';

              const relInfoVn = 'Thông tin liên quan:';
              const relInfoTrans = await transexept(relInfoVn, lang, brand, phone, address, stack.project_id, modelName);

              const formDescription = [
                rawFormDocText || 'Nội dung mô tả Google Form',
                '',
                `Website: ${stack.url}`,
                `Google site view: ${siteViewLink}`,
                `Google My Maps: ${myMapsLink}`,
                `GMB post: ${gmbLink}`,
                `Youtube: ${youtubeLink}`,
                `Twitter: ${twitterLink}`,
                `Pinterest: ${pinterestLink}`,
                `${row7Name}: ${row7Link}`,
                `Drive Folder: ${driveFolderLink}`,
                `Google Sheet link: ${sheetLink}`,
                `Drive folder image: ${imageFolderLink}`,
                '',
                `${relInfoTrans}`,
                `Google sheet: ${langObj.sheet_url}`,
                `Google slide: ${langObj.slide_url}`,
                `Google Forms: ${langObj.form_url}`,
                `Google Drawing: ${drawingLink}`,
                `Calendar: ${calendarLink}`
              ].join('\n');

              const formTitle = transKeys.lsi_12 || keywords.lsi_12 || 'LSI 12';

              await forms.forms.batchUpdate({
                formId,
                requestBody: {
                  requests: [
                    {
                      updateFormInfo: {
                        info: {
                          title: formTitle,
                          description: formDescription
                        },
                        updateMask: 'title,description'
                      }
                    }
                  ]
                }
              });

              langObj.form_view_url = formObj.data.responderUri || `https://docs.google.com/forms/d/${formId}/viewform`;
              optResult.form_status = 'success';
            }
          } catch (formErr) {
            console.error(`Lỗi tối ưu Form [${lang}]:`, formErr.message);
            optResult.form_status = `error: ${formErr.message}`;
          }
        }

        // Tối ưu hóa 10 file docs translate sau khi Sheet, Slide, Form đã tối ưu thành công
        const lsiFields = Array.from({ length: 10 }, (_, i) => `lsi_${i+5}`);
        for (const keyField of lsiFields) {
          if (optResult.docs[keyField] === 'success') continue;
          
          try {
            const ownPubLink = langObj.docs[keyField]?.pubUrl || '';
            await optimizeSingleLangDoc(
              docs,
              drive,
              keyField,
              lang,
              transKeys,
              keywords,
              langObj,
              step4Data,
              stack,
              ownPubLink,
              brand,
              phone,
              address,
              modelName
            );
            optResult.docs[keyField] = 'success';
          } catch (docErr) {
            console.error(`Lỗi tối ưu Docs ${keyField} [${lang}]:`, docErr.message);
            optResult.docs[keyField] = `error: ${docErr.message}`;
          }
        }

        optResult.status = 'success';
        optResult.error = '';

      } catch (err) {
        console.error(`Lỗi tối ưu hóa đa ngôn ngữ cho ${lang}:`, err.message);
        optResult.status = 'error';
        optResult.error = err.message;
      }
    };

    await runConcurrent(2, lang_arr, optimizeAllForLang);

    await query.run(
      'UPDATE google_stacks SET languages_opt_results = ? WHERE id = ?',
      [JSON.stringify(languagesOptResults), id]
    );

    const successCount = Object.keys(languagesOptResults).filter(l => languagesOptResults[l].status === 'success').length;
    const failedCount = Object.keys(languagesOptResults).filter(l => languagesOptResults[l].status === 'error').length;

    res.json({
      message: `Tối ưu hóa đa ngôn ngữ hoàn tất! Thành công: ${successCount}/15`,
      results: languagesOptResults,
      failed: failedCount
    });

  } catch (error) {
    console.error('Lỗi khi tối ưu hóa đa ngôn ngữ:', error);
    res.status(500).json({ error: error.message });
  }
});


// API: Shutdown server từ client
app.post('/api/shutdown', (req, res) => {
  res.json({ message: 'Đang tắt Web Local Server. Tạm biệt!' });
  console.log('Nhận yêu cầu tắt server. Đang dừng tiến trình...');
  setTimeout(() => {
    process.exit(0);
  }, 1000);
});

// Khởi chạy server
app.listen(PORT, () => {
  console.log(`Server Backend đang chạy tại http://localhost:${PORT}`);
});
