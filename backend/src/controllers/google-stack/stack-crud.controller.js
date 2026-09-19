import { query } from '../../../db.js';

export async function getStacks(req, res) {
  const { projectId } = req.params;
  try {
    const stacks = await query.all('SELECT * FROM google_stacks WHERE project_id = ? ORDER BY created_at DESC', [projectId]);
    res.json(stacks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function createStack(req, res) {
  const { projectId } = req.params;
  const { url, brand, main_key, drive_folder, phone, address } = req.body;

  if (!url || !brand || !main_key || !drive_folder) {
    return res.status(400).json({ error: 'Vui lòng nhập đầy đủ các trường thông tin!' });
  }

  if (drive_folder.includes('?usp=')) {
    return res.status(400).json({ error: 'Đường dẫn thư mục Google Drive không được phép chứa tham số "?usp="' });
  }

  try {
    const result = await query.run(
      `INSERT INTO google_stacks (project_id, url, brand, main_key, drive_folder, phone, address) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [projectId, url, brand, main_key, drive_folder, phone || '', address || '']
    );
    const newStack = await query.get('SELECT * FROM google_stacks WHERE id = ?', [result.id]);
    res.status(201).json(newStack);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function deleteStack(req, res) {
  const { id } = req.params;
  try {
    await query.run('DELETE FROM google_stacks WHERE id = ?', [id]);
    res.json({ message: 'Đã xóa bộ Google Stack thành công', id: parseInt(id) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function getStackDetail(req, res) {
  const { id } = req.params;
  try {
    const stack = await query.get('SELECT * FROM google_stacks WHERE id = ?', [id]);
    if (stack) {
      stack.keywords = stack.keywords ? JSON.parse(stack.keywords) : null;
      stack.assets = stack.assets ? JSON.parse(stack.assets) : null;
      stack.prep_checks = stack.prep_checks ? JSON.parse(stack.prep_checks) : null;
      res.json(stack);
    } else {
      res.status(404).json({ error: 'Không tìm thấy bộ Google Stack' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function saveKeywords(req, res) {
  const { id } = req.params;
  const keywordsObj = req.body;
  try {
    await query.run(
      'UPDATE google_stacks SET keywords = ? WHERE id = ?',
      [JSON.stringify(keywordsObj), id]
    );
    res.json({ message: 'Đã lưu bộ từ khóa tối ưu thành công!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function savePrepCheck(req, res) {
  const { id } = req.params;
  const { checks, brand, phone, address, mapUrl, manualVideoDone } = req.body;
  try {
    await query.run(
      'UPDATE google_stacks SET prep_checks = ?, google_map_url = ?, manual_video_done = ?, brand = ?, phone = ?, address = ? WHERE id = ?',
      [JSON.stringify(checks || {}), mapUrl || '', manualVideoDone ? 1 : 0, brand || '', phone || '', address || '', id]
    );
    res.json({ message: 'Đã lưu thông tin chuẩn bị thành công!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
