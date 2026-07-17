import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Loader2,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  LayoutTemplate,
  Eye,
  Settings,
  Sparkles,
} from "lucide-react";
import PlatformLayout from "./PlatformLayout";
import SafeLink from "../../components/SafeLink";
import { getTemplate, type TemplateDetail } from "../../api/platform";

const DEMO_PASSWORD = "demo123";

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
      <section className="py-12 md:py-20 bg-jkd-black">
        <div className="container mx-auto px-4">
          <Link
            to="/templates"
            className="inline-flex items-center gap-2 text-jkd-gray-300 hover:text-jkd-gold transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" /> 返回模板列表
          </Link>

          {loading && (
            <div className="flex flex-col items-center justify-center py-20 text-jkd-gold">
              <Loader2 className="w-10 h-10 animate-spin mb-4" />
              <p className="text-jkd-gray-300">載入中...</p>
            </div>
          )}

          {error && (
            <div className="max-w-xl mx-auto bg-red-500/10 text-red-400 rounded-xl p-6 text-center">
              <p className="font-bold mb-2">無法載入模板</p>
              <p className="text-sm">{error}</p>
              <Link
                to="/templates"
                className="inline-block mt-4 text-jkd-gold hover:underline"
              >
                回到模板列表
              </Link>
            </div>
          )}

          {!loading && !error && template && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
              <div className="rounded-2xl overflow-hidden border border-jkd-gray-400/20 shadow-lg bg-jkd-black-800">
                {template.thumbnailUrl ? (
                  <img
                    src={template.thumbnailUrl}
                    alt={template.name}
                    className="w-full h-auto"
                  />
                ) : (
                  <div className="aspect-[4/3] flex items-center justify-center text-jkd-gray-300">
                    <LayoutTemplate className="w-20 h-20" />
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center gap-3 mb-4">
                  {template.isFeatured && (
                    <span className="bg-jkd-gold text-jkd-black text-xs px-3 py-1 rounded-full font-bold">
                      精選
                    </span>
                  )}
                  <span className="text-jkd-gold text-sm font-medium">
                    {template.currency}{template.basePrice.toLocaleString()}起
                  </span>
                </div>

                <h1 className="text-3xl md:text-4xl font-bold text-jkd-white mb-6">
                  {template.name}
                </h1>

                <p className="text-jkd-gray-300 text-lg leading-relaxed mb-8">
                  {template.description}
                </p>

                <div className="bg-jkd-black-800 border border-jkd-gray-400/20 rounded-xl p-6 mb-8">
                  <h3 className="text-lg font-bold text-jkd-white mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-jkd-gold" />
                    AI 會協助你填入的資料
                  </h3>
                  {template.wizardSchema && template.wizardSchema.length > 0 ? (
                    <ul className="space-y-3">
                      {template.wizardSchema.map((field) => (
                        <li key={field.name} className="flex items-start gap-3">
                          <CheckCircle2 className="w-5 h-5 text-jkd-gold shrink-0 mt-0.5" />
                          <span className="text-jkd-gray-200">
                            {field.label}
                            {field.required && (
                              <span className="text-jkd-gold ml-1">*</span>
                            )}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-jkd-gray-300 text-sm">暫無必填資料。</p>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 mb-8">
                  <SafeLink
                    to={template.previewUrl || `/pre/${template.slug}`}
                    className="flex-1 px-6 py-3 bg-jkd-black-700 border border-jkd-gray-400/20 text-jkd-white rounded-full font-bold hover:border-jkd-gold/50 hover:bg-jkd-black-900 transition-all flex items-center justify-center gap-2"
                  >
                    <Eye className="w-5 h-5 text-jkd-gold" />
                    預覽前台
                  </SafeLink>
                  <SafeLink
                    to={template.adminUrl || `/man/${template.slug}`}
                    className="flex-1 px-6 py-3 bg-jkd-black-700 border border-jkd-gray-400/20 text-jkd-white rounded-full font-bold hover:border-jkd-gold/50 hover:bg-jkd-black-900 transition-all flex items-center justify-center gap-2"
                  >
                    <Settings className="w-5 h-5 text-jkd-gold" />
                    體驗後台
                  </SafeLink>
                </div>

                <Link
                  to={`/start/${template.slug}`}
                  className="w-full sm:w-auto px-8 py-4 bg-jkd-gold text-jkd-black rounded-full font-bold text-lg hover:bg-jkd-gold-light transition-all flex items-center justify-center gap-2 shadow-lg shadow-jkd-gold/20"
                >
                  開始製作 <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </PlatformLayout>
  );
};

export default TemplateDetailPage;
