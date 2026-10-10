import Link from "next/link";
import { ReadingLayout } from "@/components/ReadingLayout";
export default function ProgramPage(){return <ReadingLayout eyebrow="LICEU / PROGRAMA" title="Pensamento que se torna fala" subtitle="Uma formação contínua em retórica, estudo e prática.">
 <div className="space-y-6"><p>Estude os fundamentos da retórica e avance por inventio, dispositio, elocutio, memória e integração. Leia, pratique, revise conceitos e acompanhe seu percurso.</p>
 <p>A assinatura mensal inclui o conteúdo publicado e as atividades de estudo. Você escolhe seu ritmo: conclua as lições e alcance 70% no quiz para abrir o próximo módulo.</p>
 <p>Experimente por 14 dias com cartão. O preço mensal e a data da cobrança são apresentados antes da contratação. Cancele durante o teste para evitar a cobrança; o acesso segue até o fim do período.</p>
 <p>Revisões humanas são opcionais e pagas separadamente, com escopo e prazo combinados antes do pagamento. A mentoria é seletiva e contratada por sessão, sem taxa de entrevista.</p>
 <Link className="inline-block border px-6 py-3" href="/conta">Ver assinatura e teste grátis</Link></div>
 </ReadingLayout>;}
