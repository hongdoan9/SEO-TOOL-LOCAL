import { query } from '../../../db.js';
import { getGoogleOAuthClient } from '../../config/google-oauth.js';
import { extractFolderId, sanitizeFilename } from '../../utils/helpers.js';
import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

// Helper: Legacy upload logic for attached files (Video, Script, KML) stored for future reuse
export async function uploadStep4AttachedFilesLegacy(stack, keywords, step4Data, parentFolderId, drive, makePublic) {
  const filesDir = path.join(process.cwd(), 'uploads', 'stacks', String(stack.id), 'files');
  const updatedStep4Data = [...step4Data];
  
  for (let idx = 0; idx < updatedStep4Data.length; idx++) {
    const item = updatedStep4Data[idx];
    if (item.isUpload && item.assetLink) {
      const localFilename = item.fileInfo?.filename;
      if (!localFilename) continue;
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

        let mimeType = 'application/octet-stream';
        if (item.fileType === 'video') mimeType = 'video/mp4';
        else if (item.fileType === 'script') mimeType = 'text/plain';
        else if (item.fileType === 'kml') mimeType = 'application/vnd.google-earth.kml+xml';

        const media = { mimeType, body: fs.createReadStream(localPath) };
        const fileMetadata = { name: cleanNameOnDrive, parents: [parentFolderId] };
        const driveFile = await drive.files.create({ requestBody: fileMetadata, media, fields: 'id, webViewLink' });
        await makePublic(driveFile.data.id);

        updatedStep4Data[idx] = {
          ...item,
          driveUrl: driveFile.data.webViewLink,
          assetLink: driveFile.data.webViewLink
        };
      }
    }
  }
  return updatedStep4Data;
}

export async function syncStep4Drive(req, res) {
  const { id } = req.params;
  try {
    const stack = await query.get('SELECT * FROM google_stacks WHERE id = ?', [id]);
    if (!stack) return res.status(404).json({ error: 'Không tìm thấy bộ Google Stack' });

    const keywords = stack.keywords ? JSON.parse(stack.keywords) : {};
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
          requestBody: { role: 'reader', type: 'anyone' }
        });
      } catch (e) {
        console.error(`Lỗi share public ${fileId}:`, e.message);
      }
    };

    // --- Nhiệm vụ 1: Tạo thư mục ảnh con: {Key chính - Image folder} ---
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

    const promises = [];

    // --- Nhiệm vụ 2: Tạo và Publish Google Sheet chính ---
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

      try {
        const revList = await driveV2.revisions.list({ fileId: sheetId });
        const revisions = revList.data.items || [];
        const revisionId = revisions.length > 0 ? revisions[revisions.length - 1].id : '1';
        
        await driveV2.revisions.update({
          fileId: sheetId,
          revisionId: revisionId,
          resource: { published: true, publishAuto: true }
        });
      } catch (revErr) {
        console.error(`Không thể publish sheet revision:`, revErr.message);
      }
    };
    promises.push(createSheetPromise());

    // --- Nhiệm vụ 3: Upload 12 ảnh song song lên Google Drive (Đặt tên tiếng Việt có dấu) ---
    const updatedImages = new Array(step4Images.length);
    let imagesDir = path.join(process.cwd(), 'uploads', 'stacks', String(id), 'images');

    step4Images.forEach((img, idx) => {
      const uploadImageTask = async () => {
        const localPath = path.join(imagesDir, img.filename);
        if (fs.existsSync(localPath)) {
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
            filename: cleanNameOnDrive,
            driveFileId: driveFile.data.id,
            driveUrl: driveFile.data.webViewLink
          };
        } else {
          updatedImages[idx] = img;
        }
      };
      promises.push(uploadImageTask());
    });

    // --- Nhiệm vụ 4 (Tạm ngưng): Upload file đính kèm nặng (Video, Script, KML) ---
    // Đã tách ra hàm uploadStep4AttachedFilesLegacy và tạm ngưng gọi ở bước này theo yêu cầu.

    await Promise.all(promises);

    // Lưu URL Sheet tổng, URL folder ảnh, và thông tin 12 ảnh trên Drive vào DB
    await query.run(
      'UPDATE google_stacks SET sheet_created_url = ?, image_folder_url = ?, step4_images = ? WHERE id = ?',
      [sheetUrl, imageFolderUrl, JSON.stringify(updatedImages), id]
    );

    res.json({
      message: 'Đã đồng bộ Thư mục Drive, Google Sheet và 12 Image thành công!',
      sheet_created_url: sheetUrl,
      image_folder_url: imageFolderUrl,
      step4_images: updatedImages
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
