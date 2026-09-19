import { query } from '../../db.js';

export async function getProjects(req, res) {
  const { userId } = req.params;
  try {
    const projects = await query.all('SELECT * FROM projects WHERE user_id = ? ORDER BY created_at DESC', [userId]);
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function createProject(req, res) {
  const userId = req.body.userId || req.body.user_id;
  const { name, description } = req.body;
  if (!userId || !name) {
    return res.status(400).json({ error: 'Thiếu userId hoặc tên dự án' });
  }
  try {
    const result = await query.run(
      'INSERT INTO projects (user_id, name, description) VALUES (?, ?, ?)',
      [userId, name, description || '']
    );
    const newProject = await query.get('SELECT * FROM projects WHERE id = ?', [result.id]);
    res.status(201).json(newProject);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function deleteProject(req, res) {
  const { id } = req.params;
  try {
    await query.run('DELETE FROM projects WHERE id = ?', [id]);
    res.json({ message: 'Đã xóa dự án thành công', id: parseInt(id) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
