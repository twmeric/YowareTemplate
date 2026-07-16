# 01 - 初始設定指南

> 本文件說明如何從零開始部署「地基層」與第一個克隆站。

## 前置需求

- Cloudflare 帳號（需開通 Pages / Workers / Workers AI）
- GitHub 帳號
- DeepSeek API Key
- Pixabay API Key（可選，但強烈建議）
- 一個 GitHub Personal Access Token（需 `repo` scope）

---

## 步驟 1：建立 OAuth Gateway（共用，只需一次）

### 1.1 註冊 GitHub OAuth App

1. GitHub → Settings → Developer settings → OAuth Apps → New OAuth App
2. Application name：`JKD CMS Gateway`
3. Homepage URL：`https://你的公司網站.com`（暫時可填占位）
4. Authorization callback URL：`https://jkd-oauth-gateway.你的子網域.workers.dev/callback`
5. 記下 **Client ID** 與 **Client Secret**

### 1.2 部署 OAuth Worker

```bash
cd workers/oauth-gateway
npx wrangler deploy
wrangler secret put GITHUB_CLIENT_ID
wrangler secret put GITHUB_CLIENT_SECRET
```

### 1.3 驗證

訪問 `https://jkd-oauth-gateway.你的子網域.workers.dev/`，應看到 JSON 回傳 `{ "ok": true, ... }`。

---

## 步驟 2：部署 AI Content Worker（共用，只需一次）

```bash
cd workers/ai-content-worker
npx wrangler deploy
wrangler secret put DEEPSEEK_API_KEY
wrangler secret put GITHUB_TOKEN
wrangler secret put PIXABAY_API_KEY        # 可選
wrangler secret put GITHUB_WEBHOOK_SECRET  # 可選，但建議
```

記下 Worker 網址：`https://jkd-ai-content-worker.你的子網域.workers.dev`

---

## 步驟 3：建立第一個客戶站

### 3.1 從模板複製倉庫

1. 在 GitHub 上開啟此模板倉庫
2. 點擊 **Use this template**
3. 命名規則：`client-<客戶代號>-<版型>`，例如 `client-bakery-v1`

### 3.2 修改設定檔

編輯 `public/admin/config.yml`：

```yaml
backend:
  repo: 你的帳號/client-bakery-v1
  base_url: https://jkd-oauth-gateway.你的子網域.workers.dev

site_url: https://client-bakery-v1.pages.dev
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
- 訪問 `/admin/`，測試 Decap CMS 授權與修改內容
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

### Q：OAuth 授權失敗？

- 確認 OAuth App 的 callback URL 與 Worker 網址一致
- 確認 `GITHUB_CLIENT_ID` 與 `GITHUB_CLIENT_SECRET` 正確
- 確認 Worker 有回應 CORS `OPTIONS` 預檢請求
