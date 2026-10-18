import {marked} from 'marked';
import sanitizeHtml from 'sanitize-html';
import type {MaterialKind} from './materials';
export async function materialResponse(text:string,kind:MaterialKind,download=false){
 const headers={'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'};
 if(download)return new Response(text,{headers:{...headers,'Content-Type':'text/markdown; charset=utf-8','Content-Disposition':`attachment; filename="${kind==='teacher'?'guia-professor':'caderno-participante'}-c01.md"`}});
 const html=sanitizeHtml(await marked(text),{allowedTags:sanitizeHtml.defaults.allowedTags,allowedAttributes:{a:['href','title']},allowedSchemes:['https','http','mailto']});
 return new Response(`<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Módulo 1 — ${kind==='teacher'?'Guia do professor':'Caderno do participante'}</title><style>body{max-width:78ch;margin:3rem auto;padding:0 1rem;background:#faf8f3;color:#25231f;font:18px/1.7 Georgia,serif}table{border-collapse:collapse;display:block;overflow:auto;font-size:14px}td,th{border:1px solid #bbb;padding:.5rem}pre{white-space:pre-wrap}h1,h2,h3{line-height:1.3}a{color:#714e1c}@media print{body{margin:0;max-width:none}nav{display:none}h2,h3{break-after:avoid}}</style><nav><a href="?kind=${kind}&download=1">Baixar texto completo</a> · Use a impressão do navegador para salvar em PDF.</nav><main>${html}</main></html>`,{headers:{...headers,'Content-Type':'text/html; charset=utf-8','Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'"}});
}
