/**
 * Presets Schemas chuẩn cho 18 Nền tảng Mạng Xã Hội & Web 2.0 nổi bật
 * Phục vụ tự động hóa tạo Profile & Edit Profile trên Chrome Extension
 */

export const PRESET_SCHEMAS = [
  // --- NHÓM 1: TOP SOCIAL PLATFORMS ---
  {
    platform: 'facebook',
    name: 'Facebook.com',
    schema_json: {
      name: 'Facebook Profile Setup',
      platform: 'facebook',
      urls: { register: 'https://www.facebook.com/r.php', profile_edit: 'https://www.facebook.com/me/about' },
      steps: [{
        id: 'step_1_fb', name: 'Cập nhật Intro & Bio Facebook', target_url: 'https://www.facebook.com/me/about',
        actions: [
          { type: 'wait', selector: 'body', timeout: 10000 },
          { type: 'type', selector: 'textarea[name="bio"], textarea', field: 'bio1' }
        ]
      }]
    }
  },
  {
    platform: 'twitter',
    name: 'Twitter / X.com',
    schema_json: {
      name: 'X.com Profile Setup',
      platform: 'twitter',
      urls: { register: 'https://x.com/i/flow/signup', profile_edit: 'https://x.com/settings/profile' },
      steps: [{
        id: 'step_1_x', name: 'Cập nhật Name, Bio & Website trên X.com', target_url: 'https://x.com/settings/profile',
        actions: [
          { type: 'wait', selector: 'input[name="displayName"], input[name="name"]', timeout: 10000 },
          { type: 'type', selector: 'input[name="displayName"], input[name="name"]', field: 'brand' },
          { type: 'type', selector: 'textarea[name="description"], textarea[name="bio"]', field: 'bio1' },
          { type: 'type', selector: 'input[name="url"], input[name="website"]', field: 'website' }
        ]
      }]
    }
  },
  {
    platform: 'linkedin',
    name: 'LinkedIn.com',
    schema_json: {
      name: 'LinkedIn Profile Setup',
      platform: 'linkedin',
      urls: { register: 'https://www.linkedin.com/signup', profile_edit: 'https://www.linkedin.com/in/edit/about/' },
      steps: [{
        id: 'step_1_linkedin', name: 'Cập nhật Headline & About LinkedIn', target_url: 'https://www.linkedin.com/in/edit/about/',
        actions: [
          { type: 'wait', selector: 'textarea', timeout: 10000 },
          { type: 'type', selector: 'textarea[name="summary"], textarea', field: 'bio1' }
        ]
      }]
    }
  },
  {
    platform: 'instagram',
    name: 'Instagram.com',
    schema_json: {
      name: 'Instagram Profile Setup',
      platform: 'instagram',
      urls: { register: 'https://www.instagram.com/accounts/emailsignup/', profile_edit: 'https://www.instagram.com/accounts/edit/' },
      steps: [{
        id: 'step_1_ig', name: 'Cập nhật Bio & Website Instagram', target_url: 'https://www.instagram.com/accounts/edit/',
        actions: [
          { type: 'wait', selector: 'textarea[id="pepBio"], textarea', timeout: 10000 },
          { type: 'type', selector: 'textarea[id="pepBio"], textarea', field: 'bio1' },
          { type: 'type', selector: 'input[id="pepWebsite"], input[name="website"]', field: 'website' }
        ]
      }]
    }
  },
  {
    platform: 'youtube',
    name: 'Youtube.com',
    schema_json: {
      name: 'Youtube Channel Setup',
      platform: 'youtube',
      urls: { register: 'https://accounts.google.com/SignUp', profile_edit: 'https://studio.youtube.com/channel/editing/profile' },
      steps: [{
        id: 'step_1_yt', name: 'Cập nhật Mô tả Kênh Youtube', target_url: 'https://studio.youtube.com/channel/editing/profile',
        actions: [
          { type: 'wait', selector: 'textarea[id="description-textarea"], textarea', timeout: 10000 },
          { type: 'type', selector: 'textarea[id="description-textarea"], textarea', field: 'bio1' }
        ]
      }]
    }
  },
  {
    platform: 'github',
    name: 'Github.com',
    schema_json: {
      name: 'Github Profile Setup',
      platform: 'github',
      urls: { register: 'https://github.com/signup', profile_edit: 'https://github.com/settings/profile' },
      steps: [{
        id: 'step_1_github', name: 'Cập nhật Bio, Company & Website Github', target_url: 'https://github.com/settings/profile',
        actions: [
          { type: 'wait', selector: 'input[name="user[profile_name]"]', timeout: 10000 },
          { type: 'type', selector: 'input[name="user[profile_name]"]', field: 'brand' },
          { type: 'type', selector: 'textarea[name="user[profile_bio]"]', field: 'bio1' },
          { type: 'type', selector: 'input[name="user[profile_blog]"]', field: 'website' }
        ]
      }]
    }
  },
  {
    platform: 'tiktok',
    name: 'TikTok.com',
    schema_json: {
      name: 'TikTok Profile Setup',
      platform: 'tiktok',
      urls: { register: 'https://www.tiktok.com/signup', profile_edit: 'https://www.tiktok.com/@setting' },
      steps: [{
        id: 'step_1_tiktok', name: 'Cập nhật Bio TikTok', target_url: 'https://www.tiktok.com/@setting',
        actions: [
          { type: 'wait', selector: 'textarea[name="bio"], textarea', timeout: 10000 },
          { type: 'type', selector: 'textarea[name="bio"], textarea', field: 'bio1' }
        ]
      }]
    }
  },

  // --- NHÓM 2: CONTENT & QA PLATFORMS ---
  {
    platform: 'medium',
    name: 'Medium.com',
    schema_json: {
      name: 'Medium Profile Setup', platform: 'medium',
      urls: { register: 'https://medium.com/m/signin', profile_edit: 'https://medium.com/me/settings' },
      steps: [{
        id: 'step_1_nav', name: 'Truy cập trang cài đặt Profile Medium', target_url: 'https://medium.com/me/settings',
        actions: [
          { type: 'wait', selector: 'body', timeout: 10000 },
          { type: 'click', selector: 'button[aria-label="Edit name"]', timeout: 5000 },
          { type: 'type', selector: 'input[name="name"]', field: 'brand' },
          { type: 'click', selector: 'button[aria-label="Edit bio"]', timeout: 5000 },
          { type: 'type', selector: 'textarea[name="bio"]', field: 'bio1' },
          { type: 'click', selector: 'button[data-action="save-profile"]', timeout: 5000 }
        ]
      }]
    }
  },
  {
    platform: 'reddit',
    name: 'Reddit.com',
    schema_json: {
      name: 'Reddit Profile Setup', platform: 'reddit',
      urls: { register: 'https://www.reddit.com/register/', profile_edit: 'https://www.reddit.com/settings/profile' },
      steps: [{
        id: 'step_1_profile', name: 'Cập nhật Display Name & About trên Reddit', target_url: 'https://www.reddit.com/settings/profile',
        actions: [
          { type: 'wait', selector: 'input[name="displayName"]', timeout: 12000 },
          { type: 'type', selector: 'input[name="displayName"]', field: 'brand' },
          { type: 'type', selector: 'textarea[name="about"]', field: 'bio1' }
        ]
      }]
    }
  },
  {
    platform: 'quora',
    name: 'Quora.com',
    schema_json: {
      name: 'Quora Profile Setup', platform: 'quora',
      urls: { register: 'https://www.quora.com/', profile_edit: 'https://www.quora.com/profile' },
      steps: [{
        id: 'step_1_bio', name: 'Chỉnh sửa Profile Credentials trên Quora', target_url: 'https://www.quora.com/profile',
        actions: [
          { type: 'wait', selector: '.puppeteer_test_profile_name', timeout: 10000 },
          { type: 'click', selector: '.qu-cursor--pointer.qu-hover--bg--darken' },
          { type: 'type', selector: 'textarea.qu-user-select--text', field: 'bio1' }
        ]
      }]
    }
  },
  {
    platform: 'pinterest',
    name: 'Pinterest.com',
    schema_json: {
      name: 'Pinterest Profile Setup', platform: 'pinterest',
      urls: { register: 'https://www.pinterest.com/', profile_edit: 'https://www.pinterest.com/settings/edit-profile/' },
      steps: [{
        id: 'step_1_profile', name: 'Cập nhật Profile Doanh nghiệp Pinterest', target_url: 'https://www.pinterest.com/settings/edit-profile/',
        actions: [
          { type: 'type', selector: 'input[id="first_name"], input[name="first_name"], #first_name', field: 'brand' },
          { type: 'type', selector: 'textarea[id="about"], textarea[name="about"], #about', field: 'bio1' },
          { type: 'type', selector: 'input[id="website_url"], input[name="website_url"], #website_url', field: 'website' }
        ]
      }]
    }
  },
  {
    platform: 'tumblr',
    name: 'Tumblr.com',
    schema_json: {
      name: 'Tumblr.com', platform: 'tumblr',
      urls: { register: 'https://www.tumblr.com/register', profile_edit: 'https://www.tumblr.com/settings/blog' },
      steps: [{
        id: 'step_1_blog_info', name: 'Cập nhật Tiêu đề & Mô tả Tumblr', target_url: 'https://www.tumblr.com/settings/blog',
        actions: [
          { type: 'wait', selector: 'input[name="title"]', timeout: 10000 },
          { type: 'type', selector: 'input[name="title"]', field: 'brand' },
          { type: 'type', selector: 'textarea[name="description"]', field: 'bio1' }
        ]
      }]
    }
  },
  {
    platform: 'aboutme',
    name: 'About.me',
    schema_json: {
      name: 'About.me Profile Setup', platform: 'aboutme',
      urls: { register: 'https://about.me/signup', profile_edit: 'https://about.me/edit' },
      steps: [{
        id: 'step_1_edit', name: 'Cập nhật Headline & Biography About.me', target_url: 'https://about.me/edit',
        actions: [
          { type: 'wait', selector: 'input[name="name"]', timeout: 10000 },
          { type: 'type', selector: 'input[name="name"]', field: 'brand' },
          { type: 'type', selector: 'textarea[name="bio"]', field: 'bio1' }
        ]
      }]
    }
  },

  // --- NHÓM 3: WEB 2.0 & CHUYÊN NGÀNH ---
  {
    platform: 'devto',
    name: 'Dev.to',
    schema_json: {
      name: 'Dev.to Profile Setup', platform: 'devto',
      urls: { register: 'https://dev.to/enter', profile_edit: 'https://dev.to/settings' },
      steps: [{
        id: 'step_1_devto', name: 'Cập nhật Bio & Website trên Dev.to', target_url: 'https://dev.to/settings',
        actions: [
          { type: 'wait', selector: 'input[name="user[name]"]', timeout: 10000 },
          { type: 'type', selector: 'input[name="user[name]"]', field: 'brand' },
          { type: 'type', selector: 'textarea[name="user[summary]"]', field: 'bio1' },
          { type: 'type', selector: 'input[name="user[website_url]"]', field: 'website' }
        ]
      }]
    }
  },
  {
    platform: 'gravatar',
    name: 'Gravatar.com',
    schema_json: {
      name: 'Gravatar Profile Setup', platform: 'gravatar',
      urls: { register: 'https://gravatar.com/site/signup', profile_edit: 'https://gravatar.com/profiles/edit' },
      steps: [{
        id: 'step_1_gravatar', name: 'Cập nhật Display Name & About Gravatar', target_url: 'https://gravatar.com/profiles/edit',
        actions: [
          { type: 'wait', selector: 'input[name="display_name"]', timeout: 10000 },
          { type: 'type', selector: 'input[name="display_name"]', field: 'brand' },
          { type: 'type', selector: 'textarea[name="about_me"]', field: 'bio1' }
        ]
      }]
    }
  },
  {
    platform: 'linktree',
    name: 'Linktr.ee',
    schema_json: {
      name: 'Linktree Profile Setup', platform: 'linktree',
      urls: { register: 'https://linktr.ee/register', profile_edit: 'https://linktr.ee/admin' },
      steps: [{
        id: 'step_1_linktree', name: 'Cập nhật Profile Title & Bio Linktree', target_url: 'https://linktr.ee/admin',
        actions: [
          { type: 'wait', selector: 'input[name="profileTitle"]', timeout: 10000 },
          { type: 'type', selector: 'input[name="profileTitle"]', field: 'brand' },
          { type: 'type', selector: 'textarea[name="bio"]', field: 'bio1' }
        ]
      }]
    }
  },
  {
    platform: 'telegraph',
    name: 'Telegra.ph',
    schema_json: {
      name: 'Telegra.ph Author Setup', platform: 'telegraph',
      urls: { register: 'https://telegra.ph', profile_edit: 'https://telegra.ph' },
      steps: [{
        id: 'step_1_telegraph', name: 'Nhập Author Name & Nội dung Telegra.ph', target_url: 'https://telegra.ph',
        actions: [
          { type: 'wait', selector: 'address[data-placeholder="Your name..."]', timeout: 8000 },
          { type: 'type', selector: 'address[data-placeholder="Your name..."]', field: 'brand' }
        ]
      }]
    }
  },
  {
    platform: 'behance',
    name: 'Behance.net',
    schema_json: {
      name: 'Behance Profile Setup', platform: 'behance',
      urls: { register: 'https://www.behance.net/signup', profile_edit: 'https://www.behance.net/settings' },
      steps: [{
        id: 'step_1_behance', name: 'Cập nhật Description & Occupation Behance', target_url: 'https://www.behance.net/settings',
        actions: [
          { type: 'wait', selector: 'textarea[name="description"]', timeout: 10000 },
          { type: 'type', selector: 'textarea[name="description"]', field: 'bio1' }
        ]
      }]
    }
  }
];
