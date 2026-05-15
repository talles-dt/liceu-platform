import { ReadingLayout } from "@/components/ReadingLayout";

export default function TermosPage() {
  return (
    <ReadingLayout
      eyebrow="LICEU / TERMOS"
      title="Termos de Uso"
      subtitle="Ultima atualizacao: abril de 2026"
    >
      <div className="space-y-6 font-[var(--font-work-sans)] text-[15px] leading-[1.85] text-[var(--liceu-text)]">
        <section>
          <h2 className="font-[var(--font-noto-serif)] text-xl font-semibold uppercase tracking-tight text-[var(--liceu-heading)] mb-4">
            1. Aceitacao dos Termos
          </h2>
          <p>
            Ao acessar e utilizar a plataforma Liceu (&quot;plataforma&quot;, &quot;servico&quot;), operada por Liceu Educacional (&quot;nos&quot;, &quot;nossa&quot;), voce (&quot;usuario&quot;, &quot;voce&quot;) declara que leu, compreendeu e aceita integralmente os presentes Termos de Uso (&quot;Termos&quot;), que constituem um acordo juridicamente vinculativo entre voce e a plataforma. Caso nao concorde com qualquer disposicao destes Termos, solicitamos que nao utilize nossos servicos.
          </p>
          <p className="mt-3">
            Nos reservamo-nos o direito de atualizar estes Termos a qualquer momento. As alteracoes entrarao em vigor imediatamente apos sua publicacao na plataforma. O uso continuado dos servicos apos a publicacao de alteracoes constitui aceitacao dos novos Termos.
          </p>
        </section>

        <section>
          <h2 className="font-[var(--font-noto-serif)] text-xl font-semibold uppercase tracking-tight text-[var(--liceu-heading)] mb-4">
            2. Elegibilidade
          </h2>
          <p>
            Para utilizar a plataforma Liceu, voce deve:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-3">
            <li>Ser maior de 18 (dezoito) anos ou estar legalmente representado por responsavel legal.</li>
            <li>Possuir capacidade civil plena para celebrar este acordo.</li>
            <li>Fornecer informacoes de cadastro verdadeiras, precisas e atualizadas.</li>
            <li>Nao ter tido sua conta previamente suspensa ou cancelada pela plataforma, salvo reautorizacao expressa.</li>
          </ul>
          <p className="mt-3">
            Ao criar uma conta, voce declara e garante que atende a todos os requisitos de elegibilidade acima. Menores de idade poderao utilizar a plataforma apenas com o consentimento e supervisao de responsavel legal.
          </p>
        </section>

        <section>
          <h2 className="font-[var(--font-noto-serif)] text-xl font-semibold uppercase tracking-tight text-[var(--liceu-heading)] mb-4">
            3. Descricao do Servico
          </h2>
          <p>
            A plataforma Liceu e um ambiente virtual de aprendizado (LMS — Learning Management System) que oferece:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-3">
            <li>Cursos e conteudos educacionais em formato digital.</li>
            <li>Ferramentas de acompanhamento de progresso academico.</li>
            <li>Sistema de tarefas, avaliacoes e envio de trabalhos.</li>
            <li>Canais de comunicacao entre alunos, professores e administradores.</li>
            <li>Gerenciamento de perfis e configuracoes de usuario.</li>
          </ul>
          <p className="mt-3">
            A plataforma e fornecida &quot;no estado em que se encontra&quot; (<em>as is</em>) e &quot;conforme disponivel&quot; (<em>as available</em>). Nao garantimos que o servico sera ininterrupto, livre de erros ou que atendendo a todas as expectativas do usuario. A disponibilidade dos servicos pode ser afetada por fatores fora de nosso controle, como falhas de infraestrutura, forca maior ou caso fortuito.
          </p>
          <p className="mt-3">
            A plataforma nao garante resultados especificos de aprendizado, aprovacao em exames ou qualquer outro resultado academico ou profissional. O aproveitamento depende exclusivamente do empenho e dedicacao do usuario.
          </p>
        </section>

        <section>
          <h2 className="font-[var(--font-noto-serif)] text-xl font-semibold uppercase tracking-tight text-[var(--liceu-heading)] mb-4">
            4. Cadastro e Conta
          </h2>
          <p>
            Para acessar determinadas funcionalidades da plataforma, e necessario criar uma conta. Ao fazelo, voce se compromete a:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-3">
            <li>Fornecer informacoes verdadeiras e completas.</li>
            <li>Manter suas informacoes atualizadas.</li>
            <li>Manter a confidencialidade de suas credenciais de acesso.</li>
            <li>Responsabilizar-se por todas as atividades realizadas em sua conta.</li>
            <li>Notificar-nos imediatamente em caso de uso nao autorizado de sua conta.</li>
          </ul>
          <p className="mt-3">
            Cada usuario e permitido manter apenas uma conta. A criacao de contas falsas ou duplicadas pode resultar em suspensao ou cancelamento imediato.
          </p>
        </section>

        <section>
          <h2 className="font-[var(--font-noto-serif)] text-xl font-semibold uppercase tracking-tight text-[var(--liceu-heading)] mb-4">
            5. Conduta do Usuario
          </h2>
          <p>
            Ao utilizar a plataforma, voce concorda em nao:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-3">
            <li>Violar quaisquer leis, regulamentos ou direitos de terceiros, incluindo direitos de propriedade intelectual.</li>
            <li>Enviar, publicar ou transmitir conteudo que seja ilegal, difamatorio, obsceno, ameaador, abusivo, discriminat ou que incite violencia.</li>
            <li>Fazer upload de conteudo que contenha virus, malware ou qualquer codigo de natureza destrutiva.</li>
            <li>Acessar, alterar ou utilizar partes da plataforma sem devida autorizacao.</li>
            <li>Realizar engenharia reversa, descompilar ou tentar extrair o codigo-fonte da plataforma.</li>
            <li>Utilizar a plataforma para enviar spam ou comunicacoes nao solicitadas.</li>
            <li>Fazer-se passar por outra pessoa ou entidade, ou falsificar sua afiliacao.</li>
            <li>Interferir ou interromper a integridade ou o desempenho da plataforma.</li>
            <li>Coletar dados pessoais de outros usuarios sem consentimento.</li>
          </ul>
          <p className="mt-3">
            Nos reservamo-nos o direito de investigar e tomar medidas adequadas em caso de violacao destes Termos, incluindo a remocao de conteudo, suspensao ou cancelamento da conta e reporte as autoridades competentes.
          </p>
        </section>

        <section>
          <h2 className="font-[var(--font-noto-serif)] text-xl font-semibold uppercase tracking-tight text-[var(--liceu-heading)] mb-4">
            6. Propriedade Intelectual
          </h2>
          <p>
            <strong>Conteudo da plataforma:</strong> todo o conteudo disponibilizado pela plataforma, incluindo textos, graficos, logotipos, icones, imagens, clipes de audio, compilacoes de dados, software e sua compilacao, e de propriedade exclusiva da Liceu Educacional ou de seus licenciadores e e protegido pelas leis brasileiras e internacionais de propriedade intelectual.
          </p>
          <p className="mt-3">
            <strong>Conteudo do usuario:</strong> ao enviar, publicar ou transmitir conteudo na plataforma (incluindo, mas nao se limitando a, respostas a tarefas, trabalhos, comentarios e arquivos), voce declara e garante que:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-3">
            <li>E o autor original do conteudo ou possui todos os direitos necessarios para envia-lo e utiliza-lo na plataforma.</li>
            <li>O conteudo nao viola direitos de propriedade intelectual, privacidade, publicidade ou quaisquer outros direitos de terceiros.</li>
            <li>O conteudo e de sua autoria propria ou foi devidamente atribuido, quando aplicavel.</li>
          </ul>
          <p className="mt-3">
            Ao enviar conteudo, voce concede a plataforma uma licenca nao exclusiva, mundial, royalty-free e sublicenciavel para utilizar, reproduzir, modificar, adaptar, publicar, traduzir e distribuir tal conteudo exclusivamente para fins de prestacao dos servicos educacionais.
          </p>
        </section>

        <section>
          <h2 className="font-[var(--font-noto-serif)] text-xl font-semibold uppercase tracking-tight text-[var(--liceu-heading)] mb-4">
            7. Pagamentos e Reembolsos
          </h2>
          <p>
            Determinados servicos oferecidos pela plataforma podem ser sujeitos ao pagamento de taxas. Os valores e condicoes de pagamento serao apresentados antes da confirmacao da compra.
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-3">
            <li>Os pagamentos sao processados pelo provedor Stripe, em conformidade com os padroes de seguranca PCI DSS.</li>
            <li>Ao realizar um pagamento, voce autoriza a cobranca dos valores indicados.</li>
            <li>Solicitacoes de reembolso serao analisadas caso a caso, em conformidade com a politica de reembolso vigente a epoca da compra.</li>
            <li>Nos reservamo-nos o direito de alterar os precos dos servicos a qualquer momento, sem previo aviso, respeitando os contratos ja firmados.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-[var(--font-noto-serif)] text-xl font-semibold uppercase tracking-tight text-[var(--liceu-heading)] mb-4">
            8. Limitacao de Responsabilidade
          </h2>
          <p>
            Na maxima extensao permitida pela legislacao aplicavel, a Liceu Educacional, seus diretores, funcionarios, parceiros e prestadores de servico nao serao responsaveis por:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-3">
            <li>Quaisquer danos indiretos, incidentais, especiais, consequenciais ou punitivos, incluindo, mas nao se limitando a, perda de lucros, dados, uso, boa vontade ou outras perdas intangiveis.</li>
            <li>Qualquer acesso, uso ou incapacidade de acessar ou utilizar a plataforma.</li>
            <li>Qualquer conduta ou conteudo de terceiros na plataforma, incluindo conteudo difamatorio, ofensivo ou ilegal de outros usuarios.</li>
            <li>Aquisicoes nao autorizadas de sua conta ou conteudo.</li>
            <li>Resultados academicos, profissionais ou quaisquer outros resultados esperados pelo usuario.</li>
          </ul>
          <p className="mt-3">
            A plataforma e fornecida &quot;no estado em que se encontra&quot;, sem garantias de qualquer tipo, expressas ou implcitas, incluindo, mas nao se limitando a, garantias de comerciabilidade, adequacao a um fim especifico e nao violacao.
          </p>
        </section>

        <section>
          <h2 className="font-[var(--font-noto-serif)] text-xl font-semibold uppercase tracking-tight text-[var(--liceu-heading)] mb-4">
            9. Rescisao
          </h2>
          <p>
            Podemos suspender ou encerrar sua conta e acesso a plataforma a qualquer momento, a nosso exclusivo criterio, sem previo aviso, por qualquer motivo, incluindo, mas nao se limitando a, violacao destes Termos.
          </p>
          <p className="mt-3">
            Em caso de rescisao:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-3">
            <li>Seu direito de utilizar a plataforma cessara imediatamente.</li>
            <li>Disposicoes que, por sua natureza, devam sobreviver a rescisao permanecer em vigor, incluindo, mas nao se limitando a, propriedade intelectual, limitacao de responsabilidade e lei aplicavel.</li>
            <li>Podemos, a nosso exclusivo criterio, manter ou eliminar seu conteudo e dados associados a sua conta, conforme permitido pela legislacao aplicavel.</li>
          </ul>
          <p className="mt-3">
            Voce pode encerrar sua conta a qualquer momento entrando em contato conosco pelo e-mail{" "}
            <a
              href="mailto:contato@oliceu.com"
              className="underline text-[var(--liceu-accent)] hover:text-[var(--liceu-heading)]"
            >
              contato@oliceu.com
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="font-[var(--font-noto-serif)] text-xl font-semibold uppercase tracking-tight text-[var(--liceu-heading)] mb-4">
            10. Privacidade
          </h2>
          <p>
            Nossa Politica de Privacidade descreve como coletamos, utilizamos e compartilhamos suas informacoes pessoais. Ao utilizar a plataforma, voce consente com a coleta e uso de suas informacoes conforme descrito em nossa Politica de Privacidade, disponvel em{" "}
            <a
              href="/privacidade"
              className="underline text-[var(--liceu-accent)] hover:text-[var(--liceu-heading)]"
            >
              /privacidade
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="font-[var(--font-noto-serif)] text-xl font-semibold uppercase tracking-tight text-[var(--liceu-heading)] mb-4">
            11. Lei Aplicavel e Foro
          </h2>
          <p>
            Estes Termos sao regidos e interpretados de acordo com as leis da Republica Federativa do Brasil, excluidos seus conflitos de normas.
          </p>
          <p className="mt-3">
            Fica eleito o foro da comarca do domicilio do usuario para dirimir quaisquer duvidas ou controversias decorrentes destes Termos, com renuncia expressa a qualquer outro, por mais privilegiado que seja. Em caso de impossibilidade, sera competente o foro da comarca de Sao Paulo, Estado de Sao Paulo.
          </p>
        </section>

        <section>
          <h2 className="font-[var(--font-noto-serif)] text-xl font-semibold uppercase tracking-tight text-[var(--liceu-heading)] mb-4">
            12. Disposicoes Gerais
          </h2>
          <p>
            <strong>Totalidade do acordo:</strong> estes Termos, juntamente com a Politica de Privacidade e quaisquer documentos neles referenciados, constituem a totalidade do acordo entre voce e a Liceu Educacional no que se refere ao uso da plataforma.
          </p>
          <p className="mt-3">
            <strong>Indivisibilidade:</strong> se qualquer disposicao destes Termos for considerada invalida ou inexequvel por um tribunal competente, as demais disposicoes permanecerem em pleno vigor e efeito.
          </p>
          <p className="mt-3">
            <strong>Nao renuncia:</strong> a falha em exercer qualquer direito ou disposicao destes Termos nao constituira renuncia a tal direito ou disposicao.
          </p>
          <p className="mt-3">
            <strong>Cesao:</strong> voce nao podera ceder ou transferir estes Termos, no todo ou em parte, sem nosso consentimento previo por escrito.
          </p>
        </section>

        <section>
          <h2 className="font-[var(--font-noto-serif)] text-xl font-semibold uppercase tracking-tight text-[var(--liceu-heading)] mb-4">
            13. Contato
          </h2>
          <p>
            Para duvidas, comentarios ou solicitacoes relacionadas a estes Termos de Uso, entre em contato conosco:
          </p>
          <div className="mt-3 p-4 border border-[var(--liceu-stone)] bg-[var(--liceu-bg)] space-y-1">
            <p>
              <strong>E-mail:</strong>{" "}
              <a
                href="mailto:contato@oliceu.com"
                className="underline text-[var(--liceu-accent)] hover:text-[var(--liceu-heading)]"
              >
                contato@oliceu.com
              </a>
            </p>
            <p>
              <strong>Site:</strong> www.oliceu.com
            </p>
          </div>
        </section>
      </div>
    </ReadingLayout>
  );
}
