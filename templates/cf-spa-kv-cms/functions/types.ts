export interface Env {
  CMS_KV: KVNamespace;
  JWT_SECRET: string;
  ADMIN_USER?: string;
  ADMIN_PASSWORD?: string;
  ASSETS: Fetcher;
}

export interface ContentData {
  siteConfig: Record<string, unknown>;
  navigationContent: Record<string, unknown>;
  heroContent: Record<string, unknown>;
  aboutContent: Record<string, unknown>;
  servicesContent: Record<string, unknown>;
  galleryContent: Record<string, unknown>;
  faqContent: Record<string, unknown>;
  healthBlogContent: Record<string, unknown>;
  contactContent: Record<string, unknown>;
  footerContent: Record<string, unknown>;
  tcmIntroContent: Record<string, unknown>;
  [key: string]: Record<string, unknown>;
}
