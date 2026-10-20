import {parseDocument} from "yaml";
/** Only bounded YAML mappings, no executable engines or alias expansion. */
export function parseFrontmatter(source:string):{data:Record<string,unknown>;content:string}{
 const normalized=source.replace(/\r\n/g,"\n");
 if(!normalized.startsWith("---\n"))return {data:{},content:source};
 const end=normalized.indexOf("\n---\n",4);if(end<0||end>16384)throw Error("Invalid frontmatter boundary");
 const document=parseDocument(normalized.slice(4,end),{uniqueKeys:true});if(document.errors.length)throw Error("Invalid frontmatter");
 const data=document.toJS({maxAliasCount:0});if(!data||typeof data!=="object"||Array.isArray(data))throw Error("Expected metadata mapping");
 return {data,content:normalized.slice(end+5)};
}
