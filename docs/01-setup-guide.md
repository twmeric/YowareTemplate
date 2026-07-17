# 01 - 初始設定指南

> 本文件說明如何從零開始部署「地基層」與第一個克隆站。

## 前置需求

- Cloudflare 帳號（需開通 Pages / Workers / D1 / R2）
- GitHub 帳號
- DeepSeek API Key
- Pixabay API Key（可選，但強烈建議）
- GitHub Personal Access Token（需 `repo` scope）
- Cloudflare API Token（需 `Cloudflare Pages:Edit`、`Zone:Edit`、`Account:Read` 權限，用於自動開站）

---

## 步驟 1：部署 AI Content Worker（共用，只需一次）

```bash
cd workers/ai-content-worker
pnpm exec wrangler deploy
wrangler secret put DEEPSEEK_API_KEY
wrangler secret put GITHUB_TOKEN
wrangler secret put PIXABAY_API_KEY        # 可選
wrangler secret put GITHUB_WEBHOOK_SECRET  # 可選，但建議
wrangler secret put AI_WORKER_SECRET       # 保護 /api/generate，僅內部 worker 可呼叫
```

記下 Worker 網址：`https://jkd-ai-content-worker.你的子網域.workers.dev`

---

## 步驟 2：部署 Admin API Worker（共用，只需一次）

這個 Worker 提供自訂後台 UI 的 API、訂單審核，以及**自動開站**功能。

```bash
cd workers/admin-api-worker
pnpm exec wrangler deploy
wrangler secret put ADMIN_PASSWORD         # 建議隨機 6 碼以上
wrangler secret put ADMIN_TOKEN_SECRET     # 建議隨機 32 碼以上
wrangler secret put GITHUB_TOKEN           # 與 AI Worker 相同，需 repo scope
wrangler secret put CLOUDFLARE_API_TOKEN   # 用於自動建立 Pages project 與綁定 domain
```

在 `wrangler.toml` 加入：

```toml
[vars]
CLOUDFLARE_ACCOUNT_ID = "你的 Cloudflare Account ID"
```

### 2.1 建立 D1 資料庫

平台使用單一 D1 資料庫儲存模板、客戶、訂單與網站實例：

```bash
wrangler d1 create yowaretemplate-platform-db
```

記下 `database_id`，並在 `platform-api-worker` 與 `admin-api-worker` 的 `wrangler.toml` 都加入：

```toml
[[d1_databases]]
binding = "DB"
database_name = "yowaretemplate-platform-db"
database_id = "<database_id>"
```

套用 migration：

```bash
cd workers/platform-api-worker
wrangler d1 migrations apply yowaretemplate-platform-db
```

### 2.2 建立 R2 媒體庫 bucket

所有模板與客戶圖片可共用一個 R2 bucket（Phase 1），未來再依客戶拆分：

```bash
wrangler r2 bucket create jkd-media-yowaretemplate
wrangler r2 bucket dev-url enable jkd-media-yowaretemplate
```

啟用 dev-url 後會得到公開網址，例如 `https://pub-xxxxxxxx.r2.dev`。把這個網址填入 `admin-api-worker/wrangler.toml`：

```toml
[vars]
MEDIA_BUCKET_NAME = "jkd-media-yowaretemplate"
MEDIA_PUBLIC_URL = "https://pub-xxxxxxxx.r2.dev"

[[r2_buckets]]
bucket_name = "jkd-media-yowaretemplate"
binding = "MEDIA_BUCKET"
```

修改後重新 deploy Admin API Worker。

記下 Worker 網址：`https://jkd-admin-api-worker.你的子網域.workers.dev`

## 步驟 3：部署 Platform API Worker（共用，只需一次）

```bash
cd workers/platform-api-worker
pnpm exec wrangler deploy
wrangler secret put EMAIL_API_KEY              # Resend / SendGrid / Mailgun
wrangler secret put OWNER_EMAIL                # 新訂單通知收件人
```

在 `wrangler.toml` 加入：

```toml
[vars]
PLATFORM_ORIGIN = "https://yowaretemplate.pages.dev"
EMAIL_FROM = "noreply@yowaretemplate.pages.dev"
```

記下 Worker 網址：`https://jkd-platform-api-worker.你的子網域.workers.dev`

---

## 步驟 4：部署平台前台（Cloudflare Pages）

```bash
pnpm install
pnpm run build
wrangler pages deploy dist
```

於 Cloudflare Pages 專案設定以下建置環境變數：

- `VITE_PLATFORM_API_URL`
- `VITE_ADMIN_API_URL`
- `VITE_AI_API_URL`

---

## 步驟 5：建立第一個客戶站（推薦：一鍵開站）

Phase 1 已支援自動開站。完整流程：

1. 客戶訪問平台首頁，選擇模板，進入 `/start/:slug` 填寫表單。
2. 精靈第三步由 AI 生成預覽，客戶輸入期望域名與微調需求後提交訂單。
3. 平台主理人收到 WhatsApp 通知，進入 `/platform-admin`。
4. 在後台查看訂單、復現預覽、標記 `payment_status = paid`，點擊「一鍵開站」。
5. 系統自動：建立 GitHub repo → 寫入 brief/content → 建立 Pages project → 綁定 domain → 發送交付通知。

### 自動登入連結

開站完成後，系統會自動產生 `/manage` 自動登入連結並寄送給客戶。也可以手動產生：

```bash
curl -X POST https://jkd-admin-api-worker.你的子網域.workers.dev/api/generate-token \
  -H "Content-Type: application/json" \
  -d '{"password":"你的ADMIN_PASSWORD","expiresInHours":168}'
```

回傳包含 `url`（網址為 `/manage?token=...`），客戶開啟後會自動登入。

---

## 步驟 6：手動開站 Fallback（當自動開站失敗時）

若一鍵開站某個環節失敗，可手動完成剩餘步驟：

### 6.1 從模板複製倉庫

1. 在 GitHub 上開啟 `twmeric/YowareTemplate`
2. 點擊 **Use this template**
3. 命名規則：`yoware-<訂單編號小寫>`，例如 `yoware-ywt-20250717-a3k9`

### 6.2 修改設定檔

編輯 `src/api/admin.ts`，將 `ADMIN_API_URL` 改為你的 Admin API Worker 網址：

```ts
const ADMIN_API_URL = "https://jkd-admin-api-worker.你的子網域.workers.dev";
```

### 6.3 填寫 brief.txt 與 content.json

- 參考倉庫根目錄的 `brief.txt` 範本，填入客戶資訊。
- 將訂單的 `generated_content` 寫入 `public/data/content.json`。

### 6.4 設定 GitHub Webhook（可選）

1. 客戶倉庫 → Settings → Webhooks → Add webhook
2. Payload URL：`https://jkd-ai-content-worker.你的子網域.workers.dev`
3. Content type：`application/json`
4. Secret：與 `GITHUB_WEBHOOK_SECRET` 相同（若有設定）
5. 觸發事件：選 **Just the push event**
6. 啟用 Active

### 6.5 部署到 Cloudflare Pages

1. Cloudflare Pages → Create a project → Connect to Git
2. 選擇客戶倉庫
3. Build settings：
   - Build command：`pnpm run build`
   - Build output directory：`dist`
4. 綁定客戶自訂網域

### 6.6 觸發 AI 生成（可選）

```bash
git add brief.txt
git commit -m "chore: update client brief"
git push
```

約 10-60 秒後，AI Worker 會自動生成 `public/data/content.json` 並 Push 回倉庫，Cloudflare Pages 會再次部署。

---

## 步驟 7：驗證

- 訪問客戶網站，確認內容正確渲染
- 訪問 `https://<客戶網域>/manage`，使用自動登入連結或 `ADMIN_PASSWORD` 登入，測試修改內容並儲存
- 檢查 AI Worker 與 Admin API Worker 執行記錄（Wrangler Logs / Cloudflare Dashboard）
- 在 `/platform-admin` 確認訂單狀態為 `completed`，`sites` 記錄 status 為 `live`

---

## 常見問題

### Q：AI Worker 沒有觸發？

- 確認 Webhook 的 Payload URL 正確
- 確認 `GITHUB_WEBHOOK_SECRET` 與 Webhook Secret 一致
- 確認 brief.txt 有實際變更並被 push
- 查看 Worker Logs 錯誤訊息

### Q：圖片沒有出現？

- 確認已設定 `PIXABAY_API_KEY`
- 若未設定 Pixabay key，Worker 會使用 fallback 圖片

### Q：後台儲存失敗？

- 確認 Admin API Worker 的 `GITHUB_TOKEN` 有該客戶倉庫的 `repo` 權限
- 確認 `src/api/admin.ts` 中的 `ADMIN_API_URL` 正確
- 確認瀏覽器開發者工具中的 Network 請求沒有 CORS 錯誤
