import fs from "fs";
import path from "path";
import matter from "gray-matter";

export type BlogPost = {
  slug: string;
  title: string;
  date: string; // YYYY-MM-DD
  excerpt: string;
  content: string; // raw markdown
};

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

function ensureBlogDir() {
  if (!fs.existsSync(BLOG_DIR)) {
    fs.mkdirSync(BLOG_DIR, { recursive: true });
  }
}

export function getAllPosts(): BlogPost[] {
  ensureBlogDir();

  const files = fs
    .readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith(".md"));

  const posts = files.map((filename) => {
    const slug = filename.replace(/\.md$/, "");
    const raw = fs.readFileSync(path.join(BLOG_DIR, filename), "utf-8");
    const { data, content } = matter(raw);

    return {
      slug,
      title: (data.title as string) ?? slug,
      date: (data.date as string) ?? "",
      excerpt: (data.excerpt as string) ?? "",
      content,
    };
  });

  // Sort newest first
  return posts.sort((a, b) => {
    if (a.date > b.date) return -1;
    if (a.date < b.date) return 1;
    return 0;
  });
}

export function getPost(slug: string): BlogPost | null {
  ensureBlogDir();

  const filepath = path.join(BLOG_DIR, `${slug}.md`);
  if (!fs.existsSync(filepath)) return null;

  const raw = fs.readFileSync(filepath, "utf-8");
  const { data, content } = matter(raw);

  return {
    slug,
    title: (data.title as string) ?? slug,
    date: (data.date as string) ?? "",
    excerpt: (data.excerpt as string) ?? "",
    content,
  };
}

// Named export for backward compatibility with homepage and other pages
export const POSTS = getAllPosts();
