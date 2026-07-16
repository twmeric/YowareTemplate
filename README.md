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

所有客戶內容都在 `public/data/content.json`，由 AI Worker 或 Decap CMS 維護。
React 應用在執行期載入此 JSON，再動態渲染頁面。

內容類型定義：`src/types/content.ts`
內容載入 Hook：`src/hooks/useContent.ts`

## Decap CMS 後台

部署後訪問 `https://<your-domain>/admin/`，使用 GitHub 授權登入。

使用前請先修改 `public/admin/config.yml` 中的：
- `backend.repo`：改為 `你的帳號/倉庫名稱`
- `backend.base_url`：改為你的 OAuth Gateway Worker 網址
- `site_url`：改為你的 Cloudflare Pages 網址

## AI 自動生成

倉庫根目錄的 `brief.txt` 是 AI Worker 的輸入。修改並 Push 後，GitHub Webhook 會觸發 AI Worker：

```
brief.txt → DeepSeek AI → Pixabay 圖片 → public/data/content.json → Cloudflare Pages 重新部署
```

詳細設定請參閱 `docs/` 資料夾。

## 目錄說明

```
public/
  admin/            Decap CMS 入口與設定
  assets/images/    客戶上傳的圖片
  data/content.json 網站內容（由 AI / CMS 維護）
  _redirects        Cloudflare Pages SPA fallback
  _headers          安全標頭
src/
  components/       React 組件
  hooks/            內容載入 Hook
  types/            TypeScript 內容型別
  App.tsx           單頁應用入口
workers/
  ai-content-worker/   DeepSeek + Pixabay 內容生成 Worker
  oauth-gateway/       GitHub OAuth Gateway（所有站共用）
```

## 授權

僅供 JKD Studio 內部與授權客戶使用。
