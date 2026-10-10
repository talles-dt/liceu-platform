// lib/blog-server.ts - Server-side blog utilities
import fs from "fs";
import path from "path";
import {parseFrontmatter as matter} from "@/lib/frontmatter";
import { BlogPost } from "@/types/blog";

const POSTS_DIR = path.join(process.cwd(), "content", "blog");

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
 title: typeof data.title==="string"?data.title:"Untitled",
 date: typeof data.date==="string"?data.date:new Date().toISOString(),
 excerpt: typeof data.excerpt==="string"?data.excerpt:"",
 imageUrl: typeof data.imageUrl==="string"?data.imageUrl:"/images/blog/default.jpg",
 };
 });
 } catch {
 console.error("Failed to read blog posts");
 return [];
 }
}

// Get post by slug
export function getPostBySlug(slug: string): BlogPost & { content: string } | null {
 if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return null;
 try {
 const filePath = path.join(POSTS_DIR, `${slug}.md`);
 
 if (!fs.existsSync(filePath)) return null;
 
 const fileContent = fs.readFileSync(filePath, "utf-8");
 const { data, content } = matter(fileContent);
 
 return {
 slug,
 title: typeof data.title==="string"?data.title:"Untitled",
 content,
 date: typeof data.date==="string"?data.date:new Date().toISOString(),
 excerpt: typeof data.excerpt==="string"?data.excerpt:"",
 imageUrl: typeof data.imageUrl==="string"?data.imageUrl:"/images/blog/default.jpg",
 };
 } catch {
 console.error(`Failed to read blog post: ${slug}`);
 return null;
 }
}

// Client-side mock
export const POSTS: BlogPost[] = [];