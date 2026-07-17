import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, LayoutTemplate, Home, Eye } from "lucide-react";
import { useContent } from "../../hooks/useContent";

interface PlatformLayoutProps {
  children: React.ReactNode;
}

const PlatformLayout: React.FC<PlatformLayoutProps> = ({ children }) => {
  const { content } = useContent();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const brandName = content.brand?.name || "YowareTemplate";
    const routeTitles: Record<string, string> = {
      "/": "首頁",
      "/templates": "模板市集",
      "/preview": "預覽範例",
    };
    const routeTitle = routeTitles[location.pathname] || "";
    document.title = routeTitle ? `${brandName} - ${routeTitle}` : brandName;
  }, [location.pathname, content.brand?.name]);

  const brandName = content.brand?.name || "YowareTemplate";
  const brandLogo = content.brand?.logo || "Y";
  const brandLogoImage = content.brand?.logoImage;

  const navLinks = [
    { to: "/", label: "首頁", icon: Home },
    { to: "/templates", label: "模板", icon: LayoutTemplate },
    { to: "/preview", label: "預覽", icon: Eye },
  ];

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text font-sans selection:bg-brand-green selection:text-white flex flex-col">
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? "bg-white shadow-md py-3" : "bg-transparent py-5"
        }`}
      >
        <div className="container mx-auto px-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            {brandLogoImage ? (
              <img
                src={brandLogoImage}
                alt={brandName}
                className="h-10 w-auto object-contain"
              />
            ) : (
              <div className="w-10 h-10 bg-brand-green rounded-full flex items-center justify-center text-white font-bold text-xl">
                {brandLogo}
              </div>
            )}
            <span className="text-xl font-bold tracking-tight text-brand-green">
              {brandName}
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`text-sm font-medium transition-colors ${
                  isActive(link.to)
                    ? "text-brand-red"
                    : "hover:text-brand-red"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4 md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label={isMenuOpen ? "關閉選單" : "開啟選單"}
            >
              {isMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-white border-t border-gray-100 shadow-xl">
            <nav className="flex flex-col p-4 gap-4">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`flex items-center gap-3 py-2 text-lg font-medium border-b border-gray-50 last:border-0 ${
                      isActive(link.to) ? "text-brand-red" : ""
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1 pt-20 md:pt-24">{children}</main>

      <footer className="bg-white py-10 border-t border-gray-100">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              {brandLogoImage ? (
                <img
                  src={brandLogoImage}
                  alt={brandName}
                  className="h-8 w-auto object-contain"
                />
              ) : (
                <div className="w-8 h-8 bg-brand-green rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {brandLogo}
                </div>
              )}
              <span className="text-lg font-bold text-brand-green">
                {brandName}
              </span>
            </div>

            <nav className="flex items-center gap-6 text-sm text-gray-500">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="hover:text-brand-green transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} {brandName}. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PlatformLayout;
