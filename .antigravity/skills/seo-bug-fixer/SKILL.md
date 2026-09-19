---
name: seo-bug-fixer
description: Quy trình phát hiện, chẩn đoán và khắc phục sự cố (bug) cho dự án SEO Tool. Tự động kích hoạt khi người dùng báo lỗi, trang trắng, lỗi HTTP 404, hoặc lỗi kết nối dữ liệu.
---

# Quy trình Sửa Lỗi Tự Động (SEO Bug Fixer)

Skill này hướng dẫn AI chẩn đoán chính xác nguyên nhân gốc rễ (Root Cause) trước khi sửa bất kỳ dòng code nào.

---

## 1. NGUYÊN TẮC CHẨN ĐOÁN LỖI (DIAGNOSIS PROTOCOL)
1. **Không đoán mò:** Bắt buộc đọc file log hoặc màn hình báo lỗi trước khi đưa ra nhận định.
2. **Kiểm tra 3 nguyên nhân phổ biến nhất:**
   - **Lỗi 1 (Missing Import):** Icon từ `lucide-react` hoặc component chưa được import (gây `ReferenceError`).
   - **Lỗi 2 (Missing Prop):** Component con nhận prop nhưng Component cha (`App.jsx`) quên truyền (gây dữ liệu rỗng hoặc crash).
   - **Lỗi 3 (Route Mismatch):** Frontend gọi URL `:id` ở giữa nhưng Backend đăng ký `:id` ở cuối (gây `HTTP 404`).

---

## 2. QUY TRÌNH KHI SỬA LỖI

### Bước 1: Kiểm tra Route Match
Chạy script kiểm tra sự khớp nối API route:
```bash
node .antigravity/skills/seo-bug-fixer/scripts/check-routes.js
```

### Bước 2: Kiểm tra Safe Fallbacks
Đảm bảo tất cả biến destructured từ props đều có safe fallbacks:
```javascript
const safeBiz = businessInfo || {};
const safeKeywords = stackKeywords || {};
const safeList = items || [];
```

### Bước 3: Sửa lỗi chính xác (Atomic Edit)
- Chỉ sửa đúng chỗ gây lỗi, không làm thay đổi các hàm/tính năng không liên quan.
- Sau khi sửa, chạy `npm --prefix frontend run build` để xác nhận thành công.
