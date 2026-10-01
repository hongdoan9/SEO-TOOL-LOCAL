# 🗺️ MODULE MAP — Bản đồ tất cả Modules & Files

> **Cập nhật lần cuối:** 2026-07-28
> **Mục đích:** AI đọc file này để biết ngay file nào ở đâu, làm gì.
> **Quy tắc:** Mỗi khi thêm/xóa/đổi tên file → BẮT BUỘC cập nhật file này.

---

## Cấu trúc tổng quan

```
d:\Tool SEO NEW\
├── GEMINI.md                          ← Luật bắt buộc cho AI (auto-read)
├── PROJECT_SPEC.md                    ← Đặc tả dự án (source of truth)
├── ARCHITECTURE_RULES.md              ← Quy tắc kiến trúc
├── USER_GUIDE.md                      ← Sách hướng dẫn sử dụng & vận hành hệ thống
├── start.bat                          ← Script khởi chạy
├── run.vbs                            ← Chạy ẩn terminal
├── backend/                           ← Node.js + Express + SQLite
└── frontend/                          ← React + Vite + Tailwind CSS v4
```

---

## Backend

### Cấu trúc hiện tại

```
backend/
├── server.js              ← Mỏng nhẹ (< 30 dòng)
├── db.js                  ← Database connection + schema init (233 dòng)
├── .env                   ← Environment variables
├── seo_tool.db            ← SQLite database file
├── src/
│   ├── routes/            ← Route definitions per module
│   └── controllers/
│       └── google-stack/
│           ├── stack-crud.controller.js
│           ├── stack-assets.controller.js
│           ├── stack-images.controller.js   ← Controller upload & quản lý 12 Image + files
│           ├── stack-optimize.controller.js
│           ├── stack-sync.controller.js     ← Controller xử lý Đồng bộ Thư mục Drive
│           ├── stack-drive-upload.helper.js ← Helper tự động đẩy file đính kèm lên Drive
│           └── stack-language.controller.js
├── uploads/               ← File uploads (images, files) served statically
├── package.json
└── package-lock.json
```

### API Routes (35 routes — tất cả trong server.js)

#### Users & Projects
| Method | Route | Line | Chức năng |
|--------|-------|------|-----------|
| GET | `/api/users` | 33 | Lấy danh sách users |
| POST | `/api/users` | 43 | Tạo user mới |
| DELETE | `/api/users/:id` | 57 | Xóa user |
| GET | `/api/projects/:userId` | 70 | Lấy danh sách projects theo user |
| POST | `/api/projects` | 81 | Tạo project mới |
| DELETE | `/api/projects/:id` | 100 | Xóa project |

#### Settings (Module 1a)
| Method | Route | Line | Chức năng |
|--------|-------|------|-----------|
| GET | `/api/settings/:projectId` | 111 | Lấy settings theo project |
| POST | `/api/settings/:projectId` | 126 | Lưu settings |

#### Business Info (Module 1b)
| Method | Route | Line | Chức năng |
|--------|-------|------|-----------|
| GET | `/api/business-info/:projectId` | 143 | Lấy business info |
| POST | `/api/business-info/:projectId` | 183 | Lưu business info |

#### Google Stack — CRUD (Module 2)
| Method | Route | Line | Chức năng |
|--------|-------|------|-----------|
| GET | `/api/google-stacks/:projectId` | 225 | Lấy danh sách stacks |
| POST | `/api/google-stacks/:projectId` | 236 | Tạo stack mới |
| DELETE | `/api/google-stacks/:id` | 261 | Xóa stack |
| GET | `/api/google-stacks/detail/:id` | 272 | Lấy chi tiết 1 stack |
| POST | `/api/google-stacks/keywords/:id` | 289 | Lưu 39 keywords |
| POST | `/api/google-stacks/prep-check/:id` | — | Lưu PrepCheck data (checks, map URL, video) |

#### Google OAuth
| Method | Route | Line | Chức năng |
|--------|-------|------|-----------|
| GET | `/api/google/auth-url/:projectId` | 379 | Tạo URL xác thực Google |
| GET | `/api/google/callback` | 400 | Callback OAuth |
| GET | `/api/google/status/:projectId` | 428 | Kiểm tra trạng thái kết nối |

#### Google Stack — Assets (Module 2 - Step 3)
| Method | Route | Line | Chức năng |
|--------|-------|------|-----------|
| POST | `/api/google-stacks/run-assets/:id` | 445 | Tạo Drive/Sheet/Docs assets |
| POST | `/api/google-stacks/create-temp-templates/:id` | 605 | Tạo templates tạm |
| POST | `/api/google-stacks/assets-checked/:id` | 682 | Đánh dấu assets đã kiểm tra |
| POST | `/api/google-stacks/reset-assets/:id` | 708 | Reset assets |

#### Google Stack — Step 4 Files
| Method | Route | Line | Chức năng |
|--------|-------|------|-----------|
| GET | `/api/google-stacks/step4/:id` | 726 | Lấy dữ liệu step 4 |
| POST | `/api/google-stacks/step4/:id` | 803 | Lưu dữ liệu step 4 |
| POST | `/api/google-stacks/step4/upload-file/:id` | 818 | Upload file |
| POST | `/api/google-stacks/step4/upload-images/:id` | 894 | Upload images |
| POST | `/api/google-stacks/step4/sync-drive/:id` | 968 | Sync files lên Drive |

#### Google Stack — AI Optimization (Module 2 - Step 4)
| Method | Route | Line | Chức năng |
|--------|-------|------|-----------|
| POST | `/api/google-stacks/optimize-docs/:id` | 1191 | Tối ưu Google Docs với AI |
| POST | `/api/google-stacks/optimize-pdf/:id` | 1753 | Tối ưu PDF với AI |
| POST | `/api/google-stacks/optimize-sheet/:id` | 2034 | Tối ưu Sheet với AI |

#### Google Stack — Multi-Language
| Method | Route | Line | Chức năng |
|--------|-------|------|-----------|
| POST | `/api/google-stacks/translate-keys/:id` | 3864 | Dịch keywords 15 ngôn ngữ |
| POST | `/api/google-stacks/create-lang-assets/:id` | 3962 | Tạo assets đa ngôn ngữ |
| POST | `/api/google-stacks/clean-temp-assets/:id` | 4274 | Dọn dẹp assets tạm |
| POST | `/api/google-stacks/optimize-lang-assets/:id` | 4309 | Tối ưu assets ngôn ngữ |

#### System Tasks (Unified Task Engine)
| Method | Route | Chức năng |
|--------|-------|-----------|
| POST | `/api/system-tasks` | Tạo task mới cho bất kỳ module nào |
| GET | `/api/system-tasks/next-task` | Extension Worker lấy task kế tiếp |
| POST | `/api/system-tasks/report` | Extension Worker báo cáo kết quả thực thi |
| GET | `/api/system-tasks/project/:projectId` | Lấy danh sách task của dự án |
| DELETE | `/api/system-tasks/:id` | Xóa task |
| POST | `/api/system-tasks/clear-completed/:projectId` | Dọn dẹp các task đã xong |

#### System
| Method | Route | Line | Chức năng |
|--------|-------|------|-----------|
| POST | `/api/shutdown` | 5057 | Shutdown server |

#### Google Stack V2 (Queue & Stream)
| Method | Route | Line | Chức năng |
|--------|-------|------|-----------|
| POST | `/api/v2/google-stacks/queue/:id` | — | Đẩy job vào SQLite Queue |
| GET | `/api/v2/google-stacks/queue/status/:jobId` | — | Polling trạng thái job |
| POST | `/api/v2/google-stacks/stream/upload` | — | Stream trực tiếp Browser → Drive |

---

## Frontend

### Cấu trúc hiện tại (Đã Refactor Kiến trúc Context + Modules)

```
frontend/src/
├── App.jsx                            ← Main App Layout wrapper (50 dòng)
├── main.jsx                           ← Entry point React (Provider wrapper)
├── index.css                          ← Tailwind + CSS tokens
├── App.css                            ← Custom CSS
├── WPEditor.jsx                       ← WordPress Visual/Text editor
│
├── context/                           ← Global State Management
│   ├── AppProvider.jsx                ← Combine tất cả Providers
│   ├── NotificationContext.jsx        ← Toast notification state
│   ├── UserContext.jsx                ← User & Project selection state
│   └── ProjectDataContext.jsx         ← Global API data (Settings, Biz Info)
│
├── shared/
│   └── components/
│       ├── Modal.jsx                  ← Reusable Modal component
│       ├── TabNavigation.jsx          ← Reusable Tab navigation
│       ├── DropdownSelector.jsx       ← Custom dropdown with per-item delete button
│       └── TaskMonitorView.jsx        ← Universal Task Queue Monitor component
│
├── components/
│   ├── common/
│   │   └── Notification.jsx           ← UI for Toast
│   └── layout/
│       ├── Navbar.jsx                 ← Top navigation bar (dùng UserContext)
│       └── Sidebar.jsx               ← Left sidebar navigation
│
├── constants/
│   └── keywordFields.js               ← 39 keyword field definitions
│
├── modules/
│   ├── dashboard/
│   │   └── DashboardModule.jsx        ← Dashboard overview
│   │
│   ├── settings/
│   │   └── SettingsModule.jsx         ← API Keys config
│   │
│   ├── business-info/
│   │   ├── index.js
│   │   ├── BusinessInfoView.jsx       ← Orchestrator View
│   │   └── components/
│   │       ├── BusinessFields.jsx     ← Basic Info Fields
│   │       └── BusinessDynamicLists.jsx ← Phones, Addresses, NAP, Bio WPEditor
│   │
│   └── google-stack/
│       ├── index.js
│       ├── GoogleStackView.jsx        ← Orchestrator View
│       ├── stack.context.jsx          ← Stack-specific State Management
│       ├── stack.api.js               ← Stack API Calls
│       ├── stack.registry.js          ← Workflow Steps Definition
│       ├── components/
│       │   ├── StackOverview.jsx      ← List Stacks
│       │   ├── CreateStackModal.jsx   ← Create new Stack
│       │   ├── PrepImageUpload.jsx    ← Upload & Quản lý 12 Image (Prep Check)
│       │   ├── SyncedDriveLinksTable.jsx ← Bảng tổng hợp link sau khi Đồng bộ Drive
│       │   ├── ManualSectionUploads.jsx  ← Section 1 Upload Script, KML, Video
│       │   ├── ManualSectionLinks.jsx    ← Sections 2-9 Nhập link thủ công & hướng dẫn
│       │   └── OptimizedLinksTable.jsx   ← Bảng tổng hợp link đã tối ưu (Docs, PDF, Sheet, Slide, Form, Script, Video, KML)
│       └── steps/
│           ├── Step1PrepCheck.jsx     ← 1. Prep Check
│           ├── Step2Keywords.jsx      ← 2. 39 Keywords Table + Bulk paste
│           ├── Step3Assets.jsx        ← 3. Google Drive/Docs/Sheet integration (Highlight CSS LSI 5-14)
│           ├── Step4ManualAssets.jsx  ← 4. Tạo thủ công và nhập link (9 Sections)
│           ├── Step4Optimize.jsx      ← 5. Tối ưu tài sản Google (Docs, PDF, Sheet)
│           ├── Step6MultiLanguage.jsx ← 6. Dịch thuật & Đa ngôn ngữ (15 Quốc gia)
│           └── Step5WPEditor.jsx      ← 7. WP Editor
│
├── services/
│   └── api.js                         ← Axios instance setup
│
├── MODULE_MAP.md                      ← File này
└── DATA_REGISTRY.md                   ← Bản đồ dữ liệu
```

### Module Chi tiết

#### Module 1a: Settings
- **Directory:** `modules/settings/`
- **Chức năng:** Cấu hình OpenRouter API Key, Google OAuth, WordPress credentials
- **State:** Dùng ProjectDataContext
- **API:** GET/POST `/api/settings/:projectId`

#### Module 1b: Business Info
- **Directory:** `modules/business-info/`
- **Chức năng:** Form nhập thông tin doanh nghiệp, phones/addresses mảng động, NAP, 3 Bio WPEditor. Đã tách 2 component nhỏ `< 250 dòng`.
- **State:** Dùng ProjectDataContext
- **API:** GET/POST `/api/business-info/:projectId`

#### Module 2: Google Stack Workflow
- **Directory:** `modules/google-stack/`
- **Chức năng:** Workflow tạo Google Entity Stack với 7 steps tách rời.
- **State:** Dùng local `StackContext` kết hợp `ProjectDataContext`.
- **API:** `stack.api.js` (Tất cả API liên quan tới Google Stack)

#### Module 3: Profile Creation Workflow
- **Directory:** `modules/profile-creation/`
- **Chức năng:** Quản lý Hàng đợi tạo Profile Social tự động, Nạp Presets Schemas (Medium, Reddit, Quora, Pinterest, Tumblr, About.me) và Xuất Links (Export Profiles CSV/Clipboard).
- **API:** `profile.api.js` (`/api/profile-creation/*`, POST `/api/profile-creation/schemas/seed`)

#### Module 4: Instant Indexing Engine
- **Directory:** `modules/indexing/`
- **Chức năng:** Ép Google Search Console & Bing Webmaster lập chỉ mục (Index) hàng loạt URLs (Google Stacks, Social Profiles, bài viết Website).
- **API:** `indexing.api.js` (`/api/indexing/*`)

- **Extension:** Chrome Extension V3 trong `extension/` thực thi Human Typing & Auto-fill.

#### Dashboard
- **Directory:** `modules/dashboard/`
- **Chức năng:** Tổng quan dự án (dùng UserContext và ProjectDataContext).

---

## Config Files (.antigravity/)

```
.antigravity/
├── hooks.json                         ← Post-edit hook: check file size
├── rules/
│   ├── always-preserve-modules.md     ← Bảo tồn Module 1 & 2
│   ├── api-conventions.md             ← Chuẩn URL, JSON response
│   ├── file-size-limits.md            ← Max 300 dòng/file
│   └── react-architecture.md          ← Context, module structure
└── skills/
    ├── seo-bug-fixer/                 ← Skill sửa lỗi (3 bước)
    ├── seo-module-builder/            ← Skill tạo module mới (A→B→C→D)
    └── seo_vibe_rules/                ← Skill vibe code chuẩn
```
