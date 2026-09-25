import {defineRouting} from 'next-intl/routing';

// Pathnames localizados: fonte de verdade no roteiro.md (Arquitetura de páginas).
export const routing = defineRouting({
  locales: ['en', 'pt'],
  defaultLocale: 'en',
  localePrefix: 'as-needed',
  pathnames: {
    '/': '/',
    '/buying': {en: '/buying', pt: '/comprar'},
    '/selling': {en: '/selling', pt: '/vender'},
    '/presales': {en: '/presales', pt: '/pre-construcao'},
    '/about': {en: '/about', pt: '/sobre'},
    '/contact': {en: '/contact', pt: '/contato'},
    '/real-cost-guide': {en: '/real-cost-guide', pt: '/guia-custo-real'},
    '/real-cost-guide/thank-you': {
      en: '/real-cost-guide/thank-you',
      pt: '/guia-custo-real/obrigado'
    },
    '/privacy-policy': {en: '/privacy-policy', pt: '/politica-de-privacidade'},
    // A baixa das atualizações de mercado, exigência da CASL. Chega só pelo
    // rodapé do e-mail do guia, é noindex e fica fora do sitemap.
    '/unsubscribe': {en: '/unsubscribe', pt: '/cancelar-inscricao'},
    // O BLOG, "Second Opinion" (blog/design-blog.md). Cada nota mora num endereço só, o do idioma
    // em que foi escrita, e o slug no idioma dela.
    '/notes': {en: '/notes', pt: '/notas'},
    '/notes/subscribe': {en: '/notes/subscribe', pt: '/notas/inscrever'},
    '/notes/[slug]': {en: '/notes/[slug]', pt: '/notas/[slug]'}
  }
});

export type Locale = (typeof routing.locales)[number];
/** As rotas COM parâmetro, que se linkam com `{pathname, params}` e nunca como texto. */
export type RotaComParametro = '/notes/[slug]';
/** As rotas FIXAS do site: é o tipo que links, menus e o `alternatesPara` usam. */
export type AppPathname = Exclude<keyof typeof routing.pathnames, RotaComParametro>;
