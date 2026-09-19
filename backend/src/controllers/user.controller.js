import { query } from '../../db.js';

export async function getUsers(req, res) {
  try {
    const users = await query.all('SELECT * FROM users');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function createUser(req, res) {
  const { name, avatar } = req.body;
  if (!name) return res.status(400).json({ error: 'Tên người dùng là bắt buộc' });
  try {
    const seed = Math.random().toString(36).substring(7);
    const userAvatar = avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}`;
    const result = await query.run('INSERT INTO users (name, avatar) VALUES (?, ?)', [name, userAvatar]);
    res.status(201).json({ id: result.id, name, avatar: userAvatar });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function deleteUser(req, res) {
  const { id } = req.params;
  try {
    await query.run('DELETE FROM projects WHERE user_id = ?', [id]);
    await query.run('DELETE FROM users WHERE id = ?', [id]);
    res.json({ message: 'Đã xóa người dùng và các dự án liên quan thành công', id: parseInt(id) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
