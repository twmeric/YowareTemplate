import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  Layers,
  Zap,
  Shield,
  Clock,
  Palette,
  Smartphone,
} from "lucide-react";
import PlatformLayout from "./PlatformLayout";

const HomePage: React.FC = () => {
  return (
    <PlatformLayout>
      {/* Hero */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-32 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <span className="inline-block px-4 py-1.5 bg-brand-green/10 text-brand-green rounded-full text-sm font-medium mb-6">
              快速打造專業網站
            </span>
            <h1 className="text-4xl md:text-6xl font-bold text-brand-green leading-tight mb-6">
              為您的品牌
              <span className="text-brand-red">一鍵生成</span>
              <br />
              高轉換 Landing Page
            </h1>
            <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
              從預覽到上線，只需幾個步驟。選擇模板、填寫品牌資料，專業團隊為您客製化完成。
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/templates"
                className="px-8 py-4 bg-brand-green text-white rounded-full font-bold text-lg hover:bg-opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-green/20"
              >
                瀏覽模板 <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/preview"
                className="px-8 py-4 border-2 border-brand-green text-brand-green rounded-full font-bold text-lg hover:bg-brand-green hover:text-white transition-all flex items-center justify-center"
              >
                預覽範例
              </Link>
            </div>
          </div>
        </div>

        <div className="absolute top-20 left-10 w-40 h-40 bg-brand-red/10 rounded-full blur-3xl -z-10"></div>
        <div className="absolute bottom-10 right-10 w-60 h-60 bg-brand-green/10 rounded-full blur-3xl -z-10"></div>
      </section>

      {/* Value Proposition */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-brand-green mb-4">
              為什麼選擇我們？
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              結合設計美學與商業轉換，我們不只給您一個網站，更給您一套線上獲客方案。
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Layers className="w-8 h-8" />,
                title: "精選模板",
                desc: "多種行業風格模板，皆經過轉換率優化，可直接套用。",
              },
              {
                icon: <Palette className="w-8 h-8" />,
                title: "品牌客製",
                desc: "根據您的品牌色調、語氣與賣點，打造獨一無二的視覺體驗。",
              },
              {
                icon: <Smartphone className="w-8 h-8" />,
                title: "行動優先",
                desc: "所有模板皆採用 RWD 設計，在手機上同樣流暢精美。",
              },
              {
                icon: <Zap className="w-8 h-8" />,
                title: "快速上線",
                desc: "從下單到交付平均 3-5 個工作天，讓您快速啟動業務。",
              },
              {
                icon: <Shield className="w-8 h-8" />,
                title: "穩定代管",
                desc: "使用全球邊緣網路託管，載入速度快且穩定可靠。",
              },
              {
                icon: <Clock className="w-8 h-8" />,
                title: "持續維護",
                desc: "提供後續調整與內容更新服務，讓網站隨業務成長。",
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="bg-brand-bg p-8 rounded-2xl border border-gray-100 hover:shadow-md transition-all group"
              >
                <div className="text-brand-green mb-5 group-hover:scale-110 transition-transform duration-300">
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold text-brand-green mb-3">
                  {item.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="py-20 bg-brand-bg">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-16">
            <div className="flex-1">
              <h2 className="text-3xl md:text-4xl font-bold text-brand-green mb-6">
                簡單四步，網站就緒
              </h2>
              <p className="text-gray-600 mb-10">
                無需懂程式或設計，只要跟著引導填寫，我們會幫您完成專業網站。
              </p>

              <div className="space-y-6">
                {[
                  { step: "01", title: "選擇模板", desc: "瀏覽並挑選最符合品牌形象的模板。" },
                  { step: "02", title: "填寫資料", desc: "透過引導式表單提供品牌與業務資訊。" },
                  { step: "03", title: "專家製作", desc: "設計與開發團隊依據資料進行客製化。" },
                  { step: "04", title: "上線發布", desc: "確認滿意後，網站即可正式對外發布。" },
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-4">
                    <div className="w-12 h-12 rounded-full bg-brand-green text-white flex items-center justify-center font-bold shrink-0">
                      {item.step}
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-brand-green">
                        {item.title}
                      </h4>
                      <p className="text-gray-600">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex-1 w-full">
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                <h3 className="text-xl font-bold text-brand-green mb-6">
                  平台特色
                </h3>
                <ul className="space-y-4">
                  {[
                    "一鍵預覽多種風格模板",
                    "引導式表單，減少來回溝通",
                    "自動儲存填寫進度",
                    "訂單狀態即時查詢",
                    "專人審核與客製調整",
                  ].map((text, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-brand-red shrink-0 mt-0.5" />
                      <span className="text-gray-700">{text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Teaser */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-brand-green mb-4">
            透明合理的價格
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto mb-12">
            無隱藏費用，依據模板與客製程度報價。下單後專人審核，確認需求再開始製作。
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                name: "起步版",
                price: "HK$ 2,800 起",
                desc: "適合個人品牌與小型店家",
                features: ["單頁 Landing Page", "行動版適配", "基礎 SEO"],
              },
              {
                name: "專業版",
                price: "HK$ 5,800 起",
                desc: "適合成長型企業",
                features: ["多區塊頁面", "品牌客製", "聯絡表單整合"],
              },
              {
                name: "進階版",
                price: "客製報價",
                desc: "適合有特殊需求的專案",
                features: ["多頁網站", "進階動效", "專屬功能開發"],
              },
            ].map((plan, idx) => (
              <div
                key={idx}
                className={`rounded-2xl p-8 border ${
                  idx === 1
                    ? "border-brand-green bg-brand-bg shadow-lg"
                    : "border-gray-100 bg-white"
                }`}
              >
                <h3 className="text-xl font-bold text-brand-green mb-2">
                  {plan.name}
                </h3>
                <p className="text-2xl font-bold text-brand-red mb-2">
                  {plan.price}
                </p>
                <p className="text-gray-500 text-sm mb-6">{plan.desc}</p>
                <ul className="space-y-3 text-left mb-8">
                  {plan.features.map((feature, fidx) => (
                    <li key={fidx} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-brand-green shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/templates"
                  className="block w-full py-3 rounded-lg font-medium transition-colors bg-brand-green text-white hover:bg-opacity-90"
                >
                  選擇模板
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-brand-green text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            準備好開始了嗎？
          </h2>
          <p className="text-xl mb-10 opacity-90 max-w-2xl mx-auto">
            瀏覽我們的模板，找到最適合您品牌的起點。
          </p>
          <Link
            to="/templates"
            className="inline-flex items-center gap-3 px-10 py-5 bg-white text-brand-green rounded-full font-bold text-xl hover:bg-opacity-90 transition-all shadow-xl"
          >
            立即瀏覽模板 <ArrowRight className="w-6 h-6" />
          </Link>
        </div>
      </section>
    </PlatformLayout>
  );
};

export default HomePage;
