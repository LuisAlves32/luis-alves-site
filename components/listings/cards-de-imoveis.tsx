import {useTranslations} from 'next-intl';
import {ArrowUpRight} from 'lucide-react';

const IMOVEIS = [
  {
    id: 'madrona',
    imagem: '/homes/capas/2258-madrona-place',
    href: '/homes/2258-madrona-place',
    foco: '50% 50%'
  },
  {
    id: 'silverbrook',
    imagem: '/homes/capas/silverbrook',
    href: '/homes/silverbrook',
    foco: '50% 55%'
  },
  {
    id: 'band',
    imagem: '/homes/capas/band',
    href: '/homes/band',
    foco: '50% 48%'
  }
] as const;

export function CardsDeImoveis({compacto = false}: {compacto?: boolean}) {
  const t = useTranslations('paginaImoveis');

  return (
    <div className={`grid grid-cols-1 gap-6 ${compacto ? 'lg:grid-cols-3' : 'md:grid-cols-2 xl:grid-cols-3'}`}>
      {IMOVEIS.map((imovel) => (
        <article key={imovel.id} className="group overflow-hidden rounded-[var(--card-raio)] border border-lapis bg-papel">
          <a href={imovel.href} className="block" aria-label={`${t(`itens.${imovel.id}.titulo`)} — ${t('ver')}`}>
            <div className={`relative overflow-hidden bg-ceu ${compacto ? 'aspect-[4/3]' : 'aspect-[4/3]'}`}>
              {/* As capas são servidas pelo mesmo app de listings que já vive em /homes.
                  Usamos img porque os arquivos estão atrás do rewrite, fora do build deste app. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imovel.imagem}
                alt={t(`itens.${imovel.id}.alt`)}
                loading="lazy"
                decoding="async"
                className="absolute inset-0 size-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.035]"
                style={{objectPosition: imovel.foco}}
              />
              <span className="absolute left-4 top-4 rounded-full bg-papel/95 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-tinta backdrop-blur-sm">
                {t(`itens.${imovel.id}.tipo`)}
              </span>
              <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-tinta/45 to-transparent" />
              <span className="absolute bottom-4 right-4 flex size-11 items-center justify-center rounded-full bg-papel text-tinta transition-transform duration-200 group-hover:scale-105">
                <ArrowUpRight className="size-5" strokeWidth={1.6} />
              </span>
            </div>
            <div className="p-5 sm:p-6">
              <p className="text-sm font-semibold text-avanco">{t(`itens.${imovel.id}.preco`)}</p>
              <h3 className="mt-2 text-[clamp(1.35rem,2vw,1.7rem)] leading-tight tracking-[-0.025em] text-tinta">{t(`itens.${imovel.id}.titulo`)}</h3>
              <p className="mt-3 text-sm font-medium text-grafite">{t(`itens.${imovel.id}.dados`)}</p>
              {!compacto ? <p className="mt-4 text-[15px] leading-relaxed text-grafite">{t(`itens.${imovel.id}.texto`)}</p> : null}
              <span className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-tinta">
                {t('ver')} <ArrowUpRight className="size-4" strokeWidth={1.6} />
              </span>
            </div>
          </a>
        </article>
      ))}
    </div>
  );
}
