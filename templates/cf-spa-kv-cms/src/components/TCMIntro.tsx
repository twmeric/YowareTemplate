import { useContent } from "../lib/content";
import Icon from "./Icon";

export default function TCMIntro() {
  const { tcmIntroContent } = useContent();
  return (
    <section className="bg-rice-50 py-20 sm:py-24">
      <div className="section-container">
        <div className="section-header">
          <h2 className="section-title">{tcmIntroContent.sectionTitle}</h2>
          <p className="section-subtitle">{tcmIntroContent.sectionSubtitle}</p>
        </div>

        <div className="mx-auto max-w-3xl">
          <h3 className="text-center font-serif text-2xl font-bold text-pine-900">
            {tcmIntroContent.contentTitle}
          </h3>
          <p className="mt-6 text-justify text-base leading-loose text-stone-700">
            {tcmIntroContent.content}
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {tcmIntroContent.highlights.map((item, index) => (
            <div key={index} className="card flex flex-col items-center text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-pine-100 text-pine-700">
                <Icon name={item.icon} className="h-6 w-6" />
              </span>
              <p className="mt-4 font-serif text-lg font-semibold text-pine-900">
                {item.title}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-stone-600">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
