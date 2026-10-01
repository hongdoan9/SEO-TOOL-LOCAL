# 📖 SÁCH HƯỚNG DẪN SỬ DỤNG & VẬN HÀNH HỆ THỐNG (SEO TOOL LOCAL)

> **Dự án:** SEO Tool Local Multi-User / Multi-Project  
> **Phiên bản:** v2.5 (Cập nhật Unified Task Queue & Web Automation Engine)  
> **Cập nhật gần nhất:** 2026-09-16  

---

## 1. TỔNG QUAN HỆ THỐNG (SYSTEM OVERVIEW)

**SEO Tool Local** là phần mềm quản trị và tự động hóa công việc SEO toàn diện chạy trực tiếp trên máy tính cá nhân (Web Local). Hệ thống hỗ trợ quản lý nhiều người dùng (**Multi-User**), nhiều dự án (**Multi-Project**), tự động xây dựng hệ sinh thái Google Entity (Google Stack), tạo tài khoản mạng xã hội (Social Profiles) và điều hành hàng đợi tác vụ tự động thông qua Chrome Extension.

### 🛠️ Đơn vị Công nghệ & Kiến trúc:
* **Frontend:** React + Vite + Tailwind CSS v4 (Sleek Dark Mode theme).
* **Backend:** Node.js + Express + SQLite Local Database (`seo_tool.db`).
* **Browser Automation Worker:** Chrome Extension Manifest V3 (Thao tác điền form, gõ phím mô phỏng người thật - Human Typing, vượt anti-bot).

---

## 2. BẢN ĐỒ DỰ ÁN & DANH SÁCH CÁC MODULE (SYSTEM MODULES)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           GIAO DIỆN CHÍNH (FRONTEND)                        │
├─────────────────┬─────────────────┬───────────────────┬─────────────────────┤
│  MODULE 1       │  MODULE 2       │  MODULE 3         │  UNIFIED ENGINE     │
│  Settings &     │  Google Stack   │  Social Profile   │  System Task        │
│  Business Info  │  Workflow       │  Creation         │  Queue Monitor      │
└────────┬────────┴────────┬────────┴─────────┬─────────┴──────────┬──────────┘
         │                 │                  │                    │
         ▼                 ▼                  ▼                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            BACKEND EXPRESS SERVER                           │
│                            (REST APIs - Port 5050)                          │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CHROME EXTENSION WORKER AGENT                        │
│             (Tự động thao tác trình duyệt & Báo cáo kết quả)                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 🔹 Module 1: Cài đặt (Settings) & Thông tin Doanh nghiệp (Business Info)
* **Tài khoản & Dự án:** Quản lý tạo/chuyển đổi danh sách User và Project độc lập.
* **Cài đặt API Keys (`/modules/settings/`):**
  * OpenRouter API Key (gọi mô hình AI LLM linh hoạt).
  * Google OAuth Client ID, Secret, Redirect URI (kết nối Google Drive API).
  * WordPress Domain, Username, App Password (kết nối WP REST API).
* **Thông tin Doanh nghiệp (`/modules/business-info/`):**
  * Lưu trữ Brand, Tên công ty, Mã số thuế, Ngành nghề, Sản phẩm, USP, Website, Email.
  * Nhập mảng động Số điện thoại (Phones) & Địa chỉ kèm Google Map URL.
  * Nhập đoạn Bio chuẩn hóa (Bio 1, Bio 2, Bio 3) tích hợp WordPress Editor.

---

### 🔹 Module 2: Google Stack Workflow (Google Entity Builder)
* **Thư mục:** `/frontend/src/modules/google-stack/`
* **7 Bước Tự động hóa:**
  1. **Step 1 - Prep Check:** Kiểm tra ảnh chuẩn SEO, checklist NAP & Google Map URL.
  2. **Step 2 - 39 Keywords Table:** Quản lý bảng 39 từ khóa SEO (Key chính, LSI, Cluster keys), hỗ trợ dán hàng loạt (Bulk paste).
  3. **Step 3 - Assets Builder:** Tự động kết nối Google OAuth, tạo thư mục Google Drive, Google Sheet, Google Docs.
  4. **Step 4 - Manual Assets:** Quản lý 9 Sections liên kết My Maps, Youtube, GMB, Twitter, Pinterest...
  5. **Step 5 - AI Optimization:** Tối ưu nội dung Google Docs, PDF, Google Sheet với OpenRouter AI.
  6. **Step 6 - Multi-Language:** Dịch thuật và tạo tài sản tự động sang **15 Ngôn ngữ quốc tế** (Anh, Nhật, Đức, Nga, Trung, Pháp, Tây Ban Nha...).
  7. **Step 7 - WP Publishing:** Soạn thảo và lưu/đăng bài lên website WordPress qua REST API.

---

### 🔹 Module 3: Profile Creation Workflow (Tự động tạo Social Profiles)
* **Thư mục:** `/frontend/src/modules/profile-creation/`
* **Chức năng:**
  * Quản lý hàng đợi tạo tài khoản trên các trang mạng xã hội: **Medium, Reddit, Quora, Pinterest, Tumblr, About.me**.
  * Quản lý Schema Selectors (Preset Schemas) kịch bản từng bước điền form.
  * Xuất kết quả liên kết Profile hoàn thành ra file CSV hoặc sao chép Clipboard.

---

### 🔹 Module 4: Instant Indexing Engine (Ép lập chỉ mục khẩn cấp)
* **Thư mục:** `/frontend/src/modules/indexing/`
* **Chức năng:**
  * Ép Google Search Console (qua Google Indexing API) & Bing Webmaster (qua Bing Webmaster API) lập chỉ mục hàng loạt URLs cấp tốc cho Dự án.
  * Quản lý danh sách các file JSON **Google Service Account Keys** (Mỗi key ép index tối đa 200 URLs/ngày).
  * Hỗ trợ cấu hình **Bing Webmaster API Key** và Site URL.
  * Nhập danh sách URLs hàng loạt (Google Stack Assets, Social Profiles, bài viết Website...).
  * Quản lý bảng **Lịch sử Indexing** chi tiết (Thời gian, số lượng URLs, phản hồi chi tiết từ Search Engine).

---

### 🔹 Engine Mới Nâng Cấp: Unified Task Queue & Web Automation Platform
* **Chức năng:**
  * Bảng điều khiển tác vụ tập trung `system_tasks`, hỗ trợ cơ chế tự động thử lại (**Auto-Retry**) khi gặp lỗi mạng/trình duyệt.
  * Hỗ trợ Chrome Extension nhận việc đa năng cho bất kỳ module mới nào (Task Automation).
  * Cung cấp màn hình theo dõi tiến độ **Task Terminal Log** real-time.

---

## 3. HƯỚNG DẪN VẬN HÀNH DÀNH CHO NGUỜI DÙNG (USER MANUAL)

### Bước 1: Khởi động Ứng dụng
* **Cách 1 (Nhanh nhất):** Nhấp đúp chuột vào file `run.vbs` ở thư mục gốc (Ứng dụng sẽ tự khởi động mầm ẩn Backend & Frontend mà không hiện cửa sổ đen terminal).
* **Cách 2:** Nhấp đúp chuột vào file `start.bat`.
* Mở trình duyệt truy cập: `http://localhost:5173`

### Bước 2: Cài đặt Chrome Extension (Lần đầu tiên)
1. Mở trình duyệt Google Chrome, truy cập đường dẫn: `chrome://extensions/`
2. Bật công tắc **Developer mode** (Chế độ dành cho nhà phát triển) ở góc trên bên phải.
3. Bấm nút **Load unpacked** (Tải tiện ích đã giải nén) và chọn thư mục `extension/` trong dự án.
4. *(Khuyến nghị)* Bật quyền **Allow in Incognito** (Cho phép ở chế độ ẩn danh) trong cài đặt Extension để Extension tạo profile trong cửa sổ ẩn danh sạch sẽ.

### Bước 3: Tạo Task vụ Tự động
1. Trên giao diện Web, chọn Dự án làm việc ở thanh Menu trên cùng.
2. Truy cập vào **Profile Creation Workflow**.
3. Chọn nền tảng muốn tạo (ví dụ: *Medium, Reddit...*) và bấm **Tạo nhiệm vụ Profile**.
4. Hàng đợi sẽ nhận job và Chrome Extension sẽ tự động mở cửa sổ trình duyệt thực thi mà bạn không cần thao tác tay!

### Bước 4: Ép lập chỉ mục khẩn cấp (Module 4: Instant Indexing Engine)
1. **Cấu hình Keys (Lần đầu):**
   * Vào **Module 4 ➔ Tab ⚙️ Cấu Hình Keys**.
   * Tải lên file JSON Google Service Account (đã thêm email Service Account vào Google Search Console với quyền Owner).
   * *(Tùy chọn)* Nhập Bing Webmaster API Key và Domain đăng ký.
   * Bấm **Lưu Cấu Hình Indexing**.
2. **Gửi yêu cầu ép Index:**
   * Chuyển sang Tab **🚀 Ép Index URLs**.
   * Dán danh sách URLs cần ép Index (Google Stack Docs/Sheet, Social Profiles, bài viết Website...).
   * Tick chọn **Google Indexing API** và/hoặc **Bing Webmaster API**.
   * Bấm **Gửi Yêu Cầu Ép Index Khẩn Cấp 🚀**.
3. **Theo dõi Lịch sử:**
   * Chuyển sang Tab **📋 Lịch Sử** để xem số lượng URL đã gửi, trạng thái thành công/thất bại và log chi tiết.

---

## 4. BẢN ĐỒ CẬP NHẬT MỚI & VỊ TRÍ CODE (CHANGELOG & FILE LOCATIONS)

Dưới đây là bảng tra cứu chi tiết danh sách các tính năng mới đã nâng cấp và vị trí file code tương ứng để phục vụ việc bảo trì/mở rộng:

| Tính năng / Thay đổi mới | Mô tả chi tiết | Vị trí File Code tương ứng |
|--------------------------|----------------|----------------------------|
| **Unified Task Queue DB** | Bảng SQLite `system_tasks` lưu trữ hàng đợi tập trung | [backend/db.js](file:///c:/Users/Admin/Rosedi/tool-seo-v2-main/backend/db.js) |
| **Unified Task Service** | Logic xử lý CRUD, cấp phát job và auto-retry task | [backend/src/services/unified-task.service.js](file:///c:/Users/Admin/Rosedi/tool-seo-v2-main/backend/src/services/unified-task.service.js) |
| **Unified Task Controller** | API endpoints cho `/api/system-tasks/*` | [backend/src/controllers/unified-task.controller.js](file:///c:/Users/Admin/Rosedi/tool-seo-v2-main/backend/src/controllers/unified-task.controller.js) |
| **Unified Task Routes** | Định tuyến API cho hệ thống Task Queue | [backend/src/routes/unified-task.routes.js](file:///c:/Users/Admin/Rosedi/tool-seo-v2-main/backend/src/routes/unified-task.routes.js) |
| **Extension Background Engine** | Service Worker nhận task đa năng & điều phối Tab | [extension/background.js](file:///c:/Users/Admin/Rosedi/tool-seo-v2-main/extension/background.js) |
| **Extension Content Script** | Engine xử lý điền form, gõ phím ngẫu nhiên & bóc tách dữ liệu DOM | [extension/content.js](file:///c:/Users/Admin/Rosedi/tool-seo-v2-main/extension/content.js) |
| **Task Monitor Component** | Giao diện React hiển thị bảng tiến độ, Log Terminal & nút dọn dẹp | [frontend/src/shared/components/TaskMonitorView.jsx](file:///c:/Users/Admin/Rosedi/tool-seo-v2-main/frontend/src/shared/components/TaskMonitorView.jsx) |
| **Module Profile Creation** | Giao diện quản lý hàng đợi tạo profile Social | [frontend/src/modules/profile-creation/ProfileCreationView.jsx](file:///c:/Users/Admin/Rosedi/tool-seo-v2-main/frontend/src/modules/profile-creation/ProfileCreationView.jsx) |
| **Module Instant Indexing** | Giao diện ép Google & Bing lập chỉ mục khẩn cấp hàng loạt URLs | [frontend/src/modules/indexing/IndexingModuleView.jsx](file:///c:/Users/Admin/Rosedi/tool-seo-v2-main/frontend/src/modules/indexing/IndexingModuleView.jsx) |
| **Indexing API Routes** | Backend API endpoints xử lý Google Indexing & Bing Webmaster | [backend/src/routes/indexing.routes.js](file:///c:/Users/Admin/Rosedi/tool-seo-v2-main/backend/src/routes/indexing.routes.js) |
| **Bản đồ Module (Docs)** | Danh sách bản đồ cấu trúc tất cả các file trong hệ thống | [frontend/src/MODULE_MAP.md](file:///c:/Users/Admin/Rosedi/tool-seo-v2-main/frontend/src/MODULE_MAP.md) |
| **Bản đồ Dữ liệu (Docs)** | Danh sách Schema và các bảng SQLite Database | [frontend/src/DATA_REGISTRY.md](file:///c:/Users/Admin/Rosedi/tool-seo-v2-main/frontend/src/DATA_REGISTRY.md) |

---

> 💡 **Lưu ý dành cho Developer:**  
> Khi muốn phát triển thêm 1 Module tác vụ tự động mới (ví dụ: *Auto Indexing Submit, PBN Poster...*), bạn chỉ cần gọi API `POST /api/system-tasks` gửi kèm `schema_steps` thao tác web. Chrome Extension sẽ tự động nhận diện và chạy kịch bản mà bạn không cần sửa lại code Extension!
