import { google } from 'googleapis';
import { query } from '../../db.js';

// Helper: Khởi tạo Google OAuth2 Client với cơ chế Tự động Refresh Token
export async function getGoogleOAuthClient(projectId) {
  const settingsList = await query.all('SELECT * FROM settings WHERE project_id = ?', [projectId]);
  const settingsObj = settingsList.reduce((acc, curr) => {
    acc[curr.key] = curr.value;
    return acc;
  }, {});

  const clientId = settingsObj.google_client_id;
  const clientSecret = settingsObj.google_client_secret;
  const redirectUri = settingsObj.google_redirect_uri || 'http://localhost:5000/api/google/callback';

  if (!clientId || !clientSecret) {
    throw new Error('Chưa cấu hình Google Client ID hoặc Client Secret cho dự án này!');
  }

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUri
  );

  const accessToken = settingsObj.google_access_token;
  const refreshToken = settingsObj.google_refresh_token;

  if (!accessToken && !refreshToken) {
    throw new Error('Chưa kết nối Google Cloud OAuth cho dự án này! Vui lòng bấm "Kết nối Google Cloud".');
  }

  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken
  });

  // Lắng nghe sự kiện Google SDK tự động làm mới Token để lưu vào SQLite DB
  oauth2Client.on('tokens', async (tokens) => {
    if (tokens.access_token) {
      await query.run(
        'INSERT OR REPLACE INTO settings (project_id, key, value) VALUES (?, ?, ?)',
        [projectId, 'google_access_token', tokens.access_token]
      );
    }
    if (tokens.refresh_token) {
      await query.run(
        'INSERT OR REPLACE INTO settings (project_id, key, value) VALUES (?, ?, ?)',
        [projectId, 'google_refresh_token', tokens.refresh_token]
      );
    }
  });

  // Tự động kiểm tra và làm mới (Refresh) Token nếu đã hết hạn
  try {
    const tokenRes = await oauth2Client.getAccessToken();
    if (tokenRes && tokenRes.token) {
      oauth2Client.credentials.access_token = tokenRes.token;
    }
  } catch (refreshErr) {
    console.error('Lỗi tự động làm mới Token Google OAuth:', refreshErr.message);
    if (refreshErr.message.includes('invalid_grant') || refreshErr.message.includes('invalid') || refreshErr.message.includes('expired')) {
      throw new Error('Phiên xác thực Google OAuth đã hết hạn! Vui lòng bấm nút "Kết nối Google Cloud" ở trên để kết nối lại.');
    }
  }

  return oauth2Client;
}
