# Quy định Giới hạn Dung lượng File (File Size Limits)

Để đảm bảo hiệu suất, tránh lỗi trang trắng và giúp AI quản lý code dễ dàng:

1. **Giới hạn dòng code:**
   - Component React (Frontend): TỐI ĐA 250 - 300 dòng code per file.
   - API Controller / Route (Backend): TỐI ĐA 200 - 250 dòng code per file.
   - Component cha (`App.jsx`): TỐI ĐA 50 - 100 dòng (chỉ đóng vai trò Layout & Router).
   - Server entry (`server.js`): TỐI ĐA 50 dòng (chỉ chứa khởi tạo Express app và import routes).

2. **Quy định tách file khi vượt giới hạn:**
   - Khi bất kỳ file nào vượt quá 300 dòng, BẮT BUỘC phải tách nhỏ thành:
     - Sub-components trong `src/modules/<module-name>/components/`
     - Custom Hooks trong `src/hooks/`
     - Backend Controllers trong `backend/src/controllers/`
     - Backend Services trong `backend/src/services/`
