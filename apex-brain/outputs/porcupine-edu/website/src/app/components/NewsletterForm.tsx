"use client";

export function NewsletterForm() {
  return (
    <form
      className="mt-8 flex gap-3"
      onSubmit={(e) => e.preventDefault()}
    >
      <input
        type="email"
        placeholder="your@email.com"
        className="flex-1 rounded-full border border-[var(--color-bark)]/15 bg-white px-6 py-3 text-sm text-[var(--color-bark)] placeholder-[var(--color-warm-gray)]/60 outline-none focus:border-[var(--color-forest)] focus:ring-2 focus:ring-[var(--color-forest)]/20"
      />
      <button
        type="submit"
        className="rounded-full bg-[var(--color-bark)] px-8 py-3 text-sm font-semibold text-[var(--color-cream)] transition hover:bg-[var(--color-bark-light)]"
      >
        Subscribe
      </button>
    </form>
  );
}
