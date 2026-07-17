import { useState } from "react";
import { ChevronDown } from "lucide-react";
import clsx from "clsx";
import { useContent } from "../lib/content";

export default function FAQ() {
  const { faqContent } = useContent();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="bg-white py-20 sm:py-24">
      <div className="section-container">
        <div className="section-header">
          <h2 className="section-title">{faqContent.sectionTitle}</h2>
          <p className="section-subtitle">{faqContent.sectionSubtitle}</p>
        </div>

        <div className="mx-auto max-w-3xl divide-y divide-stone-200 rounded-2xl bg-white shadow-md ring-1 ring-stone-100">
          {faqContent.items.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div key={index}>
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition hover:bg-rice-50"
                >
                  <span className="font-serif text-base font-semibold text-pine-900 sm:text-lg">
                    {item.q}
                  </span>
                  <ChevronDown
                    className={clsx(
                      "h-5 w-5 flex-shrink-0 text-pine-600 transition-transform duration-300",
                      isOpen && "rotate-180"
                    )}
                  />
                </button>
                <div
                  className={clsx(
                    "grid transition-all duration-300 ease-in-out",
                    isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  )}
                >
                  <div className="overflow-hidden">
                    <p className="px-6 pb-6 text-sm leading-relaxed text-stone-600 sm:text-base">
                      {item.a}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
