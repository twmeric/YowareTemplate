import { useContent } from "../lib/content";
import Icon from "./Icon";

export default function Hero() {
  const { heroContent, getWhatsAppUrl } = useContent();
  return (
    <section id="top" className="relative flex min-h-screen items-center justify-center">
      {/* Background */}
      <div className="absolute inset-0">
        <img
          src={heroContent.backgroundImage}
          alt="中醫養生背景"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-pine-950/80 via-pine-950/60 to-pine-950/80" />
      </div>

      {/* Content */}
      <div className="section-container relative z-10 pb-20 pt-32 text-center text-white">
        <p className="mb-4 text-sm font-medium uppercase tracking-[0.3em] text-rice-200">
          {heroContent.subheading}
        </p>
        <h1 className="mx-auto max-w-3xl text-4xl font-bold leading-snug sm:text-5xl lg:text-6xl">
          {heroContent.heading}
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-white/85 sm:text-lg">
          {heroContent.tagline}
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a
            href={getWhatsAppUrl(heroContent.primaryCta.message)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
          >
            {heroContent.primaryCta.text}
          </a>
          <a href={heroContent.secondaryCta.href} className="btn-secondary">
            {heroContent.secondaryCta.text}
          </a>
        </div>

        {/* Trust badges */}
        <div className="mt-16 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {heroContent.trustBadges.map((badge) => (
            <div key={badge.text} className="flex items-center gap-2 text-rice-100">
              <Icon name={badge.icon} className="h-5 w-5" />
              <span className="text-sm font-medium tracking-wide">{badge.text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
