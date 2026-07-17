/**
 * 內容層（運行時版）
 *
 * 策略（工程學 margin of safety）：
 * 1. 先用隨站打包的預設 JSON 渲染（contentLoader.ts）— 零閃爍、API 壞了網站照樣能看
 * 2. 背景 fetch /api/content（Cloudflare KV）— 成功就即時換上最新內容，不用 rebuild
 */
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  siteConfig,
  navigationContent,
  heroContent,
  aboutContent,
  servicesContent,
  galleryContent,
  faqContent,
  healthBlogContent,
  contactContent,
  footerContent,
  tcmIntroContent,
} from "./contentLoader";

const defaultValues = {
  siteConfig,
  navigationContent,
  heroContent,
  aboutContent,
  servicesContent,
  galleryContent,
  faqContent,
  healthBlogContent,
  contactContent,
  footerContent,
  tcmIntroContent,
};

export type ContentValues = typeof defaultValues;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** 深合併：KV 資料優先，缺的 key 由預設補上；array 整組替換 */
function deepMerge<T>(defaults: T, stored: unknown): T {
  if (!isPlainObject(defaults) || !isPlainObject(stored)) {
    return stored === undefined ? defaults : (stored as T);
  }
  const result: Record<string, unknown> = { ...defaults };
  for (const [key, value] of Object.entries(stored)) {
    if (value === undefined) continue;
    const defaultValue = (defaults as Record<string, unknown>)[key];
    if (isPlainObject(defaultValue) && isPlainObject(value)) {
      result[key] = deepMerge(defaultValue, value);
    } else {
      result[key] = value;
    }
  }
  return result as T;
}

const ContentContext = createContext<ContentValues>(defaultValues);

export function ContentProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<ContentValues>(defaultValues);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/content");
        if (!res.ok) return;
        const data = await res.json();
        setContent(deepMerge(defaultValues, data));
      } catch {
        // API 失敗 → 靜默使用內建預設內容（網站不受影響）
      }
    };
    load();
  }, []);

  return <ContentContext.Provider value={content}>{children}</ContentContext.Provider>;
}

export function useContent() {
  const content = useContext(ContentContext);
  const getWhatsAppUrl = (message?: string) => {
    const msg = message || content.siteConfig.whatsappDefaultMessage;
    return `https://wa.me/${content.siteConfig.whatsappNumber}?text=${encodeURIComponent(msg)}`;
  };
  return { ...content, getWhatsAppUrl };
}
