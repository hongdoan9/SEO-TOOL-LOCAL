# QUY TẮC KIẾN TRÚC & QUY TRÌNH CODE (ARCHITECTURE RULES)

---

## 1. GIỚI HẠN DUNG LƯỢNG FILE (FILE SIZE LIMITS)
- **Tối đa 250 - 300 dòng code per file**.
- Không bao giờ gom toàn bộ ứng dụng vào 1 file duy nhất (`App.jsx` hoặc `server.js`).
- Khi một file vượt quá 250 dòng, bắt buộc phải tách nhỏ thành các Sub-components hoặc Utility modules.

---

## 2. CẤU TRÚC THƯ MỤC CHUẨN (FOLDER STRUCTURE)

### Backend (Node.js / Express):
```
backend/
├── src/
│   ├── config/           # DB, Google OAuth, OpenRouter configs
│   ├── controllers/      # Logic xử lý Request/Response cho từng Route
│   ├── services/         # Logic nghiệp vụ nặng (Google API, AI call, WP publishing)
│   ├── routes/           # Định tuyến API riêng cho từng module
│   ├── middlewares/      # Error handler, Auth check, Rate limit
│   └── utils/            # Helper functions, logger, formatters
├── scripts/              # Chứa các script kiểm tra (check_db.js, check_form.js...)
├── uploads/              # Local file uploads
├── server.js             # Mỏng nhẹ (< 40 dòng) khởi tạo Express app
└── package.json
```

### Frontend (React + Vite + Tailwind CSS):
```
frontend/src/
├── assets/               # Hình ảnh, biểu tượng, logo
├── components/
│   ├── common/           # Input, Button, Modal, Card, Badge, Tooltip...
│   ├── layout/           # Header, Sidebar, AppLayout, DynamicBreadcrumb...
│   └── ui/               # Custom UI System (GlassCard, StatusBadge...)
├── context/              # AppContext, UserContext, ProjectContext
├── modules/
│   ├── dashboard/        # View Dashboard
│   ├── settings/         # View Settings (OpenRouter, Google, WP keys)
│   ├── business-info/    # View Business Info (NAP, Bio, Company specs)
│   ├── google-stack/     # View Google Entity Stack Workflow
│   └── wp-editor/        # View WordPress Editor Component
├── services/             # Axios API calls (userApi, projectApi, stackApi...)
├── hooks/                # Custom React hooks (useProject, useStack...)
├── App.jsx               # File chính mỏng nhẹ (< 50 dòng)
├── main.jsx
└── index.css             # Tailwind v4 & Custom CSS Tokens
```

---

## 3. QUY CHUẨN THIẾT KẾ GIAO DIỆN (UI DESIGN SYSTEM)
- **Theme:** Sleek Dark Mode cao cấp. Background chính `#090d16` (Dark Navy/Slate), Card background `#131b2e`, Accent `#0ea5e9` (Sky Blue) & `#10b981` (Emerald Green).
- **Responsive:**
  - Thiết kế mượt trên màn hình Desktop (1920px), Laptop (1366px), và Tablet (1024px).
  - Sidebar có thể mở rộng / thu gọn mượt mà.
  - Sử dụng CSS Grid (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`) và Flexbox linh hoạt.
- **Performance:**
  - Dùng `React.memo`, `useCallback`, `useMemo` phù hợp để tránh re-render thừa.
  - Không nhồi State dư thừa vào Component cha.

---

## 4. QUY TRÌNH KHI THÊM MODULE MỚI (A -> B -> C -> D)
1. **Bước A (Sync Spec):** Đọc `PROJECT_SPEC.md` & `ARCHITECTURE_RULES.md`.
2. **Bước B (Modular Plan):** Tạo file plan mô tả rõ file mới sẽ tạo.
3. **Bước C (Atomic Coding):** Tạo file mới trong `src/modules/<module-name>/`.
4. **Bước D (Verify):** Khởi chạy `npm run dev` kiểm tra không bị lỗi.
