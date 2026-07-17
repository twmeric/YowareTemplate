import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, ArrowRight, LayoutTemplate, Eye, Settings } from "lucide-react";
import PlatformLayout from "./PlatformLayout";
import { listTemplates, type TemplateSummary } from "../../api/platform";

const DEMO_PASSWORD = "demo123";

const TemplatesPage: React.FC = () => {
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
      <section className="pt-16 pb-20 md:pt-20 md:pb-28 bg-jkd-black">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-jkd-white mb-4">
              選擇模板
            </h1>
            <p className="text-jkd-gray-300">
              先預覽實際效果，滿意後再用 AI 生成你的專屬網站。
            </p>
          </div>

          {loading && (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-jkd-gold" />
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 text-red-400 rounded-xl p-4 text-center">
              {error}
            </div>
          )}

          {!loading && !error && templates.length === 0 && (
            <div className="text-center py-16 text-jkd-gray-300">
              暫無上架模板
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <div
                key={template.slug}
                className="group bg-jkd-black-800 rounded-2xl border border-jkd-gray-400/20 overflow-hidden hover:border-jkd-gold/40 hover:shadow-2xl hover:shadow-jkd-gold/10 transition-all flex flex-col"
              >
                {/* 網頁縮圖預覽 */}
                <Link
                  to={template.previewUrl || "/preview"}
                  className="aspect-[4/3] bg-jkd-black-700 overflow-hidden relative block"
                >
                  {template.thumbnailUrl ? (
                    <img
                      src={template.thumbnailUrl}
                      alt={template.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-jkd-gray-300">
                      <LayoutTemplate className="w-12 h-12" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                </Link>

                <div className="p-6 flex flex-col flex-1">
                  <h3 className="text-lg font-bold text-jkd-white mb-2">
                    {template.name}
                  </h3>
                  <p className="text-jkd-gray-300 text-sm mb-5 line-clamp-2">
                    {template.description}
                  </p>

                  {/* 先體驗，再決定 */}
                  <div className="space-y-3 mb-5">
                    <Link
                      to={template.previewUrl || "/preview"}
                      className="flex items-center gap-3 p-3.5 bg-jkd-black-700 border border-jkd-gray-400/20 rounded-xl hover:border-jkd-gold/50 hover:bg-jkd-black-900 transition-all group/link"
                    >
                      <div className="w-10 h-10 bg-jkd-gold/10 text-jkd-gold rounded-full flex items-center justify-center group-hover/link:scale-110 transition-transform">
                        <Eye className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-jkd-white text-sm">預覽前台網站</p>
                        <p className="text-xs text-jkd-gray-300">看實際網頁效果</p>
                      </div>
                    </Link>

                    <Link
                      to="/manage"
                      className="flex items-center gap-3 p-3.5 bg-jkd-black-700 border border-jkd-gray-400/20 rounded-xl hover:border-jkd-gold/50 hover:bg-jkd-black-900 transition-all group/link"
                    >
                      <div className="w-10 h-10 bg-jkd-gold/10 text-jkd-gold rounded-full flex items-center justify-center group-hover/link:scale-110 transition-transform">
                        <Settings className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-jkd-white text-sm">體驗後台管理</p>
                        <p className="text-xs text-jkd-gray-300">Demo 密碼：{DEMO_PASSWORD}</p>
                      </div>
                    </Link>
                  </div>

                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-jkd-gray-400/20">
                    <span className="text-sm font-medium text-jkd-gold">
                      {template.currency} {template.basePrice?.toLocaleString() ?? 0} 起
                    </span>
                    <Link
                      to={`/templates/${template.slug}`}
                      className="inline-flex items-center gap-1 px-4 py-2 bg-jkd-gold text-jkd-black rounded-full text-sm font-bold hover:bg-jkd-gold-light transition-all"
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

export default TemplatesPage;
