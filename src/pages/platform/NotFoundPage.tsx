import React from "react";
import { Link } from "react-router-dom";
import { Home, SearchX } from "lucide-react";
import PlatformLayout from "./PlatformLayout";

const NotFoundPage: React.FC = () => {
  return (
    <PlatformLayout>
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4 text-center">
          <div className="w-24 h-24 bg-brand-bg text-brand-green rounded-full flex items-center justify-center mx-auto mb-8">
            <SearchX className="w-12 h-12" />
          </div>

          <h1 className="text-6xl md:text-8xl font-bold text-brand-green mb-4">
            404
          </h1>
          <h2 className="text-2xl md:text-3xl font-bold text-brand-green mb-4">
            找不到頁面
          </h2>
          <p className="text-gray-600 mb-10 max-w-md mx-auto">
            抱歉，您要找的頁面不存在或已被移除。
          </p>

          <Link
            to="/"
            className="inline-flex items-center gap-2 px-8 py-4 bg-brand-green text-white rounded-full font-bold text-lg hover:bg-opacity-90 transition-colors"
          >
            <Home className="w-5 h-5" /> 回到首頁
          </Link>
        </div>
      </section>
    </PlatformLayout>
  );
};

export default NotFoundPage;
