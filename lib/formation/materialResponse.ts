import {marked} from 'marked';
import sanitizeHtml from 'sanitize-html';
import {isModuleKey,type MaterialKind} from './materials';
export async function materialResponse(text:string,kind:MaterialKind,download=false,edition:{moduleKey?:string;version?:string;previewRelease?:string}={}){
 const moduleKey=edition.moduleKey??'c01';
 if(!isModuleKey(moduleKey)||edition.version&&!/^\d+\.\d+\.\d+$/.test(edition.version)||edition.previewRelease&&!/^\d+\.\d+\.\d+$/.test(edition.previewRelease))throw Error('Edição inválida');
 const moduleNumber=Number(moduleKey.slice(1));
 const query=new URLSearchParams({kind,module:moduleKey,download:'1'});if(edition.previewRelease)query.set('release',edition.previewRelease);
 const headers={'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'};
 if(download)return new Response(text,{headers:{...headers,'Content-Type':'text/markdown; charset=utf-8','Content-Disposition':`attachment; filename="${kind==='teacher'?'guia-professor':'caderno-participante'}-${moduleKey}${edition.version?'-'+edition.version:''}.md"`}});
 const html=sanitizeHtml(await marked(text),{allowedTags:sanitizeHtml.defaults.allowedTags,allowedAttributes:{a:['href','title']},allowedSchemes:['https','http','mailto']});
 return new Response(`<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Módulo ${moduleNumber} — ${kind==='teacher'?'Guia do professor':'Caderno do participante'}</title><style>body{max-width:78ch;margin:3rem auto;padding:0 1rem;background:#faf8f3;color:#25231f;font:18px/1.7 Georgia,serif}table{border-collapse:collapse;display:block;overflow:auto;font-size:14px}td,th{border:1px solid #bbb;padding:.5rem}pre{white-space:pre-wrap}h1,h2,h3{line-height:1.3}a{color:#714e1c}@media print{body{margin:0;max-width:none}nav{display:none}h1,h2,h3{break-after:avoid}table{display:table;overflow:visible;width:100%;table-layout:fixed;font-size:13px}td,th{overflow-wrap:anywhere}tr{break-inside:avoid}p{orphans:3;widows:3}}</style><nav><a href="?${query.toString()}">Baixar texto completo</a> · Use a impressão do navegador para salvar em PDF.</nav><main>${html}</main></html>`,{headers:{...headers,'Content-Type':'text/html; charset=utf-8','Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'"}});
}
