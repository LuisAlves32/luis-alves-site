// Página original (21st.dev): https://21st.dev/@uilayout.contact/components/framer-moveable-thumbnails
// Licença: MIT, Copyright (c) 2024 UI LAYOUT. Créditos completos em CREDITOS.md.
import type {ReactNode} from 'react';
import Image from 'next/image';
import {useTranslations} from 'next-intl';
import type {Locale} from '@/i18n/routing';
import {FilmeMiniaturas} from '@/components/ui/filme-miniaturas';

/* ==========================================================================
   VENDIDOS RECENTEMENTE · filme de miniaturas
   Origem: Framer Moveable Thumbnails, 21st.dev id 19086 (uilayout.contact),
   em components/ui/filme-miniaturas.tsx.

   QUEM USA: só a HOME, por components/home/vendidos-home.tsx. Eram duas telas
   até o 2.38; a página de imóveis saiu do site no 2.39 e está guardada em
   _arquivo/listings/. O componente continua recebendo o rodapé por prop, que é
   o que o mantém reaproveitável: quando a página de imóveis voltar, ela volta
   passando o rodapé dela, sem tocar aqui.

   A MECÂNICA (2.36, no lugar da pilha por rolagem do 2.35): UMA foto grande
   por vez, com um filme de miniaturas ao lado que troca a foto. A troca é o
   ARRASTO do componente, com mola, e vale igual no dedo e no mouse. Altura
   FIXA: a seção não cresce com o número de imóveis e nunca prende a rolagem.
   Por que a pilha morreu: cada imóvel virava uma seção de 100svh com o card
   limitado a 74-78svh no meio, o que deixava vazio em cima e embaixo de cada
   item, levava a seção a ~4 telas e prendia o visitante.

   A GEOMETRIA é uma regra só, sem breakpoint (.vendidos-palco no
   globals.css): no desktop o teto de 62svh manda e a coluna fica AO LADO da
   foto, então o endereço aparece junto com ela; no celular a largura manda e
   a coluna DESCE, por flex-wrap. Não existe segundo layout de celular aqui.

   O QUE A MECÂNICA NOVA DEVOLVEU: a pilha dependia de position:sticky, que
   morre se qualquer ANCESTRAL ganhar transform, filter ou will-change, e por
   isso o miolo não podia receber data-camada. Sem sticky essa restrição
   acabou, e a seção volta a poder participar da câmera do Passe 3: a foto é
   camada "meio", a ficha é camada "frente". O data-owner="catalogo" continua
   valendo, então o GSAP não escreve nos elementos internos do componente.

   PREÇO NÃO ENTRA. Nem list price, nem preço de venda, nem prazo, nem
   percentual sobre o pedido. A fonte pública mostra LIST PRICE, que não é
   preço de venda, e exibir um pelo outro seria impreciso. É a mesma regra
   que o bloco imoveis-vendidos já trazia escrita ("sem dado confidencial").
   ========================================================================== */

export type ImovelVendido = {
  arquivo: string;
  /** Rua e unidade, como na fonte. Vai no h3. */
  endereco: string;
  /** Bairro e cidade. */
  local: string;
  /** Quartos, banheiros e área. Muda por idioma. */
  specs: string;
  /** Listing agent ou Buyer's agent. Fica em INGLÊS nos dois idiomas: é o
      termo do mercado imobiliário canadense e é assim que a fonte escreve. */
  papel: string;
  /** Mês do fechamento. Muda por idioma. */
  mes: string;
  /** object-position. Vale nos DOIS tamanhos desde o 2.36: o herói é 16:9 no
      desktop e no celular, então o recorte é o mesmo nos dois. Sair de 3:2
      para 16:9 corta ~15% da altura, metade em cima e metade embaixo, e nas
      quatro fotos atuais isso é aceitável. */
  posicao: string;
};

/* Endereço, local, specs e mês são DADOS, não copy de marketing: vivem aqui
   como texto literal, com a variante por idioma onde ela existe, e NÃO viram
   chave de tradução. */
export function imoveisVendidos(locale: Locale): ImovelVendido[] {
  const pt = locale === 'pt';
  return [
    {
      arquivo: '/vendidos/vendido-1-walnut-grove-langley.webp',
      endereco: 'C405 – 8929 202 Street',
      local: 'Walnut Grove, Langley',
      specs: pt ? '2 quartos · 2 banheiros · 895 sf' : '2 bd · 2 ba · 895 sf',
      papel: 'Listing agent',
      mes: 'Jan 2026',
      posicao: '50% 50%'
    },
    {
      arquivo: '/vendidos/vendido-2-harbourside-north-vancouver.webp',
      endereco: '628 – 723 W 3rd Street',
      local: 'Harbourside, North Vancouver',
      specs: pt ? '2 quartos · 2 banheiros · 921 sf' : '2 bd · 2 ba · 921 sf',
      papel: "Buyer's agent",
      mes: 'Jan 2026',
      posicao: '50% 50%'
    },
    {
      arquivo: '/vendidos/vendido-3-mahon-central-lonsdale.webp',
      endereco: '1911 Mahon Avenue',
      local: 'Central Lonsdale, North Vancouver',
      specs: pt ? '3 quartos · 3 banheiros · 1.911 sf' : '3 bd · 3 ba · 1,911 sf',
      papel: 'Listing agent',
      mes: 'Nov 2025',
      posicao: '46% 50%'
    },
    {
      arquivo: '/vendidos/vendido-4-sunnyside-park-surrey.webp',
      endereco: '25 – 2780 150 Street',
      local: 'Sunnyside Park, Surrey',
      specs: pt ? '3 quartos · 3 banheiros · 1.560 sf' : '3 bd · 3 ba · 1,560 sf',
      papel: "Buyer's agent",
      mes: pt ? 'Abr 2025' : 'Apr 2025',
      posicao: '50% 50%'
    }
  ];
}

/** URL pública da lista completa de vendas do Luis no REW. */
export const REW_VENDAS =
  'https://www.rew.ca/agents/273435/luis-martins-alves/past-sales';

type VendidosProps = {
  /** Título da seção. Vem do i18n (paginaImoveis.soldTitulo). */
  titulo: string;
  /** id do h2, para o aria-labelledby da seção. */
  tituloId: string;
  /** Etiqueta da pílula (paginaImoveis.etiquetaSold). */
  etiquetaSold: string;
  itens: ImovelVendido[];
  /** Saídas do rodapé da seção. Hoje só a home passa este prop; a prop existe
      para que a página de imóveis possa voltar com o rodapé dela. */
  rodape?: ReactNode;
};

export function Vendidos({
  titulo,
  tituloId,
  etiquetaSold,
  itens,
  rodape
}: VendidosProps) {
  const c = useTranslations('colecao');

  /* As fotos são DECORATIVAS (alt=""): o endereço está no h3 da ficha e é ele
     que o leitor de tela anuncia. Descrever as quatro fotos seria inventar
     copy. draggable={false} porque o arrasto nativo da imagem disputaria com
     o arrasto do componente. */
  const quadros = itens.map((imovel) => ({
    principal: (
      <div data-camada="meio" className="relative h-full w-full bg-tinta">
        <Image
          src={imovel.arquivo}
          alt=""
          fill
          sizes="(max-width: 900px) 100vw, 930px"
          style={{objectPosition: imovel.posicao}}
          className="object-cover"
          draggable={false}
        />
      </div>
    ),
    miniatura: (
      <div className="relative h-full w-full bg-tinta">
        <Image
          src={imovel.arquivo}
          alt=""
          fill
          sizes="140px"
          style={{objectPosition: imovel.posicao}}
          className="object-cover"
          draggable={false}
        />
      </div>
    )
  }));

  /* A FICHA. Fica AO LADO da foto no desktop e ABAIXO dela no celular, e é
     ela que carrega a informação: a fotografia fica limpa, sem scrim, sem
     contador e sem etiqueta por cima. Quem indica posição e total é o filme
     de miniaturas, então um contador "01 / 04" seria redundância. */
  const lateral = itens.map((imovel) => (
    <div key={imovel.arquivo} data-camada="frente">
      <p className="text-[12px] font-extrabold uppercase leading-none tracking-[0.15em] text-avanco">
        {imovel.papel}
      </p>
      <h3 className="mt-3 text-[20px] font-bold text-tinta md:text-[23px]">
        {imovel.endereco}
      </h3>
      {/* Local, specs e mês na MESMA linha corrida. Formatação em linha (e
          não em flex) de propósito: em flex os itens viram blocos e o espaço
          entre eles some do texto, então o leitor de tela ouviria
          "895 sfJan 2026" grudado. Em linha o espaço é texto de verdade e a
          leitura sai correta. */}
      <p className="mt-2 text-[14.5px] leading-relaxed text-grafite">
        <span>{imovel.local}</span> · <span>{imovel.specs}</span>{' '}
        {/* Fio de 1px, a versão silenciosa da linha do documento. Separa as
            specs do mês sem acrescentar um segundo ponto médio à linha. */}
        <span
          aria-hidden="true"
          className="mx-1 inline-block h-3 w-px translate-y-[2px] bg-lapis"
        />{' '}
        {/* O mês e a pílula SOLD descem JUNTOS: com a pílula a 12px (piso de legibilidade,
            24/09/2026) ela sozinha abria uma última linha curta ("2026 Sold"). */}
        <span className="whitespace-nowrap">
          <span>{imovel.mes}</span>{' '}
          <span className="ml-1 inline-block whitespace-nowrap rounded-full border border-lapis bg-white px-2 py-[3px] align-middle text-[12px] font-semibold uppercase tracking-[0.17em] text-tinta">
            {etiquetaSold}
          </span>
        </span>
      </p>
    </div>
  ));

  return (
    <section
      data-bloco="vendidos"
      data-owner="catalogo"
      aria-labelledby={tituloId}
      className="py-secao"
    >
      <div className="conteudo">
        <div data-camada="frente">
          <h2 id={tituloId}>{titulo}</h2>
          {/* TODO: parágrafo de apoio desta seção depende de aprovação do
              cliente. O roteiro.md não entrega apoio para os vendidos, e
              escrever um aqui seria inventar copy. */}
        </div>

        <FilmeMiniaturas
          className="mt-10"
          quadros={quadros}
          lateral={lateral}
          rotulos={{
            anterior: c('anterior'),
            proximo: c('proximo'),
            card: c('card'),
            de: c('de')
          }}
        />

        {rodape ? (
          <div data-camada="frente" className="mt-12">
            {rodape}
          </div>
        ) : null}
      </div>
    </section>
  );
}
