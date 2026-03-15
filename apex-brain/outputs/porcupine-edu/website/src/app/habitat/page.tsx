import type { Metadata } from "next";
import Image from "next/image";
import { FadeIn, SlideIn } from "../components/AnimatedSection";

export const metadata: Metadata = {
  title: "Where Do Porcupines Live? Complete Habitat Guide | Porcupine Edu",
  description:
    "Complete guide to porcupine habitats across 6 continents. North America, South America, Africa, Europe, and Asia. Range maps, terrain, and elevation data.",
};

const HERO_IMG =
  "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1800&q=85&auto=format&fit=crop";

const habitats = [
  {
    region: "North America",
    species: "North American Porcupine (Erethizon dorsatum)",
    terrain: "Coniferous forests, mixed hardwoods, tundra edges, desert scrublands",
    range: "Alaska and northern Canada south to northern Mexico",
    elevation: "Sea level to 12,000+ ft (3,600 m)",
    image:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80&auto=format&fit=crop",
    details: [
      "The most adaptable porcupine species. Found from Alaskan tundra to Mexican deserts.",
      "In the northeast, they prefer mature hemlock and beech forests with rocky outcrops for denning.",
      "Western populations live in pine, spruce, and Douglas fir forests at high elevations.",
      "They den in hollow trees, rock crevices, abandoned buildings, and even under decks.",
      "In winter, a single porcupine stays near its den tree, stripping bark from several trees within a small radius rather than traveling through deep snow.",
      "Population density ranges from 4 to 20 individuals per square mile depending on habitat quality.",
    ],
  },
  {
    region: "South & Central America",
    species: "Brazilian, Bahia, Bicolor-spined, Mexican Hairy Dwarf, and others",
    terrain: "Tropical rainforests, cloud forests, Atlantic Forest fragments",
    range: "Southern Mexico through Argentina",
    elevation: "Sea level to 9,800 ft (3,000 m) in the Andes",
    image:
      "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=800&q=80&auto=format&fit=crop",
    details: [
      "South American porcupines are almost exclusively arboreal, spending their entire lives in the canopy.",
      "Their prehensile tails grip branches like a fifth limb, allowing acrobatic movement through the trees.",
      "The Bahia porcupine survives only in tiny fragments of Brazil's Atlantic Forest, which has been reduced to 12% of its original extent.",
      "Cloud forest species in the Andes live at elevations above 6,500 feet, in perpetual fog and mist.",
      "Deforestation is the primary threat. When forest patches become too small and isolated, populations can't sustain themselves.",
    ],
  },
  {
    region: "Africa",
    species: "African Crested, Cape Porcupine, and brush-tailed porcupines",
    terrain: "Savannas, grasslands, forests, rocky hillsides, semi-arid scrub",
    range: "Sub-Saharan Africa, North Africa (Morocco, Tunisia, Libya)",
    elevation: "Sea level to 11,500 ft (3,500 m)",
    image:
      "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=800&q=80&auto=format&fit=crop",
    details: [
      "African porcupines are ground-dwellers that dig extensive burrow systems used across generations.",
      "They prefer rocky, hilly terrain where natural caves and crevices supplement their dens.",
      "The Cape porcupine is found across most of sub-Saharan Africa, from sea level to high mountain grasslands.",
      "Brush-tailed porcupines (Atherurus) live in dense tropical forests and are smaller, more agile, and less heavily quilled than crested species.",
      "Human-wildlife conflict is growing as agricultural expansion pushes porcupines into crop fields.",
    ],
  },
  {
    region: "Europe",
    species: "African Crested Porcupine (introduced population)",
    terrain: "Mediterranean scrubland, rocky hillsides, oak forests",
    range: "Italy (mainland and Sicily)",
    elevation: "Sea level to 2,600 ft (800 m)",
    image:
      "https://images.unsplash.com/photo-1523531294919-4bcd7c65e216?w=800&q=80&auto=format&fit=crop",
    details: [
      "Italy is the only European country with a wild porcupine population.",
      "The species likely arrived during the Roman era, either naturally crossing from North Africa or introduced for arena entertainment.",
      "Italian porcupines live in Mediterranean macchia scrubland, rocky hillsides, and oak-chestnut forests.",
      "Their range has been expanding northward over the past century, possibly aided by warmer temperatures.",
      "They are legally protected in Italy and have no significant conservation threats in Europe.",
    ],
  },
  {
    region: "Asia",
    species: "Indian Crested, Malayan, Sumatran, Philippine, and others",
    terrain: "Tropical forests, grasslands, agricultural areas, rocky deserts",
    range: "Middle East through Southeast Asia, Indonesia, Philippines",
    elevation: "Sea level to 7,800 ft (2,400 m)",
    image:
      "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800&q=80&auto=format&fit=crop",
    details: [
      "Asian porcupines occupy the widest habitat diversity, from arid Middle Eastern deserts to dense tropical rainforests.",
      "The Indian crested porcupine lives in family groups and creates elaborate multi-room burrow networks, some used for decades.",
      "The Malayan porcupine is a crop pest in Southeast Asia, raiding plantations for sweet potatoes and cassava.",
      "Island endemics like the Sumatran and Philippine porcupines face severe habitat loss from palm oil plantations and logging.",
      "Long-tailed porcupines (Trichys) in Borneo and Sumatra have short, flat quills and are excellent climbers despite being in the Old World family.",
    ],
  },
];

export default function HabitatPage() {
  return (
    <main>
      {/* Hero */}
      <section className="relative h-[50vh] min-h-[400px] overflow-hidden bg-[var(--color-bark)]">
        <Image
          src={HERO_IMG}
          alt="Forest canopy, natural porcupine habitat"
          fill
          className="object-cover opacity-40"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-bark)] via-transparent to-transparent" />
        <div className="relative z-10 mx-auto flex h-full max-w-5xl flex-col justify-end px-8 pb-14">
          <FadeIn>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--color-sand)]">
              Habitat Guide
            </p>
            <h1
              className="mt-3 text-4xl font-bold text-[var(--color-cream)] sm:text-6xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Where Porcupines Live
            </h1>
            <p className="mt-4 max-w-lg text-lg text-[var(--color-lichen)]">
              From Alaskan tundra to Indonesian rainforests. A continent-by-continent
              guide to every porcupine habitat on Earth.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Global overview */}
      <section className="border-b border-[var(--color-bark)]/8 bg-[var(--color-cream)] px-8 py-16">
        <FadeIn>
          <div className="mx-auto max-w-3xl text-center">
            <h2
              className="text-2xl font-semibold text-[var(--color-bark)]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              6 Continents. 23 Species. Infinite Adaptability.
            </h2>
            <p className="mt-4 text-[var(--color-warm-gray)]">
              Porcupines live everywhere except Antarctica and Australia. They
              thrive from sea level to 12,000 feet, from tropical rainforests
              to semi-arid deserts. The key to their success: they eat what
              nobody else wants (bark) and nobody wants to eat them (quills).
            </p>
          </div>
        </FadeIn>
      </section>

      {/* Habitat sections */}
      <div className="mx-auto max-w-5xl px-8 py-20">
        {habitats.map((h, i) => (
          <div key={h.region} className="mb-24 last:mb-0">
            <SlideIn direction={i % 2 === 0 ? "left" : "right"}>
              {/* Region image */}
              <div className="hero-image-container overflow-hidden rounded-2xl">
                <div className="relative aspect-[21/9]">
                  <Image
                    src={h.image}
                    alt={`${h.region} landscape`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 1000px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute bottom-0 left-0 p-8">
                    <h2
                      className="text-3xl font-bold text-white sm:text-4xl"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      {h.region}
                    </h2>
                  </div>
                </div>
              </div>
            </SlideIn>

            <FadeIn>
              {/* Data grid */}
              <div className="mt-8 grid gap-6 rounded-2xl border border-[var(--color-bark)]/6 bg-white p-8 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-warm-gray)]">
                    Species
                  </p>
                  <p className="mt-2 text-sm font-medium text-[var(--color-bark)]">
                    {h.species}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-warm-gray)]">
                    Terrain
                  </p>
                  <p className="mt-2 text-sm text-[var(--color-bark-light)]">
                    {h.terrain}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-warm-gray)]">
                    Range
                  </p>
                  <p className="mt-2 text-sm text-[var(--color-bark-light)]">
                    {h.range}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-warm-gray)]">
                    Elevation
                  </p>
                  <p className="mt-2 text-sm text-[var(--color-bark-light)]">
                    {h.elevation}
                  </p>
                </div>
              </div>

              {/* Details */}
              <ul className="mt-6 space-y-3">
                {h.details.map((detail, j) => (
                  <li
                    key={j}
                    className="flex gap-4 rounded-xl px-4 py-3 transition hover:bg-[var(--color-cream)]"
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-forest)]" />
                    <p className="text-[var(--color-bark-light)] leading-relaxed">
                      {detail}
                    </p>
                  </li>
                ))}
              </ul>
            </FadeIn>

            {i < habitats.length - 1 && (
              <hr className="editorial-rule mt-20" />
            )}
          </div>
        ))}
      </div>

      {/* Conservation CTA */}
      <section className="bg-[var(--color-bark)] px-8 py-20">
        <FadeIn>
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--color-sand)]">
              Conservation
            </p>
            <h2
              className="mt-4 text-3xl font-bold text-[var(--color-cream)] sm:text-4xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Their Habitat Is Disappearing
            </h2>
            <p className="mx-auto mt-6 max-w-lg text-lg leading-relaxed text-[var(--color-lichen)]">
              Several porcupine species face habitat loss from deforestation,
              agriculture, and urbanization. The thin-spined porcupine of Brazil
              and the Sumatran porcupine are classified as Vulnerable. Supporting
              forest conservation directly protects these species and the
              ecosystems they maintain.
            </p>
          </div>
        </FadeIn>
      </section>
    </main>
  );
}
