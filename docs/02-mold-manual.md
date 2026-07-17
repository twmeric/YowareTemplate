# 02 - 模板套件說明書

## 平台模板架構

YowareTemplate 採用**統一內建模板架構**。所有模板都是平台內建的「模板套件（Template Package）」，註冊於 D1 `templates` 表與 `src/templates/{slug}/` 目錄。前端透過 **Template Registry** 根據 `slug` 動態載入對應的 `Preview.tsx` 與 `Admin.tsx`。

| 模板 | Slug | 類型 | 前台預覽 | 後台編輯 |
|---|---|---|---|---|
| Landing Page v1 | `landing-v1` | 日式簡約 Landing | `/preview`（向後相容）、`/pre/landing-v1` | `/man/landing-v1` |
| 明德中醫 TCM Clinic | `tcm-v1` | 中醫診所 | `/pre/tcm-v1` | `/man/tcm-v1` |

每個模板套件標準結構：

```
src/templates/{slug}/
  components/       # 該模板的 section 組件
  schema.ts         # 內容型別定義
  adapter.ts        # 通用問卷 → 模板內容轉換
  Preview.tsx       # 前台預覽頁面
  Admin.tsx         # 後台內容編輯頁面
```

## landing-v1 版型資訊

| 項目 | 內容 |
|---|---|
| 版型名稱 | Landing Page v1（日式簡約風） |
| 適用行業 | 餐飲、食材、精品零售、生活館、個人品牌 |
| 頁面結構 | 單頁式，含 Hero / 品牌故事 / 服務 / 產品 / 聯絡 / Footer |
| 聯絡方式 | WhatsApp 按鈕（一鍵開啟對話） |
| 電商功能 | 預留購物車 UI，目前僅展示與 WhatsApp 導購 |

## 視覺風格

| 元素 | 預設值 |
|---|---|
| 背景色 | `#FDFBF7`（米白） |
| 主色 | `#2D4A22`（深綠） |
| 強調色 | `#C94A47`（日系紅） |
| 字體 | 系統無襯線字體 |

> 顏色目前寫在 `tailwind.config.js`，未納入 `content.json`。未來若要讓 AI 調色，可將 colors 也抽離到內容檔。

## content-{slug}.json Schema 欄位說明（以 landing-v1 為例）

Phase 1 每個模板對應 `public/data/content-{slug}.json`。`landing-v1` 沿用既有的 `public/data/content.json` 作為向後相容；新模板統一使用 `content-{slug}.json`。

以下為 `landing-v1` 的 `SiteContent` schema 欄位說明：

| 欄位 | 型別 | 說明 |
|---|---|---|
| `brand.name` | string | 網站品牌名稱 |
| `brand.logo` | string | 單一字母或符號，顯示於圓形 Logo |
| `brand.tagline` | string | 英文或副標語 |
| `nav.items` | array | 導覽選單，每項含 `label`（顯示文字）與 `target`（錨點 id） |
| `hero.badge` | string | Hero 上方小標籤 |
| `hero.titleLines` | string[] | 主標題，可多行 |
| `hero.highlightedLines` | number[] | 哪幾行使用強調色（從 0 開始） |
| `hero.description` | string | Hero 描述文字 |
| `hero.primaryButton` | object | 主按鈕，`label` 與 `target` |
| `hero.secondaryButton` | object | 次按鈕 |
| `hero.image` | string | Hero 主圖 URL |
| `story.title` | string | 品牌故事標題 |
| `story.paragraphs` | string[] | 多段故事文字 |
| `story.features` | string[] | 四個特點（建議 4 項，呈現 2x2） |
| `story.image` | string | 創辦人 / 故事圖片 |
| `story.quote` | string | 引言 |
| `services.title` | string | 服務區標題 |
| `services.subtitle` | string | 服務區副標 |
| `services.items` | array | 服務卡片，`icon` 可用 Emoji |
| `products.title` | string | 產品區標題 |
| `products.subtitle` | string | 產品區副標 |
| `products.viewAllText` | string | 「查看全部」按鈕文字 |
| `products.items` | array | 產品列表，每項含 `id/name/price/originalPrice/image/category/tag` |
| `contact.title` | string | 聯絡區標題 |
| `contact.description` | string | 聯絡區描述 |
| `contact.whatsapp.number` | string | WhatsApp 號碼，不含 + 號 |
| `contact.whatsapp.buttonText` | string | WhatsApp 按鈕文字 |
| `footer.copyright` | string | 版權文字 |
| `footer.socialLinks` | array | 社交連結，`platform` 影響圖示 |

## 已知限制

1. **HTML `<title>`**：`index.html` 的 title 需手動調整，未從 `content.json` 動態載入。
2. **購物車功能**：目前僅為 UI 預留，未實際結帳。
3. **產品詳情頁**：目前無獨立產品頁，所有產品在同一頁展示。
4. **圖片授權**：AI Worker 預設從 Pixabay 抓取，仍需確認商用授權條款。
5. **語言切換**：專案結構已移除 i18n，僅支援單一語言（由 brief 決定）。

## 何時需要人工介入

- 客戶要求調整版型結構（新增/刪除區塊）
- 客戶要求特殊互動或動畫
- 需要接入金流、會員系統等後端功能
- AI 生成的內容需要潤稿或品牌合規審查

## Template Registry 使用方式

新增模板時，在 `src/templates/registry.ts` 註冊：

```ts
export const registry: Record<string, TemplateEntry> = {
  "landing-v1": {
    preview: () => import("./landing-v1/Preview.tsx"),
    admin: () => import("./landing-v1/Admin.tsx"),
  },
  "tcm-v1": {
    preview: () => import("./tcm-v1/Preview.tsx"),
    admin: () => import("./tcm-v1/Admin.tsx"),
  },
};
```

前端透過 `useTemplate(slug)` 動態載入對應元件，URL 路由分別為 `/pre/:slug` 與 `/man/:slug`。

## 擴充建議

- 將 `theme.colors` 也抽離到 `content-{slug}.json`，讓 AI 可調色
- 增加 `seo` 欄位（title, description, og:image）
- 增加 `testimonials` 客戶評價區塊
- 增加 `faq` 常見問題區塊
- 未來可將 static JSON 遷移至 D1 `template_content` 表，支援多實例與版本控制
