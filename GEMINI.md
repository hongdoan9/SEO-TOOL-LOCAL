# ⛔ LUẬT BẮT BUỘC — ĐỌC TRƯỚC KHI LÀM BẤT CỨ GÌ

> Dự án: SEO Tool Local Multi-User / Multi-Project
> File này được đọc TỰ ĐỘNG mỗi conversation. AI KHÔNG ĐƯỢC bỏ qua.

---

## BƯỚC 0: BẮT BUỘC ĐỌC CÁC FILE SAU TRƯỚC KHI CODE

Trước khi viết BẤT KỲ dòng code nào, AI PHẢI đọc (view_file) các file này:

1. **`PROJECT_SPEC.md`** — Hiểu toàn bộ mục tiêu dự án, danh sách modules, quy trình phát triển
2. **`ARCHITECTURE_RULES.md`** — Hiểu quy tắc kiến trúc, cấu trúc thư mục chuẩn, UI design system
3. **`frontend/src/MODULE_MAP.md`** — Biết module nào ở file nào, step nào ở đâu
4. **`frontend/src/DATA_REGISTRY.md`** — Biết data/ID nào đã tồn tại, schema database, cross-references

---

## QUY TẮC KIẾN TRÚC TUYỆT ĐỐI

### Giới hạn file
- Mỗi file: **TỐI ĐA 300 dòng code**
- `App.jsx`: Chỉ chứa Router + Provider wrapper (**TỐI ĐA 50-100 dòng**)
- `server.js`: Chỉ chứa import routes + khởi tạo Express (**TỐI ĐA 50 dòng**)

### Cấu trúc module bắt buộc
```
frontend/src/modules/<module-name>/
├── index.js                    # Public API export
├── <ModuleName>View.jsx        # Orchestrator / main view
├── <module>.api.js             # API calls riêng cho module
├── <module>.context.jsx        # State riêng cho module (nếu cần)
├── <module>.registry.js        # Step registry (nếu module có workflow)
├── components/                 # Sub-components riêng cho module
│   └── *.jsx                   # Mỗi file <= 250 dòng
└── steps/                      # Mỗi step = 1 file (nếu module có workflow)
    └── Step<N><Name>.jsx       # Mỗi file <= 250 dòng
```

### Backend cấu trúc bắt buộc
```
backend/
├── server.js                   # <50 dòng, chỉ khởi tạo
├── src/
│   ├── routes/                 # 1 file per module
│   ├── controllers/            # 1 file per resource
│   ├── services/               # Business logic
│   └── utils/                  # Helpers
└── db.js
```

---

## ⛔ GIAO THỨC BẮT BUỘC: ARCHITECT-FIRST (KHÔNG ĐƯỢC CODE NGAY)

Khi người dùng yêu cầu xây dựng module mới, tính năng phức tạp, tự động hóa hoặc crawl dữ liệu, AI **TUYỆT ĐỐI KHÔNG ĐƯỢC VIẾT CODE NGAY**. AI phải đóng vai trò là Senior System Architect và thực hiện 4 bước sau:

### Bước 1: Khảo sát Hệ sinh thái (Do Not Reinvent The Wheel)
- Phân tích rào cản hệ thống: Rate Limits, Anti-bot (Cloudflare, Captcha), Timeout.
- Khảo sát thư viện NPM/GitHub/MCP: Tìm kiếm các giải pháp mã nguồn mở đã xử lý tối ưu (VD: Batch API, Playwright Stealth, Queue system).

### Bước 2: Đánh giá Đánh đổi & Chọn Cơ chế (Mechanism Evaluation)
- AI BẮT BUỘC phải đối chiếu bài toán với 5 Cơ chế thực thi sau để chọn "Vũ khí" chuẩn xác nhất:
  1. **Client-Side Browser Extension:** (Tốt nhất để vượt Anti-bot, vượt CORS, mượn phiên đăng nhập thật của User).
  2. **Server-Side Headless Browser:** (Tốt cho Crawl scale lớn, nhưng rủi ro bị block IP Datacenter cao).
  3. **Local Desktop Daemons:** (Tốt cho thao tác trực tiếp lên ổ cứng/OS của user).
  4. **Official/Internal APIs:** (Tốc độ bàn thờ, rẻ nhất, nhưng dễ bị Rate Limit hoặc đòi hỏi Reverse Engineering).
  5. **MCP Endpoints:** (Chuẩn kết nối cho AI Agent).
- **Lập Ma trận Quyết định:** So sánh các phương án dựa trên 4 rào cản: CORS, Authentication, Cloudflare/Anti-bot, và Rate Limit.
- Đề xuất ít nhất 2 phương án và chốt 1 phương án tối ưu nhất.

### Bước 3: Lập Bản vẽ thi công (Implementation Blueprint)
- Bắt buộc tạo Artifact `implementation_plan.md`.
- Đọc `MODULE_MAP.md` và `DATA_REGISTRY.md` để đối chiếu.
- Liệt kê Data Flow.
- Liệt kê chính xác các file sẽ Sửa/Tạo/Xóa (Kiểm tra file đang bao nhiêu dòng → nếu > 200 dòng thì TẠO FILE MỚI).

### Bước 4: Chờ Duyệt & Cập nhật sau khi Code
- **DỪNG LẠI HOÀN TOÀN.** Chờ người dùng "Duyệt" (Approve) mới được code.
- Sau khi code xong, LUÔN cập nhật lại `MODULE_MAP.md` và `DATA_REGISTRY.md`.
- Chạy lệnh: `npm --prefix frontend run build`.

### 5. CÁC ĐIỀU CẤM KỴ (KHÔNG BAO GIỜ)
- Nhồi code mới vào file đã > 200 dòng
- Xóa hoặc thay đổi chức năng Module 1 & Module 2
- Xóa/đổi tên columns trong database đã có
- Tạo code mà không đề xuất plan trước

---

## BẢO TỒN MODULES HIỆN CÓ

- **Module 1** (Settings & Business Info): KHÔNG thay đổi chức năng, chỉ được refactor/tách file
- **Module 2** (Google Stack Workflow): KHÔNG thay đổi chức năng, chỉ được refactor/tách file
- **Database schema**: KHÔNG xóa/đổi tên columns đã có, chỉ được thêm mới

---

## KHI CẦN ĐỌC SKILL

- Thiết kế tính năng tự động hóa, crawl data, tích hợp API → Đọc `.antigravity/skills/system-architect/SKILL.md`
- Tạo module mới → Đọc `.antigravity/skills/seo-module-builder/SKILL.md`
- Sửa bug → Đọc `.antigravity/skills/seo-bug-fixer/SKILL.md`
- Bất kỳ task nào → Đọc `.antigravity/skills/seo_vibe_rules/SKILL.md`
