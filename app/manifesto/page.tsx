import { ReadingLayout } from "@/components/ReadingLayout";
import Link from "next/link";
import { MinimalButton } from "@/components/MinimalButton";

export default function ManifestoPage() {
  return (
    <ReadingLayout
      eyebrow="LICEU / MANIFESTO"
      title="Fale menos, imponha respeito e não colapse sob pressão."
      subtitle="Sua inteligência desmorona sem estrutura de apoio. Faça o diagnóstico técnico gratuito e aprenda a ancorar suas ideias usando a fundação letal da retórica clássica."
    >
      <div className="space-y-12">
        <section className="space-y-4 border border-[var(--liceu-stone)] bg-[var(--liceu-surface)]/35 px-6 py-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="font-[var(--font-liceu-mono)] text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
              Diagnóstico técnico
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/diagnostico">
                <MinimalButton>Diagnóstico Técnico Gratuito</MinimalButton>
              </Link>
              <Link href="/login">
                <MinimalButton variant="quiet">Entrar</MinimalButton>
              </Link>
            </div>
          </div>
          <div className="font-[var(--font-liceu-sans)] text-[11px] text-[var(--liceu-muted)]">
            Sem truques motivacionais. Avaliação puramente tática.
          </div>
        </section>

        <section className="space-y-4">
          <div className="font-[var(--font-liceu-mono)] text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
            O problema primário
          </div>
          <h2 className="font-serif text-2xl leading-tight text-[var(--liceu-text)]">
            O Colapso Sistêmico da Inteligência
          </h2>
          <div className="space-y-4 font-serif text-[15px] leading-[1.95] text-[var(--liceu-text)]">
            <p>
              Você não é tímido. Também não é burro. O seu problema é estrutural.
              Quando você é interrompido ou cobrado ao vivo, o seu sistema
              nervoso trava porque você comete o erro primário de tentar
              organizar as ideias no exato momento da fala. A fala é efeito,
              nunca a causa. Tentar pensar enquanto se defende é a receita
              matemática do fracasso.
            </p>
            <p>
              O mundo corporativo te ensinou a resolver isso do jeito errado.
              Venderam dicas de oratória, modulação de voz e dinâmicas de palco.
              Mas a emoção sem estrutura vira autossabotagem. A técnica ensaiada
              no espelho colapsa sob fadiga. A sua mente colapsa sob observação
              crítica e fogo cruzado.
            </p>
            <p>
              Por isso você se explica demais. O coração acelera, a respiração
              encurta e você assiste, paralisado, um colega raso roubar o crédito
              da sua ideia só porque ele blafa com confiança. O ressentimento
              bate pesado. Você sai da sala moendo a frustração, e a resposta
              cortante que deveria ter dado só aparece na sua cabeça quinze
              minutos depois, no banho.
            </p>
          </div>
        </section>

        <section className="space-y-4 border-t border-[var(--liceu-stone)]/70 pt-10">
          <div className="font-[var(--font-liceu-mono)] text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
            A oportunidade
          </div>
          <h2 className="font-serif text-2xl leading-tight text-[var(--liceu-text)]">
            A Arquitetura do Pensamento Sob Fogo Cruzado
          </h2>
          <div className="space-y-4 font-serif text-[15px] leading-[1.95] text-[var(--liceu-text)]">
            <p>
              O Liceu Underground não é um curso de oratória. É uma escola de
              pensamento. Nós resgatamos o rigor da retórica clássica de
              Aristóteles, Cícero e Quintiliano, e aplicamos como treinamento de
              força para a sua mente. A ordem interna precede a ação. Você
              aprende a montar a estrutura lógica de forma fria e prévia. A
              autoridade verbal não nasce do tom da voz. Nasce dessa ordem
              interna.
            </p>
            <p>
              Tudo começa com o nosso diagnóstico técnico. Nós não vamos te
              colocar num palco para contar histórias emocionantes. Nós vamos
              mapear onde a sua inteligência desmorona quando há peso real na
              barra. Identificamos as suas falhas lógicas e os seus vícios de
              defesa. É um raio-x implacável da sua capacidade de operar sob
              pressão tática, interrupção e discordância.
            </p>
            <div className="border-l-4 border-[var(--liceu-accent)]/35 pl-4 text-[var(--liceu-muted)]">
              Imagine entrar numa sala de crise. O caos está instalado. O diretor
              exige uma resposta imediata. Você não sua frio. Você senta, faz
              duas perguntas lógicas cortantes e estabelece os limites. O
              ambiente inteiro se cala e aceita a sua direção. Você não
              gesticulou, não alterou o tom, não forçou carisma.
            </div>
          </div>
        </section>

        <section className="space-y-5 border-t border-[var(--liceu-stone)]/70 pt-10">
          <div className="font-[var(--font-liceu-mono)] text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
            Para quem é isso
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              {
                title: "Executivos e Líderes",
                body: "Você precisa conduzir reuniões pesadas, dominar clientes e ditar os rumos do negócio sem se exaltar.",
              },
              {
                title: "Especialistas e Analistas",
                body: "Mentes brilhantes no trabalho silencioso, mas que são engolidos ao vivo por colegas rasos e performáticos.",
              },
              {
                title: "Professores e Mentores",
                body: "Educadores exigentes que desejam ganhar o respeito absoluto da sala sem nunca precisar levantar a voz.",
              },
            ].map((c) => (
              <div
                key={c.title}
                className="border border-[var(--liceu-stone)] bg-[var(--liceu-surface)]/40 px-5 py-5"
              >
                <div className="font-serif text-[18px] leading-snug text-[var(--liceu-text)]">
                  {c.title}
                </div>
                <p className="mt-3 font-serif text-[14px] leading-[1.9] text-[var(--liceu-muted)]">
                  {c.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-5 border-t border-[var(--liceu-stone)]/70 pt-10">
          <div className="font-[var(--font-liceu-mono)] text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
            Proposta de valor
          </div>
          <h2 className="font-serif text-2xl leading-tight text-[var(--liceu-text)]">
            Domine o Conflito e Pare de Se Explicar
          </h2>
          <div className="space-y-5">
            {[
              {
                title: "Estrutura antes da fala",
                body: "Aprenda a organizar o pensamento antes de abrir a boca. A ordem interna vira o seu escudo lógico.",
              },
              {
                title: "Treino sob carga e pressão real",
                body: "Você treina sob interrupção, análise crítica e discordância constante. As reuniões da sua empresa vão parecer um aquecimento leve.",
              },
              {
                title: "Autoridade pelo silêncio",
                body: "Corte a necessidade de falar o tempo todo. O seu silêncio calculado passa a ditar a hierarquia do ambiente.",
              },
            ].map((v) => (
              <div
                key={v.title}
                className="border border-[var(--liceu-stone)] bg-[var(--liceu-surface)]/40 px-5 py-5"
              >
                <div className="font-[var(--font-liceu-mono)] text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
                  {v.title}
                </div>
                <p className="mt-3 font-serif text-[15px] leading-[1.95] text-[var(--liceu-text)]">
                  {v.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-5 border-t border-[var(--liceu-stone)]/70 pt-10">
          <div className="font-[var(--font-liceu-mono)] text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
            Provas e depoimentos
          </div>
          <h2 className="font-serif text-2xl leading-tight text-[var(--liceu-text)]">
            A Técnica Validada Sob Carga Extrema
          </h2>
          <div className="space-y-6">
            {[
              {
                quote:
                  "Eu achava que precisava ser mais solto e extrovertido com a diretoria. O Liceu me ensinou a ser frio. Hoje eu assumo o controle da mesa cortando a confusão com uma única frase lógica.",
                name: "Marcos V., Diretor Executivo",
              },
              {
                quote:
                  "Eu gastava muita energia implorando pela atenção dos alunos. O treino me deu uma base letal. Agora a minha postura física exige silêncio absoluto na sala antes mesmo de eu dizer o meu nome.",
                name: "Helena T., Professora Universitária",
              },
            ].map((t) => (
              <figure
                key={t.name}
                className="border border-[var(--liceu-stone)] bg-[var(--liceu-surface)]/35 px-5 py-5"
              >
                <div className="font-serif text-[18px] leading-[1.75] text-[var(--liceu-text)]">
                  “{t.quote}”
                </div>
                <figcaption className="mt-4 font-[var(--font-liceu-sans)] text-[11px] tracking-wide text-[var(--liceu-muted)]">
                  {t.name}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section className="space-y-4 border-t border-[var(--liceu-stone)]/70 pt-10">
          <div className="font-[var(--font-liceu-mono)] text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
            História de origem
          </div>
          <h2 className="font-serif text-2xl leading-tight text-[var(--liceu-text)]">
            A Lesão da Comunicação Rasa
          </h2>
          <div className="space-y-4 font-serif text-[15px] leading-[1.95] text-[var(--liceu-text)]">
            <p>
              Sou professor de comunicação há 20 anos. Vi de perto centenas de
              mentes brilhantes colapsarem ao vivo. Eles liam livros, decoravam
              roteiros imensos e ensaiavam sorrisos no espelho. Mas bastava uma
              única interrupção ríspida para que o sistema nervoso jogasse tudo
              no lixo.
            </p>
            <p>
              Desde 2022, mantenho uma prática severa de treino de força. Um
              atleta não levanta carga brutal entortando a coluna. Ele constrói
              uma fundação rígida antes de puxar o peso. Eu cruzei essa lógica
              com a tradição clássica inegociável. Nasceu o Liceu Underground:
              Estrutura, Pressão e Presença Intelectual.
            </p>
          </div>
        </section>

        <section className="space-y-5 border-t border-[var(--liceu-stone)]/70 pt-10">
          <div className="font-[var(--font-liceu-mono)] text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
            Como a mentoria funciona
          </div>
          <ol className="space-y-4">
            {[
              {
                title: "Passo 1: Diagnóstico técnico",
                body: "Tudo começa aqui. Nós mapeamos onde e por que a inteligência colapsa sob pressão. Avaliação tática e gratuita.",
              },
              {
                title: "Passo 2: Fundação tática (Fase 1)",
                body: "Você aprende a arquitetar a estrutura lógica e fria das suas ideias antes de abrir a boca.",
              },
              {
                title: "Passo 3: Aplicação sob pressão (Fase 2)",
                body: "Treinos guiados com carga real de interrupção, discordância e hostilidade. Feedback técnico no exato segundo do erro.",
              },
              {
                title: "Passo 4: Domínio do ambiente (Fase 3)",
                body: "A técnica vira parte do seu sistema nervoso. O silêncio estruturado se torna sua maior arma.",
              },
            ].map((s) => (
              <li
                key={s.title}
                className="border border-[var(--liceu-stone)] bg-[var(--liceu-surface)]/35 px-5 py-5"
              >
                <div className="font-serif text-[16px] text-[var(--liceu-text)]">
                  {s.title}
                </div>
                <p className="mt-3 font-serif text-[14px] leading-[1.9] text-[var(--liceu-muted)]">
                  {s.body}
                </p>
              </li>
            ))}
          </ol>
        </section>

        <section className="space-y-6 border-t border-[var(--liceu-stone)]/70 pt-10">
          <div className="font-[var(--font-liceu-mono)] text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
            O seu próximo passo
          </div>
          <p className="font-serif text-[15px] leading-[1.95] text-[var(--liceu-text)]">
            A mentoria não é de livre acesso. O processo de entrada exige
            validação prévia.
          </p>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="border border-[var(--liceu-stone)] bg-[var(--liceu-surface)]/35 px-5 py-5">
              <div className="font-[var(--font-liceu-mono)] text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
                Porta de entrada
              </div>
              <div className="mt-2 font-serif text-[18px] text-[var(--liceu-text)]">
                Diagnóstico técnico (gratuito)
              </div>
              <ul className="mt-4 list-disc space-y-2 pl-5 font-serif text-[14px] leading-[1.9] text-[var(--liceu-muted)]">
                <li>Avaliação de tolerância à pressão</li>
                <li>Falhas lógicas na fala</li>
                <li>Vícios de pensamento confuso</li>
                <li>Feedback direto e confidencial</li>
              </ul>
              <div className="mt-5">
                <Link href="/diagnostico">
                  <MinimalButton>Fazer o Diagnóstico Técnico</MinimalButton>
                </Link>
              </div>
            </div>
            <div className="border border-[var(--liceu-stone)] bg-[var(--liceu-surface)]/35 px-5 py-5">
              <div className="font-[var(--font-liceu-mono)] text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
                Destino (aprovados)
              </div>
              <div className="mt-2 font-serif text-[18px] text-[var(--liceu-text)]">
                Mentoria Armas da Palavra
              </div>
              <ul className="mt-4 list-disc space-y-2 pl-5 font-serif text-[14px] leading-[1.9] text-[var(--liceu-muted)]">
                <li>Três fases: Fundação, Pressão, Domínio</li>
                <li>Simulações de conflito sob carga extrema</li>
                <li>Supervisão e correção ao vivo</li>
                <li>Estrutura como hábito cognitivo</li>
              </ul>
              <div className="mt-5">
                <Link href="/diagnostico">
                  <MinimalButton>Aplicar (via diagnóstico)</MinimalButton>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-5 border-t border-[var(--liceu-stone)]/70 pt-10">
          <div className="font-[var(--font-liceu-mono)] text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
            Perguntas & respostas
          </div>
          <div className="space-y-3">
            {[
              {
                q: "Isso não é só mais um cursinho de oratória?",
                a: "Não. Cursos de palco ensinam atuação. O Liceu ensina estrutura do pensamento sob fogo cruzado: causa, não estética.",
              },
              {
                q: "Eu sou muito introvertido. Isso vai me obrigar a fingir extroversão?",
                a: "Pelo contrário. Você não mudará sua personalidade. Você vai liderar pelo peso da lógica — e pelo silêncio.",
              },
              {
                q: "Treinar sob pressão não vai me deixar ainda mais nervoso?",
                a: "A carga é progressiva. Você constrói base na Fundação e só depois entra em simulações controladas, com feedback técnico.",
              },
            ].map((item) => (
              <details
                key={item.q}
                className="group border border-[var(--liceu-stone)] bg-[var(--liceu-surface)]/35 px-5 py-4"
              >
                <summary className="cursor-pointer list-none font-serif text-[16px] text-[var(--liceu-text)]">
                  <div className="flex items-baseline justify-between gap-6">
                    <span>{item.q}</span>
                    <span className="font-[var(--font-liceu-mono)] text-[10px] tracking-[0.22em] text-[var(--liceu-muted)] group-open:hidden">
                      ABRIR
                    </span>
                    <span className="hidden font-[var(--font-liceu-mono)] text-[10px] tracking-[0.22em] text-[var(--liceu-muted)] group-open:inline">
                      FECHAR
                    </span>
                  </div>
                </summary>
                <p className="mt-3 font-serif text-[14px] leading-[1.9] text-[var(--liceu-muted)]">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </section>

        <footer className="space-y-4 border-t border-[var(--liceu-stone)]/70 pt-10">
          <div className="font-[var(--font-liceu-mono)] text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
            O Liceu Underground
          </div>
          <p className="font-serif text-[15px] leading-[1.95] text-[var(--liceu-text)]">
            Escola de Pensamento Aplicado à Fala. A ordem interna precede a ação.
          </p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 font-[var(--font-liceu-sans)] text-[11px] text-[var(--liceu-muted)]">
            <span>Copyright © 2026 O Liceu. Todos os direitos reservados.</span>
            <Link href="/termos" className="underline underline-offset-4">
              Termos de Uso
            </Link>
            <Link href="/privacidade" className="underline underline-offset-4">
              Política de Privacidade
            </Link>
            <Link href="/contato" className="underline underline-offset-4">
              Contato
            </Link>
          </div>
        </footer>
      </div>
    </ReadingLayout>
  );
}

