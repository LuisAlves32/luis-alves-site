/* Formatos do Second Opinion que servem ao servidor e ao navegador (sem `server-only`). */

/** "N.º 006": três dígitos, o índice lê como livro-razão. */
export function serieDaNota(n: number): string {
  return `N.º ${String(n).padStart(3, '0')}`;
}

/** "Sep 24, 2026" ou "24 set. 2026", sem fuso: a data do painel é um dia, não um instante. */
export function dataDaNota(iso: string, locale: string): string {
  if (!iso) return '';
  const [a, m, d] = iso.split('-').map(Number);
  return new Intl.DateTimeFormat(locale === 'pt' ? 'pt-BR' : 'en-CA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC'
  }).format(new Date(Date.UTC(a, m - 1, d)));
}

/** "Sep 2026" ou "set. 2026", para o rodapé da capa. */
export function mesDaNota(iso: string, locale: string): string {
  if (!iso) return '';
  const [a, m] = iso.split('-').map(Number);
  return new Intl.DateTimeFormat(locale === 'pt' ? 'pt-BR' : 'en-CA', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC'
  }).format(new Date(Date.UTC(a, m - 1, 1)));
}
