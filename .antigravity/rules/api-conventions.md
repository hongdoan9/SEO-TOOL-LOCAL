# Quy chuẩn API Route Frontend ↔ Backend

1. **Cấu trúc URL chuẩn:**
   - Resource collection: `GET /api/<module-name>/:projectId`
   - Resource creation: `POST /api/<module-name>/:projectId`
   - Resource item action: `POST /api/<module-name>/:id/<action-name>`
   - Resource item deletion: `DELETE /api/<module-name>/:id`

2. **Quy tắc Khớp Route (Route Match Guarantee):**
   - Trước khi tạo hàm gọi API ở Frontend, AI BẮT BUỘC phải kiểm tra chính xác URL đã đăng ký ở Backend `server.js` hoặc `routes/`.
   - Tất cả tham số `:id` phải nằm nhất quán ở cùng vị trí giữa Frontend và Backend.
   - Khi tạo endpoint mới, backend phải hỗ trợ alias route nếu có khác biệt về thứ tự parameter để tránh lỗi HTTP 404.

3. **Safe JSON Parsing & Response Handling:**
   - Mọi dữ liệu JSON lưu trữ trong SQLite dạng TEXT (`keywords`, `assets`, `languages_data`, `step4_data`...) khi query ra BẮT BUỘC phải bọc trong try/catch safe JSON parse.
   - API response luôn trả về JSON có định dạng chuẩn:
     - Thành công: `{ success: true, data: ..., message: "..." }`
     - Thất bại: `{ success: false, error: "..." }` kèm HTTP Status Code phù hợp (400, 404, 500).
