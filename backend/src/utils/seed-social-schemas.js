/**
 * Presets Schemas chuẩn cho các Nền tảng Mạng Xã Hội
 * Phục vụ tự động hóa tạo Profile & Edit Profile trên Chrome Extension
 */

export const PRESET_SCHEMAS = [
  {
    platform: 'medium',
    name: 'Medium.com',
    schema_json: {
      name: 'Medium Profile Setup',
      platform: 'medium',
      urls: {
        register: 'https://medium.com/m/signin',
        profile_edit: 'https://medium.com/me/settings'
      },
      steps: [
        {
          id: 'step_1_nav',
          name: 'Truy cập trang cài đặt Profile Medium',
          target_url: 'https://medium.com/me/settings',
          actions: [
            { type: 'wait', selector: 'body', timeout: 10000 },
            { type: 'click', selector: 'button[aria-label="Edit name"]', timeout: 5000 },
            { type: 'type', selector: 'input[name="name"]', field: 'brand' },
            { type: 'click', selector: 'button[aria-label="Edit bio"]', timeout: 5000 },
            { type: 'type', selector: 'textarea[name="bio"]', field: 'bio1' },
            { type: 'click', selector: 'button[data-action="save-profile"]', timeout: 5000 }
          ]
        }
      ]
    }
  },
  {
    platform: 'reddit',
    name: 'Reddit.com',
    schema_json: {
      name: 'Reddit Profile Setup',
      platform: 'reddit',
      urls: {
        register: 'https://www.reddit.com/register/',
        profile_edit: 'https://www.reddit.com/settings/profile'
      },
      steps: [
        {
          id: 'step_1_profile',
          name: 'Cập nhật Display Name & About trên Reddit',
          target_url: 'https://www.reddit.com/settings/profile',
          actions: [
            { type: 'wait', selector: 'input[name="displayName"]', timeout: 12000 },
            { type: 'type', selector: 'input[name="displayName"]', field: 'brand' },
            { type: 'type', selector: 'textarea[name="about"]', field: 'bio1' }
          ]
        }
      ]
    }
  },
  {
    platform: 'quora',
    name: 'Quora.com',
    schema_json: {
      name: 'Quora Profile Setup',
      platform: 'quora',
      urls: {
        register: 'https://www.quora.com/',
        profile_edit: 'https://www.quora.com/profile'
      },
      steps: [
        {
          id: 'step_1_bio',
          name: 'Chỉnh sửa Profile Credentials trên Quora',
          target_url: 'https://www.quora.com/profile',
          actions: [
            { type: 'wait', selector: '.puppeteer_test_profile_name', timeout: 10000 },
            { type: 'click', selector: '.qu-cursor--pointer.qu-hover--bg--darken' },
            { type: 'type', selector: 'textarea.qu-user-select--text', field: 'bio1' }
          ]
        }
      ]
    }
  },
  {
    platform: 'pinterest',
    name: 'Pinterest.com',
    schema_json: {
      name: 'Pinterest Profile Setup',
      platform: 'pinterest',
      urls: {
        register: 'https://www.pinterest.com/',
        profile_edit: 'https://www.pinterest.com/settings/edit-profile/'
      },
      steps: [
        {
          id: 'step_1_profile',
          name: 'Cập nhật Profile Doanh nghiệp Pinterest',
          target_url: 'https://www.pinterest.com/settings/edit-profile/',
          actions: [
            { type: 'type', selector: 'input[id="first_name"], input[name="first_name"], #first_name', field: 'brand' },
            { type: 'type', selector: 'textarea[id="about"], textarea[name="about"], #about', field: 'bio1' },
            { type: 'type', selector: 'input[id="website_url"], input[name="website_url"], #website_url', field: 'website' }
          ]
        }
      ]
    }
  },
  {
    platform: 'tumblr',
    name: 'Tumblr.com',
    schema_json: {
      name: 'Tumblr.com',
      platform: 'tumblr',
      urls: {
        register: 'https://www.tumblr.com/register',
        profile_edit: 'https://www.tumblr.com/settings/blog'
      },
      steps: [
        {
          id: 'step_1_blog_info',
          name: 'Cập nhật Tiêu đề & Mô tả Tumblr',
          target_url: 'https://www.tumblr.com/settings/blog',
          actions: [
            { type: 'wait', selector: 'input[name="title"]', timeout: 10000 },
            { type: 'type', selector: 'input[name="title"]', field: 'brand' },
            { type: 'type', selector: 'textarea[name="description"]', field: 'bio1' }
          ]
        }
      ]
    }
  },
  {
    platform: 'aboutme',
    name: 'About.me',
    schema_json: {
      name: 'About.me Profile Setup',
      platform: 'aboutme',
      urls: {
        register: 'https://about.me/signup',
        profile_edit: 'https://about.me/edit'
      },
      steps: [
        {
          id: 'step_1_edit',
          name: 'Cập nhật Headline & Biography About.me',
          target_url: 'https://about.me/edit',
          actions: [
            { type: 'wait', selector: 'input[name="name"]', timeout: 10000 },
            { type: 'type', selector: 'input[name="name"]', field: 'brand' },
            { type: 'type', selector: 'textarea[name="bio"]', field: 'bio1' }
          ]
        }
      ]
    }
  }
];
