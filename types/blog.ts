// types/blog.ts
export type BlogPost = {
 slug: string;
 title: string;
 date: string;
 excerpt: string;
 imageUrl: string;
};

export interface BlogPostWithContent extends BlogPost {
 content: string;
}