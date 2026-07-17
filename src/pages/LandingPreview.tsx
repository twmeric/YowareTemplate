import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  ShoppingCart,
  Menu,
  X,
  Facebook,
  Instagram,
  Youtube,
  MessageCircle,
  ArrowRight,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import ProductCard from "../components/ProductCard";
import { useContent } from "../hooks/useContent";
import type { Product, SocialLink, SiteContent } from "../types/content";

const socialIconMap: Record<string, React.ReactNode> = {
  facebook: <Facebook className="w-6 h-6" />,
  instagram: <Instagram className="w-6 h-6" />,
  youtube: <Youtube className="w-6 h-6" />,
};

const LandingPreview: React.FC = () => {
  const [searchParams] = useSearchParams();
  const isGenerated = searchParams.get("mode") === "generated";
  const publicId = searchParams.get("publicId");

  const fetched = useContent();
  const [generatedContent, setGeneratedContent] = useState<SiteContent | null>(null);
  const [generatedLoading, setGeneratedLoading] = useState(isGenerated);
  const [generatedError, setGeneratedError] = useState<string | null>(null);

  useEffect(() => {
    if (!isGenerated) return;

    try {
      const raw = localStorage.getItem("yoware_generated_content");
      if (raw) {
        const parsed = JSON.parse(raw) as SiteContent;
        setGeneratedContent(parsed);
      } else {
        setGeneratedError("找不到 AI 生成的內容，請重新提交表單。");
      }
    } catch (err) {
      setGeneratedError("讀取生成內容時發生錯誤。");
    } finally {
      setGeneratedLoading(false);
    }
  }, [isGenerated]);

  const content = isGenerated && generatedContent ? generatedContent : fetched.content;
  const loading = isGenerated ? generatedLoading : fetched.loading;
  const error = isGenerated ? generatedError : fetched.error;

  const [cart, setCart] = useState<Product[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (content?.brand?.name) {
      document.title = isGenerated
        ? `${content.brand.name} - AI 生成預覽`
        : content.brand.name;
    }
  }, [content, isGenerated]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setIsMenuOpen(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <div className="text-brand-green">載入中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <div className="text-brand-red text-center p-4">
          <p className="font-bold mb-2">內容載入失敗</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  const { brand, nav, hero, story, services, products, contact, footer } =
    content;

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text font-sans selection:bg-brand-green selection:text-white">
      {isGenerated && (
        <div className="fixed top-0 left-0 right-0 z-[60] bg-brand-green text-white px-4 py-3">
          <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-sm">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>
                這是 AI 根據你提供的資料生成的預覽頁面
                {publicId ? `（訂單編號：${publicId}）` : ""}
              </span>
            </div>
            <Link
              to="/templates"
              className="inline-flex items-center gap-1 underline hover:text-brand-red transition-colors"
            >
              回到模板列表 <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}

      {/* Header */}
      <header
        className={`fixed ${isGenerated ? "top-10" : "top-0"} left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? "bg-white shadow-md py-3" : "bg-transparent py-5"
        }`}
      >
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            {brand.logoImage ? (
              <img
                src={brand.logoImage}
                alt={brand.name}
                className="h-10 w-auto object-contain"
              />
            ) : (
              <div className="w-10 h-10 bg-brand-green rounded-full flex items-center justify-center text-white font-bold text-xl">
                {brand.logo}
              </div>
            )}
            <span className="text-xl font-bold tracking-tight text-brand-green">
              {brand.name}
            </span>
          </div>

          {/* Desktop Menu */}
          <nav className="hidden md:flex items-center gap-8">
            {nav.items.map((item) => (
              <button
                key={item.target}
                onClick={() => scrollToSection(item.target)}
                className="text-sm font-medium hover:text-brand-red transition-colors"
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <div className="relative group cursor-not-allowed opacity-50">
              <ShoppingCart className="w-6 h-6 text-brand-green" />
              <span className="absolute -top-2 -right-2 bg-brand-red text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                {cart.length}
              </span>
            </div>
            <button
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-white border-t border-gray-100 shadow-xl animate-in slide-in-from-top duration-300">
            <nav className="flex flex-col p-4 gap-4">
              {nav.items.map((item) => (
                <button
                  key={item.target}
                  onClick={() => scrollToSection(item.target)}
                  className="text-left py-2 text-lg font-medium border-b border-gray-50 last:border-0"
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
        )}
      </header>

      <main>
        {/* Hero Section */}
        <section
          id="hero"
          className={`relative ${isGenerated ? "pt-40" : "pt-32"} pb-20 md:pt-48 md:pb-32 overflow-hidden`}
        >
          <div className="container mx-auto px-4 flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1 text-center md:text-left z-10">
              <span className="inline-block px-3 py-1 bg-brand-green/10 text-brand-green rounded-full text-sm font-medium mb-6">
                {hero.badge}
              </span>
              <h1 className="text-4xl md:text-6xl font-bold text-brand-green leading-tight mb-6">
                {hero.titleLines.map((line, idx) => (
                  <React.Fragment key={idx}>
                    <span
                      className={
                        hero.highlightedLines.includes(idx)
                          ? "text-brand-red"
                          : undefined
                      }
                    >
                      {line}
                    </span>
                    {idx < hero.titleLines.length - 1 && <br />}
                  </React.Fragment>
                ))}
              </h1>
              <p className="text-lg text-gray-600 mb-10 max-w-xl">
                {hero.description}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                <button
                  onClick={() => scrollToSection(hero.primaryButton.target)}
                  className="px-8 py-4 bg-brand-green text-white rounded-full font-bold text-lg hover:bg-opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-green/20"
                >
                  {hero.primaryButton.label} <ArrowRight className="w-5 h-5" />
                </button>
                <button
                  onClick={() => scrollToSection(hero.secondaryButton.target)}
                  className="px-8 py-4 border-2 border-brand-green text-brand-green rounded-full font-bold text-lg hover:bg-brand-green hover:text-white transition-all"
                >
                  {hero.secondaryButton.label}
                </button>
              </div>
            </div>
            <div className="flex-1 relative">
              <div className="relative z-10 rounded-2xl overflow-hidden shadow-2xl transform rotate-2 hover:rotate-0 transition-transform duration-500">
                <img src={hero.image} alt={brand.name} className="w-full h-auto" />
              </div>
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-brand-red/10 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-brand-green/10 rounded-full blur-3xl"></div>
            </div>
          </div>
        </section>

        {/* Founder Section */}
        <section id="story" className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center gap-16">
              <div className="flex-1 order-2 md:order-1">
                <h2 className="text-3xl md:text-4xl font-bold text-brand-green mb-8">
                  {story.title}
                </h2>
                <div className="space-y-6 text-gray-600 leading-relaxed">
                  {story.paragraphs.map((p, idx) => (
                    <p key={idx}>{p}</p>
                  ))}
                </div>
                <div className="mt-10 grid grid-cols-2 gap-6">
                  {story.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <CheckCircle2 className="text-brand-red w-6 h-6" />
                      <span className="font-medium">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex-1 order-1 md:order-2">
                <div className="relative">
                  <img
                    src={story.image}
                    alt={story.title}
                    className="rounded-2xl shadow-xl"
                  />
                  <div className="absolute -bottom-6 -right-6 bg-brand-green text-white p-6 rounded-xl shadow-lg hidden md:block">
                    <p className="text-2xl font-serif italic">{story.quote}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Service Tags */}
        <section id="services" className="py-20 bg-brand-bg">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-brand-green mb-4">
                {services.title}
              </h2>
              <p className="text-gray-600">{services.subtitle}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {services.items.map((service, idx) => (
                <div
                  key={idx}
                  className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-all border border-gray-100 group"
                >
                  <div className="text-4xl mb-6 group-hover:scale-110 transition-transform duration-300">
                    {service.icon}
                  </div>
                  <h3 className="text-xl font-bold text-brand-green mb-4">
                    {service.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">{service.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Product Showcase */}
        <section id="products" className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-end justify-between mb-12 gap-6">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-brand-green mb-4">
                  {products.title}
                </h2>
                <p className="text-gray-600">{products.subtitle}</p>
              </div>
              <button className="text-brand-red font-bold flex items-center gap-2 hover:gap-3 transition-all">
                {products.viewAllText} <ArrowRight className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {products.items.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  whatsappNumber={contact.whatsapp.number}
                  onAddToCart={(p) => setCart([...cart, p])}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="py-20 bg-brand-green text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-8">
              {contact.title}
            </h2>
            <p className="text-xl mb-12 opacity-90 max-w-2xl mx-auto">
              {contact.description}
            </p>
            <a
              href={`https://wa.me/${contact.whatsapp.number}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-10 py-5 bg-white text-brand-green rounded-full font-bold text-xl hover:bg-opacity-90 transition-all shadow-xl"
            >
              <MessageCircle className="w-6 h-6" /> {contact.whatsapp.buttonText}
            </a>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white py-12 border-t border-gray-100">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2">
              {brand.logoImage ? (
                <img
                  src={brand.logoImage}
                  alt={brand.name}
                  className="h-8 w-auto object-contain"
                />
              ) : (
                <div className="w-8 h-8 bg-brand-green rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {brand.logo}
                </div>
              )}
              <span className="text-lg font-bold text-brand-green">
                {brand.name}
              </span>
            </div>

            <div className="flex gap-6">
              {footer.socialLinks.map((link: SocialLink, idx) => (
                <a
                  key={idx}
                  href={link.url}
                  className="text-gray-400 hover:text-brand-green transition-colors"
                  aria-label={link.platform}
                >
                  {socialIconMap[link.platform] || link.platform}
                </a>
              ))}
            </div>

            <p className="text-gray-400 text-sm">{footer.copyright}</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPreview;
