import Link from "next/link";
import { ReadingLayout } from "@/components/ReadingLayout";
export default function MentoriaPage(){return <ReadingLayout eyebrow="LICEU / MENTORIA" title="Prática acompanhada" subtitle="Uma sessão com objetivo, escopo e disponibilidade definidos.">
 <div className="space-y-6"><p>A mentoria é seletiva. Envie seu objetivo; um professor avalia a adequação e propõe uma sessão. Não há taxa de entrevista.</p>
 <p>Você só paga após receber e aceitar uma proposta com preço, duração e disponibilidade. A contratação é por sessão, separada da assinatura de estudos.</p>
 <p>Se você quer comentários sobre uma produção, pode solicitar uma revisão humana avulsa, com escopo e prazo definidos antes do pagamento.</p>
 <Link href="/servicos" className="inline-block border px-6 py-3">Solicitar acompanhamento</Link></div>
 </ReadingLayout>;}
