import { google } from 'googleapis';
import { extractFileId } from '../../utils/helpers.js';

export async function optimizeSingleSheet(sheets, docs, docId, sheetId, keywords, transKeys, lsi10Val, lang, langObj, step4Data, step4Images, stack, brand, phone, address, modelName) {
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
}
