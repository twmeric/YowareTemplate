# Phase 1 API Contract

> 本文件為 `platform-api-worker`、前端平台頁面、`admin-api-worker` 訂單端點之間的實作契約。PRD/SA&D 已統一採用此 schema。

## 1. D1 Schema

資料庫名稱：`yowaretemplate-platform-db`（Wrangler 中綁定名稱 `DB`）。

```sql
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  preview_url TEXT,
  admin_url TEXT,
  template_type TEXT DEFAULT 'landing',
  adapter_config TEXT,
  base_price INTEGER,
  currency TEXT DEFAULT 'HKD',
  wizard_schema TEXT NOT NULL,
  is_active INTEGER DEFAULT 1,
  is_featured INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  phone TEXT,
  whatsapp TEXT,
  preferred_contact TEXT DEFAULT 'email',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  public_id TEXT NOT NULL UNIQUE,
  customer_id INTEGER NOT NULL,
  template_id INTEGER,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','reviewing','accepted','paid','provisioning','completed','failed','rejected','cancelled')),
  brief_answers TEXT NOT NULL,
  desired_domain TEXT,
  tweak_request TEXT,
  generated_content TEXT,
  owner_notes TEXT,
  quoted_amount INTEGER,
  currency TEXT DEFAULT 'HKD',
  payment_status TEXT DEFAULT 'pending'
    CHECK (payment_status IN ('pending','paid','refunded')),
  source_ip TEXT,
  user_agent TEXT,
  notification_sent_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (template_id) REFERENCES templates(id)
);

CREATE TABLE IF NOT EXISTS order_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  event TEXT NOT NULL,
  actor TEXT,
  payload TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_templates_slug ON templates(slug);
CREATE INDEX IF NOT EXISTS idx_templates_active ON templates(is_active);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_events_order ON order_events(order_id);

CREATE TABLE IF NOT EXISTS sites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL UNIQUE,
  customer_id INTEGER NOT NULL,
  template_id INTEGER NOT NULL,
  repo_name TEXT NOT NULL,
  pages_project_name TEXT,
  pages_domain TEXT,
  custom_domain TEXT,
  r2_bucket_name TEXT,
  admin_worker_url TEXT,
  live_url TEXT,
  status TEXT DEFAULT 'provisioning'
    CHECK (status IN ('provisioning','live','failed','suspended','archived')),
  provisioning_logs TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (template_id) REFERENCES templates(id)
);

CREATE INDEX IF NOT EXISTS idx_sites_order ON sites(order_id);
CREATE INDEX IF NOT EXISTS idx_sites_customer ON sites(customer_id);
CREATE INDEX IF NOT EXISTS idx_sites_status ON sites(status);
```

## 2. Platform API Worker（公開）

Base URL: `https://jkd-platform-api-worker.jimsbond007.workers.dev`

CORS: 僅允許
- `https://yowaretemplate.pages.dev`
- `http://localhost:5173`
- `http://localhost:8787`

統一回應格式：
```ts
{ success: boolean; data?: any; error?: { code: string; message: string } }
```

### GET /api/templates

回傳上架中模板列表（不含完整 `wizard_schema` 細節）。

```json
{
  "success": true,
  "data": [
    {
      "slug": "landing-v1",
      "name": "日式簡約 Landing Page v1",
      "description": "...",
      "thumbnailUrl": "...",
      "previewUrl": "/preview",
      "adminUrl": "/man/landing-v1",
      "templateType": "landing",
      "basePrice": 2800,
      "currency": "HKD",
      "isFeatured": true
    }
  ]
}
```

### GET /api/templates/:slug

回傳單一模板完整資訊。

```json
{
  "success": true,
  "data": {
    "slug": "landing-v1",
    "name": "...",
    "description": "...",
    "thumbnailUrl": "...",
    "previewUrl": "/preview",
    "adminUrl": "/man/landing-v1",
    "templateType": "landing",
    "adapterConfig": { "adapter": "landing-v1", "outputSchema": "SiteContent", "defaultSections": ["hero","story","services","products","contact"] },
    "basePrice": 2800,
    "currency": "HKD",
    "wizardSchema": [
      { "name": "brandName", "type": "text", "label": "品牌名稱", "required": true },
      { "name": "industry", "type": "select", "label": "行業別", "options": ["餐飲", "零售", "服務", "其他"] },
      { "name": "keySellingPoints", "type": "textarea", "label": "核心賣點" }
    ],
    "isActive": true,
    "isFeatured": true
  }
}
```

### POST /api/orders

建立訂單。需實作 honeypot 與 IP rate limit（每 IP 每小時預設 5 次）。

Request body:
```json
{
  "templateSlug": "landing-v1",
  "customer": {
    "name": "王小明",
    "email": "ming@example.com",
    "phone": "+852 9876 5432",
    "whatsapp": "85298765432",
    "preferredContact": "whatsapp"
  },
  "answers": {
    "industry": "精品咖啡廳 / 手工烘焙",
    "brandName": "日出咖啡 Sunrise Brew",
    "brandTone": "溫暖、文青、慢活、手作質感",
    "language": "繁體中文",
    "sellingPoints": "每日現烘單品咖啡豆...",
    "targetAudience": "25-45 歲都會上班族...",
    "siteContactMethod": "WhatsApp +852 9876 5432",
    "forbiddenWords": "",
    "additionalNotes": "希望首圖有陽光感。"
  },
  "desiredDomain": "www.sunrisebrew.hk",
  "tweakRequest": "希望 Hero 區使用深綠色背景，服務項目改為三個並加上價格",
  "generatedContent": { "hero": { "title": "..." }, "features": [...] },
  "metadata": { "utmSource": "homepage" },
  "honeypot": ""
}
```

Response:
```json
{
  "success": true,
  "data": {
    "orderId": 42,
    "publicId": "YWT-20250717-A3K9",
    "status": "pending",
    "createdAt": "2026-07-17T07:33:14.000Z"
  }
}
```

失敗時回傳 `400` / `429` / `500`，`error.code` 如 `VALIDATION_ERROR`、`RATE_LIMITED`、`INTERNAL_ERROR`。

### GET /api/orders/:publicId/status

公開狀態查詢，不回傳 `ownerNotes`。

```json
{
  "success": true,
  "data": {
    "publicId": "YWT-20250717-A3K9",
    "status": "pending",
    "createdAt": "2026-07-17T07:33:14.000Z"
  }
}
```

## 3. Admin API Worker（JWT）訂單端點

Base URL: `https://jkd-admin-api-worker.jimsbond007.workers.dev`

沿用既有 JWT 驗證：`Authorization: Bearer <token>`。

### GET /api/orders

支援 query: `?status=pending&limit=50&offset=0`。

Response:
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": 42,
        "publicId": "YWT-20250717-A3K9",
        "status": "pending",
        "customer": {
          "id": 7,
          "name": "王小明",
          "email": "ming@example.com",
          "phone": "+852 9876 5432",
          "whatsapp": "85298765432",
          "preferredContact": "whatsapp"
        },
        "template": {
          "id": 1,
          "slug": "landing-v1",
          "name": "日式簡約 Landing Page v1"
        },
        "briefAnswers": { ... },
        "desiredDomain": "www.sunrisebrew.hk",
        "tweakRequest": "希望 Hero 區使用深綠色背景...",
        "generatedContent": { "hero": { "title": "..." }, ... },
        "ownerNotes": null,
        "quotedAmount": null,
        "currency": "HKD",
        "paymentStatus": "pending",
        "createdAt": "2026-07-17T07:33:14.000Z",
        "updatedAt": "2026-07-17T07:33:14.000Z"
      }
    ],
    "total": 128
  }
}
```

### GET /api/orders/:id

回傳單一訂單，並包含 `events: [{ id, event, actor, payload, createdAt }]`。

### PATCH /api/orders/:id

Request body:
```json
{
  "status": "paid",
  "paymentStatus": "paid",
  "ownerNotes": "已收到銀行轉帳，準備開站。"
}
```

- 至少需包含 `status`、`paymentStatus` 或 `ownerNotes` 其中一個。
- 狀態變更時寫入 `order_events`（`event='status_changed'`, `payload={from,to}`）。
- `paymentStatus` 變更時寫入 `order_events`（`event='payment_status_changed'`）。
- `ownerNotes` 變更時可選寫入 `order_events`（`event='note_added'`）。
- 更新 `orders.updated_at`。

Response:
```json
{
  "success": true,
  "data": { "id": 42, "publicId": "YWT-20250717-A3K9", "status": "paid", "paymentStatus": "paid", "ownerNotes": "..." }
}
```

### POST /api/orders/:id/provision

觸發自動開站。訂單必須為 `paid` 狀態（或 `accepted` 且 `paymentStatus = paid`），且請求帶有效 JWT。

Response:
```json
{
  "success": true,
  "data": {
    "siteId": 1,
    "status": "provisioning",
    "message": "已開始自動開站，請稍後刷新查看進度。"
  }
}
```

### GET /api/orders/:id/provision

查詢自動開站進度。

Response:
```json
{
  "success": true,
  "data": {
    "siteId": 1,
    "orderId": 42,
    "repoName": "yoware-ywt-20250717-a3k9",
    "pagesProjectName": "yoware-ywt-20250717-a3k9",
    "pagesDomain": "yoware-ywt-20250717-a3k9.pages.dev",
    "customDomain": "www.sunrisebrew.hk",
    "liveUrl": "https://www.sunrisebrew.hk",
    "status": "provisioning",
    "provisioningLogs": [
      { "step": "github.repo_created", "status": "ok", "timestamp": "2026-07-17T08:00:00.000Z" }
    ],
    "createdAt": "2026-07-17T08:00:00.000Z",
    "updatedAt": "2026-07-17T08:00:00.000Z"
  }
}
```

## 4. 通知（平台 Worker 內）

訂單建立後，呼叫 CloudWapi API 發送 WhatsApp 訊息給平台主理人。參考 MotherBase 規則 25：必須使用 GET + `encodeURIComponent()` 編碼中文，否則會出現亂碼。

必要 secrets:
- `CLOUDWAPI_API_KEY`
- `CLOUDWAPI_SENDER`（已登入 WhatsApp 的發送號碼，國際格式如 `85262322466`）
- `CLOUDWAPI_RECEIVER`（接收通知的號碼；可選，未設定時預設等於 `CLOUDWAPI_SENDER`）

訊息內容包含：訂單編號、模板名稱、客戶姓名/Email/WhatsApp、品牌名稱、需求摘要、管理連結 `https://yowaretemplate.pages.dev/platform-admin`。

- 發送成功後更新 `orders.notification_sent_at` 並寫入 `order_events`（`event='notified'`，`payload={channel:'whatsapp'}`）。
- 發送失敗記錄 Worker Logs，`notification_sent_at` 留空。

## 5. AI Content Worker

新增直接生成端點：

### POST /api/generate

認證：Header `x-ai-worker-secret: <AI_WORKER_SECRET>`（僅內部 worker 可呼叫）。

Request:
```json
{
  "templateSlug": "landing-v1",
  "brief": "行業別：...\n品牌名稱：...\n..."
}
```

Response:
```json
{
  "success": true,
  "data": {
    "templateSlug": "landing-v1",
    "content": { /* 完整的 SiteContent JSON */ }
  }
}
```

- 根據 `templateSlug` 選擇對應 prompt/schema，呼叫 DeepSeek 生成內容，再經 Pixabay 替換圖片。
- 不寫入 GitHub，將生成的內容返回給前端用於即時預覽。
- CORS 僅允許平台網域。

## 6. Admin API Worker Demo 模式

後台支援兩種登入身份：

| 密碼 | Role | 權限 |
|---|---|---|
| `ADMIN_PASSWORD` | `admin` | 完整讀寫 |
| `DEMO_PASSWORD` | `demo` | 僅供預覽，禁止儲存 |

JWT payload 包含 `role` 欄位。以下端點在 `demo` 角色下回傳 `403`：
- `POST /api/content`
- `POST /api/media`
- `DELETE /api/media/:key`
- `PATCH /api/orders/:id`
- `POST /api/orders/:id/provision`

前端 `/manage` 與 `/platform-admin` 在 demo 模式下顯示提示橫幅，並禁用「儲存」/「一鍵開站」按鈕。

## 7. 前端流程與 API Client

流程：
1. `/` 平台首頁 → `/templates` 模板市集 → 選擇模板
2. `/templates/:slug` 模板體驗中心：
   - 預覽前台網站（`/pre/:slug` 或 `/preview`）
   - 體驗後台管理（`/man/:slug`，Demo 密碼：`demo123`）
   - 開始製作（`/start/:slug`）
3. `/start/:slug` 精靈：
   - Step 1：WhatsApp 身份驗證（輸入 `360` 可 bypass）
   - Step 2：填寫品牌資料（含風格要求）
   - Step 3：確認與送出
     - 前端呼叫 `POST /api/generate` 生成 AI 預覽
     - 顯示預覽、期望域名輸入框、我想微調文字框
     - 確認後呼叫 `POST /api/orders` 建立訂單（帶入 `desiredDomain`、`tweakRequest`、`generatedContent`）
4. 導向 `/order-success/:publicId`
5. 同時觸發 WhatsApp 通知給平台主理人
6. 主理人於 `/platform-admin` 確認付款後，點擊「一鍵開站」觸發 `POST /api/orders/:id/provision`

Client 檔案：
- `src/api/platform.ts`：Platform Worker。
- `src/api/admin.ts`：Admin Worker（含 `getTokenRole`、`isDemo`）。
- `src/api/ai.ts`：AI Worker `/api/generate`。
- URL 從 `import.meta.env.VITE_PLATFORM_API_URL` / `VITE_ADMIN_API_URL` / `VITE_AI_API_URL` 讀取。
