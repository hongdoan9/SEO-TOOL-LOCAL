import { query } from '../../../db.js';
import { getGoogleOAuthClient } from '../../config/google-oauth.js';
import { extractFileId, extractFolderId, runConcurrent, getBusinessNapInfo, extractCalendarId } from '../../utils/helpers.js';
import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function optimizeDocs(req, res) {
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
    const row7Asset = step4Data.find(item => item.id === 7) || { name: 'Linkedin', assetLink: '' };
    const row7Name = row7Asset.name || 'Linkedin';

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
}

export async function optimizePdf(req, res) {
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
    const row7Asset = step4Data.find(item => item.id === 7) || { name: 'Linkedin', assetLink: '' };
    const row7Name = row7Asset.name || 'Linkedin';

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
}

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

export async function optimizeSheet(req, res) {
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
    const row7Asset = step4Data.find(item => item.id === 7) || { name: 'Linkedin', assetLink: '' };
    const row7Name = row7Asset.name || 'Linkedin';

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
    // Lấy link Google Drawing trực tiếp từ assets Bước 3 (dùng driveUrl = link edit, KHÔNG dùng pubUrl)
    const lsi13DrawingAsset = assets.find(a => a.keyField === 'lsi_13_drawing');
    const lsi13DrawingUrl = lsi13DrawingAsset?.driveUrl || step4Map['Google Drawing'] || '';
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
}
