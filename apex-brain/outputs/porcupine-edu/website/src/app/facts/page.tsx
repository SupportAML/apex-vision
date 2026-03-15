import type { Metadata } from "next";
import Image from "next/image";
import {
  FadeIn,
  StaggerChildren,
  StaggerItem,
} from "../components/AnimatedSection";

export const metadata: Metadata = {
  title: "50 Fascinating Porcupine Facts | Porcupine Edu",
  description:
    "The ultimate list of porcupine facts. Quills, behavior, diet, defense mechanisms, reproduction, and surprising trivia about these incredible rodents.",
};

const HERO_IMG =
  "https://images.unsplash.com/photo-1585095595205-e68428a9e205?w=1800&q=85&auto=format&fit=crop";

const sections = [
  {
    title: "Quills & Defense",
    image:
      "https://images.unsplash.com/photo-1504006833117-8886a355efbf?w=800&q=80&auto=format&fit=crop",
    facts: [
      "A porcupine has around 30,000 quills covering its body. They cover everything except the belly, face, and inner legs.",
      "Quills are modified hairs made of keratin, the same protein in your fingernails. They're hollow, which makes them lightweight.",
      "Each quill tip has microscopic barbs (up to 800 per quill) that expand on contact, making removal extremely painful.",
      "Porcupines absolutely cannot shoot their quills. This is the most common myth. Quills detach on contact because they're loosely anchored.",
      "Lost quills grow back within weeks. A porcupine is never permanently disarmed.",
      "Porcupine quills contain a natural fatty acid coating with antibiotic properties, preventing infection when they accidentally poke themselves.",
      "Baby porcupines are born with soft quills that harden within hours of birth, protecting the mother during delivery.",
      "When threatened, porcupines turn their back to the predator, raise their quills, stomp their feet, and click their teeth. This is a warning, not aggression.",
    ],
  },
  {
    title: "Diet & Behavior",
    image:
      "https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&q=80&auto=format&fit=crop",
    facts: [
      "Porcupines are strict herbivores. They eat bark, stems, leaves, fruits, nuts, and roots depending on season and species.",
      "They have an intense craving for salt and minerals. They'll gnaw on tool handles, boots, plywood, and even road signs that have absorbed road salt.",
      "In harsh winters, North American porcupines survive almost entirely on the inner bark (cambium layer) of hemlock and pine trees.",
      "Most species are nocturnal, spending days sleeping in tree hollows, rock crevices, or underground dens.",
      "Porcupines are generally solitary, but will share dens in winter for warmth. Up to 12 have been found in a single den.",
      "Their eyesight is poor, but their sense of smell is excellent. They locate food and detect predators primarily through scent.",
      "Several species are strong swimmers. Their hollow quills act as natural flotation devices.",
      "In the wild, porcupines live 15 to 18 years. In captivity, they can reach 25+ years.",
    ],
  },
  {
    title: "Species & Geography",
    image:
      "https://images.unsplash.com/photo-1511497584788-876760111969?w=800&q=80&auto=format&fit=crop",
    facts: [
      "There are 23 recognized species of porcupines, split into two distinct families that evolved independently.",
      "Old World porcupines (Hystricidae, 11 species) live across Africa, southern Europe, and Asia. They're ground-dwelling and larger.",
      "New World porcupines (Erethizontidae, 12 species) live across the Americas. They're tree-dwelling with prehensile tails.",
      "The North American porcupine is the second-largest rodent in North America, smaller only than the beaver.",
      "The African crested porcupine is the largest species, weighing up to 60 pounds (27 kg) with quills over 20 inches long.",
      "Despite looking similar, Old World and New World porcupines are not closely related. Their quills evolved independently (convergent evolution).",
      "The African crested porcupine has colonized parts of Italy, making it one of Europe's largest native rodents.",
      "Porcupines are found on every continent except Antarctica and Australia.",
    ],
  },
  {
    title: "Reproduction",
    image:
      "https://images.unsplash.com/photo-1518173946687-a6a0bed52ed0?w=800&q=80&auto=format&fit=crop",
    facts: [
      "Female porcupines typically give birth to just one baby per year, making population recovery slow.",
      "The gestation period is about 210 days (7 months), one of the longest of any rodent. Most rodents gestate for 3-4 weeks.",
      "Baby porcupines are called porcupettes. They're born with open eyes, full fur, and soft quills.",
      "Porcupettes can climb trees within days of birth and begin eating solid food within two weeks.",
      "The male courtship ritual is remarkably bizarre: he stands on his hind legs and sprays the female with urine from several feet away. If she's receptive, mating proceeds.",
      "Young porcupines are weaned at 2-3 months but may stay near their mother for up to a year in some species.",
    ],
  },
  {
    title: "Surprising Trivia",
    image:
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80&auto=format&fit=crop",
    facts: [
      'The word "porcupine" comes from Middle French "porc espin" (spiny pig), itself from Latin "porcus" (pig) + "spina" (spine).',
      "Porcupines are the third-largest living rodent, after capybaras and beavers.",
      "Their teeth never stop growing. Constant gnawing on bark and wood keeps them filed down.",
      "In parts of Africa, dried porcupine quills are used as musical instruments, sewing needles, and decorative items.",
      "The fisher (a weasel relative) is one of the only predators that reliably hunts porcupines. It attacks the quill-free face, flipping the porcupine onto its back.",
      "Porcupines play an important ecological role: their tree-bark feeding thins forests and promotes new growth, benefiting dozens of other species.",
      "North American porcupines vocalize more than most rodents. They whine, moan, grunt, shriek, and even make a sound resembling human crying.",
      "Some porcupine species are used as biological indicators of forest health. Their presence signals a mature, biodiverse ecosystem.",
    ],
  },
];

export default function FactsPage() {
  return (
    <main>
      {/* Hero */}
      <section className="relative h-[50vh] min-h-[400px] overflow-hidden bg-[var(--color-bark)]">
        <Image
          src={HERO_IMG}
          alt="Porcupine quill detail"
          fill
          className="object-cover opacity-50"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-bark)] via-transparent to-transparent" />
        <div className="relative z-10 mx-auto flex h-full max-w-4xl flex-col justify-end px-8 pb-14">
          <FadeIn>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--color-sand)]">
              Deep Dive
            </p>
            <h1
              className="mt-3 text-4xl font-bold text-[var(--color-cream)] sm:text-6xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              50 Porcupine Facts
            </h1>
            <p className="mt-4 max-w-lg text-lg text-[var(--color-lichen)]">
              Everything you never knew about one of nature&apos;s most
              well-defended, most misunderstood creatures.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Content */}
      <div className="mx-auto max-w-4xl px-8 py-20">
        {sections.map((section, sectionIdx) => (
          <div key={section.title} className="mb-24 last:mb-0">
            <FadeIn>
              <div className="mb-10 flex items-center gap-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-forest)] text-sm font-bold text-white">
                  {sectionIdx + 1}
                </span>
                <h2
                  className="text-2xl font-bold text-[var(--color-bark)] sm:text-3xl"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {section.title}
                </h2>
              </div>
            </FadeIn>

            {/* Section image */}
            <FadeIn>
              <div className="hero-image-container mb-10 overflow-hidden rounded-2xl">
                <div className="relative aspect-[21/9]">
                  <Image
                    src={section.image}
                    alt={section.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 800px"
                  />
                </div>
              </div>
            </FadeIn>

            <StaggerChildren className="space-y-5">
              {section.facts.map((fact, i) => (
                <StaggerItem key={i}>
                  <div className="group flex gap-5 rounded-xl border border-[var(--color-bark)]/6 bg-white p-6 transition hover:border-[var(--color-forest)]/20 hover:shadow-sm">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-forest)]/10 text-xs font-bold text-[var(--color-forest)]">
                      {sectionIdx * 10 + i + 1}
                    </span>
                    <p className="leading-relaxed text-[var(--color-bark-light)]">
                      {fact}
                    </p>
                  </div>
                </StaggerItem>
              ))}
            </StaggerChildren>

            {sectionIdx < sections.length - 1 && (
              <hr className="editorial-rule mt-20" />
            )}
          </div>
        ))}
      </div>

      {/* CTA */}
      <section className="border-t border-[var(--color-bark)]/8 bg-[var(--color-cream)] px-8 py-20 text-center">
        <FadeIn>
          <p
            className="text-2xl font-semibold text-[var(--color-bark)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Want to go deeper?
          </p>
          <p className="mt-2 text-[var(--color-warm-gray)]">
            Explore all 23 species or see where porcupines live around the
            world.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <a
              href="/species"
              className="rounded-full bg-[var(--color-forest)] px-8 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-forest-light)]"
            >
              Species Guide
            </a>
            <a
              href="/habitat"
              className="rounded-full border border-[var(--color-bark)]/15 px-8 py-3 text-sm font-semibold text-[var(--color-bark)] transition hover:bg-white"
            >
              Habitat Map
            </a>
          </div>
        </FadeIn>
      </section>
    </main>
  );
}
