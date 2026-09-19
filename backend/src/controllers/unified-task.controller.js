import { unifiedTaskService } from '../services/unified-task.service.js';

export const unifiedTaskController = {
  // Tạo task mới
  async createTask(req, res) {
    try {
      const { projectId, moduleType, taskName, payload, schemaSteps, maxRetries } = req.body;
      if (!projectId || !moduleType || !taskName) {
        return res.status(400).json({ error: 'Thiếu thông tin projectId, moduleType hoặc taskName.' });
      }

      const taskId = await unifiedTaskService.createTask({
        projectId: parseInt(projectId),
        moduleType,
        taskName,
        payload,
        schemaSteps,
        maxRetries: maxRetries ? parseInt(maxRetries) : 3
      });

      res.json({ success: true, taskId, message: 'Đã tạo task mới trong hệ thống.' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // Cấp task kế tiếp cho Worker Agent
  async getNextTask(req, res) {
    try {
      const modulesStr = req.query.modules;
      const allowedModules = modulesStr ? modulesStr.split(',') : null;

      const task = await unifiedTaskService.getNextTask(allowedModules);
      if (!task) {
        return res.json({ hasTask: false });
      }

      res.json({
        hasTask: true,
        taskId: task.id,
        projectId: task.project_id,
        moduleType: task.module_type,
        taskName: task.task_name,
        payload: task.payload,
        schema: { steps: task.schema_steps }
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // Báo cáo kết quả từ Worker Agent
  async reportTask(req, res) {
    try {
      const { taskId, status, resultData, logs } = req.body;
      if (!taskId || !status) {
        return res.status(400).json({ error: 'Thiếu taskId hoặc status.' });
      }

      const result = await unifiedTaskService.updateTaskReport(parseInt(taskId), {
        status,
        resultData,
        logs
      });

      res.json({ success: true, ...result });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // Lấy danh sách task của dự án
  async getProjectTasks(req, res) {
    try {
      const { projectId } = req.params;
      const { moduleType } = req.query;

      const tasks = await unifiedTaskService.getTasksByProject(parseInt(projectId), moduleType);
      res.json({ success: true, tasks });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // Xóa task
  async deleteTask(req, res) {
    try {
      const { id } = req.params;
      await unifiedTaskService.deleteTask(parseInt(id));
      res.json({ success: true, message: 'Đã xóa task.' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // Dọn dẹp task hoàn thành
  async clearCompleted(req, res) {
    try {
      const { projectId } = req.params;
      await unifiedTaskService.clearCompleted(parseInt(projectId));
      res.json({ success: true, message: 'Đã xóa các task hoàn thành.' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};
