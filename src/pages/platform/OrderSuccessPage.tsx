import React, { useEffect, useState } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { CheckCircle2, Copy, Check, ArrowLeft } from "lucide-react";
import PlatformLayout from "./PlatformLayout";

interface OrderSuccessState {
  publicId?: string;
  orderId?: number;
}

const OrderSuccessPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const state = (location.state as OrderSuccessState) || {};
  const publicId = state.publicId || "—";

  useEffect(() => {
    if (!state.publicId) {
      navigate("/templates", { replace: true });
    }
  }, [state.publicId, navigate]);

  const handleCopy = async () => {
    if (!state.publicId) return;
    try {
      await navigator.clipboard.writeText(state.publicId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <PlatformLayout>
      <section className="py-12 md:py-24">
        <div className="container mx-auto px-4 max-w-xl">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 md:p-12 text-center">
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <h1 className="text-3xl font-bold text-brand-green mb-3">
              訂單已送出
            </h1>
            <p className="text-gray-600 mb-8">
              感謝您的提交！我們已收到您的需求，將盡快與您聯繫。
            </p>

            <div className="bg-brand-bg rounded-xl p-6 mb-8">
              <p className="text-sm text-gray-500 mb-2">訂單編號</p>
              <div className="flex items-center justify-center gap-3">
                <span className="text-2xl md:text-3xl font-bold text-brand-red tracking-wider">
                  {publicId}
                </span>
                <button
                  onClick={handleCopy}
                  className="p-2 rounded-lg hover:bg-white transition-colors text-brand-green"
                  aria-label="複製訂單編號"
                >
                  {copied ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </button>
              </div>
              {copied && (
                <p className="text-sm text-green-600 mt-2">已複製到剪貼簿</p>
              )}
            </div>

            <p className="text-sm text-gray-500 mb-8">
              請記下您的訂單編號，以便日後查詢進度。
            </p>

            <Link
              to="/templates"
              className="inline-flex items-center gap-2 px-8 py-4 bg-brand-green text-white rounded-full font-bold text-lg hover:bg-opacity-90 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" /> 返回模板列表
            </Link>
          </div>
        </div>
      </section>
    </PlatformLayout>
  );
};

export default OrderSuccessPage;
