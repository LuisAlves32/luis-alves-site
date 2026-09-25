import type {Metadata} from 'next';
import {setRequestLocale} from 'next-intl/server';
import type {Locale} from '@/i18n/routing';
import {alternatesPara} from '@/lib/seo';
import {grafoDoFaq} from '@/lib/dados-estruturados';
import {jsonLd} from '@/lib/notas-schema';
import {HeroDoisAtos} from '@/components/home/hero-dois-atos';
import {TresCaminhos} from '@/components/home/tres-caminhos';
import {SobreLuis} from '@/components/home/sobre-luis';
import {VendidosHome} from '@/components/home/vendidos-home';
import {Venda} from '@/components/home/venda';
import {CenaAntes} from '@/components/cena-antes';
import {Processo} from '@/components/home/processo';
import {Depoimentos} from '@/components/home/depoimentos';
import {Regioes} from '@/components/home/regioes';
import {GuiaNewsletter} from '@/components/home/guia-newsletter';
import {Faq} from '@/components/home/faq';
import {CtaFinal} from '@/components/home/cta-final';

// Meta EN verbatim da tabela do roteiro.md; PT composto por autorização,
// seguindo a estrutura da tabela e o termo "corretor de imóveis" indicado.
const META = {
  en: {
    title:
      'Luis Alves REALTOR® | Realtor in South Surrey, Surrey and Greater Vancouver',
    description:
      'Market knowledge, strategic negotiation and personal service for buyers and sellers in Greater Vancouver and the Fraser Valley.'
  },
  pt: {
    title:
      'Luis Alves REALTOR® | Corretor de Imóveis em South Surrey, Surrey e Greater Vancouver',
    description:
      'Conhecimento de mercado, negociação estratégica e atendimento pessoal para quem compra ou vende em Greater Vancouver e no Fraser Valley.'
  }
};

export async function generateMetadata({
  params
}: {
  params: Promise<{locale: string}>;
}): Promise<Metadata> {
  const {locale} = await params;
  const l = locale as Locale;
  return {
    title: META[l].title,
    description: META[l].description,
    alternates: alternatesPara('/', l)
  };
}

// Home, Passe 1 (esqueleto mudo): os blocos do roteiro.md + FAQ
// (posição decidida no design.md: entre o bloco 11 e o CTA final).
// O rodapé (bloco 13) vive no layout, porque é de todas as páginas.
//
// FORA DA HOME por decisão do Gabriel: o bloco 5, "Quanto você realmente
// precisa para comprar em BC?" (a faixa Areia com o Guia do Primeiro Imóvel).
// O componente continua em components/home/first-time-buyers.tsx e a copy
// continua no nó `primeiroImovel` dos dois idiomas, que a página COMPRAR usa.
// O caminho do guia na home é o card "É meu primeiro imóvel" da seção 2, que
// sempre apontou para /buying#first-home; de lá o CTA vai para a landing do
// funil, /real-cost-guide. A página-esqueleto /first-home-guide não existe
// mais (2.32): o guia tem UMA porta só, e ela é a landing.
//
// FORA DA HOME desde o 2.35: o bloco 4, "Imóveis em destaque e busca". A
// seção dependia de listings reais (pendência MLS/IDX) e vivia de card
// esquelético. No lugar dela entra VENDIDOS RECENTEMENTE, que é prova de
// trabalho com foto real.
//
// FORA DO SITE desde o 2.39: a PÁGINA de imóveis inteira. Pela mesma razão, um
// degrau acima: sem a integração MLS/IDX da Stonehaus não há o que listar nem o
// que buscar, e uma página que promete busca sem ter busca custa mais do que
// entrega. Ela e o componente destaques.tsx foram GUARDADOS, não apagados, em
// _arquivo/listings/ e _arquivo/destaques.tsx; o que fazer para ressuscitar os
// dois está em _arquivo/README.md. A rota saiu de i18n/routing.ts, as grafias
// antigas caem na home por redirect (next.config.ts) e o nó `destaques` do
// i18n ficou RESERVADO para o pacote guardado, que é o único que o lê.
// A home perdeu o caminho para lá em dois lugares: o botão do rodapé dos
// vendidos e o "buscar imóveis" da hero, que agora tem um botão só.
export default async function Home({
  params
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  setRequestLocale(locale);
  const l = locale as Locale;

  return (
    <main>
      <HeroDoisAtos locale={l} />
      <TresCaminhos />
      <SobreLuis />
      <VendidosHome />
      <Venda locale={l} />
      <CenaAntes locale={l} />
      <Processo />
      <Depoimentos />
      <Regioes />
      <GuiaNewsletter />
      <Faq />
      {/* Passe 4: a mesma FAQ em linguagem de máquina. A lista repete o padrão do
          <Faq> porque constante de arquivo 'use client' chega undefined aqui. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLd(
          await grafoDoFaq(l, '/', 'faq.itens', ['q1', 'q2', 'q3', 'q4', 'q5', 'q6'])
        )}
      />
      <CtaFinal locale={l} />
    </main>
  );
}
