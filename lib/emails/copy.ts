import {ASSUNTOS, PERFIS, type FormularioComEmail} from '@/lib/formularios';
/* O `with {type: 'json'}` nao e enfeite: e a sintaxe padrao de atributo de
   importacao, e sem ela o `node` puro recusa importar JSON. O empacotador do
   Next aceita das duas formas; quem exige e o conferidor de copy, que roda em
   node cru de proposito, para conferir os MESMOS modulos que a rota carrega. */
import mensagensEn from '@/messages/en.json' with {type: 'json'};
import mensagensPt from '@/messages/pt.json' with {type: 'json'};

/**
 * A COPY DOS E-MAILS. VERBATIM do roteiro.md, e só de lá.
 *
 * POR QUE AQUI E NÃO EM `messages/`: chave de tradução nova exige aprovação do
 * diretor, e estes textos não têm nenhum leitor no navegador. É a mesma decisão
 * já tomada em `lib/links.ts` (as mensagens do WhatsApp) e no `TITULOS` da
 * página de obrigado: copy que só o servidor lê mora ao lado de quem a lê.
 *
 * TUDO ABAIXO É CITAÇÃO. Se uma frase aqui divergir do roteiro.md, quem está
 * errado é este arquivo, e `npm run conferir:copy` reprova antes do build.
 * A única liberdade tomada é de APRESENTAÇÃO, e ela está declarada no lugar
 * exato onde acontece.
 */

/* AS TRÊS PEÇAS DO LEAD, uma por formulário.
   roteiro.md: "E-mail de entrega", "E-mail de confirmação do formulário de
   contato" e "E-mail de confirmação do pedido de análise de mercado".

   O CORPO DO GUIA E O DA AVALIAÇÃO FORAM PARTIDOS EM DOIS, e isso é
   apresentação, não edição: o roteiro escreve o parágrafo inteiro terminando em
   "Luis Alves, REALTOR®, Stonehaus Realty.", que é uma ASSINATURA colada no fim
   de um parágrafo. Num e-mail ela lê como assinatura, com respiro antes. Nenhum
   caractere mudou e nenhum sumiu: `corpo` mais `assinatura` remontam a frase do
   roteiro, e o conferidor de copy verifica exatamente isso.

   O CONTATO NÃO TEM PRÉ-HEADER, e é decisão escrita no roteiro: o corpo tem uma
   linha só, e um pré-header repetiria ela na prévia da caixa de entrada. */
type PecaDoLead = {
  assunto: string;
  preHeader: string;
  corpo: string;
  assinatura: string;
  botao: string;
  /** O marcador do nome, na forma exata que o roteiro usa em cada idioma. */
  marcador: string;
};

export const PECAS: Record<FormularioComEmail, Record<'en' | 'pt', PecaDoLead>> = {
  guia: {
    en: {
      assunto: 'Your real cost guide, Greater Vancouver and the Fraser Valley',
      preHeader: 'The two worked examples are on pages 26 to 29.',
      corpo:
        'Hi [name]. Here is the guide. It runs 38 pages, but if you have ten minutes, go straight to pages 26 and 27, which are the full calculation for a buyer, pages 28 and 29, which are the one for a seller, and pages 30 and 31, which are the twelve-question checklist. That is the part that changes something today. If you want the calculation built with your own numbers, just reply to this email.',
      assinatura: 'Luis Alves, REALTOR®, Stonehaus Realty.',
      botao: 'Open the guide',
      marcador: '[name]'
    },
    pt: {
      assunto: 'Seu guia de custos reais, Grande Vancouver e Fraser Valley',
      preHeader: 'As duas simulações completas estão nas páginas 26 a 29.',
      corpo:
        'Oi, [nome]. Aqui está o guia. Ele tem 38 páginas, mas se você tiver dez minutos, vá direto para as páginas 26 e 27, que são a conta completa de quem compra, para as 28 e 29, que são a de quem vende, e para as 30 e 31, que são o checklist de 12 perguntas. É a parte que muda alguma coisa hoje. Se quiser a conta montada com os seus números, é só responder este e-mail.',
      assinatura: 'Luis Alves, REALTOR®, Stonehaus Realty.',
      botao: 'Abrir o guia',
      marcador: '[nome]'
    }
  },
  contato: {
    en: {
      assunto: 'I got your message',
      preHeader: '',
      corpo: 'Got it. I will get back to you personally, usually within a few hours.',
      assinatura: '',
      botao: '',
      marcador: ''
    },
    pt: {
      assunto: 'Recebi sua mensagem',
      preHeader: '',
      corpo: 'Recebi. Eu mesmo retorno, normalmente em poucas horas.',
      assinatura: '',
      botao: '',
      marcador: ''
    }
  },
  avaliacao: {
    en: {
      assunto: 'Your market review, next steps',
      preHeader:
        'I build the price from real comparables, not from the most optimistic number.',
      corpo:
        'Hi [name]. I got your request for a market review of your home. I do not send the highest number: I build the price from real comparables in your area and for your property type, and I show you how I got there. It takes one or two business days. If you also need to buy right after, reply to this email and tell me, because both ends have to line up and that changes the plan.',
      assinatura: 'Luis Alves, REALTOR®, Stonehaus Realty.',
      botao: '',
      marcador: '[name]'
    },
    pt: {
      assunto: 'Sua análise de mercado, próximos passos',
      preHeader:
        'Eu monto o preço a partir de comparáveis reais, não do número mais otimista.',
      corpo:
        'Oi, [nome]. Recebi o pedido da análise do seu imóvel. Eu não mando o número mais alto: monto o preço a partir dos comparáveis reais da sua região e do seu tipo de imóvel, e mostro como cheguei nele. Leva um ou dois dias úteis. Se você também precisa comprar em seguida, responda este e-mail dizendo isso, porque as duas pontas têm que se encaixar e isso muda o plano.',
      assinatura: 'Luis Alves, REALTOR®, Stonehaus Realty.',
      botao: '',
      marcador: '[nome]'
    }
  }
};

/**
 * O QUE FALTA DE COPY, por formulário, para o e-mail do lead poder sair. Lista
 * vazia significa liberado.
 *
 * As três estão vazias desde 09/09/2026: a copy de contato e de avaliação
 * entrou no roteiro.md nesta data. A ESTRUTURA FICA, e não é cerimônia: é ela
 * que garante que um formulário novo nasça sem enviar e-mail inventado, em vez
 * de nascer enviando alguma coisa que ninguém escreveu.
 */
export const COPY_PENDENTE: Record<FormularioComEmail, readonly string[]> = {
  guia: [],
  contato: [],
  avaliacao: []
};

/* A LINHA DE DESCADASTRO, exigência da CASL.
   roteiro.md, "Linha de descadastro do e-mail do guia (CASL)".

   `ancora` é o trecho de `acao` que vira LINK, e mora aqui em vez de a frase
   chegar partida em três pedaços: a frase inteira é o que se compara com o
   roteiro, e quebrá-la em prefixo, link e sufixo tiraria a possibilidade de
   conferir verbatim. Quem monta o rodapé corta na âncora.

   SÓ NO E-MAIL DO GUIA. Contato e avaliação são resposta a um pedido direto e
   não carregam aceite de marketing: oferecer descadastro neles faz a pessoa
   achar que está cancelando o atendimento. */
export const DESCADASTRO = {
  en: {
    motivo:
      'You are receiving this email because you requested the guide at luisrealtor.ca.',
    acao: 'To stop receiving market updates, unsubscribe here.',
    ancora: 'unsubscribe here'
  },
  pt: {
    motivo: 'Você recebe este e-mail porque pediu o guia em luisrealtor.ca.',
    acao: 'Para deixar de receber as atualizações de mercado, cancele aqui.',
    ancora: 'cancele aqui'
  }
} as const;

/* A NEWSLETTER DO BLOG (Second Opinion, 24/09/2026). COPY NOVA, escrita pela
   agência e ainda NÃO validada pelo Luís (está na lista de pendências). O motivo e
   a ação de descadastro são a versão da newsletter da linha acima: quem recebe
   precisa saber POR QUE recebe e COMO sai (CASL). O link do descadastro é o do
   próprio Resend (`{{{RESEND_UNSUBSCRIBE_URL}}}`), que vale na hora. */
export const NEWSLETTER = {
  en: {
    botao: 'Read the full note',
    fonte: 'Source',
    motivo:
      'You are receiving this email because you subscribed to the Second Opinion at luisrealtor.ca.',
    acao: 'To stop receiving it, unsubscribe here.',
    ancora: 'unsubscribe here'
  },
  pt: {
    botao: 'Ler a nota inteira',
    fonte: 'Fonte',
    motivo: 'Você recebe este e-mail porque se inscreveu na Segunda Opinião em luisrealtor.ca.',
    acao: 'Para deixar de receber, cancele aqui.',
    ancora: 'cancele aqui'
  }
} as const;

/* IDENTIFICACAO E ENDERECO POSTAL.
   Os outros dois itens que a CASL exige, junto do descadastro acima.

   As cinco linhas abaixo sao o rodape do roteiro.md, e sao as MESMAS strings de
   `rodape.nome`, `rodape.corretora`, `rodape.licenca`, `rodape.endereco1` e
   `rodape.endereco2` em `messages/`. Sao gemeas de proposito: puxar o arquivo
   de mensagens inteiro para dentro de uma rota de servidor por causa de cinco
   linhas que nao mudam entre idiomas custa mais do que vale. Se o endereco da
   corretora mudar, muda nos dois lugares. */
export const IDENTIFICACAO = {
  nome: 'Luis Alves REALTOR®',
  corretora: 'Stonehaus Realty Corp.',
  licenca: 'Licence #190001',
  endereco1: 'Suite A, 1126 Austin Avenue',
  endereco2: 'Coquitlam, BC V3K 3P5'
} as const;

/* OS RÓTULOS LEGÍVEIS DOS DOIS CAMPOS DE ESCOLHA.
   Decisão do diretor em 09/09/2026, e ela corrige um defeito meu da 4.4.

   O QUE ESTAVA ERRADO: o aviso interno abria com "COMO POSSO AJUDAR?" e, no
   maior corpo da peça inteira, a palavra `both`. O tipo mais destacado do
   e-mail era um token de máquina. Meu argumento tinha sido "um vocabulário só
   nos dois lugares, igual à planilha", e ele não se sustenta: na planilha,
   `both` embaixo de uma coluna chamada "Perfil" TEM contexto, e no e-mail é a
   primeira coisa que se lê, sem nenhum.

   UMA LISTA, DUAS APRESENTAÇÕES. A lista continua sendo `PERFIS` e `ASSUNTOS`
   de `lib/formularios.ts`, a mesma que desenha as opções na tela e a mesma que
   grava na planilha. O VALOR CRU continua indo para a célula, intocado. O que
   muda é só o que a PESSOA lê: no e-mail entra o rótulo traduzido, lido de
   `messages/`, que é o texto exato que ela viu na tela quando escolheu.

   Isto não é vocabulário duplicado. É a diferença entre o que a máquina guarda
   e o que a pessoa lê, e ela vem de UMA fonte em cada ponta. */
const OPCOES = {
  profile: {
    lista: PERFIS,
    en: mensagensEn.landing.s1.opcoes as Record<string, string>,
    pt: mensagensPt.landing.s1.opcoes as Record<string, string>
  },
  topic: {
    lista: ASSUNTOS,
    en: mensagensEn.paginaContato.campos.opcoes as Record<string, string>,
    pt: mensagensPt.paginaContato.campos.opcoes as Record<string, string>
  }
} as const;

/**
 * O rótulo que a pessoa viu na tela, a partir do valor estável que trafega.
 *
 * Valor desconhecido volta COMO VEIO, nunca vazio: se um dia a lista mudar e
 * uma linha antiga trouxer um valor aposentado, é melhor o Luís ler o token do
 * que ler um espaço em branco onde havia informação.
 */
export function rotuloLegivel(
  campo: string,
  valor: string,
  idioma: 'en' | 'pt'
): string {
  const opcao = OPCOES[campo as keyof typeof OPCOES];
  if (!opcao || valor === '') return valor;
  const achada = opcao.lista.find((o) => o.valor === valor);
  if (!achada) return valor;
  return opcao[idioma][achada.chave] ?? valor;
}

/* ROTULOS DE INTERFACE.
   NAO sao voz do cliente: sao etiqueta de campo, o equivalente do "Nome" que
   fica em cima de um input. Saem das TABELAS DE CAMPO do proprio roteiro.md (o
   formulario de contato, o de avaliacao e o da landing).

   A UNICA STRING DESTE ARQUIVO QUE NAO ESTA NO ROTEIRO e `copiaDoEnvio`, o
   rotulo curto acima da copia do que a pessoa enviou. Ela foi pedida na
   descricao da rodada 4.4 ("sob um rotulo curto") e esta isolada aqui de
   proposito, para o diretor trocar as duas palavras sem procurar. */
export const ROTULOS_LEAD = {
  en: {
    copiaDoEnvio: 'What you sent',
    name: 'Name',
    email: 'Email',
    phone: 'Phone / WhatsApp',
    profile: 'How can I help?',
    topic: 'How can I help?',
    message: 'Message',
    propertyAddress: 'Property address',
    propertyType: 'Property type',
    timeline: 'Timeline',
    consent: 'Market updates',
    sim: 'Yes',
    nao: 'No'
  },
  pt: {
    copiaDoEnvio: 'O que você enviou',
    name: 'Nome',
    email: 'E-mail',
    phone: 'Telefone / WhatsApp',
    profile: 'Como posso ajudar?',
    topic: 'Como posso ajudar?',
    message: 'Mensagem',
    propertyAddress: 'Endereço do imóvel',
    propertyType: 'Tipo de imóvel',
    timeline: 'Prazo pretendido',
    consent: 'Atualizações de mercado',
    sim: 'Sim',
    nao: 'Não'
  }
} as const;

/**
 * RÓTULOS DO AVISO INTERNO, e ele é SEMPRE em português, em qualquer idioma do
 * lead: quem lê é o Luís, uma pessoa só, e ele lê em português. Um aviso que
 * troca de idioma conforme o lead obriga quem confere quarenta mensagens de
 * manhã a reaprender o layout a cada uma.
 *
 * A EXCEÇÃO É O VALOR dos dois campos de escolha, que vai no IDIOMA DO LEAD
 * (ver `rotuloLegivel`): o rótulo é a moldura e é dele; o valor é o que a
 * pessoa escolheu, e ver a frase que ela viu na tela vale mais do que a
 * tradução.
 */
export const ROTULOS_LUIS: Record<string, string> = {
  name: 'Nome',
  email: 'E-mail',
  phone: 'Telefone / WhatsApp',
  profile: 'Como posso ajudar?',
  topic: 'Como posso ajudar?',
  message: 'Mensagem',
  propertyAddress: 'Endereço do imóvel',
  propertyType: 'Tipo de imóvel',
  timeline: 'Prazo pretendido',
  consent: 'Aceitou atualizações',
  consentTexto: 'Frase aceita (prova CASL)',
  idioma: 'Idioma',
  origem: 'Origem',
  campanha: 'Campanha'
};

/**
 * O campo que o Luís confere PRIMEIRO, por formulário. Vai para o assunto e
 * para o topo do aviso, e NÃO se repete na lista de baixo.
 */
export const CAMPO_DE_DECISAO: Record<FormularioComEmail, string> = {
  guia: 'profile',
  contato: 'topic',
  avaliacao: 'propertyAddress'
};

/** O prefixo do assunto do aviso interno, por formulário. Grafia do diretor. */
export const PREFIXO_ASSUNTO: Record<FormularioComEmail, string> = {
  guia: 'Guia',
  contato: 'Contato',
  avaliacao: 'Avaliacao'
};
