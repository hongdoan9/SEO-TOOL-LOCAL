import { query } from '../../../db.js';
import { getGoogleOAuthClient } from '../../config/google-oauth.js';
import { createAndPublishAsset } from '../../services/google/drive.service.js';
import { extractFolderId, runConcurrent } from '../../utils/helpers.js';
import { google } from 'googleapis';

export async function processCreateAssets(data) {
    const { stackId, updateProgress } = data;
    if (updateProgress) updateProgress(5, 'Khởi tạo tiến trình tạo Assets...');
    
    const stack = await query.get('SELECT * FROM google_stacks WHERE id = ?', [stackId]);
    if (!stack) throw new Error('Không tìm thấy bộ Google Stack');

    const keywords = stack.keywords ? JSON.parse(stack.keywords) : null;
    if (!keywords) throw new Error('Bộ Google Stack chưa cấu hình từ khóa ở Bước 1!');

    const folderId = extractFolderId(stack.drive_folder);
    if (!folderId) throw new Error('Đường dẫn Drive Folder không đúng định dạng!');

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
    
    // Ở Queue V2, ta vẫn dùng runConcurrent nhưng an toàn không sợ HTTP timeout
    const createAndPublishAssetBound = async (meta) => {
        const result = await createAndPublishAsset(meta, keywords, folderId, oauth2Client, drive, driveV2);
        if (updateProgress) updateProgress(15 + Math.floor(Math.random() * 80), `Đang xử lý ${meta.keyField}...`);
        return result;
    };
    
    const createdAssets = await runConcurrent(5, assetsMeta, createAndPublishAssetBound);
    
    await query.run(
      'UPDATE google_stacks SET assets = ? WHERE id = ?',
      [JSON.stringify(createdAssets), stackId]
    );

    if (updateProgress) updateProgress(100, 'Tạo tài sản hoàn tất!');
    return { message: 'Tạo tài sản thành công', count: createdAssets.length, assets: createdAssets };
}
