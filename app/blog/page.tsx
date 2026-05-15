import Link from "next/link";
import { ReadingLayout } from "@/components/ReadingLayout";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import { POSTS } from "@/lib/blog";

export default function BlogIndexPage() {
  return (
    <ReadingLayout
      eyebrow="LICEU / BLOG"
      title="Ensaios"
      subtitle="Texto limpo. Ideias em ordem."
    >
      <div className="space-y-8">
        <div className="border border-[var(--liceu-stone)] bg-[var(--liceu-surface)]/35">
          <ul className="divide-y divide-[var(--liceu-stone)]/70">
            {POSTS.map((post) => (
              <li key={post.slug} className="px-5 py-5">
                <div className="flex flex-wrap items-baseline justify-between gap-4">
                  <Link
                    href={`/blog/${post.slug}`}
                    className="font-[var(--font-noto-serif)] text-[18px] text-[var(--liceu-text)] underline decoration-[var(--liceu-stone)] underline-offset-4 hover:decoration-[var(--liceu-secondary)]"
                  >
                    {post.title}
                  </Link>
                  <div className="font-[var(--font-space-grotesk)] text-[10px] tracking-[0.22em] text-[var(--liceu-muted)]">
                    {post.date}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <NewsletterSignup />
      </div>
    </ReadingLayout>
  );
}

