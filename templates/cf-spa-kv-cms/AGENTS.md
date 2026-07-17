# AGENTS.md — cf-spa-kv-cms

## 專案概述

可複用的 Cloudflare Pages 單頁網站模板。React 18 + TypeScript + Vite 7 + Tailwind CSS 3.4，內容以 JSON 驅動，並透過隱藏的 `/admin` 後台與 Cloudflare KV 進行 CMS 管理。

## 結構

```
E:\Projects\_TEMPLATES\cf-spa-kv-cms\
├── index.html              # SEO meta + Google Fonts（Noto Serif/Sans TC）
├── src\
│   ├── main.tsx / App.tsx  # 入口，section 順序排列
│   ├── index.css           # Tailwind + .section-* / .btn-* / .card 組件類
│   ├── lib\contentLoader.ts# 隨站打包的預設 JSON（零閃爍 fallback）
│   ├── lib\content.tsx     # 運行時：載入 /api/content（KV）並深合併預設值
│   ├── content\*.json      # 11 個內容檔（改內容改這裡）
│   └── components\         # 11 個組件 + Icon.tsx（字串→lucide 映射）
├── functions\
│   ├── [[path]].ts         # SPA fallback：先試 ASSETS，404 才回退 index.html
│   ├── api\[[route]].ts    # Hono API：/api/auth/login、/api/content、/api/content/reset
│   ├── cms\default.ts      # 預設內容 = src/content/*.json
│   └── types.ts            # Env 與 ContentData 型別
├── public\
│   ├── _routes.json / _headers   # Cloudflare Pages 路由與快取
│   └── assets\images\      # 本地圖片（禁止 hotlink 第三方 CDN）
├── .gitignore              # 忽略 node_modules / dist / .wrangler / .env / .dev.vars
├── .npmrc                  # ignore-workspace=true
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── wrangler.toml           # Pages project: your-project（請修改 name 與 KV id）
```

## 工作規範

1. 用 pnpm；`.npmrc` 已設 `ignore-workspace=true`。
2. `pnpm build` 含 `tsc --noEmit`，型別錯誤不得略過。
3. 內容改動只碰 `src/content/*.json`；組件不寫死文案。
4. WhatsApp 連結一律用 `getWhatsAppUrl()`，號碼只存在 `site.json`。
5. `/admin` 不得出現在公開導航；透過直接網址進入。
6. 不要把 `ADMIN_PASSWORD`、`JWT_SECRET`、Cloudflare API token 或 KV id 寫進 repo。

## 驗證流程

```bash
pnpm install --ignore-workspace
pnpm build          # tsc --noEmit && vite build
pnpm preview        # 預覽建構結果
```
