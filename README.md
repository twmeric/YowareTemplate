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

部署後訪問 `https://<your-domain>/manage`，使用 Admin API Worker 設定的密碼登入。

設定方式：

1. 部署 `workers/admin-api-worker`
2. 設定 secrets：`ADMIN_PASSWORD`、`ADMIN_TOKEN_SECRET`、`GITHUB_TOKEN`
3. 建立 R2 bucket 並啟用 public dev-url，填入 `workers/admin-api-worker/wrangler.toml`
4. 編輯 `src/api/admin.ts` 中的 `ADMIN_API_URL` 為你的 Worker 網址
5. 重新部署網站

也可以呼叫 `/api/generate-token` 產生自動登入連結給客戶。

### 媒體庫與圖片壓縮

後台內建媒體庫，圖片上傳前會自動壓縮：

- ≤ 500 KB：不壓縮
- 500 KB ~ 2 MB：縮至 2048px，品質 0.85
- 2 MB ~ 5 MB：縮至 1920px，品質 0.75
- > 5 MB：縮至 1600px，品質 0.65
- SVG / GIF 不壓縮
- 壓縮後若沒變小，自動回退原檔

圖片儲存在 Cloudflare R2，透過公開 URL 在網站顯示。

## AI 自動生成

倉庫根目錄的 `brief.txt` 是 AI Worker 的輸入。修改並 Push 後，GitHub Webhook 會觸發 AI Worker：

```
brief.txt → DeepSeek AI → Pixabay 圖片 → public/data/content.json → Cloudflare Pages 重新部署
```

詳細設定請參閱 `docs/` 資料夾。

## 多模板支援

平台採用統一內建模板架構：所有模板均為平台內建的「模板套件」，註冊於 D1 `templates` 表，並透過 Template Registry 根據 `slug` 動態載入對應的 `Preview.tsx` 與 `Admin.tsx`。

| 模板 | 類型 | 前台預覽 | 後台管理 |
|------|------|----------|----------|
| `landing-v1` | 平台內建 Landing Page | `/preview`（向後相容）/ `/pre/landing-v1` | `/man/landing-v1` |
| `tcm-v1` | 平台內建中醫診所模板 | `/pre/tcm-v1` | `/man/tcm-v1` |

模板套件標準結構（以 `tcm-v1` 為例）：

```
src/templates/tcm-v1/
  components/       # 該模板的 section 組件
  schema.ts         # 內容型別定義
  adapter.ts        # 通用問卷 → 模板內容轉換
  Preview.tsx       # 前台預覽頁面
  Admin.tsx         # 後台內容編輯頁面
```

第二套模板原始碼暫存於 `templates/cf-spa-kv-cms/`，後續將逐步移植為 `src/templates/tcm-v1/` 內建套件。移植期間仍可參考 `templates/cf-spa-kv-cms/DEPLOY.md` 了解其原始設計。

新增模板時，請在 `workers/platform-api-worker/migrations/` 新增 migration，並執行：

```bash
cd workers/platform-api-worker
pnpm dlx wrangler d1 migrations apply yowaretemplate-platform-db
```

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
  pages/            頁面（含後台 Manage）
  types/            TypeScript 內容型別
  App.tsx           單頁應用入口
templates/
  cf-spa-kv-cms/    第二套中醫診所模板原始碼（待移植為內建套件）
src/templates/
  landing-v1/       內建 Landing Page 模板套件
  tcm-v1/           內建中醫診所模板套件（規劃中）
workers/
  admin-api-worker/    自訂後台 API（所有站共用）
  ai-content-worker/   DeepSeek + Pixabay 內容生成 Worker
  oauth-gateway/       GitHub OAuth Gateway（legacy，已改用自訂後台 /manage）
  platform-api-worker/ 平台 API（模板、訂單、驗證）
```

## 授權

僅供 JKD Studio 內部與授權客戶使用。
