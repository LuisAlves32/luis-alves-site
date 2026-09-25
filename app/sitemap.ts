import type {MetadataRoute} from 'next';
import {getPathname} from '@/i18n/navigation';
import {routing, type AppPathname, type Locale, type RotaComParametro} from '@/i18n/routing';
import {siteUrl} from '@/lib/seo';
import {notasPublicadas, type Nota} from '@/lib/notas';

// Fora do sitemap: a página de obrigado do funil, que é noindex e
// pós-conversão, e a de descadastro, que só existe para quem tem a ficha no
// rodapé do e-mail e não significa nada sem ela. A Política de Privacidade
// ENTROU em 04/09, quando o texto real substituiu o esqueleto: ela é indexável
// e o rodapé do site inteiro aponta para ela.
const FORA_DO_SITEMAP: AppPathname[] = [
  '/real-cost-guide/thank-you',
  '/unsubscribe'
];

// As rotas com parâmetro (as notas) entram uma a uma, logo abaixo, no endereço
// do idioma em que foram escritas.
const COM_PARAMETRO: RotaComParametro[] = ['/notes/[slug]'];

// Uma entrada por página e idioma, derivada da MESMA fonte de pathnames do
// next-intl (i18n/routing.ts). Nunca manter uma segunda lista de rotas.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const paginas = (Object.keys(routing.pathnames) as (AppPathname | RotaComParametro)[]).filter(
    (href): href is AppPathname =>
      !COM_PARAMETRO.includes(href as RotaComParametro) && !FORA_DO_SITEMAP.includes(href as AppPathname)
  );

  const absoluta = (locale: Locale, href: AppPathname) =>
    siteUrl + getPathname({locale, href});

  const fixas = paginas.flatMap((href) =>
    routing.locales.map((locale) => ({
      url: absoluta(locale, href),
      alternates: {
        languages: Object.fromEntries(
          routing.locales.map((l) => [l, absoluta(l, href)])
        )
      }
    }))
  );

  // O BLOG: só as notas "Pronto para publicar". Cada uma no endereço do idioma
  // dela; com tradução publicada, as duas se apontam como alternativas.
  const notas = await notasPublicadas();
  const enderecoDa = (n: Nota) =>
    siteUrl + getPathname({locale: n.idioma, href: {pathname: '/notes/[slug]', params: {slug: n.slug}}});
  const doBlog = notas.map((n) => {
    const par = notas.find(
      (o) => o.slug !== n.slug && (o.traducaoDe === n.slug || o.slug === n.traducaoDe)
    );
    return {
      url: enderecoDa(n),
      lastModified: n.atualizado || undefined,
      alternates: par
        ? {languages: {[n.idioma]: enderecoDa(n), [par.idioma]: enderecoDa(par)}}
        : undefined
    };
  });

  return [...fixas, ...doBlog];
}
