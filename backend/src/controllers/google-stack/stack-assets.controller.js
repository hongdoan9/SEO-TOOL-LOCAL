import { query } from '../../../db.js';
import { getGoogleOAuthClient } from '../../config/google-oauth.js';
import { createAndPublishAsset } from '../../services/google/drive.service.js';
import { getBusinessNapInfo, extractFolderId, runConcurrent, sanitizeFilename, extractFileId } from '../../utils/helpers.js';
import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runAssets(req, res) {
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
    const createAndPublishAssetBound = (meta) => createAndPublishAsset(meta, keywords, folderId, oauth2Client, drive, driveV2);
    const createdAssets = await runConcurrent(5, assetsMeta, createAndPublishAssetBound);
    await query.run(
      'UPDATE google_stacks SET assets = ? WHERE id = ?',
      [JSON.stringify(createdAssets), id]
    );

    res.json({ message: 'Tạo tài sản Google Stack thành công!', assets: createdAssets });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function createTempTemplates(req, res) {
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
}

export async function updateAssetsChecked(req, res) {
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
}

export async function resetAssets(req, res) {
  const { id } = req.params;
  try {
    await query.run('UPDATE google_stacks SET assets = NULL WHERE id = ?', [id]);
    res.json({ message: 'Đã reset bộ tài sản Google Stack!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function getStep4Data(req, res) {
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

    // Riêng Drawing: ưu tiên driveUrl (link edit) thay vì pubUrl (link publish)
    const getDrawingEditLink = () => {
      const drawingAsset = assets.find(a => a.keyField === 'lsi_13_drawing');
      if (drawingAsset) return drawingAsset.driveUrl || '';
      return '';
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
        // Tự động điền link Google Drawing (dùng driveUrl = link edit) nếu đã được tạo ở Bước 3
        if (item.name === 'Google Drawing') {
          const drawingEditLink = getDrawingEditLink();
          if (drawingEditLink) {
            updated.assetLink = drawingEditLink;
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
        { id: 7, name: "Linkedin", editable: true, keyField: "lsi_4", docLink: getDocLink('lsi_4'), assetLink: "", isCustomizable: true },
        { id: 8, name: "Google Drawing", editable: false, keyField: "lsi_13", docLink: getDocLink('lsi_13'), assetLink: getDrawingEditLink() },
        { id: 9, name: "Calendar", editable: false, keyField: "lsi_14", docLink: getDocLink('lsi_14'), assetLink: "" },
        { id: 11, name: "Pearltree", editable: true, keyField: "cluster_2", docLink: getDocLink('cluster_2'), assetLink: "" },
        
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
}

export async function saveStep4Data(req, res) {
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
}

export async function uploadStep4File(req, res) {
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
}

export async function uploadStep4Images(req, res) {
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
}

export async function syncStep4Drive(req, res) {
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
    let imagesDir = path.join(process.cwd(), 'uploads', 'stacks', String(id), 'images');
    if (!fs.existsSync(imagesDir)) {
      imagesDir = path.join(__dirname, 'uploads', 'stacks', String(id), 'images');
    }
    
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
}
