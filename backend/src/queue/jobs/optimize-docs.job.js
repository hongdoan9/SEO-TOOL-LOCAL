import { query } from '../../../db.js';
import { getGoogleOAuthClient } from '../../config/google-oauth.js';
import { extractFileId } from '../../utils/helpers.js';
import { google } from 'googleapis';

export async function processOptimizeDocs(data) {
    const { stackId, targetKeys, updateProgress } = data;
    if (updateProgress) updateProgress(10, 'Bắt đầu đọc dữ liệu tối ưu Docs...');
    const stack = await query.get('SELECT * FROM google_stacks WHERE id = ?', [stackId]);
    if (!stack) throw new Error('Không tìm thấy bộ Google Stack');

    const keywords = stack.keywords ? JSON.parse(stack.keywords) : {};
    const assets = stack.assets ? JSON.parse(stack.assets) : [];
    const step4Data = stack.step4_data ? JSON.parse(stack.step4_data) : [];

    let docsAssets = assets.filter(a => a.type === 'document' && a.driveUrl);
    if (targetKeys && Array.isArray(targetKeys) && targetKeys.length > 0) {
      docsAssets = docsAssets.filter(a => targetKeys.includes(a.keyField));
    }
    if (docsAssets.length === 0) return { message: 'Không có tài liệu nào cần tối ưu hóa!', results: [] };

    // Khởi tạo OAuth client
    const oauth2Client = await getGoogleOAuthClient(stack.project_id);
    const docs = google.docs({ version: 'v1', auth: oauth2Client });

    // Lấy thông tin các link
    const row7Asset = step4Data.find(item => item.id === 7) || { name: 'Linkedin', assetLink: '' };
    const row7Name = row7Asset.name || 'Linkedin';
    const step4Map = {};
    step4Data.forEach(item => { step4Map[item.name] = item.assetLink || ''; });

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

    // Hàm tối ưu 1 doc (Logic V1 được dời vào Queue V2 để không bị Timeout)
    let count = 0;
    const optimizeSingleDoc = async (asset) => {
      count++;
      if (updateProgress) updateProgress(20 + Math.floor(count / docsAssets.length * 75), `Đang tối ưu Docs: ${asset.keyField}...`);
      
      const documentId = extractFileId(asset.driveUrl);
      if (!documentId) return { keyField: asset.keyField, status: 'error', message: 'Lỗi ID' };

      const ownKey = asset.keyField;
      const ownTitle = keywords[ownKey] || asset.title || '';
      const ownPubLink = asset.pubUrl || asset.driveUrl || '';

      try {
        const docRes = await docs.documents.get({ documentId });
        const doc = docRes.data;
        const namedRanges = doc.namedRanges || {};
        const deleteRequests = [];

        if (namedRanges['rel_zone']) {
          const ranges = namedRanges['rel_zone'].namedRanges[0].ranges || [];
          ranges.forEach(r => { deleteRequests.push({ deleteContentRange: { range: { segmentId: r.segmentId || '', startIndex: r.startIndex, endIndex: r.endIndex } } }); });
        }
        if (namedRanges['opt_zone']) {
          const ranges = namedRanges['opt_zone'].namedRanges[0].ranges || [];
          ranges.forEach(r => { deleteRequests.push({ deleteContentRange: { range: { segmentId: r.segmentId || '', startIndex: r.startIndex, endIndex: r.endIndex } } }); });
        }

        if (deleteRequests.length > 0) {
          await docs.documents.batchUpdate({ documentId, requestBody: { requests: deleteRequests } });
        }

        const freshDocRes = await docs.documents.get({ documentId });
        const freshDoc = freshDocRes.data;
        const bodyContent = freshDoc.body.content || [];

        let paragraphCount = 0;
        let optInsertIndex = 1;
        for (let i = 0; i < bodyContent.length; i++) {
          const element = bodyContent[i];
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

        const lastElement = bodyContent[bodyContent.length - 1];
        const relInsertIndex = lastElement.endIndex - 1;

        const keyChinhVal = keywords.key_chinh || stack.main_key || 'Key chính';
        const keyChinhLocalVal = keywords.key_chinh_local || 'Key chính + Local';
        const lsi1Val = keywords.lsi_1 || 'LSI 1';
        const lsi2Val = keywords.lsi_2 || 'LSI 2';
        const lsi3Val = keywords.lsi_3 || 'LSI 3';
        const lsi4Val = keywords.lsi_4 || 'LSI 4';

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
        const optText = '\n' + optLines.join('\u000b') + '\n';

        let relatedKeys = [];
        const numPattern = /\d+/;
        const ownNumMatch = ownKey.match(numPattern);
        const ownNum = ownNumMatch ? parseInt(ownNumMatch[0], 10) : null;

        if (ownKey.startsWith('cluster_')) { relatedKeys = ['cluster_1', 'cluster_2', 'cluster_3', 'cluster_4', 'cluster_5', 'cluster_6']; }
        else if (ownKey === 'key_chinh_local' || (ownNum >= 1 && ownNum <= 4)) { relatedKeys = ['key_chinh_local', 'lsi_1', 'lsi_2', 'lsi_3', 'lsi_4']; }
        else if (ownNum >= 5 && ownNum <= 9) { relatedKeys = ['lsi_5', 'lsi_6', 'lsi_7', 'lsi_8', 'lsi_9']; }
        else if (ownNum >= 10 && ownNum <= 14) { relatedKeys = ['lsi_10', 'lsi_11', 'lsi_12', 'lsi_13', 'lsi_14']; }
        else if (ownNum >= 15 && ownNum <= 19) { relatedKeys = ['lsi_15', 'lsi_16', 'lsi_17', 'lsi_18', 'lsi_19']; }
        else if (ownNum >= 20 && ownNum <= 24) { relatedKeys = ['lsi_20', 'lsi_21', 'lsi_22', 'lsi_23', 'lsi_24']; }
        else if (ownNum >= 25 && ownNum <= 29) { relatedKeys = ['lsi_25', 'lsi_26', 'lsi_27', 'lsi_28', 'lsi_29']; }

        const relLines = ['', 'Bài viết liên quan:'];
        relatedKeys.forEach(k => { const keyTitle = keywords[k] || ''; if (keyTitle.trim()) relLines.push(keyTitle); });
        relLines.push('');
        const relText = relLines.join('\n');

        const insertRequests = [];
        insertRequests.push({ insertText: { location: { index: relInsertIndex }, text: relText } });

        let currentRelOffset = relInsertIndex + 1 + relLines[1].length + 1;
        for (let j = 2; j < relLines.length - 1; j++) {
          const keyTitle = relLines[j];
          const k = relatedKeys[j - 2];
          const relatedAsset = assets.find(a => a.keyField === k);
          const relatedDriveUrl = relatedAsset?.driveUrl || '';
          if (relatedDriveUrl) {
            insertRequests.push({ updateTextStyle: { range: { startIndex: currentRelOffset, endIndex: currentRelOffset + keyTitle.length }, textStyle: { link: { url: relatedDriveUrl } }, fields: 'link' } });
          }
          currentRelOffset += keyTitle.length + 1;
        }

        insertRequests.push({ createNamedRange: { name: 'rel_zone', range: { startIndex: relInsertIndex, endIndex: relInsertIndex + relText.length } } });
        insertRequests.push({ insertText: { location: { index: optInsertIndex }, text: optText } });

        let currentOptOffset = optInsertIndex + 1;
        const addLinkReq = (lineText, linkStartStr, linkUrl, linkLength) => {
          const start = currentOptOffset + linkStartStr.length;
          if (linkUrl) {
            insertRequests.push({ updateTextStyle: { range: { startIndex: start, endIndex: start + linkLength }, textStyle: { link: { url: linkUrl } }, fields: 'link' } });
          }
          currentOptOffset += lineText.length + 1;
        };

        const ownTitleLinkStart = currentOptOffset + ownTitle.length + 2;
        if (ownPubLink) insertRequests.push({ updateTextStyle: { range: { startIndex: ownTitleLinkStart, endIndex: ownTitleLinkStart + ownTitle.length }, textStyle: { link: { url: ownPubLink } }, fields: 'link' } });
        currentOptOffset += optLines[0].length + 1;

        addLinkReq(optLines[1], 'Website: ', stack.url, keyChinhVal.length);
        addLinkReq(optLines[2], 'Google site view: ', siteViewLink, keyChinhVal.length);
        addLinkReq(optLines[3], 'Google My Maps: ', myMapsLink, keyChinhLocalVal.length);
        addLinkReq(optLines[4], 'GMB post: ', gmbLink, keyChinhVal.length);
        addLinkReq(optLines[5], 'Youtube: ', youtubeLink, lsi1Val.length);
        addLinkReq(optLines[6], 'Twitter: ', twitterLink, lsi2Val.length);
        addLinkReq(optLines[7], 'Pinterest: ', pinterestLink, lsi3Val.length);
        addLinkReq(optLines[8], `${row7Name}: `, row7Link, lsi4Val.length);
        addLinkReq(optLines[9], 'Drive Folder: ', driveFolderLink, keyChinhVal.length);
        addLinkReq(optLines[10], 'Google Sheet link: ', sheetLink, keyChinhVal.length);
        addLinkReq(optLines[11], 'Drive folder image: ', imageFolderLink, keyChinhVal.length);

        insertRequests.push({ createNamedRange: { name: 'opt_zone', range: { startIndex: optInsertIndex, endIndex: optInsertIndex + optText.length } } });

        await docs.documents.batchUpdate({ documentId, requestBody: { requests: insertRequests } });
        return { keyField: asset.keyField, title: ownTitle, status: 'success' };
      } catch (err) {
        return { keyField: asset.keyField, title: ownTitle, status: 'error', message: err.message };
      }
    };

    const results = [];
    const limit = 5;
    const activePromises = [];
    for (const asset of docsAssets) {
      const p = optimizeSingleDoc(asset).then(res => {
        results.push(res);
        activePromises.splice(activePromises.indexOf(p), 1);
      });
      activePromises.push(p);
      if (activePromises.length >= limit) await Promise.race(activePromises);
    }
    await Promise.all(activePromises);

    let finalResults = [];
    if (targetKeys && Array.isArray(targetKeys) && targetKeys.length > 0) {
      const prevResults = stack.optimize_results ? JSON.parse(stack.optimize_results) : [];
      finalResults = prevResults.map(oldRes => {
        const updated = results.find(n => n.keyField === oldRes.keyField);
        return updated ? updated : oldRes;
      });
      results.forEach(r => { if (!finalResults.some(f => f.keyField === r.keyField)) finalResults.push(r); });
    } else {
      finalResults = results;
    }

    await query.run('UPDATE google_stacks SET optimize_results = ? WHERE id = ?', [JSON.stringify(finalResults), stackId]);
    return { message: `Đã tối ưu hóa Docs thành công ${finalResults.filter(r => r.status === 'success').length} file`, results: finalResults };
}
