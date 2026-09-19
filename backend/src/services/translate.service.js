
import JSZip from 'jszip';
import { Readable } from 'stream';
import { google } from 'googleapis';

export async function translateTextFree(text, targetLang) {
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=vi&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data && data[0]) {
      return data[0].map(x => x[0]).join('');
    }
  } catch (err) {
    console.error(`Lỗi dịch free sang ${targetLang}:`, err.message);
  }
  return text;
}

// Trình dịch gộp miễn phí của Google Translate (Batch Translation)
async function translateTextBatch(blocks, targetLang) {
  if (!blocks || blocks.length === 0) return [];
  const delimiter = "\n$$$\n";
  
  // Chia nhỏ mảng blocks thành các chunks để tránh lỗi URL quá dài
  const chunks = [];
  let currentChunk = [];
  let currentLength = 0;
  
  for (const block of blocks) {
    const estimatedLen = encodeURIComponent(block + delimiter).length;
    if (currentLength + estimatedLen > 3000 && currentChunk.length > 0) {
      chunks.push(currentChunk);
      currentChunk = [block];
      currentLength = estimatedLen;
    } else {
      currentChunk.push(block);
      currentLength += estimatedLen;
    }
  }
  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }

  const results = [];
  for (const chunk of chunks) {
    const chunkMerged = chunk.join(delimiter);
    const translatedMerged = await translateTextFree(chunkMerged, targetLang);
    const translatedBlocks = translatedMerged.split(/\s*\n\s*\$\$\$\s*\n\s*/).map(s => s.trim());
    
    // Nếu số lượng tách ra không khớp, ta chạy fallback dịch tuần tự từng câu
    if (translatedBlocks.length !== chunk.length) {
      console.warn(`Lệch số lượng dịch gộp [${targetLang}]: Gốc ${chunk.length}, Dịch ${translatedBlocks.length}. Đang chạy fallback dịch tuần tự...`);
      for (const singleBlock of chunk) {
        const singleTrans = await translateTextFree(singleBlock, targetLang);
        results.push(singleTrans.trim());
      }
    } else {
      translatedBlocks.forEach(tb => results.push(tb));
    }
  }

  return results;
}

export async function transexept(text, targetLang, brand, phone, address, projectId, modelName) {
  if (!text || !text.trim()) return '';
  let tempText = text;
  
  const replacements = [];
  if (brand && brand.trim()) {
    const regex = new RegExp(escapeRegExp(brand), 'gi');
    tempText = tempText.replace(regex, '___BRAND_HOLDER___');
    replacements.push({ holder: '___BRAND_HOLDER___', value: brand });
  }
  if (phone && phone.trim()) {
    const regex = new RegExp(escapeRegExp(phone), 'gi');
    tempText = tempText.replace(regex, '___PHONE_HOLDER___');
    replacements.push({ holder: '___PHONE_HOLDER___', value: phone });
  }
  if (address && address.trim()) {
    const regex = new RegExp(escapeRegExp(address), 'gi');
    tempText = tempText.replace(regex, '___ADDR_HOLDER___');
    replacements.push({ holder: '___ADDR_HOLDER___', value: address });
  }

  // Dịch bằng Google Translate miễn phí
  let translated = await translateTextFree(tempText, targetLang);

  replacements.forEach(rep => {
    const holderRegex = new RegExp(escapeRegExp(rep.holder), 'gi');
    translated = translated.replace(holderRegex, rep.value);
  });

  return translated;
}

// Trích xuất thông tin doanh nghiệp (NAP) của dự án từ SQLite schema phẳng thực tế
async function getBusinessNapInfo(projectId) {
  const infoRow = await query.get('SELECT * FROM business_info WHERE project_id = ?', [projectId]);
  let brand = '';
  let phone = '';
  let address = '';

  if (infoRow) {
    brand = infoRow.brand || '';
    if (infoRow.phones) {
      try {
        const phones = JSON.parse(infoRow.phones);
        if (phones && phones.length > 0) {
          phone = phones[0].number || '';
        }
      } catch (e) {
        console.error("Lỗi parse phones:", e.message);
      }
    }
    if (infoRow.addresses) {
      try {
        const addresses = JSON.parse(infoRow.addresses);
        if (addresses && addresses.length > 0) {
          address = addresses[0].address || '';
        }
      } catch (e) {
        console.error("Lỗi parse addresses:", e.message);
      }
    }
  }
  return { brand, phone, address };
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getLanguageFullName(code) {
  const map = {
    'ar': 'Arabic',
    'hi': 'Hindi',
    'ru': 'Russian',
    'zh': 'Chinese',
    'en': 'English',
    'ja': 'Japanese',
    'de': 'German',
    'es': 'Spanish',
    'pt': 'Portuguese',
    'fr': 'French',
    'bn': 'Bengali',
    'pl': 'Polish',
    'fi': 'Finnish',
    'ko': 'Korean',
    'it': 'Italian'
  };
  return map[code] || code;
}

export async function translateAndPreserveDoc(docs, drive, origDocFileId, targetFolderId, docTitle, lang, brand, phone, address, projectId, modelName, oauth2Client) {
  try {
    // 1. Export as DOCX
    const exportRes = await drive.files.export({
      fileId: origDocFileId,
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    }, { responseType: 'arraybuffer' });

    // 2. Load into JSZip
    const zip = await JSZip.loadAsync(exportRes.data);
    
    // 3. Read word/document.xml
    const docXmlFile = zip.file('word/document.xml');
    if (!docXmlFile) {
      throw new Error("Cannot find word/document.xml in exported DOCX");
    }
    let xmlContent = await docXmlFile.async('string');

    // 4. Extract all <w:t> texts
    const textRegex = /<w:t([^>]*)>([\s\S]*?)<\/w:t>/g;
    const textsToTranslate = [];
    
    let match;
    while ((match = textRegex.exec(xmlContent)) !== null) {
      const rawText = match[2];
      
      // Decode XML entities
      let decodedText = rawText
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'");

      const trimmed = decodedText.trim();
      
      // Skip empty, very short (<= 2 chars), or brand name
      if (trimmed.length > 2 && trimmed.toLowerCase() !== brand.toLowerCase()) {
        textsToTranslate.push(decodedText);
      }
    }
    
    // Unique list to translate
    const uniqueTexts = Array.from(new Set(textsToTranslate));
    const translationMap = new Map();
    
    if (uniqueTexts.length > 0) {
      const translatedTexts = await translateTextBatch(uniqueTexts, lang);
      uniqueTexts.forEach((text, i) => {
        if (translatedTexts[i]) {
          translationMap.set(text, translatedTexts[i]);
        }
      });
    }
    
    // 5. Replace texts in XML
    let newXmlContent = xmlContent.replace(textRegex, (match, attrs, rawText) => {
      let decodedText = rawText
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'");
        
      const trimmed = decodedText.trim();
      if (trimmed.length > 2 && trimmed.toLowerCase() !== brand.toLowerCase() && translationMap.has(decodedText)) {
        let translated = translationMap.get(decodedText);
        // Re-encode XML entities
        translated = translated
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&apos;');
        return `<w:t${attrs}>${translated}</w:t>`;
      }
      return match;
    });

    // 6. Save modified XML back to zip
    zip.file('word/document.xml', newXmlContent);
    
    // 7. Generate new .docx buffer
    const newDocxBuffer = await zip.generateAsync({ type: 'nodebuffer' });
    
    // 8. Upload to Google Drive and convert to Google Doc
    const uploadRes = await drive.files.create({
      requestBody: {
        name: docTitle,
        parents: [targetFolderId],
        mimeType: 'application/vnd.google-apps.document'
      },
      media: {
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        body: Readable.from(newDocxBuffer)
      },
      fields: 'id, webViewLink'
    });
    
    const newDocId = uploadRes.data.id;
    const driveUrl = uploadRes.data.webViewLink;
    
    // 9. Set permissions to public reader
    await drive.permissions.create({
      fileId: newDocId,
      requestBody: { role: 'reader', type: 'anyone' }
    });
    
    // 10. Publish to web
    let pubUrl = '';
    try {
      const driveV2 = google.drive({ version: 'v2', auth: oauth2Client });
      const revList = await driveV2.revisions.list({ fileId: newDocId });
      const revisions = revList.data.items || [];
      const revisionId = revisions.length > 0 ? revisions[revisions.length - 1].id : '1';
      
      const revUpdate = await driveV2.revisions.update({
        fileId: newDocId,
        revisionId: revisionId,
        resource: { published: true, publishAuto: true }
      });
      pubUrl = revUpdate.data.publishedLink || `https://docs.google.com/document/d/${newDocId}/pub`;
    } catch (revErr) {
      pubUrl = `https://docs.google.com/document/d/${newDocId}/pub`;
    }
    
    return {
      driveUrl: driveUrl,
      pubUrl: pubUrl
    };
    
  } catch (err) {
    console.error(`Lỗi dịch đè tài liệu DOCX [${lang}]:`, err.message);
    return { driveUrl: '', pubUrl: '' };
  }
}

export { translateTextBatch };
