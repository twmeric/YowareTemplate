# YowareTemplate 自助建站平台 — Phase 1 MVP 產品需求文件（PRD）

| 項目 | 內容 |
|------|------|
| 版本 | v1.0 |
| 日期 | 2026-07-17 |
| 倉庫 | `twmeric/YowareTemplate`（Template Repository） |
| 現行部署 | `https://yowaretemplate.pages.dev` |
| 文件路徑 | `docs/PRD.md` |

---

## 1. 概述與問題陳述

### 1.1 現況

`YowareTemplate` 目前已是一個可運作的資料驅動 Landing Page 模板：

- 技術棧：React 18 + TypeScript + Vite 7 + Tailwind CSS 3
- 內容來源：`public/data/content.json`
- AI 內容生成：透過 `workers/ai-content-worker` 接收 GitHub webhook，讀取 `brief.txt` 後呼叫 DeepSeek，自動產生 `content.json`
- 後台管理：透過 `/manage` 路由，使用 `workers/admin-api-worker` 讀寫 `content.json` 與管理 R2 媒體庫
- 部署：Cloudflare Pages Direct Upload

然而，現有流程對終端客戶來說門檻過高：客戶必須會用 GitHub「Use this template」、會編輯 `brief.txt`、會設定 webhook，且整個開通流程高度依賴平台經營者手動介入。

### 1.2 問題

- **客戶端**：非技術型中小企業主難以理解 GitHub 與 `brief.txt` 的運作方式，導致下單前流失。
- **經營端**：每新增一個客戶站，都需要手動複製倉庫、改設定、佈建、開通知權限，無法規模化。
- **產品端**：模板本身只服務「已經決定要買的客戶」，缺少前置的瀏覽、比較、填單、下單體驗。

### 1.3 Phase 1 目標

在現有模板之上疊加一層「客戶自助平台」：

1. 讓潛在客戶可以在公開網站瀏覽模板、預覽效果、填寫需求。
2. 將填寫結果轉為結構化訂單，儲存在後端資料庫。
3. 自動通知平台經營者，並在既有 `/manage` 後台提供訂單審閱與狀態管理。
4. **Phase 1 仍採人工履約**：經營者收到訂單後，沿用現有的 GitHub 模板複製 + AI 生成流程為客戶建立網站。

> 簡言之：Phase 1 是把「GitHub 後台操作」包裝成客戶可見的銷售漏斗，但履約仍由人工完成。

---

## 2. 目標用戶

### 2.1 終端客戶（Customer）

| 屬性 | 說明 |
|------|------|
| 主要族群 | 中小型企業主、個人品牌、工作室、餐飲 / 零售 / 服務業創業者 |
| 技術能力 | 多數不具備程式或 GitHub 操作能力 |
| 需求 | 快速建立專業 Landing Page，用於品牌展示、產品介紹、WhatsApp 導購 |
| 決策因素 | 價格透明、模板是否符合行業調性、填單是否簡單、能否在行動裝置預覽 |
| 語言 | 繁體中文為主（未來可擴充） |

### 2.2 平台經營者（Owner / Operator）

| 屬性 | 說明 |
|------|------|
| 主要族群 | JKD Studio 內部團隊或授權代理商 |
| 職責 | 接單、審核需求、手動建立客戶站、後續交付與維運 |
| 使用入口 | `/manage`（既有後台）新增「訂單管理」功能 |
| 技術能力 | 熟悉 GitHub、Cloudflare、Workers、D1 等基礎操作 |

---

## 3. 使用者故事

### US-01 瀏覽模板
身為潛在客戶，我想要在網站上瀏覽所有可用模板，以便選擇最符合我品牌風格的版型。

### US-02 預覽模板
身為潛在客戶，我想要在桌面與手機畫面中預覽模板，以便確認視覺效果是否符合我的期待。

### US-03 填寫需求表單
身為非技術客戶，我想要透過分步驟表單精靈填寫品牌資料（取代 `brief.txt`），以便不需要懂 GitHub 也能提交完整需求。

### US-04 提交訂單並收到確認
身為客戶，我想要在提交表單後立即看到確認頁面，並收到訂單成立的相關資訊，以便確認我的需求已被接收。

### US-05 接收新訂單通知
身為平台經營者，我想要在新訂單產生時立即收到通知，以便盡快開始處理。

### US-06 審閱訂單
身為平台經營者，我想要在 `/manage` 後台查看所有訂單明細，以便評估需求並與客戶聯繫。

### US-07 更新訂單狀態與備註
身為平台經營者，我想要更新每筆訂單的處理狀態並記錄內部備註，以便追蹤履約進度。

---

## 4. Phase 1 功能需求

以下功能均屬 Phase 1 MVP 範圍，並附具體驗收標準（Acceptance Criteria）。

### 4.1 平台首頁（`/`）

**描述**：將現有根路由 `/` 從「單一客戶 Landing Page」改為「平台行銷首頁」，用於介紹平台價值、展示精選模板、引導客戶開始建站。

**驗收標準**：
- [ ] 訪問 `/` 時顯示平台首頁，而非載入 `public/data/content.json` 的客戶模板內容。
- [ ] 首頁包含：平台標語、核心價值主張、精選模板預覽、價格/服務說明、明確 CTA（例如「開始建站」）。
- [ ] CTA 連結至 `/templates` 或直接到 `/start/:templateId`（以第一個精選模板為預設）。
- [ ] 首頁在手機、平板、桌面均可正常顯示，互動元素最小觸控區域 44px。
- [ ] 不影響既有 `/manage` 路由與後台功能。

### 4.2 模板列表頁（`/templates`）

**描述**：展示目前平台上可訂購的模板卡片，讓客戶比較後選擇。

**驗收標準**：
- [ ] 訪問 `/templates` 時，從平台 API 讀取模板清單並以卡片形式呈現。
- [ ] 每張卡片至少顯示：模板名稱、縮圖、適用行業、簡短描述、價格（或「聯絡報價」）、「預覽」與「選用此模板」按鈕。
- [ ] 若只有一個模板（Phase 1 現況），頁面仍正常運作，不顯示空狀態錯誤。
- [ ] 點擊「預覽」進入 `/templates/:templateId`。
- [ ] 點擊「選用此模板」進入 `/start/:templateId`。

### 4.3 模板詳情與即時預覽（`/templates/:templateId`）

**描述**：顯示單一模板的詳細資訊，並提供可切換桌面/手機的即時預覽。

**驗收標準**：
- [ ] 訪問 `/templates/:templateId` 時，依照 `templateId` 載入對應模板資訊；找不到時顯示 404 頁面。
- [ ] 頁面包含：模板名稱、完整描述、適用行業、功能清單、價格、預覽區。
- [ ] 預覽區以 iframe 或內嵌方式渲染該模板的 Demo（建議使用 `/preview/:templateId` 路由，預設載入 `public/data/content.json`）。
- [ ] 提供「桌面版」與「手機版」切換按鈕，切換時預覽區寬度改變。
- [ ] 明確的「開始使用此模板」按鈕，導向 `/start/:templateId`。

### 4.4 建站需求表單精靈（`/start/:templateId`）

**描述**：將原本 `brief.txt` 的欄位轉為可視化、分步驟的表單。客戶依序填寫後，於最後一步確認並提交。

**表單欄位（對應 `brief.txt` 欄位）**：

| 步驟 | 欄位 | 必填 | 說明 |
|------|------|------|------|
| 1. 聯絡資訊 | 聯絡人姓名 | 是 | 用於後續溝通 |
| 1. 聯絡資訊 | 電子郵件 | 是 | 訂單確認與聯繫用 |
| 1. 聯絡資訊 | WhatsApp / 電話 | 是 | 優先聯繫方式 |
| 2. 品牌資訊 | 行業別 | 是 | e.g. 餐飲、零售、個人品牌 |
| 2. 品牌資訊 | 品牌名稱 | 是 | 網站顯示名稱 |
| 2. 品牌資訊 | 品牌調性 | 是 | e.g. 溫暖、文青、專業、高端 |
| 2. 品牌資訊 | 語言 | 是 | 預設繁體中文 |
| 3. 業務內容 | 核心賣點 | 是 | 多行文字，可列點 |
| 3. 業務內容 | 目標客群 | 是 | e.g. 25-45 歲上班族 |
| 3. 業務內容 | 聯絡方式（網站使用） | 是 | e.g. WhatsApp 號碼 |
| 3. 業務內容 | 禁用詞 | 否 | 避免 AI 使用的詞彙 |
| 3. 業務內容 | 其他補充 | 否 | 客戶自由填寫 |

**驗收標準**：
- [ ] 表單分為 3 個步驟，上方顯示進度條（Step 1 / 2 / 3）。
- [ ] 每個欄位有清楚標籤與 placeholder 提示；必填欄位未填時無法進入下一步。
- [ ] 電子郵件格式驗證；WhatsApp 號碼僅允許數字與少量符號（`+`、`-`、空格）。
- [ ] 客戶可在每一步返回修改；表單資料自動暫存於 `localStorage`，重新整理後不清空。
- [ ] 最後一步顯示填寫摘要，客戶確認後才提交。
- [ ] 提交時顯示 loading 狀態，並在成功後導向 `/order-success?orderId=xxx`。
- [ ] 表單包含隱藏 honeypot 欄位，用於基礎防機器人。
- [ ] 同一 IP 每小時最多提交 5 筆訂單（由後端 rate limiting 控制）。

### 4.5 訂單提交 API（`workers/platform-api-worker`）

**描述**：新增一個獨立的 Cloudflare Worker，專責處理平台公開 API（模板資料、訂單建立、經營者查詢）。避免與既有 `admin-api-worker` 的客戶站邏輯混淆。

**驗收標準**：
- [ ] 新增 `workers/platform-api-worker/`，與 `admin-api-worker`、`ai-content-worker` 並列。
- [ ] 使用 Cloudflare D1 作為訂單資料庫，於 `wrangler.toml` 綁定 `DB`。
- [ ] 提供以下端點：
  - `GET /api/templates`：回傳模板清單（公開）。
  - `GET /api/templates/:slug`：回傳單一模板詳情（公開）。
  - `POST /api/orders`：建立訂單（公開，需 rate limit + honeypot）。
  - `GET /api/orders/:publicId/status`：查詢單一訂單公開狀態（公開）。
- [ ] 經營者訂單審核端點置於 `admin-api-worker`（見 4.7），沿用既有 JWT 驗證。
- [ ] 訂單建立後，後端須觸發通知（見 4.6）。
- [ ] 所有端點回傳統一 JSON 格式：`{ success: boolean, data?, error? }`。
- [ ] 公開端點正確設定 CORS，僅允許平台網域。

**建議 D1 Schema**（與 SA&D 一致）：

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

### 4.6 經營者通知機制

**描述**：新訂單建立後，自動通知平台經營者。Phase 1 先以電子郵件為主，並預留其他通知渠道的擴充介面。

**驗收標準**：
- [ ] 訂單建立成功後，Worker 立即發送通知郵件（或透過佇列於 60 秒內完成）。
- [ ] 郵件內容包含：訂單編號、模板名稱、客戶姓名/Email/WhatsApp、品牌名稱、需求摘要、管理連結（`https://<domain>/manage?tab=orders`）。
- [ ] 使用環境變數設定：`NOTIFICATION_EMAIL`（收件人）、`RESEND_API_KEY`（或 Mailchannels / SMTP 憑證）。
- [ ] 若郵件發送失敗，記錄於 Worker Logs，並將 `orders.notified_at` 留空，後續可手動重試。
- [ ] （可選）預留 `TELEGRAM_BOT_TOKEN` 與 `TELEGRAM_CHAT_ID`，未來可擴充 Telegram 通知。

### 4.7 訂單審閱後台（`/manage` 新增「訂單管理」頁籤）

**描述**：在既有 `/manage` 後台登入後，新增一個「訂單管理」區塊，讓經營者檢視、搜尋、更新訂單。

**驗收標準**：
- [ ] `/manage` 登入後，左側選單新增「訂單管理」頁籤。
- [ ] 訂單列表顯示：訂單編號、客戶姓名、品牌名稱、模板、狀態、建立時間；可依狀態篩選。
- [ ] 點擊訂單後顯示詳情：所有表單欄位、自動生成的 `raw_brief`、內部備註歷史。
- [ ] 經營者可變更狀態（`pending`、`reviewing`、`accepted`、`rejected`、`completed`、`cancelled`）。
- [ ] 經營者可編輯內部備註，備註儲存於 `orders.owner_notes`；每次狀態變更寫入 `order_events` 審計日誌。
- [ ] 列表與詳情均支援響應式布局。
- [ ] 後台訂單 API 端點置於 `admin-api-worker`：`GET /api/orders`、 `GET /api/orders/:id`、 `PATCH /api/orders/:id`。需驗證 JWT；未授權請求回傳 401。

### 4.8 現有模板預覽保留（`/preview` 或 `/preview/:templateId`）

**描述**：平台首頁不再使用根路由顯示客戶模板，但模板本身的預覽仍須保留，供客戶在瀏覽與填單時參考。

**驗收標準**：
- [ ] 既有 `src/App.tsx` 中的 `LandingApp` 元件保留，但改為 `/preview` 路由專用。
- [ ] `/preview` 繼續載入 `public/data/content.json` 並渲染完整 Landing Page。
- [ ] `/preview` 上方可加一條「這是模板預覽」的提示列，並提供返回平台或開始建站的連結。
- [ ] 不影響 AI Worker 對 `public/data/content.json` 的更新流程。

### 4.9 前端路由與共用版面

**描述**：引入前端路由，區分「平台頁面」與「既有後台/預覽頁面」。

**驗收標準**：
- [ ] 新增 `react-router-dom` 依賴。
- [ ] 於 `src/App.tsx` 中設定路由（建議使用 `BrowserRouter`，Cloudflare Pages SPA fallback 已於 `public/_redirects` 設定）。
- [ ] 路由表：

| 路由 | 說明 | 權限 |
|------|------|------|
| `/` | 平台首頁 | 公開 |
| `/templates` | 模板列表 | 公開 |
| `/templates/:templateId` | 模板詳情與預覽 | 公開 |
| `/start/:templateId` | 建站表單精靈 | 公開 |
| `/order-success` | 訂單提交成功頁 | 公開 |
| `/preview` | 模板即時預覽 | 公開 |
| `/manage` | 既有後台（內容管理 + 訂單管理） | 需密碼/JWT |
| `*` | 404 頁面 | 公開 |

- [ ] 平台頁面使用統一的 `PlatformLayout`（含平台 header/footer），與 `/manage` 的後台風格區隔。
- [ ] 平台 header 包含：Logo、模板、價格/方案、關於、CTA 按鈕。

### 4.10 部署與環境設定

**描述**：完成 Phase 1 後，須更新部署流程與相關設定檔，使平台與既有功能可同時運作。

**驗收標準**：
- [ ] 新增 `workers/platform-api-worker/wrangler.toml`，並綁定 D1 資料庫與必要環境變數。
- [ ] 部署新 Worker：`cd workers/platform-api-worker && pnpm exec wrangler deploy`。
- [ ] 建立 D1 資料庫並執行 schema migration（可使用 `wrangler d1 execute`）。
- [ ] 於 `src/api/platform.ts` 設定 `PLATFORM_API_URL` 為新 Worker 網址。
- [ ] 確認 Cloudflare Pages 的 `_redirects` 仍能正確將所有路由 fallback 至 `index.html`。
- [ ] 更新 `index.html` 的 `<title>` 與 meta description 為平台相關文案（例如「Yoware 自助建站平台」）。
- [ ] 於平台根目錄 `.gitignore` 與 CI（如有）排除新 Worker 的 `node_modules`。
- [ ] 撰寫 `docs/04-platform-deployment.md`，記錄 Phase 1 部署步驟。

---


## 5. 非目標（Out of Scope）

以下項目**不**屬於 Phase 1 MVP，應避免在此階段實作，以免延誤上線：

| 項目 | 說明 | 預計階段 |
|------|------|----------|
| 自動開站 / 自動佈建 | 收到訂單後自動複製 GitHub repo、建立 Pages 專案、綁定網域 | Phase 2 |
| 客戶帳號系統 | 客戶註冊、登入、個人中心、密碼重設 | Phase 2+ |
| 金流與訂閱 | 線上付款、發票、月費/年費方案 | Phase 3 |
| 自訂網域與 DNS 管理 | 客戶綁定自己的網域 | Phase 2+ |
| 多語系與 i18n | 平台與模板支援多語言切換 | Phase 2+ |
| 模板市集 | 多個第三方模板上架與分潤 | Phase 3 |
| 客戶端 CMS 編輯器 | 客戶登入後自行修改網站內容（現有 `/manage` 僅供平台經營者使用） | Phase 3 |
| 進階數據分析 | 訪客數、轉換漏斗、熱力圖 | Phase 2+ |
| 即時客服 / 聊天機器人 | 平台內建對話功能 | 未來評估 |
| 讓 `/manage` 管理平台首頁內容 | Phase 1 平台首頁為硬編碼行銷頁面，不納入 CMS | Phase 1 不實作 |

---

## 6. UI/UX 需求

### 6.1 頁面與元件對照

| 頁面/元件 | 主要內容 | 備註 |
|-----------|----------|------|
| `PlatformLayout` | 平台共用 Header、Footer、主要內容區 | 不包含 `/manage` 與 `/preview` |
| `HomePage` | Hero、價值主張、精選模板、流程說明、CTA | 根路由 `/` |
| `TemplatesPage` | 模板卡片網格、篩選（可簡化為全部） | `/templates` |
| `TemplateDetailPage` | 模板資訊 + 桌面/手機預覽切換 | `/templates/:templateId` |
| `StartWizardPage` | 三步驟表單精靈 + 進度條 + 摘要 | `/start/:templateId` |
| `OrderSuccessPage` | 成功提示、訂單編號、後續說明 | `/order-success` |
| `NotFoundPage` | 404 插圖與返回首頁按鈕 | `*` |
| `Admin`（既有） | 新增「訂單管理」頁籤 | `/manage` |

### 6.2 導覽列（Header）

- 左側：平台 Logo + 品牌名稱「Yoware 建站平台」。
- 中間（桌面）：連結至「模板」、「方案」、「關於」。
- 右側：「開始建站」主按鈕。
- 行動版：漢堡選單，點擊後展開全螢幕選單。
- 捲動時 header 增加陰影與背景色變化。

### 6.3 表單互動

- 每一步驟下方顯示「上一步 / 下一步」按鈕；最後一步顯示「確認送出」。
- 欄位驗證即時顯示錯誤訊息（例如「請輸入有效的電子郵件」）。
- 必填欄位以紅色星號標示。
- 多行文字欄位（核心賣點、補充說明）提供至少 4 行高度。
- 表單資料每 3 秒自動寫入 `localStorage`，並顯示「已自動儲存草稿」提示。
- 客戶手動清除草稿後，可重新開始。

### 6.4 預覽區互動

- 桌面/手機切換按鈕置於預覽區上方。
- 桌面預覽寬度：100% 容器寬度。
- 手機預覽寬度：375px，置中並加上手機外框視覺。
- 預覽區載入時顯示 skeleton loading，載入失敗時顯示「預覽暫時無法載入」。

### 6.5 狀態與回饋

- 任何 API 呼叫需顯示 loading 狀態（按鈕 disabled + spinner）。
- 成功/錯誤使用 inline message 或 toast；避免僅用 `alert()`。
- 表單提交失敗時，保留已填資料並提示重新送出。
- 404 頁面提供返回首頁與瀏覽模板的連結。

### 6.6 視覺與品牌

- 平台頁面主視覺建議使用乾淨、專業的藍/綠/白配色（與模板本身的日系風格區隔）。
- 字體沿用 Tailwind 預設 sans-serif；必要時可載入 Google Fonts（Noto Sans TC）。
- 所有圖片需有 `alt` 文字；按鈕與連結需有清楚的 focus 狀態。
- 行動版優先（Mobile-first），所有頁面首屏載入時間目標 < 3 秒（3G 網路下 < 5 秒）。

### 6.7 SEO / 分享

- 每個公開頁面更新 `<title>` 與 `<meta name="description">`。
- `/templates/:templateId` 的 OG 圖片使用模板縮圖。
- 網站語言標記為 `lang="zh-Hant"`。

---

## 7. 成功指標（Success Metrics）

Phase 1 的成功不以營收為唯一標準，而是驗證「銷售漏斗是否順暢」與「人工履約是否可被有效管理」。

| 指標 | 定義 | 目標（上線後 4 週） | 測量方式 |
|------|------|----------------------|----------|
| 模板瀏覽量 | `/templates` 與 `/templates/:id` 的 PV | ≥ 200 / 週 | Cloudflare Web Analytics |
| 表單啟動率 | 進入 `/start/:templateId` 的訪客佔 `/templates` 訪客比例 | ≥ 15% | 前端路由 log / Analytics |
| 訂單提交數 | 成功建立 `orders` 的筆數 | ≥ 10 筆 / 月 | D1 `orders` 表 |
| 表單完成率 | 開始填單 → 成功提交的比例 | ≥ 30% | 前端事件 + D1 |
| 平均履約天數 | 訂單建立 → 客戶站正式上線的天數 | ≤ 7 天 | 手動記錄於 `order_notes` |
| 通知延遲 | 訂單建立 → 經營者收到通知的時間 | ≤ 2 分鐘 | Worker Logs / 郵件時間戳 |
| 後台審閱使用率 | 經營者透過 `/manage` 查看訂單的比例 | ≥ 90% | 後端存取 log |
| 錯誤率 | API 5xx 比例 | < 1% | Cloudflare Workers Analytics |

### 7.1 回饋收集

- 在 `/order-success` 頁面加入簡單 NPS 問題：「您會推薦此服務給朋友嗎？」（1-10 分）。
- 將 NPS 分數與訂單 ID 一併記錄於 D1，供後續分析。

---

## 8. 後續階段規劃

### 8.1 Phase 2：自動開站（Auto-Provisioning）

當 Phase 1 證明客戶願意填單、經營者願意履約後，下一步減少人工：

1. **訂單確認後自動觸發開站流程**：
   - Worker 呼叫 GitHub API，使用「Repository template」功能從 `twmeric/YowareTemplate` 建立客戶專屬 repo。
   - repo 命名規則：`client-<order-id>-<template-id>`。
2. **自動寫入 brief**：將訂單表單轉為 `brief.txt` 並 commit 至新 repo。
3. **自動設定 Webhook**：在新 repo 註冊 `ai-content-worker` webhook。
4. **自動建立 Cloudflare Pages 專案**：透過 Cloudflare API 建立 Pages project，綁定新 repo，設定 build command 與輸出目錄。
5. **自動部署**：GitHub push 觸發 Pages build；AI Worker 生成 `content.json`。
6. **交付通知**：完成後自動寄送客戶站連結與 `/manage` 自動登入連結給客戶。

### 8.2 Phase 3：完整 SaaS 平台

1. **客戶帳號系統**：註冊、登入、忘記密碼、OAuth（Google）。
2. **客戶儀表板**：查看訂單狀態、網站預覽、編輯需求、續約管理。
3. **線上付款**：整合 Stripe / 本地金流，支援一次性與訂閱制。
4. **自訂網域**：客戶可輸入自有網域，平台自動設定 DNS 與 SSL。
5. **多模板市集**：上架多種風格模板，支援分類、搜尋、評價。
6. **客戶端所見即所得編輯器**：讓客戶自行微調文字、圖片、顏色，減少客服負擔。
7. **分析儀表板**：訪客數、熱門區塊、WhatsApp 點擊轉換。

---

## 9. 風險與假設

### 9.1 風險

| 風險 | 影響 | 緩解措施 |
|------|------|----------|
| **Phase 1 仍為人工履約，訂單量高時無法負荷** | 客戶等待時間拉長、滿意度下降 | 明確標示「7 個工作天內交付」；訂單達上限時暫時隱藏表單或顯示「排隊中」 |
| **客戶填寫的 brief 品質不佳，導致 AI 生成結果不滿意** | 重工、退單 | 表單加入範例提示、字數限制、必填欄位驗證；經營者審核後再觸發 AI |
| **公開訂單 API 被濫用或遭受垃圾攻擊** | D1 被灌爆、通知疲勞 | Honeypot、IP rate limiting、Email 格式驗證、必要時加上 Cloudflare Turnstile |
| **通知郵件被歸類為垃圾信** | 經營者漏接訂單 | 使用可靠寄件服務（Resend）、設定 SPF/DKIM、同時預留 Telegram/Slack 通知 |
| **D1 免費方案限制或效能瓶頸** | 查詢緩慢 | Phase 1 資料量小，後續可升級 D1 或遷移至 PostgreSQL |
| **只有單一模板，客戶選擇有限** | 轉換率偏低 | Phase 1 快速驗證需求；根據回饋製作 2-3 個新模板 |
| **`/manage` 後台權限外洩** | 訂單資料外洩 | 強密碼、JWT 過期、避免在 Git 提交密碼、定期輪替 `ADMIN_TOKEN_SECRET` |

### 9.2 關鍵假設

- 平台經營者會每日查看通知郵件並進入 `/manage` 處理訂單。
- 客戶願意透過表單提供足夠資訊，且能接受 Phase 1 無法即時看到最終網站。
- 既有 `admin-api-worker` 的 JWT 機制可直接沿用於 `platform-api-worker` 的經營者查詢端點。
- Cloudflare D1 在 Workers 環境的讀寫延遲可接受（< 500ms）。
- 電子郵件通知服務（Resend 等）在港台地區可穩定送達。

---


## 附錄 A：資料模型補充說明

### A.1 `templates` 表

Phase 1 只需一筆資料：

```json
{
  "slug": "landing-v1",
  "name": "日式簡約 Landing Page v1",
  "description": "適合餐飲、食材、精品零售、生活館與個人品牌的單頁式網站。",
  "thumbnail_url": "https://example.com/landing-v1-thumb.jpg",
  "preview_url": "/preview",
  "base_price": 2800,
  "currency": "HKD",
  "wizard_schema": "[{\"name\":\"brandName\",\"type\":\"text\",\"label\":\"品牌名稱\",\"required\":true},...]",
  "is_active": 1,
  "is_featured": 1,
  "sort_order": 0
}
```

### A.2 `customers` 表

- 依 email 去重複，建立長期客戶檔案。
- `preferred_contact` 可為 `email`、`phone`、`whatsapp`。

### A.3 `orders` 表

- `public_id` 建議格式：`YWT-{YYYYMMDD}-{4位亂數}`，例如 `YWT-20250717-A3K9`，用於對外溝通與查詢。
- `brief_answers` 儲存客戶填寫的原始表單答案（JSON）。
- `raw_brief`（未來 Phase 2 欄位）可由 `brief_answers` 自動生成，格式與現有 `brief.txt` 一致，方便直接寫入新 repo。
- `status` 的狀態流：
  - `pending`：剛提交，等待審核。
  - `reviewing`：經營者已查看，評估中。
  - `accepted`：已接受並準備進入製作。
  - `rejected`：已拒絕。
  - `completed`：已交付完成。
  - `cancelled`：已取消。

### A.4 `order_events` 表

- 審計日誌，記錄 `submitted`、`notified`、`status_changed`、`note_added` 等事件。
- `payload` 為 JSON，用於儲存變更前後的狀態或備註。

---

## 附錄 B：API 規格摘要

### B.1 公開端點

#### `GET /api/templates`

回傳模板清單。

```json
{
  "success": true,
  "data": [
    {
      "id": "landing-v1",
      "name": "日式簡約 Landing Page v1",
      "thumbnail_url": "...",
      "price_text": "HKD 2,800 起",
      "industries": ["餐飲", "零售", "生活館", "個人品牌"]
    }
  ]
}
```

#### `GET /api/templates/:slug`

回傳單一模板完整資訊（含 `wizard_schema`）。

#### `POST /api/orders`

建立訂單。

請求 body（範例）：

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
  "metadata": {
    "utmSource": "homepage"
  },
  "honeypot": ""
}
```

回傳：

```json
{
  "success": true,
  "data": {
    "orderId": 42,
    "publicId": "YWT-20250717-A3K9",
    "status": "pending",
    "created_at": "2026-07-17T07:33:14.000Z"
  }
}
```

#### `GET /api/orders/:publicId/status`

客戶以公開單號查詢狀態，不回傳 `owner_notes`。

### B.2 經營者端點（需 JWT）

所有經營者端點需在 Header 帶入 `Authorization: Bearer <token>`。JWT 可使用與 `admin-api-worker` 相同的簽發邏輯，並以 `ADMIN_TOKEN_SECRET` 驗證。

#### `GET /api/orders`

支援 query：`status`、`limit`、`offset`。

#### `GET /api/orders/:id`

回傳單一訂單詳情，並包含關聯的 `customer`、`template` 與 `events`。

#### `PATCH /api/orders/:id`

更新訂單狀態與/或內部備註。

請求 body：

```json
{
  "status": "accepted",
  "ownerNotes": "已聯繫客戶，確認品牌色為綠色。"
}
```

---

## 附錄 C：環境變數清單

### C.1 `workers/platform-api-worker`

| 變數 | 類型 | 說明 |
|------|------|------|
| `ADMIN_TOKEN_SECRET` | Secret | 與 `admin-api-worker` 共用，用於簽發/驗證經營者 JWT |
| `OWNER_EMAIL` | Secret | 新訂單通知收件人（可設定多個，以逗號分隔） |
| `EMAIL_API_KEY` | Secret | Resend / SendGrid / Mailgun API Key，用於發送通知郵件 |
| `FROM_EMAIL` | Plain | 寄件人地址，例如 `noreply@yowaretemplate.pages.dev` |
| `PLATFORM_ORIGIN` | Plain | 平台網域，例如 `https://yowaretemplate.pages.dev` |
| `TELEGRAM_BOT_TOKEN` | Secret（可選） | Telegram Bot Token，預留未來擴充 |
| `TELEGRAM_CHAT_ID` | Secret（可選） | Telegram Chat ID，預留未來擴充 |
| `RATE_LIMIT_PER_HOUR` | Plain | 每 IP 每小時最多提交次數，預設 5 |
| `DB` | Binding | Cloudflare D1 資料庫綁定 |

### C.2 前端 `src/api/platform.ts`

| 變數 | 說明 |
|------|------|
| `VITE_PLATFORM_API_URL` | `https://jkd-platform-api-worker.你的子網域.workers.dev` |
| `VITE_ADMIN_API_URL` | `https://jkd-admin-api-worker.你的子網域.workers.dev` |

---

## 附錄 D：實作檢查清單（供開發者使用）

- [ ] 新增 `react-router-dom` 至 `package.json` 並安裝。
- [ ] 重構 `src/App.tsx`：移除 `isAdminRoute` 的 window 判斷，改以 Router 定義所有路由。
- [ ] 新增 `src/pages/platform/HomePage.tsx`、`TemplatesPage.tsx`、`TemplateDetailPage.tsx`、`StartWizardPage.tsx`、`OrderSuccessPage.tsx`。
- [ ] 新增 `src/layouts/PlatformLayout.tsx` 與 `src/api/platform.ts`。
- [ ] 新增 `workers/platform-api-worker/` 並完成 D1 schema migration。
- [ ] 於 `admin-api-worker` 的 JWT 簽發邏輯確認可被 `platform-api-worker` 共用（或複製必要程式碼）。
- [ ] 於 `src/pages/Admin.tsx` 新增「訂單管理」頁籤與對應子元件。
- [ ] 更新 `index.html` title 與 lang 屬性。
- [ ] 更新 `public/_redirects`（如需要）。
- [ ] 撰寫 `docs/04-platform-deployment.md`。
- [ ] 在本地端以 `pnpm run dev` 測試所有路由。
- [ ] 部署新 Worker 與 Pages，驗證訂單提交與通知。

---

*文件結束*
