/**
 * 預設內容 = 隨站打包的 JSON（src/content/*.json）
 * KV 無資料或 API 異常時的 fallback（工程學 margin of safety）
 */
import siteData from "../../src/content/site.json";
import navigationData from "../../src/content/navigation.json";
import heroData from "../../src/content/hero.json";
import aboutData from "../../src/content/about.json";
import servicesData from "../../src/content/services.json";
import galleryData from "../../src/content/gallery.json";
import faqData from "../../src/content/faq.json";
import healthBlogData from "../../src/content/health-blog.json";
import contactData from "../../src/content/contact.json";
import footerData from "../../src/content/footer.json";
import tcmIntroData from "../../src/content/tcm-intro.json";
import type { ContentData } from "../types";

export const defaultContent: ContentData = {
  siteConfig: siteData,
  navigationContent: navigationData,
  heroContent: heroData,
  aboutContent: aboutData,
  servicesContent: servicesData,
  galleryContent: galleryData,
  faqContent: faqData,
  healthBlogContent: healthBlogData,
  contactContent: contactData,
  footerContent: footerData,
  tcmIntroContent: tcmIntroData,
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * 深合併：stored 優先，缺的 key 由 defaults 補上。
 * 注意：array 整組替換（內容列表不逐項合併，避免殘留舊項目）。
 */
export function deepMergeDefaults<T>(defaults: T, stored: unknown): T {
  if (!isPlainObject(defaults) || !isPlainObject(stored)) {
    return stored === undefined ? defaults : (stored as T);
  }
  const result: Record<string, unknown> = { ...defaults };
  for (const [key, value] of Object.entries(stored)) {
    if (value === undefined) continue;
    const defaultValue = (defaults as Record<string, unknown>)[key];
    if (isPlainObject(defaultValue) && isPlainObject(value)) {
      result[key] = deepMergeDefaults(defaultValue, value);
    } else {
      result[key] = value;
    }
  }
  return result as T;
}
