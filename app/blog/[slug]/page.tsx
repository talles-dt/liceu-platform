import { notFound } from "next/navigation";
import { marked } from "marked";
import { ReadingLayout } from "@/components/ReadingLayout";
import { getAllPosts, getPost } from "@/lib/blog";

type Props = { params: Promise<{ slug: string }> };

// Statically generate all known posts at build time
export async function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  return {
    title: `${post.title} — Liceu Underground`,
    description: post.excerpt,
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const html = await marked(post.content, { breaks: true });

  return (
    <ReadingLayout
      eyebrow={`LICEU / ENSAIOS — ${post.date}`}
      title={post.title}
      subtitle={post.excerpt}
    >
      <article
        className="prose-liceu"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </ReadingLayout>
  );
}
