import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Loader2,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  LayoutTemplate,
  Eye,
} from "lucide-react";
import PlatformLayout from "./PlatformLayout";
import { getTemplate, type TemplateDetail } from "../../api/platform";

const TemplateDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [template, setTemplate] = useState<TemplateDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      navigate("/templates", { replace: true });
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getTemplate(slug);
        if (!cancelled) setTemplate(data);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "載入模板詳情時發生錯誤，請稍後再試"
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
  }, [slug, navigate]);

  return (
    <PlatformLayout>
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4">
          <Link
            to="/templates"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-brand-green transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" /> 返回模板列表
          </Link>

          {loading && (
            <div className="flex flex-col items-center justify-center py-20 text-brand-green">
              <Loader2 className="w-10 h-10 animate-spin mb-4" />
              <p className="text-gray-600">載入中...</p>
            </div>
          )}

          {error && (
            <div className="max-w-xl mx-auto bg-red-50 text-red-700 rounded-xl p-6 text-center">
              <p className="font-bold mb-2">無法載入模板</p>
              <p className="text-sm">{error}</p>
              <Link
                to="/templates"
                className="inline-block mt-4 text-brand-green hover:underline"
              >
                回到模板列表
              </Link>
            </div>
          )}

          {!loading && !error && template && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
              <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-lg bg-white">
                {template.thumbnailUrl ? (
                  <img
                    src={template.thumbnailUrl}
                    alt={template.name}
                    className="w-full h-auto"
                  />
                ) : (
                  <div className="aspect-[4/3] flex items-center justify-center text-gray-300">
                    <LayoutTemplate className="w-20 h-20" />
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center gap-3 mb-4">
                  {template.isFeatured && (
                    <span className="bg-brand-red text-white text-xs px-3 py-1 rounded-full font-medium">
                      精選
                    </span>
                  )}
                  <span className="text-gray-500 text-sm">
                    {template.currency} {template.basePrice.toLocaleString()} 起
                  </span>
                </div>

                <h1 className="text-3xl md:text-4xl font-bold text-brand-green mb-6">
                  {template.name}
                </h1>

                <p className="text-gray-600 text-lg leading-relaxed mb-8">
                  {template.description}
                </p>

                <div className="bg-brand-bg rounded-xl p-6 mb-8">
                  <h3 className="text-lg font-bold text-brand-green mb-4">
                    需要填寫的資料
                  </h3>
                  {template.wizardSchema && template.wizardSchema.length > 0 ? (
                    <ul className="space-y-3">
                      {template.wizardSchema.map((field) => (
                        <li key={field.name} className="flex items-start gap-3">
                          <CheckCircle2 className="w-5 h-5 text-brand-green shrink-0 mt-0.5" />
                          <span className="text-gray-700">
                            {field.label}
                            {field.required && (
                              <span className="text-brand-red ml-1">*</span>
                            )}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500 text-sm">暫無必填資料。</p>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Link
                    to={`/start/${template.slug}`}
                    className="px-8 py-4 bg-brand-green text-white rounded-full font-bold text-lg hover:bg-opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-green/20"
                  >
                    開始製作 <ArrowRight className="w-5 h-5" />
                  </Link>

                  {template.previewUrl && (
                    <Link
                      to={template.previewUrl}
                      className="px-8 py-4 border-2 border-brand-green text-brand-green rounded-full font-bold text-lg hover:bg-brand-green hover:text-white transition-all flex items-center justify-center gap-2"
                    >
                      <Eye className="w-5 h-5" /> 預覽效果
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </PlatformLayout>
  );
};

export default TemplateDetailPage;
