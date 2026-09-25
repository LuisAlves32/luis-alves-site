import 'server-only';
import {getTranslations} from 'next-intl/server';
import {getPathname} from '@/i18n/navigation';
import {DESTINATARIO_LUIS} from '@/lib/emails';
import {emailDaNota} from '@/lib/emails/para-inscritos';
import {aberturaDaNota, notasPublicadas, type IdiomaNota, type Nota} from '@/lib/notas';
import {mesDaNota, serieDaNota} from '@/lib/notas-formato';
import {siteUrl} from '@/lib/seo';

/**
 * O ENVIO AUTOMÁTICO DE CADA NOTA (blog/newsletter.md, "O envio").
 *
 * Roda uma vez por dia, pelo cron da Vercel (`vercel.json` + `app/api/newsletter/enviar`).
 * Para cada nota publicada que ainda não saiu, cria um Broadcast do Resend no segmento
 * do idioma da nota.
 *
 * AS QUATRO TRAVAS, e cada uma existe por um estrago diferente:
 *   1. SÓ NOTA "Pronto para publicar": é a mesma lista do feed e do site.
 *   2. A JANELA DE CONSERTO: a nota só sai 12 horas depois do dia de publicação (meio-dia
 *      de Vancouver da data). Publicou à noite com erro, corrige de manhã, sai corrigida.
 *   3. O MARCO INICIAL (`NEWSLETTER_INICIO`, AAAA-MM-DD): nota publicada antes dele NUNCA
 *      sai. Sem ele, o primeiro dia do cron mandaria o arquivo inteiro para a base. Sem a
 *      variável, nada sai.
 *   4. SEM BANCO DE DADOS: o NOME do Broadcast (`artigo:<slug>`) é a chave. O envio lista
 *      os Broadcasts do Resend e só cria o que não existe. Rodar duas vezes não manda duas.
 *
 * O MODO (`NEWSLETTER_MODO`):
 *   rascunho    (o padrão) cria o Broadcast SEM enviar: o Gabriel confere a prova no painel
 *               do Resend e aperta enviar. É como saem os dois primeiros.
 *   automatico  cria e envia na hora.
 *   pausado     não faz nada. É o botão de parar tudo.
 *
 * VARIÁVEIS: `NEWSLETTER_API_KEY` (a mesma dos contatos; precisa de permissão total para
 * Broadcasts), `NEWSLETTER_SEGMENTO_EN`, `NEWSLETTER_SEGMENTO_PT`, `NEWSLETTER_FROM` (cai no
 * `QUOTE_FROM`), `NEWSLETTER_INICIO` e `NEWSLETTER_MODO`.
 */

const API = 'https://api.resend.com';
const TETO_MS = 10000;
const JANELA_MS = 12 * 60 * 60 * 1000;

export type Modo = 'rascunho' | 'automatico' | 'pausado';

export type ItemDoEnvio = {
  slug: string;
  idioma: IdiomaNota;
  nome: string;
  situacao: 'criado' | 'enviado' | 'ja-existia' | 'na-janela' | 'antes-do-inicio' | 'falhou' | 'ensaio';
  motivo?: string;
};

export type RelatorioDoEnvio = {modo: Modo; inicio: string; ensaio: boolean; itens: ItemDoEnvio[]; erro?: string};

export const nomeDoBroadcast = (slug: string) => `artigo:${slug}`;

/** O instante em que a nota conta como publicada: meio-dia de Vancouver da data (19h UTC). */
function momentoDaPublicacao(iso: string): number {
  const [a, m, d] = iso.split('-').map(Number);
  return Date.UTC(a, m - 1, d, 19, 0, 0);
}

function lerModo(): Modo {
  const v = (process.env.NEWSLETTER_MODO ?? '').trim().toLowerCase();
  return v === 'automatico' || v === 'pausado' ? v : 'rascunho';
}

async function pedir(chave: string, caminho: string, init: RequestInit = {}): Promise<Response> {
  return fetch(`${API}${caminho}`, {
    ...init,
    headers: {Authorization: `Bearer ${chave}`, 'Content-Type': 'application/json'},
    signal: AbortSignal.timeout(TETO_MS)
  });
}

/** Os nomes de TODOS os Broadcasts da conta, página por página. */
async function nomesExistentes(chave: string): Promise<Set<string>> {
  const nomes = new Set<string>();
  let depois = '';
  for (let pagina = 0; pagina < 50; pagina++) {
    const r = await pedir(chave, `/broadcasts?limit=100${depois ? `&after=${depois}` : ''}`);
    if (!r.ok) throw new Error(`listar broadcasts: HTTP ${r.status} . ${(await r.text()).slice(0, 200)}`);
    const json = (await r.json()) as {data?: {id: string; name?: string | null}[]; has_more?: boolean};
    const lista = json.data ?? [];
    lista.forEach((b) => b.name && nomes.add(b.name));
    if (!json.has_more || !lista.length) break;
    depois = lista[lista.length - 1].id;
  }
  return nomes;
}

/** O e-mail pronto de uma nota. Exportado para a prova (o mock) montar o mesmo e-mail. */
export async function montarEmailDaNota(nota: Nota) {
  const t = await getTranslations({locale: nota.idioma, namespace: 'notas'});
  const categorias: Record<string, string> = {
    buying: t('filtros.buying'),
    selling: t('filtros.selling'),
    presale: t('filtros.presale'),
    market: t('filtros.market'),
    notes: t('filtros.notes')
  };
  const url = siteUrl + getPathname({locale: nota.idioma, href: {pathname: '/notes/[slug]', params: {slug: nota.slug}}});
  const fonte = nota.fonte
    ? nota.medidoEm
      ? `${nota.fonte}, ${t('ficha.medido').toLowerCase()} ${mesDaNota(nota.medidoEm, nota.idioma)}`
      : nota.fonte
    : '';
  return emailDaNota({
    idioma: nota.idioma,
    nomeDoBlog: `${t('nomeAntes')} ${t('nomeAncora')}`,
    serie: nota.serie ? serieDaNota(nota.serie) : '',
    categoria: categorias[nota.categoria],
    titulo: nota.titulo,
    numero: nota.numero,
    rotuloDoNumero: nota.rotuloDoNumero,
    fonte,
    abertura: await aberturaDaNota(nota.slug),
    url,
    base: siteUrl
  });
}

export async function enviarNotasNovas({
  ensaio = false,
  agora = Date.now(),
  inicioDoEnsaio = ''
}: {ensaio?: boolean; agora?: number; inicioDoEnsaio?: string} = {}): Promise<RelatorioDoEnvio> {
  const modo = lerModo();
  // O marco do ensaio só vale no ensaio: nunca troca o marco de um envio de verdade.
  const inicio = ((ensaio && inicioDoEnsaio) || process.env.NEWSLETTER_INICIO || '').trim();
  const relatorio: RelatorioDoEnvio = {modo, inicio, ensaio, itens: []};

  if (modo === 'pausado') return relatorio;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(inicio)) return {...relatorio, erro: 'NEWSLETTER_INICIO ausente ou fora do formato AAAA-MM-DD'};

  const chave = process.env.NEWSLETTER_API_KEY || process.env.RESEND_API_KEY || '';
  const remetente = process.env.NEWSLETTER_FROM || process.env.QUOTE_FROM || '';
  const segmento: Record<IdiomaNota, string> = {
    en: process.env.NEWSLETTER_SEGMENTO_EN ?? '',
    pt: process.env.NEWSLETTER_SEGMENTO_PT ?? ''
  };

  /* As candidatas, do mais antigo para o mais novo: se duas saírem no mesmo dia, a
     ordem de chegada na caixa é a ordem de publicação. */
  const candidatas = (await notasPublicadas()).filter((n) => n.publicado).reverse();
  const itens: ItemDoEnvio[] = [];
  const elegiveis: Nota[] = [];
  for (const n of candidatas) {
    const base = {slug: n.slug, idioma: n.idioma, nome: nomeDoBroadcast(n.slug)};
    if (n.publicado < inicio) continue; // o arquivo antigo não entra nem no relatório
    if (momentoDaPublicacao(n.publicado) + JANELA_MS > agora) itens.push({...base, situacao: 'na-janela'});
    else elegiveis.push(n);
  }

  if (ensaio) {
    elegiveis.forEach((n) => itens.push({slug: n.slug, idioma: n.idioma, nome: nomeDoBroadcast(n.slug), situacao: 'ensaio'}));
    return {...relatorio, itens};
  }
  if (!elegiveis.length) return {...relatorio, itens};

  const ausentes = [
    !chave && 'NEWSLETTER_API_KEY',
    !remetente && 'NEWSLETTER_FROM',
    ...elegiveis.map((n) => !segmento[n.idioma] && `NEWSLETTER_SEGMENTO_${n.idioma.toUpperCase()}`)
  ].filter(Boolean);
  if (ausentes.length) return {...relatorio, itens, erro: `${[...new Set(ausentes)].join(' e ')} ausente`};

  let existentes: Set<string>;
  try {
    existentes = await nomesExistentes(chave);
  } catch (e) {
    // Sem saber o que já saiu, NÃO se cria nada: criar às cegas é o caminho do envio duplo.
    return {...relatorio, itens, erro: e instanceof Error ? e.message : String(e)};
  }

  for (const n of elegiveis) {
    const base = {slug: n.slug, idioma: n.idioma, nome: nomeDoBroadcast(n.slug)};
    if (existentes.has(base.nome)) {
      itens.push({...base, situacao: 'ja-existia'});
      continue;
    }
    try {
      const email = await montarEmailDaNota(n);
      const r = await pedir(chave, '/broadcasts', {
        method: 'POST',
        body: JSON.stringify({
          segment_id: segmento[n.idioma],
          from: remetente,
          reply_to: DESTINATARIO_LUIS,
          subject: email.assunto,
          html: email.html,
          text: email.texto,
          name: base.nome,
          send: modo === 'automatico'
        })
      });
      if (!r.ok) {
        itens.push({...base, situacao: 'falhou', motivo: `HTTP ${r.status} . ${(await r.text()).slice(0, 200)}`});
        continue;
      }
      existentes.add(base.nome);
      itens.push({...base, situacao: modo === 'automatico' ? 'enviado' : 'criado'});
    } catch (e) {
      itens.push({...base, situacao: 'falhou', motivo: e instanceof Error ? e.message : String(e)});
    }
  }
  return {...relatorio, itens};
}
