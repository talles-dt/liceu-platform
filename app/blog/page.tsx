import Link from "next/link";
import { ReadingLayout } from "@/components/ReadingLayout";
import { getAllPosts } from "@/lib/blog";

export default function BlogIndexPage() {
  const posts = getAllPosts();

  return (
    <ReadingLayout
      eyebrow="LICEU / ENSAIOS"
      title="Ensaios"
      subtitle="Texto limpo. Ideias em ordem."
    >
      <div className="space-y-8">
        {posts.length === 0 ? (
          <p className="font-[var(--font-liceu-sans)] text-sm text-[var(--liceu-muted)]">
            Nenhum ensaio publicado ainda.
          </p>
        ) : (
          <div className="border border-[var(--liceu-stone)] bg-[var(--liceu-surface)]/35">
            <ul className="divide-y divide-[var(--liceu-stone)]/70">
              {posts.map((post) => (
                <li key={post.slug} className="px-5 py-5">
                  <div className="flex flex-wrap items-baseline justify-between gap-4">
                    <Link
                      href={`/blog/${post.slug}` as never}
                      className="font-serif text-[18px] text-[var(--liceu-text)] underline decoration-[var(--liceu-stone)] underline-offset-4 hover:decoration-[var(--liceu-accent)]"
                    >
                      {post.title}
                    </Link>
                    <div className="font-[var(--font-liceu-mono)] text-[10px] tracking-[0.22em] text-[var(--liceu-muted)]">
                      {post.date}
                    </div>
                  </div>
                  {post.excerpt && (
                    <p className="mt-2 font-[var(--font-liceu-sans)] text-[12px] leading-relaxed text-[var(--liceu-muted)]">
                      {post.excerpt}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </ReadingLayout>
  );
}
