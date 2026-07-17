# YowareTemplate SaaS 平台 — 系統架構與設計文件（SA&D）

**版本**：Phase 1 MVP  
**日期**：2026-07-17  
**適用專案**：`E:\Projects\YowareTemplate`（GitHub: `twmeric/YowareTemplate`）  
**部署網址**：`https://yowaretemplate.pages.dev`  
**語言**：繁體中文  

---

## 1. 系統概述（System Overview）

YowareTemplate 升級為一個「以資料驅動的**多模板自助建站平台**」：

- 前端：`React 18 + TypeScript + Vite 7 + Tailwind CSS 3`。
- 模板架構：所有模板統一內建於平台，每個模板為一個「模板套件（Template Package）」，註冊於 `src/templates/{slug}/` 與 D1 `templates` 表。
- 內容來源：每個模板對應 `public/data/content-{slug}.json`（或 D1 `template_content` 表），由 `AI Content Worker` 或 `/man/:slug` 自訂後台維護。`useContent(slug)` 已支援 fallback 到既有 `content.json`。
- 部署：所有模板隨主平台一起建置並部署到 Cloudflare Pages，不再獨立部署為外部 Pages 專案。
- 後台：`workers/admin-api-worker/` 提供密碼/JWT 驗證、GitHub API 讀寫、`R2` 媒體庫；`/manage` 與 `/man/:slug` 為隱藏後台入口，不得出現在公開導航。
- 自動內容：`workers/ai-content-worker/` 根據 `templateSlug` 選擇對應 prompt/schema，輸出該模板可渲染的內容。

**核心架構決策：統一內建模板**

- 所有模板都是平台內建的「模板套件」，不再獨立部署為外部 Pages 專案（根據母機守則 Rule 41）。
- 每個模板註冊於 D1 `templates` 表，欄位包含 `slug`、`name`、`preview_url`、`admin_url`、`wizard_schema`，未來可擴充 `template_type`、`adapter_config`。
- 每個模板對應 `E:\Projects\YowareTemplate\src\templates\{slug}\` 目錄，內含 `components/`、`schema.ts`、`adapter.ts`、`Preview.tsx`、`Admin.tsx`。
- 前端透過 **Template Registry / Resolver** 根據 `slug` 動態解析要載入的 Preview 與 Admin。

**Phase 1 MVP 目標**：在同一個專案與網域上，疊加一層「客戶導向的平台層」：

1. 平台首頁 `/`：介紹 SaaS 服務、收費模式、案例。
2. 模板市集 `/templates`：展示可選模板清單與預覽。
3. 需求表單 `/start/:slug`：引導客戶填寫品牌簡報。
4. 預覽頁面 `/pre/:slug`：透過 Template Registry 動態載入對應模板套件的 `Preview.tsx`。
5. 後台編輯 `/man/:slug`：透過 Template Registry 動態載入對應模板套件的 `Admin.tsx`（根據母機守則 Rule 43，不得出現在公開導航）。
6. 訂單提交：表單資料寫入 `Cloudflare D1`，並通知平台主理人。
7. 訂單審核：主理人在既有 `/manage` 後台檢視與標記訂單狀態。
8. 保留現有 `/manage` 後台與 AI 自動生成流程，並擴充為多模板輸出。

為了降低維護成本，Phase 1 會把「平台公開 API」獨立成一支新的 `workers/platform-api-worker/`，與既有 `admin-api-worker/` 分離職責；同時在 `admin-api-worker/` 增加訂單查詢/更新端點，讓 `/manage` 後台可直接審核訂單。

---

## 2. 元件圖（Component Diagram）

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                             客戶端瀏覽器                                    │
│  ┌──────────┐  ┌────────────┐  ┌─────────────┐  ┌──────────────────────┐   │
│  │ 平台首頁 │  │ /templates │  │ /start/:slug│  │ /pre/:slug 預覽      │   │
│  │    /     │  │ 模板市集   │  │ 需求表單    │  │ /man/:slug 後台編輯  │   │
│  └──────────┘  └────────────┘  └─────────────┘  └──────────────────────┘   │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  React SPA (Vite + Tailwind)                                          │  │
│  │  • src/pages/PlatformHome.tsx                                         │  │
│  │  • src/pages/TemplateGallery.tsx                                      │  │
│  │  • src/pages/BriefWizard.tsx                                          │  │
│  │  • src/pages/Admin.tsx (既有 /manage)                                 │  │
│  │  • src/templates/{slug}/Preview.tsx                                   │  │
│  │  • src/templates/{slug}/Admin.tsx                                     │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────┬─────────────────────────────────────────────┘
                                │ HTTPS / static assets
                                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      Cloudflare Pages (Static Hosting)                      │
│  dist/ → index.html, _redirects, _headers, /data/content-{slug}.json        │
└───────────────────────────────┬─────────────────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
        ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Platform API    │    │ Admin API       │    │ AI Content      │
│ Worker          │    │ Worker          │    │ Worker          │
│ (public)        │    │ (admin only)    │    │ (webhook +      │
│                 │    │                 │    │  /api/generate) │
└───────┬─────────┘    └────────┬────────┘    └────────┬────────┘
        │                       │                      │
        │ D1 binding            │ D1 binding           │ GitHub API / D1
        ▼                       ▼                      ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────────────┐
│ Cloudflare D1   │    │ Cloudflare R2   │    │ GitHub Repo             │
│ • templates     │    │ Media Bucket    │    │ twmeric/YowareTemplate  │
│ • template_     │    │ (read public,   │    │ • brief.txt             │
│   content       │    │  write admin)   │    │ • content-{slug}.json   │
│ • customers     │    │                 │    │                         │
│ • orders        │    └─────────────────┘    └─────────────────────────┘
│ • order_events  │
└─────────────────┘
        │
        │ notification
        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 外部通知服務（Resend / SendGrid / Mailgun / Cloudflare Email）                │
│ 訂單建立後發送郵件給平台主理人                                                  │
└─────────────────────────────────────────────────────────────────────────────┘

Template Registry / Resolver（前端靜態映射或動態 import）：
┌─────────────────────────────────────────────────────────────────────────────┐
│  Template Registry                                                          │
│  • landing-v1  →  src/templates/landing-v1/Preview.tsx + Admin.tsx          │
│  • tcm-v1      →  src/templates/tcm-v1/Preview.tsx + Admin.tsx              │
│  • future-x    →  src/templates/future-x/Preview.tsx + Admin.tsx            │
└─────────────────────────────────────────────────────────────────────────────┘

外部 AI / 圖片服務：
• DeepSeek AI（ai-content-worker 根據 templateSlug 選擇 prompt/schema）
• Pixabay（ai-content-worker 根據模板風格搜圖）
```

### 職責說明

| 元件 | 職責 | Phase 1 變動 |
|---|---|---|
| `Cloudflare Pages` | 託管 React 靜態資源、所有模板套件、SPA fallback、`_headers` 安全標頭 | 新增平台頁面路由；所有模板統一內建部署；`_redirects` 維持 `/manage/*` 與 `/man/*` fallback |
| `Template Registry` | 根據 `slug` 解析並載入對應模板套件的 `Preview.tsx` / `Admin.tsx` | **新增** |
| `Template Package` | 每個模板獨立套件：`components/`、`schema.ts`、`adapter.ts`、`Preview.tsx`、`Admin.tsx` | **新增**：`landing-v1`、`tcm-v1` |
| `Platform API Worker` | 公開 API：模板列表、模板詳情、提交訂單、發送通知 | **新增** |
| `Admin API Worker` | 管理 API：登入、讀寫 `content-{slug}.json`、R2 媒體、訂單審核 | 增加 D1 binding 與 `/api/orders*` 端點；支援多模板內容 |
| `AI Content Worker` | 根據 `templateSlug` 選擇對應 prompt/schema，輸出模板可渲染內容 | 擴充多模板輸出 |
| `Cloudflare D1` | 儲存 templates、template_content、customers、orders、order_events | **新增**；未來可用 `template_content` 表儲存每個模板實例內容 |
| `Cloudflare R2` | 客戶圖片與媒體庫 | **不變** |
| `GitHub Repo` | 原始碼與 `brief.txt`/`content-{slug}.json` 真相來源 | 改為多模板內容檔案 |

---

## 3. 資料流（Data Flow）

### 3.1 客戶旅程：瀏覽 → 選模板套件 → 預覽 → 填需求 → 提交訂單

```text
1. 客戶開啟 https://yowaretemplate.pages.dev/
   └─ Pages 回傳 React SPA（dist/index.html）。

2. React Router 判斷路徑為 `/`，渲染 PlatformHome。
   └─ 載入行銷文案與 CTA。

3. 客戶點擊「瀏覽模板」→ `/templates`。
   └─ 前端呼叫 GET https://<platform-worker>/api/templates
   └─ Platform API Worker 查詢 D1 `templates` 表，回傳啟用中的模板列表（含 slug、name、previewUrl、adminUrl）。

4. 客戶選擇模板 → `/pre/:slug`。
   └─ React Router 將 :slug 傳給 Template Registry。
   └─ Registry 解析 slug → 動態載入 src/templates/{slug}/Preview.tsx。
   └─ Preview.tsx 讀取 public/data/content-{slug}.json（或 D1 template_content）並渲染。

5. 客戶決定使用 → `/start/:slug`。
   └─ 前端呼叫 GET /api/templates/:slug 取得 wizard_schema（表單欄位）。
   └─ BriefWizard 動態渲染表單（聯絡資訊、品牌資料、產業、核心賣點、目標客群等）。

6. 客戶提交表單 → POST /api/orders
   └─ Platform API Worker：
      a. 用 Zod 驗證輸入（含 templateSlug）。
      b. 依 email 查詢或新建 `customers` 記錄。
      c. 新建 `orders` 記錄，status = `pending`。
      d. 寫入 `order_events`（event = `submitted`）。
      e. 呼叫外部 Email API 通知平台主理人。
   └─ 回傳 `{ orderId, publicId, status }`。

7. 前端顯示感謝頁 `/order-success/:publicId`。

8. 平台主理人收到通知郵件，內含連結 `/manage/orders?token=<jwt>`。
   └─ 進入既有 `/manage` 後台的「訂單管理」頁面。
   └─ Admin.tsx 呼叫 Admin API Worker 的 GET /api/orders 與 PATCH /api/orders/:id。
   └─ 主理人可標記為 `reviewing` / `accepted` / `rejected`，並填寫 `owner_notes`。

9. 主理人編輯特定模板內容 → 直接輸入 `/man/:slug`。
   └─ 根據母機守則 Rule 43，此連結不得出現在公開導航、sitemap 或 robots.txt。
   └─ Registry 載入 src/templates/{slug}/Admin.tsx。
   └─ Admin.tsx 讀寫 public/data/content-{slug}.json（或 D1 template_content）。
```

### 3.2 AI 內容生成流程（多模板輸出）

```text
開發者/客戶修改 brief.txt（可包含 templateSlug） → Push 到 GitHub
   → GitHub webhook → AI Content Worker
      → 解析 templateSlug（預設 landing-v1）
      → 根據 templateSlug 選擇對應 prompt / schema / adapter
      → 呼叫 DeepSeek → 搜尋 Pixabay 圖片
      → 輸出對應模板格式的內容（例如 landing-v1 的 SiteContent 或 tcm-v1 的 TcmContent）
      → 寫回 public/data/content-{slug}.json（或 D1 template_content） → Git commit
      → Cloudflare Pages 重新部署（Git 連動或 CI direct upload）
```

**通用內容中間層（長期目標）**

- Wizard 產生通用問卷答案（universal brief answers）。
- AI Worker 或 adapter 將通用答案轉換為模板專屬內容格式。
- 短期可先讓 AI 直接產出模板格式，未來再逐步抽象出通用中間層與 per-template adapter。

---

## 4. 資料庫綱要（Database Schema）

建議使用 **Cloudflare D1**（SQLite-compatible）。以下為 Phase 1 建議綱要，存放於 `workers/platform-api-worker/migrations/0001_init.sql`，並同時套用於 `admin-api-worker` 的 D1 binding。

```sql
-- 開啟外鍵約束
PRAGMA foreign_keys = ON;

-- 模板表：存放平台可選模板與表單欄位定義
CREATE TABLE IF NOT EXISTS templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,                 -- URL 用識別，例如 "landing-v1" / "tcm-v1"
  name TEXT NOT NULL,                        -- 模板名稱
  description TEXT,                          -- 簡短說明
  thumbnail_url TEXT,                        -- 縮圖 URL
  preview_url TEXT,                          -- 預覽連結（前台 /pre/:slug）
  admin_url TEXT,                            -- 後台編輯連結（/man/:slug），不對外公開
  template_type TEXT DEFAULT 'builtin',      -- builtin / external（未來擴充）
  adapter_config TEXT,                       -- JSON：adapter 與通用中間層設定（未來擴充）
  base_price INTEGER,                        -- 起價（最小單位，例如 HKD）
  currency TEXT DEFAULT 'HKD',
  wizard_schema TEXT NOT NULL,               -- JSON：表單欄位陣列
  is_active INTEGER DEFAULT 1,               -- 0 = 下架，1 = 上架
  is_featured INTEGER DEFAULT 0,             -- 0 = 一般，1 = 精選
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 客戶表：依 email 去重複，建立長期客戶檔案
CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  phone TEXT,
  whatsapp TEXT,
  preferred_contact TEXT DEFAULT 'email',    -- email / whatsapp / phone
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 訂單表：每一份需求提交
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  public_id TEXT NOT NULL UNIQUE,            -- 對外單號，例如 "YWT-20250717-XXXX"
  customer_id INTEGER NOT NULL,
  template_id INTEGER,
  status TEXT NOT NULL DEFAULT 'pending'     -- pending, reviewing, accepted, rejected, completed, cancelled
    CHECK (status IN ('pending','reviewing','accepted','rejected','completed','cancelled')),
  brief_answers TEXT NOT NULL,               -- JSON：表單答案
  owner_notes TEXT,                          -- 主理人內部備註
  quoted_amount INTEGER,                     -- 報價（最小單位）
  currency TEXT DEFAULT 'HKD',
  source_ip TEXT,
  user_agent TEXT,
  notification_sent_at TEXT,                 -- ISO 8601，記錄通知是否成功
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (template_id) REFERENCES templates(id)
);

-- 訂單事件表：審計記錄
CREATE TABLE IF NOT EXISTS order_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  event TEXT NOT NULL,                       -- submitted, notified, status_changed, note_added
  actor TEXT,                                -- customer / owner / system
  payload TEXT,                              -- JSON
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- 模板內容表（選用）：若未來改由 D1 儲存每個模板實例內容，而非 static JSON
CREATE TABLE IF NOT EXISTS template_content (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  template_id INTEGER NOT NULL,
  content_slug TEXT NOT NULL DEFAULT 'default',  -- 支援同一模板多個實例
  content_json TEXT NOT NULL,                    -- 模板專屬內容 JSON
  version INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (template_id) REFERENCES templates(id) ON DELETE CASCADE,
  UNIQUE(template_id, content_slug)
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_templates_slug ON templates(slug);
CREATE INDEX IF NOT EXISTS idx_templates_active ON templates(is_active);
CREATE INDEX IF NOT EXISTS idx_template_content_template ON template_content(template_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_events_order ON order_events(order_id);
```

### 4.1 欄位補充說明

- `admin_url`：後台編輯入口，例如 `/man/landing-v1`。根據母機守則 Rule 43，此連結僅供主理人內部使用，不得出現在公開導航、sitemap 或 robots.txt。
- `template_type`：預設 `builtin`（平台內建）。未來若開放第三方模板市集，可擴充為 `external` 或其他類型。
- `adapter_config`：JSON 物件，描述該模板如何將通用問卷答案轉換為模板專屬內容。例如：

```json
{
  "adapter": "landing-v1",
  "outputSchema": "SiteContent",
  "defaultSections": ["hero", "features", "testimonials", "contact"]
}
```

- `template_content` 表用途：
  - Phase 1 可先沿用 static JSON（`public/data/content-{slug}.json`），降低複雜度。
  - 當需要多實例、版本控制或即時編輯時，再將內容遷移至 D1 `template_content` 表。

- `wizard_schema` 範例：

```json
[
  { "name": "brandName", "type": "text", "label": "品牌名稱", "required": true },
  { "name": "industry", "type": "select", "label": "行業別", "options": ["餐飲", "零售", "服務", "其他"] },
  { "name": "keySellingPoints", "type": "textarea", "label": "核心賣點" },
  { "name": "targetAudience", "type": "text", "label": "目標客群" },
  { "name": "whatsapp", "type": "tel", "label": "WhatsApp 號碼" }
]
```

- `brief_answers` 範例：

```json
{
  "brandName": "日出咖啡",
  "industry": "餐飲",
  "keySellingPoints": "手沖咖啡、手工甜點、安靜空間",
  "targetAudience": "25-45 歲上班族",
  "whatsapp": "85298765432"
}
```

- `public_id` 建議格式：`YWT-{YYYYMMDD}-{4位亂數}`，例如 `YWT-20250717-A3K9`，方便客戶與主理人溝通。

---

## 5. API 端點（API Endpoints）

### 5.1 建議分工

| Worker | 存取層級 | 主要端點 |
|---|---|---|
| `platform-api-worker` | 公開（Public） | 模板列表、模板詳情、提交訂單、訂單狀態查詢 |
| `admin-api-worker` | 管理員（JWT） | 登入、多模板內容讀寫、媒體庫、訂單列表與審核 |
| `ai-content-worker` | 內部（webhook / admin） | 根據 `templateSlug` 生成對應模板內容 |

把公開與管理 API 分離，可減少對既有 `/manage` 後台的攻擊面，也讓未來針對公開 API 做速率限制與快取更靈活。

### 5.2 Platform API Worker（公開）

Base URL 建議：`https://jkd-platform-api-worker.<your-account>.workers.dev`

| 方法 | 路徑 | 說明 | 認證 |
|---|---|---|---|
| GET | `/` | Health check | 無 |
| GET | `/api/templates` | 取得上架模板列表（不含完整 `wizard_schema` 細節，可選摘要） | 無 |
| GET | `/api/templates/:slug` | 取得單一模板詳細資料、完整 `wizard_schema` 與 `adminUrl` | 無 |
| POST | `/api/orders` | 提交訂單（含 `templateSlug`） | 無（需 rate limit + Honeypot） |
| GET | `/api/orders/:publicId/status` | 查詢訂單公開狀態 | 無 |

#### POST /api/orders 請求範例

```json
{
  "templateSlug": "landing-v1",
  "customer": {
    "name": "陳先生",
    "email": "customer@example.com",
    "phone": "98765432",
    "whatsapp": "85298765432",
    "preferredContact": "whatsapp"
  },
  "answers": {
    "brandName": "日出咖啡",
    "industry": "餐飲",
    "keySellingPoints": "手沖咖啡、手工甜點",
    "targetAudience": "25-45 歲上班族",
    "referenceLinks": "https://instagram.com/sunrisebrew"
  },
  "metadata": {
    "utmSource": "homepage"
  }
}
```

#### POST /api/orders 成功回應範例

```json
{
  "success": true,
  "orderId": 42,
  "publicId": "YWT-20250717-A3K9",
  "status": "pending",
  "message": "需求已收到，我們會盡快與你聯繫。"
}
```

#### GET /api/templates 回應範例

```json
{
  "success": true,
  "templates": [
    {
      "slug": "landing-v1",
      "name": "日出咖啡風格 Landing",
      "description": "溫暖文青風格，適合咖啡廳、手作烘焙品牌",
      "thumbnailUrl": "https://pub-xxx.r2.dev/templates/landing-v1-thumb.jpg",
      "previewUrl": "https://yowaretemplate.pages.dev/pre/landing-v1",
      "adminUrl": "https://yowaretemplate.pages.dev/man/landing-v1",
      "templateType": "builtin",
      "basePrice": 2880,
      "currency": "HKD",
      "isFeatured": true
    },
    {
      "slug": "tcm-v1",
      "name": "明德中醫 TCM Clinic",
      "description": "專業中醫診所風格，適合醫療與健康服務",
      "thumbnailUrl": "https://pub-xxx.r2.dev/templates/tcm-v1-thumb.jpg",
      "previewUrl": "https://yowaretemplate.pages.dev/pre/tcm-v1",
      "adminUrl": "https://yowaretemplate.pages.dev/man/tcm-v1",
      "templateType": "builtin",
      "basePrice": 3880,
      "currency": "HKD",
      "isFeatured": false
    }
  ]
}
```

### 5.3 Admin API Worker（管理員）— 擴充

Base URL 目前為：`https://jkd-admin-api-worker.jimsbond007.workers.dev`

建議在 `admin-api-worker/index.ts` 中新增以下端點，並沿用現有 JWT 驗證機制。

| 方法 | 路徑 | 說明 | 認證 |
|---|---|---|---|
| GET | `/api/orders` | 取得訂單列表，可帶 `?status=pending` 篩選 | JWT |
| GET | `/api/orders/:id` | 取得單一訂單詳情 | JWT |
| PATCH | `/api/orders/:id` | 更新訂單 `status` 與 `owner_notes` | JWT |
| POST | `/api/orders/:id/notify` | 手動重發通知（可選） | JWT |

#### GET /api/orders 回應範例

```json
{
  "success": true,
  "orders": [
    {
      "id": 42,
      "publicId": "YWT-20250717-A3K9",
      "status": "pending",
      "customer": {
        "name": "陳先生",
        "email": "customer@example.com",
        "whatsapp": "85298765432"
      },
      "template": {
        "slug": "landing-v1",
        "name": "日出咖啡風格 Landing"
      },
      "briefAnswers": { "brandName": "日出咖啡", ... },
      "ownerNotes": null,
      "createdAt": "2026-07-17T07:33:14.000Z"
    }
  ]
}
```

#### PATCH /api/orders/:id 請求範例

```json
{
  "status": "accepted",
  "ownerNotes": "已確認報價，準備進入設計階段。"
}
```

### 5.4 AI Content Worker（內部）— 多模板輸出

Base URL 目前為：`https://jkd-ai-content-worker.jimsbond007.workers.dev`

AI Content Worker 除了接收 GitHub webhook 外，可擴充一個內部端點，根據 `templateSlug` 輸出對應模板內容：

| 方法 | 路徑 | 說明 | 認證 |
|---|---|---|---|
| POST | `/api/generate` | 根據 `templateSlug` 與 brief 生成對應模板內容 | Admin API JWT 或內部 secret |

#### POST /api/generate 請求範例

```json
{
  "templateSlug": "tcm-v1",
  "brief": {
    "brandName": "明德中醫",
    "industry": "中醫診所",
    "keySellingPoints": "針灸、推拿、中藥調理",
    "targetAudience": "25-55 歲上班族與長者"
  }
}
```

#### POST /api/generate 回應範例

```json
{
  "success": true,
  "templateSlug": "tcm-v1",
  "content": {
    "hero": { "title": "明德中醫 — 調和身心", "subtitle": "..." },
    "services": [ ... ],
    "contact": { ... }
  }
}
```

根據母機守則 Rule 47，所有回應必須為 UTF-8 JSON，`Content-Type: application/json; charset=utf-8`。

---

## 6. 安全考量（Security Considerations）

### 6.1 管理後台隱藏

根據母機守則 Rule 43，所有管理後台入口不得出現在公開導航：

- `/manage` 與 `/man/:slug` 不應出現在首頁導覽、頁腳、sitemap、robots.txt 連結中；僅主理人知道網址。
- 登入表單需要強密碼，由 `ADMIN_PASSWORD` Wrangler secret 控制。
- JWT 使用 `HS256` 簽署，secret 儲存於 `ADMIN_TOKEN_SECRET`，長度建議 ≥ 32 bytes。
- Token 有效期：登入 24 小時；自動登入連結可設 7 天（`/api/generate-token`）。
- 未來可考慮在 `Admin.tsx` 加入簡單的「閒置 30 分鐘自動登出」。

### 6.1a 多模板後台權限

- `/man/:slug` 必須沿用與 `/manage` 相同的認證機制（JWT 或 demo 密碼）。
- Registry 在載入 `Admin.tsx` 前應先檢查登入狀態，未登入者導向 `/login`。
- 每個模板套件的 `Admin.tsx` 讀寫內容時，需確保只能操作自己對應的 `content-{slug}.json`（或 D1 `template_content` 中對應 `template_id` 的記錄），避免跨模板資料汙染。

### 6.2 CORS 設定

目前 `admin-api-worker` 使用 `Access-Control-Allow-Origin: *`，建議 Phase 1 調整為**只允許平台網域**與開發環境：

```ts
const ALLOWED_ORIGINS = [
  "https://yowaretemplate.pages.dev",
  "https://www.yowaretemplate.com",   // 未來自訂網域
  "http://localhost:5173",             // 本機開發
];
```

`platform-api-worker` 同樣只允許上述來源，避免第三方網站任意呼叫 `/api/orders`。

### 6.3 Secret 管理

所有敏感資料必須透過 `wrangler secret put` 設定，**不得寫入程式碼或 `wrangler.toml`**：

| Secret | 用途 |
|---|---|
| `ADMIN_PASSWORD` | `/manage` 登入密碼 |
| `ADMIN_TOKEN_SECRET` | 簽署 JWT |
| `GITHUB_TOKEN` | Admin / AI Worker 讀寫 GitHub repo |
| `DEEPSEEK_API_KEY` | AI Worker 呼叫 DeepSeek |
| `PIXABAY_API_KEY` | AI Worker 搜尋圖片 |
| `GITHUB_WEBHOOK_SECRET` | 驗證 GitHub webhook 簽章 |
| `OWNER_EMAIL` | 訂單通知收件人 |
| `EMAIL_API_KEY` | Resend / SendGrid / Mailgun API key |

非敏感變數（如 `GITHUB_REPO`、`MEDIA_PUBLIC_URL`、`PLATFORM_ORIGIN`）可放在 `wrangler.toml` 的 `[vars]`。

### 6.4 管理 API URL 不再寫死

目前 `src/api/admin.ts` 與 `src/api/media.ts` 的 `ADMIN_API_URL` 寫死為 `https://jkd-admin-api-worker.jimsbond007.workers.dev`。Phase 1 應改為：

```ts
const ADMIN_API_URL = import.meta.env.VITE_ADMIN_API_URL 
  || "https://jkd-admin-api-worker.jimsbond007.workers.dev";
```

並在 Pages 建置環境變數（或本地 `.env`）設定 `VITE_ADMIN_API_URL`。

同樣地，Platform API URL 應透過 `VITE_PLATFORM_API_URL` 注入。

### 6.5 速率限制與濫用防護

- 對 `POST /api/orders` 實施速率限制：
  - 使用 Cloudflare WAF Rate Limiting Rule：每 IP 每分鐘最多 5 次。
  - Worker 內部再增加簡單記憶體型 rate limit（例如 5 分鐘內同 IP 最多 3 筆），作為第二層防護。
- 在表單加入 Honeypot 欄位（例如 `website` 隱藏欄位），若被填寫則視為垃圾提交。
- 對所有輸入使用 **Zod** 驗證，拒絕超長字串與非法格式。

### 6.6 資料庫安全

- 所有 D1 查詢使用**參數化查詢**，避免 SQL injection：

```ts
const stmt = env.DB.prepare(
  "SELECT * FROM orders WHERE public_id = ?"
).bind(publicId);
const result = await stmt.first();
```

- D1 只透過 Worker binding 存取，不對外暴露。
- 敏感欄位（如客戶電話、WhatsApp）未來可考慮加密儲存；Phase 1 先以權限控管為主。

### 6.7 檔案上傳安全

沿用現有 Admin API 規則：

- 僅允許 `image/jpeg`、`image/png`、`image/webp`、`image/gif`。
- 單檔上限 10 MB。
- 前端已做智慧壓縮，Worker 端仍需檢查 `content-type` 與檔案大小。
- R2 key 使用隨機名稱，避免覆蓋。

### 6.8 靜態網站安全標頭

`public/_headers` 已包含基本標頭。Phase 1 可補上 CSP（Content-Security-Policy）限制外部腳本：

```text
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' https: data:; connect-src 'self' https://*.workers.dev;
```

> 注意：若使用外部字型或分析工具，需相應調整 CSP。

---

## 7. 部署架構（Deployment Architecture）

根據母機守則 Rule 41，所有模板統一內建於主平台，不再獨立部署為外部 Pages 專案。

```text
                      GitHub Repo
                    (twmeric/YowareTemplate)
                           │
           ┌───────────────┼───────────────┐
           │               │               │
           ▼               ▼               ▼
   Cloudflare Pages    AI Content     Admin API
   (Static Hosting)    Worker         Worker
   yowaretemplate.     (webhook +     (JWT + R2 + D1)
   pages.dev            /api/generate)
   │  內建所有模板套件    │               │
   │  /pre/:slug         │               │
   │  /man/:slug         │               │
   │  / /templates       │               │
   │  /start/:slug       │               │
   │  /manage            │               │
           │                              │
           │                              │
           ▼                              ▼
        React SPA +                 Platform API
        Template Registry           Worker
        src/templates/              (public + D1)
        • landing-v1/                    │
        • tcm-v1/                        │
        • ...                            ▼
                               Cloudflare D1
                               Cloudflare R2
                               Email Service
```

### 7.1 各層說明

| 層級 | 服務 | 設定重點 |
|---|---|---|
| **靜態託管** | Cloudflare Pages | Build command: `pnpm run build`；Output directory: `dist`；`_redirects` 已設定 SPA fallback；所有模板套件隨主平台一起建置。 |
| **模板套件** | `src/templates/{slug}/` | 每個模板包含 `Preview.tsx`、`Admin.tsx`、`components/`、`schema.ts`、`adapter.ts`，與主平台一起打包。 |
| **公開 API** | `platform-api-worker` | 在 `wrangler.toml` 綁定 D1 database；設定 `[vars]` 與 secrets。 |
| **管理 API** | `admin-api-worker` | 在 `wrangler.toml` 增加 D1 binding；保留 R2 binding；設定 secrets；支援多模板內容讀寫。 |
| **內容生成** | `ai-content-worker` | 根據 `templateSlug` 選擇 prompt/schema；可擴充 `/api/generate` 端點。 |
| **資料庫** | Cloudflare D1 | 建立 `yowaretemplate-db`，同時綁定到 platform 與 admin worker。 |
| **物件儲存** | Cloudflare R2 | 既有 bucket `jkd-media-yowaretemplate`，啟用 public dev URL。 |
| **域名** | Pages 預設網域 | 未來可綁定自訂網域，並在 CORS allowlist 中加入。 |

### 7.1a 移除外部獨立部署

- 原本計畫將 `cf-spa-kv-cms`（明德中醫 TCM Clinic）獨立部署為外部 Pages 專案，現已決定**移植進主平台**作為內建模板 `tcm-v1`。
- 所有模板的路由（`/pre/:slug`、`/man/:slug`）、內容檔案（`content-{slug}.json`）、組件與後台編輯器，都隨主平台一起建置與部署。
- 未來不會為單一模板建立獨立 Cloudflare Pages 專案；Phase 2 自動開站將在同一平台架構下產生新的客戶網站實例。

### 7.2 Wrangler 設定範例

#### `workers/platform-api-worker/wrangler.toml`

```toml
name = "jkd-platform-api-worker"
main = "index.ts"
compatibility_date = "2024-01-01"

[vars]
PLATFORM_ORIGIN = "https://yowaretemplate.pages.dev"
OWNER_EMAIL = "owner@example.com"
EMAIL_FROM = "noreply@yowaretemplate.com"

[[d1_databases]]
binding = "DB"
database_name = "yowaretemplate-db"
database_id = "<your-database-id>"

# Secrets:
# wrangler secret put EMAIL_API_KEY
```

#### `workers/admin-api-worker/wrangler.toml`（擴充）

```toml
name = "jkd-admin-api-worker"
main = "index.ts"
compatibility_date = "2024-01-01"

[vars]
GITHUB_REPO = "twmeric/YowareTemplate"
MEDIA_BUCKET_NAME = "jkd-media-yowaretemplate"
MEDIA_PUBLIC_URL = "https://pub-1424891a0bc54b758dea83d25b65a5d9.r2.dev"

[[r2_buckets]]
bucket_name = "jkd-media-yowaretemplate"
binding = "MEDIA_BUCKET"

[[d1_databases]]
binding = "DB"
database_name = "yowaretemplate-db"
database_id = "<your-database-id>"

# Secrets:
# wrangler secret put ADMIN_PASSWORD
# wrangler secret put ADMIN_TOKEN_SECRET
# wrangler secret put GITHUB_TOKEN
```

---

## 8. Phase 1 實作計畫（Implementation Plan）

以下為建議的執行順序，可拆成 1～2 個 sprint。

### Sprint 1：基礎建設、Template Registry 與後端 API

| # | 任務 | 說明 | 驗收標準 |
|---|---|---|---|
| 1 | **新增依賴** | 根專案安裝 `react-router-dom`（或決定使用自製 router）；`platform-api-worker` 安裝 `zod` 與 `@cloudflare/workers-types`。 | `package.json` 更新，`pnpm install` 成功。 |
| 2 | **建立 D1 資料庫** | 執行 `wrangler d1 create yowaretemplate-db`；取得 `database_id`。 | 在 Cloudflare dashboard 看到資料庫。 |
| 3 | **更新 D1 migration** | 將第 4 節 SQL（含 `admin_url`、`template_type`、`adapter_config`、`template_content` 表）存成 `workers/platform-api-worker/migrations/0001_init.sql`，並用 `wrangler d1 migrations apply` 套用。 | 表與索引成功建立；`landing-v1` 與 `tcm-v1` 種子資料插入 `templates` 表。 |
| 4 | **新增 Platform API Worker** | 建立 `workers/platform-api-worker/`：`index.ts`、路由、D1 helper、通知邏輯。 | `wrangler dev` 能啟動，`GET /api/templates` 回傳測試資料。 |
| 5 | **實作公開端點** | 完成 `GET /api/templates`、`GET /api/templates/:slug`、`POST /api/orders`、`GET /api/orders/:publicId/status`。回應包含 `previewUrl`、`adminUrl`、`templateType`。 | 使用 curl/Postman 測試通過，資料正確寫入 D1。 |
| 6 | **訂單通知** | 在 `POST /api/orders` 成功後，透過 Email API 發送通知給 `OWNER_EMAIL`。 | 收到測試訂單郵件。 |
| 7 | **建立 Template Registry** | 建立 `src/templates/registry.ts`（或動態 import helper），根據 `slug` 映射到 `Preview.tsx` / `Admin.tsx`。 | `/pre/landing-v1` 與 `/pre/tcm-v1` 能正確載入不同套件。 |
| 8 | **重構 landing-v1 為模板套件** | 將既有 `src/pages/LandingPreview.tsx` 與 `src/pages/Admin.tsx` 的 landing-v1 邏輯，遷移至 `src/templates/landing-v1/`：`Preview.tsx`、`Admin.tsx`、`schema.ts`、`adapter.ts`、`components/`。 | 既有 `/` 與 `/manage` 功能不變；檔案路徑符合新規範。 |
| 9 | **移植 tcm-v1 模板套件** | 將 `cf-spa-kv-cms`（明德中醫 TCM Clinic）的 11 個內容 JSON 與 11 個專屬組件，移植為 `src/templates/tcm-v1/`：`Preview.tsx`、`Admin.tsx`、`schema.ts`、`adapter.ts`、`components/`；內容檔案改為 `public/data/content-tcm-v1.json`。 | `/pre/tcm-v1` 可正確渲染；`/man/tcm-v1` 可編輯內容。 |
| 10 | **擴充 AI Worker 支援多模板輸出** | 在 `workers/ai-content-worker/` 新增 per-template prompt/schema 選擇邏輯；支援 `templateSlug` 參數。 | 呼叫 AI Worker 產生 `landing-v1` 與 `tcm-v1` 內容格式皆正確。 |

### Sprint 2：前台頁面、預覽/後台路由與訂單審核

| # | 任務 | 說明 | 驗收標準 |
|---|---|---|---|
| 11 | **重構前端路由** | 修改 `src/App.tsx`，引入 router；保留 `/manage` → `Admin`；新增 `/templates`、`/start/:slug`、`/pre/:slug`、`/man/:slug` 路由。 | 所有路由可正常切換；`/man/:slug` 需登入。 |
| 12 | **平台首頁** | 建立 `src/pages/PlatformHome.tsx`：價值主張、CTA、精選模板。 | 視覺與文案符合品牌。 |
| 13 | **模板市集頁** | 建立 `src/pages/TemplateGallery.tsx`，呼叫 `/api/templates`。 | 正確渲染模板卡片（含 landing-v1、tcm-v1）。 |
| 14 | **預覽頁面** | 建立 `src/pages/TemplatePreview.tsx`，透過 Template Registry 載入對應 `Preview.tsx`。 | `/pre/landing-v1` 與 `/pre/tcm-v1` 正確渲染。 |
| 15 | **需求表單頁** | 建立 `src/pages/BriefWizard.tsx`，依 `wizard_schema` 動態產生表單，提交到 `/api/orders`。 | 表單驗證、提交、成功頁流程順暢。 |
| 16 | **Admin API 擴充訂單端點** | 在 `admin-api-worker/index.ts` 增加 D1 binding 與 `/api/orders*`；支援多模板內容讀寫。 | JWT 驗證通過後可取回訂單與內容。 |
| 17 | **後台訂單管理 UI** | 在 `src/pages/Admin.tsx` 新增「訂單管理」分頁：列表、詳情、狀態更新。 | 主理人可接受/拒絕訂單。 |
| 18 | **Admin API URL 環境化** | 修改 `src/api/admin.ts` 與 `src/api/media.ts`，改為 `import.meta.env.VITE_ADMIN_API_URL`。 | 本地與生產環境都能正確指向 worker。 |
| 19 | **設定 Pages 環境變數** | 在 Cloudflare Pages 專案設定 `VITE_ADMIN_API_URL`、`VITE_PLATFORM_API_URL`、`VITE_AI_API_URL`。 | 建置後網站能正確呼叫 API。 |
| 20 | **部署與測試** | 部署 platform-api-worker、admin-api-worker、ai-content-worker、Pages；執行端到端測試。 | 客戶旅程與多模板預覽/編輯完整跑通，訂單通知收到。 |
| 21 | **安全加固** | 調整 CORS allowlist、設定 WAF rate limit、補 CSP、檢查所有 secret 未洩漏；確認 `/man/:slug` 未出現在公開導航。 | 掃描無敏感字串提交到 git；Rule 43 檢查清單通過。 |

### 建議開發指令

```bash
# 1. 安裝根專案依賴
pnpm add react-router-dom
pnpm add -D @types/react-router-dom   # 若 TypeScript 需要

# 2. 建立 Platform Worker
mkdir workers/platform-api-worker
cd workers/platform-api-worker
pnpm init
pnpm add -D wrangler typescript @cloudflare/workers-types zod

# 3. 建立 D1 與 migration
wrangler d1 create yowaretemplate-db
wrangler d1 migrations create yowaretemplate-db init
# 編輯 migrations/0001_init.sql 後套用
wrangler d1 migrations apply yowaretemplate-db --local
wrangler d1 migrations apply yowaretemplate-db

# 4. 本地開發
pnpm run dev                    # 前台
wrangler dev                    # Platform Worker
wrangler dev                    # Admin Worker（在各自目錄）

# 5. 部署
wrangler deploy                 # Platform Worker
wrangler deploy                 # Admin Worker
pnpm run build && wrangler pages deploy dist   # Pages Direct Upload
```

---

## 9. 未來架構（Future Architecture）— Phase 2 自動開通

Phase 1 只做到「提交訂單 + 人工審核 + 多模板預覽/編輯」。Phase 2 的目標是當主理人將訂單標記為 `accepted` 後，系統**根據訂單選擇的模板類型，自動產生對應內容並開通一個全新的客戶網站**。

### 9.1 目標流程

```text
主理人接受訂單（status = accepted，含 templateSlug）
   ↓
Orchestrator Worker / Durable Object 啟動開通流程
   ↓
1. 根據 templateSlug 選擇對應 Template Package 與 adapter
2. 將訂單 answers 經 adapter 轉換為模板專屬 brief.txt / content.json
3. 從 twmeric/YowareTemplate 建立新 GitHub repo（Use this template API）
4. 將對應模板套件與產生的內容 commit 到新 repo
5. 在新 repo 設定 GitHub Secrets（ADMIN_PASSWORD, ADMIN_TOKEN_SECRET, ...）
6. 建立 Cloudflare Pages 專案並連結新 repo
7. 建立專屬 R2 bucket 與 public URL
8. 更新 wrangler.toml / Pages 環境變數
9. 觸發首次部署
10. 產生 /man/:slug 自動登入 token（根據母機守則 Rule 43，不對外公開）
11. 發送「你的網站已就緒」郵件給客戶
12. 回寫 D1 `sites` 表，status = live
```

### 9.2 新增資料表（Phase 2）

```sql
CREATE TABLE sites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL UNIQUE,
  customer_id INTEGER NOT NULL,
  repo_name TEXT NOT NULL,                -- 例如 "yoware-sunrise-brew"
  pages_project_name TEXT,
  pages_domain TEXT,                      -- 預設 pages.dev 網域
  custom_domain TEXT,
  r2_bucket_name TEXT,
  admin_worker_url TEXT,
  live_url TEXT,
  status TEXT DEFAULT 'provisioning'      -- provisioning, live, suspended, archived
    CHECK (status IN ('provisioning','live','suspended','archived')),
  provisioning_logs TEXT,                 -- JSON 陣列
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);
```

### 9.3 架構調整重點

| 調整 | 說明 |
|---|---|
| **Orchestrator Worker** | 新的 Worker 負責長流程協調，可搭配 Cloudflare Durable Objects 保持狀態，或 Cloudflare Queues 做任務佇列。 |
| **通用內容中間層** | 將 Wizard 通用答案透過 per-template `adapter.ts` 轉換為各模板專屬內容；AI Worker 統一輸出通用中間層或模板格式。 |
| **模板類型感知部署** | Orchestrator 根據 `templateSlug` 與 `template_type` 決定複製哪些模板套件、產生何種內容檔案。 |
| **Admin API 多租戶化** | 目前 admin worker 針對單一 repo。Phase 2 需讓 Admin API 能依 `site` 或 `repo` 參數讀寫不同 repo 的 `content-{slug}.json`，或為每個客戶獨立部署一支 admin worker。 |
| **DNS 自動化** | 透過 Cloudflare API 為 `custom_domain` 建立 CNAME / A 記錄，並在 Pages 設定自訂網域。 |
| **計費與訂閱** | 新增 `subscriptions` 表，記錄付款狀態、週期、到期日，可串接 Stripe / PayPal。 |
| **監控** | 使用 Workers Logs / Tail、Pages Analytics、D1 Analytics 追蹤錯誤與效能。 |

### 9.4 Phase 3：模板市集（Template Marketplace）

- 開放第三方模板遵循同一套 **Template Package 規範** 上架：
  - 套件目錄結構：`components/`、`schema.ts`、`adapter.ts`、`Preview.tsx`、`Admin.tsx`。
  - 註冊資訊：`slug`、`name`、`preview_url`、`admin_url`、`wizard_schema`、`template_type`、`adapter_config`。
- 平台提供 Template Registry 與通用中間層，讓第三方模板只需專注於 UI 與 adapter。
- 審核機制：上架前由平台主理人審核模板品質與安全性，避免惡意程式碼注入。
- 收益分配：可透過 `subscriptions` 或 `template_licenses` 表記錄模板使用與分潤。

### 9.5 技術選項比較

| 方案 | 優點 | 缺點 | 建議 |
|---|---|---|---|
| 所有模板內建於主平台，客戶網站為獨立 repo + 獨立 Pages 專案 | 模板統一管理、客戶實例隔離、可單獨更新 | 需要 Orchestrator 自動化開站流程 | **Phase 2 首選**，符合統一內建模板決策 |
| 所有模板內建於主平台，客戶網站為同一 Pages 下的子路徑/子網域 | 統一部署、管理簡單 | 隔離性較弱、擴充受限 | 可作為過渡方案 |
| 每個模板獨立 Pages 專案（已廢棄） | — | 違反統一內建決策、管理與品牌成本過高 | **不採用**（根據母機守則 Rule 41） |
| 每個客戶獨立 Admin Worker | 完全隔離 | 部署與更新成本高 | 可選，但 Admin API 可先多租戶化 |

---

## 10. 附錄 A：Phase 1 Secrets & Variables 檢查清單

| 名稱 | 類型 | 設定位置 | 是否新增 | 說明 |
|---|---|---|---|---|
| `ADMIN_PASSWORD` | Secret | `wrangler secret put` in `admin-api-worker` | 已存在 | `/manage` 與 `/man/:slug` 登入密碼 |
| `ADMIN_TOKEN_SECRET` | Secret | `wrangler secret put` in `admin-api-worker` | 已存在 | 簽署 JWT |
| `GITHUB_TOKEN` | Secret | `wrangler secret put` in `admin-api-worker` / `ai-content-worker` | 已存在 | 讀寫 GitHub repo |
| `DEEPSEEK_API_KEY` | Secret | `wrangler secret put` in `ai-content-worker` | 已存在 | 呼叫 DeepSeek |
| `PIXABAY_API_KEY` | Secret | `wrangler secret put` in `ai-content-worker` | 已存在 | 搜尋圖片 |
| `GITHUB_WEBHOOK_SECRET` | Secret | `wrangler secret put` in `ai-content-worker` | 建議新增 | 驗證 GitHub webhook 簽章 |
| `EMAIL_API_KEY` | Secret | `wrangler secret put` in `platform-api-worker` | **新增** | 訂單通知郵件 |
| `OWNER_EMAIL` | Var / Secret | `wrangler.toml [vars]` 或 secret in `platform-api-worker` | **新增** | 訂單通知收件人 |
| `EMAIL_FROM` | Var | `wrangler.toml [vars]` in `platform-api-worker` | **新增** | 郵件寄件人 |
| `PLATFORM_ORIGIN` | Var | `wrangler.toml [vars]` in `platform-api-worker` | **新增** | 平台網域，用於 CORS 與通知連結 |
| `VITE_ADMIN_API_URL` | Var | Cloudflare Pages 建置環境變數 / `.env` | **新增** | 前端呼叫 Admin API |
| `VITE_PLATFORM_API_URL` | Var | Cloudflare Pages 建置環境變數 / `.env` | **新增** | 前端呼叫 Platform API |
| `VITE_AI_API_URL` | Var | Cloudflare Pages 建置環境變數 / `.env` | **新增** | 前端未來呼叫 AI Worker（例如即時生成） |
| `DB` | Binding | `wrangler.toml [[d1_databases]]` in `platform-api-worker` & `admin-api-worker` | **新增** | D1 資料庫綁定 |
| `MEDIA_BUCKET` | Binding | `wrangler.toml [[r2_buckets]]` in `admin-api-worker` | 已存在 | R2 媒體庫 |

### 新增 Binding / 路由備註

- `Template Registry` 為純前端邏輯，不需要額外 Cloudflare binding；其映射表位於 `E:\Projects\YowareTemplate\src\templates\registry.ts`。
- `_redirects` 需確保 `/pre/:slug`、`/man/:slug`、`/start/:slug`、`/templates`、`/manage` 皆 fallback 至 `index.html`。
- 根據母機守則 Rule 43，`/man/:slug` 與 `/manage` 不得出現在公開導航，但 `_redirects` 仍需正確配置以支援 SPA 路由。

---

## 11. 結論

本文件定義了 YowareTemplate 從「單一模板」升級為「**多模板自助建站平台**」的 Phase 1 架構：

- **統一內建模板**：所有模板都是平台內建的「模板套件」，註冊於 D1 `templates` 表與 `src/templates/{slug}/`，不再獨立部署為外部 Pages 專案（根據母機守則 Rule 41）。
- **Template Registry**：前端根據 `slug` 動態解析並載入對應模板套件的 `Preview.tsx` 與 `Admin.tsx`，支援 `/pre/:slug` 預覽與 `/man/:slug` 後台編輯。
- **多模板內容儲存**：每個模板對應 `public/data/content-{slug}.json`，`useContent(slug)` 已支援 fallback 到 `content.json`；未來可遷移至 D1 `template_content` 表。
- **AI Worker 多模板輸出**：根據 `templateSlug` 選擇對應 prompt/schema，輸出該模板可渲染的內容；長期目標是建立通用內容中間層與 per-template adapter。
- **後台隱藏**：根據母機守則 Rule 43，`/manage` 與 `/man/:slug` 不得出現在公開導航、sitemap 或 robots.txt。
- 新增 `platform-api-worker` 處理公開的模板與訂單 API；`templates` 表加入 `admin_url`、`template_type`、`adapter_config`。
- 擴充既有 `admin-api-worker` 與 `/manage` 後台，讓主理人可審核訂單與編輯多模板內容。
- 前端加入 `PlatformHome`、`TemplateGallery`、`BriefWizard`、`TemplatePreview` 等新頁面，並保留 `/manage`。
- 安全面強化 CORS、secret 管理、速率限制、D1 參數化查詢與 CSP。
- 部署維持 Pages + Workers + D1 + R2 的 Cloudflare 原生堆疊；所有模板隨主平台一起建置與部署。
- Phase 1 實作重點包括：建立 Template Registry、移植 `cf-spa-kv-cms` 為 `tcm-v1` 模板套件、擴充 AI Worker 支援多模板輸出、更新 D1 migration。
- 為 Phase 2 自動開通與 Phase 3 模板市集預留 `sites` 表、通用內容中間層與 Orchestrator Worker 的設計空間。

文件存放路徑：`E:\Projects\YowareTemplate\docs\SAD.md`。
