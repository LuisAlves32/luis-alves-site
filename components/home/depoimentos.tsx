import type {ReactNode} from 'react';
import {useTranslations} from 'next-intl';
import {CardFicha} from '@/components/ui/card-ficha';
import {PilhaCards} from '@/components/ui/pilha-cards';

// Bloco 9 do roteiro.md. Sem carrossel automático: a pilha é dirigida pelo
// leitor (arrasto, setas, teclado, dots), nunca por timer. Coleção na pilha do
// catálogo (21st.dev, ver pilha-cards.tsx): a seção tem dono de movimento
// (data-owner="catalogo"; o GSAP do Passe 3 não entra aqui).
//
// AS PALAVRAS SÃO DE PESSOAS REAIS, publicadas no perfil do Google do Luis:
//
// - Os textos são RECORTE do original, cortado nas pontas. Gramática e
//   construções fora do padrão ficam COMO ESTÃO. O "[...]" da d3 marca a
//   omissão real. Nenhuma palavra, vírgula ou maiúscula foi alterada, e o
//   "REALtor / REALfriend" da d3 é grafia dela, não erro nosso.
//
// - `nome`, `foto` e `texto` têm o MESMO valor em pt.json e en.json, DE
//   PROPÓSITO. Isto NÃO é falha de paridade e não deve ser "consertado":
//   depoimento é prova, não copy. Traduzir e manter entre aspas atribui a uma
//   pessoa palavras que ela não disse, e quem for conferir no Google acha
//   outro texto. Só `nota`, `avaliacoes` e `notaAcessivel` mudam de idioma.
//
// - NÃO inventar cidade, ano ou tipo de transação. O Google mostra data
//   relativa ("a year ago"), e virar isso em ano exato seria precisão que não
//   temos. Por isso não há ano nos cards.
//
// - As fotos entraram com autorização, já recortadas em 144x144 e SEM o selo
//   "Local Guide" do Google (aquilo é chrome da interface dele, não é parte
//   da pessoa). Elas são quadradas de propósito: o círculo é do CSS.

// O perfil que reúne AS DUAS origens no mesmo lugar: o REW publica as
// recomendações do Luis e também importa as avaliações do Google.
const PERFIL_AVALIACOES = 'https://www.rew.ca/agents/273435/luis-martins-alves';

// Nota e contagem CONFERIDAS no perfil do Google em 01/09/2026 (perfil "Luis
// Alves Real Estate", dele e não da corretora). Elas mudam sozinhas: reconferir
// no lançamento. A nota NUNCA é arredondada para cima, e as estrelas nunca
// mostram mais do que a nota, por isso a quantidade sai daqui e não da
// marcação.
const ESTRELAS_CHEIAS = 5;

const FICHAS = ['d1', 'd2', 'd3'] as const;

// <realce> é ênfase editorial de citação: o DESTAQUE é NOSSO, o TEXTO é DELA,
// e nenhuma palavra foi alterada (o valor da chave, tirando as marcas, é
// palavra por palavra o que a pessoa publicou). <b> é o elemento certo porque
// destaca visualmente SEM afirmar importância, que é o que uma revista faz ao
// grifar um trecho de entrevista.
const MARCAS = {
  realce: (parte: ReactNode) => <b className="realce">{parte}</b>
};

// O "G" oficial do Google, com os quatro caminhos da marca. Não redesenhar,
// não recolorir, não distorcer: viewBox quadrado e render 1:1. aria-hidden
// porque o texto ao lado já diz "Google".
function MarcaGoogle() {
  return (
    <svg
      viewBox="0 0 48 48"
      width="18"
      height="18"
      aria-hidden="true"
      className="marca-google"
    >
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

// Recebe a QUANTIDADE como número, e não cinco SVGs chumbados na marcação: no
// dia em que a nota cair, muda o número e o desenho acompanha. O amarelo é o
// #FBBC04 do próprio "G", e é ele que amarra a estrela à atribuição do Google
// em vez de deixá-la solta na paleta.
// Um único role="img" no grupo: o leitor de tela anuncia "5 de 5 estrelas"
// uma vez, não uma vez por estrela.
function Estrelas({
  quantidade,
  tamanho,
  rotulo,
  className = ''
}: {
  quantidade: number;
  tamanho: number;
  rotulo: string;
  className?: string;
}) {
  return (
    <span role="img" aria-label={rotulo} className={`estrelas ${className}`}>
      {Array.from({length: quantidade}, (_, i) => (
        <svg
          key={i}
          aria-hidden="true"
          viewBox="0 0 24 24"
          width={tamanho}
          height={tamanho}
          fill="currentColor"
        >
          <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
        </svg>
      ))}
    </span>
  );
}

function SetaExterna() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="seta-externa"
    >
      <path d="M7 17 17 7" />
      <path d="M9 7h8v8" />
    </svg>
  );
}

// A chave `origem` fica LIMPA no arquivo de copy ("via Google", igual nos dois
// idiomas). O destaque da palavra da plataforma é de apresentação e acontece
// aqui na leitura. Se um dia a chave deixar de conter "Google", a linha só
// perde o destaque: não quebra.
function Origem({texto}: {texto: string}) {
  const [antes, ...resto] = texto.split('Google');
  if (resto.length === 0) return <>{texto}</>;
  return (
    <>
      {antes}
      <b className="fonte">Google</b>
      {resto.join('Google')}
    </>
  );
}

function CardDepoimento({ficha}: {ficha: (typeof FICHAS)[number]}) {
  const t = useTranslations('depoimentos');

  return (
    <CardFicha className="ficha-depoimento flex h-full min-h-[300px] flex-col">
      <figure className="flex h-full flex-col">
        {/* As estrelas abrem o card como um selo. */}
        <Estrelas
          quantidade={ESTRELAS_CHEIAS}
          tamanho={16}
          rotulo={t('notaAcessivel', {n: ESTRELAS_CHEIAS})}
          className="estrelas-card"
        />

        {/* Aspas tipográficas de verdade em volta do texto: leitor de tela
            precisa saber que aquilo é citação de outra pessoa. */}
        <blockquote className="texto-depoimento">
          <p>
            {'“'}
            {t.rich(`itens.${ficha}.texto`, MARCAS)}
            {'”'}
          </p>
        </blockquote>

        <figcaption className="assinatura-depoimento">
          {/* alt vazio de propósito: a foto é decorativa, o nome está escrito
              ao lado em texto. width e height declarados reservam a caixa e
              evitam salto de layout quando a imagem chega.
              <img> DELIBERADO, não esquecimento: o arquivo já chega WebP de
              144x144 com 4 a 6 KB e é exibido a 52px, ou seja, já cobre 2,7x
              de densidade. O next/image só teria a acrescentar srcset,
              conversão de formato e lazy, e os três já estão resolvidos aqui;
              o que ele somaria é uma ida ao otimizador por foto. Mesmo
              critério já usado na hero e no processo. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="foto-depoimento"
            src={t(`itens.${ficha}.foto`)}
            alt=""
            width={52}
            height={52}
            loading="lazy"
            decoding="async"
          />
          <span className="nome-depoimento">{t(`itens.${ficha}.nome`)}</span>
          <span className="origem-depoimento">
            <Origem texto={t('origem')} />
          </span>
        </figcaption>
      </figure>
    </CardFicha>
  );
}

export function Depoimentos() {
  const t = useTranslations('depoimentos');
  const c = useTranslations('colecao');

  return (
    <section data-bloco="depoimentos" data-owner="catalogo" className="py-secao">
      <div className="conteudo">
        {/* LOCKUP EDITORIAL. A partir de 1024px a seção vira duas colunas: o
            título ancora em cima à esquerda, o "5,0" ancora embaixo à esquerda
            (empurrado por margin-top: auto) e a pilha ocupa a direita inteira.
            A tensão nessa diagonal é o que substitui o bloco centralizado
            sozinho no meio do Papel. Abaixo de 1024px vira uma coluna só, na
            ordem título, nota, pilha. */}
        <div className="lockup-depoimentos">
          <div className="coluna-nota" data-camada="frente">
            <h2 id="titulo-depoimentos">{t('titulo')}</h2>

            <div className="bloco-nota">
              <p className="linha-nota">
                <span className="numero-nota">{t('nota')}</span>
                <Estrelas
                  quantidade={ESTRELAS_CHEIAS}
                  tamanho={22}
                  rotulo={t('notaAcessivel', {n: ESTRELAS_CHEIAS})}
                />
              </p>

              {/* A linha inteira é o link, e ele leva ao lugar onde qualquer
                  pessoa confere o número. Prova conferível vale mais que
                  prova declarada. O NBSP antes da seta impede que ela caia
                  sozinha na linha de baixo. */}
              <a
                className="link-avaliacoes"
                href={PERFIL_AVALIACOES}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MarcaGoogle />
                {t('avaliacoes')}
                {'\u00A0'}
                <SetaExterna />
              </a>
            </div>
          </div>

          <div className="coluna-pilha" data-camada="meio">
            <PilhaCards
              tituloId="titulo-depoimentos"
              rotulos={{
                anterior: c('anterior'),
                proximo: c('proximo'),
                card: c('card'),
                de: c('de')
              }}
              cards={FICHAS.map((ficha) => (
                <CardDepoimento key={ficha} ficha={ficha} />
              ))}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
