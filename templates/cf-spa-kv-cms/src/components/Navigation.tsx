import { useEffect, useState } from "react";
import { Menu, X, MessageCircle } from "lucide-react";
import clsx from "clsx";
import { useContent } from "../lib/content";

export default function Navigation() {
  const { navigationContent, siteConfig, getWhatsAppUrl } = useContent();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={clsx(
        "fixed inset-x-0 top-0 z-40 transition-all duration-300",
        scrolled ? "bg-white/95 shadow-md backdrop-blur" : "bg-transparent"
      )}
    >
      <nav className="section-container flex h-20 items-center justify-between">
        <a href="#top" className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-pine-800 font-serif text-xl font-bold text-rice-100">
            徐
          </span>
          <span
            className={clsx(
              "font-serif text-lg font-bold leading-tight transition-colors",
              scrolled ? "text-pine-900" : "text-white"
            )}
          >
            {siteConfig.siteName}
            <span
              className={clsx(
                "block text-xs font-normal tracking-wider",
                scrolled ? "text-pine-600" : "text-rice-200"
              )}
            >
              {siteConfig.doctorName} {siteConfig.doctorTitle}
            </span>
          </span>
        </a>

        {/* Desktop links */}
        <div className="hidden items-center gap-8 lg:flex">
          {navigationContent.links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={clsx(
                "text-sm font-medium tracking-wide transition-colors",
                scrolled
                  ? "text-stone-700 hover:text-pine-700"
                  : "text-white/90 hover:text-white"
              )}
            >
              {link.label}
            </a>
          ))}
          <a
            href={getWhatsAppUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-pine-700 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-pine-600"
          >
            <MessageCircle className="h-4 w-4" />
            {navigationContent.ctaText}
          </a>
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          aria-label={isOpen ? "關閉選單" : "開啟選單"}
          onClick={() => setIsOpen(!isOpen)}
          className={clsx(
            "rounded-md p-2 lg:hidden",
            scrolled ? "text-pine-900" : "text-white"
          )}
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {isOpen && (
        <div className="border-t border-stone-100 bg-white shadow-lg lg:hidden">
          <div className="section-container flex flex-col gap-1 py-4">
            {navigationContent.links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="rounded-lg px-4 py-3 text-base font-medium text-stone-700 transition hover:bg-rice-50 hover:text-pine-700"
              >
                {link.label}
              </a>
            ))}
            <a
              href={getWhatsAppUrl()}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsOpen(false)}
              className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-pine-700 px-5 py-3 text-base font-medium text-white transition hover:bg-pine-600"
            >
              <MessageCircle className="h-5 w-5" />
              {navigationContent.ctaText}
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
