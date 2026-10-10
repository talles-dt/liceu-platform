import HomePage from "./HomePageClient";
import {getAllPosts} from "@/lib/blog-server";
export default function Page(){return <HomePage posts={getAllPosts()}/>;}
