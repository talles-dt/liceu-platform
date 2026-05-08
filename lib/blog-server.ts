// lib/blog-server.ts - Server-side blog utilities
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { BlogPost } from "@/types/blog";

const POSTS_DIR = path.join(process.cwd(), "posts");

// Utility function to get all posts
export function getAllPosts(): BlogPost[] {
 try {
 const files = fs.readdirSync(POSTS_DIR).filter(file => file.endsWith(".md"));
 
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
 } catch {
 console.error("Failed to read blog posts");
 return [];
 }
}

// Get post by slug
export function getPostBySlug(slug: string): BlogPost & { content: string } | null {
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

// Client-side mock
export const POSTS: BlogPost[] = [];