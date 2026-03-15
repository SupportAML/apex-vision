import type { Metadata } from "next";
import Image from "next/image";
import {
  FadeIn,
  StaggerChildren,
  StaggerItem,
} from "../components/AnimatedSection";

export const metadata: Metadata = {
  title: "All 23 Porcupine Species — A Complete Field Guide | Porcupine Edu",
  description:
    "Complete visual guide to every porcupine species. Old World and New World porcupines with range, weight, habitat, and distinguishing traits.",
};

const HERO_IMG =
  "https://images.unsplash.com/photo-1511497584788-876760111969?w=1800&q=85&auto=format&fit=crop";

const oldWorld = [
  {
    name: "African Crested Porcupine",
    scientific: "Hystrix cristata",
    region: "North Africa, Sub-Saharan Africa, Italy",
    weight: "Up to 60 lbs (27 kg)",
    habitat: "Rocky hillsides, savannas, forest edges",
    trait: "The largest porcupine species. Has a dramatic mohawk-like crest of long quills on its head and neck that it raises when threatened. Its quills can exceed 20 inches.",
    conservation: "Least Concern",
  },
  {
    name: "Indian Crested Porcupine",
    scientific: "Hystrix indica",
    region: "Middle East, Central & South Asia",
    weight: "Up to 40 lbs (18 kg)",
    habitat: "Rocky areas, grasslands, forests",
    trait: "Lives in family groups of 2-5 and creates elaborate multi-chambered burrow systems. Pairs mate for life.",
    conservation: "Least Concern",
  },
  {
    name: "Cape Porcupine",
    scientific: "Hystrix africaeaustralis",
    region: "Southern & Central Africa",
    weight: "Up to 66 lbs (30 kg)",
    habitat: "Savanna, grassland, forest",
    trait: "The heaviest porcupine alive. Quills have distinct black and white banding. Rattle-quills on the tail produce a warning sound.",
    conservation: "Least Concern",
  },
  {
    name: "Malayan Porcupine",
    scientific: "Hystrix brachyura",
    region: "Southeast Asia, Nepal to Indonesia",
    weight: "Up to 18 lbs (8 kg)",
    habitat: "Tropical forests, agricultural areas",
    trait: "Stocky and adaptable. Often found near farms where it feeds on root crops, leading to human-wildlife conflict.",
    conservation: "Least Concern",
  },
  {
    name: "Sumatran Porcupine",
    scientific: "Hystrix sumatrae",
    region: "Sumatra (endemic)",
    weight: "Up to 12 lbs (5.4 kg)",
    habitat: "Tropical and subtropical forests",
    trait: "Endemic to Sumatra. Threatened by rapid deforestation and habitat fragmentation across the island.",
    conservation: "Vulnerable",
  },
  {
    name: "Philippine Porcupine",
    scientific: "Hystrix pumila",
    region: "Palawan, Busuanga (Philippines)",
    weight: "Up to 12 lbs (5.4 kg)",
    habitat: "Primary and secondary forests",
    trait: "Island endemic with extremely limited range. One of the least studied porcupine species in the world.",
    conservation: "Near Threatened",
  },
];

const newWorld = [
  {
    name: "North American Porcupine",
    scientific: "Erethizon dorsatum",
    region: "Alaska to Northern Mexico",
    weight: "Up to 30 lbs (14 kg)",
    habitat: "Coniferous/mixed forests, tundra, desert scrub",
    trait: "The only New World porcupine in North America. Excellent climber with textured paw pads. Known for vocalizing: whines, moans, and shrieks.",
    conservation: "Least Concern",
  },
  {
    name: "Brazilian Porcupine",
    scientific: "Coendou prehensilis",
    region: "South America (widespread)",
    weight: "Up to 11 lbs (5 kg)",
    habitat: "Tropical and subtropical forests",
    trait: "Fully arboreal with a strong prehensile tail that works like a fifth hand. Short, dense quills mixed with soft fur.",
    conservation: "Least Concern",
  },
  {
    name: "Mexican Hairy Dwarf Porcupine",
    scientific: "Coendou mexicanus",
    region: "Mexico, Central America",
    weight: "Up to 5.5 lbs (2.5 kg)",
    habitat: "Cloud forests, tropical forests",
    trait: "Covered in long, soft fur that almost completely hides its short quills. Rarely seen due to nocturnal arboreal lifestyle.",
    conservation: "Least Concern",
  },
  {
    name: "Bicolor-spined Porcupine",
    scientific: "Coendou bicolor",
    region: "Colombia, Ecuador, Peru, Bolivia",
    weight: "Up to 6.6 lbs (3 kg)",
    habitat: "Andean cloud forests, montane forests",
    trait: "Distinctive two-toned quills (dark base, light tip). Found at elevations up to 9,800 feet in the Andes.",
    conservation: "Least Concern",
  },
  {
    name: "Bahia Porcupine",
    scientific: "Coendou insidiosus",
    region: "Eastern Brazil (Atlantic Forest)",
    weight: "Up to 3 lbs (1.3 kg)",
    habitat: "Atlantic Forest fragments",
    trait: "One of the smallest and rarest porcupines. Restricted to vanishing Atlantic Forest fragments in eastern Brazil.",
    conservation: "Vulnerable",
  },
  {
    name: "Rothschild's Porcupine",
    scientific: "Coendou rothschildi",
    region: "Panama, Colombia, Ecuador",
    weight: "Up to 5 lbs (2.3 kg)",
    habitat: "Lowland tropical forests",
    trait: "Named after banker-zoologist Walter Rothschild. Rarely photographed in the wild due to its secretive nocturnal habits.",
    conservation: "Least Concern",
  },
];

function SpeciesCard({ species }: { species: (typeof oldWorld)[0] }) {
  const isVulnerable =
    species.conservation === "Vulnerable" ||
    species.conservation === "Near Threatened";

  return (
    <div className="card-lift group overflow-hidden rounded-2xl border border-[var(--color-bark)]/6 bg-white">
      <div className="p-7">
        <div className="flex items-start justify-between">
          <div>
            <h3
              className="text-xl font-bold text-[var(--color-bark)]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {species.name}
            </h3>
            <p className="mt-1 text-sm italic text-[var(--color-warm-gray)]">
              {species.scientific}
            </p>
          </div>
          <span
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
              isVulnerable
                ? "bg-red-50 text-red-700"
                : "bg-[var(--color-forest)]/10 text-[var(--color-forest)]"
            }`}
          >
            {species.conservation}
          </span>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-warm-gray)]">
              Range
            </p>
            <p className="mt-1 text-[var(--color-bark-light)]">
              {species.region}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-warm-gray)]">
              Weight
            </p>
            <p className="mt-1 text-[var(--color-bark-light)]">
              {species.weight}
            </p>
          </div>
          <div className="col-span-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-warm-gray)]">
              Habitat
            </p>
            <p className="mt-1 text-[var(--color-bark-light)]">
              {species.habitat}
            </p>
          </div>
        </div>

        <hr className="editorial-rule my-5" />

        <p className="text-sm leading-relaxed text-[var(--color-bark-light)]">
          {species.trait}
        </p>
      </div>
    </div>
  );
}

export default function SpeciesPage() {
  return (
    <main>
      {/* Hero */}
      <section className="relative h-[50vh] min-h-[400px] overflow-hidden bg-[var(--color-bark)]">
        <Image
          src={HERO_IMG}
          alt="Dense forest, porcupine habitat"
          fill
          className="object-cover opacity-40"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-bark)] via-transparent to-transparent" />
        <div className="relative z-10 mx-auto flex h-full max-w-5xl flex-col justify-end px-8 pb-14">
          <FadeIn>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--color-sand)]">
              Field Guide
            </p>
            <h1
              className="mt-3 text-4xl font-bold text-[var(--color-cream)] sm:text-6xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              All 23 Porcupine Species
            </h1>
            <p className="mt-4 max-w-lg text-lg text-[var(--color-lichen)]">
              Two families that evolved quills independently. From 3-pound
              tree-dwellers to 60-pound ground tanks.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Old World */}
      <section className="mx-auto max-w-6xl px-8 py-20">
        <FadeIn>
          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-[var(--color-bark)]/10" />
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--color-warm-gray)]">
              Family Hystricidae
            </p>
            <div className="h-px flex-1 bg-[var(--color-bark)]/10" />
          </div>
          <h2
            className="mt-6 text-center text-3xl font-bold text-[var(--color-bark)] sm:text-4xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Old World Porcupines
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-[var(--color-warm-gray)]">
            Ground-dwelling, larger, found across Africa, southern Europe, and
            Asia. They live in burrows and rocky dens, and their quills are
            longer and more dramatic.
          </p>
        </FadeIn>

        <StaggerChildren className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {oldWorld.map((s) => (
            <StaggerItem key={s.name}>
              <SpeciesCard species={s} />
            </StaggerItem>
          ))}
        </StaggerChildren>
      </section>

      <hr className="editorial-rule mx-auto max-w-6xl" />

      {/* New World */}
      <section className="mx-auto max-w-6xl px-8 py-20">
        <FadeIn>
          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-[var(--color-bark)]/10" />
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--color-warm-gray)]">
              Family Erethizontidae
            </p>
            <div className="h-px flex-1 bg-[var(--color-bark)]/10" />
          </div>
          <h2
            className="mt-6 text-center text-3xl font-bold text-[var(--color-bark)] sm:text-4xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            New World Porcupines
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-[var(--color-warm-gray)]">
            Arboreal, smaller, found across the Americas. Most have prehensile
            tails for gripping branches and spend their lives in the tree
            canopy.
          </p>
        </FadeIn>

        <StaggerChildren className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {newWorld.map((s) => (
            <StaggerItem key={s.name}>
              <SpeciesCard species={s} />
            </StaggerItem>
          ))}
        </StaggerChildren>
      </section>

      {/* Convergent evolution callout */}
      <section className="bg-[var(--color-forest)] px-8 py-20">
        <FadeIn>
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--color-lichen)]">
              Evolutionary Marvel
            </p>
            <h2
              className="mt-4 text-3xl font-bold text-[var(--color-cream)] sm:text-4xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Quills Evolved Twice
            </h2>
            <p className="mx-auto mt-6 max-w-lg text-lg leading-relaxed text-[var(--color-lichen)]">
              Old World and New World porcupines are not closely related. Their
              shared quill defense is a textbook case of{" "}
              <strong className="text-[var(--color-cream)]">
                convergent evolution
              </strong>
              : two unrelated groups independently evolving the same solution to
              the same problem. Nature found that quills work, and it found it
              twice.
            </p>
          </div>
        </FadeIn>
      </section>
    </main>
  );
}
