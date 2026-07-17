import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Loader2,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Send,
} from "lucide-react";
import PlatformLayout from "./PlatformLayout";
import { getTemplate, createOrder, type TemplateDetail } from "../../api/platform";
import { generateContent } from "../../api/ai";

type PreferredContact = "email" | "phone" | "whatsapp";

interface WizardData {
  name: string;
  email: string;
  phone: string;
  whatsapp: string;
  preferredContact: PreferredContact;
  answers: Record<string, string>;
  honeypot: string;
}

const DEFAULT_DATA: WizardData = {
  name: "",
  email: "",
  phone: "",
  whatsapp: "",
  preferredContact: "email",
  answers: {},
  honeypot: "",
};

const STORAGE_KEY = (slug: string) => `yoware_wizard_${slug}`;

const fieldOrderStep2 = [
  "industry",
  "brandName",
  "brandTone",
  "styleRequirements",
  "language",
];
const fieldOrderStep3 = [
  "sellingPoints",
  "targetAudience",
  "siteContactMethod",
  "forbiddenWords",
  "additionalNotes",
];

const StartWizardPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [template, setTemplate] = useState<TemplateDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [data, setData] = useState<WizardData>(DEFAULT_DATA);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

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
        const t = await getTemplate(slug);
        if (!cancelled) {
          setTemplate(t);
          const saved = localStorage.getItem(STORAGE_KEY(slug));
          if (saved) {
            try {
              const parsed = JSON.parse(saved) as WizardData;
              setData((prev) => ({ ...prev, ...parsed }));
            } catch {
              // ignore invalid saved data
            }
          }
        }
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
  }, [slug, navigate]);

  useEffect(() => {
    if (!slug) return;
    localStorage.setItem(STORAGE_KEY(slug), JSON.stringify(data));
  }, [data, slug]);

  const schemaMap = useMemo(() => {
    const map = new Map<string, { label: string; required?: boolean }>();
    template?.wizardSchema?.forEach((field) => {
      map.set(field.name, { label: field.label, required: field.required });
    });
    return map;
  }, [template]);

  const visibleStep2Fields = useMemo(() => {
    return fieldOrderStep2.filter((name) => schemaMap.has(name));
  }, [schemaMap]);

  const visibleStep3Fields = useMemo(() => {
    return fieldOrderStep3.filter((name) => schemaMap.has(name));
  }, [schemaMap]);

  const totalSteps = 2 + (visibleStep2Fields.length > 0 ? 1 : 0) + (visibleStep3Fields.length > 0 ? 1 : 0);

  const displayedStep = step;

  const updateData = (partial: Partial<WizardData>) => {
    setData((prev) => ({ ...prev, ...partial }));
    setFieldErrors({});
  };

  const updateAnswer = (name: string, value: string) => {
    setData((prev) => ({
      ...prev,
      answers: { ...prev.answers, [name]: value },
    }));
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const validateStep = (): boolean => {
    const errors: Record<string, string> = {};

    if (step === 1) {
      if (!data.name.trim()) errors.name = "請輸入聯絡人姓名";
      if (!data.email.trim()) {
        errors.email = "請輸入電子郵件";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        errors.email = "請輸入有效的電子郵件格式";
      }
      if (!data.phone.trim()) errors.phone = "請輸入聯絡電話";
      if (data.preferredContact === "whatsapp" && !data.whatsapp.trim()) {
        errors.whatsapp = "選擇 WhatsApp 時請輸入 WhatsApp 號碼";
      }
    }

    if (step === 2) {
      visibleStep2Fields.forEach((name) => {
        const meta = schemaMap.get(name);
        if (meta?.required && !data.answers[name]?.trim()) {
          errors[name] = `請輸入${meta.label}`;
        }
      });
    }

    if (step === 3) {
      visibleStep3Fields.forEach((name) => {
        const meta = schemaMap.get(name);
        if (meta?.required && !data.answers[name]?.trim()) {
          errors[name] = `請輸入${meta.label}`;
        }
      });
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    setStep((prev) => Math.min(prev + 1, totalSteps));
  };

  const handleBack = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const buildBrief = (): string => {
    const a = data.answers;
    const lines = [
      `# 客戶需求簡報`,
      ``,
      `行業別：${a.industry || "未提供"}`,
      `品牌名稱：${a.brandName || "未提供"}`,
      `品牌調性：${a.brandTone || "未提供"}`,
      `風格要求：${a.styleRequirements || "未提供"}`,
      `語言：${a.language || "繁體中文"}`,
      `核心賣點：`,
      ...(a.sellingPoints ? a.sellingPoints.split("\n") : ["未提供"]),
      `目標客群：${a.targetAudience || "未提供"}`,
      `聯絡方式：${a.siteContactMethod || "未提供"}`,
      `禁用詞：${a.forbiddenWords || "無"}`,
      `其他補充：${a.additionalNotes || "無"}`,
    ];
    return lines.join("\n");
  };

  const handleSubmit = async () => {
    if (!validateStep() || !slug || !template) return;
    if (data.honeypot) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      // 1. Generate content with AI
      const brief = buildBrief();
      const generated = await generateContent(brief);

      // 2. Save generated content for preview
      localStorage.setItem(
        "yoware_generated_content",
        JSON.stringify(generated.content)
      );

      // 3. Create order
      const result = await createOrder({
        templateSlug: slug,
        customer: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          whatsapp: data.whatsapp,
          preferredContact: data.preferredContact,
        },
        answers: data.answers,
        honeypot: data.honeypot,
      });

      // 4. Clear wizard draft
      if (slug) {
        localStorage.removeItem(STORAGE_KEY(slug));
      }

      // 5. Navigate to generated preview
      navigate(`/preview?mode=generated&publicId=${result.publicId}`, {
        replace: true,
      });
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "提交失敗，請稍後再試"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const renderContactStep = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-jkd-gray-200 mb-1">
            聯絡人姓名 <span className="text-jkd-gold">*</span>
          </label>
          <input
            type="text"
            value={data.name}
            onChange={(e) => updateData({ name: e.target.value })}
            className="w-full px-4 py-3 border border-jkd-gray-400/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-jkd-gold"
            placeholder="例如：王小明"
          />
          {fieldErrors.name && (
            <p className="mt-1 text-sm text-jkd-gold flex items-center gap-1">
              <AlertCircle className="w-4 h-4" /> {fieldErrors.name}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-jkd-gray-200 mb-1">
            電子郵件 <span className="text-jkd-gold">*</span>
          </label>
          <input
            type="email"
            value={data.email}
            onChange={(e) => updateData({ email: e.target.value })}
            className="w-full px-4 py-3 border border-jkd-gray-400/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-jkd-gold"
            placeholder="ming@example.com"
          />
          {fieldErrors.email && (
            <p className="mt-1 text-sm text-jkd-gold flex items-center gap-1">
              <AlertCircle className="w-4 h-4" /> {fieldErrors.email}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-jkd-gray-200 mb-1">
            聯絡電話 <span className="text-jkd-gold">*</span>
          </label>
          <input
            type="tel"
            value={data.phone}
            onChange={(e) => updateData({ phone: e.target.value })}
            className="w-full px-4 py-3 border border-jkd-gray-400/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-jkd-gold"
            placeholder="+852 9876 5432"
          />
          {fieldErrors.phone && (
            <p className="mt-1 text-sm text-jkd-gold flex items-center gap-1">
              <AlertCircle className="w-4 h-4" /> {fieldErrors.phone}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-jkd-gray-200 mb-1">
            WhatsApp 號碼
          </label>
          <input
            type="tel"
            value={data.whatsapp}
            onChange={(e) => updateData({ whatsapp: e.target.value })}
            className="w-full px-4 py-3 border border-jkd-gray-400/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-jkd-gold"
            placeholder="85298765432"
          />
          {fieldErrors.whatsapp && (
            <p className="mt-1 text-sm text-jkd-gold flex items-center gap-1">
              <AlertCircle className="w-4 h-4" /> {fieldErrors.whatsapp}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-jkd-gray-200 mb-1">
            偏好聯絡方式 <span className="text-jkd-gold">*</span>
          </label>
          <select
            value={data.preferredContact}
            onChange={(e) =>
              updateData({ preferredContact: e.target.value as PreferredContact })
            }
            className="w-full px-4 py-3 border border-jkd-gray-400/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-jkd-gold bg-jkd-black-800"
          >
            <option value="email">電子郵件</option>
            <option value="phone">電話</option>
            <option value="whatsapp">WhatsApp</option>
          </select>
        </div>
      </div>

      {/* Honeypot */}
      <div className="hidden" aria-hidden="true">
        <input
          type="text"
          value={data.honeypot}
          onChange={(e) => updateData({ honeypot: e.target.value })}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>
    </div>
  );

  const renderAnswerField = (name: string) => {
    const meta = schemaMap.get(name);
    if (!meta) return null;

    const label = (
      <label className="block text-sm font-medium text-jkd-gray-200 mb-1">
        {meta.label}
        {meta.required && <span className="text-jkd-gold ml-1">*</span>}
      </label>
    );

    const error = fieldErrors[name];

    return (
      <div key={name}>
        {label}
        {name === "industry" ? (
          <input
            type="text"
            value={data.answers[name] || ""}
            onChange={(e) => updateAnswer(name, e.target.value)}
            className="w-full px-4 py-3 border border-jkd-gray-400/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-jkd-gold"
            placeholder="例如：餐飲、零售、服務"
          />
        ) : name === "language" ? (
          <select
            value={data.answers[name] || ""}
            onChange={(e) => updateAnswer(name, e.target.value)}
            className="w-full px-4 py-3 border border-jkd-gray-400/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-jkd-gold bg-jkd-black-800"
          >
            <option value="">請選擇</option>
            <option value="繁體中文">繁體中文</option>
            <option value="簡體中文">簡體中文</option>
            <option value="英文">英文</option>
            <option value="中英雙語">中英雙語</option>
          </select>
        ) : (
          <textarea
            value={data.answers[name] || ""}
            onChange={(e) => updateAnswer(name, e.target.value)}
            className="w-full px-4 py-3 border border-jkd-gray-400/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-jkd-gold h-28"
            placeholder={`請輸入${meta.label}`}
          />
        )}
        {error && (
          <p className="mt-1 text-sm text-jkd-gold flex items-center gap-1">
            <AlertCircle className="w-4 h-4" /> {error}
          </p>
        )}
      </div>
    );
  };

  const renderReviewStep = () => (
    <div className="space-y-6">
      <div className="bg-jkd-black-800 rounded-xl p-6">
        <h3 className="text-lg font-bold text-jkd-gold mb-4">聯絡資料</h3>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-jkd-gray-300">姓名</dt>
            <dd className="font-medium">{data.name}</dd>
          </div>
          <div>
            <dt className="text-jkd-gray-300">電子郵件</dt>
            <dd className="font-medium">{data.email}</dd>
          </div>
          <div>
            <dt className="text-jkd-gray-300">電話</dt>
            <dd className="font-medium">{data.phone}</dd>
          </div>
          <div>
            <dt className="text-jkd-gray-300">偏好聯絡方式</dt>
            <dd className="font-medium">
              {data.preferredContact === "email" && "電子郵件"}
              {data.preferredContact === "phone" && "電話"}
              {data.preferredContact === "whatsapp" && "WhatsApp"}
            </dd>
          </div>
          {data.whatsapp && (
            <div>
              <dt className="text-jkd-gray-300">WhatsApp</dt>
              <dd className="font-medium">{data.whatsapp}</dd>
            </div>
          )}
        </dl>
      </div>

      {visibleStep2Fields.length > 0 && (
        <div className="bg-jkd-black-800 rounded-xl p-6">
          <h3 className="text-lg font-bold text-jkd-gold mb-4">品牌資訊</h3>
          <dl className="space-y-3 text-sm">
            {visibleStep2Fields.map((name) => {
              const meta = schemaMap.get(name);
              return (
                <div key={name}>
                  <dt className="text-jkd-gray-300">{meta?.label}</dt>
                  <dd className="font-medium whitespace-pre-wrap">
                    {data.answers[name] || "—"}
                  </dd>
                </div>
              );
            })}
          </dl>
        </div>
      )}

      {visibleStep3Fields.length > 0 && (
        <div className="bg-jkd-black-800 rounded-xl p-6">
          <h3 className="text-lg font-bold text-jkd-gold mb-4">業務內容</h3>
          <dl className="space-y-3 text-sm">
            {visibleStep3Fields.map((name) => {
              const meta = schemaMap.get(name);
              return (
                <div key={name}>
                  <dt className="text-jkd-gray-300">{meta?.label}</dt>
                  <dd className="font-medium whitespace-pre-wrap">
                    {data.answers[name] || "—"}
                  </dd>
                </div>
              );
            })}
          </dl>
        </div>
      )}
    </div>
  );

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return renderContactStep();
      case 2:
        if (visibleStep2Fields.length > 0) {
          return (
            <div className="space-y-6">
              {visibleStep2Fields.map((name) => renderAnswerField(name))}
            </div>
          );
        }
        return (
          <div className="space-y-6">
            {visibleStep3Fields.map((name) => renderAnswerField(name))}
          </div>
        );
      case 3:
        if (visibleStep2Fields.length > 0 && visibleStep3Fields.length > 0) {
          return (
            <div className="space-y-6">
              {visibleStep3Fields.map((name) => renderAnswerField(name))}
            </div>
          );
        }
        return renderReviewStep();
      case 4:
        return renderReviewStep();
      default:
        return null;
    }
  };

  const stepTitles = useMemo(() => {
    const titles = ["聯絡資料"];
    if (visibleStep2Fields.length > 0) titles.push("品牌資訊");
    if (visibleStep3Fields.length > 0) titles.push("業務內容");
    titles.push("確認與送出");
    return titles;
  }, [visibleStep2Fields.length, visibleStep3Fields.length]);

  return (
    <PlatformLayout>
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4 max-w-3xl">
          {loading && (
            <div className="flex flex-col items-center justify-center py-20 text-jkd-gold">
              <Loader2 className="w-10 h-10 animate-spin mb-4" />
              <p className="text-jkd-gray-300">載入中...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 text-red-400 rounded-xl p-6 text-center">
              <p className="font-bold mb-2">無法載入模板</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          {!loading && !error && template && (
            <>
              <div className="text-center mb-10">
                <h1 className="text-3xl md:text-4xl font-bold text-jkd-gold mb-3">
                  開始製作：{template.name}
                </h1>
                <p className="text-jkd-gray-300">
                  填寫以下資料，我們將依此為您客製化網站。
                </p>
              </div>

              {/* Progress */}
              <div className="mb-10">
                <div className="flex items-center justify-between mb-2">
                  {Array.from({ length: totalSteps }).map((_, idx) => {
                    const s = idx + 1;
                    const active = s === step;
                    const completed = s < step;
                    return (
                      <div key={s} className="flex flex-col items-center">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                            completed
                              ? "bg-jkd-gold text-white"
                              : active
                              ? "bg-jkd-gold text-white ring-4 ring-jkd-gold/20"
                              : "bg-jkd-gray-400 text-jkd-gray-300"
                          }`}
                        >
                          {completed ? (
                            <CheckCircle2 className="w-5 h-5" />
                          ) : (
                            s
                          )}
                        </div>
                        <span
                          className={`text-xs mt-2 hidden sm:block ${
                            active ? "text-jkd-gold font-medium" : "text-jkd-gray-300"
                          }`}
                        >
                          {stepTitles[idx]}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="h-2 bg-jkd-gray-400 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-jkd-gold transition-all duration-300"
                    style={{ width: `${((step - 1) / (totalSteps - 1)) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div className="bg-jkd-black-800 rounded-2xl shadow-sm border border-jkd-gray-400/20 p-6 md:p-10">
                <h2 className="text-xl font-bold text-jkd-gold mb-6">
                  {stepTitles[step - 1]}
                </h2>

                {renderStepContent()}

                {submitError && (
                  <div className="mt-6 p-4 bg-red-500/10 text-red-400 rounded-lg flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">提交失敗</p>
                      <p className="text-sm">{submitError}</p>
                    </div>
                  </div>
                )}

                <div className="mt-10 flex flex-col-reverse sm:flex-row gap-4 justify-between">
                  {step > 1 ? (
                    <button
                      onClick={handleBack}
                      disabled={submitting}
                      className="px-6 py-3 border border-gray-300 text-jkd-gray-200 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <ArrowLeft className="w-4 h-4" /> 上一步
                    </button>
                  ) : (
                    <div />
                  )}

                  {step < totalSteps ? (
                    <button
                      onClick={handleNext}
                      className="px-6 py-3 bg-jkd-gold text-white rounded-lg font-medium hover:bg-opacity-90 transition-colors flex items-center justify-center gap-2"
                    >
                      下一步 <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="px-6 py-3 bg-brand-red text-white rounded-lg font-medium hover:bg-opacity-90 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                    >
                      {submitting ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                      {submitting ? "送出中..." : "確認送出"}
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </PlatformLayout>
  );
};

export default StartWizardPage;
