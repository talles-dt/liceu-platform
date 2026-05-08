"use client"
import { useState, useMemo, useEffect, KeyboardEvent, ChangeEvent } from "react"

// ─── ENV ─────────────────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
const CHECKOUT_URL = "/checkout"

// ─── TIPOS ───────────────────────────────────────────────────────────────────
type DimKey =
  | "logos" | "pathos" | "ethos"
  | "inventio" | "dispositio" | "memoria"
  | "elocutio" | "actio" | "resiliencia"

type Scores = Record<DimKey, number>
type Answers = Record<number, number>

type ArchKey =
  | "silencio" | "hierofante"
  | "arquiteto" | "tribuno" | "anatema" | "iconoclasta"
  | "profeta" | "demagogo" | "oraculo" | "incendio"

interface Option {
  t: string
  s: Partial<Record<DimKey, number>>
}

interface Question {
  id: number
  text: string
  opts: [Option, Option, Option]
}

interface Archetype {
  num: string
  nome: string
  subtitulo: string
  cor: string
  citacao: string
  forcas: string | null
  subotimo: string
  sombra: string
  exemplos: string[] | null
  cta: string
  ethos_alto: string | null
  ethos_baixo: string | null
}

interface UserData {
  email: string
  name: string
}

interface DiagnosticPayload {
  email: string
  answers: Answers
  scores: Scores
  archetype_key: ArchKey
  archetype_name: string
  ethos_level: "alto" | "baixo"
}

interface SavedSession extends DiagnosticPayload {
  id: string
  share_token: string
}

// ─── DIMENSÕES ───────────────────────────────────────────────────────────────
const DIMS: DimKey[] = [
  "logos","pathos","ethos",
  "inventio","dispositio","memoria",
  "elocutio","actio","resiliencia",
]

const DIM_PT: Record<DimKey, string> = {
  logos:"Logos", pathos:"Pathos", ethos:"Ethos",
  inventio:"Inventio", dispositio:"Dispositio", memoria:"Memória",
  elocutio:"Elocutio", actio:"Actio", resiliencia:"Resiliência",
}

// ─── QUESTÕES ────────────────────────────────────────────────────────────────
const QUESTIONS: Question[] = [
  {id:1,text:"Você precisa convencer alguém que discorda de você visceralmente. O que você prioriza?",opts:[
    {t:"Construo o argumento mais sólido possível. Se a lógica for irrefutável, a resistência cede.",s:{logos:3}},
    {t:"Antes do argumento, preciso encontrar o ponto onde nos conectamos. Convicção sem conexão não atravessa.",s:{pathos:2,ethos:1}},
    {t:"Estabeleço primeiro por que sou uma fonte legítima para falar sobre isso. Credibilidade abre a porta.",s:{ethos:3}},
  ]},
  {id:2,text:"Você tem 15 minutos para preparar uma fala sobre um tema que domina. O que faz primeiro?",opts:[
    {t:"Estruturo: abertura, argumentos por ordem de força, conclusão.",s:{dispositio:3}},
    {t:"Deixo as ideias virem e capturo o que aparece de mais forte e vivo.",s:{inventio:3}},
    {t:"Já sei o que vou dizer. O problema não é o conteúdo — é a entrega.",s:{actio:2,memoria:1}},
  ]},
  {id:3,text:"Durante uma apresentação, alguém expõe uma lacuna real no seu argumento. Você:",opts:[
    {t:"Reconheço a lacuna diretamente e redireciono — integridade vale mais que aparência.",s:{ethos:2,resiliencia:1}},
    {t:"Mantenho a compostura, respondo o que posso e sigo em frente sem colapsar.",s:{resiliencia:3}},
    {t:"Sinto o impacto, perco o ritmo e levo tempo para me recuperar.",s:{resiliencia:-2}},
  ]},
  {id:4,text:"A audiência está perdendo interesse no meio da sua fala. O que muda primeiro?",opts:[
    {t:"Intensifico dados e exemplos concretos. Âncora racional antes de tudo.",s:{logos:2,dispositio:1}},
    {t:"Mudo tom, velocidade, faço uma pergunta retórica. Reconecto pelo afeto.",s:{pathos:2,actio:1}},
    {t:"Simplifico a estrutura em voz alta — 'estamos aqui, vamos para lá.'",s:{dispositio:3}},
  ]},
  {id:5,text:"Quando você prepara um discurso, onde passa mais tempo?",opts:[
    {t:"Escolhendo as palavras certas. A precisão da linguagem é onde o discurso ganha ou perde.",s:{elocutio:3}},
    {t:"Decidindo a sequência. A ordem dos argumentos é o que faz a ideia pousar.",s:{dispositio:3}},
    {t:"Repetindo em voz alta até internalizar completamente. Só existe o que já incorporei.",s:{memoria:3}},
  ]},
  {id:6,text:"Uma crítica pública e ácida ao seu trabalho aparece diante de pessoas que você respeita. Você:",opts:[
    {t:"Processo depois, em privado. Na hora, mantenho a postura e respondo com calma.",s:{resiliencia:3}},
    {t:"Sinto o impacto visivelmente, mas me forço a continuar. Não colapso, mas sangra.",s:{resiliencia:1}},
    {t:"A exposição me paralisa momentaneamente. Preciso de tempo antes de responder.",s:{resiliencia:-3}},
  ]},
  {id:7,text:"Você assiste a uma fala que te impressiona profundamente. O que te impressionou?",opts:[
    {t:"A solidez do raciocínio. Cada passo levava ao próximo sem falha.",s:{logos:3}},
    {t:"O modo como usou o corpo, a voz, o silêncio. Era impossível não prestar atenção.",s:{actio:3}},
    {t:"As palavras em si. Certas frases eram tão precisas que não poderiam ser trocadas.",s:{elocutio:3}},
  ]},
  {id:8,text:"Seu oponente usa um argumento emocionalmente poderoso mas logicamente fraco. Você:",opts:[
    {t:"Desmonto a falácia com precisão cirúrgica. Clareza lógica é a resposta para manipulação emocional.",s:{logos:3}},
    {t:"Reconheço a emoção legítima por trás do argumento e construo em cima dela, não contra ela.",s:{pathos:2,ethos:1}},
    {t:"Ofereço um contraponto igualmente emocional, mas mais verdadeiro. Fogo apaga fogo.",s:{pathos:3}},
  ]},
  {id:9,text:"Na hora de falar em público, o que você sente como sua maior âncora?",opts:[
    {t:"Saber que o argumento está blindado. Se a lógica está sólida, o resto vem.",s:{logos:2,dispositio:1}},
    {t:"Ter ensaiado o suficiente para que o conteúdo seja parte de mim.",s:{memoria:3}},
    {t:"Sentir que a audiência está me vendo, não ao texto. A presença é o discurso.",s:{actio:3}},
  ]},
  {id:10,text:"Você discorda profundamente de algo que seu superior defende publicamente. O que faz?",opts:[
    {t:"Espero o momento certo e apresento minha posição com argumentos. Hierarquia não silencia razão.",s:{ethos:2,logos:1}},
    {t:"Avalio se vale a exposição. Às vezes o silêncio estratégico é a posição mais inteligente.",s:{dispositio:2,resiliencia:1}},
    {t:"Deixo passar. Conflito com superior raramente vale o custo.",s:{resiliencia:-2}},
  ]},
  {id:11,text:"Você precisa construir um argumento novo sobre algo que nunca discutiu antes. O que acontece primeiro?",opts:[
    {t:"As ideias chegam em fluxos — associações, imagens, exemplos. O argumento se forma enquanto penso.",s:{inventio:3}},
    {t:"Preciso de silêncio para estruturar. Primeiro o esqueleto, depois a carne.",s:{dispositio:3}},
    {t:"Procuro o que sei com certeza e construo a partir daí. Só falo do que domino.",s:{ethos:2,memoria:1}},
  ]},
  {id:12,text:"Em apresentações longas, como você lida com o material?",opts:[
    {t:"Internalizo completamente — se preciso de anotação, ainda não estou pronto.",s:{memoria:3}},
    {t:"Tenho pontos-âncora anotados, mas o discurso é construído no momento.",s:{inventio:2,actio:1}},
    {t:"Preparo o texto com precisão e domino cada escolha de palavra.",s:{elocutio:2,memoria:1}},
  ]},
  {id:13,text:"Você acabou de terminar um discurso. O que analisa primeiro?",opts:[
    {t:"Se as palavras foram precisas — se cada frase disse exatamente o que devia.",s:{elocutio:3}},
    {t:"Se a audiência reagiu da forma que eu esperava emocionalmente.",s:{pathos:3}},
    {t:"Se a estrutura segurou o argumento do início ao fim.",s:{dispositio:3}},
  ]},
  {id:14,text:"Você percebe que sua voz e seu corpo estão desconectados do que está dizendo. O que faz?",opts:[
    {t:"Reconecto com a emoção por trás do argumento e deixo o corpo seguir.",s:{actio:2,pathos:1}},
    {t:"Ajusto o ritmo — velocidade, volume, pausa. Controlo tecnicamente até realinhar.",s:{actio:3}},
    {t:"Foco no conteúdo. Se o argumento for sólido, a presença física é secundária.",s:{logos:2,elocutio:1}},
  ]},
  {id:15,text:"Alguém que você respeita muito diz publicamente que seu raciocínio foi superficial. Você:",opts:[
    {t:"Ouço, avalio com honestidade, absorvo o válido e descarto o que não for.",s:{resiliencia:3}},
    {t:"Sinto o peso, mas mantenho a posição enquanto processo internamente.",s:{resiliencia:2}},
    {t:"A opinião de quem respeito tem peso diferente — levo mais tempo para me recuperar.",s:{resiliencia:-1}},
  ]},
  {id:16,text:"Você precisa rebater um argumento em tempo real, sem preparação. O que aciona primeiro?",opts:[
    {t:"Identifico a premissa fraca e ataco ali. Todo argumento colapsa pela base.",s:{logos:3}},
    {t:"Ouço até o fim antes de formular qualquer resposta.",s:{dispositio:2,ethos:1}},
    {t:"Redireciono para um ponto onde tenho terreno mais firme.",s:{inventio:2,pathos:1}},
  ]},
  {id:17,text:"Você precisa que a audiência tome uma decisão depois da sua fala. O que prioriza?",opts:[
    {t:"O caso racional mais sólido possível. Decisões boas vêm de razões boas.",s:{logos:3}},
    {t:"Faço com que sintam o custo de não decidir. Urgência emocional move antes que o argumento convença.",s:{pathos:3}},
    {t:"Mostro por que sou a pessoa certa para guiar essa decisão. Confiança precede ação.",s:{ethos:3}},
  ]},
  {id:18,text:"Antes de qualquer fala importante, o que você precisa sentir?",opts:[
    {t:"Que o argumento está blindado. Lógica irrefutável traz confiança naturalmente.",s:{logos:2,dispositio:1}},
    {t:"Que sou coerente com o que vou defender. Só falo o que realmente acredito e vivo.",s:{ethos:3}},
    {t:"Que estou conectado com a audiência — que existe relação real antes das palavras.",s:{pathos:2,ethos:1}},
  ]},
  {id:19,text:"48 horas para a apresentação mais importante da sua carreira. Como começa?",opts:[
    {t:"Crio o esqueleto completo primeiro — abertura, desenvolvimento, conclusão — e só então preencho.",s:{dispositio:3}},
    {t:"Reúno o material e começo a encontrar os padrões que emergem naturalmente.",s:{inventio:3}},
    {t:"Começo pelo fim — o que quero que a audiência sinta ao sair — e construo de trás pra frente.",s:{pathos:2,dispositio:1}},
  ]},
  {id:20,text:"Você está preso num argumento circular sem saída aparente. O que faz?",opts:[
    {t:"Mudo completamente de ângulo — encontro uma entrada que ninguém usou ainda.",s:{inventio:3}},
    {t:"Volto ao início e refaço a estrutura. O problema está na base.",s:{dispositio:3}},
    {t:"Busco exemplos concretos que iluminem o que o argumento abstrato não consegue.",s:{logos:2,elocutio:1}},
  ]},
  {id:21,text:"Alguém descobre uma inconsistência real entre o que você defende e o que você pratica. Você:",opts:[
    {t:"Reconheço abertamente. Credibilidade real sobrevive à admissão de falha — não à negação.",s:{ethos:3,resiliencia:1}},
    {t:"Explico o contexto que gerou a inconsistência. Não é negação — é nuance.",s:{logos:2,ethos:1}},
    {t:"Processo em privado. Exposição pública de inconsistência pessoal não ajuda ninguém.",s:{resiliencia:1,dispositio:1}},
  ]},
  {id:22,text:"Você está num ambiente deliberadamente hostil — audiência que quer te ver falhar. O que acontece internamente?",opts:[
    {t:"Ativo. Hostilidade clareia minha mente — o adversário me faz mais preciso.",s:{resiliencia:3}},
    {t:"Mantenho o plano, ignoro o ambiente, entrego o que preparei.",s:{resiliencia:2,dispositio:1}},
    {t:"O ambiente me afeta — perco parte da minha capacidade quando sinto hostilidade ativa.",s:{resiliencia:-2}},
  ]},
  {id:23,text:"Dois discursos: um logicamente impecável mas frio, outro emocionalmente poderoso mas com falhas visíveis. Qual você preferia ter feito?",opts:[
    {t:"O lógico. Prefiro ser irrefutável a ser irresistível.",s:{logos:3}},
    {t:"O emocional. Prefiro mover a convencer.",s:{pathos:3}},
    {t:"Nenhum — um discurso sem os dois é sempre incompleto.",s:{ethos:2,logos:1}},
  ]},
  {id:24,text:"Alguém transcreve sua fala e a lê sem nunca ter te visto. Você quer que:",opts:[
    {t:"O texto sozinho seja poderoso — as palavras carreguem tudo mesmo sem a entrega.",s:{elocutio:3}},
    {t:"Ela sinta falta de algo — que o texto sem o corpo seja claramente incompleto.",s:{actio:3}},
    {t:"A lógica seja evidente mesmo no papel — a estrutura do argumento apareça claramente.",s:{logos:2,dispositio:1}},
  ]},
  {id:25,text:"No meio de uma fala, uma ideia nova e melhor aparece. Diferente do que você preparou. Você:",opts:[
    {t:"Sigo o que preparei. Improvisação em público tem custo alto demais.",s:{memoria:3}},
    {t:"Incorporo se for genuinamente mais forte — confio no meu repertório.",s:{inventio:3}},
    {t:"Anoto mentalmente e deixo para depois. Há um momento certo para tudo.",s:{dispositio:2,memoria:1}},
  ]},
  {id:26,text:"Você pode ganhar um debate usando um argumento verdadeiro mas deliberadamente incompleto. Você:",opts:[
    {t:"Não uso. Vitória retórica que compromete integridade não é vitória.",s:{ethos:3}},
    {t:"Uso com critério — todo argumento é incompleto, a questão é o grau.",s:{logos:2,ethos:1}},
    {t:"Uso se a causa for importante o suficiente. Fins justificados por meios é estratégia, não cinismo.",s:{pathos:1,logos:2}},
  ]},
  {id:27,text:"Depois de uma fala que não foi bem — tecnicamente ou em recepção — o que acontece?",opts:[
    {t:"Analiso friamente, extraio o que aprendi e sigo. Falha é dado, não identidade.",s:{resiliencia:3}},
    {t:"Levo algum tempo para processar, mas me recupero sem sequelas duradouras.",s:{resiliencia:2}},
    {t:"Fica comigo mais tempo do que deveria — a memória de ter falhado me incomoda persistentemente.",s:{resiliencia:-2}},
  ]},
  {id:28,text:"Você descobre uma falha real no argumento central da sua tese. A apresentação começa em uma hora. Você:",opts:[
    {t:"Reformulo a partir da falha. Argumento com limitações reconhecidas é mais forte que um que as ignora.",s:{logos:3}},
    {t:"Redireciono a apresentação para evitar a área problemática.",s:{dispositio:2,inventio:1}},
    {t:"Sigo como planejado — uma hora não é tempo para refazer.",s:{memoria:2,resiliencia:1}},
  ]},
  {id:29,text:"Você precisa dar uma notícia difícil para uma audiência que vai resistir. O que prioriza?",opts:[
    {t:"Construo o racional de por que é necessário antes de revelar o que é.",s:{logos:2,dispositio:1}},
    {t:"Reconheço a dificuldade emocionalmente antes de qualquer argumento. Eles precisam sentir que são vistos primeiro.",s:{pathos:3}},
    {t:"Estabeleço credibilidade e intenção antes de entrar no conteúdo.",s:{ethos:3}},
  ]},
  {id:30,text:"Como você sabe que uma fala foi bem-sucedida?",opts:[
    {t:"Quando identifico os momentos onde vi os rostos mudarem de resistência para compreensão.",s:{logos:2,actio:1}},
    {t:"Quando sinto que meu corpo e minha voz estavam completamente alinhados com o que eu dizia.",s:{actio:3}},
    {t:"Quando alguém me repete exatamente uma frase que usei — as palavras grudaram.",s:{elocutio:3}},
  ]},
  {id:31,text:"Você analisa uma fala que admirou. O que mais te impressionou na estrutura?",opts:[
    {t:"Como cada parte preparava a próxima — a progressão era inevitável.",s:{dispositio:3}},
    {t:"Como sabia exatamente onde colocar o argumento mais forte — o timing do peso.",s:{pathos:2,dispositio:1}},
    {t:"Como o orador adaptou a estrutura ao ritmo da audiência em tempo real.",s:{actio:2,inventio:1}},
  ]},
  {id:32,text:"Você tem uma ideia brilhante mas não encontra as palavras certas. O que faz?",opts:[
    {t:"Falo de forma imperfeita — a ideia no mundo é mais útil que a ideia perfeita na minha cabeça.",s:{inventio:3}},
    {t:"Espero. Uma ideia mal-articulada pode fazer mais mal do que bem.",s:{elocutio:2,dispositio:1}},
    {t:"Uso uma analogia ou exemplo concreto enquanto encontro a formulação precisa.",s:{elocutio:2,inventio:1}},
  ]},
  {id:33,text:"Como você define sua responsabilidade como orador?",opts:[
    {t:"Apresentar o argumento mais sólido possível — o que a audiência faz com ele é problema dela.",s:{logos:2}},
    {t:"Sou responsável pelo efeito que minhas palavras têm — mesmo efeitos que não previ.",s:{ethos:3}},
    {t:"Comunicar com precisão — clareza é a forma máxima de respeito pela audiência.",s:{elocutio:2,ethos:1}},
  ]},
  {id:34,text:"Alguém humilha você publicamente com intenção clara de destruir sua credibilidade. Você:",opts:[
    {t:"Respondo com calma e precisão. Compostura sob ataque é o argumento mais forte.",s:{resiliencia:3,ethos:1}},
    {t:"Absorvo o golpe visivelmente, mas me recupero e respondo.",s:{resiliencia:1}},
    {t:"A humilhação pública me paralisa. Preciso de tempo para me recompor.",s:{resiliencia:-3}},
  ]},
  {id:35,text:"Você precisa encontrar um ângulo completamente novo para um tema já muito discutido. Onde começa?",opts:[
    {t:"Procuro o pressuposto que todo mundo aceita sem questionar — e questiono.",s:{inventio:3}},
    {t:"Pesquiso o que os melhores já disseram e encontro o ponto que nenhum deles desenvolveu.",s:{logos:2,inventio:1}},
    {t:"Parto da minha experiência pessoal — o que vivi que ilumina algo que os outros não viram.",s:{ethos:2,inventio:1}},
  ]},
  {id:36,text:"Se você pudesse ter apenas uma qualidade como orador, qual escolheria?",opts:[
    {t:"Clareza absoluta. Que nenhuma palavra minha precise de interpretação.",s:{elocutio:3}},
    {t:"Presença inabalável. Que ninguém consiga me tirar do eixo — dentro ou fora do palco.",s:{resiliencia:2,actio:1}},
    {t:"Autoridade genuína. Que as pessoas confiem em mim antes de eu terminar a primeira frase.",s:{ethos:3}},
  ]},
]

// ─── ARCHETYPES ──────────────────────────────────────────────────────────────
const ARCHETYPES: Record<ArchKey, Archetype> = {
  silencio:{
    num:"∅", nome:"O Silêncio", subtitulo:"Nondum", cor:"#888780",
    citacao:"Você ainda não está pronto para ser escutado. Não porque não tem nada a dizer — mas porque ainda não suporta o peso do que significa dizer.",
    forcas:null,
    subotimo:"Hipersensibilidade ao julgamento. Colapso diante de contradição. Fuga do conflito verbal. Confunde crítica com ataque pessoal.",
    sombra:"O potencial que nunca chegou ao palco.",
    exemplos:null,
    cta:"Antes do Liceu, há um trabalho. Baixe o material de preparação mental — e volte quando estiver pronto.",
    ethos_alto:null, ethos_baixo:null,
  },
  hierofante:{
    num:"IX", nome:"O Hierofante", subtitulo:"Iam formatus", cor:"#7F77DD",
    citacao:"Você não precisa ser convencido de nada. Você precisa de adversários à altura.",
    forcas:"Domínio integrado das cinco competências retóricas. Alta resiliência. Ethos consolidado. Veio refinar, não aprender do zero.",
    subotimo:"Vícios cristalizados pela falta de questionamento. Autocomplacência. Estagnação por ausência de fricção real.",
    sombra:"O orador que parou de crescer porque parou de se desafiar.",
    exemplos:["Cícero (fase matura)","Demóstenes pós-exílio","Marco Aurélio"],
    cta:"Você não é aluno — é interlocutor. A mentoria avançada do Liceu foi feita para quem já chegou aqui.",
    ethos_alto:"Sua autoridade é autoevidente. O Liceu não te forma — te afia.",
    ethos_baixo:"Alta capacidade, baixa coerência. O maior risco para quem chegou até aqui.",
  },
  arquiteto:{
    num:"I", nome:"O Arquiteto", subtitulo:"Ratio ante omnia", cor:"#378ADD",
    citacao:"Você não fala — você constrói. Cada argumento é uma viga. Cada pausa, um cálculo estrutural.",
    forcas:"Precisão lógica, indestruibilidade argumentativa, domínio de dispositio, impossível de derrubar no terreno racional.",
    subotimo:"Emocionalmente frio. Audiências escapam pelo lado afetivo que você ignorou. Improviso precário. Raramente memorável.",
    sombra:"O discurso irrefutável que ninguém lembrou amanhã.",
    exemplos:["Aristóteles","Tomás de Aquino","Abraham Lincoln (fase argumentativa)"],
    cta:"Você tem a estrutura. Falta o sangue. Elocutio, Pathos e Actio — é onde o Liceu te leva.",
    ethos_alto:"Seu rigor vira autoridade. As pessoas confiam em você antes de você falar.",
    ethos_baixo:"Seu rigor vira arrogância. As pessoas resistem antes de você terminar.",
  },
  tribuno:{
    num:"II", nome:"O Tribuno", subtitulo:"Imperium in verba", cor:"#D85A30",
    citacao:"Você entrou na sala e já havia ganado. O problema é que você sabe disso — e às vezes isso é o problema.",
    forcas:"Presença imponente com estrutura racional. Instinto político apurado. Lê a sala enquanto executa o plano.",
    subotimo:"Overconfidence. Atropela nuance. Pode virar demagogo sem perceber. Se entedia com audiências pequenas.",
    sombra:"O estadista que o povo amou e a história condenou.",
    exemplos:["Cícero","Abraham Lincoln","Charles de Gaulle"],
    cta:"Você domina o palco. O Liceu te ensina quando sair dele. Memória e Ethos são seu próximo passo.",
    ethos_alto:"Lincoln — o líder que carrega o peso de uma causa inteira no corpo.",
    ethos_baixo:"O político que sabe exatamente o que fazer com uma multidão.",
  },
  anatema:{
    num:"III", nome:"O Anátema", subtitulo:"Refutari non potest", cor:"#E24B4A",
    citacao:"Você é o argumento que ninguém quer ouvir e que ninguém consegue refutar.",
    forcas:"Intelectualmente radioativo. Lógica fulminante e espontânea. Encontra ângulos que ninguém viu. Perigoso em debate.",
    subotimo:"Autossabotagem. Impossível de brandificar. Aliena aliados. Raramente termina o que começa.",
    sombra:"O gênio que nunca fez um discurso — só fragmentos brilhantes.",
    exemplos:["Sócrates","Nietzsche","Schopenhauer"],
    cta:"Você tem o fogo. Falta a forma. Dispositio e Memória são o que o Liceu te dá.",
    ethos_alto:"Sócrates — irrefutável e insuportável, mas íntegro até a cicuta.",
    ethos_baixo:"O polemista que vence todos os debates e não convence ninguém.",
  },
  iconoclasta:{
    num:"IV", nome:"O Iconoclasta", subtitulo:"Frangit ut aedificet", cor:"#BA7517",
    citacao:"Você quebra as regras porque as conhece melhor do que quem as criou.",
    forcas:"Alta energia. Analiticamente afiado. Fisicamente carismático. Prospera em ambientes hostis.",
    subotimo:"Viciado em novidade. Entedia-se com profundidade. Deixa audiências eletrificadas e desorientadas.",
    sombra:"O revolucionário que não sabe o que construir depois.",
    exemplos:["Voltaire","Christopher Hitchens","Malcolm X (fase inicial)"],
    cta:"Você sabe destruir. O Liceu te ensina a construir. Dispositio, Memória e Elocutio.",
    ethos_alto:"Hitchens — feroz, mas com integridade intelectual irrecusável.",
    ethos_baixo:"O provocador que confunde irritar com pensar.",
  },
  profeta:{
    num:"V", nome:"O Profeta", subtitulo:"Revelat quod latet", cor:"#1D9E75",
    citacao:"Você não convence — você revela. E as pessoas nunca esquecem o que foram forçadas a sentir.",
    forcas:"Emocionalmente preciso e cuidadosamente arquitetado. Escolhe cada palavra como bisturi. Palavras que envelhecem bem.",
    subotimo:"Lento para acender. Precisa do momento certo. Percebido como inacessível ou pesado demais.",
    sombra:"O manuscrito que ninguém publicou.",
    exemplos:["Martin Luther King Jr.","Isaías","Dostoiévski"],
    cta:"Você sabe o que dizer. O Liceu te ensina a entregar. Actio e timing são o seu próximo passo.",
    ethos_alto:"MLK — estrutura emocional sustentada por uma vida inteira de coerência moral.",
    ethos_baixo:"O líder carismático cujos seguidores não sabem o que ele realmente acredita.",
  },
  demagogo:{
    num:"VI", nome:"O Demagogo", subtitulo:"Turbas legit ut musicos", cor:"#D4537E",
    citacao:"Você lê multidões como partituras. O perigo é que você sabe exatamente o que está fazendo — e o faz mesmo assim.",
    forcas:"Arquitetura emocional estruturada. Ritmo contagioso. Escala para qualquer tamanho de audiência.",
    subotimo:"Deriva ética. Pode tornar-se manipulador. Precisa de fricção moral externa para não se perder.",
    sombra:"O líder que esqueceu por que começou.",
    exemplos:["Churchill","Péricles","Fidel Castro"],
    cta:"Você move multidões. O Liceu te ancora em algo que sobreviva a você. Logos e Ethos são urgentes.",
    ethos_alto:"Churchill — emoção e estrutura sob pressão máxima, com caráter.",
    ethos_baixo:"Qualquer ditador eloquente do século XX.",
  },
  oraculo:{
    num:"VII", nome:"O Oráculo", subtitulo:"Raro loquitur, semper movit", cor:"#534AB7",
    citacao:"Você fala pouco. Quando fala, a sala para. O problema é que você raramente fala.",
    forcas:"Profundidade de intuição devastadora. Ethos místico quando cultivado. Pessoas buscam sua presença.",
    subotimo:"Raramente inicia. Espera o momento perfeito que às vezes nunca vem. Confundido com timidez.",
    sombra:"A sabedoria que morreu sem ser dita.",
    exemplos:["Pascal","Simone Weil","Dostoiévski"],
    cta:"Você tem o que dizer. Falta a coragem de dizê-lo quando ninguém pediu. Actio e Inventio no Liceu.",
    ethos_alto:"Pascal — o pensamento que arde mesmo em fragmentos.",
    ethos_baixo:"O introvertido brilhante que nunca arriscou a exposição.",
  },
  incendio:{
    num:"VIII", nome:"O Incêndio", subtitulo:"Ardet et consumit", cor:"#D85A30",
    citacao:"Você não argumenta. Você arde — e espera que os outros peguem fogo junto.",
    forcas:"Voltagem emocional máxima. Presença absurda. Move pessoas antes que percebam que foram movidas.",
    subotimo:"Sem estrutura de sustentação. Não pode ser citado com precisão. Esgota rápido. Depende de pico emocional.",
    sombra:"O orador lembrado pelo que fez sentir — não pelo que disse.",
    exemplos:["Malcolm X (fase madura)","Danton","Savonarola"],
    cta:"Você é o evento. O Liceu te ensina a ser a memória. Logos, Dispositio e Memória são fundamentais.",
    ethos_alto:"Malcolm X — o incêndio com propósito.",
    ethos_baixo:"O palestrante motivacional que não deixa nada depois do evento.",
  },
}

// ─── SCORING ─────────────────────────────────────────────────────────────────
function computeScores(answers: Answers): Scores {
  const raw  = Object.fromEntries(DIMS.map(d => [d, 0])) as Scores
  const maxP = Object.fromEntries(DIMS.map(d => [d, 0])) as Scores
  const minP = Object.fromEntries(DIMS.map(d => [d, 0])) as Scores

  QUESTIONS.forEach(q => {
    DIMS.forEach(dim => {
      const vals = q.opts.map(o => o.s[dim] ?? 0)
      maxP[dim] += Math.max(...vals)
      minP[dim] += Math.min(...vals)
    })
    const ans = answers[q.id]
    if (ans !== undefined) {
      Object.entries(q.opts[ans].s).forEach(([d, v]) => {
        raw[d as DimKey] += v as number
      })
    }
  })

  const norm = {} as Scores
  DIMS.forEach(dim => {
    const range = maxP[dim] - minP[dim]
    norm[dim] = range === 0
      ? 50
      : Math.round(((raw[dim] - minP[dim]) / range) * 100)
    norm[dim] = Math.max(0, Math.min(100, norm[dim]))
  })
  return norm
}

function determineArchetype(scores: Scores): ArchKey {
  if (scores.resiliencia < 35) return "silencio"

  const avg = DIMS.reduce((a, d) => a + scores[d], 0) / DIMS.length
  if (avg >= 65 && scores.resiliencia >= 85) return "hierofante"

  const axisI     = scores.logos >= scores.pathos ? "logos" : "pathos"
  const estrutura = (scores.dispositio + scores.memoria) / 2
  const fluxo     = (scores.inventio   + scores.actio)   / 2
  const axisII    = estrutura >= fluxo ? "estrutura" : "fluxo"
  const axisIII   = scores.elocutio >= scores.actio ? "palavra" : "corpo"

  const map: Record<string, ArchKey> = {
    "logos-estrutura-palavra": "arquiteto", "logos-estrutura-corpo": "tribuno",
    "logos-fluxo-palavra":     "anatema",   "logos-fluxo-corpo":     "iconoclasta",
    "pathos-estrutura-palavra":"profeta",   "pathos-estrutura-corpo":"demagogo",
    "pathos-fluxo-palavra":    "oraculo",   "pathos-fluxo-corpo":    "incendio",
  }
  return map[`${axisI}-${axisII}-${axisIII}`]
}

// ─── RADAR CHART ─────────────────────────────────────────────────────────────
interface RadarChartProps { scores: Scores; color: string }

function RadarChart({ scores, color }: RadarChartProps) {
  const cx = 160, cy = 155, r = 105, n = DIMS.length

  function pt(i: number, pct: number) {
    const a = (-90 + (i * 360 / n)) * Math.PI / 180
    return { x: cx + pct * r * Math.cos(a), y: cy + pct * r * Math.sin(a) }
  }

  const scorePts   = DIMS.map((d, i) => pt(i, scores[d] / 100))
  const polygon    = scorePts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ")
  const gridLevels = [0.25, 0.5, 0.75, 1]

  return (
    <svg width="320" height="310" viewBox="0 0 320 310" style={{overflow:"visible"}}>
      {gridLevels.map(l => {
        const pts = DIMS.map((_, i) => pt(i, l))
        return <polygon key={l}
          points={pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ")}
          fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="0.5" />
      })}
      {DIMS.map((_, i) => {
        const end = pt(i, 1)
        return <line key={i} x1={cx} y1={cy}
          x2={end.x.toFixed(1)} y2={end.y.toFixed(1)}
          stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
      })}
      <polygon points={polygon} fill={color + "28"} stroke={color} strokeWidth="1.5" />
      {scorePts.map((p, i) =>
        <circle key={i} cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r="3" fill={color} />
      )}
      {DIMS.map((d, i) => {
        const lp = pt(i, 1.26)
        return (
          <text key={d} x={lp.x.toFixed(1)} y={lp.y.toFixed(1)}
            textAnchor="middle" dominantBaseline="middle"
            fontSize="10" fill="rgba(255,255,255,0.4)" fontFamily="sans-serif">
            {DIM_PT[d]}
          </text>
        )
      })}
    </svg>
  )
}

// ─── EMAIL SCREEN ─────────────────────────────────────────────────────────────
interface EmailScreenProps { onSubmit: (data: UserData) => void }

function EmailScreen({ onSubmit }: EmailScreenProps) {
  const [email, setEmail] = useState("")
  const [name,  setName]  = useState("")
  const [err,   setErr]   = useState("")

  function submit() {
    if (!name.trim())                                { setErr("Informe seu nome."); return }
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) { setErr("E-mail inválido.");  return }
    onSubmit({ email, name })
  }

  const inputStyle: React.CSSProperties = {
    width:"100%", backgroundColor:"#18181b", border:"1px solid #27272a",
    borderRadius:"10px", padding:"0.875rem 1rem", color:"#f4f4f5",
    fontSize:"14px", outline:"none", boxSizing:"border-box",
  }

  return (
    <div style={{minHeight:"100vh",backgroundColor:"#09090b",display:"flex",flexDirection:"column",
      alignItems:"center",justifyContent:"center",padding:"3rem 1.5rem"}}>
      <div style={{maxWidth:"480px",width:"100%"}}>
        <p style={{color:"#52525b",fontSize:"11px",letterSpacing:"0.4em",textTransform:"uppercase",marginBottom:"0.75rem"}}>
          Liceu Underground
        </p>
        <h1 style={{color:"#f4f4f5",fontSize:"2.5rem",fontFamily:"Georgia,serif",fontWeight:400,
          marginBottom:"1rem",lineHeight:1.15}}>
          Diagnóstico<br/>Retórico
        </h1>
        <p style={{color:"#71717a",fontSize:"14px",lineHeight:1.7,marginBottom:"2.5rem"}}>
          36 questões situacionais. Sem auto-avaliação. O resultado não é uma pontuação —
          é um arquétipo. Você descobre o tipo de orador que você já é, o que isso significa,
          e o que o Liceu pode fazer com isso.
        </p>
        <div style={{display:"flex",flexDirection:"column",gap:"0.75rem",marginBottom:"1.25rem"}}>
          <input type="text" placeholder="Seu nome" value={name} style={inputStyle}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
            onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && submit()} />
          <input type="email" placeholder="Seu e-mail" value={email} style={inputStyle}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
            onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && submit()} />
        </div>
        {err && <p style={{color:"#f87171",fontSize:"12px",marginBottom:"1rem"}}>{err}</p>}
        <button onClick={submit}
          style={{width:"100%",backgroundColor:"#f4f4f5",color:"#09090b",borderRadius:"10px",
            padding:"0.875rem",fontSize:"14px",fontWeight:500,border:"none",cursor:"pointer"}}>
          Iniciar diagnóstico →
        </button>
        <p style={{color:"#3f3f46",fontSize:"12px",marginTop:"1rem",textAlign:"center"}}>
          Aproximadamente 12 minutos.
        </p>
      </div>
    </div>
  )
}

// ─── QUIZ SCREEN ──────────────────────────────────────────────────────────────
interface QuizScreenProps { onComplete: (answers: Answers) => void }

function QuizScreen({ onComplete }: QuizScreenProps) {
  const [current,  setCurrent]  = useState(0)
  const [answers,  setAnswers]  = useState<Answers>({})
  const [selected, setSelected] = useState<number | null>(null)

  const q        = QUESTIONS[current]
  const LABELS   = ["A","B","C"]
  const progress = Math.round((current / QUESTIONS.length) * 100)

  function handleNext() {
    if (selected === null) return
    const next = { ...answers, [q.id]: selected }
    setAnswers(next)
    if (current < QUESTIONS.length - 1) {
      setCurrent(c => c + 1)
      setSelected(next[QUESTIONS[current + 1].id] ?? null)
    } else {
      onComplete(next)
    }
  }

  function handleBack() {
    if (current === 0) return
    setCurrent(c => c - 1)
    setSelected(answers[QUESTIONS[current - 1].id] ?? null)
  }

  function cardStyle(active: boolean): React.CSSProperties {
    return {
      width:"100%", textAlign:"left", borderRadius:"10px",
      border:`1px solid ${active ? "#71717a" : "#27272a"}`,
      padding:"1rem 1.25rem", fontSize:"14px", lineHeight:1.65, cursor:"pointer",
      backgroundColor: active ? "#27272a" : "#18181b",
      color: active ? "#f4f4f5" : "#71717a", transition:"all 0.15s",
    }
  }

  return (
    <div style={{minHeight:"100vh",backgroundColor:"#09090b",display:"flex",
      flexDirection:"column",padding:"2rem 1.5rem"}}>
      <div style={{maxWidth:"680px",margin:"0 auto",width:"100%"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"0.75rem"}}>
          <span style={{color:"#3f3f46",fontSize:"11px",letterSpacing:"0.3em",textTransform:"uppercase"}}>
            Liceu Underground
          </span>
          <span style={{color:"#3f3f46",fontSize:"12px"}}>{current + 1} / {QUESTIONS.length}</span>
        </div>
        <div style={{width:"100%",height:"1px",backgroundColor:"#27272a",marginBottom:"2.5rem"}}>
          <div style={{height:"100%",backgroundColor:"#71717a",width:`${progress}%`,transition:"width 0.3s"}}/>
        </div>

        <p style={{color:"#52525b",fontSize:"11px",letterSpacing:"0.35em",textTransform:"uppercase",marginBottom:"1rem"}}>
          Questão {current + 1}
        </p>
        <h2 style={{color:"#e4e4e7",fontSize:"1.5rem",fontFamily:"Georgia,serif",fontWeight:400,
          lineHeight:1.45,marginBottom:"2.5rem"}}>
          {q.text}
        </h2>

        <div style={{display:"flex",flexDirection:"column",gap:"0.75rem",marginBottom:"3rem"}}>
          {q.opts.map((opt, idx) => (
            <button key={idx} onClick={() => setSelected(idx)} style={cardStyle(selected === idx)}>
              <span style={{fontFamily:"monospace",fontSize:"11px",color:"#52525b",marginRight:"0.75rem"}}>
                {LABELS[idx]}
              </span>
              {opt.t}
            </button>
          ))}
        </div>

        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <button onClick={handleBack} disabled={current === 0}
            style={{background:"none",border:"none",color:current===0?"#27272a":"#71717a",
              cursor:current===0?"default":"pointer",fontSize:"14px"}}>
            ← Anterior
          </button>
          <button onClick={handleNext} disabled={selected === null}
            style={{backgroundColor:selected===null?"#27272a":"#f4f4f5",
              color:selected===null?"#52525b":"#09090b",border:"none",borderRadius:"10px",
              padding:"0.625rem 1.5rem",fontSize:"14px",fontWeight:500,
              cursor:selected===null?"default":"pointer",transition:"all 0.15s"}}>
            {current === QUESTIONS.length - 1 ? "Ver resultado →" : "Próxima →"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── RESULT SCREEN ────────────────────────────────────────────────────────────
interface ResultScreenProps { answers: Answers; email: string; name: string }

function ResultScreen({ answers, email, name }: ResultScreenProps) {
  const [copied,     setCopied]     = useState(false)
  const [shareToken, setShareToken] = useState<string | null>(null)

  const scores   = useMemo(() => computeScores(answers), [answers])
  const archKey  = useMemo(() => determineArchetype(scores), [scores])
  const arch     = ARCHETYPES[archKey]
  const ethosLvl = scores.ethos >= 60 ? "alto" : "baixo"

  useEffect(() => {
    if (!SUPABASE_URL || !SUPABASE_KEY || !email || !answers || !scores || !archKey || !arch || !ethosLvl) return
    const payload: DiagnosticPayload = {
      email, answers, scores,
      archetype_key: archKey,
      archetype_name: arch.nome,
      ethos_level: ethosLvl,
    }
    fetch(`${SUPABASE_URL}/rest/v1/diagnostic_sessions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Prefer": "return=representation",
      },
      body: JSON.stringify(payload),
    })
    .then(r => r.json())
    .then((data: SavedSession[]) => {
      if (data[0]?.share_token) {
        setShareToken(data[0].share_token)
        fetch("/api/diagnostico/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email, name,
            archetype_key: archKey,
            archetype_name: arch.nome,
            share_token: data[0].share_token,
          }),
        })
      }
    })
    .catch(console.error)
  }, [email, name, answers, scores, archKey, arch, ethosLvl]) // Dependências corrigidas

  function handleShare() {
    const url = shareToken
      ? `${window.location.origin}/diagnostico/${shareToken}`
      : window.location.href
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2200)
  }

  const c = arch.cor

  return (
    <div style={{minHeight:"100vh",backgroundColor:"#09090b",padding:"3rem 1.5rem"}}>
      <div style={{maxWidth:"900px",margin:"0 auto"}}>

        <p style={{color:"#3f3f46",fontSize:"11px",letterSpacing:"0.4em",textTransform:"uppercase",
          textAlign:"center",marginBottom:"2.5rem"}}>
          Liceu Underground — Diagnóstico Retórico
        </p>

        {/* Hero */}
        <div style={{border:`1px solid ${c}35`,borderRadius:"20px",padding:"2.5rem",marginBottom:"1.5rem",
          background:`radial-gradient(ellipse at top, ${c}12 0%, transparent 65%)`}}>
          <div style={{display:"flex",flexDirection:"column",gap:"2rem"}}>
            <div style={{flex:1}}>
              <p style={{fontSize:"11px",letterSpacing:"0.45em",textTransform:"uppercase",
                color:`${c}99`,marginBottom:"0.625rem"}}>
                Arquétipo {arch.num}
              </p>
              <h1 style={{color:"#f4f4f5",fontSize:"3rem",fontFamily:"Georgia,serif",
                fontWeight:400,marginBottom:"0.25rem",lineHeight:1.1}}>
                {arch.nome}
              </h1>
              <p style={{fontSize:"11px",letterSpacing:"0.45em",textTransform:"uppercase",
                color:`${c}cc`,marginBottom:"2rem"}}>
                {arch.subtitulo}
              </p>
              <blockquote style={{color:"#d4d4d8",fontSize:"1.125rem",fontFamily:"Georgia,serif",
                fontStyle:"italic",lineHeight:1.65,borderLeft:`2px solid ${c}`,
                paddingLeft:"1.25rem",marginBottom:"2rem"}}>
                {arch.citacao}
              </blockquote>
              {arch.ethos_alto && (
                <div style={{border:"1px solid #27272a",backgroundColor:"#18181b",
                  borderRadius:"10px",padding:"1rem 1.25rem"}}>
                  <p style={{color:"#52525b",fontSize:"10px",letterSpacing:"0.35em",
                    textTransform:"uppercase",marginBottom:"0.5rem"}}>
                    Ethos {ethosLvl === "alto" ? "↑ elevado" : "↓ baixo"}
                  </p>
                  <p style={{color:"#a1a1aa",fontSize:"13px",lineHeight:1.65}}>
                    {ethosLvl === "alto" ? arch.ethos_alto : arch.ethos_baixo}
                  </p>
                </div>
              )}
            </div>
            <div style={{display:"flex",justifyContent:"center"}}>
              <RadarChart scores={scores} color={c} />
            </div>
          </div>
        </div>

        {/* Detail cards */}
        {arch.forcas && (
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",
            gap:"1rem",marginBottom:"1.5rem"}}>
            {([
              {label:"Forças",   body:arch.forcas,   extra:null},
              {label:"Subótimo", body:arch.subotimo,  extra:null},
              {label:"Sombra",   body:arch.sombra,    extra:arch.exemplos},
            ] as {label:string; body:string; extra:string[]|null}[]).map(({label,body,extra}) => (
              <div key={label} style={{backgroundColor:"#18181b",border:"1px solid #27272a",
                borderRadius:"14px",padding:"1.5rem"}}>
                <p style={{color:"#52525b",fontSize:"10px",letterSpacing:"0.35em",
                  textTransform:"uppercase",marginBottom:"0.75rem"}}>
                  {label}
                </p>
                <p style={{color:"#a1a1aa",fontSize:"13px",lineHeight:1.65,
                  fontStyle:label==="Sombra"?"italic":"normal"}}>
                  {body}
                </p>
                {extra && (
                  <>
                    <p style={{color:"#3f3f46",fontSize:"10px",letterSpacing:"0.35em",
                      textTransform:"uppercase",marginTop:"1.25rem",marginBottom:"0.5rem"}}>
                      Exemplos históricos
                    </p>
                    {extra.map(e => (
                      <p key={e} style={{color:"#71717a",fontSize:"12px",lineHeight:1.6}}>— {e}</p>
                    ))}
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        <div style={{border:`1px solid ${c}28`,borderRadius:"16px",padding:"2rem",
          marginBottom:"1.5rem",backgroundColor:`${c}06`,
          display:"flex",flexWrap:"wrap",gap:"1.5rem",alignItems:"center"}}>
          <div style={{flex:1,minWidth:"200px"}}>
            <p style={{color:"#52525b",fontSize:"10px",letterSpacing:"0.35em",
              textTransform:"uppercase",marginBottom:"0.625rem"}}>
              Seu caminho
            </p>
            <p style={{color:"#d4d4d8",fontSize:"15px",lineHeight:1.65}}>{arch.cta}</p>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:"0.75rem",flexShrink:0}}>
            <a href={CHECKOUT_URL}
              style={{backgroundColor:c,color:"#09090b",borderRadius:"10px",
                padding:"0.75rem 1.75rem",fontSize:"14px",fontWeight:500,
                textDecoration:"none",textAlign:"center",whiteSpace:"nowrap"}}>
              Começar no Liceu →
            </a>
            <button onClick={handleShare}
              style={{backgroundColor:"transparent",border:`1px solid ${c}45`,color:"#a1a1aa",
                borderRadius:"10px",padding:"0.75rem 1.75rem",fontSize:"14px",
                cursor:"pointer",whiteSpace:"nowrap"}}>
              {copied ? "Link copiado!" : "Compartilhar resultado"}
            </button>
          </div>
        </div>

        {/* Dimension bars */}
        <div style={{border:"1px solid #27272a",borderRadius:"14px",padding:"1.5rem"}}>
          <p style={{color:"#52525b",fontSize:"10px",letterSpacing:"0.35em",
            textTransform:"uppercase",marginBottom:"1.5rem"}}>
            Perfil detalhado
          </p>
          <div style={{display:"flex",flexDirection:"column",gap:"0.875rem"}}>
            {DIMS.map(dim => (
              <div key={dim} style={{display:"flex",alignItems:"center",gap:"1rem"}}>
                <span style={{color:"#52525b",fontSize:"12px",width:"88px",flexShrink:0}}>
                  {DIM_PT[dim]}
                </span>
                <div style={{flex:1,height:"2px",backgroundColor:"#27272a",borderRadius:"99px"}}>
                  <div style={{height:"100%",borderRadius:"99px",backgroundColor:c,
                    width:`${scores[dim]}%`,transition:"width 1s ease"}}/>
                </div>
                <span style={{color:"#52525b",fontSize:"12px",width:"28px",textAlign:"right"}}>
                  {scores[dim]}
                </span>
              </div>
            ))}
          </div>
        </div>

        <p style={{color:"#27272a",fontSize:"11px",textAlign:"center",marginTop:"2rem"}}>
          {name} · {email}
        </p>
      </div>
    </div>
  )
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
type Screen = "email" | "quiz" | "result"

export default function DiagnosticoLiceu() {
  const [screen,   setScreen]   = useState<Screen>("email")
  const [userData, setUserData] = useState<UserData | null>(null)
  const [answers,  setAnswers]  = useState<Answers | null>(null)

  if (screen === "email") {
    return <EmailScreen onSubmit={d => { setUserData(d); setScreen("quiz") }} />
  }
  if (screen === "quiz") {
    return <QuizScreen onComplete={a => { setAnswers(a); setScreen("result") }} />
  }
  return (
    <ResultScreen
      answers={answers!}
      email={userData!.email}
      name={userData!.name}
    />
  )
}
