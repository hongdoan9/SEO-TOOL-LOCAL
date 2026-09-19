import { google } from 'googleapis';
import { getGoogleOAuthClient } from '../../config/google-oauth.js';

/**
 * Lấy Drive Client có gắn sẵn Exponential Backoff chống Rate Limit
 */
export async function getDriveClientV2(projectId) {
    const auth = await getGoogleOAuthClient(projectId);
    
    // Gắn cấu hình Retry để vượt qua lỗi 429 Too Many Requests
    return google.drive({
        version: 'v3',
        auth: auth,
        retryConfig: {
            retry: 5, // Thử lại tối đa 5 lần
            retryDelay: 2000, // Đợi 2s mỗi lần lỗi
            httpMethodsToRetry: ['GET', 'POST', 'PUT', 'DELETE'],
            statusCodesToRetry: [[429, 429], [500, 599]]
        }
    });
}

/**
 * Upload file lên Drive bằng Buffer (Dành cho việc đẩy file .docx)
 * @returns Object chứa file id và link
 */
export async function uploadBufferToDocs(driveClient, buffer, filename, parentFolderId) {
    const res = await driveClient.files.create({
        requestBody: {
            name: filename,
            parents: [parentFolderId],
            mimeType: 'application/vnd.google-apps.document' // Tự động convert .docx thành Docs
        },
        media: {
            mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            body: buffer // Truyền thẳng buffer sinh ra từ docxtemplater
        },
        fields: 'id, webViewLink'
    });
    return res.data;
}

/**
 * Upload Stream (Từ Busboy truyền qua)
 */
export async function uploadStreamToDrive(driveClient, fileStream, filename, mimeType, parentFolderId) {
    const res = await driveClient.files.create({
        requestBody: {
            name: filename,
            parents: [parentFolderId]
        },
        media: {
            mimeType: mimeType,
            body: fileStream // Ống nước chảy thẳng từ Browser -> Drive
        },
        fields: 'id, webViewLink'
    });
    return res.data;
}
