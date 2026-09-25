import 'server-only';
import {cache} from 'react';
import {createReader} from '@keystatic/core/reader';
import Markdoc, {type Node, type RenderableTreeNode, Tag} from '@markdoc/markdoc';
import keystaticConfig from '@/keystatic.config';
import {colarUltimasPalavrasEm, TETO_CORPO} from '@/lib/tipografia-notas';

/**
 * A LEITURA DO SECOND OPINION. As notas vêm do painel (Keystatic), que grava arquivos em
 * `content/notas`. Tudo o que as páginas precisam sai daqui já pronto: o número de série (N.º),
 * o tempo de leitura, os subtítulos, e o acabamento das órfãs aplicado NA LEITURA (o arquivo da
 * nota fica limpo). Adaptado do leitor do The Cora Journal (kit da skill blog-com-painel).
 */

const reader = createReader(process.cwd(), keystaticConfig);

export type Categoria = 'buying' | 'selling' | 'presale' | 'market' | 'notes';
export type IdiomaNota = 'en' | 'pt';

export type Nota = {
  slug: string;
  titulo: string;
  idioma: IdiomaNota;
  categoria: Categoria;
  resumo: string;
  /** O número da capa, ou vazio. Número sem fonte e sem data NÃO chega à capa (design-blog.md, 5.1). */
  numero: string;
  rotuloDoNumero: string;
  fonte: string;
  linkDaFonte: string;
  medidoEm: string;
  validade: string;
  publicado: string;
  atualizado: string;
  tituloGoogle: string;
  descricaoGoogle: string;
  pronta: boolean;
  traducaoDe: string | null;
  /** O N.º da nota, pela ordem de publicação. A tradução herda o N.º da original. */
  serie: number;
  minutos: number;
  /** Palavras do corpo: a régua da leitura estima o tempo que falta com elas. */
  palavras: number;
  /** Os textos de TELA, com as últimas palavras coladas. Metadados e dados estruturados usam os crus. */
  tela: {titulo: string; resumo: string};
};

export type Subtitulo = {id: string; texto: string};

/* Leitura atenta, no celular: 200 palavras por minuto, nunca menos de 1. */
const PALAVRAS_POR_MINUTO = 200;

function contarPalavras(no: Node): number {
  let n = 0;
  for (const filho of no.walk()) {
    if (filho.type === 'text' && typeof filho.attributes.content === 'string') {
      n += filho.attributes.content.split(/\s+/).filter(Boolean).length;
    }
  }
  return n;
}

type Entrada = Awaited<ReturnType<typeof reader.collections.notas.all>>[number];

/* O Keystatic entrega o corpo como função (leitura preguiçosa) ou já resolvido, conforme a chamada. */
type Corpo = {node: Node} | (() => Promise<{node: Node}>);
async function lerNo(corpo: Corpo): Promise<Node> {
  return (typeof corpo === 'function' ? await corpo() : corpo).node;
}

async function montar({slug, entry}: Entrada): Promise<Omit<Nota, 'serie'>> {
  const node = await lerNo(entry.corpo as Corpo);
  const temProcedencia = Boolean(entry.fonte?.trim() && entry.medidoEm);
  return {
    slug,
    titulo: entry.titulo,
    idioma: entry.idioma as IdiomaNota,
    categoria: entry.categoria as Categoria,
    resumo: entry.resumo,
    numero: temProcedencia ? entry.numero.trim() : '',
    rotuloDoNumero: entry.rotuloDoNumero,
    fonte: entry.fonte,
    linkDaFonte: entry.linkDaFonte ?? '',
    medidoEm: entry.medidoEm ?? '',
    validade: entry.validade,
    publicado: entry.publicado ?? '',
    atualizado: entry.atualizado ?? entry.publicado ?? '',
    tituloGoogle: entry.tituloGoogle,
    descricaoGoogle: entry.descricaoGoogle,
    pronta: entry.prontoParaPublicar,
    traducaoDe: entry.traducaoDe ?? null,
    minutos: Math.max(1, Math.round(contarPalavras(node) / PALAVRAS_POR_MINUTO)),
    palavras: contarPalavras(node),
    tela: {
      titulo: colarUltimasPalavrasEm(entry.titulo),
      resumo: colarUltimasPalavrasEm(entry.resumo, TETO_CORPO)
    }
  };
}

/**
 * TODAS as notas, rascunhos inclusive, do mais novo para o mais antigo, já com o N.º. O N.º conta
 * só as notas prontas e originais, pela data; a tradução herda o da original, e o rascunho fica
 * com 0 (não aparece em lugar nenhum com número).
 */
const todas = cache(async (): Promise<Nota[]> => {
  /* UMA NOTA POR VEZ, e nunca `all()`: o `all()` explode na primeira nota inválida e derruba o
     blog INTEIRO (medido em 24/09/2026 com um arquivo sem "Última revisão"). O painel valida antes
     de salvar, mas um arquivo editado direto no GitHub não passa por ele. A nota defeituosa sai do
     site com um aviso no log da Vercel, e as outras continuam no ar. */
  const slugs = await reader.collections.notas.list();
  const lidas = await Promise.all(
    slugs.map(async (slug) => {
      try {
        const entry = await reader.collections.notas.read(slug);
        return entry ? await montar({slug, entry} as Entrada) : null;
      } catch (erro) {
        console.error(`[notas] "${slug}" ficou fora do site: ${erro instanceof Error ? erro.message : erro}`);
        return null;
      }
    })
  );
  const notas = lidas.filter((n): n is Omit<Nota, 'serie'> => n !== null);
  const ordem = notas
    .filter((n) => n.pronta && !n.traducaoDe)
    .sort((a, b) => a.publicado.localeCompare(b.publicado) || a.slug.localeCompare(b.slug));
  const serieDe = new Map(ordem.map((n, i) => [n.slug, i + 1]));
  return notas
    .map((n) => ({
      ...n,
      serie: n.pronta ? (serieDe.get(n.traducaoDe ?? n.slug) ?? 0) : 0
    }))
    .sort((a, b) => b.publicado.localeCompare(a.publicado) || b.serie - a.serie);
});

/** As notas PUBLICADAS ("Pronto para publicar"): índice, sitemap e feed. */
export const notasPublicadas = cache(async (): Promise<Nota[]> => (await todas()).filter((n) => n.pronta));

/** Uma nota pelo slug, rascunho inclusive: o rascunho abre pelo endereço, com noindex, para revisão. */
export const notaPorSlug = cache(async (slug: string): Promise<Nota | null> => {
  return (await todas()).find((n) => n.slug === slug) ?? null;
});

/** A tradução publicada de uma nota, nos dois sentidos, se existir. */
export async function traducaoDe(nota: Nota): Promise<Nota | null> {
  const publicadas = await notasPublicadas();
  return (
    publicadas.find((n) => n.slug !== nota.slug && (n.traducaoDe === nota.slug || n.slug === nota.traducaoDe)) ??
    null
  );
}

/* ------------------------------------------------------------------------------------------- */
/* O corpo da nota                                                                               */
/* ------------------------------------------------------------------------------------------- */

function slugificar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

function textoDaTag(no: RenderableTreeNode): string {
  if (typeof no === 'string') return no;
  if (Tag.isTag(no)) return no.children.map(textoDaTag).join('');
  return '';
}

/** Cola as últimas palavras do último trecho de texto de um parágrafo, item ou subtítulo. */
function colarBloco(tag: Tag) {
  for (let i = tag.children.length - 1; i >= 0; i--) {
    const filho = tag.children[i];
    if (typeof filho === 'string') {
      if (!filho.trim()) continue;
      const palavras = filho.trim().split(/\s+/);
      if (palavras.length >= 3) tag.children[i] = colarUltimasPalavrasEm(filho, TETO_CORPO);
      else if (palavras.length === 2 && palavras.join(' ').length <= TETO_CORPO) {
        tag.children[i] = filho.replace(/(\S+)\s+(\S+\s*)$/, '$1 $2');
      }
      return;
    }
    if (Tag.isTag(filho)) {
      colarBloco(filho);
      return;
    }
  }
}

/* As peças próprias do editor viram componentes da página (components/notas/corpo-nota.tsx). */
const ESQUEMA = {
  tags: {
    cota: {render: 'Marcada'},
    notaDoLuis: {render: 'NotaDoLuis', attributes: {texto: {type: String}}},
    aConta: {
      render: 'AConta',
      attributes: {
        titulo: {type: String},
        linhas: {type: Array},
        rotuloDoTotal: {type: String},
        total: {type: String},
        nota: {type: String}
      }
    }
  }
};

export type CorpoPronto = {arvore: RenderableTreeNode; subtitulos: Subtitulo[]};

/**
 * Lê e prepara o corpo: `id` estável em cada subtítulo (para o índice e para a régua da leitura) e
 * a cola das órfãs em cada parágrafo, item e subtítulo.
 */
export async function lerCorpo(slug: string): Promise<CorpoPronto | null> {
  const entrada = await reader.collections.notas.read(slug);
  if (!entrada) return null;
  const node = await lerNo(entrada.corpo as Corpo);
  const raiz = Markdoc.transform(node, ESQUEMA) as Tag;
  /* o Markdoc embrulha tudo num <article>, e a página já é um <article>: a raiz vira <div> */
  raiz.name = 'div';
  raiz.attributes = {...raiz.attributes, class: 'corpo-nota'};

  const subtitulos: Subtitulo[] = [];
  const usados = new Set<string>();
  for (const bloco of raiz.children) {
    if (!Tag.isTag(bloco)) continue;
    if (bloco.name === 'h2') {
      const texto = textoDaTag(bloco);
      let id = slugificar(texto) || 'parte';
      while (usados.has(id)) id = `${id}-2`;
      usados.add(id);
      bloco.attributes = {...bloco.attributes, id};
      colarBloco(bloco);
      subtitulos.push({id, texto: colarUltimasPalavrasEm(texto, TETO_CORPO)});
    }
    if (bloco.name === 'p' || bloco.name === 'h3') colarBloco(bloco);
    if (bloco.name === 'ul' || bloco.name === 'ol') bloco.children.forEach((li) => Tag.isTag(li) && colarBloco(li));
  }

  /* A NOTA DO LUÍS vai junto do parágrafo a que se refere (o de cima), num bloco só:
     no computador ela se alinha pelo TOPO desse parágrafo, na margem direita; no
     celular segue no fluxo, logo depois dele. Alinhar pela base fazia a nota, mais
     alta que o parágrafo, invadir o de cima (medido: 33px a 1440, 24/09/2026). */
  const blocos = raiz.children;
  for (let i = blocos.length - 1; i > 0; i--) {
    const atual = blocos[i];
    const anterior = blocos[i - 1];
    if (Tag.isTag(atual) && atual.name === 'NotaDoLuis' && Tag.isTag(anterior) && anterior.name === 'p') {
      blocos.splice(i - 1, 2, new Tag('div', {class: 'bloco-com-nota'}, [anterior, atual]));
      i--;
    }
  }
  return {arvore: raiz, subtitulos};
}

/**
 * A ABERTURA da nota para o e-mail da newsletter: os primeiros parágrafos, em texto puro e SEM
 * a cola das órfãs. Quem cola é o montador do HTML (`lib/emails/para-inscritos.ts`), para a
 * versão em texto puro do e-mail sair limpa. Parágrafo só: subtítulo, lista e os blocos do
 * painel ficam para o site.
 */
export async function aberturaDaNota(slug: string, quantos = 2): Promise<string[]> {
  const entrada = await reader.collections.notas.read(slug);
  if (!entrada) return [];
  const raiz = Markdoc.transform(await lerNo(entrada.corpo as Corpo), ESQUEMA) as Tag;
  return raiz.children
    .filter((b): b is Tag => Tag.isTag(b) && b.name === 'p')
    .map((p) => textoDaTag(p).replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .slice(0, quantos);
}
