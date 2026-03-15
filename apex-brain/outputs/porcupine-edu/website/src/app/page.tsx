import Link from "next/link";
import Image from "next/image";
import {
  FadeIn,
  SlideIn,
  StaggerChildren,
  StaggerItem,
} from "./components/AnimatedSection";
import { NewsletterForm } from "./components/NewsletterForm";

// Unsplash photos - real porcupine photography
const HERO_IMG =
  "https://images.unsplash.com/photo-1583607556223-48f71381d230?w=1800&q=85&auto=format&fit=crop";
const QUILL_CLOSEUP =
  "https://images.unsplash.com/photo-1585095595205-e68428a9e205?w=900&q=80&auto=format&fit=crop";
const FOREST_IMG =
  "https://images.unsplash.com/photo-1448375240586-882707db888b?w=900&q=80&auto=format&fit=crop";
const PORCUPINE_TREE =
  "https://images.unsplash.com/photo-1504006833117-8886a355efbf?w=900&q=80&auto=format&fit=crop";

const quickFacts = [
  { number: "30K", label: "Quills per porcupine", detail: "Each one barbed, each one replaceable" },
  { number: "23", label: "Known species", detail: "Across every continent but Antarctica & Australia" },
  { number: "27kg", label: "Heaviest species", detail: "The Cape porcupine of Southern Africa" },
  { number: "18yr", label: "Lifespan in the wild", detail: "Longer than most rodents by far" },
];

const articles = [
  {
    slug: "facts",
    title: "50 Porcupine Facts That Will Surprise You",
    subtitle: "From antibiotic quills to 7-month pregnancies",
    image: QUILL_CLOSEUP,
    tag: "Deep Dive",
  },
  {
    slug: "species",
    title: "A Field Guide to All 23 Species",
    subtitle: "Old World ground-dwellers to New World tree climbers",
    image: FOREST_IMG,
    tag: "Species",
  },
  {
    slug: "habitat",
    title: "Where Porcupines Live Around the World",
    subtitle: "Deserts, rainforests, and everything between",
    image: PORCUPINE_TREE,
    tag: "Habitat",
  },
];

export default function Home() {
  return (
    <main>
      {/* ── HERO ── */}
      <section className="relative min-h-[92vh] overflow-hidden bg-[var(--color-bark)]">
        {/* Background image */}
        <div className="absolute inset-0">
          <Image
            src={HERO_IMG}
            alt="Close-up of a porcupine in its natural habitat"
            fill
            className="object-cover opacity-60"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-bark)]/40 via-transparent to-[var(--color-bark)]" />
        </div>

        {/* Hero content */}
        <div className="relative z-10 mx-auto flex min-h-[92vh] max-w-7xl flex-col justify-end px-8 pb-20">
          <FadeIn>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--color-sand)]">
              The Definitive Resource
            </p>
          </FadeIn>
          <FadeIn delay={0.15}>
            <h1
              className="mt-4 max-w-4xl text-5xl font-bold leading-[1.1] text-[var(--color-cream)] sm:text-7xl lg:text-8xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Everything You Want
              <br />
              to Know About
              <br />
              <span className="italic text-[var(--color-sand)]">
                Porcupines
              </span>
            </h1>
          </FadeIn>
          <FadeIn delay={0.3}>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-[var(--color-lichen)]">
              23 species. 6 continents. 30,000 quills each. Dive into the most
              comprehensive, beautifully crafted porcupine resource on the
              internet.
            </p>
          </FadeIn>
          <FadeIn delay={0.45}>
            <div className="mt-10 flex gap-4">
              <Link
                href="/facts"
                className="rounded-full bg-[var(--color-cream)] px-8 py-3.5 text-sm font-semibold text-[var(--color-bark)] transition hover:bg-white"
              >
                Start Exploring
              </Link>
              <Link
                href="/shop"
                className="rounded-full border border-[var(--color-cream)]/30 px-8 py-3.5 text-sm font-semibold text-[var(--color-cream)] transition hover:border-[var(--color-cream)]/60 hover:bg-white/5"
              >
                Shop Merch
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── STATS RIBBON ── */}
      <section className="border-b border-[var(--color-bark)]/8 bg-[var(--color-cream)]">
        <StaggerChildren className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-[var(--color-bark)]/8 sm:grid-cols-4">
          {quickFacts.map((f) => (
            <StaggerItem key={f.label} className="px-8 py-12 text-center">
              <p
                className="text-4xl font-bold text-[var(--color-forest)] sm:text-5xl"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {f.number}
              </p>
              <p className="mt-2 text-sm font-semibold uppercase tracking-wider text-[var(--color-bark)]">
                {f.label}
              </p>
              <p className="mt-1 text-xs text-[var(--color-warm-gray)]">
                {f.detail}
              </p>
            </StaggerItem>
          ))}
        </StaggerChildren>
      </section>

      {/* ── EDITORIAL INTRO ── */}
      <section className="mx-auto max-w-4xl px-8 py-24 text-center">
        <FadeIn>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--color-moss)]">
            Why Porcupines?
          </p>
          <h2
            className="mx-auto mt-6 max-w-2xl text-3xl font-semibold leading-snug text-[var(--color-bark)] sm:text-4xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            They&apos;re one of nature&apos;s most fascinating and
            misunderstood creatures
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-[var(--color-warm-gray)]">
            No, they can&apos;t shoot their quills. Yes, their quills have
            built-in antibiotics. Porcupines are far more interesting than most
            people realize. We built this site to change that.
          </p>
        </FadeIn>
      </section>

      <hr className="editorial-rule mx-auto max-w-7xl" />

      {/* ── FEATURED ARTICLES ── */}
      <section className="mx-auto max-w-7xl px-8 py-24">
        <FadeIn>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--color-moss)]">
            Deep Dives
          </p>
          <h2
            className="mt-4 text-3xl font-semibold text-[var(--color-bark)] sm:text-4xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Explore the World of Porcupines
          </h2>
        </FadeIn>

        <div className="mt-16 space-y-8">
          {articles.map((article, i) => (
            <SlideIn
              key={article.slug}
              direction={i % 2 === 0 ? "left" : "right"}
            >
              <Link
                href={`/${article.slug}`}
                className="card-lift group block overflow-hidden rounded-2xl border border-[var(--color-bark)]/6 bg-white"
              >
                <div className="grid sm:grid-cols-2">
                  <div className="hero-image-container relative aspect-[4/3] sm:aspect-auto">
                    <Image
                      src={article.image}
                      alt={article.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, 50vw"
                    />
                  </div>
                  <div className="flex flex-col justify-center p-10 sm:p-14">
                    <span className="w-fit rounded-full bg-[var(--color-forest)]/10 px-3 py-1 text-xs font-semibold text-[var(--color-forest)]">
                      {article.tag}
                    </span>
                    <h3
                      className="mt-4 text-2xl font-bold text-[var(--color-bark)] sm:text-3xl"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      {article.title}
                    </h3>
                    <p className="mt-3 text-[var(--color-warm-gray)]">
                      {article.subtitle}
                    </p>
                    <span className="mt-6 text-sm font-semibold text-[var(--color-forest)] transition group-hover:translate-x-1">
                      Read article →
                    </span>
                  </div>
                </div>
              </Link>
            </SlideIn>
          ))}
        </div>
      </section>

      {/* ── MERCH CTA ── */}
      <section className="relative overflow-hidden bg-[var(--color-forest)] px-8 py-28">
        <div className="absolute inset-0 opacity-10">
          <div
            className="h-full w-full"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 50%, var(--color-moss) 1px, transparent 1px), radial-gradient(circle at 80% 20%, var(--color-moss) 1px, transparent 1px)",
              backgroundSize: "60px 60px, 90px 90px",
            }}
          />
        </div>
        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <FadeIn>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--color-lichen)]">
              Original Designs
            </p>
            <h2
              className="mt-6 text-4xl font-bold text-[var(--color-cream)] sm:text-5xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Custom Porcupine Tees
              <br />
              <span className="italic">With Your Name</span>
            </h2>
            <p className="mx-auto mt-6 max-w-md text-lg text-[var(--color-lichen)]">
              5 original illustrations. Premium print-on-demand quality. Free
              name customization on every shirt.
            </p>
            <Link
              href="/shop"
              className="mt-10 inline-block rounded-full bg-[var(--color-cream)] px-10 py-4 text-sm font-bold text-[var(--color-forest)] transition hover:bg-white hover:shadow-lg"
            >
              Browse the Collection
            </Link>
          </FadeIn>
        </div>
      </section>

      {/* ── NEWSLETTER ── */}
      <section className="mx-auto max-w-2xl px-8 py-24 text-center">
        <FadeIn>
          <p
            className="text-2xl font-semibold text-[var(--color-bark)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Get weekly porcupine facts in your inbox.
          </p>
          <p className="mt-2 text-[var(--color-warm-gray)]">
            No spam. Just quills. Unsubscribe anytime.
          </p>
          <NewsletterForm />
        </FadeIn>
      </section>
    </main>
  );
}
