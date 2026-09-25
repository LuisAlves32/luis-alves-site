import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {ImageResponse} from 'next/og';
import sharp from 'sharp';
import {getTranslations} from 'next-intl/server';
import {routing, type Locale} from '@/i18n/routing';

/* A CAPA DE COMPARTILHAMENTO DA LANDING DO GUIA (1200x630), irmã da capa do site
   (`app/api/compartilhar/[locale]`), mas na PELE DO FUNIL: Tinta dominante, latão só em
   fio, kicker e na palavra em destaque, Author no display e Satoshi no resto (design.md,
   "Pele da landing"). É ela que aparece quando o link da landing vai para o anúncio, a
   bio ou o WhatsApp.

   A copy é a da hero da landing, verbatim das mensagens (`landing.s1`): kicker, headline
   com "real" em Author 700 latão (a mesma regra de `dividirDestaque`, em
   components/landing/pele.tsx, que não se importa daqui porque carrega o CSS da pele) e
   a linha de confiança. A imagem é a CAPA REAL do guia no idioma, em JPEG em
   `public/compartilhar/` porque o gerador não lê WebP.

   AS FONTES VÊM DA FONTSHARE NO BUILD, em TTF, e não moram no repositório: a licença
   delas (ITF Free Font License) proíbe redistribuir o arquivo. A imagem gerada leva só o
   desenho das letras, como qualquer imagem feita com a fonte. */

const COR = {
  tinta: '#0e2440',
  papel: '#f5f3ef',
  latao: '#b08d57'
};

const PALAVRA_DESTAQUE = 'real';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({locale}));
}

/** O TTF de uma família e peso da Fontshare (a folha deles lista woff2, woff e ttf). */
async function fonte(familia: string, peso: number): Promise<ArrayBuffer> {
  const css = await (
    await fetch(`https://api.fontshare.com/v2/css?f[]=${familia}@${peso}`, {cache: 'force-cache'})
  ).text();
  const arquivo = css.match(/url\('([^']+?\.ttf)'\) format\('truetype'\)/)?.[1];
  if (!arquivo) throw new Error(`fonte sem TTF: ${familia} ${peso}`);
  return (await fetch(arquivo.startsWith('//') ? `https:${arquivo}` : arquivo, {cache: 'force-cache'})).arrayBuffer();
}

export async function GET(_: Request, {params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  if (!routing.locales.includes(locale as Locale)) return new Response('Not found', {status: 404});
  const l = locale as Locale;

  const t = await getTranslations({locale: l, namespace: 'landing.s1'});
  const [author500, author700, satoshi500, satoshi700, capa] = await Promise.all([
    fonte('author', 500),
    fonte('author', 700),
    fonte('satoshi', 500),
    fonte('satoshi', 700),
    readFile(join(process.cwd(), `public/compartilhar/capa-guia-${l}.jpg`))
  ]);

  /* A HEADLINE PALAVRA POR PALAVRA, num bloco que quebra sozinho. O gerador não quebra
     linha entre trechos de estilos diferentes; como itens de um flex com quebra, cada
     palavra vai para a linha de baixo inteira. O NBSP da cola de órfãs (i18n/request.ts)
     não é espaço aqui, então "you sign" continua um item só e a última linha nunca
     fica com uma palavra solta. */
  const palavras = t('titulo').split(' ');

  /* A linha de confiança em duas linhas DECIDIDAS: quem assina numa, o atendimento
     bilíngue na outra. Deixada à quebra natural, ela partia no meio de "Stonehaus
     Realty" na coluna estreita. */
  const confianca = t('confianca').split(' · ');
  const quem = confianca.slice(0, -1).join(' · ');
  const atendimento = confianca.at(-1);

  /* O kicker também em duas linhas decididas: o que é o guia numa, o território na outra.
     Deixado à quebra natural, ele partia em "AND / THE FRASER VALLEY". */
  const kicker = t('kicker').split(' · ');
  const oQue = kicker.slice(0, 2).join(' · ');
  const onde = kicker.slice(2).join(' · ');

  const png = new ImageResponse(
    (
      <div
        style={{
          position: 'relative',
          display: 'flex',
          width: '100%',
          height: '100%',
          background: COR.tinta,
          color: COR.papel,
          fontFamily: 'Satoshi',
          fontWeight: 500
        }}
      >
        {/* a capa real do guia, à direita, apoiada numa sombra funda */}
        {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
        <img
          src={`data:image/jpeg;base64,${capa.toString('base64')}`}
          width={363}
          height={484}
          style={{
            position: 'absolute',
            right: 96,
            top: 73,
            borderRadius: 4,
            boxShadow: '0 30px 60px rgba(0, 0, 0, 0.45)'
          }}
        />

        <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingLeft: 72, width: 690}}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              fontSize: 15,
              fontWeight: 500,
              lineHeight: 1.6,
              letterSpacing: '0.18em',
              color: COR.latao
            }}
          >
            <span>{oQue}</span>
            <span>{onde}</span>
          </div>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              columnGap: 16,
              marginTop: 28,
              fontFamily: 'Author',
              fontWeight: 500,
              fontSize: 64,
              lineHeight: 1.08,
              letterSpacing: '-0.02em'
            }}
          >
            {palavras.map((p, i) =>
              p.toLowerCase() === PALAVRA_DESTAQUE ? (
                <span key={i} style={{fontWeight: 700, color: COR.latao}}>
                  {p}
                </span>
              ) : (
                <span key={i}>{p}</span>
              )
            )}
          </div>

          <div style={{display: 'flex', width: 96, height: 1, marginTop: 36, background: COR.latao, opacity: 0.6}} />

          <div style={{display: 'flex', flexDirection: 'column', marginTop: 24, fontSize: 19, lineHeight: 1.45, opacity: 0.85}}>
            <span style={{fontWeight: 700}}>{quem}</span>
            <span>{atendimento}</span>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        {name: 'Author', data: author500, weight: 500, style: 'normal'},
        {name: 'Author', data: author700, weight: 700, style: 'normal'},
        {name: 'Satoshi', data: satoshi500, weight: 500, style: 'normal'},
        {name: 'Satoshi', data: satoshi700, weight: 700, style: 'normal'}
      ]
    }
  );

  /* EM JPEG, e não no PNG que o gerador devolve: com a foto da capa e a sombra, o PNG dava
     450 KB, e o WhatsApp desiste da prévia por volta de 300 KB (MEDIDO em 25/09/2026). Roda
     no build, porque a rota é pré-renderizada. */
  const jpeg = await sharp(Buffer.from(await png.arrayBuffer()))
    .jpeg({quality: 86, mozjpeg: true})
    .toBuffer();
  return new Response(new Uint8Array(jpeg), {
    headers: {'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=86400'}
  });
}
