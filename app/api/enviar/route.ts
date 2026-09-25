/**
 * A ROTA DE ENVIO. Uma só, para os cinco formulários do site.
 *
 * Dois destinos, nesta ordem, e a ordem é a proteção (funil-arquitetura.md):
 *   1. A planilha do Google, pelo Apps Script. É o registro durável.
 *   2. Os e-mails: um para o Luís, com Reply-To do lead, e um de confirmação
 *      para o lead. Ver `lib/emails/index.ts`.
 *
 * A REGRA DE SUCESSO, e ela não é negociável:
 *   sucesso = a planilha gravou OU o e-mail para o Luís saiu
 *   erro    = os DOIS falharam
 *   o e-mail de confirmação do lead falhar NUNCA é erro
 * Mostrar erro depois que a planilha gravou faz a pessoa reenviar, e reenviar
 * duplica a linha. Um lead registrado uma vez com e-mail atrasado é melhor que
 * dois leads idênticos.
 *
 * VARIÁVEIS DE AMBIENTE: SHEET_WEBHOOK_URL, SHEET_TOKEN, RESEND_API_KEY,
 * QUOTE_FROM. Faltando alguma, a rota NÃO quebra: pula aquele destino, escreve
 * no log que a variável não existe, e a regra de sucesso decide o resto. Isso é
 * de propósito, porque hoje o domínio do Resend ainda não está verificado e o
 * funil precisa funcionar assim mesmo.
 */

import type {NextRequest} from 'next/server';
import {
  CAMPO_ARMADILHA,
  FORMULARIOS,
  FREIO_JANELA_MS,
  FREIO_LIMITE,
  OBRIGATORIOS,
  pisoDoFormulario,
  TETO_CAMPANHA,
  TETO_ORIGEM,
  VALORES_ACEITOS,
  ehIdioma,
  ehTipoFormulario,
  tetoDoCampo,
  type CampoDeFormulario,
  type TipoFormulario
} from '@/lib/formularios';
import {cabecalhoDoPasse, emitirPasse} from '@/lib/passe-do-guia';
import {adicionarContato} from '@/lib/newsletter';
import {enviarEmails} from '@/lib/emails';

// Node, não Edge: o Edge foi descontinuado no Next 16 e o nodejs já é o padrão.
// Fica explícito porque esta rota fala com serviço externo e guarda estado em
// memória entre requisições da mesma instância.
export const runtime = 'nodejs';

const TETO_CORPO_NO_LOG = 300;

/**
 * FREIO POR IP, em memória.
 *
 * SEJA HONESTO SOBRE O QUE ISTO É: em serverless cada instância da função tem o
 * PRÓPRIO Map, e as instâncias nascem e morrem sozinhas. Duas requisições
 * seguidas podem cair em instâncias diferentes e nenhuma enxergar a outra.
 * Portanto isto NÃO é um limitador de verdade entre instâncias, e não é defesa
 * contra ataque. É um freio que custa zero, mora no mesmo arquivo e pega o caso
 * ingênuo: a mesma pessoa clicando dez vezes, ou o script simples que repete o
 * envio numa sessão só. Se um dia precisar valer de verdade, o lugar é um
 * armazenamento compartilhado, não este Map.
 */
const historico = new Map<string, number[]>();

function passouNoFreio(ip: string): boolean {
  const agora = Date.now();
  const corte = agora - FREIO_JANELA_MS;

  // Limpeza preguiçosa, para o Map não crescer sem fim na instância viva.
  for (const [chave, marcas] of historico) {
    const vivas = marcas.filter((m) => m > corte);
    if (vivas.length === 0) historico.delete(chave);
    else historico.set(chave, vivas);
  }

  const marcas = historico.get(ip) ?? [];
  if (marcas.length >= FREIO_LIMITE) return false;
  historico.set(ip, [...marcas, agora]);
  return true;
}

function ipDaRequisicao(req: NextRequest): string {
  // `NextRequest.ip` não existe mais desde o Next 15. Na Vercel o endereço
  // chega no x-forwarded-for, e o primeiro da lista é o cliente.
  const encaminhado = req.headers.get('x-forwarded-for');
  if (encaminhado) return encaminhado.split(',')[0]!.trim();
  return req.headers.get('x-real-ip')?.trim() || 'desconhecido';
}

/**
 * Aceita string, número e booleano. Objeto e lista viram vazio, para a planilha
 * nunca receber um "[object Object]" numa célula.
 */
function paraTexto(valor: unknown): string {
  if (typeof valor === 'string') return valor.trim();
  if (typeof valor === 'number' && Number.isFinite(valor)) return String(valor);
  if (typeof valor === 'boolean') return valor ? 'true' : 'false';
  return '';
}

const FORMATO_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type Envelope = Record<string, unknown>;

function ok() {
  return Response.json({ok: true});
}

function erro(codigo: string, status: number) {
  return Response.json({ok: false, erro: codigo}, {status});
}

export async function POST(req: NextRequest) {
  let corpo: Envelope;
  try {
    corpo = (await req.json()) as Envelope;
  } catch {
    return erro('corpo-invalido', 400);
  }
  if (!corpo || typeof corpo !== 'object') return erro('corpo-invalido', 400);

  /* O ENVELOPE */
  const formulario = corpo.formulario;
  if (!ehTipoFormulario(formulario)) return erro('formulario-desconhecido', 400);

  const idioma = ehIdioma(corpo.idioma) ? corpo.idioma : 'en';
  const origem = paraTexto(corpo.origem).slice(0, TETO_ORIGEM);
  /* A CAMPANHA: a query crua da página do formulário, sem o "?". Cortada, nunca
     recusada: uma marcação gigante de rede de anúncio não pode custar um lead.
     O que ela NÃO é: atribuição de primeiro toque. Quem chega com UTM na home e
     navega até /contact chega aqui com a campanha vazia, porque a query não
     sobrevive à navegação. Guardar a origem na chegada é Passe 4. */
  const campanha = paraTexto(corpo.campanha).slice(0, TETO_CAMPANHA);

  /* 1. ARMADILHA.
     Duzentos, nunca 4xx: um erro ensina o robô que aquele campo o denuncia, e
     ele volta amanhã sem preencher. */
  if (paraTexto(corpo[CAMPO_ARMADILHA]) !== '') {
    console.info(`[${formulario}] descartado=armadilha origem=${origem}`);
    return ok();
  }

  /* 2. PISO DE TEMPO.
     PISO E SÓ PISO, NUNCA TETO. Gente real abre o formulário, vai buscar uma
     informação, atende o telefone e volta no dia seguinte com a aba aberta.

     Os dois casos torcidos abaixo NÃO são tratados como robô, e é decisão
     deliberada: descartar em silêncio mostrando sucesso é o pior defeito que
     este sistema pode ter, então na dúvida o envio passa e o log grita.
       . `iniciadoEm` ausente ou inválido seria bug nosso no formulário, e
         transformaria cada lead num sumiço silencioso.
       . decorrido negativo é relógio do visitante adiantado, que é comum. */
  const iniciadoEm = corpo.iniciadoEm;
  if (typeof iniciadoEm !== 'number' || !Number.isFinite(iniciadoEm)) {
    console.warn(
      `[${formulario}] iniciadoEm ausente ou invalido: o formulario nao esta cumprindo o contrato. Envio aceito de proposito.`
    );
  } else {
    const decorrido = Date.now() - iniciadoEm;
    if (decorrido < 0) {
      console.warn(
        `[${formulario}] iniciadoEm no futuro (${decorrido} ms): relogio do visitante adiantado. Envio aceito de proposito.`
      );
    } else if (decorrido < pisoDoFormulario(formulario)) {
      console.info(
        `[${formulario}] descartado=piso-de-tempo decorrido=${decorrido}ms origem=${origem}`
      );
      return ok();
    }
  }

  /* 3. FREIO POR IP */
  const ip = ipDaRequisicao(req);
  if (!passouNoFreio(ip)) {
    console.warn(`[${formulario}] freio=IP limite atingido origem=${origem}`);
    return erro('freio', 429);
  }

  /* 4. VALIDAÇÃO, a partir do contrato.
     A lista é a de `lib/formularios.ts`, a MESMA que o formulário lê. Campo que
     não está no contrato é ignorado: o navegador não inventa coluna. */
  const campos: Record<string, string | boolean> = {};

  for (const campo of FORMULARIOS[formulario] as readonly CampoDeFormulario[]) {
    // `consent` viaja booleano até a planilha: o Apps Script o traduz para
    // "Sim"/"Nao" na célula, e uma string "false" viraria um "false" literal.
    if (campo === 'consent') {
      campos[campo] = corpo[campo] === true || corpo[campo] === 'true';
      continue;
    }
    const bruto = paraTexto(corpo[campo]);

    /* CAMPO DE ESCOLHA (`profile`, `topic`): só passa valor da whitelist de
       `lib/formularios.ts`, que é a mesma lista que desenhou as opções na tela.
       Vazio é legítimo, porque escolher é opcional nos dois.

       Valor desconhecido vira vazio e GRITA no log, nunca entra na célula: o
       ponto desta rodada é a coluna agrupar, e uma string inventada estraga
       exatamente isso. O lead continua sendo gravado, porque perder a pessoa
       inteira por causa de um campo opcional seria pior. */
    const aceitos = VALORES_ACEITOS[campo];
    if (aceitos && bruto !== '' && !aceitos.includes(bruto)) {
      console.warn(
        `[${formulario}] valor fora da lista em ${campo}: ${JSON.stringify(bruto.slice(0, 60))}. Gravado vazio; o lead segue.`
      );
      campos[campo] = '';
      continue;
    }

    campos[campo] = bruto.slice(0, tetoDoCampo(campo));
  }

  const faltando: string[] = [];
  for (const campo of OBRIGATORIOS[formulario as TipoFormulario]) {
    if (paraTexto(campos[campo]) === '') faltando.push(campo);
  }
  if (faltando.length > 0) {
    return Response.json(
      {ok: false, erro: 'campos-obrigatorios', campos: faltando},
      {status: 400}
    );
  }

  const email = String(campos.email ?? '');
  if (!FORMATO_EMAIL.test(email)) {
    return Response.json(
      {ok: false, erro: 'campos-obrigatorios', campos: ['email']},
      {status: 400}
    );
  }

  /* A NEWSLETTER DO BLOG (24/09/2026) tem destinos próprios: a planilha (a prova do
     consentimento, aba Newsletter) e o contato no Resend (a lista de onde saem os
     envios de cada nota). Nenhum e-mail para o Luís a cada inscrição: seria ruído.
     E o consentimento é obrigatório: inscrição sem aceite não existe (CASL). */
  if (formulario === 'newsletter') {
    if (campos.consent !== true) {
      return Response.json({ok: false, erro: 'campos-obrigatorios', campos: ['consent']}, {status: 400});
    }
    const [planilhaN, contato] = await Promise.all([
      gravarNaPlanilha({formulario, idioma, origem, campanha, campos}),
      adicionarContato({email, nome: String(campos.name ?? ''), idioma})
    ]);
    const marcaN = (v: boolean) => (v ? 'ok' : 'FALHOU');
    console.info(
      `[newsletter] planilha=${marcaN(planilhaN.ok)} resend=${marcaN(contato.ok)} lead-email=${email} idioma=${idioma} origem=${origem}`
    );
    const motivosN = [
      ...(planilhaN.ok ? [] : [`planilha: ${planilhaN.motivo}`]),
      ...(contato.ok ? [] : [`resend: ${contato.motivo}`])
    ];
    if (motivosN.length) console.error(`[newsletter] por que caiu . ${motivosN.join(' | ')}`);
    return planilhaN.ok || contato.ok ? ok() : erro('destinos-indisponiveis', 502);
  }

  /* 5. DESTINO 1: A PLANILHA */
  const planilha = await gravarNaPlanilha({
    formulario,
    idioma,
    origem,
    campanha,
    campos
  });

  /* 6. DESTINO 2: OS E-MAILS.
     Nunca deixar uma falha de e-mail derrubar a resposta. */
  let emails: Awaited<ReturnType<typeof enviarEmails>>;
  try {
    emails = await enviarEmails({formulario, idioma, origem, campanha, campos});
  } catch (e) {
    emails = {luis: false, lead: false, motivo: descreverFalha(e)};
  }

  /* 7. O LOG.
     Uma linha legível, SEMPRE, em todo envio. É ela que transforma "o e-mail
     não chegou" num diagnóstico de trinta segundos no painel da Vercel.
     NUNCA logar o token. O e-mail do lead pode; o corpo da mensagem não. */
  const marca = (v: boolean) => (v ? 'ok' : 'FALHOU');
  console.info(
    `[${formulario}] planilha=${marca(planilha.ok)} luis=${marca(emails.luis)} lead=${marca(emails.lead)} lead-email=${email} origem=${origem} campanha=${campanha || '(vazia)'}`
  );
  const motivos: string[] = [];
  if (!planilha.ok) motivos.push(`planilha: ${planilha.motivo}`);
  if (!emails.luis || !emails.lead) {
    motivos.push(`email: ${emails.motivo ?? 'sem motivo informado'}`);
  }
  if (motivos.length > 0) {
    console.error(`[${formulario}] por que caiu . ${motivos.join(' | ')}`);
  }

  /* 8. A REGRA DE SUCESSO */
  if (planilha.ok || emails.luis) {
    /* O PASSE DO GUIA (24/09/2026): quem pediu o guia leva o cookie que abre o
       botão da página de obrigado (`app/api/guia/route.ts`). Só no sucesso de
       verdade: robô descartado lá em cima recebe 200 sem passe. */
    if (formulario === 'guia') {
      const passe = emitirPasse();
      if (passe) {
        return Response.json({ok: true}, {headers: {'Set-Cookie': cabecalhoDoPasse(passe)}});
      }
      console.error('[guia] UNSUBSCRIBE_SECRET ausente: o passe do guia nao foi emitido (a porta abre sem conferir).');
    }
    return ok();
  }
  return erro('destinos-indisponiveis', 502);
}

type ResultadoPlanilha = {ok: boolean; motivo: string};

async function gravarNaPlanilha(dados: {
  formulario: TipoFormulario;
  idioma: 'en' | 'pt';
  origem: string;
  campanha: string;
  campos: Record<string, string | boolean>;
}): Promise<ResultadoPlanilha> {
  const url = process.env.SHEET_WEBHOOK_URL;
  const token = process.env.SHEET_TOKEN;

  const ausentes: string[] = [];
  if (!url) ausentes.push('SHEET_WEBHOOK_URL');
  if (!token) ausentes.push('SHEET_TOKEN');
  if (!url || !token) {
    return {ok: false, motivo: `${ausentes.join(' e ')} ausente`};
  }

  try {
    // O corpo vai PLANO: o Apps Script lê `d[chave]` no topo do JSON, e
    // `idioma`, `origem` e `campanha` são colunas dele como qualquer outra.
    const resposta = await fetch(url, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        token,
        formulario: dados.formulario,
        idioma: dados.idioma,
        origem: dados.origem,
        campanha: dados.campanha,
        ...dados.campos
      }),
      // EXPLÍCITO, mesmo sendo o padrão: o Apps Script responde 302 para um
      // domínio do googleusercontent, e quem não segue conclui que falhou TENDO
      // GRAVADO, o que faz a pessoa reenviar e duplicar a linha.
      redirect: 'follow',
      // O Apps Script é lento em dia ruim, e oito segundos parados já são tempo
      // demais na tela de quem preencheu.
      signal: AbortSignal.timeout(8000)
    });

    const texto = (await resposta.text()).slice(0, TETO_CORPO_NO_LOG);

    if (!resposta.ok) {
      return {ok: false, motivo: `HTTP ${resposta.status} . ${texto}`};
    }

    // O Apps Script responde 200 MESMO quando recusa: token errado, aba ausente
    // e formulário desconhecido saem todos como 200 com `{ok:false}` no corpo.
    // Conferir só o status HTTP daria "planilha=ok" sem nenhuma linha gravada,
    // que é exatamente a falha silenciosa que este sistema existe para evitar.
    try {
      const json = JSON.parse(texto) as {ok?: unknown; error?: unknown};
      if (json.ok === true) return {ok: true, motivo: ''};
      return {
        ok: false,
        motivo: `Apps Script recusou . ${String(json.error ?? texto)}`
      };
    } catch {
      return {ok: false, motivo: `resposta nao era JSON . ${texto}`};
    }
  } catch (e) {
    return {ok: false, motivo: descreverFalha(e)};
  }
}

function descreverFalha(e: unknown): string {
  if (e instanceof Error) {
    // O AbortSignal.timeout estoura com TimeoutError, e o nome dele é o
    // diagnóstico inteiro: o Apps Script demorou mais que oito segundos.
    return `${e.name}: ${e.message}`;
  }
  return String(e);
}
