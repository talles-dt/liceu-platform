import {describe,it,expect} from "vitest";
import {parseFrontmatter} from "@/lib/frontmatter";
describe("bounded editorial metadata",()=>{
 it("preserves body and quoted metadata",()=>{expect(parseFrontmatter('---\ntitle: "Um: ensaio"\n---\n# Texto')).toEqual({data:{title:"Um: ensaio"},content:"# Texto"});});
 it("rejects duplicate fields and aliases",()=>{expect(()=>parseFrontmatter('---\ntitle: um\ntitle: outro\n---\nbody')).toThrow();expect(()=>parseFrontmatter('---\nx: &x [1]\ny: *x\n---\nbody')).toThrow();});
 it("bounds parser input",()=>{expect(()=>parseFrontmatter('---\ntitle: '+"x".repeat(20000)+'\n---\nbody')).toThrow();});
});
