UPDATE templates
SET
  name = '日出咖啡 Sunrise Brew',
  description = '溫暖文青風格的咖啡廳與手作品牌 Landing Page 模板，適合餐飲、咖啡館、烘焙甜點與個人品牌。',
  thumbnail_url = 'https://pub-1424891a0bc54b758dea83d25b65a5d9.r2.dev/1784256552044-rr7u62ip.png',
  preview_url = '/preview',
  admin_url = '/man/landing-v1',
  template_type = 'landing',
  adapter_config = '{"adapter":"landing-v1","outputSchema":"SiteContent","defaultSections":["hero","story","services","products","contact"]}',
  wizard_schema = '[{"name":"brandName","type":"text","label":"品牌名稱","required":true},{"name":"industry","type":"select","label":"行業別","options":["餐飲","零售","服務","科技","其他"]},{"name":"brandTone","type":"textarea","label":"品牌語調 / 風格關鍵詞"},{"name":"styleRequirements","type":"textarea","label":"風格要求（例如：簡約、溫暖、高端、文青）"},{"name":"language","type":"select","label":"網站語言","options":["繁體中文","簡體中文","English","粵語"]},{"name":"sellingPoints","type":"textarea","label":"核心賣點 / 服務特色"},{"name":"targetAudience","type":"textarea","label":"目標客群"},{"name":"siteContactMethod","type":"textarea","label":"網站希望提供的聯絡方式"},{"name":"forbiddenWords","type":"textarea","label":"不希望出現的字詞或風格"},{"name":"additionalNotes","type":"textarea","label":"其他補充需求"}]'
WHERE slug = 'landing-v1';
