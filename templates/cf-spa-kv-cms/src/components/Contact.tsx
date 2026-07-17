import { MapPin, Bus, Clock, MessageCircle, Phone } from "lucide-react";
import { useContent } from "../lib/content";

export default function Contact() {
  const { contactContent, siteConfig, getWhatsAppUrl } = useContent();
  return (
    <section id="contact" className="bg-rice-50 py-20 sm:py-24">
      <div className="section-container">
        <div className="section-header">
          <h2 className="section-title">{contactContent.sectionTitle}</h2>
          <p className="section-subtitle">{contactContent.sectionSubtitle}</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Left: info */}
          <div className="space-y-6">
            {/* Address */}
            <div className="card">
              <div className="flex items-start gap-4">
                <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-pine-100 text-pine-700">
                  <MapPin className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-serif text-lg font-semibold text-pine-900">診所地址</h3>
                  <p className="mt-1 text-sm leading-relaxed text-stone-600">
                    {siteConfig.address}
                    {siteConfig.addressDetail && (
                      <span className="block text-stone-500">{siteConfig.addressDetail}</span>
                    )}
                  </p>
                  {siteConfig.phone && (
                    <p className="mt-2 inline-flex items-center gap-2 text-sm text-stone-600">
                      <Phone className="h-4 w-4" />
                      {siteConfig.phone}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Transport */}
            <div className="card">
              <div className="flex items-start gap-4">
                <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-pine-100 text-pine-700">
                  <Bus className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-serif text-lg font-semibold text-pine-900">
                    {contactContent.transport.title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-stone-600">
                    {contactContent.transport.description}
                  </p>
                  <p className="mt-1 text-sm text-stone-500">
                    {contactContent.transport.busInfo}
                  </p>
                </div>
              </div>
            </div>

            {/* Clinic hours */}
            <div className="card">
              <div className="flex items-start gap-4">
                <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-pine-100 text-pine-700">
                  <Clock className="h-5 w-5" />
                </span>
                <div className="flex-1">
                  <h3 className="font-serif text-lg font-semibold text-pine-900">門診時間</h3>
                  <table className="mt-3 w-full text-sm">
                    <thead>
                      <tr className="border-b border-stone-200 text-left text-stone-500">
                        <th className="pb-2 font-medium">星期</th>
                        <th className="pb-2 font-medium">上午</th>
                        <th className="pb-2 font-medium">下午</th>
                        <th className="pb-2 font-medium">晚上</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contactContent.clinicHours.map((row) => (
                        <tr key={row.day} className="border-b border-stone-100 last:border-0">
                          <td className="py-2 font-medium text-pine-900">{row.day}</td>
                          <td className="py-2 text-stone-600">{row.am}</td>
                          <td className="py-2 text-stone-600">{row.pm}</td>
                          <td className="py-2 text-stone-600">{row.eve}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="mt-3 text-xs leading-relaxed text-stone-500">
                    {contactContent.hoursNote}
                  </p>
                </div>
              </div>
            </div>

            {/* CTA */}
            <a
              href={getWhatsAppUrl(siteConfig.whatsappInquiryMessage)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary w-full sm:w-auto"
            >
              <MessageCircle className="h-5 w-5" />
              {contactContent.ctaText}
            </a>
          </div>

          {/* Right: map */}
          <div className="overflow-hidden rounded-2xl shadow-md ring-1 ring-stone-100">
            <iframe
              title="診所位置地圖"
              src={contactContent.mapEmbedUrl}
              className="h-full min-h-[420px] w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
        </div>
      </div>
    </section>
  );
}
