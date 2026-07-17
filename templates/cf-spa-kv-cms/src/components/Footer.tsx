import { Facebook, Youtube } from "lucide-react";
import { useContent } from "../lib/content";

const socialIcons: Record<string, typeof Facebook> = {
  facebook: Facebook,
  youtube: Youtube,
};

export default function Footer() {
  const { footerContent, siteConfig } = useContent();
  const activeSocialLinks = footerContent.socialLinks.filter((link) => link.url);
  const year = new Date().getFullYear();

  return (
    <footer className="bg-pine-950 text-rice-100">
      <div className="section-container grid gap-10 py-16 sm:grid-cols-2 lg:grid-cols-3">
        {/* Brand */}
        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-rice-100 font-serif text-xl font-bold text-pine-900">
              徐
            </span>
            <span className="font-serif text-lg font-bold">{siteConfig.siteName}</span>
          </div>
          <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-rice-200/80">
            {footerContent.brandSlogan}
          </p>
        </div>

        {/* Quick links */}
        <div>
          <h3 className="font-serif text-base font-semibold tracking-wide">快速連結</h3>
          <ul className="mt-4 space-y-2">
            {footerContent.quickLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="text-sm text-rice-200/80 transition hover:text-white"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Social + registration */}
        <div>
          <h3 className="font-serif text-base font-semibold tracking-wide">關注我們</h3>
          {activeSocialLinks.length > 0 ? (
            <ul className="mt-4 space-y-2">
              {activeSocialLinks.map((link) => {
                const SocialIcon = socialIcons[link.platform] ?? Facebook;
                return (
                  <li key={link.platform}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-rice-200/80 transition hover:text-white"
                    >
                      <SocialIcon className="h-4 w-4" />
                      {link.label}
                    </a>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-rice-200/60">社群專頁籌備中</p>
          )}
          <p className="mt-6 text-xs text-rice-200/60">
            註冊編號：{siteConfig.registrationNumber}
          </p>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="section-container flex flex-col items-center justify-between gap-3 py-6 text-xs text-rice-200/60 sm:flex-row">
          <p>
            © {year} {siteConfig.siteName}．版權所有
          </p>
          <p className="max-w-xl text-center sm:text-right">{footerContent.disclaimer}</p>
        </div>
      </div>
    </footer>
  );
}
