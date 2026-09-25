import type {Metadata} from 'next';
import {useTranslations} from 'next-intl';
import {setRequestLocale} from 'next-intl/server';
import type {Locale} from '@/i18n/routing';
import {alternatesPara} from '@/lib/seo';
import {linkWhatsApp} from '@/lib/links';
import Image from 'next/image';
import {Barra} from '@/components/ui/assinatura';
import {botaoPrimario, Seta} from '@/components/ui/botoes';
import {Calha} from '@/components/ui/calha';
import {LinhasEsqueleto} from '@/components/ui/esqueleto';
import {FantasmaPagina} from '@/components/ui/fantasma';

// Meta EN verbatim da tabela do roteiro.md; PT composto por autorização,
// seguindo a estrutura da tabela.
const META = {
  en: {
    title: 'Presale and New Developments BC | Luis Alves REALTOR®',
    description:
      'Deposits, timelines, assignment and developer review before you commit to a presale.'
  },
  pt: {
    title: 'Pré-construção e Novos Empreendimentos em BC | Luis Alves REALTOR®',
    description:
      'Depósitos, prazos, assignment e análise da construtora antes de você assumir uma pré-construção.'
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
    alternates: alternatesPara('/presales', l)
  };
}

// A página mais contida do site (design.md): três blocos e um CTA. Sem galeria
// de empreendimentos, sem logo de construtora, sem menção a valorização.
function ConteudoPresales({locale}: {locale: Locale}) {
  const t = useTranslations('paginaPresales');
  const nav = useTranslations('nav');
  const analise = ['a1', 'a2', 'a3', 'a4', 'a5', 'a6'] as const;
  const perguntas = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'] as const;

  return (
    <main>
      <section data-bloco="presales-cabecalho" className="relative overflow-hidden py-secao">
        <FantasmaPagina palavra={nav('presales')} />
        <div data-camada="frente" className="conteudo relative">
          <h1 className="max-w-[32ch] text-[clamp(2rem,3.6vw,2.7rem)]">{t('titulo')}</h1>
          <p className="mt-6 max-w-[65ch] text-lg">{t('intro')}</p>
        </div>
      </section>

      {/* Bloco 1. Os seis itens de análise e o título vinham do roteiro em UM
          idioma só. Traduzido em 05/09/2026 a partir do idioma que o cliente entregou; pende de ratificação do Luís (ver roteiro.md). */}
      <section data-bloco="presales-analise" className="bg-ceu py-secao">
        <div data-camada="frente" className="conteudo">
          <Calha>
            <h2 className="max-w-[26ch]">{t('b1Titulo')}</h2>
            <ul className="mt-7 grid max-w-[52rem] gap-x-8 gap-y-3 sm:grid-cols-2">
              {analise.map((item) => {
                const texto = t(`analise.${item}`);
                return (
                  <li key={item} className="flex items-baseline gap-2.5 text-[15px] font-medium text-tinta">
                    {texto.trim() ? (
                      <>
                        <Barra className="h-[0.8em] w-[2.5px]" />
                        {texto}
                      </>
                    ) : (
                      /* GUARDA, não código morto: os dois idiomas estão
                         preenchidos desde a rodada D, então este ramo não
                         dispara hoje. Se alguém esvaziar a chave amanhã, o item
                         mostra esqueleto em vez de um marcador solto ao lado de
                         nada, que é o modo certo de falhar. NÃO "limpar". */
                      <LinhasEsqueleto linhas={1} className="w-52" />
                    )}
                  </li>
                );
              })}
            </ul>
          </Calha>
        </div>
      </section>

      {/* Bloco 2, com a foto de obra real (nota do cliente).
          Título PT traduzido em 05/09/2026; pende de ratificação. */}
      <section data-bloco="presales-perfil" className="py-secao">
        <div className="conteudo grid items-start gap-10 lg:grid-cols-[minmax(0,8fr)_minmax(0,3fr)] lg:gap-16">
          <div data-camada="frente">
            <h2 className="max-w-[24ch]">{t('b2Titulo')}</h2>
            <p className="mt-5 max-w-[65ch]">{t('b2Texto')}</p>
          </div>
          <div data-camada="meio">
            <div className="relative aspect-[4/5] w-full max-w-[220px] overflow-hidden rounded-[16px] lg:max-w-[260px]">
              <Image
                src="/ia/obra-amanhecer-4x5.webp"
                alt={t('altFoto')}
                fill
                sizes="(min-width: 1024px) 260px, 220px"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Bloco 3: as seis perguntas. Copy da direção, aprovada em 05/09/2026.
          Mesma lista do bloco de erros de /selling, de propósito: duas páginas
          internas compartilhando o mesmo padrão é coerência.
          SÃO PERGUNTAS, e isso é decisão técnica antes de ser retórica: a
          página não AFIRMA nenhuma regra, então não envelhece quando a regra
          mudar e não expõe o cliente, que é REALTOR® licenciado. Não
          transforme nenhuma em afirmação. */}
      <section data-bloco="presales-perguntas" className="bg-ceu py-secao">
        <div data-camada="frente" className="conteudo">
          <Calha>
            <h2 className="max-w-[24ch]">{t('b3Titulo')}</h2>
            <ul className="mt-8 max-w-[46rem] divide-y divide-lapis">
              {perguntas.map((pergunta) => (
                <li
                  key={pergunta}
                  className="flex items-baseline gap-3 py-5 text-[17px] font-medium text-tinta first:pt-0 last:pb-0"
                >
                  <Barra className="h-[0.8em] w-[2.5px]" />
                  <span>{t(`perguntas.${pergunta}`)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-7 max-w-[46rem] font-medium text-tinta">{t('perguntasFecho')}</p>
          </Calha>
        </div>
      </section>

      <section data-bloco="presales-cta" className="py-secao">
        <div data-camada="frente" className="conteudo">
          <a
            href={linkWhatsApp('presales', locale)}
            target="_blank"
            rel="noopener noreferrer"
            className={botaoPrimario}
          >
            {t('cta')}
            <Seta className="group-hover:translate-x-[3px]" />
          </a>
        </div>
      </section>
    </main>
  );
}

export default async function PaginaPresales({
  params
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  setRequestLocale(locale);
  return <ConteudoPresales locale={locale as Locale} />;
}
