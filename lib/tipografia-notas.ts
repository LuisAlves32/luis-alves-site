// Acabamento tipográfico das NOTAS do blog (regra global das órfãs; skill acabamento-tipografico).
// O site cola as duas últimas palavras de cada mensagem em `i18n/request.ts`; as notas vêm do
// painel e não passam por lá, então a mesma regra é aplicada aqui, NA LEITURA. O arquivo da nota
// continua limpo. Porte da regra provada no The Cora Journal (kit da skill blog-com-painel).

const NBSP = ' ';

/* O bloco colado nunca passa disto: um pedaço indivisível largo estoura a coluna de 320px. */
export const TETO_TITULO = 18;
/* No CORPO a letra é menor e a coluna tem pelo menos 288px: cabe um bloco maior. Medido na Cora:
   com 18, "questions answered." ficava de fora e fechava a linha em 26%. */
export const TETO_CORPO = 24;

/**
 * Cola as últimas palavras de UM parágrafo com espaço inflexível, para nenhuma palavra ficar
 * sozinha na última linha: cola duas, e a TERCEIRA quando as três ainda cabem no teto. Só age com
 * três palavras ou mais, e não cola nada quando as duas últimas já passam do teto.
 */
function colarParagrafo(p: string, teto: number): string {
  const pedacos = p.split(/( +)/);
  const palavras = pedacos.map((s, i) => (i % 2 === 0 && s !== '' ? i : -1)).filter((i) => i >= 0);
  if (palavras.length < 3) return p;
  const [a, b, c] = palavras.slice(-3);
  const duas = `${pedacos[b]} ${pedacos[c]}`;
  if (duas.length > teto) return p;
  pedacos[c - 1] = NBSP;
  if (palavras.length >= 4 && `${pedacos[a]} ${duas}`.length <= teto) pedacos[b - 1] = NBSP;
  return pedacos.join('');
}

/** Aplica a colagem a um texto, parágrafo por parágrafo. */
export function colarUltimasPalavrasEm(texto: string, teto = TETO_TITULO): string {
  return texto
    .split('\n')
    .map((p) => colarParagrafo(p, teto))
    .join('\n');
}
