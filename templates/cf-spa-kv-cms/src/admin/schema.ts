/**
 * Admin 表單 schema — 描述每個內容區塊的欄位結構
 * 新增內容區塊時：在 src/content/ 加 JSON → contentLoader → 這裡加一段即可
 */

export type FieldDef =
  | { kind: "string" | "text" | "image"; key: string; label: string; hint?: string }
  | { kind: "object"; key: string; label: string; fields: FieldDef[] }
  | { kind: "list"; key: string; label: string; itemName: string; fields: FieldDef[] };

export interface SectionDef {
  key: string;
  label: string;
  fields: FieldDef[];
}

const ICON_HINT =
  "Lucide 圖標名：Shield / Clock / GraduationCap / Leaf / Zap / Brain / Heart / ClipboardList / Stethoscope / FileText / RotateCcw / BookOpen";

export const SECTIONS: SectionDef[] = [
  {
    key: "siteConfig",
    label: "全站設定",
    fields: [
      { kind: "string", key: "siteName", label: "網站名稱" },
      { kind: "string", key: "doctorName", label: "醫師姓名" },
      { kind: "string", key: "doctorTitle", label: "醫師職稱" },
      { kind: "string", key: "whatsappNumber", label: "WhatsApp 號碼", hint: "格式：852XXXXXXXX（不含 + 號與空格）" },
      { kind: "string", key: "whatsappDefaultMessage", label: "WhatsApp 預設訊息" },
      { kind: "string", key: "whatsappInquiryMessage", label: "WhatsApp 查詢訊息" },
      { kind: "string", key: "phone", label: "電話", hint: "可留空" },
      { kind: "string", key: "address", label: "地址" },
      { kind: "string", key: "addressDetail", label: "地址詳情" },
      { kind: "string", key: "registrationNumber", label: "註冊編號" },
      {
        kind: "object",
        key: "socialLinks",
        label: "社群連結",
        fields: [
          { kind: "string", key: "facebook", label: "Facebook", hint: "可留空" },
          { kind: "string", key: "youtube", label: "YouTube", hint: "可留空" },
        ],
      },
    ],
  },
  {
    key: "navigationContent",
    label: "導覽列",
    fields: [
      {
        kind: "list",
        key: "links",
        label: "導覽連結",
        itemName: "連結",
        fields: [
          { kind: "string", key: "label", label: "文字" },
          { kind: "string", key: "href", label: "連結", hint: "錨點格式：#about" },
        ],
      },
      { kind: "string", key: "ctaText", label: "CTA 按鈕文字" },
    ],
  },
  {
    key: "heroContent",
    label: "首頁 Hero",
    fields: [
      { kind: "string", key: "heading", label: "主標題" },
      { kind: "string", key: "subheading", label: "副標題" },
      { kind: "string", key: "tagline", label: "標語" },
      {
        kind: "object",
        key: "primaryCta",
        label: "主 CTA",
        fields: [
          { kind: "string", key: "text", label: "文字" },
          { kind: "string", key: "message", label: "WhatsApp 訊息" },
        ],
      },
      {
        kind: "object",
        key: "secondaryCta",
        label: "次 CTA",
        fields: [
          { kind: "string", key: "text", label: "文字" },
          { kind: "string", key: "href", label: "連結" },
        ],
      },
      {
        kind: "list",
        key: "trustBadges",
        label: "信任徽章",
        itemName: "徽章",
        fields: [
          { kind: "string", key: "icon", label: "Icon", hint: ICON_HINT },
          { kind: "string", key: "text", label: "文字" },
        ],
      },
      { kind: "image", key: "backgroundImage", label: "背景圖片", hint: "圖片 URL（/assets/images/ 開頭或完整網址）" },
    ],
  },
  {
    key: "aboutContent",
    label: "關於醫師",
    fields: [
      { kind: "string", key: "sectionTitle", label: "區塊標題" },
      { kind: "text", key: "sectionSubtitle", label: "區塊副標" },
      { kind: "string", key: "timelineTitle", label: "時間軸標題" },
      {
        kind: "list",
        key: "timeline",
        label: "學經歷時間軸",
        itemName: "經歷",
        fields: [
          { kind: "string", key: "year", label: "年份", hint: "可留空" },
          { kind: "string", key: "title", label: "標題" },
          { kind: "string", key: "desc", label: "描述" },
        ],
      },
      { kind: "string", key: "philosophyTitle", label: "理念標題" },
      {
        kind: "list",
        key: "philosophyCards",
        label: "理念卡片",
        itemName: "卡片",
        fields: [
          { kind: "string", key: "title", label: "標題" },
          { kind: "string", key: "subtitle", label: "副標" },
          { kind: "text", key: "desc", label: "描述" },
        ],
      },
      { kind: "image", key: "doctorImage", label: "醫師照片" },
      { kind: "string", key: "doctorImageAlt", label: "照片 Alt" },
    ],
  },
  {
    key: "servicesContent",
    label: "診療項目",
    fields: [
      { kind: "string", key: "sectionTitle", label: "區塊標題" },
      { kind: "text", key: "sectionSubtitle", label: "區塊副標" },
      {
        kind: "list",
        key: "services",
        label: "服務項目",
        itemName: "服務",
        fields: [
          { kind: "string", key: "icon", label: "Icon", hint: ICON_HINT },
          { kind: "string", key: "title", label: "標題" },
          { kind: "string", key: "subtitle", label: "副標" },
          { kind: "text", key: "desc", label: "描述" },
          { kind: "image", key: "image", label: "圖片" },
          { kind: "string", key: "imageAlt", label: "圖片 Alt" },
        ],
      },
      { kind: "string", key: "processTitle", label: "流程標題" },
      { kind: "string", key: "processSubtitle", label: "流程副標" },
      {
        kind: "list",
        key: "processSteps",
        label: "流程步驟",
        itemName: "步驟",
        fields: [
          { kind: "string", key: "icon", label: "Icon", hint: ICON_HINT },
          { kind: "string", key: "step", label: "編號", hint: "如 01" },
          { kind: "string", key: "title", label: "標題" },
          { kind: "string", key: "desc", label: "描述" },
        ],
      },
    ],
  },
  {
    key: "galleryContent",
    label: "專業足跡",
    fields: [
      { kind: "string", key: "sectionTitle", label: "區塊標題" },
      { kind: "text", key: "sectionSubtitle", label: "區塊副標" },
      { kind: "text", key: "disclaimer", label: "免責聲明" },
      {
        kind: "list",
        key: "items",
        label: "照片項目",
        itemName: "照片",
        fields: [
          { kind: "string", key: "category", label: "分類" },
          { kind: "image", key: "image", label: "圖片" },
          { kind: "string", key: "alt", label: "Alt 文字" },
        ],
      },
    ],
  },
  {
    key: "faqContent",
    label: "常見問題",
    fields: [
      { kind: "string", key: "sectionTitle", label: "區塊標題" },
      { kind: "text", key: "sectionSubtitle", label: "區塊副標" },
      {
        kind: "list",
        key: "items",
        label: "問答",
        itemName: "問題",
        fields: [
          { kind: "string", key: "q", label: "問題" },
          { kind: "text", key: "a", label: "答案" },
        ],
      },
    ],
  },
  {
    key: "healthBlogContent",
    label: "健康專欄",
    fields: [
      { kind: "string", key: "sectionTitle", label: "區塊標題" },
      { kind: "text", key: "description", label: "描述" },
      { kind: "string", key: "comingSoonText", label: "即將推出文字" },
      { kind: "string", key: "ctaText", label: "CTA 文字" },
    ],
  },
  {
    key: "contactContent",
    label: "聯絡與預約",
    fields: [
      { kind: "string", key: "sectionTitle", label: "區塊標題" },
      { kind: "text", key: "sectionSubtitle", label: "區塊副標" },
      { kind: "string", key: "ctaText", label: "CTA 文字" },
      {
        kind: "object",
        key: "transport",
        label: "交通資訊",
        fields: [
          { kind: "string", key: "title", label: "標題" },
          { kind: "text", key: "description", label: "描述" },
          { kind: "string", key: "busInfo", label: "巴士資訊" },
        ],
      },
      {
        kind: "list",
        key: "clinicHours",
        label: "門診時間",
        itemName: "日期",
        fields: [
          { kind: "string", key: "day", label: "星期" },
          { kind: "string", key: "am", label: "上午" },
          { kind: "string", key: "pm", label: "下午" },
          { kind: "string", key: "eve", label: "晚上" },
        ],
      },
      { kind: "text", key: "hoursNote", label: "時間備註" },
      { kind: "string", key: "mapEmbedUrl", label: "地圖嵌入 URL", hint: "Google Maps 分享 → 嵌入地圖 → src 網址" },
    ],
  },
  {
    key: "footerContent",
    label: "頁尾",
    fields: [
      { kind: "text", key: "brandSlogan", label: "品牌標語" },
      {
        kind: "list",
        key: "quickLinks",
        label: "快速連結",
        itemName: "連結",
        fields: [
          { kind: "string", key: "label", label: "文字" },
          { kind: "string", key: "href", label: "連結" },
        ],
      },
      {
        kind: "list",
        key: "socialLinks",
        label: "社群連結",
        itemName: "平台",
        fields: [
          { kind: "string", key: "platform", label: "平台", hint: "facebook / youtube" },
          { kind: "string", key: "label", label: "標籤" },
          { kind: "string", key: "url", label: "URL", hint: "留空則不顯示" },
        ],
      },
      { kind: "text", key: "disclaimer", label: "免責聲明" },
    ],
  },
  {
    key: "tcmIntroContent",
    label: "中醫介紹",
    fields: [
      { kind: "string", key: "sectionTitle", label: "區塊標題" },
      { kind: "text", key: "sectionSubtitle", label: "區塊副標" },
      { kind: "string", key: "contentTitle", label: "內容標題" },
      { kind: "text", key: "content", label: "內容" },
      {
        kind: "list",
        key: "highlights",
        label: "亮點",
        itemName: "亮點",
        fields: [
          { kind: "string", key: "icon", label: "Icon", hint: ICON_HINT },
          { kind: "string", key: "title", label: "標題" },
          { kind: "string", key: "desc", label: "描述" },
        ],
      },
    ],
  },
];
