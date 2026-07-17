import { Newspaper, MessageCircle } from "lucide-react";
import { useContent } from "../lib/content";

export default function HealthBlog() {
  const { healthBlogContent, getWhatsAppUrl } = useContent();
  return (
    <section className="bg-pine-900 py-20 sm:py-24">
      <div className="section-container">
        <div className="mx-auto max-w-2xl text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-pine-700 text-rice-100">
            <Newspaper className="h-7 w-7" />
          </span>
          <h2 className="mt-6 text-3xl font-bold text-white sm:text-4xl">
            {healthBlogContent.sectionTitle}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-rice-200">
            {healthBlogContent.description}
          </p>

          <div className="mt-8 inline-block rounded-full border border-rice-300/40 px-6 py-2.5 font-serif text-lg font-semibold tracking-widest text-rice-100">
            {healthBlogContent.comingSoonText}
          </div>

          <p className="mt-8 text-sm text-rice-200/80">{healthBlogContent.ctaText}</p>
          <a
            href={getWhatsAppUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-medium text-pine-800 transition hover:bg-rice-100"
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp 聯絡我們
          </a>
        </div>
      </div>
    </section>
  );
}
