---
name: seo-module-builder
description: Quy trình chuẩn để tạo Module mới cho dự án SEO Tool Local. Tự động kích hoạt khi người dùng yêu cầu xây dựng module mới, thêm tính năng mới, hoặc mở rộng quy trình task SEO.
---

# Quy trình Xây dựng Module Mới (SEO Module Builder)

Skill này hướng dẫn chi tiết quy trình 4 bước để thêm một Module mới vào ứng dụng `SEO Tool Local` theo cơ chế Plug-and-Play mà không làm ảnh hưởng tới các Module 1 và 2 hiện có.

---

## 1. ĐỌC VÀ ĐỒNG BỘ NGUYÊN TẮC (CONTEXT SYNC)
Trước khi làm bất kỳ việc gì:
1. Đọc file quy tắc bảo tồn: `view_file` -> `.antigravity/rules/always-preserve-modules.md`
2. Đọc file giới hạn dung lượng: `view_file` -> `.antigravity/rules/file-size-limits.md`
3. Đọc kiến trúc DB hiện tại: `view_file` -> `.antigravity/skills/seo-module-builder/references/db-schema.md`
4. Đọc yêu cầu dự án: `view_file` -> `.antigravity/skills/seo-module-builder/references/project-spec.md`

---

## 2. QUY TRÌNH 4 BƯỚC TẠO MODULE (A -> B -> C -> D)

### Bước A: Thiết kế Kế hoạch (Implementation Plan)
Tạo file `implementation_plan.md` mô tả:
- Tên Module & Mục tiêu SEO.
- Các trường dữ liệu cần lưu (Database table/columns).
- Các API Endpoints cần tạo.
- Danh sách các component frontend sẽ tạo (mỗi file <= 250 dòng).

### Bước B: Tạo Cấu trúc Thư mục Frontend & Backend
Dùng `write_to_file` tạo cấu trúc theo mẫu:
- Frontend: `frontend/src/modules/<module-name>/index.jsx`
- Sub-components: `frontend/src/modules/<module-name>/components/...`
- Backend Route: `backend/src/routes/<module-name>.routes.js`
- Backend Controller: `backend/src/controllers/<module-name>.controller.js`

### Bước C: Đăng ký Router & State tự động
- Đăng ký API Route mới vào Backend Express app.
- Thêm tab mới vào `Sidebar.jsx`.
- Kết nối dữ liệu dự án (`selectedProject`) và `businessInfo` từ React Context.

### Bước D: Kiểm tra Tự động (Automated Verification)
1. Chạy `node .antigravity/skills/seo-module-builder/scripts/check-file-size.js` để đảm bảo không file nào vượt quá 300 dòng.
2. Chạy `node .antigravity/skills/seo-module-builder/scripts/validate-module.js` để kiểm tra tính toàn vẹn của Module mới.
3. Chạy `npm --prefix frontend run build` kiểm tra không có lỗi syntax/import.

---

## 3. THAM KHẢO CODE MẪU (TEMPLATES)
- Mẫu Component Frontend: `.antigravity/skills/seo-module-builder/examples/module-template.jsx`
- Mẫu Backend Route: `.antigravity/skills/seo-module-builder/examples/route-template.js`
