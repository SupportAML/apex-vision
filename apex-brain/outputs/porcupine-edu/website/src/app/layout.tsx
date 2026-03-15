import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Porcupine Edu — The Definitive Guide to Porcupines",
  description:
    "The internet's most comprehensive, beautifully designed resource about porcupines. Species guides, habitat maps, conservation, and original porcupine merch.",
  keywords: [
    "porcupine facts",
    "porcupine habitat",
    "types of porcupines",
    "porcupine quills",
    "porcupine species",
    "porcupine diet",
    "porcupine t-shirts",
  ],
  openGraph: {
    title: "Porcupine Edu — The Definitive Guide to Porcupines",
    description: "Facts. Species. Habitat. Conservation. And custom merch.",
    type: "website",
  },
};

function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[var(--color-bark)]/10 bg-[var(--color-parchment)]/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-5">
        <Link
          href="/"
          className="font-[var(--font-display)] text-xl tracking-tight"
          style={{ fontFamily: "var(--font-display)" }}
        >
          <span className="font-semibold text-[var(--color-forest)]">
            Porcupine
          </span>
          <span className="ml-1 font-light italic text-[var(--color-warm-gray)]">
            Edu
          </span>
        </Link>
        <div className="flex items-center gap-8">
          <div className="hidden items-center gap-8 text-sm font-medium tracking-wide text-[var(--color-warm-gray)] sm:flex">
            <Link
              href="/facts"
              className="transition hover:text-[var(--color-forest)]"
            >
              Facts
            </Link>
            <Link
              href="/species"
              className="transition hover:text-[var(--color-forest)]"
            >
              Species
            </Link>
            <Link
              href="/habitat"
              className="transition hover:text-[var(--color-forest)]"
            >
              Habitat
            </Link>
          </div>
          <Link
            href="/shop"
            className="rounded-full bg-[var(--color-forest)] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-forest-light)]"
          >
            Shop
          </Link>
        </div>
      </div>
    </nav>
  );
}

function Footer() {
  return (
    <footer className="border-t border-[var(--color-bark)]/10 bg-[var(--color-bark)] px-8 py-16 text-[var(--color-lichen)]">
      <div className="mx-auto grid max-w-7xl gap-12 sm:grid-cols-3">
        <div>
          <p
            className="text-lg font-semibold text-[var(--color-cream)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Porcupine Edu
          </p>
          <p className="mt-3 text-sm leading-relaxed opacity-70">
            The internet&apos;s most comprehensive porcupine resource. Verified
            by wildlife biologists. Designed for curious humans.
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-sand)]">
            Explore
          </p>
          <div className="mt-4 flex flex-col gap-2 text-sm">
            <Link href="/facts" className="transition hover:text-white">
              Porcupine Facts
            </Link>
            <Link href="/species" className="transition hover:text-white">
              Species Guide
            </Link>
            <Link href="/habitat" className="transition hover:text-white">
              Habitat & Range
            </Link>
            <Link href="/shop" className="transition hover:text-white">
              Merch Shop
            </Link>
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-sand)]">
            About
          </p>
          <p className="mt-4 text-sm leading-relaxed opacity-70">
            Built with care by people who believe porcupines deserve better
            internet representation. All facts sourced from peer-reviewed
            research and wildlife organizations.
          </p>
        </div>
      </div>
      <hr className="editorial-rule mx-auto mt-12 max-w-7xl" />
      <p className="mx-auto mt-6 max-w-7xl text-center text-xs opacity-40">
        &copy; {new Date().getFullYear()} Porcupine Edu. All rights reserved.
        Photos via Unsplash.
      </p>
    </footer>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="grain antialiased">
        <Navbar />
        <div className="pt-[72px]">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
