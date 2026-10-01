import { query } from '../../db.js';

export const socialPbnService = {
  // --- PBN SITES MANAGEMENT ---
  async getSites(projectId) {
    return await query.all(
      'SELECT id, project_id, site_name, site_url, username, status, created_at FROM pbn_sites WHERE project_id = ? ORDER BY id DESC',
      [projectId]
    );
  },

  async addSite(projectId, { site_name, site_url, username, app_password }) {
    let formattedUrl = site_url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = 'https://' + formattedUrl;
    }
    formattedUrl = formattedUrl.replace(/\/+$/, '');

    const res = await query.run(
      'INSERT INTO pbn_sites (project_id, site_name, site_url, username, app_password) VALUES (?, ?, ?, ?, ?)',
      [projectId, site_name.trim(), formattedUrl, username.trim(), app_password.trim()]
    );
    return res;
  },

  async deleteSite(id) {
    return await query.run('DELETE FROM pbn_sites WHERE id = ?', [id]);
  },

  async testSiteConnection(site) {
    let formattedUrl = site.site_url.trim().replace(/\/+$/, '');
    const authHeader = 'Basic ' + Buffer.from(`${site.username}:${site.app_password}`).toString('base64');
    try {
      const response = await fetch(`${formattedUrl}/wp-json/wp/v2/users/me`, {
        method: 'GET',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const userData = await response.json();
        return { success: true, message: `Kết nối thành công! Xin chào ${userData.name || userData.slug}` };
      } else {
        const errJson = await response.json().catch(() => ({}));
        return { success: false, message: errJson.message || `Lỗi HTTP ${response.status}: Kết nối thất bại` };
      }
    } catch (err) {
      return { success: false, message: `Lỗi kết nối: ${err.message}` };
    }
  },

  // --- POST PUBLISHING ---
  async publishPost(projectId, { title, content, anchor_text, target_url, targets }) {
    // Inject backlink into content if anchor_text & target_url exist
    let finalContent = content;
    if (anchor_text && target_url) {
      const backlinkHtml = `<p>Tham khảo thêm: <a href="${target_url}" target="_blank" rel="noopener noreferrer">${anchor_text}</a></p>`;
      finalContent = content + '\n\n' + backlinkHtml;
    }

    const results = [];

    for (const target of targets) {
      if (target.type === 'wordpress') {
        // Find PBN site config
        const site = await query.get('SELECT * FROM pbn_sites WHERE id = ?', [target.id]);
        if (!site) {
          results.push({ target_name: target.name, status: 'failed', error: 'Không tìm thấy cấu hình PBN Site' });
          await query.run(
            'INSERT INTO social_pbn_posts (project_id, target_type, target_name, post_title, status, error_message) VALUES (?, ?, ?, ?, ?, ?)',
            [projectId, 'wordpress', target.name || 'WP Site', title, 'failed', 'Không tìm thấy PBN Site']
          );
          continue;
        }

        const authHeader = 'Basic ' + Buffer.from(`${site.username}:${site.app_password}`).toString('base64');
        try {
          const res = await fetch(`${site.site_url}/wp-json/wp/v2/posts`, {
            method: 'POST',
            headers: {
              'Authorization': authHeader,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              title: title,
              content: finalContent,
              status: 'publish'
            })
          });

          if (res.ok) {
            const data = await res.json();
            const postLink = data.link || `${site.site_url}/?p=${data.id}`;
            await query.run(
              'INSERT INTO social_pbn_posts (project_id, target_type, target_name, target_url, post_title, post_url, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
              [projectId, 'wordpress', site.site_name, site.site_url, title, postLink, 'completed']
            );
            results.push({ target_name: site.site_name, status: 'completed', post_url: postLink });
          } else {
            const errData = await res.json().catch(() => ({}));
            const errMsg = errData.message || `HTTP ${res.status}`;
            await query.run(
              'INSERT INTO social_pbn_posts (project_id, target_type, target_name, target_url, post_title, status, error_message) VALUES (?, ?, ?, ?, ?, ?, ?)',
              [projectId, 'wordpress', site.site_name, site.site_url, title, 'failed', errMsg]
            );
            results.push({ target_name: site.site_name, status: 'failed', error: errMsg });
          }
        } catch (err) {
          await query.run(
            'INSERT INTO social_pbn_posts (project_id, target_type, target_name, target_url, post_title, status, error_message) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [projectId, 'wordpress', site.site_name, site.site_url, title, 'failed', err.message]
          );
          results.push({ target_name: site.site_name, status: 'failed', error: err.message });
        }
      } else if (target.type === 'social') {
        // Enqueue task into system_tasks for Chrome Extension Worker
        try {
          const payload = JSON.stringify({
            title,
            content: finalContent,
            anchor_text,
            target_url,
            platform: target.platform
          });

          await query.run(
            'INSERT INTO system_tasks (project_id, module_type, task_name, payload, status) VALUES (?, ?, ?, ?, ?)',
            [projectId, 'social_pbn_post', `Đăng bài ${target.name}`, payload, 'pending']
          );

          await query.run(
            'INSERT INTO social_pbn_posts (project_id, target_type, target_name, post_title, status) VALUES (?, ?, ?, ?, ?)',
            [projectId, 'social_extension', target.name, title, 'pending']
          );

          results.push({ target_name: target.name, status: 'pending', message: 'Đã tạo tác vụ cho Chrome Extension' });
        } catch (err) {
          results.push({ target_name: target.name, status: 'failed', error: err.message });
        }
      }
    }

    return results;
  },

  // --- POST HISTORY ---
  async getHistory(projectId) {
    return await query.all(
      'SELECT * FROM social_pbn_posts WHERE project_id = ? ORDER BY id DESC',
      [projectId]
    );
  },

  async clearHistory(projectId) {
    return await query.run('DELETE FROM social_pbn_posts WHERE project_id = ?', [projectId]);
  }
};
