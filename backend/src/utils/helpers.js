import { query } from '../../db.js';

// Helper: Trích xuất folder ID từ link Drive
export function extractFolderId(url) {
  if (!url) return null;
  const match = url.match(/folders\/([a-zA-Z0-9-_]+)/);
  if (match) return match[1];
  const idParamMatch = url.match(/id=([a-zA-Z0-9-_]+)/);
  if (idParamMatch) return idParamMatch[1];
  const str = url.trim();
  if (/^[a-zA-Z0-9-_]{15,}$/.test(str) && !str.includes('http')) {
    return str;
  }
  return null;
}

// Helper: Trích xuất File hoặc Document ID từ link Google Docs/Drive
export function extractFileId(url) {
  if (!url) return null;
  const folderMatch = url.match(/folders\/([a-zA-Z0-9-_]+)/);
  if (folderMatch) return folderMatch[1];
  
  const dMatch = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (dMatch) return dMatch[1];

  const documentMatch = url.match(/document\/d\/([a-zA-Z0-9-_]+)/);
  if (documentMatch) return documentMatch[1];

  return null;
}

// Helper: Chạy song song concurrency pool
export async function runConcurrent(limit, items, fn) {
  const results = [];
  const executing = [];
  for (const item of items) {
    const p = Promise.resolve().then(() => fn(item));
    results.push(p);
    if (limit <= items.length) {
      const e = p.then(() => executing.splice(executing.indexOf(e), 1));
      executing.push(e);
      if (executing.length >= limit) {
        await Promise.race(executing);
      }
    }
  }
  return Promise.all(results);
}

// Helper: sanitize tên file an toàn cho SEO và Windows (giữ nguyên khoảng trắng)
export function sanitizeFilename(name) {
  if (!name) return 'unnamed';
  // Chỉ loại bỏ ký tự cấm đặt tên file: \ / : * ? " < > |
  return name.replace(/[\\/:*?"<>|]/g, '').trim();
}

// Helper: Trích xuất Calendar ID từ link lịch chia sẻ
export function extractCalendarId(url) {
  if (!url) return null;
  if (!url.includes('calendar.google.com')) {
    return url.trim();
  }
  try {
    const urlObj = new URL(url);
    const src = urlObj.searchParams.get('src');
    if (src) return decodeURIComponent(src);
  } catch (e) {
    const match = url.match(/[?&]src=([^&]+)/);
    if (match && match[1]) return decodeURIComponent(match[1]);
  }
  return null;
}

// Helper: Chuyển đổi JSON Google Docs sang HTML cơ bản cho Calendar
export function convertDocToHtml(doc) {
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

// Trích xuất thông tin doanh nghiệp (NAP) của dự án từ SQLite schema phẳng thực tế
export async function getBusinessNapInfo(projectId) {
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

export function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function getLanguageFullName(code) {
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
