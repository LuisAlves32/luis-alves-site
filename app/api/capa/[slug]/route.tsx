import {ImageResponse} from 'next/og';
import {getTranslations} from 'next-intl/server';
import {notaPorSlug, notasPublicadas, type Categoria} from '@/lib/notas';
import {serieDaNota} from '@/lib/notas-formato';

/* A CAPA DE COMPARTILHAMENTO de cada nota do Second Opinion (1200x630): a MESMA cota da
   capa do site (components/notas/capa-cota.tsx), redesenhada para o Open Graph. É ela
   que aparece no WhatsApp, no LinkedIn e no e-mail da newsletter. O Luís nunca desenha
   capa: o número que ele escreve no painel vira a imagem.

   Mora em /api (fora do roteamento de idioma, `proxy.ts`), porque o endereço localizado
   da nota em PT (/pt/notas/...) não tem como carregar o sufixo da convenção
   `opengraph-image`. As fontes vêm do Google Fonts em TTF (Inter e Instrument Serif,
   licença OFL), baixadas uma vez por build. */

const COR = {
  tinta: '#0e2440',
  avanco: '#2a6dd6',
  papel: '#f5f3ef',
  lapis: '#c8ccd1',
  grafite: '#3d4d63'
};

type Forma = 'horizontal' | 'vertical' | 'inclinada' | 'nivel' | 'leitura';
const FORMA: Record<Categoria, Forma> = {
  buying: 'horizontal',
  selling: 'vertical',
  presale: 'inclinada',
  market: 'nivel',
  notes: 'leitura'
};

export async function generateStaticParams() {
  return (await notasPublicadas()).map((n) => ({slug: n.slug}));
}

async function fonte(url: string): Promise<ArrayBuffer> {
  const css = await (await fetch(url, {cache: 'force-cache'})).text();
  const arquivo = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)?.[1];
  if (!arquivo) throw new Error(`fonte sem TTF: ${url}`);
  return (await fetch(arquivo, {cache: 'force-cache'})).arrayBuffer();
}

export async function GET(_: Request, {params}: {params: Promise<{slug: string}>}) {
  const {slug} = await params;
  const nota = await notaPorSlug(slug);
  if (!nota) return new Response('Not found', {status: 404});

  const t = await getTranslations({locale: nota.idioma, namespace: 'notas'});
  const [inter500, inter700, serifa] = await Promise.all([
    fonte('https://fonts.googleapis.com/css2?family=Inter:wght@500'),
    fonte('https://fonts.googleapis.com/css2?family=Inter:wght@700'),
    fonte('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@1')
  ]);

  const forma: Forma = nota.numero ? FORMA[nota.categoria] : 'leitura';
  const valor = nota.numero || t('minutos', {n: nota.minutos});
  const legenda = nota.numero ? nota.rotuloDoNumero : t('capaLeitura');
  // A inclinada gira depois do layout (o Satori não reserva o espaço girado): número menor e
  // rótulo mais longe, medidos para a ponta da cota não tocar o rótulo nem o kicker.
  const tamanho = forma === 'leitura' ? 120 : forma === 'inclinada' ? 120 : valor.length > 8 ? 150 : 176;
  // Quanto o bloco girado passa da própria caixa, embaixo: largura estimada pelos dígitos
  // (0,62 em do Inter Bold) mais os 96px da cota, altura do número mais a linha.
  const larguraInclinada = valor.length * 0.62 * tamanho + 96;
  const alturaInclinada = tamanho + 44;
  const folgaInclinada = Math.round(
    (larguraInclinada * Math.sin((24 * Math.PI) / 180) + alturaInclinada * Math.cos((24 * Math.PI) / 180) - alturaInclinada) / 2 + 28
  );

  const numero = (
    <div style={{fontSize: tamanho, fontWeight: 700, lineHeight: 1, letterSpacing: '-0.03em', color: COR.tinta}}>{valor}</div>
  );
  const rotulo = legenda ? (
    <div
      style={{
        marginTop: 22,
        maxWidth: 760,
        fontSize: 22,
        fontWeight: 700,
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
        color: COR.grafite,
        textAlign: forma === 'vertical' || forma === 'nivel' ? 'left' : 'center'
      }}
    >
      {legenda}
    </div>
  ) : null;

  /* A linha que mede o número, 48px além dele de cada lado, com as chamadas em Lápis e os
     traços no ângulo da barra do L/ em Avanço. */
  const linhaHorizontal = (
    <div style={{position: 'relative', display: 'flex', height: 0, marginTop: 24, marginLeft: -48, marginRight: -48}}>
      {[12, null].map((esq, i) => (
        <div
          key={`c${i}`}
          style={{
            position: 'absolute',
            ...(esq === null ? {right: 12} : {left: 12}),
            bottom: -14,
            width: 2,
            height: tamanho + 34,
            background: COR.lapis
          }}
        />
      ))}
      <div style={{position: 'absolute', left: 0, right: 0, top: -1, height: 2, background: COR.tinta}} />
      {[11, null].map((esq, i) => (
        <div
          key={`t${i}`}
          style={{
            position: 'absolute',
            ...(esq === null ? {right: 11} : {left: 11}),
            top: -17,
            width: 5,
            height: 34,
            borderRadius: 2,
            background: COR.avanco,
            transform: 'skewX(-24deg)'
          }}
        />
      ))}
    </div>
  );

  let medida;
  if (forma === 'vertical') {
    medida = (
      <div style={{display: 'flex', alignItems: 'center', gap: 28}}>
        <div style={{position: 'relative', display: 'flex', width: 48, height: tamanho * 2}}>
          <div style={{position: 'absolute', left: 0, right: 0, top: 8, height: 2, background: COR.lapis}} />
          <div style={{position: 'absolute', left: 0, right: 0, bottom: 8, height: 2, background: COR.lapis}} />
          <div style={{position: 'absolute', left: 23, top: 0, bottom: 0, width: 2, background: COR.tinta}} />
          <div style={{position: 'absolute', left: 21, top: -8, width: 5, height: 30, borderRadius: 2, background: COR.avanco, transform: 'skewX(-24deg)'}} />
          <div style={{position: 'absolute', left: 21, bottom: -8, width: 5, height: 30, borderRadius: 2, background: COR.avanco, transform: 'skewX(-24deg)'}} />
        </div>
        <div style={{display: 'flex', flexDirection: 'column'}}>
          {numero}
          {rotulo}
        </div>
      </div>
    );
  } else if (forma === 'nivel') {
    medida = (
      <div style={{display: 'flex', flexDirection: 'column', width: 820}}>
        <div style={{display: 'flex', paddingLeft: 48}}>{numero}</div>
        <div style={{position: 'relative', display: 'flex', height: 0, marginTop: 20}}>
          <div style={{position: 'absolute', left: 0, right: 0, top: -1, height: 2, background: COR.tinta}} />
          <svg width="32" height="27" viewBox="0 0 24 20" style={{position: 'absolute', left: 0, top: -29}}>
            <path d="M2 2h20L12 18Z" fill="none" stroke={COR.avanco} strokeWidth="2.5" strokeLinejoin="round" />
          </svg>
        </div>
        {rotulo}
      </div>
    );
  } else {
    medida = (
      <div style={{display: 'flex', alignItems: 'center', gap: 64}}>
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'stretch',
              // O Satori não aceita `transform: undefined`: a chave só existe na inclinada.
              ...(forma === 'inclinada' ? {transform: 'rotate(-24deg)'} : {})
            }}
          >
            {numero}
            {linhaHorizontal}
          </div>
          {forma === 'inclinada' ? <div style={{display: 'flex', marginTop: folgaInclinada}}>{rotulo}</div> : rotulo}
        </div>
        {forma === 'leitura' ? (
          <div style={{display: 'flex', maxWidth: 460, fontSize: 44, fontWeight: 700, lineHeight: 1.15, color: COR.tinta, textWrap: 'balance'}}>
            {nota.titulo}
          </div>
        ) : null}
      </div>
    );
  }

  const categorias: Record<Categoria, string> = {
    buying: t('filtros.buying'),
    selling: t('filtros.selling'),
    presale: t('filtros.presale'),
    market: t('filtros.market'),
    notes: t('filtros.notes')
  };

  return new ImageResponse(
    (
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          background: COR.papel,
          fontFamily: 'Inter',
          fontWeight: 500
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 40,
            top: 36,
            display: 'flex',
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: COR.tinta
          }}
        >
          {/* Rascunho não tem N.º: fica só a categoria. */}
          {nota.serie ? serieDaNota(nota.serie) : null}
          {nota.serie ? <span style={{color: COR.avanco, paddingLeft: 12, paddingRight: 12}}>/</span> : null}
          {categorias[nota.categoria]}
        </div>

        {medida}

        <div
          style={{
            position: 'absolute',
            left: 40,
            right: 40,
            bottom: 32,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            gap: 32
          }}
        >
          <div style={{display: 'flex', maxWidth: 720, fontSize: 22, color: COR.grafite, textWrap: 'balance'}}>
            {forma === 'leitura' ? nota.fonte || 'Luis Alves REALTOR®' : nota.titulo}
          </div>
          <div style={{display: 'flex', alignItems: 'baseline', gap: 8, fontSize: 30, color: COR.tinta}}>
            <span style={{fontWeight: 700}}>{t('nomeAntes')}</span>
            <span style={{fontFamily: 'Instrument Serif', fontStyle: 'italic', fontSize: 36, color: COR.avanco}}>
              {t('nomeAncora')}
            </span>
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
