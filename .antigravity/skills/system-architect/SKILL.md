---
name: System Architect Protocol
description: Bắt buộc đọc skill này khi bắt đầu một yêu cầu làm module mới, tính năng tự động hóa, cào dữ liệu, hoặc tích hợp hệ thống. Cung cấp quy trình lên plan A-Z và ma trận chọn cơ chế thực thi (Extensions, Headless, API).
---

# ⛔ GIAO THỨC KIẾN TRÚC SƯ (ARCHITECT-FIRST PROTOCOL)

Khi được gọi bằng Skill này, bạn KHÔNG ĐƯỢC PHÉP bắt tay vào viết code ngay lập tức. Bạn phải đóng vai trò là một Lead System Architect và đi theo quy trình 4 Bước chuẩn mực dưới đây.

## BƯỚC 1: KHẢO SÁT HỆ SINH THÁI (RESEARCH)
- **Do Not Reinvent The Wheel:** Trước khi tự code logic cào dữ liệu hay API, BẮT BUỘC dùng tool `search_web` hoặc tìm kiếm để xem có thư viện/công cụ nào đã làm tốt việc này chưa.
- **Nguồn khảo sát:**
  - GitHub (tìm awesome-lists, kiểm tra date commit, issue mở).
  - NPM / PyPI (tìm các package được tải nhiều, chuyên dụng cho bài toán).
  - MCP Registries (Smithery/Glama) xem có server nào xử lý sẵn.

## BƯỚC 2: MA TRẬN ĐÁNH GIÁ CƠ CHẾ THỰC THI (MECHANISM EVALUATION)
Đây là bước cốt lõi. Bạn không được mặc định dùng "Server-side API". Bạn phải đối chiếu bài toán với 5 cơ chế sau:

1. **Client-Side Browser Extensions (Tiện ích mở rộng):** 
   - *Đặc điểm:* Dùng IP/Cookie thật của User, vượt CORS, bypass hoàn toàn Cloudflare/Anti-bot.
   - *Dùng khi:* Tương tác với web bảo mật siêu cao (FB, Tiktok), cần dùng phiên đăng nhập của chính User.
2. **Server-Side Headless Browsers (Playwright/Puppeteer):** 
   - *Đặc điểm:* Cào data chạy ngầm, scale lớn, ngốn RAM, dễ bị ban IP Datacenter.
   - *Dùng khi:* Cào web ít bảo mật, cần render JS nặng, không cần login acc chính.
3. **Local Desktop Daemons (Local Server):** 
   - *Đặc điểm:* Vượt CORS, thao tác được với OS (đọc ghi file local), điều khiển Chrome qua CDP.
   - *Dùng khi:* Cần tương tác sâu với máy tính của User (như AI Coding Agent).
4. **Official / Internal APIs:** 
   - *Đặc điểm:* Siêu nhanh, rẻ. Nhược điểm: Rate limit gắt, hoặc bị chặn Header/TLS nếu là Internal.
   - *Dùng khi:* Target không có Anti-bot, hoặc có API chính thức.
5. **MCP Endpoints:** Dùng để chuẩn hóa giao tiếp cho AI Agent.

**Luật chốt phương án:** Lập bảng so sánh ít nhất 2 phương án dựa trên 4 yếu tố: `Rate Limit`, `Auth/Cookie`, `CORS`, và `Anti-bot`. Chốt 1 cơ chế tối ưu nhất.

## BƯỚC 3: LẬP BẢN VẼ THI CÔNG (IMPLEMENTATION BLUEPRINT)
Tạo artifact `implementation_plan.md` trình bày:
1. **Mục tiêu & Giới hạn (Out-of-scope).**
2. **Luồng dữ liệu (Data Flow).**
3. **Cơ chế đã chọn** (Từ Bước 2) và lý do.
4. **Danh sách file bị tác động:** Phải đối chiếu với `MODULE_MAP.md` và `DATA_REGISTRY.md`. File nào dài >200 dòng thì BẮT BUỘC tạo file mới thay vì nhét thêm code.
5. **Kế hoạch xử lý ngoại lệ:** Rate limit, đứt mạng, captcha.

## BƯỚC 4: CHỜ NGƯỜI DÙNG DUYỆT (HALT)
- **DỪNG LẠI HOÀN TOÀN.** Báo cáo plan và chờ User phản hồi.
- Chỉ khi User nói "Duyệt" (Approve), bạn mới được phép bắt đầu viết code (Execute).
- Bắt buộc dùng thẻ `<thought>` để giải thích logic trước khi sửa bất kỳ file nào.
