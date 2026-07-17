import { MessageCircle } from "lucide-react";
import { useContent } from "../lib/content";

export default function WhatsAppSticky() {
  const { getWhatsAppUrl } = useContent();
  return (
    <a
      href={getWhatsAppUrl()}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="WhatsApp 預約"
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-xl transition hover:scale-110 hover:shadow-2xl"
    >
      <MessageCircle className="h-7 w-7" />
    </a>
  );
}
