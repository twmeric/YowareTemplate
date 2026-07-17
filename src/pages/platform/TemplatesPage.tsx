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
        setError(null);
        const data = await listTemplates();
        if (!cancelled) setTemplates(data);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "載入模板時發生錯誤，請稍後再試"
          );
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
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-brand-green mb-4">
              選擇您的模板
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              瀏覽我們精選的網站模板，每款都針對不同行業與需求優化。
            </p>
          </div>

          {loading && (
            <div className="flex flex-col items-center justify-center py-20 text-brand-green">
              <Loader2 className="w-10 h-10 animate-spin mb-4" />
              <p className="text-gray-600">載入模板中...</p>
            </div>
          )}

          {error && (
            <div className="max-w-xl mx-auto bg-red-50 text-red-700 rounded-xl p-6 text-center">
              <p className="font-bold mb-2">無法載入模板</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          {!loading && !error && templates.length === 0 && (
            <div className="text-center py-20 text-gray-500">
              <LayoutTemplate className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">目前暫無模板</p>
              <p className="text-sm">請稍後再回來查看。</p>
            </div>
          )}

          {!loading && !error && templates.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {templates.map((template) => (
                <div
                  key={template.slug}
                  className="group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg transition-all"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
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
                    {template.isFeatured && (
                      <span className="absolute top-3 left-3 bg-brand-red text-white text-xs px-3 py-1 rounded-full font-medium">
                        精選
                      </span>
                    )}
                  </div>

                  <div className="p-6">
                    <h3 className="text-xl font-bold text-brand-green mb-2">
                      {template.name}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {template.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-brand-red font-bold text-lg">
                        {template.currency} {template.basePrice.toLocaleString()} 起
                      </span>
                      <Link
                        to={`/templates/${template.slug}`}
                        className="inline-flex items-center gap-1 text-sm font-medium text-brand-green hover:text-brand-red transition-colors"
                      >
                        查看詳情 <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </PlatformLayout>
  );
};

export default TemplatesPage;
