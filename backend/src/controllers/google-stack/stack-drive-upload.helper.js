import { getGoogleOAuthClient } from '../../config/google-oauth.js';
import { extractFolderId } from '../../utils/helpers.js';
import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

/**
 * Tải 1 tệp đính kèm (Video, Script, KML) trực tiếp lên Google Drive Folder chính
 */
export async function uploadSingleFileToDrive(stack, fileType, localFilename) {
  try {
    if (!stack?.project_id) {
      console.warn('[Drive Upload] Bỏ qua upload: Không tìm thấy Project ID');
      return { driveFileId: null, driveUrl: null, error: 'Thiếu Project ID' };
    }

    const parentFolderId = extractFolderId(stack.drive_folder) || extractFolderId(stack.image_folder_url);
    if (!parentFolderId) {
      console.warn('[Drive Upload] Bỏ qua upload: Không trích xuất được Folder ID từ drive_folder:', stack.drive_folder);
      return { driveFileId: null, driveUrl: null, error: 'Thư mục Drive chính chưa đúng định dạng' };
    }

    const oauth2Client = await getGoogleOAuthClient(stack.project_id);
    if (!oauth2Client) {
      console.warn('[Drive Upload] Bỏ qua upload: Chưa kết nối Google OAuth');
      return { driveFileId: null, driveUrl: null, error: 'Chưa kết nối Google OAuth' };
    }

    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    const localPath = path.join(process.cwd(), 'uploads', 'stacks', String(stack.id), 'files', localFilename);

    if (!fs.existsSync(localPath)) {
      console.warn('[Drive Upload] File local không tồn tại:', localPath);
      return { driveFileId: null, driveUrl: null, error: 'File local không tồn tại' };
    }

    let mimeType = 'application/octet-stream';
    if (fileType === 'video') mimeType = 'video/mp4';
    else if (fileType === 'script') mimeType = 'text/plain';
    else if (fileType === 'kml') mimeType = 'application/vnd.google-earth.kml+xml';

    const media = { mimeType, body: fs.createReadStream(localPath) };
    const fileMetadata = { name: localFilename, parents: [parentFolderId] };

    console.log(`[Drive Upload] Đang đẩy file đính kèm lên Google Drive (Folder ID: ${parentFolderId}): ${localFilename}`);
    const driveFile = await drive.files.create({
      requestBody: fileMetadata,
      media,
      fields: 'id, webViewLink'
    });

    const fileId = driveFile.data.id;
    const driveUrl = driveFile.data.webViewLink;

    // Share public reader cho file
    try {
      await drive.permissions.create({
        fileId: fileId,
        requestBody: { role: 'reader', type: 'anyone' }
      });
    } catch (permErr) {
      console.error(`[Drive Upload] Lỗi share public file ${fileId}:`, permErr.message);
    }

    console.log(`[Drive Upload] Upload Drive thành công! URL: ${driveUrl}`);
    return { driveFileId: fileId, driveUrl, error: null };
  } catch (error) {
    console.error(`[Drive Upload] Lỗi upload file ${localFilename} lên Drive:`, error.message);
    return { driveFileId: null, driveUrl: null, error: error.message };
  }
}
