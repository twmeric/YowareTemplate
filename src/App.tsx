import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Admin from "./pages/Admin";
import LandingPreview from "./pages/LandingPreview";
import {
  HomePage,
  TemplatesPage,
  TemplateDetailPage,
  StartWizardPage,
  OrderSuccessPage,
  PlatformAdminPage,
  NotFoundPage,
} from "./pages/platform";

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/templates" element={<TemplatesPage />} />
        <Route path="/templates/:slug" element={<TemplateDetailPage />} />
        <Route path="/start/:slug" element={<StartWizardPage />} />
        <Route path="/order-success" element={<OrderSuccessPage />} />
        <Route path="/preview" element={<LandingPreview />} />
        <Route path="/pre/:slug?" element={<LandingPreview shared />} />
        <Route path="/manage" element={<Admin />} />
        <Route path="/man/:slug?" element={<Admin shared />} />
        <Route path="/platform-admin" element={<PlatformAdminPage />} />
        <Route path="/manage/*" element={<Admin />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
