import { useContent } from "../lib/content";

export default function About() {
  const { aboutContent, siteConfig } = useContent();
  return (
    <section id="about" className="bg-white py-20 sm:py-24">
      <div className="section-container">
        <div className="section-header">
          <h2 className="section-title">{aboutContent.sectionTitle}</h2>
          <p className="section-subtitle">{aboutContent.sectionSubtitle}</p>
        </div>

        <div className="grid items-start gap-12 lg:grid-cols-2">
          {/* Doctor photo */}
          <div className="relative">
            <div className="overflow-hidden rounded-2xl shadow-xl">
              <img
                src={aboutContent.doctorImage}
                alt={aboutContent.doctorImageAlt}
                className="aspect-[4/5] w-full object-cover"
              />
            </div>
            <div className="absolute -bottom-6 left-6 rounded-xl bg-pine-800 px-6 py-4 text-white shadow-lg">
              <p className="font-serif text-xl font-bold">{siteConfig.doctorName}</p>
              <p className="text-sm text-rice-200">{siteConfig.doctorTitle}</p>
            </div>
          </div>

          {/* Timeline */}
          <div>
            <h3 className="mb-6 text-xl font-bold text-pine-900">
              {aboutContent.timelineTitle}
            </h3>
            <ol className="relative border-l-2 border-pine-200 pl-6">
              {aboutContent.timeline.map((item, index) => (
                <li key={index} className="relative pb-6 last:pb-0">
                  <span className="absolute -left-[31px] top-1.5 h-3 w-3 rounded-full border-2 border-pine-600 bg-white" />
                  {item.year && (
                    <span className="mr-2 inline-block rounded-full bg-rice-100 px-2.5 py-0.5 text-xs font-semibold text-pine-800">
                      {item.year}
                    </span>
                  )}
                  <p className="mt-1 font-serif text-lg font-semibold text-pine-900">
                    {item.title}
                  </p>
                  <p className="mt-0.5 text-sm text-stone-600">{item.desc}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* Philosophy cards */}
        <h3 className="mb-8 mt-20 text-center text-xl font-bold text-pine-900">
          {aboutContent.philosophyTitle}
        </h3>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {aboutContent.philosophyCards.map((card) => (
            <div key={card.title} className="card text-center">
              <p className="font-serif text-2xl font-bold text-pine-800">{card.title}</p>
              <p className="mt-1 text-sm font-medium tracking-wide text-pine-600">
                {card.subtitle}
              </p>
              <p className="mt-4 text-sm leading-relaxed text-stone-600">{card.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
