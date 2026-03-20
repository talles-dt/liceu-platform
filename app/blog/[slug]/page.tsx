import { notFound } from "next/navigation";
import { ReadingLayout } from "@/components/ReadingLayout";
import { getPost } from "@/lib/blog";

type Props = { params: { slug: string } };

export default function BlogPostPage({ params }: Props) {
  const post = getPost(params.slug);
  if (!post) notFound();

  return (
    <ReadingLayout
      eyebrow={`LICEU / BLOG — ${post.date}`}
      title={post.title}
      subtitle=""
    >
      <article className="space-y-5 font-serif text-[15px] leading-[2] text-[var(--liceu-text)]">
        {post.content.split("\n\n").map((p) => (
          <p key={p}>{p}</p>
        ))}
      </article>
    </ReadingLayout>
  );
}

