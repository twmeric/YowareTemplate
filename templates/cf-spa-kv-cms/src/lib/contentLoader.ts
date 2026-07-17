/**
 * Content Loader — CMS-Ready Data Layer
 * 
 * 目前使用靜態 JSON import（適合 Cloudflare Pages 靜態部署）。
 * 未來若要改用 API，只需修改此檔案，所有組件無需改動。
 */

import siteData from "../content/site.json";
import navigationData from "../content/navigation.json";
import heroData from "../content/hero.json";
import aboutData from "../content/about.json";
import servicesData from "../content/services.json";
import galleryData from "../content/gallery.json";
import faqData from "../content/faq.json";
import healthBlogData from "../content/health-blog.json";
import contactData from "../content/contact.json";
import footerData from "../content/footer.json";
import tcmIntroData from "../content/tcm-intro.json";

export {
  siteData as siteConfig,
  navigationData as navigationContent,
  heroData as heroContent,
  aboutData as aboutContent,
  servicesData as servicesContent,
  galleryData as galleryContent,
  faqData as faqContent,
  healthBlogData as healthBlogContent,
  contactData as contactContent,
  footerData as footerContent,
  tcmIntroData as tcmIntroContent,
};

export function getWhatsAppUrl(message?: string) {
  const msg = message || siteData.whatsappDefaultMessage;
  return `https://wa.me/${siteData.whatsappNumber}?text=${encodeURIComponent(msg)}`;
}
