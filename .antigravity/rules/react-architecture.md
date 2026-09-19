# Quy định Kiến trúc React & State Management

1. **Quản lý State:**
   - Dùng **React Context (`AppContext`)** hoặc local state tại từng Module.
   - KHÔNG gom toàn bộ state của tất cả module vào `App.jsx` rồi truyền prop-drilling xuống.
   - Mỗi Module mới phải tự quản lý state và gọi API độc lập.

2. **Cấu trúc Thư mục Module chuẩn:**
   ```
   frontend/src/modules/<module-name>/
   ├── index.jsx                # Entry point mỏng nhẹ của Module
   ├── components/              # Các sub-component nhỏ (< 250 dòng)
   ├── hooks/                   # Custom hooks riêng cho Module
   └── services/                # API calls riêng cho Module
   ```

3. **Cơ chế Safe Guards (Chống Trang Trắng):**
   - Mọi dữ liệu props truyền vào component hoặc đọc từ API BẮT BUỘC phải có default fallback (ví dụ: `businessInfo = {}`, `keywords = {}`, `stacks = []`).
   - Luôn sử dụng optional chaining (`data?.field`) khi truy cập object sâu.
   - Bọc ErrorBoundary cho từng Module để nếu 1 module lỗi thì các module khác vẫn hoạt động bình thường.
