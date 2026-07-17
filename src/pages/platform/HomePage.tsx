import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, ArrowRight, LayoutTemplate, Sparkles } from "lucide-react";
import PlatformLayout from "./PlatformLayout";
import { listTemplates, type TemplateSummary } from "../../api/platform";

const HomePage: React.FC = () => {
  const [templates, setTemplates] = useState<TemplateSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        const data = await listTemplates();
        if (!cancelled) {
          setTemplates(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "載入模板失敗");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <PlatformLayout>
      {/* Hero */}
      <section className="relative pt-16 pb-12 md:pt-24 md:pb-16 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-brand-green/10 text-brand-green rounded-full text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              AI 快速生成專業網站
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-brand-green leading-tight mb-5">
              選擇模板，填入品牌資料
              <span className="text-brand-red">AI 幫你完成網頁</span>
            </h1>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              挑選適合你品牌的模板，回答幾個簡單問題，AI 會即時生成完整 Landing Page 內容，並協助你完成最終交付。
            </p>
          </div>
        </div>

        <div className="absolute top-20 left-10 w-40 h-40 bg-brand-red/10 rounded-full blur-3xl -z-10"></div>
        <div className="absolute bottom-10 right-10 w-60 h-60 bg-brand-green/10 rounded-full blur-3xl -z-10"></div>
      </section>

      {/* Template Gallery */}
      <section className="pb-20 md:pb-28">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 mb-8">
            <LayoutTemplate className="w-5 h-5 text-brand-green" />
            <h2 className="text-xl font-bold text-brand-green">選擇模板</h2>
            <span className="text-sm text-gray-500 ml-auto">
              共 {templates.length} 款
            </span>
          </div>

          {loading && (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-brand-green" />
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-700 rounded-xl p-4 text-center">
              {error}
            </div>
          )}

          {!loading && !error && templates.length === 0 && (
            <div className="text-center py-16 text-gray-500">
              暫無上架模板
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <div
                key={template.slug}
                className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl transition-all"
              >
                <div className="aspect-[4/3] bg-brand-bg overflow-hidden">
                  {template.thumbnailUrl ? (
                    <img
                      src={template.thumbnailUrl}
                      alt={template.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <LayoutTemplate className="w-12 h-12" />
                    </div>
                  )}
                </div>

                <div className="p-6">
                  <h3 className="text-lg font-bold text-brand-green mb-2">
                    {template.name}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {template.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-brand-red">
                      {template.currency} {template.basePrice?.toLocaleString() ?? 0} 起
                    </span>
                    <Link
                      to={`/templates/${template.slug}`}
                      className="inline-flex items-center gap-1 px-4 py-2 bg-brand-green text-white rounded-full text-sm font-medium hover:bg-opacity-90 transition-all"
                    >
                      開始製作 <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PlatformLayout>
  );
};

export default HomePage;
