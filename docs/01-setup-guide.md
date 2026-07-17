# 01 - 初始設定指南

> 本文件說明如何從零開始部署「地基層」與第一個克隆站。

## 前置需求

- Cloudflare 帳號（需開通 Pages / Workers / Workers AI）
- GitHub 帳號
- DeepSeek API Key
- Pixabay API Key（可選，但強烈建議）
- 一個 GitHub Personal Access Token（需 `repo` scope）

---

## 步驟 1：部署 AI Content Worker（共用，只需一次）

```bash
cd workers/ai-content-worker
pnpm exec wrangler deploy
wrangler secret put DEEPSEEK_API_KEY
wrangler secret put GITHUB_TOKEN
wrangler secret put PIXABAY_API_KEY        # 可選
wrangler secret put GITHUB_WEBHOOK_SECRET  # 可選，但建議
```

記下 Worker 網址：`https://jkd-ai-content-worker.你的子網域.workers.dev`

---

## 步驟 2：部署 Admin API Worker（共用，只需一次）

這個 Worker 提供自訂後台 UI 的 API，讓客戶不用 GitHub 就能編輯網站內容。

```bash
cd workers/admin-api-worker
pnpm exec wrangler deploy
wrangler secret put ADMIN_PASSWORD         # 建議隨機 16 碼以上
wrangler secret put ADMIN_TOKEN_SECRET     # 建議隨機 32 碼以上
wrangler secret put GITHUB_TOKEN           # 與 AI Worker 相同，需 repo scope
```

Worker 會自動從 `wrangler.toml` 讀取 `GITHUB_REPO`。

記下 Worker 網址：`https://jkd-admin-api-worker.你的子網域.workers.dev`

### 產生自動登入連結

登入後台有兩種方式：

1. **密碼登入**：直接訪問 `https://<客戶網域>/manage`，輸入 `ADMIN_PASSWORD`。
2. **自動登入連結**：呼叫 Worker 產生一次性 token URL，適合寄給客戶：

```bash
curl -X POST https://jkd-admin-api-worker.你的子網域.workers.dev/api/generate-token \
  -H "Content-Type: application/json" \
  -d '{"password":"你的ADMIN_PASSWORD","expiresInHours":168}'
```

回傳包含 `url`（網址為 `/manage?token=...`），客戶開啟後會自動登入。

---

## 步驟 3：建立第一個客戶站

### 3.1 從模板複製倉庫

1. 在 GitHub 上開啟此模板倉庫
2. 點擊 **Use this template**
3. 命名規則：`client-<客戶代號>-<版型>`，例如 `client-bakery-v1`

### 3.2 修改設定檔

編輯 `src/api/admin.ts`，將 `ADMIN_API_URL` 改為你的 Admin API Worker 網址：

```ts
const ADMIN_API_URL = "https://jkd-admin-api-worker.你的子網域.workers.dev";
```

### 3.3 填寫 brief.txt

參考倉庫根目錄的 `brief.txt` 範本，填入客戶資訊。

### 3.4 設定 GitHub Webhook

1. 客戶倉庫 → Settings → Webhooks → Add webhook
2. Payload URL：`https://jkd-ai-content-worker.你的子網域.workers.dev`
3. Content type：`application/json`
4. Secret：與 `GITHUB_WEBHOOK_SECRET` 相同（若有設定）
5. 觸發事件：選 **Just the push event**
6. 啟用 Active

### 3.5 部署到 Cloudflare Pages

1. Cloudflare Pages → Create a project → Connect to Git
2. 選擇客戶倉庫
3. Build settings：
   - Build command：`pnpm run build`
   - Build output directory：`dist`
4. 完成首次部署

### 3.6 觸發 AI 生成

```bash
git add brief.txt
git commit -m "chore: update client brief"
git push
```

約 10-60 秒後，AI Worker 會自動生成 `public/data/content.json` 並 Push 回倉庫，Cloudflare Pages 會再次部署。

---

## 步驟 4：驗證

- 訪問客戶網站，確認內容正確渲染
- 訪問 `https://<客戶網域>/manage`，使用 `ADMIN_PASSWORD` 登入，測試修改內容並儲存
- 檢查 AI Worker 執行記錄（Wrangler Logs / Cloudflare Dashboard）

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
