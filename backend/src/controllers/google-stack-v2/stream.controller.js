import Busboy from 'busboy';
import { getDriveClientV2, uploadStreamToDrive } from '../../services/google-v2/drive.service.js';
import { extractFolderId } from '../../utils/helpers.js';

export async function uploadFileStream(req, res) {
    const { projectId, folderUrl } = req.query; // Nhận cấu hình từ URL params
    
    if (!projectId || !folderUrl) {
        return res.status(400).json({ error: 'Thiếu cấu hình Project ID hoặc Folder URL!' });
    }

    const folderId = extractFolderId(folderUrl);
    let driveClient;
    try {
        driveClient = await getDriveClientV2(projectId);
    } catch (e) {
        return res.status(500).json({ error: 'Lỗi xác thực Google: ' + e.message });
    }

    const busboy = Busboy({ headers: req.headers });

    busboy.on('file', async (fieldname, file, info) => {
        const { filename, encoding, mimeType } = info;
        try {
            console.log(`Đang stream upload file trực tiếp: ${filename}`);
            
            // Luồng dữ liệu (file stream) chảy trực tiếp qua Drive API
            const driveRes = await uploadStreamToDrive(driveClient, file, filename, mimeType, folderId);
            
            // Tùy chọn: Share public ngay lập tức
            await driveClient.permissions.create({
                fileId: driveRes.id,
                requestBody: { role: 'reader', type: 'anyone' }
            });

            res.json({ message: 'Upload stream thành công!', url: driveRes.webViewLink });
        } catch (error) {
            console.error('Lỗi upload stream:', error);
            res.status(500).json({ error: error.message });
        }
    });

    busboy.on('error', (err) => {
        res.status(500).json({ error: 'Lỗi xử lý file upload: ' + err.message });
    });

    req.pipe(busboy);
}
