import type {Metadata} from 'next';
import {getTranslations, setRequestLocale} from 'next-intl/server';
import {Link} from '@/i18n/navigation';
import type {Locale} from '@/i18n/routing';
import {alternatesPara} from '@/lib/seo';
import {notasPublicadas} from '@/lib/notas';
import {serieDaNota} from '@/lib/notas-formato';
import {CapaCota} from '@/components/notas/capa-cota';
import {InscricaoNotas} from '@/components/notas/inscricao-notas';
import {Kicker} from '@/components/ui/assinatura';

/* A PÁGINA CURTA DE INSCRIÇÃO (design-blog.md, 5.11), a que vai na bio do Instagram.
   Uma tela no celular: o nome, a promessa, o formulário, e a capa pequena da nota
   mais recente como prova do que chega. Indexável: ela pode ser achada. */

export async function generateMetadata({params}: {params: Promise<{locale: string}>}): Promise<Metadata> {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: 'notas.meta'});
  return {
    title: t('inscricaoTitulo'),
    description: t('inscricaoDescricao'),
    alternates: alternatesPara('/notes/subscribe', locale as Locale)
  };
}

export default async function PaginaInscricao({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  setRequestLocale(locale);
  const t = await getTranslations({locale, namespace: 'notas'});
  const recente = (await notasPublicadas()).find((n) => n.idioma === locale) ?? (await notasPublicadas())[0];
  const categorias: Record<string, string> = {
    buying: t('filtros.buying'),
    selling: t('filtros.selling'),
    presale: t('filtros.presale'),
    market: t('filtros.market'),
    notes: t('filtros.notes')
  };

  return (
    <main className="pb-secao">
      <section data-bloco="notas-inscrever" className="conteudo grid gap-10 pt-8 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:pt-12">
        <div data-camada="frente">
          <Kicker>{t('paginaInscricao.kicker')}</Kicker>
          <h1 className="mt-4 text-[clamp(2.1rem,4.6vw,3.4rem)] leading-[1.08]">
            {t('nomeAntes')} <em className="ancora">{t('nomeAncora')}</em>
          </h1>
          <p className="mt-5 max-w-[46ch] text-lg text-grafite">{t('paginaInscricao.texto')}</p>
          <div className="mt-8">
            <InscricaoNotas variante="pagina" />
          </div>
        </div>

        {recente ? (
          <div data-camada="meio">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-grafite">{t('paginaInscricao.ultima')}</p>
            <Link href={{pathname: '/notes/[slug]', params: {slug: recente.slug}}} locale={recente.idioma} className="block">
              <CapaCota
                tamanho="previa"
                categoria={recente.categoria}
                numero={recente.numero}
                rotulo={recente.rotuloDoNumero}
                titulo={recente.tela.titulo}
                minutosTexto={t('minutos', {n: recente.minutos})}
                rotuloLeitura={t('capaLeitura')}
                kicker={
                  <>
                    {serieDaNota(recente.serie)}
                    <i>/</i>
                    {categorias[recente.categoria]}
                  </>
                }
                descricao={recente.titulo}
              />
              <span className="mt-3 block text-lg font-semibold text-tinta">{recente.tela.titulo}</span>
            </Link>
          </div>
        ) : null}
      </section>
    </main>
  );
}
