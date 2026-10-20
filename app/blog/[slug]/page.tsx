import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ReadingLayout } from "@/components/ReadingLayout";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import { getPostBySlug as serverGetPostBySlug } from "@/app/blog/blog-server-actions";

// Export server actions for direct use in server components
const getPostBySlug = serverGetPostBySlug;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
 const { slug } = await params;
 const post = await getPostBySlug(slug);
 if (!post) return {};

 const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.oliceu.com";

 return {
 openGraph: {
 title: post.title,
 description: post.excerpt || "Liceu Underground",
 type: "article",
 publishedTime: post.date,
 images: [
 {
 url: `${baseUrl}/blog/${slug}/og-image`,
 width: 1200,
 height: 630,
 alt: post.title,
 },
 ],
 }
 };
}

export default async function BlogPostPage({ params }: Props) {
 const post = await getPostBySlug((await params).slug);
 if (!post) notFound();

 return (
 <ReadingLayout
 eyebrow={`LICEU / BLOG — ${post.date}`}
 title={post.title}
 subtitle=""
 >
 <article className="space-y-5 font-[var(--font-noto-serif)] text-[15px] leading-[2] text-[var(--liceu-text)]">
 {post.content.split("\n\n").map((p: string) => (
 <p key={p}>{p}</p>
 ))}
 </article>

 <div className="mt-12">
 <NewsletterSignup />
 </div>
 </ReadingLayout>
 );
}