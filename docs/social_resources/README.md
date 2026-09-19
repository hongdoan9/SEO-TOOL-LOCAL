# 📚 KHO TÀI NGUYÊN & MÃ NGUỒN MỞ MẠNG XÃ HỘI (SOCIAL RESOURCES REPOSITORY)

Thư mục này lưu trữ toàn bộ link GitHub, tài liệu phân tích,selectors, và cơ chế đăng ký/điền profile của từng mạng xã hội (Social Media). Dữ liệu này được tích lũy để phục vụ cho Module 3 cũng như tái sử dụng cho các dự án Vibe Code / Automation sau này.

---

## Cấu trúc Thư mục

```
docs/social_resources/
├── README.md                      ← File tổng quan này
├── medium/                        ← Tài nguyên cho Medium
│   └── README.md
├── reddit/                        ← Tài nguyên cho Reddit
│   └── README.md
├── quora/                         ← Tài nguyên cho Quora
│   └── README.md
├── facebook/                      ← Tài nguyên cho Facebook
│   └── README.md
└── pinterest/                     ← Tài nguyên cho Pinterest
    └── README.md
```

---

## Quy tắc Lưu trữ Dữ liệu cho Mỗi Social

Trong mỗi thư mục của từng Social (ví dụ: `medium/README.md`), thông tin sẽ được cấu trúc theo 4 mục:
1. **Danh sách Repo GitHub Tham khảo:** Link, mô tả ngắn, cơ chế chính (Python/Playwright/Extension).
2. **Luồng Đăng ký & Tạo Profile (User Flow):** Các bước từ Sign-up -> OTP/Magic Link -> Edit Profile.
3. **Bộ chọn Cấu trúc HTML (Selectors & Schemas):** Các CSS Selectors/XPath cho Email, Username, Bio, Website, Avatar.
4. **Ghi chú Đặc thù & Anti-bot:** Nhận diện Captcha, Rate limit, Lưu ý Cookie.
