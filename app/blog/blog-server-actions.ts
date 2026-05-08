// app/blog/blog-server-actions.ts - Server-only blog functions
'use server';

import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type { BlogPost, BlogPostWithContent } from "../../types/blog";

const POSTS_DIR = path.join(process.cwd(), "posts");

function readPostsDirectory() {
 try {
 return fs.readdirSync(POSTS_DIR).filter(file => file.endsWith(".md"));
 } catch {
 console.error("Failed to read blog posts directory");
 return [];
 }
}

export async function getAllPosts(): Promise<BlogPost[]> {
 const files = readPostsDirectory();
 
 return files.map(file => {
 const slug = file.replace(".md", "");
 const filePath = path.join(POSTS_DIR, file);
 const fileContent = fs.readFileSync(filePath, "utf-8");
 const { data } = matter(fileContent);
 
 return {
 slug,
 title: data.title || "Untitled",
 date: data.date || new Date().toISOString(),
 excerpt: data.excerpt || "",
 imageUrl: data.imageUrl || "/images/blog/default.jpg",
 };
 });
}

export async function getPostBySlug(slug: string): Promise<(BlogPost & { content: string }) | null> {
 try {
 const filePath = path.join(POSTS_DIR, `${slug}.md`);
 
 if (!fs.existsSync(filePath)) return null;
 
 const fileContent = fs.readFileSync(filePath, "utf-8");
 const { data, content } = matter(fileContent);
 
 return {
 slug,
 title: data.title || "Untitled",
 content,
 date: data.date || new Date().toISOString(),
 excerpt: data.excerpt || "",
 imageUrl: data.imageUrl || "/images/blog/default.jpg",
 };
 } catch {
 console.error(`Failed to read blog post: ${slug}`);
 return null;
 }
}