import { useContent } from "../lib/content";
import Icon from "./Icon";

export default function Services() {
  const { servicesContent } = useContent();
  return (
    <section id="services" className="bg-white py-20 sm:py-24">
      <div className="section-container">
        <div className="section-header">
          <h2 className="section-title">{servicesContent.sectionTitle}</h2>
          <p className="section-subtitle">{servicesContent.sectionSubtitle}</p>
        </div>

        {/* Service cards */}
        <div className="grid gap-8 sm:grid-cols-2">
          {servicesContent.services.map((service) => (
            <div
              key={service.title}
              className="group overflow-hidden rounded-2xl bg-white shadow-md ring-1 ring-stone-100 transition hover:shadow-xl"
            >
              <div className="relative h-56 overflow-hidden">
                <img
                  src={service.image}
                  alt={service.imageAlt}
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
                <span className="absolute left-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-pine-700 shadow">
                  <Icon name={service.icon} className="h-5 w-5" />
                </span>
              </div>
              <div className="p-6">
                <h3 className="font-serif text-xl font-bold text-pine-900">
                  {service.title}
                </h3>
                <p className="mt-1 text-sm font-medium text-pine-600">{service.subtitle}</p>
                <p className="mt-3 text-sm leading-relaxed text-stone-600">{service.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Process steps */}
        <div className="mt-20">
          <div className="section-header">
            <h3 className="text-2xl font-bold text-pine-900 sm:text-3xl">
              {servicesContent.processTitle}
            </h3>
            <p className="section-subtitle">{servicesContent.processSubtitle}</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {servicesContent.processSteps.map((step) => (
              <div key={step.step} className="card relative text-center">
                <span className="absolute right-4 top-4 font-serif text-3xl font-bold text-rice-200">
                  {step.step}
                </span>
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-pine-700 text-white">
                  <Icon name={step.icon} className="h-6 w-6" />
                </span>
                <p className="mt-4 font-serif text-lg font-semibold text-pine-900">
                  {step.title}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-stone-600">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
