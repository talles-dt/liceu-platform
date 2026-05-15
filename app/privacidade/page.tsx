import { ReadingLayout } from "@/components/ReadingLayout";

export default function PrivacidadePage() {
  return (
    <ReadingLayout
      eyebrow="LICEU / PRIVACIDADE"
      title="Politica de Privacidade"
      subtitle="Ultima atualizacao: abril de 2026"
    >
      <div className="space-y-6 font-[var(--font-work-sans)] text-[15px] leading-[1.85] text-[var(--liceu-text)]">
        <section>
          <h2 className="font-[var(--font-noto-serif)] text-xl font-semibold uppercase tracking-tight text-[var(--liceu-heading)] mb-4">
            1. Introducao
          </h2>
          <p>
            A plataforma Liceu (&quot;nos&quot;, &quot;nossa&quot;, &quot;plataforma&quot;), operada por Liceu Educacional, respeita a privacidade de todos os usuarios e esta comprometida com a protecao dos dados pessoais em conformidade com a Lei Geral de Protecao de Dados (Lei n. 13.709/2018 — LGPD). Esta Politica de Privacidade descreve como coletamos, utilizamos, armazenamos e compartilhamos seus dados pessoais ao utilizar nossos servicos acessados por meio de www.oliceu.com.
          </p>
        </section>

        <section>
          <h2 className="font-[var(--font-noto-serif)] text-xl font-semibold uppercase tracking-tight text-[var(--liceu-heading)] mb-4">
            2. Dados Coletados
          </h2>
          <p>Coletamos as seguintes categorias de dados pessoais:</p>
          <ul className="list-disc pl-6 space-y-2 mt-3">
            <li>
              <strong>Dados de identificacao:</strong> nome completo, endereco de e-mail, foto de perfil e dados de cadastro fornecidos durante o registro ou atualizacao do perfil.
            </li>
            <li>
              <strong>Dados de acesso:</strong> endereco IP, tipo de navegador, sistema operacional, data e hora de acesso, paginas visitadas e tempo de permanencia.
            </li>
            <li>
              <strong>Dados de uso da plataforma:</strong> cursos matriculados, progresso nas disciplinas, atividades concluidas, notas e historico academico.
            </li>
            <li>
              <strong>Conteudo gerado pelo usuario:</strong> respostas a tarefas, trabalhos enviados, arquivos anexados, comentarios e comunicacoes com professores e colegas.
            </li>
            <li>
              <strong>Dados de pagamento:</strong> informacoes necessarias para processamento de transacoes financeiras, processadas diretamente pelo provedor de pagamento (Stripe). Nao armazenamos dados de cartao de credito em nossos servidores.
            </li>
            <li>
              <strong>Cookies e tecnologias similares:</strong> cookies essenciais, de preferencia, analiticos e de marketing, conforme detalhado na secao 7 desta politica.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-[var(--font-noto-serif)] text-xl font-semibold uppercase tracking-tight text-[var(--liceu-heading)] mb-4">
            3. Finalidade do Tratamento
          </h2>
          <p>Seus dados pessoais sao tratados para as seguintes finalidades:</p>
          <ul className="list-disc pl-6 space-y-2 mt-3">
            <li>Fornecimento, operacao e manutencao da plataforma educacional.</li>
            <li>Criacao e gerenciamento de contas de usuario.</li>
            <li>Processamento de inscricoes, matriculas e pagamentos.</li>
            <li>Disponibilizacao de conteudos educacionais e acompanhamento do progresso academico.</li>
            <li>Comunicacao com o usuario, incluindo notificacoes sobre atividades, prazos e atualizacoes da plataforma.</li>
            <li>Envio de comunicacoes por e-mail, utilizando o servico Resend.</li>
            <li>Melhoria da experiencia do usuario e desenvolvimento de novas funcionalidades.</li>
            <li>Cumprimento de obrigacoes legais e regulatorias.</li>
            <li>Prevencao a fraude e garantia da seguranca da plataforma.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-[var(--font-noto-serif)] text-xl font-semibold uppercase tracking-tight text-[var(--liceu-heading)] mb-4">
            4. Base Legal
          </h2>
          <p>
            O tratamento de dados pessoais e realizado com base nas seguintes hipoteses legais previstas na LGPD:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-3">
            <li>
              <strong>Consentimento:</strong> quando o usuario consente expressamente com o tratamento de seus dados para finalidades especificas, como o envio de comunicacoes de marketing.
            </li>
            <li>
              <strong>Execucao de contrato:</strong> quando o tratamento e necessario para a execucao do contrato de prestacao de servicos educacionais do qual o usuario e parte.
            </li>
            <li>
              <strong>Legitimo interesse:</strong> quando necessario para atender a nossos legitimos interesses, como a melhoria da plataforma e a prevencao a fraude, respeitados os direitos e liberdades fundamentais do titular.
            </li>
            <li>
              <strong>Cumprimento de obrigacao legal:</strong> quando o tratamento e necessario para o cumprimento de obrigacao legal ou regulatoria.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-[var(--font-noto-serif)] text-xl font-semibold uppercase tracking-tight text-[var(--liceu-heading)] mb-4">
            5. Retencao de Dados
          </h2>
          <p>
            Seus dados pessoais serao mantidos pelo tempo necessario para cumprir as finalidades descritas nesta politica, enquanto sua conta estiver ativa, ou conforme exigido por lei. Especificamente:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-3">
            <li>
              <strong>Dados de conta:</strong> mantidos enquanto a conta estiver ativa e por um periodo adicional de ate 5 (cinco) anos apos o encerramento, para cumprimento de obrigacoes legais e fiscais.
            </li>
            <li>
              <strong>Dados de uso e progresso academico:</strong> mantidos durante a vigencia do contrato e por ate 2 (dois) anos apos o encerramento, salvo exigencia legal diversa.
            </li>
            <li>
              <strong>Arquivos enviados em tarefas:</strong> mantidos enquanto o curso estiver ativo e por ate 1 (um) ano apos a conclusao ou cancelamento.
            </li>
            <li>
              <strong>Logs de acesso:</strong> mantidos por 6 (seis) meses, conforme previsto no Marco Civil da Internet (Lei n. 12.965/2014).
            </li>
          </ul>
          <p className="mt-3">
            Apos os prazos indicados, os dados serao anonimiz ou eliminados de forma segura.
          </p>
        </section>

        <section>
          <h2 className="font-[var(--font-noto-serif)] text-xl font-semibold uppercase tracking-tight text-[var(--liceu-heading)] mb-4">
            6. Direitos do Titular
          </h2>
          <p>
            Em conformidade com o artigo 18 da LGPD, voce possui os seguintes direitos, que podera exercer a qualquer momento entrando em contato com nosso Encarregado de Protecao de Dados (DPO) pelo e-mail{" "}
            <a
              href="mailto:contato@oliceu.com"
              className="underline text-[var(--liceu-accent)] hover:text-[var(--liceu-heading)]"
            >
              contato@oliceu.com
            </a>
            :
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-3">
            <li>
              <strong>Confirmacao e acesso:</strong> solicitar confirmacao da existencia de tratamento de seus dados pessoais e acesso aos mesmos.
            </li>
            <li>
              <strong>Correcao:</strong> solicitar a correcao de dados incompletos, inexatos ou desatualizados.
            </li>
            <li>
              <strong>Anonimizacao, bloqueio ou eliminacao:</strong> solicitar a anonimizacao, bloqueio ou eliminacao de dados desnecessarios, excessivos ou tratados em desconformidade com a lei.
            </li>
            <li>
              <strong>Portabilidade:</strong> solicitar a portabilidade de seus dados pessoais a outro fornecedor de servico, conforme regulamentacao da autoridade nacional.
            </li>
            <li>
              <strong>Elimacao:</strong> solicitar a eliminacao dos dados pessoais tratados com base no consentimento, exceto nas hipoteses previstas na LGPD.
            </li>
            <li>
              <strong>Revogacao do consentimento:</strong> revogar seu consentimento a qualquer momento, sem prejuizo da licitude do tratamento anterior.
            </li>
            <li>
              <strong>Informacao sobre compartilhamento:</strong> ser informado sobre as entidades publicas e privadas com as quais compartilhamos seus dados.
            </li>
            <li>
              <strong>Opposicao:</strong> opor-se ao tratamento realizado com fundamento em uma das hipoteses de dispensa de consentimento, em caso de descumprimento da lei.
            </li>
          </ul>
          <p className="mt-3">
            As solicitacoes serao respondidas em ate 15 (quinze) dias, conforme previsto na LGPD. Nos reservamo-nos o direito de solicitar informacoes adicionais para verificacao de identidade antes de atender a solicitacao.
          </p>
        </section>

        <section>
          <h2 className="font-[var(--font-noto-serif)] text-xl font-semibold uppercase tracking-tight text-[var(--liceu-heading)] mb-4">
            7. Cookies e Tecnologias Similares
          </h2>
          <p>
            Utilizamos cookies e tecnologias similares para melhorar a experiencia de navegacao. Classificamos os cookies nas seguintes categorias:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-3">
            <li>
              <strong>Cookies essenciais:</strong> necessarios para o funcionamento basico da plataforma, como autenticacao e seguranca. Nao requerem consentimento previo.
            </li>
            <li>
              <strong>Cookies de preferencia:</strong> permitem que a plataforma lembre de suas escolhas, como idioma e configuracoes de exibicao.
            </li>
            <li>
              <strong>Cookies analiticos:</strong> nos auxiliam a entender como os usuarios interagem com a plataforma, permitindo melhorias continuas.
            </li>
          </ul>
          <p className="mt-3">
            Voce pode gerenciar suas preferencias de cookies por meio das configuracoes do seu navegador. A desativacao de cookies essenciais pode afetar o funcionamento da plataforma.
          </p>
        </section>

        <section>
          <h2 className="font-[var(--font-noto-serif)] text-xl font-semibold uppercase tracking-tight text-[var(--liceu-heading)] mb-4">
            8. Compartilhamento de Dados
          </h2>
          <p>
            Compartilhamos seus dados pessoais com os seguintes fornecedores de servicos, exclusivamente para as finalidades aqui descritas:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-3">
            <li>
              <strong>Supabase:</strong> utilizado para armazenamento de dados e banco de dados em nuvem. Os dados sao armazenados em servidores seguros com criptografia.
            </li>
            <li>
              <strong>Resend:</strong> utilizado para envio de comunicacoes por e-mail, como notificacoes de atividades, recuperacao de senha e boletins informativos.
            </li>
            <li>
              <strong>Stripe:</strong> utilizado para processamento de pagamentos. Os dados de pagamento sao tratados diretamente pelo Stripe, em conformidade com os padroes PCI DSS.
            </li>
          </ul>
          <p className="mt-3">
            Nao vendemos seus dados pessoais a terceiros. Qualquer compartilhamento adicional sera realizado apenas com seu consentimento expresso ou quando exigido por lei.
          </p>
        </section>

        <section>
          <h2 className="font-[var(--font-noto-serif)] text-xl font-semibold uppercase tracking-tight text-[var(--liceu-heading)] mb-4">
            9. Seguranca dos Dados
          </h2>
          <p>
            Adotamos medidas tecnicas e organizacionais adequadas para proteger seus dados pessoais contra acesso nao autorizado, perda, alteracao ou divulgacao. Entre as medidas adotadas estao: criptografia de dados em transito (TLS) e em repouso, controle de acesso baseado em funcoes, monitoramento continuo de seguranca e auditorias periodicas.
          </p>
        </section>

        <section>
          <h2 className="font-[var(--font-noto-serif)] text-xl font-semibold uppercase tracking-tight text-[var(--liceu-heading)] mb-4">
            10. Transferencia Internacional de Dados
          </h2>
          <p>
            Alguns de nossos fornecedores de servicos podem processar dados em servidores localizados fora do Brasil. Nesses casos, asseguramos que o tratamento seja realizado em conformidade com a LGPD e que sejam adotadas garantias adequadas, como clausulas contratuais padrao ou decisoes de adequacao emitidas pela autoridade competente.
          </p>
        </section>

        <section>
          <h2 className="font-[var(--font-noto-serif)] text-xl font-semibold uppercase tracking-tight text-[var(--liceu-heading)] mb-4">
            11. Alteracoes nesta Politica
          </h2>
          <p>
            Esta Politica de Privacidade pode ser atualizada periodicamente para refletir alteracoes em nossas praticas de dados, na legislacao aplicavel ou em nossos servicos. Em caso de alteracoes relevantes, notificaremos os usuarios por meio da plataforma ou por e-mail. A data da ultima atualizacao sera sempre indicada no inicio deste documento.
          </p>
        </section>

        <section>
          <h2 className="font-[var(--font-noto-serif)] text-xl font-semibold uppercase tracking-tight text-[var(--liceu-heading)] mb-4">
            12. Contato e Encarregado de Protecao de Dados
          </h2>
          <p>
            Para exercer seus direitos, esclarecer duvidas ou apresentar solicitacoes relacionadas a esta Politica de Privacidade, entre em contato com nosso Encarregado de Protecao de Dados (DPO):
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
          </div>
        </section>
      </div>
    </ReadingLayout>
  );
}
