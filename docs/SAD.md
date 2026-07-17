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

**Phase 1 MVP 目標**：在同一個專案與網域上，疊加一層「客戶導向的平台層」，並在經營者確認付款後自動開通客戶網站：

1. 平台首頁 `/`：介紹 SaaS 服務、收費模式、案例。
2. 模板市集 `/templates`：展示可選模板清單與預覽。
3. 需求表單 `/start/:slug`：引導客戶填寫品牌簡報；最後一步由 AI 生成專屬預覽。
4. 預覽頁面 `/pre/:slug` 與 `/preview?mode=generated`：透過 Template Registry 動態載入對應模板套件的 `Preview.tsx`。
5. 後台編輯 `/man/:slug`：透過 Template Registry 動態載入對應模板套件的 `Admin.tsx`（根據母機守則 Rule 43，不得出現在公開導航）。
6. 訂單提交：表單資料（含期望域名、微調需求、AI 生成內容）寫入 `Cloudflare D1`，並通知平台主理人。
7. 訂單審核與付款確認：主理人在 `/platform-admin` 後台檢視、復現預覽、標記付款狀態。
8. **一鍵開站**：主理人確認收款後觸發自動開站，系統建立客戶 GitHub repo、寫入 brief/content、建立 Pages 專案、綁定 domain、發送交付通知。
9. 保留現有 `/manage` 後台與 AI 自動生成流程，並擴充為多模板輸出。

為了降低維護成本，Phase 1 會把「平台公開 API」獨立成一支新的 `workers/platform-api-worker/`，與既有 `admin-api-worker/` 分離職責；同時在 `admin-api-worker/` 增加訂單查詢/更新/開站端點，讓 `/platform-admin` 後台可完成審核、付款確認與一鍵開站。

### 1.1 架構決策確認（供專家系統架構師審閱）

以下回應另一個 session 提出的專家驗證重點：

| 決策 | 結論 | 說明 |
|---|---|---|
| **統一內建 vs 外部部署** | **統一內建** | 所有模板皆為平台內建的 Template Package，註冊於 `src/templates/{slug}/` 與 D1 `templates` 表。廢棄 `cf-spa-kv-cms` 等獨立部署為外部 Pages 專案的方案（根據母機守則 Rule 41）。 |
| **Template Registry 實作** | **動態 import + 靜態映射表混合** | 前端以靜態映射表將 `slug` 對應到 `import()` 路徑，例如 `registry[slug].preview = () => import('../templates/{slug}/Preview.tsx')`。保留擴充彈性，未來可改由 API 動態取得 registry。 |
| **內容儲存策略** | **Phase 1 沿用 static JSON** | 每個模板對應 `public/data/content-{slug}.json`，與模板套件一起打包部署。D1 `template_content` 表已預留，未來需要多實例/版本控制時再遷移。 |
| **AI Worker 內容格式** | **短期直接產出模板專屬 JSON** | AI Worker 根據 `templateSlug` 選擇對應 prompt/schema，直接輸出該模板可渲染的 JSON。長期目標是建立通用內容中間層，再經 `adapter.ts` 轉換。 |
| **adapter_config 設計** | **採用 JSON：adapter / outputSchema / defaultSections** | 足夠 Phase 1 使用。例如 `{"adapter":"landing-v1","outputSchema":"SiteContent","defaultSections":["hero","features","testimonials","contact"]}`。未來可擴充 `fieldMappings`、`outputFilePath`。 |
| **路由命名** | **確認 `/pre/:slug`（預覽）與 `/man/:slug`（後台編輯）** | `/pre/:slug` 公開渲染模板前台；`/man/:slug` 僅供登入後的經營者使用。根據母機守則 Rule 43，兩者皆不得出現在公開導航。 |
| **AI Worker `/api/generate` 認證** | **內部 secret（`AI_WORKER_SECRET`）** | 由 `admin-api-worker` 與 `platform-api-worker` 在呼叫時帶入 Header `x-ai-worker-secret`。不對外公開，未來可改用 Admin API JWT。 |
| **客戶網站部署方式** | **獨立 repo + 獨立 Pages 專案** | 模板統一內建於平台，但客戶網站仍從 `twmeric/YowareTemplate` 建立獨立 repo 與 Cloudflare Pages 專案，確保客戶實例隔離與獨立網域。 |
| **付款觸發方式** | **Phase 1 人工確認付款** | 經營者在 `/platform-admin` 標記 `payment_status = paid` 後，方可點擊「一鍵開站」。線上金流閘道列為 Phase 2。 |

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
│ • sites         │
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
| `Admin API Worker` | 管理 API：登入、讀寫 `content-{slug}.json`、R2 媒體、訂單審核、一鍵開站 | 增加 D1 binding 與 `/api/orders*` 端點；支援多模板內容與自動開站（GitHub + Cloudflare API） |
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

8. 平台主理人收到通知郵件，內含連結 `/platform-admin?token=<jwt>`。
   └─ 進入 `/platform-admin` 訂單管理後台。
   └─ PlatformAdminPage 呼叫 Admin API Worker 的 GET /api/orders 與 PATCH /api/orders/:id。
   └─ 主理人可「復現預覽」或「重新生成預覽」，確認 AI 生成結果。

9. 主理人與客戶確認需求與報價後，在後台標記 `payment_status = paid`。
   └─ PATCH /api/orders/:id 更新 `payment_status` 與 `status = paid`。
   └─ 寫入 `order_events`（event = `payment_confirmed`）。

10. 主理人點擊「一鍵開站」→ POST /api/orders/:id/provision。
    └─ Admin API Worker 啟動 Orchestrator（非同步流程）。
    └─ 依據 `orders.template_id` → `templates.slug` 選擇 Template Package。
    └─ 呼叫 GitHub API 從 `twmeric/YowareTemplate` 建立客戶 repo。
    └─ 寫入 `brief.txt` 與 `public/data/content.json`（由 `orders.generated_content` 或依 `tweak_request` 重新生成）。
    └─ 呼叫 Cloudflare API 建立 Pages project、觸發部署、綁定 `orders.desired_domain`。
    └─ 回寫 D1 `sites` 表，status = `live`；訂單 status = `completed`。
    └─ 發送交付郵件給客戶，內含網站連結與 `/manage` 自動登入 token。

11. 主理人編輯特定模板內容 → 直接輸入 `/man/:slug`。
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

### 3.3 自動開站流程（Auto-Provisioning Flow）

```text
觸發條件：POST /api/orders/:id/provision
  ├─ JWT 驗證通過
  ├─ orders.status = 'paid'（或 orders.status = 'accepted' 且 payment_status = 'paid'）
  └─ 尚未存在對應 sites 記錄（或 status = failed 允許重試）

Orchestrator（admin-api-worker 內部或獨立 worker）
  │
  ├─ 1. 查詢 template_slug 與 desired_domain
  ├─ 2. GitHub API：create repo from template
  │     repo_name = "yoware-<public_id_lower>"
  ├─ 3. GitHub API：commit brief.txt
  ├─ 4. GitHub API：commit public/data/content.json
  │     （內容來源：orders.generated_content；若 tweak_request 非空則先呼叫 AI Worker 重新生成）
  ├─ 5. GitHub API：create repo secrets
  │     ADMIN_PASSWORD, ADMIN_TOKEN_SECRET, GITHUB_TOKEN, DEEPSEEK_API_KEY, PIXABAY_API_KEY
  ├─ 6. Cloudflare API：create Pages project，連結新 repo
  ├─ 7. Git push / Pages build trigger
  ├─ 8. Cloudflare API：add custom domain (desired_domain)
  ├─ 9. Cloudflare API：create DNS record（若 domain 託管於同一帳號）
  ├─ 10. 產生 /manage 自動登入 token（7 天有效）
  ├─ 11. 發送交付郵件給客戶
  └─ 12. 回寫 sites.status = 'live'；orders.status = 'completed'

每個步驟寫入 sites.provisioning_logs（JSON 陣列）：
  { "step": "github.repo_created", "status": "ok", "message": "...", "timestamp": "..." }
```

**失敗處理**：
- 任何步驟失敗時，標記 `sites.status = 'failed'`，記錄錯誤訊息，並寄信通知經營者。
- 經營者可於 `/platform-admin` 查看 logs，修正問題後重新點擊「一鍵開站」重試。

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
  template_type TEXT DEFAULT 'landing',    -- 模板風格/產業類別，例如 landing、clinic、portfolio
  adapter_config TEXT,                       -- JSON：adapter 與通用中間層設定
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
  status TEXT NOT NULL DEFAULT 'pending'     -- pending, reviewing, accepted, paid, provisioning, completed, failed, rejected, cancelled
    CHECK (status IN ('pending','reviewing','accepted','paid','provisioning','completed','failed','rejected','cancelled')),
  brief_answers TEXT NOT NULL,               -- JSON：表單答案
  desired_domain TEXT,                       -- 客戶期望綁定的域名
  tweak_request TEXT,                        -- 客戶對預覽的微調需求
  generated_content TEXT,                    -- JSON：AI 在精靈第三步生成的預覽內容
  owner_notes TEXT,                          -- 主理人內部備註
  quoted_amount INTEGER,                     -- 報價（最小單位）
  currency TEXT DEFAULT 'HKD',
  payment_status TEXT DEFAULT 'pending'      -- pending, paid, refunded
    CHECK (payment_status IN ('pending','paid','refunded')),
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

-- 客戶網站表：記錄自動開站產生的客戶網站實例
CREATE TABLE IF NOT EXISTS sites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL UNIQUE,
  customer_id INTEGER NOT NULL,
  template_id INTEGER NOT NULL,
  repo_name TEXT NOT NULL,                   -- 例如 "yoware-ywt-20250717-a3k9"
  pages_project_name TEXT,                   -- Cloudflare Pages project name
  pages_domain TEXT,                         -- 預設 pages.dev 網域
  custom_domain TEXT,                        -- 客戶自訂網域
  r2_bucket_name TEXT,                       -- 專屬 R2 bucket（可選）
  admin_worker_url TEXT,                     -- 客戶站 admin worker URL（可選）
  live_url TEXT,                             -- 上線後網址
  status TEXT DEFAULT 'provisioning'         -- provisioning, live, failed, suspended, archived
    CHECK (status IN ('provisioning','live','failed','suspended','archived')),
  provisioning_logs TEXT,                    -- JSON 陣列，記錄每個開站步驟
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (template_id) REFERENCES templates(id)
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
CREATE INDEX IF NOT EXISTS idx_sites_order ON sites(order_id);
CREATE INDEX IF NOT EXISTS idx_sites_customer ON sites(customer_id);
CREATE INDEX IF NOT EXISTS idx_sites_status ON sites(status);
```

### 4.1 欄位補充說明

- `admin_url`：後台編輯入口，例如 `/man/landing-v1`。根據母機守則 Rule 43，此連結僅供主理人內部使用，不得出現在公開導航、sitemap 或 robots.txt。
- `template_type`：用於區分模板風格或產業類別（如 `landing`、`clinic`、`portfolio`），供 Template Registry 選擇預設元件與渲染邏輯。
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

- `desired_domain`：客戶希望綁定的域名，例如 `www.sunrisebrew.hk`。後端需驗證格式，開站時寫入 Pages custom domain。
- `tweak_request`：客戶對 AI 預覽的調整需求，自然語言，字數上限 2000。
- `generated_content`：AI 在精靈第三步生成的預覽內容（JSON），用於復現預覽與開站時初始化 `content.json`。
- `payment_status`：Phase 1 由經營者手動標記；`paid` 後方可執行一鍵開站。
- `public_id` 建議格式：`YWT-{YYYYMMDD}-{4位亂數}`，例如 `YWT-20250717-A3K9`，方便客戶與主理人溝通。

**`sites` 表補充說明**：

- 每筆訂單對應一個 `sites` 記錄（`order_id UNIQUE`）。
- `repo_name` 命名規則：`yoware-<public_id 小寫>`，例如 `yoware-ywt-20250717-a3k9`。
- `provisioning_logs` 為 JSON 陣列，每個元素至少包含 `step`、`status`、`message`、`timestamp`。

---

## 5. API 端點（API Endpoints）

### 5.1 建議分工

| Worker | 存取層級 | 主要端點 |
|---|---|---|
| `platform-api-worker` | 公開（Public） | 模板列表、模板詳情、提交訂單、訂單狀態查詢 |
| `admin-api-worker` | 管理員（JWT） | 登入、多模板內容讀寫、媒體庫、訂單列表/審核/一鍵開站 |
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
      "templateType": "landing",
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
      "templateType": "clinic",
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
| PATCH | `/api/orders/:id` | 更新訂單 `status`、`payment_status` 與 `owner_notes` | JWT |
| POST | `/api/orders/:id/provision` | 觸發自動開站 | JWT |
| GET | `/api/orders/:id/provision` | 查詢自動開站進度 | JWT |
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
| POST | `/api/generate` | 根據 `templateSlug` 與 brief 生成對應模板內容 | 內部 secret `AI_WORKER_SECRET`（Header `x-ai-worker-secret`） |

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
| `ADMIN_PASSWORD` | `/manage` 與 `/man/:slug` 登入密碼 |
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

同樣地，Platform API URL 應透過 `VITE_PLATFORM_API_URL` 注入；未來 AI Worker URL 透過 `VITE_AI_API_URL` 注入。

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
   yowaretemplate.     (webhook +     (JWT + R2 + D1 +
   pages.dev            /api/generate)   Auto-Provisioning)
   │  內建所有模板套件    │               │
   │  /pre/:slug         │               │
   │  /man/:slug         │               ├─ 建立客戶 GitHub repo
   │  / /templates       │               ├─ 寫入 brief / content
   │  /start/:slug       │               ├─ 建立 Pages project
   │  /manage            │               ├─ 綁定 custom domain
   │  /platform-admin    │               └─ 發送交付通知
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
| **管理 API** | `admin-api-worker` | 在 `wrangler.toml` 增加 D1 binding；保留 R2 binding；設定 secrets；支援多模板內容讀寫、訂單審核與自動開站（GitHub + Cloudflare API）。 |
| **內容生成** | `ai-content-worker` | 根據 `templateSlug` 選擇 prompt/schema；可擴充 `/api/generate` 端點。 |
| **資料庫** | Cloudflare D1 | 建立 `yowaretemplate-db`，同時綁定到 platform 與 admin worker。 |
| **物件儲存** | Cloudflare R2 | 既有 bucket `jkd-media-yowaretemplate`，啟用 public dev URL。 |
| **域名** | Pages 預設網域 | 未來可綁定自訂網域，並在 CORS allowlist 中加入。 |

### 7.1a 移除外部獨立部署與 Phase 1 自動開站

- 原本計畫將 `cf-spa-kv-cms`（明德中醫 TCM Clinic）獨立部署為外部 Pages 專案，現已決定**移植進主平台**作為內建模板 `tcm-v1`。
- 所有模板的路由（`/pre/:slug`、`/man/:slug`）、內容檔案（`content-{slug}.json`）、組件與後台編輯器，都隨主平台一起建置與部署。
- **Phase 1 即包含自動開站**：當經營者於 `/platform-admin` 確認付款後，系統自動從 `twmeric/YowareTemplate` 建立客戶 repo、部署為獨立 Cloudflare Pages 專案、綁定客戶 domain。客戶網站實例記錄於 D1 `sites` 表。

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

### Sprint 3：自動開站（Auto-Provisioning）

| # | 任務 | 說明 | 驗收標準 |
|---|---|---|---|
| 22 | **更新 D1 schema** | orders 表新增 `desired_domain`、`tweak_request`、`generated_content`、`payment_status`；新增 `sites` 表。 | Migration 成功套用。 |
| 23 | **精靈第三步擴充** | `StartWizardPage` 第三步顯示 AI 預覽、期望域名輸入框、我想微調文字框。 | 必填驗證通過，提交後欄位寫入 D1。 |
| 24 | **平台後台擴充** | `PlatformAdminPage` 顯示付款狀態、新增「標記已付款」與「一鍵開站」按鈕。 | 僅 `paid` 狀態可開站；開站過程顯示進度。 |
| 25 | **GitHub API 整合** | 在 `admin-api-worker` 實作「create repo from template」與 commit brief/content。 | 測試帳號可成功建立 repo 並寫入檔案。 |
| 26 | **Cloudflare API 整合** | 在 `admin-api-worker` 實作建立 Pages project、綁定 domain、建立 DNS 記錄。 | 測試帳號可成功建立 Pages 並綁定網域。 |
| 27 | **AI Worker `/api/generate` 認證** | 為 `ai-content-worker` 的 `/api/generate` 加上 `AI_WORKER_SECRET` 驗證。 | 無 secret 請求回傳 401。 |
| 28 | **Orchestrator 與進度追蹤** | 實作非同步開站流程，每步寫入 `sites.provisioning_logs`；前端可輪詢進度。 | 失敗時可重試；成功時訂單狀態變為 `completed`。 |
| 29 | **交付通知** | 開站成功後寄送郵件給客戶，內含 live_url 與 `/manage` 自動登入 token。 | 測試郵件內容正確。 |
| 30 | **端到端開站測試** | 從填單 → 付款確認 → 一鍵開站 → 網站上線，完整跑通一次。 | 客戶網站可訪問，內容與預覽一致。 |

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
# 編輯 migrations/0001_init.sql（含 landing-v1、tcm-v1 種子資料）後套用
wrangler d1 migrations apply yowaretemplate-db --local
wrangler d1 migrations apply yowaretemplate-db

# 4. 本地開發
pnpm run dev                    # 前台
wrangler dev                    # Platform Worker
wrangler dev                    # Admin Worker（在各自目錄）
wrangler dev                    # AI Content Worker（在各自目錄）

# 5. 部署
wrangler deploy                 # Platform Worker
wrangler deploy                 # Admin Worker
wrangler deploy                 # AI Content Worker
pnpm run build && wrangler pages deploy dist   # Pages Direct Upload
```

---

## 9. 未來架構（Future Architecture）— Phase 2/3

Phase 1 已完成「提交訂單 + AI 預覽 + 付款確認 + 自動開站」的完整閉環。Phase 2/3 專注於減少經營者介入、提升客戶自助能力與平台規模化。

### 9.1 Phase 2：客戶帳號、線上付款與自助網域

1. **客戶帳號系統**：註冊、登入、忘記密碼、OAuth（Google）。
2. **客戶儀表板**：查看訂單狀態、網站預覽、編輯需求、續約管理。
3. **線上付款閘道**：整合 Stripe / 本地金流，客戶可直接在平台付款，無需人工對帳。
4. **自助網域綁定**：客戶可輸入自有網域，平台自動驗證並設定 DNS 與 SSL。
5. **進階分析儀表板**：訪客數、熱門區塊、WhatsApp 點擊轉換。

### 9.2 Phase 3：完整 SaaS 平台與第三方模板市集

1. **多模板市集**：上架多種風格模板，支援分類、搜尋、評價、分潤。
2. **客戶端所見即所得編輯器**：讓客戶自行微調文字、圖片、顏色，減少客服負擔。
3. **進階分析與 A/B 測試**：轉換漏斗、熱力圖、版本測試。
4. **訂閱與續約管理**：自動計費、到期提醒、停用流程。

### 9.3 架構調整重點

| 調整 | 說明 |
|---|---|
| **通用內容中間層** | 將 Wizard 通用答案透過 per-template `adapter.ts` 轉換為各模板專屬內容；AI Worker 統一輸出通用中間層或模板格式。 |
| **Admin API 多租戶化** | 目前 admin worker 針對單一 repo。未來需讓 Admin API 能依 `site` 或 `repo` 參數讀寫不同客戶 repo 的 `content-{slug}.json`，或為每個客戶獨立部署一支 admin worker。 |
| **DNS 自助化** | 透過 Cloudflare API 讓客戶自行驗證與綁定 `custom_domain`，並自動建立 DNS 記錄。 |
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
| `GITHUB_TOKEN` | Secret | `wrangler secret put` in `admin-api-worker` / `ai-content-worker` | 已存在 | 讀寫 GitHub repo；admin-api-worker 用於自動建立客戶 repo |
| `DEEPSEEK_API_KEY` | Secret | `wrangler secret put` in `ai-content-worker` | 已存在 | 呼叫 DeepSeek |
| `PIXABAY_API_KEY` | Secret | `wrangler secret put` in `ai-content-worker` | 已存在 | 搜尋圖片 |
| `AI_WORKER_SECRET` | Secret | `wrangler secret put` in `ai-content-worker` | **新增** | 保護 `/api/generate`，僅內部 worker 可呼叫 |
| `CLOUDFLARE_API_TOKEN` | Secret | `wrangler secret put` in `admin-api-worker` | **新增** | 建立 Pages project、綁定 domain、管理 DNS |
| `CLOUDFLARE_ACCOUNT_ID` | Var | `wrangler.toml [vars]` in `admin-api-worker` | **新增** | Cloudflare 帳號 ID |
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
- `_redirects` 需確保 `/pre/:slug`、`/man/:slug`、`/start/:slug`、`/templates`、`/manage`、`/platform-admin` 皆 fallback 至 `index.html`。
- 根據母機守則 Rule 43，`/man/:slug`、`/manage`、`/platform-admin` 不得出現在公開導航，但 `_redirects` 仍需正確配置以支援 SPA 路由。

---

## 11. 結論

本文件定義了 YowareTemplate 從「單一模板」升級為「**多模板自助建站平台**」的 Phase 1 架構：

- **統一內建模板**：所有模板都是平台內建的「模板套件」，註冊於 D1 `templates` 表與 `src/templates/{slug}/`，不再獨立部署為外部 Pages 專案（根據母機守則 Rule 41）。
- **Template Registry**：前端根據 `slug` 動態解析並載入對應模板套件的 `Preview.tsx` 與 `Admin.tsx`，支援 `/pre/:slug` 預覽與 `/man/:slug` 後台編輯。
- **多模板內容儲存**：每個模板對應 `public/data/content-{slug}.json`，`useContent(slug)` 已支援 fallback 到 `content.json`；未來可遷移至 D1 `template_content` 表。
- **AI Worker 多模板輸出**：根據 `templateSlug` 選擇對應 prompt/schema，輸出該模板可渲染的內容；長期目標是建立通用內容中間層與 per-template adapter。
- **後台隱藏**：根據母機守則 Rule 43，`/manage` 與 `/man/:slug` 不得出現在公開導航、sitemap 或 robots.txt。
- 新增 `platform-api-worker` 處理公開的模板與訂單 API；`templates` 表加入 `admin_url`、`template_type`、`adapter_config`。
- 擴充 `admin-api-worker` 與新增 `/platform-admin` 後台，讓主理人可審核訂單、確認付款並一鍵觸發自動開站。
- 前端加入 `PlatformHome`、`TemplateGallery`、`BriefWizard`、`TemplatePreview`、`PlatformAdminPage` 等新頁面，並保留 `/manage`。
- **Phase 1 自動開站**：確認付款後自動建立客戶 GitHub repo、部署 Cloudflare Pages、綁定 domain、發送交付通知；實例記錄於 D1 `sites` 表。
- 安全面強化 CORS、secret 管理、速率限制、D1 參數化查詢、CSP，以及 AI Worker `/api/generate` 的內部 secret 保護。
- 部署維持 Pages + Workers + D1 + R2 的 Cloudflare 原生堆疊；所有模板隨主平台一起建置與部署。
- Phase 1 實作重點包括：建立 Template Registry、移植 `cf-spa-kv-cms` 為 `tcm-v1` 模板套件、擴充 AI Worker 支援多模板輸出、更新 D1 migration（含 `sites` 表與訂單新欄位）、實作自動開站 orchestrator。
- 為 Phase 2 客戶帳號/線上付款與 Phase 3 第三方模板市集預留通用內容中間層與多租戶 Admin API 的設計空間。

文件存放路徑：`E:\Projects\YowareTemplate\docs\SAD.md`。
