import {useTranslations} from 'next-intl';
import {Link} from '@/i18n/navigation';
import {CardsDeImoveis} from '@/components/listings/cards-de-imoveis';

export function ImoveisAtivosHome() {
  const t = useTranslations('imoveisHome');
  return (
    <section data-bloco="imoveis-ativos" className="bg-ceu py-secao">
      <div className="conteudo">
        <div className="mb-9 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-[46rem]">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-avanco">{t('kicker')}</p>
            <h2 className="mt-3">{t('titulo')}</h2>
            <p className="mt-4 max-w-[48ch]">{t('texto')}</p>
          </div>
          <Link href="/listings" className="inline-flex min-h-12 items-center justify-center rounded-[8px] bg-avanco px-6 text-sm font-semibold text-white transition-colors hover:bg-avanco-escuro">
            {t('cta')}
          </Link>
        </div>
        <CardsDeImoveis compacto />
      </div>
    </section>
  );
}
