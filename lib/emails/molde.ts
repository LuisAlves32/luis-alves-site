/**
 * O MOLDE DOS DOIS E-MAILS. Primitivas de HTML de e-mail, e nada além disso.
 *
 * AS REGRAS QUE GOVERNAM ESTE ARQUIVO, e nenhuma é preferência de estilo:
 *
 * 1. LAYOUT SÓ COM `<table>`. Nada de flex, grid, position, float. O Outlook do
 *    Windows renderiza com o motor do Word, que não conhece nenhum dos quatro.
 * 2. TODO ESTILO INLINE. Zero classe, zero `<style>` no head: o Gmail remove o
 *    bloco de estilo inteiro e o e-mail chega sem desenho nenhum.
 * 3. ZERO WEBFONT. Georgia para leitura, Arial para rótulo. As duas existem no
 *    Windows e no macOS desde sempre, e é isso que uma webfont não garante.
 * 4. ZERO IMAGEM. O Outlook bloqueia imagem por padrão, e um wordmark em PNG
 *    deixa o e-mail decapitado no primeiro olhar. O wordmark aqui é TEXTO com
 *    `letter-spacing`, que é o mesmo gesto da marca sem depender de download.
 * 5. COR DE FUNDO NO `bgcolor` E NO `style`, sempre nos dois: o Word lê o
 *    atributo, o resto lê a folha.
 * 6. TABELA FLUIDA, nunca largura fixa em pixel. Largura fixa faz o Gmail
 *    encolher a mensagem inteira num aparelho de 375px, e um rótulo de 9,5px
 *    vira 6px ilegível. A única largura fixa do arquivo vive dentro de um
 *    comentário condicional do Outlook (a "ghost table"), porque lá o
 *    `max-width` não existe e sem ela a coluna se esparrama na janela inteira.
 * 7. SEM FILETE, FIO, RÉGUA OU TRAÇO DECORATIVO, em lugar nenhum. Decisão do
 *    diretor que contraria o molde clássico deste tipo de e-mail. Separação se
 *    faz por ESPAÇO e por COR DE FUNDO, e é só isso que este arquivo oferece.
 * 8. NENHUMA COR COM ALFA. `rgba` e `opacity` não sobrevivem ao Word: o texto
 *    de apoio é um HEX SÓLIDO já misturado com o fundo dele, para o contraste
 *    medido ser o contraste real.
 */

/* A PALETA, em hex sólido, vinda dos tokens de `app/globals.css`.
   Os dois tons "apoio" não estão lá: são a mistura JÁ CALCULADA do texto com o
   fundo dele (Papel a 75% sobre Tinta, Grafite a 78% sobre Papel), porque alfa
   não sobrevive ao Outlook. Os contrastes de todos eles são medidos pela prova,
   nunca estimados aqui. */
export const COR = {
  tinta: '#0e2440',
  papel: '#f5f3ef',
  branco: '#ffffff',
  grafite: '#3d4d63',
  lapis: '#c8ccd1',
  areia: '#e7dfd4',
  avanco: '#2a6dd6',
  latao: '#b08d57',
  /** Papel a 75% sobre Tinta, resolvido. Apoio sobre o bloco escuro. 8,44:1. */
  apoioSobreTinta: '#bbbfc3',
  /**
   * Grafite a 80% sobre Papel, resolvido. Apoio sobre os dois blocos claros.
   *
   * CALIBRADO CONTRA O PAPEL, e não contra o branco, e a diferença é o defeito
   * que a prova pegou: o tom anterior (`#6b7688`) foi misturado olhando para o
   * cartão branco, passava com folga lá (4,59:1) e REPROVAVA no Papel (4,14:1),
   * que é o fundo do bloco da cópia do envio. Quando um tom serve dois fundos,
   * quem manda é o mais escuro dos dois. Agora dá 4,67:1 no Papel e 5,18:1 no
   * branco.
   */
  apoioSobrePapel: '#626e7f'
} as const;

export const FONTE = {
  leitura: "Georgia, 'Times New Roman', serif",
  rotulo: 'Arial, Helvetica, sans-serif'
} as const;

/**
 * ESCAPE, em 100% do que a pessoa digitou. Os cinco caracteres, incluindo as
 * duas aspas: valor de campo entra em texto de nó E em atributo (o `href` do
 * `mailto:`), e quem escapa só `& < >` deixa um `"` fechar o atributo.
 */
export function escapar(valor: unknown): string {
  return String(valor ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Quebra de linha do que a pessoa digitou vira `<br>`, depois do escape. */
export function escaparMultilinha(valor: unknown): string {
  return escapar(valor).replace(/\r?\n/g, '<br>');
}

/**
 * O PRÉ-HEADER: a linha que a caixa de entrada mostra ao lado do assunto, antes
 * de alguém abrir. Sem ele o cliente de e-mail rouba a primeira frase do corpo,
 * e no nosso caso roubaria "Oi, Maria", que não informa nada.
 *
 * Os caracteres invisíveis no fim não são enfeite: eles EMPURRAM o resto do
 * corpo para fora da prévia. Sem eles a prévia vira o pré-header colado no
 * começo do corpo, tudo espremido.
 */
function preHeader(texto: string): string {
  const empurrao = '&#847;&zwnj;&nbsp;'.repeat(60);
  return `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:${COR.papel};">${escapar(texto)}${empurrao}</div>`;
}

/**
 * A MOLDURA. Documento inteiro, com o fundo da página, a centralização e a
 * coluna de 520px.
 *
 * `color-scheme: light only` e o `<meta>` gêmeo existem porque o Outlook.com e
 * o Gmail em modo escuro INVERTEM as cores por conta própria, e uma inversão
 * automática de um bloco Tinta com texto Papel produz texto escuro sobre fundo
 * claro-sujo, com o contraste que ninguém mediu. Declarar o esquema é o que
 * pede para não mexerem.
 */
export function moldura({
  titulo,
  preview,
  fundo,
  corpo
}: {
  titulo: string;
  preview: string;
  fundo: string;
  corpo: string;
}): string {
  return `<!doctype html>
<html lang="en" style="margin:0;padding:0;">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light">
<title>${escapar(titulo)}</title>
</head>
<body style="margin:0;padding:0;background-color:${fundo};">
${preview ? preHeader(preview) : ''}
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="${fundo}" style="width:100%;border-collapse:collapse;background-color:${fundo};">
<tr>
<td align="center" style="padding:24px 12px;">
<!--[if mso]><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="520"><tr><td><![endif]-->
<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="width:100%;max-width:520px;border-collapse:collapse;">
${corpo}
</table>
<!--[if mso]></td></tr></table><![endif]-->
</td>
</tr>
</table>
</body>
</html>`;
}

/**
 * UMA FAIXA: um `<tr>` com fundo próprio e respiro próprio. É a única
 * ferramenta de separação deste molde, porque filete está proibido: o que diz
 * "aqui começa outra coisa" é a mudança de cor e o espaço, nunca uma linha.
 */
export function faixa({
  fundo,
  conteudo,
  respiro = '28px 28px',
  respiroMobile
}: {
  fundo: string;
  conteudo: string;
  respiro?: string;
  respiroMobile?: string;
}): string {
  // O respiro do celular não pode vir de media query (o Gmail remove o
  // `<style>`), então o valor único já é o que cabe em 375px.
  const p = respiroMobile ?? respiro;
  return `<tr><td bgcolor="${fundo}" style="background-color:${fundo};padding:${p};">${conteudo}</td></tr>`;
}

/** Espaço vertical puro. Um `<tr>` vazio com altura, que o Word respeita. */
export function respiro(altura: number, fundo: string): string {
  return `<tr><td bgcolor="${fundo}" style="background-color:${fundo};height:${altura}px;line-height:${altura}px;font-size:0;">&nbsp;</td></tr>`;
}

/**
 * O WORDMARK, em TEXTO. Caixa alta com `letter-spacing`, que é como a marca se
 * apresenta nos kickers do site. O `®` fica menor e alinhado ao topo, como no
 * rodapé: é compliance (o símbolo é obrigatório) e é acabamento.
 */
export function wordmark(cor: string): string {
  return `<div style="margin:0;font-family:${FONTE.rotulo};font-size:12px;line-height:18px;letter-spacing:0.22em;text-transform:uppercase;color:${cor};">Luis Alves REALTOR<span style="font-size:9px;vertical-align:top;letter-spacing:0;">&reg;</span></div>`;
}

/** Parágrafo de leitura, em Georgia. O corpo dos e-mails do lead. */
export function paragrafo(
  html: string,
  cor: string,
  {tamanho = 17, alturaLinha = 27, topo = 0}: {tamanho?: number; alturaLinha?: number; topo?: number} = {}
): string {
  return `<p style="margin:${topo}px 0 0 0;font-family:${FONTE.leitura};font-size:${tamanho}px;line-height:${alturaLinha}px;color:${cor};">${html}</p>`;
}

/** Rótulo pequeno, em Arial caixa alta. Nunca é conteúdo, sempre é etiqueta. */
export function rotulo(texto: string, cor: string, topo = 0): string {
  return `<div style="margin:${topo}px 0 0 0;font-family:${FONTE.rotulo};font-size:11px;line-height:16px;letter-spacing:0.14em;text-transform:uppercase;color:${cor};">${escapar(texto)}</div>`;
}

/**
 * O BOTÃO. Tabela de uma célula, e não um `<a>` com padding: no Word, padding
 * em `<a>` não pinta, e o botão chega como um link solto no meio do texto.
 * Quem pinta é o `<td>`, e o `<a>` por dentro é quem recebe o clique.
 *
 * Sem `border-radius` no Word (ele ignora e entrega um retângulo), e isso é
 * aceito: um canto reto no Outlook é melhor que uma imagem de botão.
 */
export function botao({
  rotulo: texto,
  href,
  fundo,
  cor
}: {
  rotulo: string;
  href: string;
  fundo: string;
  cor: string;
}): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
<tr><td bgcolor="${fundo}" align="center" style="background-color:${fundo};border-radius:8px;">
<a href="${escapar(href)}" style="display:block;padding:15px 28px;font-family:${FONTE.rotulo};font-size:15px;font-weight:bold;line-height:20px;color:${cor};text-decoration:none;border-radius:8px;">${escapar(texto)}</a>
</td></tr></table>`;
}

/**
 * UMA LINHA DE DADO: rótulo em cima, valor embaixo. Duas linhas e não duas
 * colunas, e isso é decisão de 375px: em duas colunas o rótulo "Endereço do
 * imóvel" quebra em três linhas e empurra o valor para uma coluna de oito
 * caracteres. Empilhado, o valor sempre tem a largura inteira.
 *
 * Sem borda embaixo, porque filete está proibido. O que separa uma linha da
 * seguinte é o espaço de cima do rótulo.
 */
export function linhaDeDado({
  etiqueta,
  valorHtml,
  corEtiqueta,
  corValor,
  primeira = false,
  fonte = 'rotulo'
}: {
  etiqueta: string;
  valorHtml: string;
  corEtiqueta: string;
  corValor: string;
  primeira?: boolean;
  fonte?: 'rotulo' | 'leitura';
}): string {
  const familia = fonte === 'leitura' ? FONTE.leitura : FONTE.rotulo;
  const tamanho = fonte === 'leitura' ? 16 : 15;
  const alturaLinha = fonte === 'leitura' ? 25 : 22;
  return `${rotulo(etiqueta, corEtiqueta, primeira ? 0 : 18)}<div style="margin:3px 0 0 0;font-family:${familia};font-size:${tamanho}px;line-height:${alturaLinha}px;color:${corValor};word-break:break-word;">${valorHtml}</div>`;
}
