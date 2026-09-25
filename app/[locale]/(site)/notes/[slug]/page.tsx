import type {Metadata} from 'next';
import Image from 'next/image';
import {notFound, permanentRedirect} from 'next/navigation';
import {getTranslations, setRequestLocale} from 'next-intl/server';
import {getPathname, Link} from '@/i18n/navigation';
import {siteUrl} from '@/lib/seo';
import {WHATSAPP_NUMERO} from '@/lib/links';
import {lerCorpo, notaPorSlug, notasPublicadas, todasAsNotas, traducaoDe, type Nota} from '@/lib/notas';
import {dataDaNota, mesDaNota, serieDaNota} from '@/lib/notas-formato';
import {CapaCota} from '@/components/notas/capa-cota';
import {CorpoNota} from '@/components/notas/corpo-nota';
import {InscricaoNotas} from '@/components/notas/inscricao-notas';
import {Seta} from '@/components/ui/botoes';
import {LeituraDaNota} from '@/components/ui/progresso-da-leitura';
import {capaDaNota, jsonLd, schemaDaNota} from '@/lib/notas-schema';
import {colarUltimasPalavrasEm} from '@/lib/tipografia-notas';

/* A NOTA DO SECOND OPINION (blog/design-blog.md, seções 5 e 8).
   Cada nota mora num endereço só: o do idioma em que foi escrita. Aberta no outro
   idioma, redireciona (308). Rascunho ("Pronto para publicar" desmarcado) abre só
   pelo endereço, com noindex e um aviso, para o Luís revisar no próprio site.
   PASSE 1: esqueleto mudo, sem movimento. */

type Params = Promise<{locale: string; slug: string}>;

// Rascunho INCLUSIVE (ver `todasAsNotas`): montado na hora do pedido, ele dava 404 no ar. Ele
// continua com noindex e fora do índice, do sitemap e do feed.
export async function generateStaticParams() {
  return (await todasAsNotas()).map((n) => ({locale: n.idioma, slug: n.slug}));
}

function enderecoAbsoluto(n: Nota): string {
  return siteUrl + getPathname({locale: n.idioma, href: {pathname: '/notes/[slug]', params: {slug: n.slug}}});
}

export async function generateMetadata({params}: {params: Params}): Promise<Metadata> {
  const {slug} = await params;
  const nota = await notaPorSlug(slug);
  if (!nota) return {};
  const t = await getTranslations({locale: nota.idioma, namespace: 'notas'});
  const par = await traducaoDe(nota);
  const nome = `${t('nomeAntes')} ${t('nomeAncora')}`;
  const descricao = nota.descricaoGoogle || nota.resumo;
  // A capa de compartilhamento (app/api/capa): a mesma cota da página, em 1200x630.
  const capa = {url: capaDaNota(nota.slug), width: 1200, height: 630, alt: nota.numero ? `${nota.numero}, ${nota.rotuloDoNumero}` : nota.titulo};
  return {
    title: nota.tituloGoogle ? `${nota.tituloGoogle} | ${nome}` : `${nota.titulo} | ${nome}`,
    description: descricao,
    openGraph: {
      type: 'article',
      title: nota.titulo,
      description: descricao,
      url: enderecoAbsoluto(nota),
      siteName: nome,
      locale: nota.idioma === 'pt' ? 'pt_BR' : 'en_CA',
      publishedTime: nota.publicado,
      modifiedTime: nota.atualizado || nota.publicado,
      authors: ['Luis Alves'],
      images: [capa]
    },
    twitter: {card: 'summary_large_image', title: nota.titulo, description: descricao, images: [capa.url]},
    alternates: {
      canonical: enderecoAbsoluto(nota),
      languages: par
        ? {[nota.idioma]: enderecoAbsoluto(nota), [par.idioma]: enderecoAbsoluto(par), 'x-default': enderecoAbsoluto(nota.idioma === 'en' ? nota : par)}
        : undefined
    },
    robots: nota.pronta ? undefined : {index: false, follow: false}
  };
}

export default async function PaginaNota({params}: {params: Params}) {
  const {locale, slug} = await params;
  const nota = await notaPorSlug(slug);
  if (!nota) notFound();
  if (nota.idioma !== locale) {
    permanentRedirect(getPathname({locale: nota.idioma, href: {pathname: '/notes/[slug]', params: {slug}}}));
  }
  setRequestLocale(locale);
  const corpo = await lerCorpo(slug);
  if (!corpo) notFound();

  const t = await getTranslations({locale, namespace: 'notas'});
  const par = await traducaoDe(nota);
  const publicadas = await notasPublicadas();
  const doIdioma = publicadas.filter((n) => n.idioma === locale);
  const posicao = doIdioma.findIndex((n) => n.slug === nota.slug);
  // A próxima é a mais ANTIGA seguinte no índice; da mais antiga, volta à mais nova.
  const proxima = doIdioma.length > 1 ? doIdioma[(posicao + 1) % doIdioma.length] : null;

  const categorias: Record<string, string> = {
    buying: t('filtros.buying'),
    selling: t('filtros.selling'),
    presale: t('filtros.presale'),
    market: t('filtros.market'),
    notes: t('filtros.notes')
  };
  const minutos = (n: number) => t('minutos', {n});
  const whatsapp = `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(t('pergunteMensagem', {titulo: nota.titulo}))}`;

  return (
    <main className="pb-secao">
      {nota.pronta ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(schemaDaNota(nota, `${t('nomeAntes')} ${t('nomeAncora')}`))} />
      ) : null}
      {!nota.pronta ? (
        <p className="bg-areia px-4 py-3 text-center text-sm font-medium text-tinta">{t('rascunho')}</p>
      ) : null}

      <article className="nota-grade pt-8 lg:pt-10" data-bloco="nota">
        <CapaCota
          className="nota-larga"
          categoria={nota.categoria}
          numero={nota.numero}
          rotulo={nota.rotuloDoNumero}
          titulo={nota.tela.titulo}
          minutosTexto={minutos(nota.minutos)}
          rotuloLeitura={t('capaLeitura')}
          kicker={
            <>
              {nota.serie ? serieDaNota(nota.serie) : t('serie')}
              <i>/</i>
              {categorias[nota.categoria]}
            </>
          }
          rodapeEsquerda={nota.fonte}
          rodapeDireita={nota.medidoEm ? `${t('ficha.medido')} ${mesDaNota(nota.medidoEm, locale)}` : undefined}
          descricao={nota.numero ? `${nota.numero}, ${nota.rotuloDoNumero}.` : nota.titulo}
        />

        <header data-camada="frente" className="mt-10 lg:mt-12">
          <h1 className="text-[clamp(2.1rem,4.6vw,3.4rem)] leading-[1.08] text-balance">{nota.tela.titulo}</h1>
          <p className="mt-5 text-lg text-grafite">{nota.tela.resumo}</p>
          {par ? (
            <p className="mt-3 text-[15px]">
              <Link
                href={{pathname: '/notes/[slug]', params: {slug: par.slug}}}
                locale={par.idioma}
                hrefLang={par.idioma}
                className="inline-flex min-h-11 items-center font-medium text-grafite underline decoration-lapis underline-offset-4 hover:text-tinta hover:decoration-avanco"
              >
                {t('outroIdioma')}
              </Link>
            </p>
          ) : null}
        </header>

        <dl className="ficha-medicao mt-8" data-camada="frente">
          <div>
            <dt>{t('serie')}</dt>
            <dd>{nota.serie ? String(nota.serie).padStart(3, '0') : '·'}</dd>
          </div>
          <div>
            <dt>{nota.medidoEm ? t('ficha.medido') : t('ficha.atualizado')}</dt>
            <dd>{colarUltimasPalavrasEm(dataDaNota(nota.medidoEm || nota.atualizado, locale))}</dd>
          </div>
          {nota.fonte ? (
            <div>
              <dt>{t('ficha.fonte')}</dt>
              <dd>
                {nota.linkDaFonte ? (
                  <a href={nota.linkDaFonte} target="_blank" rel="noopener noreferrer" className="underline decoration-avanco underline-offset-[3px]">
                    {colarUltimasPalavrasEm(nota.fonte)}
                  </a>
                ) : (
                  colarUltimasPalavrasEm(nota.fonte)
                )}
              </dd>
            </div>
          ) : null}
          <div>
            <dt>{nota.validade ? t('ficha.validade') : t('leitura', {n: nota.minutos})}</dt>
            <dd>{colarUltimasPalavrasEm(nota.validade || minutos(nota.minutos))}</dd>
          </div>
        </dl>

        <p className="mt-4 mb-10 text-[15px] font-medium text-tinta">
          {t('pergunte')}{' '}
          <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="font-semibold text-avanco underline decoration-lapis underline-offset-4 hover:text-avanco-escuro hover:decoration-avanco">
            {t('pergunteLink')}
          </a>
        </p>

        {corpo.subtitulos.length >= 3 ? (
          <nav aria-label={t('nesteTexto')} className="mb-10 border-y border-lapis py-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-grafite">{t('nesteTexto')}</p>
            <ol className="grid gap-2 text-[15px]">
              {corpo.subtitulos.map((s, i) => (
                <li key={s.id} className="flex items-baseline gap-3">
                  {/* items-baseline: o link cresceu para 44px de toque e centraliza o texto; sem a
                      linha de base, o número ficava 14px acima do título que ele numera. */}
                  <span className="w-6 shrink-0 font-semibold tabular-nums text-grafite">{String(i + 1).padStart(2, '0')}</span>
                  <a
                    href={`#${s.id}`}
                    className="inline-flex min-h-11 items-center font-medium text-tinta underline decoration-lapis underline-offset-4 hover:decoration-avanco"
                  >
                    {s.texto}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        ) : null}

        {/* A régua da leitura (5.5): Reading Progress 23553, posse do Framer. O corpo
            continua renderizado no servidor e entra como filho. */}
        <LeituraDaNota palavras={nota.palavras} rotulo={t('nesteTexto')} falta={t.raw('falta') as string} lido={t('lido')}>
          <CorpoNota arvore={corpo.arvore} rotuloNota={t('notaDoLuis')} />
        </LeituraDaNota>

        <footer data-camada="frente" className="mt-12">
          {/* O fecho (5.10): o L/ que assina. No Passe 3 ele se desenha uma vez. */}
          <div className="flex items-center gap-4" aria-hidden="true">
            <span className="h-px flex-1 bg-lapis" />
            <svg width="36" height="32" viewBox="96 110 314 280" data-fim-da-nota>
              <polygon points="96.667,110 163.333,110 163.333,323.333 263.333,323.333 263.333,390 96.667,390" fill="var(--cor-tinta)" />
              <polygon points="240,390 313.333,390 410,110 336.667,110" fill="var(--cor-avanco)" />
            </svg>
            <span className="h-px flex-1 bg-lapis" />
          </div>

          <div className="mt-6 mb-10 flex items-center gap-4">
            <Image src="/fotos/luis-retrato-400.webp" alt="Luis Alves" width={56} height={56} className="size-14 rounded-full object-cover" />
            <p className="text-sm leading-snug text-grafite">
              <span className="block text-base font-semibold text-tinta">{t('assinaturaNome')}</span>
              {t('assinaturaCorretora')}
            </p>
          </div>

          <InscricaoNotas variante="bloco" />

          <p className="mt-6 text-[15px] font-medium text-tinta">
            {t('pergunte')}{' '}
            <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="font-semibold text-avanco underline decoration-lapis underline-offset-4 hover:text-avanco-escuro hover:decoration-avanco">
              {t('pergunteLink')}
            </a>
          </p>

          {proxima && proxima.slug !== nota.slug ? (
            <Link
              href={{pathname: '/notes/[slug]', params: {slug: proxima.slug}}}
              locale={proxima.idioma}
              className="group/acao mt-10 grid grid-cols-[1fr_auto] items-baseline gap-4 border-y border-lapis py-5"
            >
              <span>
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-grafite">
                  {serieDaNota(proxima.serie)} · {t('proxima')}
                </span>
                <span className="text-lg font-semibold text-tinta group-hover/acao:underline group-hover/acao:decoration-avanco group-hover/acao:decoration-[3px] group-hover/acao:underline-offset-[6px]">
                  {proxima.tela.titulo}
                </span>
              </span>
              <span className="flex items-center gap-2 text-[1.35rem] font-bold tabular-nums text-tinta">
                {proxima.numero || minutos(proxima.minutos)}
                <Seta />
              </span>
            </Link>
          ) : null}
        </footer>
      </article>
    </main>
  );
}
