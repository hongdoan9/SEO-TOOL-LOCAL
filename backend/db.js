import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, 'seo_tool.db');

// Khởi tạo kết nối database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Không thể kết nối SQLite database:', err.message);
  } else {
    console.log('Đã kết nối thành công tới SQLite database cục bộ:', dbPath);
    db.run('PRAGMA foreign_keys = ON;');
    initDatabase();
  }
});

// Wrapper helper chuyển callback sang Promise để dễ dùng async/await
export const query = {
  run: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, changes: this.changes });
      });
    });
  },
  get: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },
  all: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
};

// Hàm tạo các bảng dữ liệu ban đầu
async function initDatabase() {
  try {
    // Bảng users
    await query.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        avatar TEXT
      )
    `);

    // Bảng projects
    await query.run(`
      CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        name TEXT NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
      )
    `);

    // Kiểm tra cấu trúc bảng settings hiện tại để nâng cấp tự động
    try {
      const tableInfo = await query.all("PRAGMA table_info(settings)");
      if (tableInfo.length > 0) {
        const hasProjectId = tableInfo.some(col => col.name === 'project_id');
        if (!hasProjectId) {
          await query.run("DROP TABLE IF EXISTS settings");
          console.log("Đã phát hiện bảng settings phiên bản cũ. Đang tự động nâng cấp...");
        }
      }
    } catch (e) {
      console.log("Khởi tạo bảng settings lần đầu.");
    }

    // Bảng settings (lưu API keys, OAuth tokens...) theo từng dự án
    await query.run(`
      CREATE TABLE IF NOT EXISTS settings (
        project_id INTEGER,
        key TEXT,
        value TEXT,
        PRIMARY KEY (project_id, key),
        FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
      )
    `);

    // Bảng business_info (Thông tin doanh nghiệp) theo từng dự án
    await query.run(`
      CREATE TABLE IF NOT EXISTS business_info (
        project_id INTEGER PRIMARY KEY,
        website TEXT,
        brand TEXT,
        company_name TEXT,
        founded_date TEXT,
        owner TEXT,
        tax_code TEXT,
        industry TEXT,
        products TEXT,
        features TEXT,
        employees TEXT,
        activity_area TEXT,
        usp TEXT,
        achievements TEXT,
        certificates TEXT,
        search_id TEXT,
        phones TEXT,
        addresses TEXT,
        nap TEXT,
        bio1 TEXT,
        bio2 TEXT,
        bio3 TEXT,
        email TEXT,
        FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
      )
    `);

    // Kiểm tra và nâng cấp bảng business_info thêm cột email nếu chưa có
    try {
      const bizInfoCols = await query.all("PRAGMA table_info(business_info)");
      const hasEmail = bizInfoCols.some(col => col.name === 'email');
      if (!hasEmail) {
        await query.run("ALTER TABLE business_info ADD COLUMN email TEXT");
        console.log("Đã nâng cấp bảng business_info: thêm cột email.");
      }
    } catch (e) {
      console.error("Lỗi khi kiểm tra nâng cấp bảng business_info:", e.message);
    }

    // Bảng google_stacks (Bộ Google Stack) theo từng dự án
    await query.run(`
      CREATE TABLE IF NOT EXISTS google_stacks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        url TEXT NOT NULL,
        brand TEXT NOT NULL,
        main_key TEXT NOT NULL,
        drive_folder TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
      )
    `);

    // Nâng cấp tự động bảng google_stacks (thêm cột keywords, assets nếu chưa có)
    try {
      const tableInfo = await query.all("PRAGMA table_info(google_stacks)");
      const hasKeywords = tableInfo.some(col => col.name === 'keywords');
      if (!hasKeywords) {
        await query.run("ALTER TABLE google_stacks ADD COLUMN keywords TEXT");
        console.log("Đã nâng cấp bảng google_stacks: thêm cột keywords.");
      }
      const hasAssets = tableInfo.some(col => col.name === 'assets');
      if (!hasAssets) {
        await query.run("ALTER TABLE google_stacks ADD COLUMN assets TEXT");
        console.log("Đã nâng cấp bảng google_stacks: thêm cột assets.");
      }
      const hasStep4Data = tableInfo.some(col => col.name === 'step4_data');
      if (!hasStep4Data) {
        await query.run("ALTER TABLE google_stacks ADD COLUMN step4_data TEXT");
        console.log("Đã nâng cấp bảng google_stacks: thêm cột step4_data.");
      }
      const hasStep4Images = tableInfo.some(col => col.name === 'step4_images');
      if (!hasStep4Images) {
        await query.run("ALTER TABLE google_stacks ADD COLUMN step4_images TEXT");
        console.log("Đã nâng cấp bảng google_stacks: thêm cột step4_images.");
      }
      const hasSheetCreatedUrl = tableInfo.some(col => col.name === 'sheet_created_url');
      if (!hasSheetCreatedUrl) {
        await query.run("ALTER TABLE google_stacks ADD COLUMN sheet_created_url TEXT");
        console.log("Đã nâng cấp bảng google_stacks: thêm cột sheet_created_url.");
      }
      const hasImageFolderUrl = tableInfo.some(col => col.name === 'image_folder_url');
      if (!hasImageFolderUrl) {
        await query.run("ALTER TABLE google_stacks ADD COLUMN image_folder_url TEXT");
        console.log("Đã nâng cấp bảng google_stacks: thêm cột image_folder_url.");
      }
      const hasOptimizeResults = tableInfo.some(col => col.name === 'optimize_results');
      if (!hasOptimizeResults) {
        await query.run("ALTER TABLE google_stacks ADD COLUMN optimize_results TEXT");
        console.log("Đã nâng cấp bảng google_stacks: thêm cột optimize_results.");
      }
      const hasPdfResults = tableInfo.some(col => col.name === 'pdf_results');
      if (!hasPdfResults) {
        await query.run("ALTER TABLE google_stacks ADD COLUMN pdf_results TEXT");
        console.log("Đã nâng cấp bảng google_stacks: thêm cột pdf_results.");
      }
      const hasButton3Results = tableInfo.some(col => col.name === 'button3_results');
      if (!hasButton3Results) {
        await query.run("ALTER TABLE google_stacks ADD COLUMN button3_results TEXT");
        console.log("Đã nâng cấp bảng google_stacks: thêm cột button3_results.");
      }
      const hasPhone = tableInfo.some(col => col.name === 'phone');
      if (!hasPhone) {
        await query.run("ALTER TABLE google_stacks ADD COLUMN phone TEXT");
        console.log("Đã nâng cấp bảng google_stacks: thêm cột phone.");
      }
      const hasAddress = tableInfo.some(col => col.name === 'address');
      if (!hasAddress) {
        await query.run("ALTER TABLE google_stacks ADD COLUMN address TEXT");
        console.log("Đã nâng cấp bảng google_stacks: thêm cột address.");
      }
      const hasLanguagesData = tableInfo.some(col => col.name === 'languages_data');
      if (!hasLanguagesData) {
        await query.run("ALTER TABLE google_stacks ADD COLUMN languages_data TEXT");
        console.log("Đã nâng cấp bảng google_stacks: thêm cột languages_data.");
      }
      const hasLanguagesOptResults = tableInfo.some(col => col.name === 'languages_opt_results');
      if (!hasLanguagesOptResults) {
        await query.run("ALTER TABLE google_stacks ADD COLUMN languages_opt_results TEXT");
        console.log("Đã nâng cấp bảng google_stacks: thêm cột languages_opt_results.");
      }
      const hasPrepChecks = tableInfo.some(col => col.name === 'prep_checks');
      if (!hasPrepChecks) {
        await query.run("ALTER TABLE google_stacks ADD COLUMN prep_checks TEXT");
        console.log("Đã nâng cấp bảng google_stacks: thêm cột prep_checks.");
      }
      const hasGoogleMapUrl = tableInfo.some(col => col.name === 'google_map_url');
      if (!hasGoogleMapUrl) {
        await query.run("ALTER TABLE google_stacks ADD COLUMN google_map_url TEXT");
        console.log("Đã nâng cấp bảng google_stacks: thêm cột google_map_url.");
      }
      const hasManualVideoDone = tableInfo.some(col => col.name === 'manual_video_done');
      if (!hasManualVideoDone) {
        await query.run("ALTER TABLE google_stacks ADD COLUMN manual_video_done INTEGER DEFAULT 0");
        console.log("Đã nâng cấp bảng google_stacks: thêm cột manual_video_done.");
      }
    } catch (e) {
      console.error("Lỗi khi kiểm tra nâng cấp bảng google_stacks:", e.message);
    }

    // Bảng social_schemas (Lưu JSON Selectors của các trang Social)
    await query.run(`
      CREATE TABLE IF NOT EXISTS social_schemas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        platform TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        schema_json TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Bảng social_profiles (Lưu các profile đã tạo / hàng đợi nhiệm vụ)
    await query.run(`
      CREATE TABLE IF NOT EXISTS social_profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        platform TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        profile_url TEXT,
        logs TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
      )
    `);

    // Bảng system_tasks (Hàng đợi tác vụ tập trung cho tất cả các module)
    await query.run(`
      CREATE TABLE IF NOT EXISTS system_tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        module_type TEXT NOT NULL,
        task_name TEXT NOT NULL,
        payload TEXT,
        schema_steps TEXT,
        status TEXT DEFAULT 'pending',
        retry_count INTEGER DEFAULT 0,
        max_retries INTEGER DEFAULT 3,
        result_data TEXT,
        logs TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
      )
    `);

    // Bảng indexing_logs (Lưu vết lịch sử ép Index cho Module 4)
    await query.run(`
      CREATE TABLE IF NOT EXISTS indexing_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        url TEXT NOT NULL,
        service TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        response_msg TEXT,
        submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
      )
    `);

    // Bảng pbn_sites (Lưu danh sách PBN WordPress vệ tinh cho Module 5)
    await query.run(`
      CREATE TABLE IF NOT EXISTS pbn_sites (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        site_name TEXT NOT NULL,
        site_url TEXT NOT NULL,
        username TEXT NOT NULL,
        app_password TEXT NOT NULL,
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
      )
    `);

    // Bảng social_pbn_posts (Lưu lịch sử bài đăng PBN & Social cho Module 5)
    await query.run(`
      CREATE TABLE IF NOT EXISTS social_pbn_posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        target_type TEXT NOT NULL,
        target_name TEXT NOT NULL,
        target_url TEXT,
        post_title TEXT NOT NULL,
        post_url TEXT,
        status TEXT DEFAULT 'pending',
        error_message TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
      )
    `);

    // Khởi tạo Schema Medium mặc định nếu chưa có
    try {
      const mediumSchema = await query.get("SELECT id FROM social_schemas WHERE platform = 'medium'");
      if (!mediumSchema) {
        const defaultMediumJson = JSON.stringify({
          platform: "medium",
          name: "Medium.com",
          urls: {
            login_email: "https://medium.com/m/signin",
            settings_account: "https://medium.com/me/settings/account"
          },
          steps: [
            {
              step_id: 1,
              name: "Nhập Email Đăng ký",
              target_url: "https://medium.com/m/signin",
              actions: [
                { type: "wait", selector: "a[href*='email'], button, input[type='email']", timeout: 10000 },
                { type: "click", selector: "a[href*='email']" },
                { type: "wait", selector: "input[type='email'], input[name='email']", timeout: 10000 },
                { type: "type", selector: "input[type='email'], input[name='email']", field: "email" },
                { type: "click", selector: "button[type='submit'], button" }
              ]
            },
            {
              step_id: 2,
              name: "Cập nhật Profile Doanh nghiệp",
              target_url: "https://medium.com/me/settings/account",
              actions: [
                { type: "wait", selector: "input[name='name']", timeout: 10000 },
                { type: "type", selector: "input[name='name']", field: "brand" },
                { type: "type", selector: "textarea[name='bio']", field: "bio1" },
                { type: "type", selector: "input[name='website']", field: "website" }
              ]
            }
          ]
        });
        await query.run(
          "INSERT INTO social_schemas (platform, name, schema_json) VALUES ('medium', 'Medium.com', ?)",
          [defaultMediumJson]
        );
        console.log("Đã tạo Schema Medium mặc định cho Module 3.");
      }
    } catch (schemaErr) {
      console.error("Lỗi khi tạo Schema Medium mặc định:", schemaErr.message);
    }


    // Tạo dữ liệu người dùng tượng trưng ban đầu nếu chưa có
    const userCount = await query.get('SELECT COUNT(*) as count FROM users');
    if (userCount.count === 0) {
      await query.run("INSERT INTO users (name, avatar) VALUES ('SEO Specialist', 'https://api.dicebear.com/7.x/bottts/svg?seed=seo')");
      await query.run("INSERT INTO users (name, avatar) VALUES ('Content Writer', 'https://api.dicebear.com/7.x/bottts/svg?seed=writer')");
      console.log('Đã tạo dữ liệu người dùng tượng trưng ban đầu.');
      
      // Tạo dự án mặc định cho user đầu tiên
      const firstUser = await query.get('SELECT id FROM users LIMIT 1');
      if (firstUser) {
        await query.run("INSERT INTO projects (user_id, name, description) VALUES (?, 'Dự án SEO Cục bộ Mẫu', 'Dự án demo đầu tiên của bạn')", [firstUser.id]);
        console.log('Đã tạo dự án mặc định ban đầu.');
      }
    }
  } catch (err) {
    console.error('Lỗi khi khởi tạo database:', err.message);
  }
}

export default db;
