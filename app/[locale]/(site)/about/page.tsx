import type {Metadata} from 'next';
import {useTranslations} from 'next-intl';
import {setRequestLocale} from 'next-intl/server';
import type {Locale} from '@/i18n/routing';
import {alternatesPara} from '@/lib/seo';
import {FantasmaPagina} from '@/components/ui/fantasma';
import {CartaoIdentidade} from '@/components/cartao-identidade';
import {Depoimentos} from '@/components/home/depoimentos';
import {CtaFinal} from '@/components/home/cta-final';

// Meta EN verbatim da tabela do roteiro.md; PT composto por autorização,
// seguindo a estrutura e o termo "realtor brasileiro em BC" indicado.
const META = {
  en: {
    title: 'About Luis Alves | Portuguese Speaking Realtor in Vancouver',
    description:
      'Over 100 families helped across Greater Vancouver and the Fraser Valley.'
  },
  pt: {
    title: 'Sobre Luis Alves | Realtor Brasileiro em Vancouver BC',
    description:
      'Mais de 100 famílias atendidas em Greater Vancouver e no Fraser Valley.'
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
    alternates: alternatesPara('/about', l)
  };
}

// Editorial nobre (design.md): foto grande, coluna estreita com corpo maior,
// credo numerado em linguagem de documento e o momento-manifesto sobre
// Tinta. Sem linha do tempo de carreira, sem currículo.
function ConteudoSobre({locale}: {locale: Locale}) {
  const t = useTranslations('paginaSobre');
  const nav = useTranslations('nav');
  const regioes = useTranslations('regioes');
  const cidades = [
    'c1', 'c2', 'c3', 'c4', 'c5', 'c6',
    'c7', 'c8', 'c9', 'c10', 'c11', 'c12'
  ] as const;

  return (
    <main>
      {/* CABEÇALHO EM DUAS COLUNAS. O h1 é uma tese e o cartão é quem a
          assina: lado a lado, a afirmação e a pessoa que a faz ocupam a mesma
          linha de leitura, e a metade direita da janela deixa de estar vazia.
          A ordem do DOM é h1, cartão, parágrafos, que é a ordem certa no
          celular; no desktop a grade põe o cartão na coluna 2, alinhado ao
          TOPO do h1 (items-start), nunca centrado na coluna.
          data-owner="catalogo": o movimento de dentro do cartão é dele (a
          entrada em Framer e o brilho em CSS) e a câmera do Passe 3 passa por
          cima sem escrever nele. */}
      <section
        data-bloco="sobre-cabecalho"
        data-owner="catalogo"
        className="relative overflow-hidden py-secao"
      >
        <FantasmaPagina palavra={nav('about')} />
        <div className="conteudo relative">
          <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_440px] lg:items-start lg:gap-12 xl:gap-16">
            <h1
              data-camada="frente"
              className="max-w-[24ch] text-[clamp(2rem,3.6vw,2.7rem)] lg:col-start-1 lg:row-start-1"
            >
              {t('titulo')}
            </h1>

            <div className="mt-10 lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:mt-0">
              <CartaoIdentidade locale={locale} />
            </div>

            <div
              data-camada="frente"
              className="mt-12 max-w-[36rem] space-y-5 text-lg lg:col-start-1 lg:row-start-2"
            >
              <p>{t('p1')}</p>
              <p>{t('p2')}</p>
              <p>{t('p3')}</p>
              <p>{t('p4')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* O credo em linguagem de documento (design.md, regra da cota
          ancorada): número 01 a 04 + texto, linha de 1px Lápis ENTRE os
          itens, como a timeline do processo. Nada de traço solto. */}
      <section data-bloco="sobre-credo" className="bg-ceu py-secao">
        <div data-camada="frente" className="conteudo">
          <h2>{t('credoTitulo')}</h2>
          <ul className="mt-8 max-w-[40rem] divide-y divide-lapis">
            {(['c1', 'c2', 'c3', 'c4'] as const).map((item, i) => (
              <li key={item} className="flex items-baseline gap-5 py-5 first:pt-0 last:pb-0">
                <span aria-hidden="true" className="text-sm font-semibold tabular-nums text-avanco">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="text-[17px] font-medium text-tinta">{t(`credo.${item}`)}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Momento-manifesto sobre Tinta: a frase serifada sozinha, centrada.
          O fio central NÃO existe parado (design.md, cota ancorada): ele
          nasce traçado no Passe 3, como parte do pico (movimento.md).
          TODO: a frase-manifesto EN oficial pende de aval do cliente; até lá
          vale a linha do credo, verbatim. */}
      <section data-bloco="sobre-manifesto" className="bg-tinta py-secao">
        <div className="conteudo text-center">
          <p
            data-camada="frente"
            // A Instrument Serif tem UM peso (400): pedir 500 aqui faria o navegador
            // engrossar o traço na força bruta e sujar a serifa.
            className="font-editorial mx-auto max-w-[24ch] text-[clamp(1.7rem,3.4vw,2.5rem)] font-normal italic leading-[1.3] text-papel"
          >
            {t('manifesto')}
          </p>
        </div>
      </section>

      {/* Blocos finais do roteiro: regiões, depoimentos, CTA.
          O bloco sobre-premio saiu daqui: o Ruby Award vive agora na faixa do
          cartão de identidade, no cabeçalho. Ele era uma linha de texto sozinha
          numa faixa de 220px e lia como sobra, o que já estava registrado como
          dívida nas pendências. */}
      <section data-bloco="sobre-regioes" className="bg-ceu py-secao">
        <div className="conteudo">
          <h2 data-camada="frente">{regioes('titulo')}</h2>
          <ul data-camada="meio" className="mt-7 flex max-w-[52rem] flex-wrap gap-2.5">
            {cidades.map((cidade) => (
              <li
                key={cidade}
                className="rounded-full border border-lapis bg-white px-4 py-2 text-sm font-medium text-grafite"
              >
                {regioes(`cidades.${cidade}`)}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <Depoimentos />

      <CtaFinal locale={locale} fechamento={false} />
    </main>
  );
}

export default async function PaginaSobre({
  params
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  setRequestLocale(locale);
  return <ConteudoSobre locale={locale as Locale} />;
}
