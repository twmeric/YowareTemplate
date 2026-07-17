PRAGMA foreign_keys = ON;

-- 為模板增加獨立後台網址，支援多模板時導向各自的外部 CMS
ALTER TABLE templates ADD COLUMN admin_url TEXT;

-- 更新既有模板的後台網址（如存在）
UPDATE templates SET admin_url = '/manage' WHERE slug = 'landing-v1' AND admin_url IS NULL;

-- 註冊第二套模板：中醫診所 TCM CMS（cf-spa-kv-cms）
-- 部署後請將 preview_url 與 admin_url 替換為實際 Pages 網址
INSERT OR IGNORE INTO templates (
  slug,
  name,
  description,
  thumbnail_url,
  preview_url,
  admin_url,
  base_price,
  currency,
  wizard_schema,
  is_active,
  is_featured,
  sort_order
) VALUES (
  'tcm-v1',
  '明德中醫 TCM Clinic',
  '專業中醫診所單頁網站模板，包含醫師介紹、診療項目、常見問題、健康專欄與預約聯絡。適合中醫、針灸、推拿與養生品牌。',
  '/data/tcm-v1-thumbnail.png',
  'https://yowaretemplate-tcm.pages.dev',
  'https://yowaretemplate-tcm.pages.dev/admin',
  999,
  'HKD',
  '[{"name":"brandName","type":"text","label":"診所名稱","required":true},{"name":"doctorName","type":"text","label":"醫師姓名","required":true},{"name":"industry","type":"select","label":"行業別","options":["中醫","針灸","推拿","養生","醫療","其他"]},{"name":"brandTone","type":"textarea","label":"品牌語調 / 風格關鍵詞"},{"name":"styleRequirements","type":"textarea","label":"風格要求（例如：簡約、溫暖、高端、文青）"},{"name":"language","type":"select","label":"網站語言","options":["繁體中文","簡體中文","English","粵語"]},{"name":"sellingPoints","type":"textarea","label":"核心賣點 / 診療特色"},{"name":"targetAudience","type":"textarea","label":"目標客群"},{"name":"siteContactMethod","type":"textarea","label":"網站希望提供的聯絡方式"},{"name":"forbiddenWords","type":"textarea","label":"不希望出現的字詞或風格"},{"name":"additionalNotes","type":"textarea","label":"其他補充需求"}]',
  1,
  0,
  2
);

CREATE INDEX IF NOT EXISTS idx_templates_admin_url ON templates(admin_url);
