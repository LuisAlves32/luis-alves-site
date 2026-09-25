import type {Metadata} from 'next';
import {getPathname} from '@/i18n/navigation';
import type {AppPathname, Locale} from '@/i18n/routing';

export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

// hreflang por página com x-default apontando para o EN (exigência do roteiro.md).
// Toda página nova chama alternatesPara no seu generateMetadata.
export function alternatesPara(
  href: AppPathname,
  locale: Locale
): Metadata['alternates'] {
  const absoluta = (l: Locale) => siteUrl + getPathname({locale: l, href});
  return {
    canonical: absoluta(locale),
    languages: {
      en: absoluta('en'),
      pt: absoluta('pt'),
      'x-default': absoluta('en')
    }
  };
}
