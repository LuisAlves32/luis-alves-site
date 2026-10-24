import type {Metadata} from 'next';
import {setRequestLocale} from 'next-intl/server';
import {getTranslations} from 'next-intl/server';
import type {Locale} from '@/i18n/routing';
import {alternatesPara} from '@/lib/seo';
import {CardsDeImoveis} from '@/components/listings/cards-de-imoveis';
import {Link} from '@/i18n/navigation';

export async function generateMetadata({params}: {params: Promise<{locale: string}>}): Promise<Metadata> {
  const {locale} = await params;
  const l = locale as Locale;
  const t = await getTranslations({locale: l, namespace: 'paginaImoveis.meta'});
  return {title: t('titulo'), description: t('descricao'), alternates: alternatesPara('/listings', l)};
}

export default async function PaginaDeImoveis({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  setRequestLocale(locale);
  const t = await getTranslations('paginaImoveis');
  return (
    <main>
      <section className="bg-papel pb-14 pt-20 sm:pb-18 sm:pt-28">
        <div className="conteudo grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-avanco">{t('kicker')}</p>
            <h1 className="mt-4 max-w-[12ch] text-[clamp(3.2rem,7.5vw,7.5rem)] leading-[0.9] tracking-[-0.055em]">{t('titulo')}</h1>
            <p className="mt-5 text-[clamp(1.15rem,2vw,1.55rem)] text-grafite">{t('subtitulo')}</p>
          </div>
          <p className="max-w-[48ch] text-[17px] leading-relaxed lg:col-span-5 lg:pb-2">{t('intro')}</p>
        </div>
      </section>
      <section className="bg-ceu py-secao">
        <div className="conteudo"><CardsDeImoveis /></div>
      </section>
      <section className="bg-tinta py-secao text-papel">
        <div className="conteudo flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div><h2 className="max-w-[18ch] text-papel">{t('fechamentoTitulo')}</h2><p className="mt-4 max-w-[48ch] text-papel/75">{t('fechamentoTexto')}</p></div>
          <Link href="/contact" className="inline-flex min-h-[52px] shrink-0 items-center justify-center rounded-[8px] bg-avanco px-7 text-[15px] font-semibold text-white hover:bg-avanco-escuro">{t('contato')}</Link>
        </div>
      </section>
    </main>
  );
}
