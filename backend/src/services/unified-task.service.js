import { query } from '../../db.js';

export const unifiedTaskService = {
  // Tạo task mới
  async createTask({ projectId, moduleType, taskName, payload, schemaSteps, maxRetries = 3 }) {
    const sql = `
      INSERT INTO system_tasks 
      (project_id, module_type, task_name, payload, schema_steps, status, max_retries) 
      VALUES (?, ?, ?, ?, ?, 'pending', ?)
    `;
    const payloadStr = typeof payload === 'object' ? JSON.stringify(payload) : payload;
    const stepsStr = typeof schemaSteps === 'object' ? JSON.stringify(schemaSteps) : schemaSteps;
    
    const result = await query.run(sql, [
      projectId,
      moduleType,
      taskName,
      payloadStr || null,
      stepsStr || null,
      maxRetries
    ]);
    return result.id;
  },

  // Lấy task kế tiếp dành cho Agent / Extension Worker
  async getNextTask(allowedModules = null) {
    let sql = `SELECT * FROM system_tasks WHERE status = 'pending'`;
    const params = [];

    if (allowedModules && Array.isArray(allowedModules) && allowedModules.length > 0) {
      const placeholders = allowedModules.map(() => '?').join(',');
      sql += ` AND module_type IN (${placeholders})`;
      params.push(...allowedModules);
    }

    sql += ` ORDER BY id ASC LIMIT 1`;
    const task = await query.get(sql, params);

    if (task) {
      // Đánh dấu task đang được xử lý
      await query.run(
        `UPDATE system_tasks SET status = 'in_progress', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [task.id]
      );
      
      return {
        ...task,
        payload: task.payload ? JSON.parse(task.payload) : {},
        schema_steps: task.schema_steps ? JSON.parse(task.schema_steps) : []
      };
    }

    return null;
  },

  // Cập nhật báo cáo kết quả từ Worker
  async updateTaskReport(taskId, { status, resultData, logs }) {
    const existing = await query.get(`SELECT * FROM system_tasks WHERE id = ?`, [taskId]);
    if (!existing) throw new Error(`Task #${taskId} không tồn tại.`);

    let newStatus = status;
    let newRetryCount = existing.retry_count;

    // Nếu lỗi và chưa vượt quá max_retries thì chuyển về pending để thử lại
    if (status === 'failed' && existing.retry_count < existing.max_retries) {
      newStatus = 'pending';
      newRetryCount += 1;
    }

    const resStr = typeof resultData === 'object' ? JSON.stringify(resultData) : resultData;
    const combinedLogs = (existing.logs || '') + '\n' + (logs || '');

    await query.run(
      `UPDATE system_tasks 
       SET status = ?, retry_count = ?, result_data = ?, logs = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [newStatus, newRetryCount, resStr || null, combinedLogs.trim(), taskId]
    );

    return { taskId, status: newStatus, retryCount: newRetryCount };
  },

  // Lấy danh sách task theo dự án
  async getTasksByProject(projectId, moduleType = null) {
    let sql = `SELECT * FROM system_tasks WHERE project_id = ?`;
    const params = [projectId];

    if (moduleType) {
      sql += ` AND module_type = ?`;
      params.push(moduleType);
    }

    sql += ` ORDER BY id DESC`;
    const rows = await query.all(sql, params);

    return rows.map(r => ({
      ...r,
      payload: r.payload ? JSON.parse(r.payload) : {},
      schema_steps: r.schema_steps ? JSON.parse(r.schema_steps) : [],
      result_data: r.result_data ? JSON.parse(r.result_data) : {}
    }));
  },

  // Xóa task
  async deleteTask(taskId) {
    await query.run(`DELETE FROM system_tasks WHERE id = ?`, [taskId]);
    return true;
  },

  // Dọn dẹp các task đã hoàn thành
  async clearCompleted(projectId) {
    await query.run(
      `DELETE FROM system_tasks WHERE project_id = ? AND status = 'completed'`,
      [projectId]
    );
    return true;
  }
};
