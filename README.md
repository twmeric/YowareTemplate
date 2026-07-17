# 可克隆 Landing Page 模板

這是從 YouWare 版型清洗後的「模具層」模板。任何新客戶只需：

1. 用 GitHub「Use this template」複製此倉庫
2. 修改 `brief.txt`
3. Push 觸發 AI Worker 自動生成 `public/data/content.json`
4. Cloudflare Pages 自動部署

## 技術棧

- React 18 + TypeScript
- Vite 7
- Tailwind CSS 3
- Lucide React（圖標）

## 本地開發

```bash
pnpm install
pnpm run dev
```

## 生產建置

```bash
pnpm run build
```

建置輸出目錄為 `dist/`。

## 內容架構

所有客戶內容都在 `public/data/content.json`，由 AI Worker 或自訂後台 UI 維護。
React 應用在執行期載入此 JSON，再動態渲染頁面。

內容類型定義：`src/types/content.ts`
內容載入 Hook：`src/hooks/useContent.ts`
後台 API：`src/api/admin.ts`
後台頁面：`src/pages/Admin.tsx`

## 自訂後台 UI

部署後訪問 `https://<your-domain>/admin`，使用 Admin API Worker 設定的密碼登入。

設定方式：

1. 部署 `workers/admin-api-worker`
2. 設定 secrets：`ADMIN_PASSWORD`、`ADMIN_TOKEN_SECRET`、`GITHUB_TOKEN`
3. 編輯 `src/api/admin.ts` 中的 `ADMIN_API_URL` 為你的 Worker 網址
4. 重新部署網站

也可以呼叫 `/api/generate-token` 產生自動登入連結給客戶。

## AI 自動生成

倉庫根目錄的 `brief.txt` 是 AI Worker 的輸入。修改並 Push 後，GitHub Webhook 會觸發 AI Worker：

```
brief.txt → DeepSeek AI → Pixabay 圖片 → public/data/content.json → Cloudflare Pages 重新部署
```

詳細設定請參閱 `docs/` 資料夾。

## 目錄說明

```
public/
  assets/images/    客戶上傳的圖片
  data/content.json 網站內容（由 AI / 後台維護）
  _redirects        Cloudflare Pages SPA fallback
  _headers          安全標頭
src/
  api/              後台 API 客戶端
  components/       React 組件
  hooks/            內容載入 Hook
  pages/            頁面（含後台 Admin）
  types/            TypeScript 內容型別
  App.tsx           單頁應用入口
workers/
  admin-api-worker/    自訂後台 API（所有站共用）
  ai-content-worker/   DeepSeek + Pixabay 內容生成 Worker
  oauth-gateway/       GitHub OAuth Gateway（legacy，已改用自訂後台）
```

## 授權

僅供 JKD Studio 內部與授權客戶使用。
