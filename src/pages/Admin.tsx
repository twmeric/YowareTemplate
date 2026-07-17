import React, { useState, useEffect } from "react";
import { Save, LogOut, Loader2, AlertCircle, CheckCircle, Menu, Plus, Trash2, ArrowLeft, Share2, Check } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { login, logout, loadContent, saveContent, setToken, AdminAPIError, getTokenRole } from "../api/admin";
import ImageInput from "../components/admin/ImageInput";
import MediaLibrary from "../components/admin/MediaLibrary";
import type { SiteContent, Product, ServiceItem, NavItem, SocialLink } from "../types/content";

const DEFAULT_CONTENT: SiteContent = {
  brand: { name: "", logo: "", tagline: "" },
  nav: { items: [] },
  hero: {
    badge: "",
    titleLines: ["", "", ""],
    highlightedLines: [],
    description: "",
    primaryButton: { label: "", target: "" },
    secondaryButton: { label: "", target: "" },
    image: "",
  },
  story: { title: "", paragraphs: [""], features: [""], image: "", quote: "" },
  services: { title: "", subtitle: "", items: [] },
  products: { title: "", subtitle: "", viewAllText: "", items: [] },
  contact: { title: "", description: "", whatsapp: { number: "", buttonText: "" } },
  footer: { copyright: "", socialLinks: [] },
};

interface AdminProps {
  shared?: boolean;
}

const Admin: React.FC<AdminProps> = ({ shared = false }) => {
  document.title = "網站後台管理";
  const { slug } = useParams<{ slug?: string }>();
  const [token, setTokenState] = useState<string | null>(localStorage.getItem("jkd_admin_token"));
  const [role, setRole] = useState<"admin" | "demo" | null>(getTokenRole());
  const isDemo = role === "demo";
  const [password, setPassword] = useState("");
  const [content, setContent] = useState<SiteContent>(DEFAULT_CONTENT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [activeSection, setActiveSection] = useState("brand");
  const [shareCopied, setShareCopied] = useState(false);

  useEffect(() => {
    // Check for auto-login token in URL
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get("token");
    if (urlToken) {
      setToken(urlToken);
      setTokenState(urlToken);
      setRole(getTokenRole());
      // Clean token from URL
      window.history.replaceState({}, "", "/manage");
    }
  }, []);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    loadContent()
      .then((data) => {
        setContent(data);
        setLoading(false);
      })
      .catch((err) => {
        setMessage({ type: "error", text: err instanceof AdminAPIError ? err.message : "載入失敗" });
        if (err instanceof AdminAPIError && err.status === 401) {
          logout();
          setTokenState(null);
        }
        setLoading(false);
      });
  }, [token]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const t = await login(password);
      setTokenState(t);
      setRole(getTokenRole());
    } catch (err) {
      setMessage({ type: "error", text: err instanceof AdminAPIError ? err.message : "登入失敗" });
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await saveContent(content);
      setMessage({ type: "success", text: "儲存成功！網站將在 1-2 分鐘後自動更新。" });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof AdminAPIError ? err.message : "儲存失敗" });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    setTokenState(null);
    setRole(null);
    setContent(DEFAULT_CONTENT);
  };

  const handleShareManage = async () => {
    const url = slug ? `${window.location.origin}/man/${slug}` : `${window.location.origin}/man`;
    try {
      if (navigator.share) {
        await navigator.share({ title: document.title, url });
      } else {
        await navigator.clipboard.writeText(url);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2000);
      }
    } catch {
      try {
        await navigator.clipboard.writeText(url);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2000);
      } catch {
        // ignore
      }
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div>
              <h1 className="text-2xl font-bold text-brand-green">後台管理</h1>
              <p className="text-gray-500 mt-1">請輸入管理密碼或 Demo 密碼</p>
            </div>
            <button
              onClick={handleShareManage}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-brand-green border border-brand-green rounded-full hover:bg-brand-green hover:text-white transition-colors"
              title="分享此後台"
            >
              {shareCopied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
              {shareCopied ? "已複製" : "分享"}
            </button>
          </div>
          <div className="mb-6 p-3 bg-yellow-50 border border-yellow-100 rounded-lg">
            <p className="text-sm text-yellow-800">
              <span className="font-bold">Demo 密碼：</span>
              <span className="font-mono font-bold text-brand-green">demo123</span>
              <span className="block text-xs text-yellow-700 mt-1">分享給別人時，請一併提供此密碼。</span>
            </p>
          </div>
          {message && (
            <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${message.type === "error" ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
              {message.type === "error" ? <AlertCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
              {message.text}
            </div>
          )}
          <form onSubmit={handleLogin}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-brand-green"
              placeholder="Password"
              autoFocus
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-brand-green text-white rounded-lg font-medium hover:bg-opacity-90 transition-colors flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "登入"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-brand-green animate-spin" />
      </div>
    );
  }

  const updateField = <K extends keyof SiteContent>(section: K, value: SiteContent[K]) => {
    setContent((prev) => ({ ...prev, [section]: value }));
  };

  const sections = [
    { id: "brand", label: "品牌資訊" },
    { id: "nav", label: "導覽選單" },
    { id: "hero", label: "主視覺" },
    { id: "story", label: "品牌故事" },
    { id: "services", label: "服務" },
    { id: "products", label: "產品" },
    { id: "media", label: "媒體庫" },
    { id: "contact", label: "聯絡" },
    { id: "footer", label: "頁尾" },
  ];

  return (
    <div className="min-h-screen bg-brand-bg">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {!shared && (
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-green text-white rounded-full text-sm font-bold shadow-sm hover:bg-brand-red transition-colors animate-pulse"
                title="返回主頁"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">返回主頁</span>
              </Link>
            )}
            <div className="w-8 h-8 bg-brand-green rounded-full flex items-center justify-center text-white font-bold">
              {content.brand.logo || "A"}
            </div>
            <span className="font-bold text-brand-green">{content.brand.name || "網站後台"}</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving || isDemo}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                isDemo
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-brand-green text-white hover:bg-opacity-90"
              }`}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isDemo ? "Demo 模式僅供預覽" : saving ? "儲存中..." : "儲存"}
            </button>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-500 hover:text-brand-red transition-colors"
              title="登出"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Demo mode banner */}
      {isDemo && (
        <div className="bg-yellow-50 border-b border-yellow-100">
          <div className="container mx-auto px-4 py-3 flex items-center gap-2 text-yellow-800 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>
              你目前使用 <strong>Demo 後台</strong> 僅供預覽，所有變更不會儲存。如需完整權限請使用管理員帳號登入。
            </span>
          </div>
        </div>
      )}

      {/* Message */}
      {message && (
        <div className={`container mx-auto px-4 mt-4`}>
          <div className={`p-4 rounded-lg flex items-center gap-2 ${message.type === "error" ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
            {message.type === "error" ? <AlertCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
            {message.text}
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-6 flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <aside className="lg:w-48">
          <nav className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors ${
                  activeSection === s.id
                    ? "bg-brand-green text-white"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                {s.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Form */}
        <main className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          {activeSection === "brand" && (
            <BrandSection brand={content.brand} onChange={(v) => updateField("brand", v)} />
          )}
          {activeSection === "nav" && (
            <NavSection nav={content.nav} onChange={(v) => updateField("nav", v)} />
          )}
          {activeSection === "hero" && (
            <HeroSection hero={content.hero} onChange={(v) => updateField("hero", v)} />
          )}
          {activeSection === "story" && (
            <StorySection story={content.story} onChange={(v) => updateField("story", v)} />
          )}
          {activeSection === "services" && (
            <ServicesSection services={content.services} onChange={(v) => updateField("services", v)} />
          )}
          {activeSection === "products" && (
            <ProductsSection products={content.products} onChange={(v) => updateField("products", v)} />
          )}
          {activeSection === "contact" && (
            <ContactSection contact={content.contact} onChange={(v) => updateField("contact", v)} />
          )}
          {activeSection === "media" && (
            <MediaSection />
          )}
          {activeSection === "footer" && (
            <FooterSection footer={content.footer} onChange={(v) => updateField("footer", v)} />
          )}
        </main>
      </div>
    </div>
  );
};

// --- Sub-components ---

function inputClass() {
  return "w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green";
}

function labelClass() {
  return "block text-sm font-medium text-gray-700 mb-1";
}

const BrandSection: React.FC<{ brand: SiteContent["brand"]; onChange: (v: SiteContent["brand"]) => void }> = ({
  brand,
  onChange,
}) => (
  <div className="space-y-4">
    <h2 className="text-xl font-bold text-brand-green mb-4">品牌資訊</h2>
    <div>
      <label className={labelClass()}>品牌名稱</label>
      <input className={inputClass()} value={brand.name} onChange={(e) => onChange({ ...brand, name: e.target.value })} />
    </div>
    <div>
      <label className={labelClass()}>Logo 字母</label>
      <input className={inputClass()} value={brand.logo} onChange={(e) => onChange({ ...brand, logo: e.target.value })} />
    </div>
    <div>
      <label className={labelClass()}>Logo 圖片（選填，會覆蓋字母）</label>
      <ImageInput value={brand.logoImage || ""} onChange={(url) => onChange({ ...brand, logoImage: url })} />
    </div>
    <div>
      <label className={labelClass()}>英文標語</label>
      <input className={inputClass()} value={brand.tagline} onChange={(e) => onChange({ ...brand, tagline: e.target.value })} />
    </div>
  </div>
);

const NavSection: React.FC<{ nav: SiteContent["nav"]; onChange: (v: SiteContent["nav"]) => void }> = ({ nav, onChange }) => (
  <div>
    <h2 className="text-xl font-bold text-brand-green mb-4">導覽選單</h2>
    <div className="space-y-3">
      {nav.items.map((item, idx) => (
        <div key={idx} className="flex gap-3 items-start p-3 bg-gray-50 rounded-lg">
          <div className="flex-1">
            <label className={labelClass()}>名稱</label>
            <input className={inputClass()} value={item.label} onChange={(e) => {
              const items = [...nav.items];
              items[idx] = { ...item, label: e.target.value };
              onChange({ items });
            }} />
          </div>
          <div className="flex-1">
            <label className={labelClass()}>錨點 ID</label>
            <input className={inputClass()} value={item.target} onChange={(e) => {
              const items = [...nav.items];
              items[idx] = { ...item, target: e.target.value };
              onChange({ items });
            }} />
          </div>
          <button
            onClick={() => onChange({ items: nav.items.filter((_, i) => i !== idx) })}
            className="mt-6 p-2 text-red-500 hover:bg-red-50 rounded-lg"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
      <button
        onClick={() => onChange({ items: [...nav.items, { label: "", target: "" }] })}
        className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-brand-green hover:text-brand-green transition-colors"
      >
        <Plus className="w-4 h-4" /> 新增選單
      </button>
    </div>
  </div>
);

const HeroSection: React.FC<{ hero: SiteContent["hero"]; onChange: (v: SiteContent["hero"]) => void }> = ({ hero, onChange }) => (
  <div className="space-y-4">
    <h2 className="text-xl font-bold text-brand-green mb-4">主視覺 Hero</h2>
    <div>
      <label className={labelClass()}>徽章文字</label>
      <input className={inputClass()} value={hero.badge} onChange={(e) => onChange({ ...hero, badge: e.target.value })} />
    </div>
    <div>
      <label className={labelClass()}>標題行（每行一個）</label>
      {hero.titleLines.map((line, idx) => (
        <input key={idx} className={`${inputClass()} mb-2`} value={line} onChange={(e) => {
          const lines = [...hero.titleLines];
          lines[idx] = e.target.value;
          onChange({ ...hero, titleLines: lines });
        }} />
      ))}
    </div>
    <div>
      <label className={labelClass()}>描述</label>
      <textarea className={`${inputClass()} h-24`} value={hero.description} onChange={(e) => onChange({ ...hero, description: e.target.value })} />
    </div>
    <div>
      <label className={labelClass()}>主圖</label>
      <ImageInput value={hero.image} onChange={(url) => onChange({ ...hero, image: url })} />
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className={labelClass()}>主按鈕文字</label>
        <input className={inputClass()} value={hero.primaryButton.label} onChange={(e) => onChange({ ...hero, primaryButton: { ...hero.primaryButton, label: e.target.value } })} />
      </div>
      <div>
        <label className={labelClass()}>主按鈕目標</label>
        <input className={inputClass()} value={hero.primaryButton.target} onChange={(e) => onChange({ ...hero, primaryButton: { ...hero.primaryButton, target: e.target.value } })} />
      </div>
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className={labelClass()}>次要按鈕文字</label>
        <input className={inputClass()} value={hero.secondaryButton.label} onChange={(e) => onChange({ ...hero, secondaryButton: { ...hero.secondaryButton, label: e.target.value } })} />
      </div>
      <div>
        <label className={labelClass()}>次要按鈕目標</label>
        <input className={inputClass()} value={hero.secondaryButton.target} onChange={(e) => onChange({ ...hero, secondaryButton: { ...hero.secondaryButton, target: e.target.value } })} />
      </div>
    </div>
  </div>
);

const StorySection: React.FC<{ story: SiteContent["story"]; onChange: (v: SiteContent["story"]) => void }> = ({ story, onChange }) => (
  <div className="space-y-4">
    <h2 className="text-xl font-bold text-brand-green mb-4">品牌故事</h2>
    <div>
      <label className={labelClass()}>標題</label>
      <input className={inputClass()} value={story.title} onChange={(e) => onChange({ ...story, title: e.target.value })} />
    </div>
    <div>
      <label className={labelClass()}>段落</label>
      {story.paragraphs.map((p, idx) => (
        <textarea key={idx} className={`${inputClass()} h-20 mb-2`} value={p} onChange={(e) => {
          const paragraphs = [...story.paragraphs];
          paragraphs[idx] = e.target.value;
          onChange({ ...story, paragraphs });
        }} />
      ))}
      <button onClick={() => onChange({ ...story, paragraphs: [...story.paragraphs, ""] })} className="text-sm text-brand-green hover:underline">+ 新增段落</button>
    </div>
    <div>
      <label className={labelClass()}>特點</label>
      {story.features.map((f, idx) => (
        <input key={idx} className={`${inputClass()} mb-2`} value={f} onChange={(e) => {
          const features = [...story.features];
          features[idx] = e.target.value;
          onChange({ ...story, features });
        }} />
      ))}
    </div>
    <div>
      <label className={labelClass()}>圖片</label>
      <ImageInput value={story.image} onChange={(url) => onChange({ ...story, image: url })} />
    </div>
    <div>
      <label className={labelClass()}>引言</label>
      <textarea className={`${inputClass()} h-20`} value={story.quote} onChange={(e) => onChange({ ...story, quote: e.target.value })} />
    </div>
  </div>
);

const ServicesSection: React.FC<{ services: SiteContent["services"]; onChange: (v: SiteContent["services"]) => void }> = ({ services, onChange }) => (
  <div>
    <h2 className="text-xl font-bold text-brand-green mb-4">核心服務</h2>
    <div className="space-y-4">
      <div>
        <label className={labelClass()}>標題</label>
        <input className={inputClass()} value={services.title} onChange={(e) => onChange({ ...services, title: e.target.value })} />
      </div>
      <div>
        <label className={labelClass()}>副標題</label>
        <input className={inputClass()} value={services.subtitle} onChange={(e) => onChange({ ...services, subtitle: e.target.value })} />
      </div>
      {services.items.map((item, idx) => (
        <div key={idx} className="p-4 bg-gray-50 rounded-lg space-y-3">
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-700">服務 #{idx + 1}</span>
            <button onClick={() => onChange({ ...services, items: services.items.filter((_, i) => i !== idx) })} className="text-red-500 hover:bg-red-50 p-1 rounded">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <input className={inputClass()} placeholder="圖標 Emoji" value={item.icon} onChange={(e) => {
              const items = [...services.items];
              items[idx] = { ...item, icon: e.target.value };
              onChange({ ...services, items });
            }} />
            <input className={`${inputClass()} col-span-2`} placeholder="標題" value={item.title} onChange={(e) => {
              const items = [...services.items];
              items[idx] = { ...item, title: e.target.value };
              onChange({ ...services, items });
            }} />
          </div>
          <textarea className={`${inputClass()} h-20`} placeholder="描述" value={item.desc} onChange={(e) => {
            const items = [...services.items];
            items[idx] = { ...item, desc: e.target.value };
            onChange({ ...services, items });
          }} />
        </div>
      ))}
      <button
        onClick={() => onChange({ ...services, items: [...services.items, { icon: "", title: "", desc: "" }] })}
        className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-brand-green hover:text-brand-green transition-colors"
      >
        <Plus className="w-4 h-4" /> 新增服務
      </button>
    </div>
  </div>
);

const ProductsSection: React.FC<{ products: SiteContent["products"]; onChange: (v: SiteContent["products"]) => void }> = ({ products, onChange }) => (
  <div>
    <h2 className="text-xl font-bold text-brand-green mb-4">產品展示</h2>
    <div className="space-y-4">
      <div>
        <label className={labelClass()}>標題</label>
        <input className={inputClass()} value={products.title} onChange={(e) => onChange({ ...products, title: e.target.value })} />
      </div>
      <div>
        <label className={labelClass()}>副標題</label>
        <input className={inputClass()} value={products.subtitle} onChange={(e) => onChange({ ...products, subtitle: e.target.value })} />
      </div>
      {products.items.map((item, idx) => (
        <div key={idx} className="p-4 bg-gray-50 rounded-lg space-y-3">
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-700">產品 #{idx + 1}</span>
            <button onClick={() => onChange({ ...products, items: products.items.filter((_, i) => i !== idx) })} className="text-red-500 hover:bg-red-50 p-1 rounded">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input className={inputClass()} placeholder="ID" value={item.id} onChange={(e) => {
              const items = [...products.items];
              items[idx] = { ...item, id: e.target.value };
              onChange({ ...products, items });
            }} />
            <input className={inputClass()} placeholder="名稱" value={item.name} onChange={(e) => {
              const items = [...products.items];
              items[idx] = { ...item, name: e.target.value };
              onChange({ ...products, items });
            }} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input type="number" className={inputClass()} placeholder="價格" value={item.price} onChange={(e) => {
              const items = [...products.items];
              items[idx] = { ...item, price: Number(e.target.value) };
              onChange({ ...products, items });
            }} />
            <input type="number" className={inputClass()} placeholder="原價（選填）" value={item.originalPrice || ""} onChange={(e) => {
              const items = [...products.items];
              items[idx] = { ...item, originalPrice: e.target.value ? Number(e.target.value) : undefined };
              onChange({ ...products, items });
            }} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input className={inputClass()} placeholder="分類" value={item.category} onChange={(e) => {
              const items = [...products.items];
              items[idx] = { ...item, category: e.target.value };
              onChange({ ...products, items });
            }} />
            <input className={inputClass()} placeholder="標籤（選填）" value={item.tag || ""} onChange={(e) => {
              const items = [...products.items];
              items[idx] = { ...item, tag: e.target.value };
              onChange({ ...products, items });
            }} />
          </div>
          <ImageInput placeholder="圖片 URL" value={item.image} onChange={(url) => {
            const items = [...products.items];
            items[idx] = { ...item, image: url };
            onChange({ ...products, items });
          }} />
        </div>
      ))}
      <button
        onClick={() => onChange({ ...products, items: [...products.items, { id: "", name: "", price: 0, image: "", category: "" }] })}
        className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-brand-green hover:text-brand-green transition-colors"
      >
        <Plus className="w-4 h-4" /> 新增產品
      </button>
    </div>
  </div>
);

const ContactSection: React.FC<{ contact: SiteContent["contact"]; onChange: (v: SiteContent["contact"]) => void }> = ({ contact, onChange }) => (
  <div className="space-y-4">
    <h2 className="text-xl font-bold text-brand-green mb-4">聯絡我們</h2>
    <div>
      <label className={labelClass()}>標題</label>
      <input className={inputClass()} value={contact.title} onChange={(e) => onChange({ ...contact, title: e.target.value })} />
    </div>
    <div>
      <label className={labelClass()}>描述</label>
      <textarea className={`${inputClass()} h-24`} value={contact.description} onChange={(e) => onChange({ ...contact, description: e.target.value })} />
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className={labelClass()}>WhatsApp 號碼</label>
        <input className={inputClass()} value={contact.whatsapp.number} onChange={(e) => onChange({ ...contact, whatsapp: { ...contact.whatsapp, number: e.target.value } })} />
      </div>
      <div>
        <label className={labelClass()}>按鈕文字</label>
        <input className={inputClass()} value={contact.whatsapp.buttonText} onChange={(e) => onChange({ ...contact, whatsapp: { ...contact.whatsapp, buttonText: e.target.value } })} />
      </div>
    </div>
  </div>
);

const MediaSection: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div>
      <h2 className="text-xl font-bold text-brand-green mb-4">媒體庫</h2>
      <p className="text-gray-600 mb-4">在這裡統一管理上傳到 R2 的圖片。其他欄位的「媒體庫」按鈕也會開啟這個圖庫。</p>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-brand-green text-white rounded-lg font-medium hover:bg-opacity-90 transition-colors"
      >
        開啟媒體庫
      </button>
      <MediaLibrary isOpen={isOpen} onClose={() => setIsOpen(false)} onSelect={() => {}} />
    </div>
  );
};

const FooterSection: React.FC<{ footer: SiteContent["footer"]; onChange: (v: SiteContent["footer"]) => void }> = ({ footer, onChange }) => (
  <div className="space-y-4">
    <h2 className="text-xl font-bold text-brand-green mb-4">頁尾</h2>
    <div>
      <label className={labelClass()}>版權文字</label>
      <input className={inputClass()} value={footer.copyright} onChange={(e) => onChange({ ...footer, copyright: e.target.value })} />
    </div>
    <div>
      <label className={labelClass()}>社交連結</label>
      {footer.socialLinks.map((link, idx) => (
        <div key={idx} className="flex gap-3 mb-2">
          <select className={inputClass()} value={link.platform} onChange={(e) => {
            const links = [...footer.socialLinks];
            links[idx] = { ...link, platform: e.target.value };
            onChange({ ...footer, socialLinks: links });
          }}>
            {["facebook", "instagram", "youtube", "twitter", "linkedin"].map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <input className={`${inputClass()} flex-1`} placeholder="URL" value={link.url} onChange={(e) => {
            const links = [...footer.socialLinks];
            links[idx] = { ...link, url: e.target.value };
            onChange({ ...footer, socialLinks: links });
          }} />
          <button onClick={() => onChange({ ...footer, socialLinks: footer.socialLinks.filter((_, i) => i !== idx) })} className="text-red-500 hover:bg-red-50 p-2 rounded">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
      <button onClick={() => onChange({ ...footer, socialLinks: [...footer.socialLinks, { platform: "facebook", url: "" }] })} className="text-sm text-brand-green hover:underline">+ 新增連結</button>
    </div>
  </div>
);

export default Admin;
