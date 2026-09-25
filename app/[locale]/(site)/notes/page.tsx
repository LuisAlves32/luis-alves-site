import type {Metadata} from 'next';
import {getTranslations, setRequestLocale} from 'next-intl/server';
import {Link} from '@/i18n/navigation';
import type {Locale} from '@/i18n/routing';
import {alternatesPara, siteUrl} from '@/lib/seo';
import {jsonLd, schemaDoBlog} from '@/lib/notas-schema';
import {notasPublicadas, type Nota} from '@/lib/notas';
import {mesDaNota, serieDaNota} from '@/lib/notas-formato';
import {CapaCota} from '@/components/notas/capa-cota';
import {IndiceNotas} from '@/components/notas/indice-notas';
import {InscricaoNotas} from '@/components/notas/inscricao-notas';
import {Seta} from '@/components/ui/botoes';

/* A LISTAGEM DO SECOND OPINION (blog/design-blog.md, seção 8).
   PASSE 1, esqueleto mudo: copy real, tokens reais, capas desenhadas pelo código,
   nenhum movimento. Ordem da página: a capa grande da nota mais recente (pico 1),
   o nome do blog, a faixa de inscrição, os filtros e o índice do dossiê. */

export async function generateMetadata({params}: {params: Promise<{locale: string}>}): Promise<Metadata> {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: 'notas.meta'});
  return {
    title: t('titulo'),
    description: t('descricao'),
    alternates: {
      ...alternatesPara('/notes', locale as Locale),
      // O feed do idioma da página, para leitores de RSS e para a newsletter.
      types: {'application/rss+xml': `${siteUrl}${locale === 'pt' ? '/notes/feed-pt.xml' : '/notes/feed.xml'}`}
    }
  };
}

/** As notas do idioma da página primeiro, cada grupo do mais novo para o mais antigo. */
function ordenarPorIdioma(notas: Nota[], locale: string): Nota[] {
  return [...notas.filter((n) => n.idioma === locale), ...notas.filter((n) => n.idioma !== locale)];
}

export default async function PaginaNotas({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  setRequestLocale(locale);
  const t = await getTranslations({locale, namespace: 'notas'});

  // Uma nota e a tradução dela são UMA nota no índice: fica a do idioma da página.
  const todas = await notasPublicadas();
  const semPares = todas.filter((n) => {
    if (!n.traducaoDe && !todas.some((o) => o.traducaoDe === n.slug)) return true;
    const original = n.traducaoDe ?? n.slug;
    const doPar = todas.filter((o) => o.slug === original || o.traducaoDe === original);
    const preferida = doPar.find((o) => o.idioma === locale) ?? doPar[0];
    return preferida.slug === n.slug;
  });
  const notas = ordenarPorIdioma(semPares, locale);
  const recente = notas[0];

  const categorias = {
    buying: t('filtros.buying'),
    selling: t('filtros.selling'),
    presale: t('filtros.presale'),
    market: t('filtros.market'),
    notes: t('filtros.notes')
  };
  const minutos = (n: number) => t('minutos', {n});

  return (
    <main className="pb-secao">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLd(
          schemaDoBlog(locale as Locale, `${t('nomeAntes')} ${t('nomeAncora')}`, t('meta.descricao'), notas)
        )}
      />
      <section data-bloco="notas-topo" className="conteudo pt-8 lg:pt-10">
        {recente ? (
          <Link
            href={{pathname: '/notes/[slug]', params: {slug: recente.slug}}}
            locale={recente.idioma}
            className="block rounded-[12px] focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_var(--cor-avanco)]"
          >
            <CapaCota
              tamanho="grande"
              categoria={recente.categoria}
              numero={recente.numero}
              rotulo={recente.rotuloDoNumero}
              titulo={recente.tela.titulo}
              minutosTexto={minutos(recente.minutos)}
              rotuloLeitura={t('capaLeitura')}
              kicker={
                <>
                  {serieDaNota(recente.serie)}
                  <i>/</i>
                  {categorias[recente.categoria]}
                </>
              }
              rodapeEsquerda={`${t('recente')} · ${recente.titulo}`}
              rodapeDireita={mesDaNota(recente.medidoEm || recente.publicado, locale)}
              descricao={`${recente.titulo}. ${recente.numero ? `${recente.numero}, ${recente.rotuloDoNumero}.` : ''}`}
            />
          </Link>
        ) : null}

        <div data-camada="frente" className="mt-12 grid gap-6 lg:mt-16 lg:grid-cols-[1fr_1fr] lg:items-end">
          <h1 className="text-[clamp(2.1rem,4.6vw,3.4rem)] leading-[1.08]">
            {t('nomeAntes')} <em className="ancora">{t('nomeAncora')}</em>
          </h1>
          <div>
            <p className="max-w-[46ch] text-lg text-grafite">{t('apoio')}</p>
            {recente ? (
              <Link
                href={{pathname: '/notes/[slug]', params: {slug: recente.slug}}}
                locale={recente.idioma}
                className="group/acao mt-4 inline-flex min-h-11 items-center gap-1.5 text-[15px] font-semibold text-avanco hover:text-avanco-escuro"
              >
                {t('lerNota')}: {recente.tela.titulo}
                <Seta />
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      <div className="conteudo mt-12 lg:mt-16">
        <InscricaoNotas variante="faixa" />
      </div>

      <section data-bloco="notas-indice" className="conteudo mt-16 lg:mt-20">
        {notas.length ? (
          <IndiceNotas
            notas={notas}
            locale={locale}
            categorias={categorias}
            minutos={minutos}
            rotuloLeitura={t('capaLeitura')}
            rotuloFiltros={t('filtros.rotulo')}
            rotuloTodas={t('filtros.todas')}
            tituloIndice={t('indiceTitulo')}
            textoVazio={t('vazio')}
          />
        ) : (
          <p className="text-lg text-grafite">{t('vazio')}</p>
        )}
      </section>
    </main>
  );
}
