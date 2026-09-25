import {useTranslations} from 'next-intl';
import {getPathname} from '@/i18n/navigation';
import type {Locale} from '@/i18n/routing';
import {botaoPrimario, Seta} from '@/components/ui/botoes';
import {BorderBeamPanel} from '@/components/ui/painel-facho';
import {VendaBaralho} from '@/components/home/venda-baralho';

// Bloco 6 do roteiro.md, sobre Céu. O bloco virou um BARALHO (21st 23997,
// prompt 2.33): o texto abre à esquerda, as cinco fotos formam a estante e o
// painel fecha embaixo com a linha do método e o CTA.
//
// Camadas: fundo = o halo no tom da foto ativa (dentro da ilha cliente);
// meio = o baralho; frente = texto, painel e CTA.
//
// DUAS peças do catálogo aqui, cada uma dona do próprio movimento e sem
// disputar propriedade nenhuma: o baralho (rAF interno escrevendo `transform`
// nos cards) e o Border Beam Panel (rAF interno escrevendo UMA custom
// property na borda). O GSAP do Passe 3 não toca em nenhum dos dois.
//
// O formulário curto embutido nasce no prompt das páginas internas.
export function Venda({locale}: {locale: Locale}) {
  const t = useTranslations('venda');
  // TODO: #market-review é a âncora do formulário de avaliação que nasce na
  // página Selling; manter o id lá igual a este.
  const hrefAvaliacao = `${getPathname({locale, href: '/selling'})}#market-review`;

  return (
    // overflow-hidden porque o halo sangra para fora da calha de propósito:
    // sem ele a página ganharia rolagem horizontal.
    <section
      data-bloco="venda"
      // A respiração do papel (caligrafia 3) pinta o Céu desta seção. A classe
      // bg-ceu FICA: ela é o estado sem JS e com movimento reduzido.
      data-fundo="ceu"
      className="relative overflow-hidden bg-ceu py-secao"
    >
      <div className="conteudo">
        <div data-camada="frente" className="max-w-[58ch]">
          {/* A cota ANCORADA (design.md: ela nunca aparece como traço solto):
              o fio de 1px em Lápis que organiza o documento, com a cota Avanço
              de 44x3px entrando pela borda, exatamente como na borda superior
              do card da casa. */}
          {/* data-cota vai no FIO, não na cota de 44px de dentro dele: a cota
              é filha absoluta do fio, então ela já é desenhada pelo scaleX do
              pai. Marcar os dois faria o traço da cota andar ao quadrado. */}
          <div data-cota aria-hidden="true" className="relative h-px w-full bg-lapis">
            <span className="absolute -top-px left-0 h-[3px] w-11 rounded-b-full bg-avanco" />
          </div>

          <h2 className="mt-7 max-w-[22ch]">{t('titulo')}</h2>
          {/* `text-balance` e não o `pretty` global do corpo: este parágrafo é
              o apoio colado no h2, e MEDIDO (Range API) ele fechava com a
              última linha em 22,6% da largura no desktop, abaixo da régua de
              30% do projeto. O balance divide as linhas e leva para 56,7%,
              sem <br>, sem NBSP na mão e recalculando em toda largura e nos
              dois idiomas. No celular ele não piora nada (medido em 390 e
              320). */}
          <p className="mt-5 text-balance">{t('texto2')}</p>
        </div>

        <VendaBaralho className="mt-12 lg:mt-14" />

        <BorderBeamPanel
          beams={2}
          // Avanço e o azul claro que as portas usam. Mesmas props do bloco 11.
          colors={['#2A6DD6', '#8FC0FF']}
          // 3, e não os 2 do bloco 11: lá o facho corre sobre a Tinta, aqui ele
          // corre sobre o Céu, e 2px de azul claro sobre claro some.
          thickness={3}
          radius={14}
          idleSpeed={22}
          hoverSpeed={110}
          glow
          // A ÚNICA diferença de material para o bloco 11: lá o painel é um véu
          // de Papel sobre a Tinta; aqui ele está sobre o Céu e precisa de
          // corpo, senão a copy fica sem chão. Vidro CLARO, nunca escuro.
          className="relative z-[1] mx-auto mt-10 max-w-[760px] border-transparent bg-[rgb(255_255_255_/_0.78)] p-6 backdrop-blur-[10px] min-[821px]:p-8"
        >
          <div className="flex flex-col gap-6 min-[821px]:flex-row min-[821px]:items-center min-[821px]:gap-10">
            <p className="min-[821px]:flex-1">{t('texto1')}</p>
            <a
              href={hrefAvaliacao}
              className={`${botaoPrimario} min-[821px]:shrink-0`}
            >
              {t('cta')}
              <Seta className="group-hover:translate-x-[3px]" />
            </a>
          </div>
        </BorderBeamPanel>
      </div>
    </section>
  );
}
