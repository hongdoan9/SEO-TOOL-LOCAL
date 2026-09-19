---
name: seo-vibe-rules
description: Quy trình vibe code chuẩn mực cho dự án Tool SEO NEW. Tự động kích hoạt để đồng bộ PROJECT_SPEC.md, bảo tồn Module 1 & 2 và áp dụng giới hạn file <= 300 dòng.
---

# Quy trình Vibe Code Chuẩn Dự án SEO Tool Local

Mỗi khi người dùng yêu cầu xây dựng thêm module, sửa lỗi hoặc nâng cấp dự án `Tool SEO NEW`, Agent BẮT BUỘC phải thực hiện các bước sau:

## 1. Đồng bộ Ngữ cảnh (Context Sync)
- Đọc file `PROJECT_SPEC.md` bằng `view_file` để nắm vững 10 yêu cầu ban đầu và các trường dữ liệu của Module 1 & Module 2.
- Đọc file `ARCHITECTURE_RULES.md` để ghi nhớ quy định cấu trúc file.

## 2. Bảo tồn Chức năng (Preserve Existing Modules)
- **TUYỆT ĐỐI KHÔNG** thay đổi logic hoặc làm mất tính năng của Module 1 (Settings & Business Info) và Module 2 (Google Entity Stack & WPEditor).
- Khi refactor code, chỉ được phép tách nhỏ file, giữ nguyên các API endpoint và các trường DB.

## 3. Tuân thủ Quy chuẩn Kiến trúc Modular
- Mỗi file không vượt quá **250 - 300 dòng code**.
- Frontend layout phải responsive, hỗ trợ thu gọn sidebar, sử dụng Tailwind CSS v4 với màu nền Slate Dark Premium (`#090d16`).
- Backend phải phân tách thành `routes`, `controllers`, `services`.

## 4. Xác minh (Verification)
- Sau khi hoàn thành code, chạy thử lệnh test/build để đảm bảo ứng dụng hoạt động mượt mà trước khi bàn giao.
