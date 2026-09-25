/**
 * OS DOIS E-MAILS DO FUNIL.
 *
 *   1. Para o LUÍS, com `Reply-To` do lead, para ele responder direto.
 *   2. Para o LEAD, com `Reply-To` do Luís.
 *
 * DESTINATÁRIO FIXO NO CÓDIGO, lido de `lib/links.ts`, NUNCA vindo do
 * navegador: destinatário que vem do cliente permite desviar o formulário do
 * site inteiro.
 *
 * A REGRA DE SUCESSO mora na rota, não aqui, mas ela depende deste retorno:
 * `luis: true` sozinho já salva o envio, e `lead: false` NUNCA é erro. Por isso
 * os dois disparos são INDEPENDENTES, cada um no seu try/catch: uma falha do
 * e-mail de confirmação não pode custar o aviso de lead novo, e nenhuma das
 * duas pode derrubar a resposta da rota.
 *
 * POR QUE `fetch` E NÃO O SDK DO RESEND: a rota já fala com o Apps Script por
 * `fetch`, o endpoint do Resend é um POST com um JSON, e o SDK traria uma
 * dependência inteira para embrulhar isso. Menos um pacote para auditar, menos
 * um pacote para atualizar, e o mesmo vocabulário do resto do arquivo.
 */

import {EMAIL_CONTATO} from '@/lib/links';
import type {FormularioComEmail} from '@/lib/formularios';
import {getPathname} from '@/i18n/navigation';
import {
  PARAMETRO_DA_FICHA,
  ROTA_UM_CLIQUE,
  VARIAVEL_DO_SEGREDO,
  fichaDeDescadastro
} from '@/lib/descadastro';
import {COPY_PENDENTE} from '@/lib/emails/copy';
import {assuntoParaLuis, htmlParaLuis, textoParaLuis} from '@/lib/emails/para-luis';
import {conteudoParaLead} from '@/lib/emails/para-lead';

/** Para onde vai o aviso de lead novo. Uma linha, um lugar, sem exceção. */
export const DESTINATARIO_LUIS = EMAIL_CONTATO;

const ENDPOINT_RESEND = 'https://api.resend.com/emails';

/**
 * Oito segundos, o mesmo teto do Apps Script na rota. Não é número solto: é o
 * tempo que a pessoa fica olhando um botão girando. Estourou, o lead já está na
 * planilha e o e-mail é o que se perde, que é a ordem certa de perder coisas.
 */
const TETO_MS = 8000;

export type DadosDoEnvio = {
  formulario: FormularioComEmail;
  idioma: 'en' | 'pt';
  /**
   * Caminho e âncora de onde a pessoa enviou, para o e-mail dizer de que página
   * veio (`/selling#market-review`).
   */
  origem: string;
  /**
   * A query crua da página do formulário, sem o "?", ou vazia. Entra aqui já
   * cortada no teto.
   */
  campanha: string;
  /**
   * Os campos do contrato daquele formulário, já validados e cortados no teto.
   * `consent` chega booleano, o resto chega string.
   */
  campos: Record<string, string | boolean>;
};

export type ResultadoEmails = {
  luis: boolean;
  lead: boolean;
  motivo?: string;
};

type Mensagem = {
  para: string;
  assunto: string;
  html: string;
  texto: string;
  responderPara: string;
  /** Cabecalhos crus. Hoje so os dois do descadastro de um clique. */
  cabecalhos?: Record<string, string>;
};

/**
 * UM DISPARO. Devolve string vazia quando deu certo e o motivo legível quando
 * não deu, porque é esse motivo que a rota escreve no log e é ele que
 * transforma "o e-mail não chegou" num diagnóstico de trinta segundos.
 *
 * NUNCA loga a chave. O corpo da mensagem também não sai daqui: o que volta é
 * status e a resposta do Resend, que fala de entrega, não de conteúdo.
 */
async function disparar(
  chave: string,
  remetente: string,
  m: Mensagem
): Promise<string> {
  try {
    const resposta = await fetch(ENDPOINT_RESEND, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${chave}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: remetente,
        to: [m.para],
        subject: m.assunto,
        html: m.html,
        // TEXTO PURO JUNTO DO HTML, sempre. Mensagem só em HTML pontua pior nos
        // filtros, e este é o e-mail que não pode cair no spam.
        text: m.texto,
        reply_to: m.responderPara,
        ...(m.cabecalhos ? {headers: m.cabecalhos} : {})
      }),
      signal: AbortSignal.timeout(TETO_MS)
    });

    if (!resposta.ok) {
      const corpo = (await resposta.text()).slice(0, 200);
      return `HTTP ${resposta.status} . ${corpo}`;
    }
    return '';
  } catch (e) {
    // O AbortSignal.timeout estoura com TimeoutError, e o nome dele é o
    // diagnóstico inteiro: o Resend demorou mais que oito segundos.
    if (e instanceof Error) return `${e.name}: ${e.message}`;
    return String(e);
  }
}

export async function enviarEmails(
  dados: DadosDoEnvio
): Promise<ResultadoEmails> {
  const chave = process.env.RESEND_API_KEY;
  const remetente = process.env.QUOTE_FROM;

  const ausentes: string[] = [];
  if (!chave) ausentes.push('RESEND_API_KEY');
  if (!remetente) ausentes.push('QUOTE_FROM');
  // A condição repete o que o array já sabe, e é de propósito: `ausentes.length`
  // não ESTREITA o tipo das duas variáveis, e sem estreitar o TypeScript segue
  // achando que elas podem ser `undefined` lá embaixo. Mesmo idioma que
  // `gravarNaPlanilha` já usa na rota. A mensagem continua vindo do array.
  if (!chave || !remetente) {
    return {luis: false, lead: false, motivo: `${ausentes.join(' e ')} ausente`};
  }

  // `origem` e `campanha` não aparecem aqui de propósito: quem os lê é o
  // montador do aviso interno, que recebe `dados` inteiro.
  const {formulario, idioma, campos} = dados;
  const emailDoLead = typeof campos.email === 'string' ? campos.email.trim() : '';
  const motivos: string[] = [];

  /* 1. O AVISO PARA O LUÍS. Este é o que importa para a regra de sucesso. */
  let luis = false;
  try {
    const falha = await disparar(chave, remetente, {
      para: DESTINATARIO_LUIS,
      assunto: assuntoParaLuis(formulario, campos, idioma),
      html: htmlParaLuis(dados),
      texto: textoParaLuis(dados),
      // Responder é a ação mais provável, e tem que ser um toque.
      responderPara: emailDoLead
    });
    if (falha === '') luis = true;
    else motivos.push(`luis . ${falha}`);
  } catch (e) {
    motivos.push(`luis . ${e instanceof Error ? e.message : String(e)}`);
  }

  /* 2. O E-MAIL PARA O LEAD, e ele só sai com copy aprovada.
     Desde 09/09/2026 os três formulários têm copy no roteiro.md, então esta
     trava não barra ninguém hoje. Ela FICA, e não é cerimônia: é o que garante
     que um formulário novo nasça sem enviar e-mail inventado. Um "agradecemos
     seu contato" genérico contradiz a página que a pessoa acabou de ler, e é o
     tipo de frase que fica anos no ar porque ninguém lembra que foi a máquina
     que escreveu. */
  const pendente = COPY_PENDENTE[formulario];
  if (pendente.length > 0) {
    motivos.push(`lead . copy pendente no roteiro.md: ${pendente.join(', ')}`);
    return {luis, lead: false, motivo: motivos.join(' | ')};
  }

  let lead = false;
  try {
    /* A BASE ABSOLUTA. Gêmea de `siteUrl` em `lib/seo.ts`, e lida aqui em vez de
       importada de lá porque aquele arquivo puxa o `next-intl` junto, que não
       tem o que fazer dentro de um montador de e-mail. */
    const base = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000')
      .replace(/\/+$/, '');

    /* O DESCADASTRO, e ele só existe no e-mail do GUIA.
       Contato e avaliação são resposta a um pedido direto e não carregam aceite
       de marketing: oferecer saída neles faria a pessoa achar que está
       cancelando o atendimento (roteiro.md, nota de 09/09/2026).

       DOIS ENDEREÇOS, de propósito, porque são dois interlocutores:
         . a PÁGINA, que a pessoa abre pelo "cancele aqui" do rodapé, mostra um
           botão e não muda nada no GET;
         . a ROTA DE UM CLIQUE, que só o provedor chama, e só por POST.

       Sem o segredo configurado, os dois somem em vez de sair link quebrado:
       um "cancele aqui" que dá erro é pior que a ausência da linha. */
    const segredo = process.env[VARIAVEL_DO_SEGREDO];
    const ficha =
      formulario === 'guia' && segredo
        ? fichaDeDescadastro(emailDoLead, segredo)
        : '';
    const urlDescadastro = ficha
      ? `${base}${getPathname({locale: idioma, href: '/unsubscribe'})}?${PARAMETRO_DA_FICHA}=${ficha}`
      : '';
    const urlUmClique = ficha
      ? `${base}${ROTA_UM_CLIQUE}?${PARAMETRO_DA_FICHA}=${ficha}`
      : '';

    const peca = conteudoParaLead({
      formulario,
      idioma,
      campos,
      base,
      urlDescadastro
    });

    /* OS CABEÇALHOS DO DESCADASTRO (RFC 8058). Valem conformidade e valem
       ENTREGABILIDADE: Gmail, Outlook e Yahoo leem estes dois para decidir
       reputação de remetente, e sem eles o e-mail pontua pior mesmo estando
       tudo o resto certo.

       O `mailto:` é o segundo caminho que o RFC pede, para o cliente que não
       faz POST. Ele cai na caixa do Luís, e é ele quem dá a baixa à mão. */
    const cabecalhos = urlUmClique
      ? {
          'List-Unsubscribe': `<${urlUmClique}>, <mailto:${DESTINATARIO_LUIS}?subject=unsubscribe>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
        }
      : undefined;

    const falha = await disparar(chave, remetente, {
      para: emailDoLead,
      assunto: peca.assunto,
      html: peca.html,
      texto: peca.texto,
      // O roteiro manda a pessoa RESPONDER este e-mail para pedir a conta com
      // os números dela. Essa resposta precisa chegar no Luís.
      responderPara: DESTINATARIO_LUIS,
      cabecalhos
    });
    if (falha === '') lead = true;
    else motivos.push(`lead . ${falha}`);
  } catch (e) {
    motivos.push(`lead . ${e instanceof Error ? e.message : String(e)}`);
  }

  return {
    luis,
    lead,
    motivo: motivos.length > 0 ? motivos.join(' | ') : undefined
  };
}
