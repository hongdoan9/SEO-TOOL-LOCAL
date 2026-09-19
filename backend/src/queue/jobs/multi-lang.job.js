import { query } from '../../../db.js';
import { getGoogleOAuthClient } from '../../config/google-oauth.js';
import { getBusinessNapInfo, extractFolderId, extractFileId, runConcurrent, getLanguageFullName } from '../../utils/helpers.js';
import { google } from 'googleapis';
import { translateTextBatch, transexept, translateAndPreserveDoc } from '../../services/translate.service.js';
import { optimizeSingleLangDoc } from '../../services/google/docs.service.js';

export async function processTranslateKeys(data) {
  const { stackId: id, model, updateProgress } = data || {};
  const modelName = model || 'google/gemini-2.5-flash:free';
  if (updateProgress) updateProgress(10, 'Bắt đầu dịch từ khóa (15 ngôn ngữ)...');

  try {
    const stack = await query.get('SELECT * FROM google_stacks WHERE id = ?', [id]);
    if (!stack) throw new Error('Kh么ng t矛m th岷 b峄?Google Stack');

    const keywords = stack.keywords ? JSON.parse(stack.keywords) : {};
    const { brand, phone, address } = await getBusinessNapInfo(stack.project_id);

    const keysToTranslate = [
      'key_chinh',
      'key_chinh_local',
      ...Array.from({ length: 14 }, (_, i) => `lsi_${i+1}`)
    ];

    const lang_arr = ['ar','hi','ru','zh','en','ja','de','es','pt','fr','bn','pl','fi','ko','it'];
    
    let languagesData = stack.languages_data ? JSON.parse(stack.languages_data) : {};
    if (!languagesData.translated_keys) {
      languagesData.translated_keys = {};
    }

    const translateAllForLang = async (lang) => {
      if (!languagesData.translated_keys[lang]) {
        languagesData.translated_keys[lang] = {};
      }
      
      const langKeys = languagesData.translated_keys[lang];

      const originalTexts = keysToTranslate.map(keyField => {
        return keyField === 'key_chinh' ? stack.main_key : (keywords[keyField] || '');
      });

      const indicesToTranslate = [];
      const textsToTranslate = [];

      originalTexts.forEach((text, idx) => {
        const keyField = keysToTranslate[idx];
        if (langKeys[keyField] && langKeys[keyField].trim()) return;

        if (!text || !text.trim()) {
          langKeys[keyField] = '';
          return;
        }

        if (keyField === 'key_chinh' && brand && text.toLowerCase().trim() === brand.toLowerCase().trim()) {
          langKeys[keyField] = text;
          return;
        }

        indicesToTranslate.push(idx);
        textsToTranslate.push(text);
      });

      if (textsToTranslate.length > 0) {
        try {
          const translatedTexts = await translateTextBatch(textsToTranslate, lang);
          indicesToTranslate.forEach((origIdx, transIdx) => {
            const keyField = keysToTranslate[origIdx];
            langKeys[keyField] = translatedTexts[transIdx] || originalTexts[origIdx];
          });
        } catch (err) {
          console.error(`L峄梚 d峄媍h g峄檖 t峄?kh贸a sang ${lang}:`, err.message);
          indicesToTranslate.forEach(origIdx => {
            const keyField = keysToTranslate[origIdx];
            langKeys[keyField] = originalTexts[origIdx];
          });
        }
      }

      // 膼岷 b岷 kh么ng b峄?tr峄憂g key_chinh
      if (!langKeys.key_chinh || !langKeys.key_chinh.trim()) {
        langKeys.key_chinh = stack.main_key || '';
      }
    };

    await runConcurrent(5, lang_arr, translateAllForLang);

    await query.run(
      'UPDATE google_stacks SET languages_data = ? WHERE id = ?',
      [JSON.stringify(languagesData), id]
    );

    return {
      message: 'D峄媍h b峄?t峄?kh贸a th脿nh c么ng!',
      translated_keys: languagesData.translated_keys
    };

  } catch (error) {
    console.error('L峄梚 khi d峄媍h t峄?kh贸a:', error);
    throw new Error(error.message);
  }
}

export async function processCreateLangAssets(data) {
  const { stackId: id, model, updateProgress } = data || {};
  const modelName = model || 'google/gemini-2.5-flash:free';
  if (updateProgress) updateProgress(10, 'Bắt đầu tạo tài sản 15 ngôn ngữ...');

  try {
    const stack = await query.get('SELECT * FROM google_stacks WHERE id = ?', [id]);
    if (!stack) throw new Error('Kh么ng t矛m th岷 b峄?Google Stack');

    const keywords = stack.keywords ? JSON.parse(stack.keywords) : {};
    const assets = stack.assets ? JSON.parse(stack.assets) : [];
    const step4Images = stack.step4_images ? JSON.parse(stack.step4_images) : [];

    const languagesData = stack.languages_data ? JSON.parse(stack.languages_data) : {};
    const translatedKeysMap = languagesData.translated_keys || {};

    if (Object.keys(translatedKeysMap).length === 0) {
      throw new Error('Ch瓢a c贸 d峄?li峄噓 t峄?kh贸a d峄媍h! Vui l貌ng d峄媍h t峄?kh贸a tr瓢峄沜.');
    }

    const { brand, phone, address } = await getBusinessNapInfo(stack.project_id);
    const parentFolderId = extractFolderId(stack.drive_folder);
    if (!parentFolderId) {
      throw new Error('膼瓢峄漬g d岷玭 Drive Folder g峄慶 kh么ng 膽煤ng 膽峄媙h d岷g!');
    }

    const oauth2Client = await getGoogleOAuthClient(stack.project_id);
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    const docs = google.docs({ version: 'v1', auth: oauth2Client });

    const lang_arr = ['ar','hi','ru','zh','en','ja','de','es','pt','fr','bn','pl','fi','ko','it'];
    
    if (!languagesData.assets) {
      languagesData.assets = {};
    }

    const processSingleLang = async (lang) => {
      if (!languagesData.assets[lang]) {
        languagesData.assets[lang] = {
          status: 'pending',
          folder_url: '',
          docs: {},
          sheet_url: '',
          slide_url: '',
          form_url: '',
          drawing_url: '',
          error: ''
        };
      }

      const langObj = languagesData.assets[lang];
      const transKeys = translatedKeysMap[lang] || {};

      try {
        let folderId = '';
        if (!langObj.folder_url) {
          const keyChinhVal = transKeys.key_chinh || stack.main_key || '';
          let folderName = '';
          
          if (brand && keyChinhVal.toLowerCase().trim() === brand.toLowerCase().trim()) {
            const langFullName = getLanguageFullName(lang);
            folderName = `${brand} - ${langFullName}`;
          } else {
            folderName = keyChinhVal;
          }

          const fileMetadata = {
            name: folderName,
            mimeType: 'application/vnd.google-apps.folder',
            parents: [parentFolderId]
          };

          const newFolder = await drive.files.create({
            requestBody: fileMetadata,
            fields: 'id, webViewLink'
          });

          await drive.permissions.create({
            fileId: newFolder.data.id,
            requestBody: { role: 'reader', type: 'anyone' }
          });

          folderId = newFolder.data.id;
          langObj.folder_url = newFolder.data.webViewLink;
        } else {
          folderId = extractFolderId(langObj.folder_url);
        }

        if (!langObj.docs) langObj.docs = {};
        const lsiFields = Array.from({ length: 10 }, (_, i) => `lsi_${i+5}`);

        const getTitle = (k) => {
          if (k === 'key_chinh') return transKeys.key_chinh || stack.main_key;
          return transKeys[k] || keywords[k] || `${k} (${lang})`;
        };

        for (const keyField of lsiFields) {
          if (langObj.docs[keyField] && langObj.docs[keyField].status === 'success') {
            continue;
          }

          langObj.docs[keyField] = { status: 'pending', driveUrl: '', pubUrl: '' };

          let origDocFileId = '';
          if (languagesData.temp_docs && languagesData.temp_docs[keyField] && languagesData.temp_docs[keyField].id) {
            origDocFileId = languagesData.temp_docs[keyField].id;
          } else {
            const origDocAsset = assets.find(a => a.keyField === keyField);
            if (origDocAsset && origDocAsset.driveUrl) {
              origDocFileId = extractFileId(origDocAsset.driveUrl);
            }
          }

          if (!origDocFileId) {
            langObj.docs[keyField].status = 'error';
            langObj.docs[keyField].error = 'Kh么ng t矛m th岷 file 膽峄噈 s岷h ho岷穋 t峄噋 Docs ti岷縩g Vi峄噒 g峄慶';
            continue;
          }

          try {
            const docTitle = getTitle(keyField);
            const docResult = await translateAndPreserveDoc(
              docs,
              drive,
              origDocFileId,
              folderId,
              docTitle,
              lang,
              brand,
              phone,
              address,
              stack.project_id,
              modelName,
              oauth2Client
            );

            langObj.docs[keyField] = {
              status: 'success',
              driveUrl: docResult.driveUrl,
              pubUrl: docResult.pubUrl
            };
          } catch (docErr) {
            langObj.docs[keyField].status = 'error';
            langObj.docs[keyField].error = docErr.message;
          }
        }

        if (!langObj.sheet_url) {
          const origSheetAsset = assets.find(a => a.keyField === 'lsi_10_spreadsheet');
          if (origSheetAsset && origSheetAsset.driveUrl) {
            const origSheetId = extractFileId(origSheetAsset.driveUrl);
            if (origSheetId) {
              const sheetTitle = getTitle('lsi_10');
              const newSheet = await drive.files.copy({
                fileId: origSheetId,
                requestBody: {
                  name: sheetTitle,
                  parents: [folderId]
                },
                fields: 'id, webViewLink'
              });

              const newSheetId = newSheet.data.id;
              await drive.permissions.create({
                fileId: newSheetId,
                requestBody: { role: 'reader', type: 'anyone' }
              });

              let pubUrl = '';
              try {
                const driveV2 = google.drive({ version: 'v2', auth: oauth2Client });
                const revUpdate = await driveV2.revisions.update({
                  fileId: newSheetId,
                  revisionId: '1',
                  resource: { published: true, publishAuto: true }
                });
                pubUrl = revUpdate.data.publishedLink || `https://docs.google.com/spreadsheets/d/${newSheetId}/pubhtml`;
              } catch (pubErr) {
                pubUrl = `https://docs.google.com/spreadsheets/d/${newSheetId}/pubhtml`;
              }

              langObj.sheet_url = newSheet.data.webViewLink;
              langObj.sheet_pub_url = pubUrl;
            }
          }
        }

        if (!langObj.slide_url) {
          const origSlideAsset = assets.find(a => a.keyField === 'lsi_11_presentation');
          if (origSlideAsset && origSlideAsset.driveUrl) {
            const origSlideId = extractFileId(origSlideAsset.driveUrl);
            if (origSlideId) {
              const slideTitle = getTitle('lsi_11');
              const newSlide = await drive.files.copy({
                fileId: origSlideId,
                requestBody: {
                  name: slideTitle,
                  parents: [folderId]
                },
                fields: 'id, webViewLink'
              });

              await drive.permissions.create({
                fileId: newSlide.data.id,
                requestBody: { role: 'reader', type: 'anyone' }
              });

              langObj.slide_url = newSlide.data.webViewLink;
            }
          }
        }

        if (!langObj.form_url) {
          try {
            const formTitle = getTitle('lsi_12');
            const formsApi = google.forms({ version: 'v1', auth: oauth2Client });
            const newForm = await formsApi.forms.create({
              requestBody: {
                info: {
                  title: formTitle
                }
              }
            });
            const newFormId = newForm.data.formId;

            // Di chuy峄僴 Form v脿o th瓢 m峄 ng么n ng峄?v脿 膽峄昳 t锚n
            await drive.files.update({
              fileId: newFormId,
              addParents: folderId,
              requestBody: {
                name: formTitle
              },
              fields: 'id, parents, name'
            });

            // L岷 webViewLink ch峄塶h s峄璦 c峄 Form b岷眓g Drive API
            const formFile = await drive.files.get({
              fileId: newFormId,
              fields: 'webViewLink'
            });

            await drive.permissions.create({
              fileId: newFormId,
              requestBody: { role: 'reader', type: 'anyone' }
            });

            langObj.form_url = formFile.data.webViewLink;
            langObj.form_view_url = `https://docs.google.com/forms/d/${newFormId}/viewform`;
          } catch (formCreateErr) {
            console.error('L峄梚 khi t岷 Form 膽a ng么n ng峄?m峄沬:', formCreateErr.message);
          }
        }

        if (!langObj.drawing_url) {
          const lsi13DrawingAsset = assets.find(a => a.keyField === 'lsi_13_drawing');
          const step4Data = stack.step4_data ? JSON.parse(stack.step4_data) : [];
          const origDrawingAsset = step4Data.find(item => item.name === 'Google Drawing');
          const drawingSrcUrl = lsi13DrawingAsset?.driveUrl || origDrawingAsset?.assetLink || '';

          if (drawingSrcUrl) {
            const origDrawingId = extractFileId(drawingSrcUrl);
            if (origDrawingId) {
              const drawingTitle = getTitle('lsi_13');
              const newDrawing = await drive.files.copy({
                fileId: origDrawingId,
                requestBody: {
                  name: drawingTitle,
                  parents: [folderId]
                },
                fields: 'id, webViewLink'
              });

              await drive.permissions.create({
                fileId: newDrawing.data.id,
                requestBody: { role: 'reader', type: 'anyone' }
              });

              langObj.drawing_url = newDrawing.data.webViewLink;
            }
          }
        }

        langObj.status = 'success';
        langObj.error = '';

      } catch (err) {
        console.error(`L峄梚 khi t岷 t脿i s岷 cho ${lang}:`, err.message);
        langObj.status = 'error';
        langObj.error = err.message;
      }
    };

    await runConcurrent(3, lang_arr, processSingleLang);

    await query.run(
      'UPDATE google_stacks SET languages_data = ? WHERE id = ?',
      [JSON.stringify(languagesData), id]
    );

    const successLangs = Object.keys(languagesData.assets).filter(l => languagesData.assets[l].status === 'success');
    const failedLangs = Object.keys(languagesData.assets).filter(l => languagesData.assets[l].status === 'error');

    return {
      message: `T岷 t脿i s岷 膽a ng么n ng峄?ho脿n t岷! Th脿nh c么ng: ${successLangs.length}/15`,
      assets: languagesData.assets,
      failed: failedLangs
    };

  } catch (error) {
    console.error('L峄梚 khi t岷 t脿i s岷 膽a ng么n ng峄?', error);
    throw new Error(error.message);
  }
}

export async function processCleanTempAssets(data) {
  const { stackId: id } = data;
  try {
    const stack = await query.get('SELECT * FROM google_stacks WHERE id = ?', [id]);
    if (!stack) throw new Error('Kh么ng t矛m th岷 b峄?Google Stack');

    const languagesData = stack.languages_data ? JSON.parse(stack.languages_data) : {};
    const tempFolderId = languagesData.temp_folder_id;

    if (tempFolderId) {
      const oauth2Client = await getGoogleOAuthClient(stack.project_id);
      const drive = google.drive({ version: 'v3', auth: oauth2Client });
      try {
        await drive.files.delete({ fileId: tempFolderId });
      } catch (deleteErr) {
        console.error('Kh么ng th峄?x贸a th瓢 m峄 膽峄噈 tr锚n Drive (c贸 th峄?膽茫 b峄?x贸a tr瓢峄沜 膽贸):', deleteErr.message);
      }
    }

    languagesData.temp_folder_url = '';
    languagesData.temp_folder_id = '';
    languagesData.temp_docs = {};

    await query.run(
      'UPDATE google_stacks SET languages_data = ? WHERE id = ?',
      [JSON.stringify(languagesData), id]
    );

    return { message: '膼茫 d峄峮 d岷筽 c谩c t峄噋 膽峄噈 Templates th脿nh c么ng!' };
  } catch (error) {
    throw new Error(error.message);
  }
}

export async function processOptimizeLangAssets(data) {
  const { stackId: id, model, mode, phase, updateProgress } = data || {};
  const modelName = model || 'google/gemini-2.5-flash:free';
  const optMode = mode || 'all'; 
  if (updateProgress) updateProgress(10, `Bắt đầu tối ưu đa ngôn ngữ (Phase ${phase || 'All'})...`); // m岷穋 膽峄媙h l脿 'all' 膽峄?t峄慽 瓢u to脿n b峄?n岷縰 kh么ng truy峄乶

  try {
    const stack = await query.get('SELECT * FROM google_stacks WHERE id = ?', [id]);
    if (!stack) throw new Error('Kh么ng t矛m th岷 b峄?Google Stack');

    const keywords = stack.keywords ? JSON.parse(stack.keywords) : {};
    const step4Data = stack.step4_data ? JSON.parse(stack.step4_data) : [];
    const step4Images = stack.step4_images ? JSON.parse(stack.step4_images) : [];

    const languagesData = stack.languages_data ? JSON.parse(stack.languages_data) : {};
    const translatedKeysMap = languagesData.translated_keys || {};
    const langAssetsMap = languagesData.assets || {};

    if (Object.keys(langAssetsMap).length === 0) {
      throw new Error('Ch瓢a t岷 t脿i s岷 膽a ng么n ng峄? Vui l貌ng t岷 t脿i s岷 tr瓢峄沜.');
    }

    const { brand, phone, address } = await getBusinessNapInfo(stack.project_id);

    const oauth2Client = await getGoogleOAuthClient(stack.project_id);
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    const docs = google.docs({ version: 'v1', auth: oauth2Client });
    const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

    const lang_arr_full = ['ar','hi','ru','zh','en','ja','de','es','pt','fr','bn','pl','fi','ko','it'];
    const lang_arr = phase === 1 ? lang_arr_full.slice(0, 5)
                   : phase === 2 ? lang_arr_full.slice(5, 10)
                   : phase === 3 ? lang_arr_full.slice(10, 15)
                   : lang_arr_full;
    
    let languagesOptResults = stack.languages_opt_results ? JSON.parse(stack.languages_opt_results) : {};

    const optimizeAllForLang = async (lang) => {
      if (optMode === 'all' || !languagesOptResults[lang]) {
        languagesOptResults[lang] = {
          status: 'pending',
          docs: {},
          sheet_status: 'pending',
          slide_status: 'pending',
          form_status: 'pending',
          error: ''
        };
      }

      const optResult = languagesOptResults[lang];
      const langObj = langAssetsMap[lang];
      const transKeys = translatedKeysMap[lang] || {};

      if (!langObj || langObj.status !== 'success') {
        optResult.status = 'error';
        optResult.error = 'T脿i s岷 ng么n ng峄?n脿y ch瓢a 膽瓢峄 t岷 th脿nh c么ng 峄?Button 2';
        return;
      }

      try {
        if (optResult.sheet_status !== 'success' && langObj.sheet_url) {
          try {
            const sheetId = extractFileId(langObj.sheet_url);
            if (sheetId) {
              const lsi10Val = transKeys.lsi_10 || keywords.lsi_10 || 'LSI 10';
              
              let rawDocText = '';
              const lsi10DocAsset = langObj.docs['lsi_10'];
              if (lsi10DocAsset && lsi10DocAsset.driveUrl) {
                const lsi10DocId = extractFileId(lsi10DocAsset.driveUrl);
                if (lsi10DocId) {
                  try {
                    const lsi10DocData = await docs.documents.get({ documentId: lsi10DocId });
                    const freshDoc = lsi10DocData.data;
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
                  } catch (docReadErr) {
                    console.error("L峄梚 膽峄峜 b脿i vi岷縯 th么 Sheet d峄媍h:", docReadErr.message);
                  }
                }
              }

              const cellDataRows = Array.from({ length: 14 }, () => Array.from({ length: 13 }, () => ({
                userEnteredValue: {}
              })));

              cellDataRows[0][0].userEnteredValue = { stringValue: lsi10Val };
              cellDataRows[0][0].userEnteredFormat = { textFormat: { bold: true } };

              cellDataRows[1][0].userEnteredValue = { stringValue: rawDocText || 'N峄檌 dung b脿i vi岷縯 LSI 10' };
              cellDataRows[1][0].userEnteredFormat = { wrapStrategy: "WRAP" };

              const imageValues = [];
              for (let idx = 0; idx < 12; idx++) {
                const img = step4Images[idx];
                if (img && img.driveFileId) {
                  imageValues.push(`=IMAGE("https://lh3.googleusercontent.com/d/${img.driveFileId}")`);
                } else {
                  imageValues.push('');
                }
              }
              for (let idx = 0; idx < 12; idx++) {
                cellDataRows[1][idx + 1].userEnteredValue = { formulaValue: imageValues[idx] };
              }

              const row7Asset = step4Data.find(item => item.id === 7) || { name: 'LinkedIn', assetLink: '' };
              const row7Name = row7Asset.name || 'LinkedIn';
              const sheetAsset = langObj;

              const labelA = [
                `${transKeys.lsi_10 || 'LSI 10'}:`,
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
              for (let idx = 0; idx < labelA.length; idx++) {
                cellDataRows[idx + 2][0].userEnteredValue = { stringValue: labelA[idx] };
              }

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

              const keyChinhVal = transKeys.key_chinh || keywords.key_chinh || stack.main_key || '';
              const keyChinhLocalVal = transKeys.key_chinh_local || keywords.key_chinh_local || '';
              const lsi1Val = transKeys.lsi_1 || keywords.lsi_1 || '';
              const lsi2Val = transKeys.lsi_2 || keywords.lsi_2 || '';
              const lsi3Val = transKeys.lsi_3 || keywords.lsi_3 || '';
              const lsi4Val = transKeys.lsi_4 || keywords.lsi_4 || '';

              const valueB = [
                `=HYPERLINK("${sheetAsset.sheet_pub_url}";"${transKeys.lsi_10}")`,
                `=HYPERLINK("${stack.url}";"${keyChinhVal}")`,
                `=HYPERLINK("${siteViewLink}";"${keyChinhVal}")`,
                `=HYPERLINK("${myMapsLink}";"${keyChinhLocalVal}")`,
                `=HYPERLINK("${gmbLink}";"${keyChinhVal}")`,
                `=HYPERLINK("${youtubeLink}";"${lsi1Val}")`,
                `=HYPERLINK("${twitterLink}";"${lsi2Val}")`,
                `=HYPERLINK("${pinterestLink}";"${lsi3Val}")`,
                `=HYPERLINK("${row7Link}";"${lsi4Val}")`,
                `=HYPERLINK("${driveFolderLink}";"${keyChinhVal}")`,
                `=HYPERLINK("${sheetLink}";"${keyChinhVal}")`,
                `=HYPERLINK("${imageFolderLink}";"${keyChinhVal}")`
              ];
              for (let idx = 0; idx < valueB.length; idx++) {
                cellDataRows[idx + 2][1].userEnteredValue = { formulaValue: valueB[idx] };
              }

              const relInfoVn = 'Th么ng tin li锚n quan:';
              const relInfoTrans = await transexept(relInfoVn, lang, brand, phone, address, stack.project_id, modelName);
              cellDataRows[2][2].userEnteredValue = { stringValue: relInfoTrans };

              const drawingLink = langObj.drawing_url || '';
              const calendarLink = step4Map['Calendar'] || '';

              const valueC = [
                `=HYPERLINK("${langObj.sheet_url}";"${transKeys.lsi_10}")`,
                `=HYPERLINK("${langObj.slide_url}";"${transKeys.lsi_11}")`,
                `=HYPERLINK("${langObj.form_url}";"${transKeys.lsi_12}")`,
                `=HYPERLINK("${drawingLink}";"${transKeys.lsi_13}")`,
                `=HYPERLINK("${calendarLink}";"${transKeys.lsi_14}")`
              ];
              for (let idx = 0; idx < valueC.length; idx++) {
                cellDataRows[idx + 3][2].userEnteredValue = { formulaValue: valueC[idx] };
              }

              await sheets.spreadsheets.batchUpdate({
                spreadsheetId: sheetId,
                requestBody: {
                  requests: [
                    {
                      updateCells: {
                        rows: cellDataRows.map(row => ({ values: row })),
                        fields: 'userEnteredValue,userEnteredFormat',
                        range: {
                          sheetId: 0,
                          startRowIndex: 0,
                          endRowIndex: 14,
                          startColumnIndex: 0,
                          endColumnIndex: 13
                        }
                      }
                    },
                    {
                      updateDimensionProperties: {
                        range: {
                          sheetId: 0,
                          dimension: 'ROWS',
                          startIndex: 1,
                          endIndex: 2
                        },
                        properties: { pixelSize: 250 },
                        fields: 'pixelSize'
                      }
                    },
                    {
                      updateDimensionProperties: {
                        range: {
                          sheetId: 0,
                          dimension: 'COLUMNS',
                          startIndex: 1,
                          endIndex: 13
                        },
                        properties: { pixelSize: 250 },
                        fields: 'pixelSize'
                      }
                    }
                  ]
                }
              });

              optResult.sheet_status = 'success';
            }
          } catch (sheetErr) {
            console.error(`L峄梚 t峄慽 瓢u Sheet [${lang}]:`, sheetErr.message);
            optResult.sheet_status = `error: ${sheetErr.message}`;
          }
        }

        if (optResult.slide_status !== 'success' && langObj.slide_url) {
          try {
            const slideId = extractFileId(langObj.slide_url);
            if (slideId) {
              const slides = google.slides({ version: 'v1', auth: oauth2Client });

              let rawSlideDocText = '';
              const lsi11DocAsset = langObj.docs['lsi_11'];
              if (lsi11DocAsset && lsi11DocAsset.driveUrl) {
                const lsi11DocId = extractFileId(lsi11DocAsset.driveUrl);
                if (lsi11DocId) {
                  try {
                    const lsi11DocData = await docs.documents.get({ documentId: lsi11DocId });
                    const freshDoc = lsi11DocData.data;
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
                                rawSlideDocText += el.textRun.content;
                              }
                            });
                          }
                        }
                      });
                    }
                  } catch (e) {
                    console.error("L峄梚 膽峄峜 b脿i vi岷縯 th么 Slide d峄媍h:", e.message);
                  }
                }
              }

              const presentation = await slides.presentations.get({ presentationId: slideId });
              const origSlides = presentation.data.slides || [];
              const deleteRequests = [];

              const lsi11Val = transKeys.lsi_11 || keywords.lsi_11 || 'LSI 11';
              const row7Asset = step4Data.find(item => item.id === 7) || { name: 'LinkedIn', assetLink: '' };
              const row7Name = row7Asset.name || 'LinkedIn';
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

              const keyChinhVal = transKeys.key_chinh || keywords.key_chinh || stack.main_key || '';
              const keyChinhLocalVal = transKeys.key_chinh_local || keywords.key_chinh_local || '';
              const lsi1Val = transKeys.lsi_1 || keywords.lsi_1 || '';
              const lsi2Val = transKeys.lsi_2 || keywords.lsi_2 || '';
              const lsi3Val = transKeys.lsi_3 || keywords.lsi_3 || '';
              const lsi4Val = transKeys.lsi_4 || keywords.lsi_4 || '';

              const text2Lines = [
                { label: 'Website: ', text: keyChinhVal, url: stack.url },
                { label: 'Google site view: ', text: keyChinhVal, url: siteViewLink },
                { label: 'Google My Maps: ', text: keyChinhLocalVal, url: myMapsLink },
                { label: 'GMB post: ', text: keyChinhVal, url: gmbLink },
                { label: 'Youtube: ', text: lsi1Val, url: youtubeLink },
                { label: 'Twitter: ', text: lsi2Val, url: twitterLink },
                { label: 'Pinterest: ', text: lsi3Val, url: pinterestLink },
                { label: `${row7Name}: `, text: lsi4Val, url: row7Link },
                { label: 'Drive Folder: ', text: keyChinhVal, url: driveFolderLink },
                { label: 'Google Sheet link: ', text: keyChinhVal, url: sheetLink },
                { label: 'Drive folder image: ', text: keyChinhVal, url: imageFolderLink }
              ];
              const text2 = text2Lines.map(item => `${item.label}${item.text}`).join('\n');

              const drawingLink = langObj.drawing_url || '';
              const calendarLink = step4Map['Calendar'] || '';
              const text3Lines = [
                { label: 'Google sheet: ', text: transKeys.lsi_10 || 'LSI 10', url: langObj.sheet_url },
                { label: 'Google slide: ', text: transKeys.lsi_11 || 'LSI 11', url: langObj.slide_url },
                { label: 'Google Forms: ', text: transKeys.lsi_12 || 'LSI 12', url: langObj.form_url },
                { label: 'Google Drawing: ', text: transKeys.lsi_13 || 'LSI 13', url: drawingLink },
                { label: 'Calendar: ', text: transKeys.lsi_14 || 'LSI 14', url: calendarLink }
              ];
              const text3 = text3Lines.map(item => `${item.label}${item.text}`).join('\n');

              const slideRequests = [];
              const slide1Id = 'slide1_id';
              
              slideRequests.push({
                createSlide: {
                  objectId: slide1Id,
                  insertionIndex: 0
                }
              });

              const titleBoxId = 'title_box_id';
              slideRequests.push({
                createShape: {
                  objectId: titleBoxId,
                  shapeType: 'TEXT_BOX',
                  elementProperties: {
                    pageObjectId: slide1Id,
                    size: { width: { magnitude: 650, unit: 'PT' }, height: { magnitude: 70, unit: 'PT' } },
                    transform: { scaleX: 1, scaleY: 1, translateX: 30, translateY: 30, unit: 'PT' }
                  }
                }
              }, {
                insertText: {
                  objectId: titleBoxId,
                  text: lsi11Val
                }
              }, {
                updateTextStyle: {
                  objectId: titleBoxId,
                  style: { fontSize: { magnitude: 52, unit: 'PT' }, bold: true },
                  fields: 'fontSize,bold',
                  textRange: { type: 'ALL' }
                }
              });

              const entitiesBoxId = 'entities_box_id';
              slideRequests.push({
                createShape: {
                  objectId: entitiesBoxId,
                  shapeType: 'TEXT_BOX',
                  elementProperties: {
                    pageObjectId: slide1Id,
                    size: { width: { magnitude: 300, unit: 'PT' }, height: { magnitude: 300, unit: 'PT' } },
                    transform: { scaleX: 1, scaleY: 1, translateX: 30, translateY: 120, unit: 'PT' }
                  }
                }
              }, {
                insertText: {
                  objectId: entitiesBoxId,
                  text: text2
                }
              }, {
                updateTextStyle: {
                  objectId: entitiesBoxId,
                  style: { fontSize: { magnitude: 11, unit: 'PT' } },
                  fields: 'fontSize',
                  textRange: { type: 'ALL' }
                }
              });

              let offset2 = 0;
              text2Lines.forEach(item => {
                const lineText = `${item.label}${item.text}`;
                const start = offset2 + item.label.length;
                const end = start + item.text.length;
                
                if (item.text && item.url) {
                  slideRequests.push({
                    updateTextStyle: {
                      objectId: entitiesBoxId,
                      style: { link: { url: item.url } },
                      fields: 'link',
                      textRange: {
                        type: 'FIXED_RANGE',
                        startIndex: start,
                        endIndex: end
                      }
                    }
                  });
                }
                offset2 += lineText.length + 1;
              });

              const internalBoxId = 'internal_box_id';
              slideRequests.push({
                createShape: {
                  objectId: internalBoxId,
                  shapeType: 'TEXT_BOX',
                  elementProperties: {
                    pageObjectId: slide1Id,
                    size: { width: { magnitude: 300, unit: 'PT' }, height: { magnitude: 150, unit: 'PT' } },
                    transform: { scaleX: 1, scaleY: 1, translateX: 350, translateY: 120, unit: 'PT' }
                  }
                }
              }, {
                insertText: {
                  objectId: internalBoxId,
                  text: text3
                }
              }, {
                updateTextStyle: {
                  objectId: internalBoxId,
                  style: { fontSize: { magnitude: 11, unit: 'PT' } },
                  fields: 'fontSize',
                  textRange: { type: 'ALL' }
                }
              });

              let offset3 = 0;
              text3Lines.forEach(item => {
                const lineText = `${item.label}${item.text}`;
                const start = offset3 + item.label.length;
                const end = start + item.text.length;

                if (item.text && item.url) {
                  slideRequests.push({
                    updateTextStyle: {
                      objectId: internalBoxId,
                      style: { link: { url: item.url } },
                      fields: 'link',
                      textRange: {
                        type: 'FIXED_RANGE',
                        startIndex: start,
                        endIndex: end
                      }
                    }
                  });
                }
                offset3 += lineText.length + 1;
              });

              const slide2Id = 'slide2_id';
              const contentBoxId = 'content_box_id';
              slideRequests.push({
                createSlide: {
                  objectId: slide2Id,
                  insertionIndex: 1
                }
              }, {
                createShape: {
                  objectId: contentBoxId,
                  shapeType: 'TEXT_BOX',
                  elementProperties: {
                    pageObjectId: slide2Id,
                    size: { width: { magnitude: 660, unit: 'PT' }, height: { magnitude: 500, unit: 'PT' } },
                    transform: { scaleX: 1, scaleY: 1, translateX: 30, translateY: 30, unit: 'PT' }
                  }
                }
              }, {
                insertText: {
                  objectId: contentBoxId,
                  text: rawSlideDocText || 'N峄檌 dung b脿i vi岷縯 LSI 11'
                }
              }, {
                updateTextStyle: {
                  objectId: contentBoxId,
                  style: { fontSize: { magnitude: 10, unit: 'PT' } },
                  fields: 'fontSize',
                  textRange: { type: 'ALL' }
                }
              });

              for (let imgIdx = 0; imgIdx < 12; imgIdx++) {
                const img = step4Images[imgIdx];
                if (img && img.driveFileId) {
                  const slideImgId = `slide_img_${imgIdx}`;
                  slideRequests.push({
                    createSlide: {
                      objectId: slideImgId,
                      insertionIndex: 2 + imgIdx
                    }
                  }, {
                    createImage: {
                      objectId: `image_element_${imgIdx}`,
                      url: `https://lh3.googleusercontent.com/d/${img.driveFileId}`,
                      elementProperties: {
                        pageObjectId: slideImgId,
                        size: { width: { magnitude: 600, unit: 'PT' }, height: { magnitude: 450, unit: 'PT' } },
                        transform: { scaleX: 1, scaleY: 1, translateX: 60, translateY: 40, unit: 'PT' }
                      }
                    }
                  });
                }
              }

              origSlides.forEach(s => {
                deleteRequests.push({ deleteObject: { objectId: s.objectId } });
              });

              await slides.presentations.batchUpdate({
                presentationId: slideId,
                requestBody: { requests: slideRequests }
              });

              if (deleteRequests.length > 0) {
                await slides.presentations.batchUpdate({
                  presentationId: slideId,
                  requestBody: { requests: deleteRequests }
                });
              }

              optResult.slide_status = 'success';
            }
          } catch (slideErr) {
            console.error(`L峄梚 t峄慽 瓢u Slide [${lang}]:`, slideErr.message);
            optResult.slide_status = `error: ${slideErr.message}`;
          }
        }

        if (optResult.form_status !== 'success' && langObj.form_url) {
          try {
            const formId = extractFileId(langObj.form_url);
            if (formId) {
              const forms = google.forms({ version: 'v1', auth: oauth2Client });

              let rawFormDocText = '';
              const lsi12DocAsset = langObj.docs['lsi_12'];
              if (lsi12DocAsset && lsi12DocAsset.driveUrl) {
                const lsi12DocId = extractFileId(lsi12DocAsset.driveUrl);
                if (lsi12DocId) {
                  try {
                    const lsi12DocData = await docs.documents.get({ documentId: lsi12DocId });
                    const freshDoc = lsi12DocData.data;
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
                                rawFormDocText += el.textRun.content;
                              }
                            });
                          }
                        }
                      });
                    }
                  } catch (e) {
                    console.error("L峄梚 膽峄峜 b脿i vi岷縯 th么 Form d峄媍h:", e.message);
                  }
                }
              }

              const formObj = await forms.forms.get({ formId });
              const items = formObj.data.items || [];
              const deleteRequests = [];
              items.forEach((item, index) => {
                deleteRequests.push({ deleteItem: { location: { index: 0 } } });
              });

              if (deleteRequests.length > 0) {
                await forms.forms.batchUpdate({
                  formId,
                  requestBody: { requests: deleteRequests }
                });
              }

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

              const drawingLink = langObj.drawing_url || '';
              const calendarLink = step4Map['Calendar'] || '';

              const relInfoVn = 'Th么ng tin li锚n quan:';
              const relInfoTrans = await transexept(relInfoVn, lang, brand, phone, address, stack.project_id, modelName);

              const formDescription = [
                rawFormDocText || 'N峄檌 dung m么 t岷?Google Form',
                '',
                `Website: ${stack.url}`,
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
                '',
                `${relInfoTrans}`,
                `Google sheet: ${langObj.sheet_url}`,
                `Google slide: ${langObj.slide_url}`,
                `Google Forms: ${langObj.form_url}`,
                `Google Drawing: ${drawingLink}`,
                `Calendar: ${calendarLink}`
              ].join('\n');

              const formTitle = transKeys.lsi_12 || keywords.lsi_12 || 'LSI 12';

              await forms.forms.batchUpdate({
                formId,
                requestBody: {
                  requests: [
                    {
                      updateFormInfo: {
                        info: {
                          title: formTitle,
                          description: formDescription
                        },
                        updateMask: 'title,description'
                      }
                    }
                  ]
                }
              });

              langObj.form_view_url = formObj.data.responderUri || `https://docs.google.com/forms/d/${formId}/viewform`;
              optResult.form_status = 'success';
            }
          } catch (formErr) {
            console.error(`L峄梚 t峄慽 瓢u Form [${lang}]:`, formErr.message);
            optResult.form_status = `error: ${formErr.message}`;
          }
        }

        // T峄慽 瓢u h贸a 10 file docs translate sau khi Sheet, Slide, Form 膽茫 t峄慽 瓢u th脿nh c么ng
        const lsiFields = Array.from({ length: 10 }, (_, i) => `lsi_${i+5}`);
        for (const keyField of lsiFields) {
          if (optResult.docs[keyField] === 'success') continue;
          
          try {
            const ownPubLink = langObj.docs[keyField]?.pubUrl || '';
            await optimizeSingleLangDoc(
              docs,
              drive,
              keyField,
              lang,
              transKeys,
              keywords,
              langObj,
              step4Data,
              stack,
              ownPubLink,
              brand,
              phone,
              address,
              modelName
            );
            optResult.docs[keyField] = 'success';
          } catch (docErr) {
            console.error(`L峄梚 t峄慽 瓢u Docs ${keyField} [${lang}]:`, docErr.message);
            optResult.docs[keyField] = `error: ${docErr.message}`;
          }
        }

        optResult.status = 'success';
        optResult.error = '';

      } catch (err) {
        console.error(`L峄梚 t峄慽 瓢u h贸a 膽a ng么n ng峄?cho ${lang}:`, err.message);
        optResult.status = 'error';
        optResult.error = err.message;
      }
    };

    await runConcurrent(3, lang_arr, optimizeAllForLang);

    await query.run(
      'UPDATE google_stacks SET languages_opt_results = ? WHERE id = ?',
      [JSON.stringify(languagesOptResults), id]
    );

    const successCount = lang_arr.filter(l => languagesOptResults[l]?.status === 'success').length;
    const failedCount = lang_arr.filter(l => languagesOptResults[l]?.status === 'error').length;

    return {
      message: `T峄慽 瓢u h贸a 膽a ng么n ng峄?ho脿n t岷! Th脿nh c么ng: ${successCount}/${lang_arr.length}`,
      results: languagesOptResults,
      failed: failedCount
    };

  } catch (error) {
    console.error('L峄梚 khi t峄慽 瓢u h贸a 膽a ng么n ng峄?', error);
    throw new Error(error.message);
  }
}

