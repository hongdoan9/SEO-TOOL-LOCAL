# BẢNG TỔNG HỢP CẤU TRÚC DATABASE SQLITE (`seo_tool.db`)

## 1. Bảng `users` (Tài khoản người dùng)
- `id`: INTEGER PRIMARY KEY AUTOINCREMENT
- `name`: TEXT NOT NULL
- `avatar`: TEXT

## 2. Bảng `projects` (Dự án của từng tài khoản)
- `id`: INTEGER PRIMARY KEY AUTOINCREMENT
- `user_id`: INTEGER (Khóa ngoại tham chiếu `users(id)`)
- `name`: TEXT NOT NULL
- `description`: TEXT
- `created_at`: DATETIME DEFAULT CURRENT_TIMESTAMP

## 3. Bảng `settings` (API Keys & Cấu hình theo Dự án)
- `project_id`: INTEGER (Khóa ngoại tham chiếu `projects(id)`)
- `key`: TEXT
- `value`: TEXT
- PRIMARY KEY (`project_id`, `key`)

## 4. Bảng `business_info` (Thông tin Doanh nghiệp - Module 1)
- `project_id`: INTEGER PRIMARY KEY (Khóa ngoại tham chiếu `projects(id)`)
- `website`: TEXT, `brand`: TEXT, `company_name`: TEXT, `founded_date`: TEXT, `owner`: TEXT, `tax_code`: TEXT
- `industry`: TEXT, `products`: TEXT, `features`: TEXT, `employees`: TEXT, `activity_area`: TEXT
- `usp`: TEXT, `achievements`: TEXT, `certificates`: TEXT, `search_id`: TEXT
- `phones`: TEXT (JSON string mảng SĐT), `addresses`: TEXT (JSON string mảng địa chỉ)
- `nap`: TEXT (WordPress Editor HTML), `bio1`: TEXT, `bio2`: TEXT, `bio3`: TEXT

## 5. Bảng `google_stacks` (Bộ Google Stack - Module 2)
- `id`: INTEGER PRIMARY KEY AUTOINCREMENT
- `project_id`: INTEGER NOT NULL (Khóa ngoại tham chiếu `projects(id)`)
- `url`: TEXT NOT NULL, `brand`: TEXT NOT NULL, `main_key`: TEXT NOT NULL, `drive_folder`: TEXT NOT NULL
- `phone`: TEXT, `address`: TEXT
- `keywords`: TEXT (JSON string 39 từ khóa)
- `prep_data`: TEXT (JSON string checklist prep + URLs)
- `assets`: TEXT (JSON string danh sách Google Drive Assets đã tạo)
- `step4_data`: TEXT, `step4_images`: TEXT, `sheet_created_url`: TEXT, `image_folder_url`: TEXT
- `optimize_results`: TEXT, `pdf_results`: TEXT, `button3_results`: TEXT
- `languages_data`: TEXT (JSON string 15 ngôn ngữ), `languages_opt_results`: TEXT
- `created_at`: DATETIME DEFAULT CURRENT_TIMESTAMP
