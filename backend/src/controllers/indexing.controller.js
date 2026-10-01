import { query } from '../../db.js';
import { submitGoogleIndexing, submitBingIndexing, logIndexingResult } from '../services/indexing.service.js';

/**
 * Lấy cấu hình Indexing của Project (Google Service Accounts & Bing API Key)
 */
export async function getConfig(req, res) {
  const { projectId } = req.params;
  try {
    const rows = await query.all(
      `SELECT key, value FROM settings WHERE project_id = ? AND key IN ('google_service_accounts', 'bing_api_key', 'bing_site_url')`,
      [projectId]
    );

    const config = {
      googleServiceAccounts: [],
      bingApiKey: '',
      bingSiteUrl: ''
    };

    rows.forEach(row => {
      if (row.key === 'google_service_accounts' && row.value) {
        try {
          config.googleServiceAccounts = JSON.parse(row.value);
        } catch (e) {
          config.googleServiceAccounts = [];
        }
      } else if (row.key === 'bing_api_key') {
        config.bingApiKey = row.value || '';
      } else if (row.key === 'bing_site_url') {
        config.bingSiteUrl = row.value || '';
      }
    });

    res.json(config);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi khi lấy cấu hình Indexing: ' + err.message });
  }
}

/**
 * Lưu cấu hình Indexing của Project
 */
export async function saveConfig(req, res) {
  const { projectId } = req.params;
  const { googleServiceAccounts, bingApiKey, bingSiteUrl } = req.body;

  try {
    if (googleServiceAccounts !== undefined) {
      const accountsJson = JSON.stringify(googleServiceAccounts);
      await query.run(
        `INSERT INTO settings (project_id, key, value) VALUES (?, 'google_service_accounts', ?)
         ON CONFLICT(project_id, key) DO UPDATE SET value = excluded.value`,
        [projectId, accountsJson]
      );
    }

    if (bingApiKey !== undefined) {
      await query.run(
        `INSERT INTO settings (project_id, key, value) VALUES (?, 'bing_api_key', ?)
         ON CONFLICT(project_id, key) DO UPDATE SET value = excluded.value`,
        [projectId, bingApiKey]
      );
    }

    if (bingSiteUrl !== undefined) {
      await query.run(
        `INSERT INTO settings (project_id, key, value) VALUES (?, 'bing_site_url', ?)
         ON CONFLICT(project_id, key) DO UPDATE SET value = excluded.value`,
        [projectId, bingSiteUrl]
      );
    }

    res.json({ message: 'Đã lưu cấu hình Indexing thành công!' });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi khi lưu cấu hình Indexing: ' + err.message });
  }
}

/**
 * Thực thi Submit URLs lên Google và/hoặc Bing Indexing API
 */
export async function submitUrls(req, res) {
  const { projectId } = req.params;
  const { urls, services } = req.body; // services: ['google', 'bing']

  if (!urls || !Array.isArray(urls) || urls.length === 0) {
    return res.status(400).json({ error: 'Vui lòng cung cấp danh sách URLs hợp lệ.' });
  }

  try {
    const configRows = await query.all(
      `SELECT key, value FROM settings WHERE project_id = ? AND key IN ('google_service_accounts', 'bing_api_key', 'bing_site_url')`,
      [projectId]
    );

    let googleServiceAccounts = [];
    let bingApiKey = '';
    let bingSiteUrl = '';

    configRows.forEach(r => {
      if (r.key === 'google_service_accounts' && r.value) {
        try { googleServiceAccounts = JSON.parse(r.value); } catch (e) {}
      }
      if (r.key === 'bing_api_key') bingApiKey = r.value;
      if (r.key === 'bing_site_url') bingSiteUrl = r.value;
    });

    const results = [];

    // Process Google Submissions
    if (services.includes('google')) {
      if (!googleServiceAccounts || googleServiceAccounts.length === 0) {
        results.push({ service: 'google', status: 'failed', message: 'Chưa cấu hình Google Service Account JSON nào.' });
      } else {
        // Simple round-robin or first available Service Account
        const saKey = googleServiceAccounts[0];
        for (const url of urls) {
          const resGoogle = await submitGoogleIndexing(url, saKey);
          const statusStr = resGoogle.success ? 'success' : 'failed';
          const msgStr = resGoogle.success ? 'Google Index Request Sent' : resGoogle.error;
          await logIndexingResult(projectId, url, 'google', statusStr, msgStr);
          results.push({ url, service: 'google', status: statusStr, message: msgStr });
        }
      }
    }

    // Process Bing Submissions
    if (services.includes('bing')) {
      if (!bingApiKey || !bingSiteUrl) {
        results.push({ service: 'bing', status: 'failed', message: 'Chưa cấu hình Bing API Key hoặc Bing Site URL.' });
      } else {
        const resBing = await submitBingIndexing(urls, bingSiteUrl, bingApiKey);
        const statusStr = resBing.success ? 'success' : 'failed';
        const msgStr = resBing.success ? 'Bing Batch Request Sent' : resBing.error;
        for (const url of urls) {
          await logIndexingResult(projectId, url, 'bing', statusStr, msgStr);
          results.push({ url, service: 'bing', status: statusStr, message: msgStr });
        }
      }
    }

    res.json({ message: 'Hoàn tất submit URLs!', results });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi khi thực thi submit URLs: ' + err.message });
  }
}

/**
 * Lấy lịch sử Submit URLs
 */
export async function getHistory(req, res) {
  const { projectId } = req.params;
  try {
    const logs = await query.all(
      `SELECT * FROM indexing_logs WHERE project_id = ? ORDER BY submitted_at DESC LIMIT 100`,
      [projectId]
    );
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi khi lấy lịch sử Indexing: ' + err.message });
  }
}

/**
 * Dọn dẹp lịch sử Submit
 */
export async function clearHistory(req, res) {
  const { projectId } = req.params;
  try {
    await query.run(`DELETE FROM indexing_logs WHERE project_id = ?`, [projectId]);
    res.json({ message: 'Đã dọn dẹp lịch sử Indexing.' });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi khi xóa lịch sử Indexing: ' + err.message });
  }
}
