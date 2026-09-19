# PROJECT SPECIFICATION (SINGLE SOURCE OF TRUTH)
> **Dự án:** SEO Tool Local Multi-User / Multi-Project
> **Cập nhật gần nhất:** 2026-07-24

---

## 1. MỤC TIÊU BẢN CHẤT CỦA DỰ ÁN
1. **Kiến trúc dữ liệu:**
   - **Tài khoản (Account/User):** Mỗi tài khoản có bộ data hoàn toàn riêng biệt.
   - **Dự án (Project):** Mỗi tài khoản tạo được nhiều dự án. Mỗi dự án chứa các module độc lập.
   - **Mã định danh (Entity ID):** Mọi dữ liệu nhập từ người dùng được cấp ID cụ thể để tham chiếu chéo giữa các module.
2. **Loại ứng dụng:** 
   - Hiện tại: **Web Local** chạy mượt mà trên máy cá nhân, ẩn cửa sổ terminal (`run.vbs`), hiệu suất cao.
   - Định hướng tương lai: Có thể publish sang Cloud cho nhiều người dùng đồng thời.
3. **Các kết nối bên ngoài:**
   - Google Workspace (Drive, Docs, Sheet, Slide, Form...) + Google SERP Search.
   - Mạng xã hội: Facebook, Reddit, Quora, X.com (tìm kiếm & scraping bài viết/comment).
   - OpenRouter API (gọi LLM linh hoạt).
   - WordPress Automation (kết nối REST API, đăng bài, quản lý nội dung).
4. **Giao diện & Nhập liệu:**
   - Trình nhập liệu phong phú: Text, Textarea, WordPress Visual/Text Editor, chèn link...
   - Giao diện Sleek Dark Mode, responsive mượt mà trên mọi kích thước màn hình.

---

## 2. DANH SÁCH CÁC MODULE ĐÃ XÂY DỰNG (BẢO TỒN HOÀN TOÀN CHỨC NĂNG)

> [!IMPORTANT]
> **Quy tắc tuyệt đối:** Không thay đổi hay xóa bất kỳ tính năng/trường dữ liệu nào của các Module 1 và 2 dưới đây. Chỉ được phép refactor/chia nhỏ file để tăng tốc độ và cải thiện UI/UX.

### Module 1: Cài đặt Hệ thống (Settings) & Thông tin Doanh nghiệp (Business Info)
- **Tài khoản & Dự án:** Tạo mới, chuyển đổi, xóa User & Project.
- **Cài đặt API Keys (Settings):**
  - OpenRouter API Key
  - Google OAuth Client ID, Client Secret, Redirect URI
  - WordPress Domain, Username, App Password
- **Thông tin Doanh nghiệp (Business Info):**
  - Thông tin cơ bản: Website, Brand, Tên công ty, Ngày thành lập, Đại diện, Mã số thuế, Ngành nghề, Sản phẩm/Dịch vụ, Nhân sự, Phạm vi hoạt động, USP, Thành tựu, Chứng chỉ, Search ID.
  - Danh sách Số điện thoại (Phones) & Địa chỉ (Addresses) dạng mảng động.
  - NAP (Name-Address-Phone) & 3 đoạn Bio (Bio 1, Bio 2, Bio 3).

### Module 2: Google Stack Workflow (Google Entity Builder)
- **Quản lý Google Stacks:** Tạo mới, chọn, xóa Stack theo Dự án.
- **Bảng Từ khóa (39 Keyword Fields):**
  - Nhóm 1: Key chính + Local, LSI + Local
  - Nhóm 2: LSI keywords 1..4
  - Nhóm 3: Cluster key 1..6
  - Nhóm 4: LSI keywords 5..41
  - Hỗ trợ nhập hàng loạt (Bulk paste) theo từng nhóm.
- **Bảng Chuẩn bị (Preparation Check & NAP):**
  - Checklists: Image, Schema, NAP, Map, Keywords.
  - Brand, Phone, Address, Google Map URL.
- **Hệ thống Tạo & Tối ưu Google Assets:**
  - Kết nối Google OAuth.
  - Tự động tạo thư mục Google Drive, Google Sheet, Google Docs.
  - Tối ưu hóa nội dung Google Docs, PDF, Google Sheet với AI.
  - Dịch thuật và tạo tài sản đa ngôn ngữ (Arabic, Hindi, Russian, Chinese, English, Japanese, German, Spanish, Portuguese, French, Bengali, Polish, Finnish, Korean, Italian).
- **Trình Soạn thảo WordPress (WPEditor):**
  - Visual / Text mode.
  - Kết nối WP REST API để lưu và đăng bài trực tiếp.

---

## 3. QUY TRÌNH PHÁT TRIỂN & BẢO TRÌ (DEVELOPMENT PROTOCOL)
1. Trước khi viết code cho bất kỳ module mới nào, AI phải đọc `PROJECT_SPEC.md` và `ARCHITECTURE_RULES.md`.
2. Giữ nguyên toàn bộ logic API và schema DB của Module 1 & 2.
3. Mọi tính năng UI mới phải tuân thủ Tailwind CSS v4, Sleek Dark Mode và Responsive layout.
