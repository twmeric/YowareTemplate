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
    CHECK (status IN ('pending','reviewing','accepted','rejected','completed','cancelled')),
  brief_answers TEXT NOT NULL,
  owner_notes TEXT,
  quoted_amount INTEGER,
  currency TEXT DEFAULT 'HKD',
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
        "ownerNotes": null,
        "quotedAmount": null,
        "currency": "HKD",
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
  "status": "accepted",
  "ownerNotes": "已聯繫客戶，確認品牌色為綠色。"
}
```

- 至少需包含 `status` 或 `ownerNotes` 其中一個。
- 狀態變更時寫入 `order_events`（`event='status_changed'`, `payload={from,to}`）。
- `ownerNotes` 變更時可選寫入 `order_events`（`event='note_added'`）。
- 更新 `orders.updated_at`。

Response:
```json
{
  "success": true,
  "data": { "id": 42, "publicId": "YWT-20250717-A3K9", "status": "accepted", "ownerNotes": "..." }
}
```

## 4. 通知（平台 Worker 內）

訂單建立後，呼叫 Resend API 發送郵件給 `OWNER_EMAIL`。

必要 secrets:
- `OWNER_EMAIL`（例如 `owner@example.com`）
- `EMAIL_API_KEY`（Resend API key）
- `FROM_EMAIL`（例如 `noreply@yowaretemplate.pages.dev`）

郵件內容：
- Subject: `[新訂單] YWT-20250717-A3K9 - 日出咖啡 Sunrise Brew`
- Body HTML 包含：訂單編號、模板名稱、客戶姓名/Email/WhatsApp、品牌名稱、需求摘要、管理連結 `https://yowaretemplate.pages.dev/manage/orders`
- 發送成功後更新 `orders.notification_sent_at` 並寫入 `order_events`（`event='notified'`）。
- 發送失敗記錄 Worker Logs，`notification_sent_at` 留空。

## 5. 前端 API Client

- `src/api/platform.ts`：封裝 `fetch` 呼叫 Platform Worker。
- `src/api/admin.ts`：現有 admin client 增加 `getOrders`, `getOrder`, `updateOrder`。
- URL 從 `import.meta.env.VITE_PLATFORM_API_URL` / `VITE_ADMIN_API_URL` 讀取，缺省值為已部署網址。
