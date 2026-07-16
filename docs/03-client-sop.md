# 03 - 新客戶上線 SOP

> 每接一個新客戶，照這張清單走一遍。

## Step 1：複製模板

- [ ] 在 GitHub 上從本模板點擊 **Use this template**
- [ ] 命名：`client-<客戶代號>-<版型>`
- [ ] 設定為 Private repo（建議）

## Step 2：調整設定檔

- [ ] `public/admin/config.yml`：修改 `repo`、`base_url`、`site_url`
- [ ] `index.html`：修改 `<title>`（目前未動態載入）

## Step 3：填寫 brief.txt

與客戶訪談後，依 `brief.txt` 範本填寫：

```text
行業別：
品牌名稱：
品牌調性：
核心賣點：
目標客群：
聯絡方式：
禁用詞：
語言：
```

## Step 4：Push 觸發 AI

```bash
git add .
git commit -m "chore: initial client brief"
git push
```

等待 AI Worker 生成 `public/data/content.json`。

## Step 5：Cloudflare Pages 部署

- [ ] Pages → Connect to Git → 選擇客戶 repo
- [ ] Build command：`pnpm run build`
- [ ] Build output directory：`dist`
- [ ] 綁定客戶自訂網域（若需要）

## Step 6：開通後台權限

- [ ] 把客戶 GitHub 帳號加入 repo collaborator
- [ ] 若使用 Zero Trust，把客戶信箱加入 `/admin` 白名單

## Step 7：驗收測試

| 項目 | 標準 | 結果 |
|---|---|---|
| 網站可開 | 客戶網域正常顯示 | |
| 內容正確 | 品牌名、產品、聯絡方式符合 brief | |
| WhatsApp 按鈕 | 點擊後開啟正確對話 | |
| /admin 後台 | 可用 GitHub 登入並修改內容 | |
| 手機版 | 無跑版、按鈕可點 | |

## Step 8：交付

- [ ] 提供客戶 `/admin` 後台網址
- [ ] 提供簡易操作說明（如何改文字、如何改圖片）
- [ ] 交付 Phase 4 驗收紀錄截圖

## 客戶操作須知（可複製給客戶）

### 修改網站內容

1. 訪問 `https://<你的網域>/admin/`
2. 點擊「Login with GitHub」
3. 在「網站內容」中修改對應欄位
4. 點擊右上角「Publish」儲存
5. 等待約 1-2 分鐘，網站自動更新

### 修改 brief（重新 AI 生成）

1. 編輯 repo 根目錄的 `brief.txt`
2. Commit 並 Push
3. 約 10-60 秒後 AI 會自動更新 `public/data/content.json`
4. Cloudflare Pages 自動重新部署

### 注意事項

- 圖片建議使用 JPG 或 PNG，尺寸建議 1200x800 以上
- 不要修改 `src/` 資料夾內的程式碼，除非有開發需求
- 若 AI 生成結果不滿意，可直接在 `/admin` 手動調整
