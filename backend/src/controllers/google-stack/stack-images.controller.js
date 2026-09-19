import { query } from '../../../db.js';
import { sanitizeFilename } from '../../utils/helpers.js';
import fs from 'fs';
import path from 'path';

// Helper: Migrate legacy files uploaded inside src/controllers/google-stack/uploads to root uploads/
function checkAndMigrateLegacyUploads(id) {
  try {
    const legacyBase = path.join(process.cwd(), 'src', 'controllers', 'google-stack', 'uploads', 'stacks', String(id));
    const targetBase = path.join(process.cwd(), 'uploads', 'stacks', String(id));

    if (fs.existsSync(legacyBase)) {
      ['images', 'files'].forEach(folder => {
        const legacyDir = path.join(legacyBase, folder);
        const targetDir = path.join(targetBase, folder);

        if (fs.existsSync(legacyDir)) {
          if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
          }
          const files = fs.readdirSync(legacyDir);
          files.forEach(file => {
            const oldPath = path.join(legacyDir, file);
            const newPath = path.join(targetDir, file);
            if (fs.lstatSync(oldPath).isFile()) {
              fs.copyFileSync(oldPath, newPath);
              fs.unlinkSync(oldPath);
            }
          });
        }
      });
    }
  } catch (e) {
    console.error('Migration legacy upload files error:', e.message);
  }
}

import { uploadSingleFileToDrive } from './stack-drive-upload.helper.js';

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

    checkAndMigrateLegacyUploads(id);

    const keywords = stack.keywords ? JSON.parse(stack.keywords) : {};
    
    let keyVal = '';
    if (fileType === 'video' || fileType === 'script') {
      keyVal = stack.main_key || 'main_key';
    } else if (fileType === 'kml') {
      keyVal = keywords.lsi_local || 'lsi_local';
    }

    const ext = path.extname(file.originalname) || (fileType === 'video' ? '.mp4' : fileType === 'script' ? '.txt' : '.kml');
    const newFilename = sanitizeFilename(keyVal) + ext;
    const targetDir = path.join(process.cwd(), 'uploads', 'stacks', String(id), 'files');
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
      step4Data = [
        { id: 1, name: "Google site view", editable: false, keyField: "main_key", docLink: "Không có", assetLink: "" },
        { id: 2, name: "Google My Maps", editable: false, keyField: "key_chinh_local", docLink: "Không có", assetLink: "" },
        { id: 3, name: "GMB post", editable: false, keyField: "main_key", docLink: "Không có", assetLink: "" },
        { id: 4, name: "Youtube", editable: false, keyField: "lsi_1", docLink: "Không có", assetLink: "" },
        { id: 5, name: "Twitter", editable: false, keyField: "lsi_2", docLink: "Không có", assetLink: "" },
        { id: 6, name: "Pinterest", editable: false, keyField: "lsi_3", docLink: "Không có", assetLink: "" },
        { id: 7, name: "Linkedin", editable: true, keyField: "lsi_4", docLink: "Không có", assetLink: "", isCustomizable: true },
        { id: 8, name: "Google Drawing", editable: false, keyField: "lsi_13", docLink: "Không có", assetLink: "" },
        { id: 9, name: "Calendar", editable: false, keyField: "lsi_14", docLink: "Không có", assetLink: "" },
        { id: 11, name: "Pearltree", editable: true, keyField: "cluster_2", docLink: "Không có", assetLink: "" },
        { id: 16, name: "Video upload", editable: false, keyField: "main_key", docLink: "Không có", assetLink: "", isUpload: true, fileType: "video", accept: ".mp4" },
        { id: 17, name: "Script upload", editable: false, keyField: "main_key", docLink: "Không có", assetLink: "", isUpload: true, fileType: "script", accept: ".txt" },
        { id: 18, name: "KML upload", editable: false, keyField: "lsi_local", docLink: "Không có", assetLink: "", isUpload: true, fileType: "kml", accept: ".kml" }
      ];
    }

    const driveResult = await uploadSingleFileToDrive(stack, fileType, newFilename);
    const driveUrl = driveResult?.driveUrl || null;

    const fileUrl = `/uploads/stacks/${id}/files/${newFilename}`;
    step4Data = step4Data.map(item => {
      if (item.isUpload && item.fileType === fileType) {
        const finalLink = driveUrl || fileUrl;
        return {
          ...item,
          assetLink: finalLink,
          driveUrl: driveUrl || item.driveUrl || '',
          fileInfo: {
            filename: newFilename,
            originalName: file.originalname,
            size: file.size,
            uploadedAt: new Date().toISOString(),
            driveUrl: driveUrl || item.fileInfo?.driveUrl || '',
            driveFileId: driveResult?.driveFileId || item.fileInfo?.driveFileId || ''
          }
        };
      }
      return item;
    });

    await query.run(
      'UPDATE google_stacks SET step4_data = ? WHERE id = ?',
      [JSON.stringify(step4Data), id]
    );

    const msg = driveUrl 
      ? `Upload file thành công và đã đẩy lên Google Drive!` 
      : (driveResult?.error ? `Upload file local thành công! (Drive: ${driveResult.error})` : `Upload file local thành công!`);

    res.json({ message: msg, step4_data: step4Data, drive_url: driveUrl, drive_error: driveResult?.error });
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

    checkAndMigrateLegacyUploads(id);

    const keywords = stack.keywords ? JSON.parse(stack.keywords) : {};
    
    const targetDir = path.join(process.cwd(), 'uploads', 'stacks', String(id), 'images');
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
