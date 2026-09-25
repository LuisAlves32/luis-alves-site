import type {Metadata} from 'next';
import {useTranslations} from 'next-intl';
import {setRequestLocale} from 'next-intl/server';
import {Link} from '@/i18n/navigation';
import type {Locale} from '@/i18n/routing';
import {alternatesPara} from '@/lib/seo';
import {Barra} from '@/components/ui/assinatura';
import {botaoPrimario, Seta} from '@/components/ui/botoes';
import {Calha} from '@/components/ui/calha';
import {CardFicha} from '@/components/ui/card-ficha';
import {FantasmaPagina} from '@/components/ui/fantasma';
import {CtaFinal} from '@/components/home/cta-final';
import {Faq} from '@/components/home/faq';

// Meta EN verbatim da tabela do roteiro.md; PT composto por autorização,
// seguindo a estrutura da tabela e os termos indicados no roteiro.
const META = {
  en: {
    title: 'Buying a Home in BC | Luis Alves REALTOR®',
    description:
      'What you need to buy in British Columbia: costs, steps and strategy, explained clearly.'
  },
  pt: {
    title: 'Comprar Imóvel em BC | Luis Alves REALTOR®',
    description:
      'Custos, etapas e estratégia para comprar imóvel na British Columbia, explicados com clareza.'
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
    alternates: alternatesPara('/buying', l)
  };
}

function ConteudoComprar({locale}: {locale: Locale}) {
  const t = useTranslations('paginaComprar');
  const nav = useTranslations('nav');
  const guia = useTranslations('primeiroImovel');
  const custos = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7'] as const;

  return (
    <main>
      <section data-bloco="comprar-cabecalho" className="relative overflow-hidden py-secao">
        <FantasmaPagina palavra={nav('buying')} />
        <div data-camada="frente" className="conteudo relative">
          <h1 className="max-w-[30ch] text-[clamp(2rem,3.6vw,2.7rem)]">
            {t.rich('titulo', {
              ancora: (parte) => <em className="ancora">{parte}</em>
            })}
          </h1>
          <p className="mt-6 max-w-[65ch] text-lg">{t('intro')}</p>
        </div>
      </section>

      {/* Bloco 1: as 11 etapas resumidas em texto corrido, em três tempos
          (antes de olhar, procurando, depois da oferta aceita). Copy da
          direção, aprovada em 05/09/2026; ver a nota no roteiro.md.
          Os termos em inglês dentro do PT (mortgage broker, disclosure,
          strata, subjects, Property Transfer Tax, completion) são
          DELIBERADOS: é o nome que a pessoa encontra no contrato.
          A última frase rima de propósito com `processo.apoio` da home
          ("Cinco etapas, e em todas você sabe por que estamos fazendo
          aquilo"). Isso é costura, não descuido. */}
      <section data-bloco="comprar-passos" className="bg-ceu py-secao">
        <div data-camada="frente" className="conteudo">
          <Calha>
            <h2>{t('b1Titulo')}</h2>
            <div className="mt-7 max-w-[65ch] space-y-4">
              <p>{t('b1Texto1')}</p>
              <p>{t('b1Texto2')}</p>
              <p>{t('b1Texto3')}</p>
            </div>
          </Calha>
        </div>
      </section>

      {/* Bloco 2: First-Time Buyers, âncora #first-home do roteiro.
          Herda o bloco 5 da home: Areia, o único quente da página. */}
      <section id="first-home" data-bloco="comprar-first-home" className="bg-areia py-secao">
        <div data-camada="frente" className="conteudo">
          <h2 className="max-w-[24ch]">{guia('titulo')}</h2>
          <ul className="mt-7 flex max-w-[46rem] flex-wrap gap-x-6 gap-y-3">
            {custos.map((custo) => (
              <li key={custo} className="flex items-center gap-2 text-[15px] font-medium text-tinta">
                <Barra className="h-[0.8em] w-[2.5px]" />
                {t(`custos.${custo}`)}
              </li>
            ))}
          </ul>
          <div className="mt-8">
            <Link href="/real-cost-guide" className={botaoPrimario}>
              {guia('cta')}
              <Seta className="group-hover:translate-x-[3px]" />
            </Link>
          </div>
        </div>
      </section>

      {/* Bloco 3. Título PT traduzido em 05/09/2026; pende de ratificação. */}
      <section data-bloco="comprar-upgrade" className="py-secao">
        <div data-camada="frente" className="conteudo">
          <Calha>
            <h2 className="max-w-[24ch]">{t('b3Titulo')}</h2>
            <p className="mt-5 max-w-[65ch]">{t('b3Texto')}</p>
          </Calha>
        </div>
      </section>

      {/* Bloco 4: três cards, um por documento de strata. Título PT traduzido
          em 05/09/2026; "Condos" e "strata" ficam em inglês por ordem do
          roteiro, que é o nome real do que a pessoa encontra no contrato. */}
      <section data-bloco="comprar-strata" className="bg-ceu py-secao">
        <div className="conteudo">
          <Calha>
            <div data-camada="frente" className="max-w-[65ch]">
              <h2>{t('b4Titulo')}</h2>
              <p className="mt-4">{t('b4Apoio')}</p>
            </div>
            <div data-camada="meio" className="mt-8 grid gap-6 md:grid-cols-3">
              {(['d1', 'd2', 'd3'] as const).map((doc) => (
                <CardFicha key={doc}>
                  <h3 className="text-[17px]">{t(`docs.${doc}`)}</h3>
                </CardFicha>
              ))}
            </div>
          </Calha>
        </div>
      </section>

      {/* Bloco 5: mesmo peso visual dos demais (nota do cliente).
          Título PT traduzido em 05/09/2026; pende de ratificação. */}
      <section data-bloco="comprar-newcomer" className="py-secao">
        <div data-camada="frente" className="conteudo">
          <Calha>
            <h2 className="max-w-[26ch]">{t('b5Titulo')}</h2>
            <p className="mt-5 max-w-[65ch]">{t('b5Texto')}</p>
          </Calha>
        </div>
      </section>

      {/* Bloco 6: a FAQ ampliada de compradores. Copy da direção, aprovada em
          05/09/2026; nenhuma das cinco repete as seis da home. O componente é o
          MESMO da home desde esta rodada, e o bg-ceu que ele recebe é o que
          mantém a alternância de fundo desta página.
          NÃO DÊ ESPECIFICIDADE À q4 ("comprar sem ser residente permanente").
          Ela fala de regra que já mudou mais de uma vez e que depende do status,
          do imóvel e da localização. No dia em que citar uma lei, um imposto,
          um percentual ou uma data, ela vira informação com prazo de validade
          num site que ninguém revisa toda semana, e expõe o cliente, que é
          REALTOR® licenciado. A resposta promete conferir o caso e pôr por
          escrito, que é o que se pode prometer sem envelhecer. */}
      <Faq
        no="paginaComprar.faq"
        itens={['q1', 'q2', 'q3', 'q4', 'q5']}
        idPrefixo="faq-comprar"
        className="bg-ceu"
        fechamento={false}
      />

      <CtaFinal locale={locale} fechamento={false} />
    </main>
  );
}

export default async function PaginaComprar({
  params
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  setRequestLocale(locale);
  return <ConteudoComprar locale={locale as Locale} />;
}
