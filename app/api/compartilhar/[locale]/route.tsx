import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {ImageResponse} from 'next/og';
import {getTranslations} from 'next-intl/server';
import {routing, type Locale} from '@/i18n/routing';

/* A CAPA DE COMPARTILHAMENTO DO SITE (1200x630), a do portão do Passe 4. É ela que
   aparece quando o Luís manda o link do site no WhatsApp, no Instagram ou por e-mail;
   até 25/09/2026 o site institucional não tinha nenhuma, e o link chegava sem imagem.

   Mesma casa da capa das notas (`app/api/capa/[slug]`): fora do roteamento de idioma,
   fontes reais da marca (Inter e Instrument Serif, OFL, TTF do Google Fonts) e cores
   dos primitivos do globals.css. A copy é a da HERO, verbatim das mensagens: a
   identificação e a headline em duas linhas, com a âncora em serifa itálica Avanço.
   A foto é o recorte real do Luís (o Luís só aparece em foto real), convertido para
   PNG em `public/compartilhar/` porque o gerador de imagem não lê WebP. Lida do disco,
   e não por URL, porque no build o domínio ainda pode apontar para outro projeto. */

const COR = {
  tinta: '#0e2440',
  avanco: '#2a6dd6',
  papel: '#f5f3ef',
  lapis: '#c8ccd1',
  grafite: '#3d4d63'
};

/* A COMPENSAÇÃO DO ITÁLICO, por idioma, MEDIDA na capa em 25/09/2026. O itálico da
   Instrument Serif avança além da própria caixa conforme a última letra: o "s" de
   "Decisões" invadia "mais" mesmo com o vão, e o "r" de "Smarter" já tem folga própria.
   Número por idioma porque a âncora é uma palavra fixa por idioma. Se a headline da hero
   mudar, meça de novo (baixe /api/compartilhar/en e /pt e olhe o vão). */
const COMPENSACAO_DO_ITALICO: Record<Locale, number> = {en: 0, pt: 22};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({locale}));
}

async function fonte(url: string): Promise<ArrayBuffer> {
  const css = await (await fetch(url, {cache: 'force-cache'})).text();
  const arquivo = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)?.[1];
  if (!arquivo) throw new Error(`fonte sem TTF: ${url}`);
  return (await fetch(arquivo, {cache: 'force-cache'})).arrayBuffer();
}

/** `<ancora>x</ancora>` da mensagem vira [antes, âncora, depois]. O NBSP da cola fica. */
function partes(texto: string): [string, string, string] {
  const m = texto.match(/^([^]*?)<ancora>([^]*?)<\/ancora>([^]*)$/);
  return m ? [m[1], m[2], m[3]] : [texto, '', ''];
}

export async function GET(_: Request, {params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  if (!routing.locales.includes(locale as Locale)) return new Response('Not found', {status: 404});

  const t = await getTranslations({locale: locale as Locale, namespace: 'hero'});
  const [inter500, inter700, serifa, foto] = await Promise.all([
    fonte('https://fonts.googleapis.com/css2?family=Inter:wght@500'),
    fonte('https://fonts.googleapis.com/css2?family=Inter:wght@700'),
    fonte('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@1'),
    readFile(join(process.cwd(), 'public/compartilhar/luis-recorte.png'))
  ]);

  const linha = (chave: 'tituloLinha1' | 'tituloLinha2') => {
    // O vão entre os trechos é `columnGap`, e não o espaço da frase: o gerador engole o
    // espaço comum na ponta de um trecho (MEDIDO no PT, "Decisõesmais"). Pontas aparadas.
    const [antes, ancora, depois] = partes(t.raw(chave) as string).map((p) =>
      p.replace(/^[\s ]+|[\s ]+$/g, '')
    );
    return (
      <div style={{display: 'flex', alignItems: 'baseline', columnGap: 16}}>
        {antes ? <span style={{whiteSpace: 'pre'}}>{antes}</span> : null}
        {ancora ? (
          <span
            style={{
              fontFamily: 'Instrument Serif',
              fontStyle: 'italic',
              fontWeight: 400,
              fontSize: 78,
              color: COR.avanco,
              paddingRight: COMPENSACAO_DO_ITALICO[locale as Locale]
            }}
          >
            {ancora}
          </span>
        ) : null}
        {depois ? <span style={{whiteSpace: 'pre'}}>{depois}</span> : null}
      </div>
    );
  };

  return new ImageResponse(
    (
      <div
        style={{
          position: 'relative',
          display: 'flex',
          width: '100%',
          height: '100%',
          background: COR.papel,
          fontFamily: 'Inter',
          fontWeight: 500,
          color: COR.tinta
        }}
      >
        {/* o recorte do Luís, apoiado no chão da imagem, à direita */}
        {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
        <img
          src={`data:image/png;base64,${foto.toString('base64')}`}
          width={515}
          height={600}
          style={{position: 'absolute', right: 0, bottom: 0}}
        />

        {/* MEDIDO na primeira versão: com a headline a 64px e a foto a 40px da borda, o
            ponto final de "Vancouver." sumia atrás do ombro, e a identificação quebrava
            deixando "Greater Vancouver" sozinho na linha de baixo. A coluna termina antes
            de onde a foto começa (x=685), e a identificação cabe numa linha só. */}
        <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingLeft: 72, width: 685}}>
          <div style={{display: 'flex', fontSize: 22, fontWeight: 700, letterSpacing: '0.18em', color: COR.tinta}}>
            {t('nome1')}
            <span style={{paddingLeft: 12, color: COR.avanco}}>/</span>
            <span style={{paddingLeft: 12}}>{t('nome2')}</span>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              marginTop: 36,
              fontSize: 56,
              fontWeight: 700,
              lineHeight: 1.08,
              letterSpacing: '-0.025em'
            }}
          >
            {linha('tituloLinha1')}
            {linha('tituloLinha2')}
          </div>

          {/* a barra da assinatura: traço Tinta com o corte do L/ em Avanço */}
          <div style={{position: 'relative', display: 'flex', width: 120, height: 2, marginTop: 40, background: COR.tinta}}>
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: -12,
                width: 5,
                height: 26,
                borderRadius: 2,
                background: COR.avanco,
                transform: 'skewX(-24deg)'
              }}
            />
          </div>

          <div style={{display: 'flex', marginTop: 28, fontSize: 20, color: COR.grafite, whiteSpace: 'nowrap'}}>
            {t('identificacao')}
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        {name: 'Inter', data: inter500, weight: 500, style: 'normal'},
        {name: 'Inter', data: inter700, weight: 700, style: 'normal'},
        {name: 'Instrument Serif', data: serifa, weight: 400, style: 'italic'}
      ]
    }
  );
}
