import {hasLocale, type AbstractIntlMessages} from 'next-intl';
import {getRequestConfig} from 'next-intl/server';
import {colarUltimasPalavrasEm} from '@/lib/tipografia-notas';
import {routing} from './routing';

/* ACABAMENTO TIPOGRÁFICO SISTÊMICO (regra global de órfãs; skill acabamento-tipografico).
   Cola as últimas palavras de cada mensagem com espaço inflexível, NA LEITURA: os arquivos
   em messages/ ficam limpos, e a copy do roteiro.md nunca é gravada transformada.

   A regra é a MESMA do blog (lib/tipografia-notas.ts), trocada em 24/09/2026 depois da
   revisão do site inteiro: a versão anterior colava só DUAS palavras, só em mensagens de 4
   palavras ou mais, e pulava qualquer mensagem com rich text. Medido: "with it." fechava
   parágrafos em 8% da largura, e títulos de três palavras terminavam com a palavra sozinha.
   Agora: três palavras quando cabem em 18 caracteres (o teto que não estoura 320px),
   parágrafo por parágrafo, a partir de 3 palavras.

   O que fica de fora, e por quê:
   - ICU com plural ou seleção (`{n, plural, ...}`): o espaço inflexível entre as palavras-
     chave quebraria o parser. Variável simples (`{nome}`) pode.
   - `meta` (título e descrição de SEO) e textos de `alt` e `aria`: não quebram linha na
     tela e viajam para fora do site. */

const FORA = /^(meta|alt|aria)/i;
const ICU_COMPOSTO = /\{[^{}]*,/;

function colar(texto: string): string {
  if (ICU_COMPOSTO.test(texto)) return texto;
  return colarUltimasPalavrasEm(texto);
}

function prepararMensagens(valor: unknown, chave = ''): unknown {
  if (FORA.test(chave)) return valor;
  if (typeof valor === 'string') return colar(valor);
  if (Array.isArray(valor)) return valor.map((v) => prepararMensagens(v));
  if (valor && typeof valor === 'object') {
    return Object.fromEntries(
      Object.entries(valor).map(([k, filho]) => [k, prepararMensagens(filho, k)])
    );
  }
  return valor;
}

export default getRequestConfig(async ({requestLocale}) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  const messages = (await import(`../messages/${locale}.json`)).default;

  return {
    locale,
    messages: prepararMensagens(messages) as AbstractIntlMessages
  };
});
