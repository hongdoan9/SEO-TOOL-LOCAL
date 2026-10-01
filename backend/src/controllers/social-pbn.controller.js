import { socialPbnService } from '../services/social-pbn.service.js';

export const socialPbnController = {
  async getSites(req, res) {
    try {
      const { projectId } = req.params;
      const sites = await socialPbnService.getSites(projectId);
      res.json({ success: true, data: sites });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async addSite(req, res) {
    try {
      const { projectId } = req.params;
      const { site_name, site_url, username, app_password } = req.body;

      if (!site_name || !site_url || !username || !app_password) {
        return res.status(400).json({ success: false, error: 'Vui lòng nhập đầy đủ thông tin Website PBN!' });
      }

      await socialPbnService.addSite(projectId, { site_name, site_url, username, app_password });
      res.json({ success: true, message: 'Thêm PBN Site thành công!' });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async deleteSite(req, res) {
    try {
      const { id } = req.params;
      await socialPbnService.deleteSite(id);
      res.json({ success: true, message: 'Xóa PBN Site thành công!' });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async testSiteConnection(req, res) {
    try {
      const { site_url, username, app_password } = req.body;
      if (!site_url || !username || !app_password) {
        return res.status(400).json({ success: false, error: 'Thiếu thông tin URL, Username hoặc App Password' });
      }

      const result = await socialPbnService.testSiteConnection({ site_url, username, app_password });
      if (result.success) {
        res.json({ success: true, message: result.message });
      } else {
        res.status(400).json({ success: false, error: result.message });
      }
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async publishPost(req, res) {
    try {
      const { projectId } = req.params;
      const { title, content, anchor_text, target_url, targets } = req.body;

      if (!title || !content) {
        return res.status(400).json({ success: false, error: 'Tiêu đề và nội dung không được để trống!' });
      }

      if (!targets || !Array.isArray(targets) || targets.length === 0) {
        return res.status(400).json({ success: false, error: 'Vui lòng chọn ít nhất 1 trang đích để đăng bài!' });
      }

      const results = await socialPbnService.publishPost(projectId, { title, content, anchor_text, target_url, targets });
      res.json({ success: true, message: 'Đã hoàn tất gửi bài đăng!', data: results });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async getHistory(req, res) {
    try {
      const { projectId } = req.params;
      const history = await socialPbnService.getHistory(projectId);
      res.json({ success: true, data: history });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async clearHistory(req, res) {
    try {
      const { projectId } = req.params;
      await socialPbnService.clearHistory(projectId);
      res.json({ success: true, message: 'Đã xóa toàn bộ lịch sử đăng bài!' });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
};
