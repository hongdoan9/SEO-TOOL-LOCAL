import { google } from 'googleapis';
import { extractFileId, getLanguageFullName } from '../../utils/helpers.js';
import { transexept } from '../translate.service.js';

export async function optimizeSingleLangDoc(docs, drive, assetKey, lang, transKeys, keywords, langObj, step4Data, stack, ownPubLink, brand, phone, address, modelName) {
  const docAsset = langObj.docs[assetKey];
  if (!docAsset || docAsset.status !== 'success') return;

  const docId = extractFileId(docAsset.driveUrl);
  if (!docId) return;

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

  const keyChinhVal = transKeys.key_chinh || keywords.key_chinh || stack.main_key || '';
  const keyChinhLocalVal = transKeys.key_chinh_local || keywords.key_chinh_local || '';
  const lsi1Val = transKeys.lsi_1 || keywords.lsi_1 || '';
  const lsi2Val = transKeys.lsi_2 || keywords.lsi_2 || '';
  const lsi3Val = transKeys.lsi_3 || keywords.lsi_3 || '';
  const lsi4Val = transKeys.lsi_4 || keywords.lsi_4 || '';
  const ownTitle = transKeys[assetKey] || keywords[assetKey] || '';

  const langFullName = getLanguageFullName(lang);
  const driveTranslateName = brand ? `${brand} - ${langFullName}` : `${langFullName}`;

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
    `Drive Folder - ${langFullName}: ${driveTranslateName}`,
    `Google Sheet link: ${keyChinhVal}`,
    `Drive folder image: ${keyChinhVal}`
  ];

  // Đảm bảo phần tối ưu thêm được cách xuống dòng trước sau nó 1 cái và chỉ dùng định dạng paragraph
  const optText = '\n\n' + optLines.join('\n') + '\n\n';

  let relatedKeys = [];
  const numPattern = /\d+/;
  const ownNumMatch = assetKey.match(numPattern);
  const ownNum = ownNumMatch ? parseInt(ownNumMatch[0], 10) : null;

  if (ownNum >= 5 && ownNum <= 9) {
    relatedKeys = ['lsi_5', 'lsi_6', 'lsi_7', 'lsi_8', 'lsi_9'];
  } else if (ownNum >= 10 && ownNum <= 14) {
    relatedKeys = ['lsi_10', 'lsi_11', 'lsi_12', 'lsi_13', 'lsi_14'];
  }

  const relTitleVn = 'Bài viết liên quan:';
  const relTitleTrans = await transexept(relTitleVn, lang, brand, phone, address, stack.project_id, modelName);

  const relLines = [
    relTitleTrans
  ];

  relatedKeys.forEach(k => {
    const keyTitle = transKeys[k] || keywords[k] || '';
    if (keyTitle.trim()) {
      relLines.push(keyTitle);
    }
  });

  // Đảm bảo phần tối ưu thêm được cách xuống dòng trước sau nó 1 cái và chỉ dùng định dạng paragraph
  const relText = '\n\n' + relLines.join('\n') + '\n\n';

  const docData = await docs.documents.get({ documentId: docId });
  const namedRanges = docData.data.namedRanges || {};
  const deleteRequests = [];
  if (namedRanges['opt_zone']) {
    namedRanges['opt_zone'].namedRanges.forEach(nr => {
      deleteRequests.push({ deleteNamedRange: { namedRangeId: nr.namedRangeId } });
    });
  }
  if (namedRanges['rel_zone']) {
    namedRanges['rel_zone'].namedRanges.forEach(nr => {
      deleteRequests.push({ deleteNamedRange: { namedRangeId: nr.namedRangeId } });
    });
  }

  if (deleteRequests.length > 0) {
    await docs.documents.batchUpdate({
      documentId: docId,
      requestBody: { requests: deleteRequests }
    });
  }

  const freshDocData = await docs.documents.get({ documentId: docId });
  const freshBodyContent = freshDocData.data.body?.content || [];

  let paragraphCount = 0;
  let optInsertIndex = 1;
  for (let i = 0; i < freshBodyContent.length; i++) {
    const element = freshBodyContent[i];
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

  const lastElement = freshBodyContent[freshBodyContent.length - 1];
  const relInsertIndex = lastElement.endIndex - 1;

  const insertRequests = [];

  insertRequests.push({
    insertText: {
      location: { index: relInsertIndex },
      text: relText
    }
  });

  // Bỏ qua 2 ký tự \n\n đầu tiên + tiêu đề + 1 ký tự \n sau tiêu đề
  let currentRelOffset = relInsertIndex + 2 + relTitleTrans.length + 1;
  for (let j = 0; j < relatedKeys.length; j++) {
    const k = relatedKeys[j];
    const keyTitle = transKeys[k] || keywords[k] || '';
    if (!keyTitle.trim()) continue;

    let relatedDriveUrl = langObj.docs[k]?.driveUrl || '';

    if (relatedDriveUrl) {
      insertRequests.push({
        updateTextStyle: {
          range: {
            startIndex: currentRelOffset,
            endIndex: currentRelOffset + keyTitle.length
          },
          textStyle: { link: { url: relatedDriveUrl } },
          fields: 'link'
        }
      });
    }
    currentRelOffset += keyTitle.length + 1;
  }

  insertRequests.push({
    createNamedRange: {
      name: 'rel_zone',
      range: {
        startIndex: relInsertIndex,
        endIndex: relInsertIndex + relText.length
      }
    }
  });

  insertRequests.push({
    insertText: {
      location: { index: optInsertIndex },
      text: optText
    }
  });

  // Bỏ qua 2 ký tự \n\n đầu tiên
  let currentOptOffset = optInsertIndex + 2;

  // Dòng 0: ownTitle: ownTitle
  const ownTitleLineText = optLines[0];
  const ownTitleLinkStart = currentOptOffset + ownTitle.length + 2;
  if (ownPubLink) {
    insertRequests.push({
      updateTextStyle: {
        range: {
          startIndex: ownTitleLinkStart,
          endIndex: ownTitleLinkStart + ownTitle.length
        },
        textStyle: { link: { url: ownPubLink } },
        fields: 'link'
      }
    });
  }
  currentOptOffset += ownTitleLineText.length + 1;

  // Dòng 1: Website
  const websiteLineText = optLines[1];
  const websiteLinkStart = currentOptOffset + 'Website: '.length;
  if (stack.url) {
    insertRequests.push({
      updateTextStyle: {
        range: {
          startIndex: websiteLinkStart,
          endIndex: websiteLinkStart + keyChinhVal.length
        },
        textStyle: { link: { url: stack.url } },
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
        textStyle: { link: { url: siteViewLink } },
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
        textStyle: { link: { url: myMapsLink } },
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
        textStyle: { link: { url: gmbLink } },
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
        textStyle: { link: { url: youtubeLink } },
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
        textStyle: { link: { url: twitterLink } },
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
        textStyle: { link: { url: pinterestLink } },
        fields: 'link'
      }
    });
  }
  currentOptOffset += pinLineText.length + 1;

  // Dòng 8: Hàng 7 tài sản
  const row7LineText = optLines[8];
  const row7LinkStart = currentOptOffset + row7Name.length + 2;
  if (row7Link) {
    insertRequests.push({
      updateTextStyle: {
        range: {
          startIndex: row7LinkStart,
          endIndex: row7LinkStart + lsi4Val.length
        },
        textStyle: { link: { url: row7Link } },
        fields: 'link'
      }
    });
  }
  currentOptOffset += row7LineText.length + 1;

  // Dòng 9: Drive Folder gốc
  const folderLineText = optLines[9];
  const folderLinkStart = currentOptOffset + 'Drive Folder: '.length;
  if (driveFolderLink) {
    insertRequests.push({
      updateTextStyle: {
        range: {
          startIndex: folderLinkStart,
          endIndex: folderLinkStart + keyChinhVal.length
        },
        textStyle: { link: { url: driveFolderLink } },
        fields: 'link'
      }
    });
  }
  currentOptOffset += folderLineText.length + 1;

  // Dòng 10: Drive Folder translate mới
  const driveLangLineText = optLines[10];
  const driveLangLinkStart = currentOptOffset + `Drive Folder - ${langFullName}: `.length;
  if (langObj.folder_url) {
    insertRequests.push({
      updateTextStyle: {
        range: {
          startIndex: driveLangLinkStart,
          endIndex: driveLangLinkStart + driveTranslateName.length
        },
        textStyle: { link: { url: langObj.folder_url } },
        fields: 'link'
      }
    });
  }
  currentOptOffset += driveLangLineText.length + 1;

  // Dòng 11: Google Sheet link (lấy link sheet của ngôn ngữ phụ này)
  const sheetLineText = optLines[11];
  const sheetLinkStart = currentOptOffset + 'Google Sheet link: '.length;
  if (sheetLink) {
    insertRequests.push({
      updateTextStyle: {
        range: {
          startIndex: sheetLinkStart,
          endIndex: sheetLinkStart + keyChinhVal.length
        },
        textStyle: { link: { url: sheetLink } },
        fields: 'link'
      }
    });
  }
  currentOptOffset += sheetLineText.length + 1;

  // Dòng 12: Drive folder image
  const imgFolderLineText = optLines[12];
  const imgFolderLinkStart = currentOptOffset + 'Drive folder image: '.length;
  if (imageFolderLink) {
    insertRequests.push({
      updateTextStyle: {
        range: {
          startIndex: imgFolderLinkStart,
          endIndex: imgFolderLinkStart + keyChinhVal.length
        },
        textStyle: { link: { url: imageFolderLink } },
        fields: 'link'
      }
    });
  }
  currentOptOffset += imgFolderLineText.length + 1;

  insertRequests.push({
    createNamedRange: {
      name: 'opt_zone',
      range: {
        startIndex: optInsertIndex,
        endIndex: optInsertIndex + optText.length
      }
    }
  });

  await docs.documents.batchUpdate({
    documentId: docId,
    requestBody: { requests: insertRequests }
  });
}