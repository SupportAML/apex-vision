"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const designs = [
  {
    id: 1,
    name: "Quill Power",
    tagline: "For the quietly dangerous",
    desc: "Bold porcupine silhouette with raised quills in a geometric burst pattern. Statement piece.",
    price: 34,
    colors: [
      { name: "Charcoal", hex: "#36454F", textColor: "white" },
      { name: "Forest", hex: "#2D6A4F", textColor: "white" },
      { name: "Cream", hex: "#FEFAE0", textColor: "#2C1810" },
    ],
    sizes: ["S", "M", "L", "XL", "2XL"],
    gradient: "from-[#36454F] to-[#1B4332]",
  },
  {
    id: 2,
    name: "The Scholar",
    tagline: "30,000 reasons to study up",
    desc: "Detailed porcupine illustration wearing round spectacles, surrounded by botanical elements. For the intellectually curious.",
    price: 34,
    colors: [
      { name: "Natural", hex: "#F5F0E8", textColor: "#2C1810" },
      { name: "Slate", hex: "#708090", textColor: "white" },
      { name: "Navy", hex: "#1B2838", textColor: "white" },
    ],
    sizes: ["S", "M", "L", "XL", "2XL"],
    gradient: "from-[#708090] to-[#1B2838]",
  },
  {
    id: 3,
    name: "Quill & Chill",
    tagline: "Prickly on the outside",
    desc: "Relaxed porcupine in a hammock between two pines. Vintage national park poster aesthetic. Good vibes, sharp quills.",
    price: 36,
    colors: [
      { name: "Sand", hex: "#DDA15E", textColor: "#2C1810" },
      { name: "White", hex: "#FFFFFF", textColor: "#2C1810" },
      { name: "Sky", hex: "#87CEEB", textColor: "#2C1810" },
    ],
    sizes: ["S", "M", "L", "XL", "2XL"],
    gradient: "from-[#DDA15E] to-[#BC6C25]",
  },
  {
    id: 4,
    name: "Spike Club",
    tagline: "Est. 30,000 quills",
    desc: "Vintage motorcycle club badge style. 'SPIKE CLUB' in distressed block letters around a crowned porcupine emblem.",
    price: 34,
    colors: [
      { name: "Black", hex: "#1a1a1a", textColor: "white" },
      { name: "Maroon", hex: "#800020", textColor: "white" },
      { name: "Military", hex: "#4B5320", textColor: "white" },
    ],
    sizes: ["S", "M", "L", "XL", "2XL"],
    gradient: "from-[#1a1a1a] to-[#333]",
  },
  {
    id: 5,
    name: "Anatomy",
    tagline: "The science of quills",
    desc: "Scientific illustration style. Labeled porcupine anatomy diagram with hand-drawn annotations and fun facts. For the true nerd.",
    price: 38,
    colors: [
      { name: "White", hex: "#FFFFFF", textColor: "#2C1810" },
      { name: "Parchment", hex: "#FAF7F0", textColor: "#2C1810" },
      { name: "Gray", hex: "#D3D3D3", textColor: "#2C1810" },
    ],
    sizes: ["S", "M", "L", "XL", "2XL"],
    gradient: "from-[#FAF7F0] to-[#D3D3D3]",
  },
  {
    id: 6,
    name: "Night Watch",
    tagline: "Nocturnal by nature",
    desc: "Porcupine silhouette against a full moon, pine forest backdrop. Moody, atmospheric, and slightly mysterious.",
    price: 36,
    colors: [
      { name: "Midnight", hex: "#191970", textColor: "white" },
      { name: "Black", hex: "#1a1a1a", textColor: "white" },
      { name: "Slate", hex: "#2F4F4F", textColor: "white" },
    ],
    sizes: ["S", "M", "L", "XL", "2XL"],
    gradient: "from-[#191970] to-[#0a0a2e]",
  },
];

function ShirtCard({ design }: { design: (typeof designs)[0] }) {
  const [customName, setCustomName] = useState("");
  const [selectedColor, setSelectedColor] = useState(0);
  const [selectedSize, setSelectedSize] = useState(2); // default L
  const [isAdded, setIsAdded] = useState(false);

  const color = design.colors[selectedColor];

  const handleAdd = () => {
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5 }}
      className="card-lift overflow-hidden rounded-2xl border border-[var(--color-bark)]/6 bg-white"
    >
      {/* T-shirt mockup area */}
      <div
        className="relative flex h-80 items-center justify-center overflow-hidden transition-colors duration-500"
        style={{ backgroundColor: color.hex }}
      >
        {/* Subtle texture */}
        <div className="absolute inset-0 opacity-[0.08]" style={{
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000' fill-opacity='1'%3E%3Cpath d='M0 0h1v1H0z'/%3E%3C/g%3E%3C/svg%3E\")",
        }} />

        <div className="relative z-10 text-center px-6">
          <p
            className="text-4xl font-bold tracking-tight"
            style={{
              fontFamily: "var(--font-display)",
              color: color.textColor,
            }}
          >
            {design.name}
          </p>
          <p
            className="mt-1 text-sm italic opacity-70"
            style={{ color: color.textColor }}
          >
            {design.tagline}
          </p>

          <AnimatePresence mode="wait">
            {customName && (
              <motion.p
                key={customName}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mt-4 text-lg font-semibold tracking-wide"
                style={{ color: color.textColor, opacity: 0.85 }}
              >
                {customName}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Size badge */}
        <div
          className="absolute right-4 top-4 rounded-full px-3 py-1 text-xs font-bold opacity-30"
          style={{ color: color.textColor, border: `1px solid ${color.textColor}` }}
        >
          {design.sizes[selectedSize]}
        </div>
      </div>

      {/* Product details */}
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <h3
              className="text-lg font-bold text-[var(--color-bark)]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {design.name}
            </h3>
            <p className="mt-1 text-sm text-[var(--color-warm-gray)]">
              {design.desc}
            </p>
          </div>
          <p
            className="text-2xl font-bold text-[var(--color-bark)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            ${design.price}
          </p>
        </div>

        {/* Color selector */}
        <div className="mt-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-warm-gray)]">
            Color — {color.name}
          </p>
          <div className="mt-2 flex gap-2">
            {design.colors.map((c, i) => (
              <button
                key={c.name}
                onClick={() => setSelectedColor(i)}
                className={`h-8 w-8 rounded-full border-2 transition ${
                  selectedColor === i
                    ? "border-[var(--color-forest)] ring-2 ring-[var(--color-forest)]/20"
                    : "border-[var(--color-bark)]/15 hover:border-[var(--color-bark)]/40"
                }`}
                style={{ backgroundColor: c.hex }}
                title={c.name}
              />
            ))}
          </div>
        </div>

        {/* Size selector */}
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-warm-gray)]">
            Size
          </p>
          <div className="mt-2 flex gap-2">
            {design.sizes.map((s, i) => (
              <button
                key={s}
                onClick={() => setSelectedSize(i)}
                className={`h-9 w-12 rounded-lg text-xs font-semibold transition ${
                  selectedSize === i
                    ? "bg-[var(--color-bark)] text-white"
                    : "border border-[var(--color-bark)]/15 text-[var(--color-bark)] hover:border-[var(--color-bark)]/40"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Name customization */}
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-warm-gray)]">
            Your Name — Free Personalization
          </p>
          <input
            type="text"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder="Type your name..."
            maxLength={20}
            className="mt-2 w-full rounded-lg border border-[var(--color-bark)]/12 bg-[var(--color-parchment)] px-4 py-2.5 text-sm text-[var(--color-bark)] placeholder-[var(--color-warm-gray)]/50 outline-none transition focus:border-[var(--color-forest)] focus:ring-2 focus:ring-[var(--color-forest)]/15"
          />
        </div>

        {/* Add to cart */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleAdd}
          className={`mt-6 w-full rounded-full py-3.5 text-sm font-bold transition ${
            isAdded
              ? "bg-[var(--color-forest)] text-white"
              : "bg-[var(--color-bark)] text-[var(--color-cream)] hover:bg-[var(--color-bark-light)]"
          }`}
        >
          {isAdded ? "Added to Cart ✓" : `Add to Cart — $${design.price}`}
        </motion.button>
      </div>
    </motion.div>
  );
}

export default function ShopPage() {
  return (
    <main>
      {/* Hero */}
      <section className="bg-[var(--color-bark)] px-8 py-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--color-sand)]">
            Original Designs · Premium Quality · Free Personalization
          </p>
          <h1
            className="mt-6 text-4xl font-bold text-[var(--color-cream)] sm:text-6xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Porcupine Merch
          </h1>
          <p className="mx-auto mt-6 max-w-md text-lg text-[var(--color-lichen)]">
            6 original designs. Your name on every shirt. Printed on demand by
            Printful and shipped to your door in 5-7 days.
          </p>
        </motion.div>
      </section>

      {/* Products grid */}
      <section className="mx-auto max-w-7xl px-8 py-20">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {designs.map((d) => (
            <ShirtCard key={d.id} design={d} />
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-[var(--color-bark)]/8 bg-[var(--color-cream)] px-8 py-20">
        <div className="mx-auto max-w-4xl">
          <h2
            className="text-center text-3xl font-bold text-[var(--color-bark)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            How It Works
          </h2>

          <div className="mt-14 grid gap-12 sm:grid-cols-3">
            {[
              {
                step: "01",
                title: "Pick Your Design",
                desc: "Choose from 6 original porcupine illustrations, each with a distinct personality.",
              },
              {
                step: "02",
                title: "Customize It",
                desc: "Add your name for free. Choose your color and size. See the preview update live.",
              },
              {
                step: "03",
                title: "We Print & Ship",
                desc: "Printed on premium cotton by Printful. Shipped directly to you in 5-7 business days.",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <span
                  className="text-5xl font-bold text-[var(--color-forest)]/20"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {item.step}
                </span>
                <h3 className="mt-2 text-lg font-bold text-[var(--color-bark)]">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-[var(--color-warm-gray)]">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust signals */}
      <section className="px-8 py-16">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-8 text-center text-sm text-[var(--color-warm-gray)]">
          <div className="flex items-center gap-2">
            <span className="text-lg">🚚</span> Free shipping on 2+
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">🔄</span> 30-day returns
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">🌱</span> Eco-friendly inks
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">👕</span> Premium 100% cotton
          </div>
        </div>
      </section>
    </main>
  );
}
