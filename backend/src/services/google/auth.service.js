import { query } from '../../../db.js';
import { getGoogleOAuthClient } from '../../config/google-oauth.js';

export async function getAuthUrl(projectId) {
  const oauth2Client = await getGoogleOAuthClient(projectId);
  const scopes = [
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/drive.file'
  ];
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
    state: projectId
  });
}

export async function handleCallback(code, projectId) {
  const oauth2Client = await getGoogleOAuthClient(projectId);
  const { tokens } = await oauth2Client.getToken(code);

  await query.run(
    'INSERT OR REPLACE INTO settings (project_id, key, value) VALUES (?, ?, ?)',
    [projectId, 'google_access_token', tokens.access_token]
  );
  if (tokens.refresh_token) {
    await query.run(
      'INSERT OR REPLACE INTO settings (project_id, key, value) VALUES (?, ?, ?)',
      [projectId, 'google_refresh_token', tokens.refresh_token]
    );
  }
}

export async function checkStatus(projectId) {
  const settingsList = await query.all('SELECT * FROM settings WHERE project_id = ?', [projectId]);
  const settingsObj = settingsList.reduce((acc, curr) => {
    acc[curr.key] = curr.value;
    return acc;
  }, {});
  
  return !!(settingsObj.google_access_token || settingsObj.google_refresh_token);
}
