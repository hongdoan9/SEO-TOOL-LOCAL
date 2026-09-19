import { query } from '../../db.js';

export async function getSettings(req, res) {
  const { projectId } = req.params;
  try {
    const settingsList = await query.all('SELECT * FROM settings WHERE project_id = ?', [projectId]);
    const settingsObj = settingsList.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});
    res.json(settingsObj);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function saveSettings(req, res) {
  const { projectId } = req.params;
  const settingsObj = req.body;
  try {
    for (const [key, value] of Object.entries(settingsObj)) {
      await query.run(
        'INSERT OR REPLACE INTO settings (project_id, key, value) VALUES (?, ?, ?)',
        [projectId, key, typeof value === 'object' ? JSON.stringify(value) : String(value)]
      );
    }
    res.json({ message: 'Đã cập nhật cấu hình thành công' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
