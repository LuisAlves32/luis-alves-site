import type {Metadata} from 'next';
import {setRequestLocale} from 'next-intl/server';
import {Fragment} from 'react';
import {FantasmaPagina} from '@/components/ui/fantasma';
import {POLITICA, type Bloco} from '@/content/privacidade';
import type {Locale} from '@/i18n/routing';
import {alternatesPara} from '@/lib/seo';
import {colarUltimasPalavrasEm, TETO_CORPO} from '@/lib/tipografia-notas';

/* =============================================================================
   POLÍTICA DE PRIVACIDADE · a página
   O texto vem de content/privacidade.ts, e o MESTRE daquele arquivo é
   site/politica-privacidade.md. Correção do cliente entra no .md primeiro.

   INDEXÁVEL de propósito (04/09): o noindex que existia aqui era só porque a
   página estava vazia. Uma política de privacidade publicada tem que poder ser
   encontrada, e o rodapé do site inteiro aponta para ela.
   ========================================================================== */

const DESCRICOES: Record<Locale, string> = {
  en: 'How Luis Alves REALTOR®, with Stonehaus Realty Corp., collects, uses and protects your personal information under British Columbia privacy law.',
  pt: 'Como Luis Alves REALTOR®, na Stonehaus Realty Corp., coleta, usa e protege as suas informações pessoais sob a lei de privacidade da Colúmbia Britânica.'
};

export async function generateMetadata({
  params
}: {
  params: Promise<{locale: string}>;
}): Promise<Metadata> {
  const {locale} = await params;
  const l = locale as Locale;
  return {
    title: POLITICA[l].titulo,
    description: DESCRICOES[l],
    alternates: alternatesPara('/privacy-policy', l)
  };
}

/**
 * O `**negrito**` do .md, que marca as partes juridicamente importantes.
 * Um `<strong>` de verdade, e não `font-bold`: aqui o peso É semântica.
 */
function negrito(texto: string) {
  /* O acabamento das órfãs (24/09/2026): este documento vem do .md, não das mensagens, e
     por isso não passava pela cola do i18n/request.ts. A cola é aplicada aqui, na leitura. */
  return colarUltimasPalavrasEm(texto, TETO_CORPO).split('**').map((parte, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="font-semibold text-tinta">
        {parte}
      </strong>
    ) : (
      <Fragment key={i}>{parte}</Fragment>
    )
  );
}

function BlocoDoDocumento({bloco}: {bloco: Bloco}) {
  switch (bloco.tipo) {
    case 'p':
      return <p className="mt-5 first:mt-0">{negrito(bloco.texto)}</p>;

    case 'sub':
      return (
        <h3 className="mt-9 text-[1.05rem] font-semibold tracking-[-0.01em] text-tinta">
          {colarUltimasPalavrasEm(bloco.texto)}
        </h3>
      );

    case 'ul':
      return (
        <ul className="mt-5 space-y-2.5">
          {bloco.itens.map((item, i) => (
            // A BARRA da assinatura (design.md) como marcador, no lugar do
            // disco padrão: é a forma da marca cumprindo função, não enfeite.
            <li key={i} className="relative pl-6">
              <span
                aria-hidden="true"
                className="absolute left-0 top-[0.62em] inline-block h-[0.72em] w-[3px] -skew-x-[24deg] rounded-full bg-avanco"
              />
              {negrito(item)}
            </li>
          ))}
        </ul>
      );

    case 'tabela':
      /* Lista de DEFINIÇÃO, não <table>. O conteúdo é termo e explicação
         (onde → o quê), que é exatamente o que um <dl> descreve, e ele se
         empilha sozinho no celular sem nenhum truque de tabela responsiva.
         Medido em 390px: numa tabela de verdade a segunda coluna caía para
         ~250px e a última linha ia a seis linhas de texto espremidas. */
      return (
        <>
          {/* Os rótulos das colunas do .md. Ficam FORA do <dl> porque o modelo
              de conteúdo dele só aceita dt/dd ou div, e um span solto ali é
              marcação inválida. Só para leitor de tela: na tela, o par
              termo/definição já diz o que a coluna dizia. */}
          <p className="sr-only">
            {bloco.colunas[0]} · {bloco.colunas[1]}
          </p>
          <dl className="mt-6 divide-y divide-lapis border-y border-lapis">
            {bloco.linhas.map(([termo, definicao], i) => (
              <div
                key={i}
                className="grid gap-1 py-4 sm:grid-cols-[minmax(0,11rem)_minmax(0,1fr)] sm:gap-6"
              >
                <dt className="text-[0.92rem] font-semibold text-tinta">{termo}</dt>
                <dd className="text-[0.97rem]">{colarUltimasPalavrasEm(definicao, TETO_CORPO)}</dd>
              </div>
            ))}
          </dl>
        </>
      );

    case 'destaque':
      /* Os blocos de contato (`>` no .md). Cota ancorada à esquerda, que é a
         forma-assinatura na versão vertical: nunca traço solto (design.md). */
      return (
        <div className="mt-6 border-l-[3px] border-avanco bg-ceu/50 py-4 pl-5 pr-4">
          {bloco.linhas.map((linha, i) => (
            <p key={i} className="text-[0.97rem] leading-relaxed">
              {negrito(linha)}
            </p>
          ))}
        </div>
      );
  }
}

export default async function PaginaPrivacidade({
  params
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  setRequestLocale(locale);
  const l = locale as Locale;
  const politica = POLITICA[l];

  return (
    <main>
      <section
        data-bloco="privacidade-cabecalho"
        className="relative overflow-hidden pb-10 pt-secao"
      >
        <FantasmaPagina palavra={politica.titulo.split(' ')[0]} />
        <div data-camada="frente" className="conteudo relative">
          <div className="max-w-[var(--medida-texto)]">
            <h1 className="text-[clamp(2rem,3.6vw,2.7rem)]">{colarUltimasPalavrasEm(politica.titulo)}</h1>
            <p className="mt-5 text-[0.95rem] font-semibold uppercase tracking-[0.14em] text-grafite">
              {colarUltimasPalavrasEm(politica.atualizacao)}
            </p>
            {politica.cortesia && (
              // Nota, não parágrafo: a hierarquia tem que dizer, antes da
              // leitura, que este texto fala SOBRE o documento e não é o
              // documento. Sobre Céu, com a cota à esquerda.
              <p
                role="note"
                className="mt-6 border-l-[3px] border-avanco bg-ceu py-3.5 pl-5 pr-4 text-[0.95rem] leading-relaxed"
              >
                {negrito(politica.cortesia)}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* POSSE DO MOVIMENTO: data-owner="documento".
          A entrada suave da câmera se aplica a parágrafos e listas. Aqui são
          mais de quarenta elementos, e eles apareceriam em sequência com
          stagger enquanto a pessoa está LENDO para se informar sobre os
          próprios dados. Isso vira slideshow e atrapalha. O título e a
          respiração do papel continuam valendo; o corpo do documento entra
          pronto. As cotas das seções também ficam paradas por isso, e é o
          certo: quinze linhas se desenhando num texto legal seria o mesmo
          erro em outra roupa. */}
      <section
        data-bloco="privacidade-documento"
        data-owner="documento"
        className="pb-secao"
      >
        <div className="conteudo">
          {/* break-words: o e-mail do responsável é uma palavra só e passava da tela em 320px. */}
          <div className="max-w-[var(--medida-texto)] break-words">
            {politica.secoes.map((secao) => (
              <section key={secao.numero} className="mt-12 first:mt-0">
                {/* A cota ANCORADA do design.md: o fio de 1px em Lápis que
                    organiza o documento, com a cota Avanço entrando pela
                    borda. Mesma construção do bloco Venda. */}
                <div
                  data-cota
                  aria-hidden="true"
                  className="relative h-px w-full bg-lapis"
                >
                  <span className="absolute -top-px left-0 h-[3px] w-11 rounded-b-full bg-avanco" />
                </div>

                <h2 className="mt-6 flex gap-3 text-[1.35rem] leading-[1.25] sm:text-[1.5rem]">
                  <span aria-hidden="true" className="tabular-nums text-avanco">
                    {secao.numero}.
                  </span>
                  <span>{colarUltimasPalavrasEm(secao.titulo)}</span>
                </h2>

                <div className="mt-5">
                  {secao.blocos.map((bloco, i) => (
                    <BlocoDoDocumento key={i} bloco={bloco} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
