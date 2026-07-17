import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, LayoutTemplate, Home, Eye } from "lucide-react";

interface PlatformLayoutProps {
  children: React.ReactNode;
}

const BRAND_NAME = "JKDWebsite";
const BRAND_LOGO = "JKD";

const PlatformLayout: React.FC<PlatformLayoutProps> = ({ children }) => {
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
    const routeTitles: Record<string, string> = {
      "/": "首頁",
      "/templates": "模板市集",
      "/preview": "預覽範例",
    };
    const routeTitle = routeTitles[location.pathname] || "";
    document.title = routeTitle ? `${BRAND_NAME} - ${routeTitle}` : BRAND_NAME;
  }, [location.pathname]);

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
    <div className="min-h-screen bg-jkd-black text-jkd-gray-100 font-sans selection:bg-jkd-gold selection:text-jkd-black flex flex-col">
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${
          scrolled
            ? "bg-jkd-black-900/95 backdrop-blur-md border-jkd-gray-400/30 py-3"
            : "bg-transparent border-transparent py-5"
        }`}
      >
        <div className="container mx-auto px-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="h-10 px-3 bg-jkd-gold rounded-lg flex items-center justify-center text-jkd-black font-black text-sm tracking-tight">
              {BRAND_LOGO}
            </div>
            <span className="text-xl font-bold tracking-tight text-jkd-white">
              {BRAND_NAME}
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`text-sm font-medium transition-colors ${
                  isActive(link.to)
                    ? "text-jkd-gold"
                    : "text-jkd-gray-200 hover:text-jkd-gold"
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
              className="text-jkd-white"
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
          <div className="md:hidden absolute top-full left-0 right-0 bg-jkd-black-900 border-t border-jkd-gray-400/30 shadow-xl">
            <nav className="flex flex-col p-4 gap-4">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`flex items-center gap-3 py-2 text-lg font-medium border-b border-jkd-gray-400/20 last:border-0 ${
                      isActive(link.to) ? "text-jkd-gold" : "text-jkd-gray-100"
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

      <footer className="bg-jkd-black-900 border-t border-jkd-gray-400/20 py-10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="h-8 px-2.5 bg-jkd-gold rounded-lg flex items-center justify-center text-jkd-black font-black text-xs tracking-tight">
                {BRAND_LOGO}
              </div>
              <span className="text-lg font-bold text-jkd-white">
                {BRAND_NAME}
              </span>
            </div>

            <nav className="flex items-center gap-6 text-sm text-jkd-gray-300">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="hover:text-jkd-gold transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <p className="text-jkd-gray-300 text-sm">
              © {new Date().getFullYear()} {BRAND_NAME}. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PlatformLayout;
