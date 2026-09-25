import type {Metadata} from 'next';
import {Instrument_Serif, Inter} from 'next/font/google';
import {Camera} from '@/components/camera';
import {Footer} from '@/components/footer';
import {Navbar} from '@/components/navbar';
import {WhatsappFlutuante} from '@/components/whatsapp-flutuante';
import type {Locale} from '@/i18n/routing';
import {grafoDoSite} from '@/lib/dados-estruturados';
import {jsonLd} from '@/lib/notas-schema';
import {siteUrl} from '@/lib/seo';

/* AS FONTES DO SITE MORAM AQUI, e não no layout do locale (mudança de
   06/09/2026). O layout de cima cobre os DOIS grupos de rota, então declarar
   as fontes lá fazia toda visita à landing do funil baixar 70,8 KB que ela
   nunca desenha. Declaradas neste layout, elas entram só nas rotas do site.
   O funil tem o próprio elenco em `components/landing/pele.tsx`. */

// Inter é variável: cobre os pesos 400 a 800 num arquivo só.
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap'
});

// Voz editorial: Instrument Serif ITÁLICA (decisão de 29/08 no design.md, no
// lugar da Cormorant). Um peso só (400) e um estilo só: é assim que a família
// existe. latin-ext cobre a acentuação do PT (ã õ ç é).
const instrumentSerif = Instrument_Serif({
  subsets: ['latin', 'latin-ext'],
  weight: '400',
  style: 'italic',
  variable: '--font-serifa',
  display: 'swap'
});

/* A CAPA DE COMPARTILHAMENTO de todas as páginas do site (Passe 4). As páginas só
   declaram título, descrição e alternates, então este `openGraph` chega a todas elas;
   a nota do blog declara o próprio e substitui este inteiro (a mesclagem do Next é
   rasa), que é o que se quer: cada nota tem a capa da cota. O título e a descrição do
   cartão ficam com os da página (o `<title>` é o que o WhatsApp lê sem og:title). */
export async function generateMetadata({
  params
}: {
  params: Promise<{locale: string}>;
}): Promise<Metadata> {
  const {locale} = await params;
  const imagem = {url: `${siteUrl}/api/compartilhar/${locale}`, width: 1200, height: 630, alt: 'Luis Alves, REALTOR®'};
  return {
    openGraph: {
      type: 'website',
      siteName: 'Luis Alves REALTOR®',
      locale: locale === 'pt' ? 'pt_BR' : 'en_CA',
      images: [imagem]
    },
    twitter: {card: 'summary_large_image', images: [imagem.url]}
  };
}

// Chrome do SITE: navbar, rodapé e botão flutuante em todas as páginas
// institucionais. A landing do ebook vive no grupo (funil), sem este chrome,
// por ser peça de campanha standalone (roteiro.md da landing).
export default async function LayoutSite({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  const l = locale as Locale;

  return (
    /* O INVÓLUCRO DAS FONTES DO SITE.
       Ele carrega as duas variáveis CSS E o `font-sans`, e os dois são
       necessários. As variáveis sozinhas não bastam: `font-family` é herdada,
       e o <body> lá de cima resolve `var(--font-inter)` para o fallback
       genérico porque a variável não existe mais naquele nível. É o `font-sans`
       AQUI, no mesmo elemento que define a variável, que reestabelece a Inter
       para todo o conteúdo do site.
       Não pode ganhar transform, filter, opacity < 1 nem isolation: a
       respiração do papel (components/camera.tsx) é `position: fixed` com
       `z-index: -1` e conta com o contexto de empilhamento da RAIZ para pintar
       acima do fundo do body. Um contexto de empilhamento novo aqui a
       esconderia atrás deste div. */
    <div className={`${inter.variable} ${instrumentSerif.variable} font-sans`}>
      {/* A ESPERA DA CÂMERA (Passe 3 do blog, 24/09/2026). Entre a primeira pintura e o
          JavaScript acordar, as capas do blog apareciam MEDIDAS e, 250ms depois, as linhas
          sumiam para se traçar: um piscar, medido. Este script roda antes do conteúdo ser
          pintado e marca <html data-camera="espera"> (só com movimento normal); o CSS
          esconde só as LINHAS da cota nesse intervalo (o número fica, é o maior texto da
          página). A câmera tira a marca ao ligar, e a trava de 3s tira sozinha se o
          JavaScript falhar: a linha nunca fica escondida para sempre. */}
      <script
        dangerouslySetInnerHTML={{
          __html:
            "try{if(!matchMedia('(prefers-reduced-motion: reduce)').matches){var h=document.documentElement;h.setAttribute('data-camera','espera');setTimeout(function(){h.removeAttribute('data-camera')},3000)}}catch(e){}"
        }}
      />
      {/* Passe 4: quem é o Luís em linguagem de máquina (lib/dados-estruturados.ts). No HTML
          cru, renderizado no servidor, para o robô que não executa JavaScript. */}
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(await grafoDoSite(l))} />
      <Navbar />
      {children}
      <Footer locale={l} />
      <WhatsappFlutuante locale={l} />
      {/* A câmera do Passe 3, montada UMA vez e depois do conteúdo: ela varre
          o documento inteiro e não renderiza nada visível. Fica aqui, e não no
          motion-provider.tsx, porque o provider é a camada global de rolagem
          (Lenis e GSAP no mesmo relógio) e serve também ao grupo (funil). */}
      <Camera />
    </div>
  );
}
