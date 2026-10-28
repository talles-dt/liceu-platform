'use client';
import {useState} from 'react';
import Link from 'next/link';
import {DataTable} from '@/components/admin/DataTable';
import type {AdminStudentRow} from '@/lib/admin/queries';
export function StudentsTable({rows}:{rows:AdminStudentRow[]}){
 const [search,setSearch]=useState('');const [area,setArea]=useState('all');
 const filtered=rows.filter(r=>`${r.name??''} ${r.email}`.toLocaleLowerCase('pt-BR').includes(search.toLocaleLowerCase('pt-BR'))&&(area==='all'||(area==='formation'?r.formation:area==='mentoring'?r.mentoring:!r.formation&&!r.mentoring)));
 return <div className="space-y-4"><div className="flex gap-4 flex-wrap"><label>Buscar aluno<input className="block border p-2" value={search} onChange={e=>setSearch(e.target.value)}/></label><label>Acesso<select className="block border p-2" value={area} onChange={e=>setArea(e.target.value)}><option value="all">Todos</option><option value="formation">Formação</option><option value="mentoring">Mentoria</option><option value="none">Sem Formação ou Mentoria</option></select></label></div><p>{filtered.length} alunos encontrados</p><DataTable rows={filtered} rowKey={r=>r.id} columns={[
 {key:'name',header:'Aluno',render:r=><Link className="underline" href={`/admin/students/${r.id}`}>{r.name||r.email}</Link>},
 {key:'email',header:'Email',render:r=>r.email},
 {key:'formation',header:'Formação',render:r=>r.formation?'Disponível':'Sem acesso'},
 {key:'mentoring',header:'Mentoria',render:r=>r.mentoring?'Disponível':'Sem acesso'},
 {key:'legacy',header:'Outras concessões',render:r=>r.legacyGrants},
 {key:'status',header:'Conta',render:r=>r.suspended_at?'Suspensa — acessos bloqueados':'Habilitada'},
 {key:'edit',header:'Gerenciar',render:r=><Link className="underline" href={`/admin/students/${r.id}`}>Alterar acessos</Link>},
 ]}/></div>;
}
