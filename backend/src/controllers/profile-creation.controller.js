import { query } from '../../db.js';
import { PRESET_SCHEMAS } from '../utils/seed-social-schemas.js';
import { unifiedTaskService } from '../services/unified-task.service.js';

// 1. Lấy danh sách tất cả Social Schemas
export const getSchemas = async (req, res) => {
  try {
    const schemas = await query.all('SELECT * FROM social_schemas ORDER BY name ASC');
    const parsed = schemas.map(s => ({
      ...s,
      schema_json: JSON.parse(s.schema_json || '{}')
    }));
    return res.json(parsed);
  } catch (error) {
    console.error('Lỗi getSchemas:', error.message);
    return res.status(500).json({ error: 'Không thể lấy danh sách Social Schemas.' });
  }
};

// 2. Lưu / Cập nhật Social Schema
export const saveSchema = async (req, res) => {
  try {
    const { platform, name, schema_json } = req.body;
    if (!platform || !name || !schema_json) {
      return res.status(400).json({ error: 'Thiếu thông tin platform, name hoặc schema_json.' });
    }

    const jsonStr = typeof schema_json === 'object' ? JSON.stringify(schema_json) : schema_json;
    const existing = await query.get('SELECT id FROM social_schemas WHERE platform = ?', [platform]);

    if (existing) {
      await query.run(
        'UPDATE social_schemas SET name = ?, schema_json = ? WHERE platform = ?',
        [name, jsonStr, platform]
      );
    } else {
      await query.run(
        'INSERT INTO social_schemas (platform, name, schema_json) VALUES (?, ?, ?)',
        [platform, name, jsonStr]
      );
    }

    return res.json({ success: true, message: `Đã lưu Schema cho ${name} thành công.` });
  } catch (error) {
    console.error('Lỗi saveSchema:', error.message);
    return res.status(500).json({ error: 'Không thể lưu Social Schema.' });
  }
};

// 2b. Nạp danh sách Presets Schemas Mẫu
export const seedPresets = async (req, res) => {
  try {
    let count = 0;
    for (const item of PRESET_SCHEMAS) {
      const jsonStr = JSON.stringify(item.schema_json);
      const existing = await query.get('SELECT id FROM social_schemas WHERE platform = ?', [item.platform]);
      if (existing) {
        await query.run(
          'UPDATE social_schemas SET name = ?, schema_json = ? WHERE platform = ?',
          [item.name, jsonStr, item.platform]
        );
      } else {
        await query.run(
          'INSERT INTO social_schemas (platform, name, schema_json) VALUES (?, ?, ?)',
          [item.platform, item.name, jsonStr]
        );
      }
      count++;
    }
    return res.json({ success: true, message: `Đã nạp ${count} Presets Schemas thành công!` });
  } catch (error) {
    console.error('Lỗi seedPresets:', error.message);
    return res.status(500).json({ error: 'Không thể nạp Presets Schemas.' });
  }
};

// 3. Lấy danh sách Profiles theo Project ID
export const getProfiles = async (req, res) => {
  try {
    const { projectId } = req.params;
    const profiles = await query.all(
      'SELECT * FROM social_profiles WHERE project_id = ? ORDER BY id DESC',
      [projectId]
    );
    return res.json(profiles);
  } catch (error) {
    console.error('Lỗi getProfiles:', error.message);
    return res.status(500).json({ error: 'Không thể lấy danh sách Profiles.' });
  }
};

// 4. Tạo nhiệm vụ (Task) tạo Profile mới trong Hàng đợi
export const createTask = async (req, res) => {
  try {
    const { projectId, platform } = req.body;
    if (!projectId || !platform) {
      return res.status(400).json({ error: 'Thiếu projectId hoặc platform.' });
    }

    const result = await query.run(
      'INSERT INTO social_profiles (project_id, platform, status, logs) VALUES (?, ?, "pending", "Đã thêm vào hàng đợi...")',
      [projectId, platform]
    );

    // Đồng thời tạo Task trong Unified System Queue Engine
    const schemaRow = await query.get('SELECT schema_json FROM social_schemas WHERE platform = ?', [platform]);
    const schemaObj = schemaRow ? JSON.parse(schemaRow.schema_json) : null;
    const bizRow = await query.get('SELECT * FROM business_info WHERE project_id = ?', [projectId]);
    const biz = bizRow || {};

    if (schemaObj) {
      await unifiedTaskService.createTask({
        projectId: parseInt(projectId),
        moduleType: 'profile_creation',
        taskName: `Tạo Profile ${platform.toUpperCase()}`,
        payload: {
          email: biz.email || 'seotest.auto@gmail.com',
          brand: biz.brand || biz.company_name || 'My Brand',
          company_name: biz.company_name || '',
          website: biz.website || '',
          bio1: biz.bio1 || biz.usp || '',
          owner: biz.owner || ''
        },
        schemaSteps: schemaObj.steps || []
      });
    }

    return res.json({ success: true, id: result.id, message: 'Đã thêm nhiệm vụ tạo Profile vào Hàng đợi.' });
  } catch (error) {
    console.error('Lỗi createTask:', error.message);
    return res.status(500).json({ error: 'Không thể tạo nhiệm vụ Profile mới.' });
  }
};

// 5. Xóa 1 Profile Task
export const deleteProfile = async (req, res) => {
  try {
    const { id } = req.params;
    await query.run('DELETE FROM social_profiles WHERE id = ?', [id]);
    return res.json({ success: true, message: 'Đã xóa Profile task.' });
  } catch (error) {
    console.error('Lỗi deleteProfile:', error.message);
    return res.status(500).json({ error: 'Không thể xóa Profile task.' });
  }
};

// 6. Agent Endpoint: Chrome Extension lấy nhiệm vụ tiếp theo trong Hàng đợi
export const getNextAgentTask = async (req, res) => {
  try {
    const task = await query.get(
      'SELECT * FROM social_profiles WHERE status = "pending" ORDER BY id ASC LIMIT 1'
    );

    if (!task) {
      return res.json({ hasTask: false });
    }

    // Lấy Schema tương ứng
    const schemaRow = await query.get('SELECT schema_json FROM social_schemas WHERE platform = ?', [task.platform]);
    const schema = schemaRow ? JSON.parse(schemaRow.schema_json) : null;

    // Lấy dữ liệu Business Info của Project
    const bizRow = await query.get('SELECT * FROM business_info WHERE project_id = ?', [task.project_id]);
    const biz = bizRow || {};

    // Cập nhật trạng thái task sang "in_progress"
    await query.run(
      'UPDATE social_profiles SET status = "in_progress", updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [task.id]
    );

    return res.json({
      hasTask: true,
      taskId: task.id,
      platform: task.platform,
      schema,
      payload: {
        email: biz.email || 'seotest.auto@gmail.com',
        brand: biz.brand || biz.company_name || 'My Brand',
        company_name: biz.company_name || '',
        website: biz.website || '',
        bio1: biz.bio1 || biz.usp || '',
        owner: biz.owner || '',
        phones: biz.phones ? JSON.parse(biz.phones) : []
      }
    });
  } catch (error) {
    console.error('Lỗi getNextAgentTask:', error.message);
    return res.status(500).json({ error: 'Lỗi khi lấy nhiệm vụ cho Chrome Extension.' });
  }
};

// 7. Agent Endpoint: Chrome Extension báo cáo kết quả thực thi
export const reportAgentTask = async (req, res) => {
  try {
    const { taskId, status, profileUrl, logs } = req.body;
    if (!taskId || !status) {
      return res.status(400).json({ error: 'Thiếu taskId hoặc status.' });
    }

    await query.run(
      'UPDATE social_profiles SET status = ?, profile_url = ?, logs = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, profileUrl || '', logs || '', taskId]
    );

    return res.json({ success: true, message: 'Đã cập nhật báo cáo từ Extension.' });
  } catch (error) {
    console.error('Lỗi reportAgentTask:', error.message);
    return res.status(500).json({ error: 'Lỗi khi nhận báo cáo từ Chrome Extension.' });
  }
};
