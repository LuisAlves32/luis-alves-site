import type {Locale} from '@/i18n/routing';

/* OS CAMINHOS DAS CAPAS DO GUIA, num módulo SEM `'use client'`.
 *
 * POR QUE ESTE ARQUIVO EXISTE, e o motivo é um bug que só o build pega:
 * `components/home/guia-newsletter.tsx` exporta as mesmas duas constantes, mas
 * aquele módulo é `'use client'`. Quando um Server Component importa um valor
 * que não é componente de um módulo cliente, o Next troca o módulo por uma
 * referência de cliente e o valor chega `undefined` no servidor. O `tsc` passa,
 * o lint passa, e o erro aparece só na prerenderização:
 *     TypeError: Cannot read properties of undefined (reading 'desktop')
 * A hero da landing é Server Component, então ela precisa de uma fonte que não
 * atravesse essa fronteira.
 *
 * É CAMINHO DE ARQUIVO, NÃO COPY: não vira chave de tradução, escolhe-se pelo
 * locale como o resto do site resolve idioma.
 *
 * DÍVIDA CONHECIDA, e ela está aqui escrita para não virar surpresa: hoje estes
 * valores existem em DOIS lugares, aqui e no `guia-newsletter.tsx`. Este arquivo
 * deveria ser a fonte única e o bloco 11 da home deveria importar daqui, o que é
 * uma troca de seis linhas. Não foi feito nesta rodada porque a rodada tinha
 * fronteira explícita de não tocar em nada fora do grupo do funil. */

export const CAPA: Record<Locale, {desktop: string; mobile: string}> = {
  pt: {desktop: '/guia/capa-guia.webp', mobile: '/guia/capa-guia-mobile.webp'},
  en: {
    desktop: '/guia/capa-guia-en.webp',
    mobile: '/guia/capa-guia-en-mobile.webp'
  }
};

// A contracapa é a MESMA paisagem da capa, continuando para a esquerda.
export const CONTRACAPA: Record<Locale, {desktop: string; mobile: string}> = {
  pt: {
    desktop: '/guia/contracapa-guia.webp',
    mobile: '/guia/contracapa-guia-mobile.webp'
  },
  en: {
    desktop: '/guia/contracapa-guia-en.webp',
    mobile: '/guia/contracapa-guia-en-mobile.webp'
  }
};
