import { getAuthUrl, handleCallback, checkStatus } from '../services/google/auth.service.js';

export async function getAuthUrlController(req, res) {
  const { projectId } = req.params;
  try {
    const url = await getAuthUrl(projectId);
    res.json({ url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function googleCallbackController(req, res) {
  const { code, state } = req.query;
  const projectId = state;
  if (!code || !projectId) {
    return res.status(400).send('Thiếu mã code xác thực hoặc projectId');
  }

  try {
    await handleCallback(code, projectId);
    res.redirect(`http://localhost:5173/?google_oauth=success&project_id=${projectId}`);
  } catch (error) {
    res.status(500).send(`Lỗi xác thực Google OAuth: ${error.message}`);
  }
}

export async function getStatusController(req, res) {
  const { projectId } = req.params;
  try {
    const connected = await checkStatus(projectId);
    res.json({ connected });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
