import { useContent } from "../lib/content";

export default function Gallery() {
  const { galleryContent } = useContent();
  return (
    <section id="gallery" className="bg-rice-50 py-20 sm:py-24">
      <div className="section-container">
        <div className="section-header">
          <h2 className="section-title">{galleryContent.sectionTitle}</h2>
          <p className="section-subtitle">{galleryContent.sectionSubtitle}</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {galleryContent.items.map((item, index) => (
            <figure
              key={index}
              className="group relative overflow-hidden rounded-2xl shadow-md"
            >
              <img
                src={item.image}
                alt={item.alt}
                loading="lazy"
                className="aspect-[4/3] w-full object-cover transition duration-500 group-hover:scale-105"
              />
              <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-pine-950/80 to-transparent p-4 pt-10">
                <span className="inline-block rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-pine-800">
                  {item.category}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>

        <p className="mx-auto mt-10 max-w-2xl text-center text-xs leading-relaxed text-stone-500">
          {galleryContent.disclaimer}
        </p>
      </div>
    </section>
  );
}
