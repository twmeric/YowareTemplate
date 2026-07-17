# cf-spa-kv-cms 部署指南（第二套模板）

這是 JKDWebsite / QuickPage 平台的第二套模板：「明德中醫 TCM Clinic」。
由於它使用獨立的 Cloudflare Pages Functions + KV CMS，因此需要**獨立部署為另一個 Cloudflare Pages 專案**，再於平台資料庫中註冊預覽與後台網址。

## 預設資訊

- Pages 專案名稱：`yowaretemplate-tcm`
- 預設網址：`https://yowaretemplate-tcm.pages.dev`
- 後台網址：`https://yowaretemplate-tcm.pages.dev/admin`
- Demo 密碼：與主平台相同（預設 `demo123`，部署時自行設定）

## 前置需求

- Node.js 18+
- pnpm
- 已登入的 Wrangler：`pnpm dlx wrangler login`

## 部署步驟

### 1. 安裝依賴

```bash
cd templates/cf-spa-kv-cms
pnpm install
```

### 2. 建立 KV Namespace

```bash
pnpm dlx wrangler kv namespace create "CMS_KV"
```

複製回傳的 `id`，貼到 `wrangler.toml`：

```toml
[[kv_namespaces]]
binding = "CMS_KV"
id = "YOUR_KV_NAMESPACE_ID"
```

### 3. 設定密鑰

```bash
pnpm dlx wrangler pages secret put ADMIN_PASSWORD
pnpm dlx wrangler pages secret put JWT_SECRET
```

- `ADMIN_PASSWORD`：建議與主平台一致，方便 demo（例如 `demo123`）
- `JWT_SECRET`：隨機長字串

### 4. 建置與部署

```bash
pnpm build
pnpm deploy
```

首次部署會建立 Pages 專案 `yowaretemplate-tcm`。

### 5. 更新平台資料庫

部署完成後，確認實際網址，並到 D1 更新 `templates` 表的 `preview_url` 與 `admin_url`：

```sql
UPDATE templates
SET
  preview_url = 'https://yowaretemplate-tcm.pages.dev',
  admin_url = 'https://yowaretemplate-tcm.pages.dev/admin'
WHERE slug = 'tcm-v1';
```

若使用自訂網域（例如 `tcm.quickpage.jkdcoding.com`），請同步更新。

## 與主平台的關係

- 前台預覽：從主平台 `/templates` 與 `/templates/tcm-v1` 連結過去
- 後台管理：獨立於 `https://yowaretemplate-tcm.pages.dev/admin`
- 訂單流程：仍由主平台 `/start/tcm-v1` 收集，平台營運者收到訂單後，再於此 CMS 手動建立客戶網站

## 本地開發

```bash
cd templates/cf-spa-kv-cms
pnpm dev
```

本地開發時 KV 不會生效，網站會使用 `src/content/*.json` 的預設內容。

## 更新內容

編輯 `src/content/*.json` 後重新 `pnpm build && pnpm deploy`。
上線後也可直接透過 `/admin` 後台在 KV 中即時修改內容。
