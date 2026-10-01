import { google } from 'googleapis';
import { query } from '../../db.js';

/**
 * Xử lý submit URL lên Google Indexing API
 * @param {string} url - URL cần ép Index
 * @param {object} serviceAccountJson - Nội dung Service Account Key JSON
 * @returns {Promise<object>}
 */
export async function submitGoogleIndexing(url, serviceAccountJson) {
  try {
    const jwtClient = new google.auth.JWT(
      serviceAccountJson.client_email,
      null,
      serviceAccountJson.private_key,
      ['https://www.googleapis.com/auth/indexing'],
      null
    );

    await jwtClient.authorize();

    const response = await google.indexing({ version: 'v3', auth: jwtClient }).urlNotifications.publish({
      requestBody: {
        url: url,
        type: 'URL_UPDATED'
      }
    });

    return {
      success: true,
      data: response.data
    };
  } catch (err) {
    return {
      success: false,
      error: err.response?.data?.error?.message || err.message
    };
  }
}

/**
 * Xử lý submit danh sách URLs lên Bing Webmaster API
 * @param {string[]} urls - Danh sách URLs cần submit
 * @param {string} siteUrl - Domain chính của trang web trên Bing Webmaster
 * @param {string} apiKey - API Key từ Bing Webmaster Tools
 * @returns {Promise<object>}
 */
export async function submitBingIndexing(urls, siteUrl, apiKey) {
  try {
    const endpoint = `https://ssl.bing.com/webmaster/api.svc/json/SubmitUrlbatch?apikey=${apiKey}`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify({
        siteUrl: siteUrl,
        urlList: urls
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Bing API Error ${response.status}: ${errText}`);
    }

    const data = await response.json();
    return {
      success: true,
      data: data
    };
  } catch (err) {
    return {
      success: false,
      error: err.message
    };
  }
}

/**
 * Lưu vết kết quả Index vào SQLite database
 */
export async function logIndexingResult(projectId, url, service, status, responseMsg) {
  try {
    await query.run(
      `INSERT INTO indexing_logs (project_id, url, service, status, response_msg) VALUES (?, ?, ?, ?, ?)`,
      [projectId, url, service, status, responseMsg]
    );
  } catch (e) {
    console.error('Lỗi khi lưu indexing log:', e.message);
  }
}
