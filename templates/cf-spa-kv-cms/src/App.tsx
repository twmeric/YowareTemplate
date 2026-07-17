import { ContentProvider } from "./lib/content";
import Navigation from "./components/Navigation";
import Hero from "./components/Hero";
import About from "./components/About";
import TCMIntro from "./components/TCMIntro";
import Services from "./components/Services";
import Gallery from "./components/Gallery";
import FAQ from "./components/FAQ";
import HealthBlog from "./components/HealthBlog";
import Contact from "./components/Contact";
import Footer from "./components/Footer";
import WhatsAppSticky from "./components/WhatsAppSticky";
import AdminPage from "./admin/AdminPage";

export default function App() {
  // 隱藏管理後台（母機 Rule 43）：直接輸入網址進入，不出現在公開導航
  if (window.location.pathname.startsWith("/admin")) {
    return <AdminPage />;
  }

  return (
    <ContentProvider>
      <div className="min-h-screen">
        <Navigation />
        <main>
          <Hero />
          <About />
          <TCMIntro />
          <Services />
          <Gallery />
          <FAQ />
          <HealthBlog />
          <Contact />
        </main>
        <Footer />
        <WhatsAppSticky />
      </div>
    </ContentProvider>
  );
}
