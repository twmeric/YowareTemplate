import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, ArrowRight, LayoutTemplate } from "lucide-react";
import PlatformLayout from "./PlatformLayout";
import { listTemplates, type TemplateSummary } from "../../api/platform";

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
      <section className="pt-16 pb-20 md:pt-20 md:pb-28">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-brand-green mb-4">
              模板市集
            </h1>
            <p className="text-gray-600">
              選擇最適合你品牌的模板，透過 AI 快速生成專屬網站。
            </p>
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

export default TemplatesPage;
