// Página original (21st.dev): https://21st.dev/@0xUrvish/components/fluid-expanding-grid
// Licença: MIT, Copyright (c) 2025 Urvish Mali. Créditos completos em CREDITOS.md.
'use client';

/* =============================================================================
   PORTAS DOS CAMINHOS  ·  bloco 2 da home  ·  "Onde você está agora?"
   -----------------------------------------------------------------------------
   Base: Fluid Expanding Grid, 21st.dev id 10467, de @0xUrvish.
   https://21st.dev/@0xUrvish/components/fluid-expanding-grid

   A MECÂNICA DO COMPONENTE ESTÁ INTACTA e não deve ser alterada:
     · grade 2 colunas x 2 linhas, ALTURA FIXA (a seção nunca cresce)
     · estado { row1, row2 }; com 3 itens, o que fica sozinho na sua linha é o ABERTO
     · handleExpand troca o item com o vizinho da linha, exatamente como o original
     · motion layout + layoutId com mola de tipo spring (a CONSTANTE mudou:
       ver "6. a mola" abaixo)
     · borderRadius 32 na máscara, no degradê e na borda
     · object-position de "center 50%" (fechada) para "center 35%" (aberta)

   O QUE FOI ADAPTADO, e só isto (decisão do Gabriel, 31/08, "Saída 1"):
     1. saiu o whitespace-nowrap do subtítulo, para a frase do roteiro poder quebrar
     2. entrou o CTA, que o componente original não tinha
     3. a palavra-âncora entrou em Instrument Serif Italic (a fonte da hero)
     4. preto virou Tinta (#0E2440); o degradê é mais forte na porta ABERTA,
        porque só ela mostra frase e CTA, e mais leve na fechada, para a foto aparecer
     5. a ordem da lista é vender, primeiro, comprar: assim "Quero comprar" nasce
        ABERTA (decisão comercial do Gabriel, 31/08)
     6. a mola foi de 100/25 (assentava em ~800ms) para 260/32, e as durações
        das transições caíram junto: a coreografia inteira ia a ~1000ms, lenta
        demais para hover, e o card ficava para trás do ponteiro (01/09)

   AJUSTES DE INTEGRAÇÃO no projeto (nada de mecânica):
     · imports do projeto: getPathname de @/i18n/navigation resolve o pathname
       localizado (buying/comprar, selling/vender), e o namespace é "caminhos"
     · a fronteira de tamanho é 821px, não o md: do Tailwind (768px), porque o
       mock aprovado usa max-width:820px. Sem isso a faixa 768-820 ficava com a
       altura de desktop enquanto a seção ainda estava em modo celular
     · a palavra-âncora usa a classe .ancora do globals.css, que já é a
       Instrument Serif Italic instalada no projeto
     · prefers-reduced-motion: a mola vira troca instantânea (a porta continua
       funcionando, sem transição), conforme o movimento.md

   Referência visual aprovada: ..\mock-secao2.html (roda este mesmo componente).
   ========================================================================== */

import {useRef, useState} from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {LayoutGroup, motion, useReducedMotion} from 'framer-motion';
import {useLocale, useTranslations} from 'next-intl';
import {getPathname} from '@/i18n/navigation';
import type {AppPathname, Locale} from '@/i18n/routing';

type Porta = {
  id: string;
  rota: AppPathname;
  hash?: string;
  imagem: string;
  /** a palavra-âncora sai em serifada itálica */
  chaveTitulo: string;
  chaveApoio: string;
  chaveCta: string;
};

/* ordem = vender, primeiro, comprar → "comprar" fica sozinha na linha 2 e nasce aberta */
const PORTAS: Porta[] = [
  {
    id: 'vender',
    rota: '/selling',
    imagem: '/portas/porta-vender.webp',
    chaveTitulo: 'vender.titulo',
    chaveApoio: 'vender.apoio',
    chaveCta: 'vender.cta'
  },
  {
    id: 'primeiro',
    rota: '/buying',
    hash: 'first-home',
    imagem: '/portas/porta-primeiro.webp',
    chaveTitulo: 'primeiro.titulo',
    chaveApoio: 'primeiro.apoio',
    chaveCta: 'primeiro.cta'
  },
  {
    id: 'comprar',
    rota: '/buying',
    imagem: '/portas/porta-comprar.webp',
    chaveTitulo: 'comprar.titulo',
    chaveApoio: 'comprar.apoio',
    chaveCta: 'comprar.cta'
  }
];

const Seta = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.9"
    strokeLinecap="round"
    strokeLinejoin="round"
    vectorEffect="non-scaling-stroke"
    aria-hidden="true"
    className="transition-transform duration-[350ms] ease-[cubic-bezier(.22,1,.36,1)] group-hover:translate-x-[5px]"
  >
    <path d="M5 12h13M13 6l6 6-6 6" />
  </svg>
);

/**
 * Aparelho com ponteiro fino e hover de verdade (mouse, trackpad). Num celular
 * isto é falso, e o mouseenter que o toque emula deixa de abrir a porta.
 */
function temHoverDeVerdade() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(hover: hover) and (pointer: fine)').matches
  );
}

/** Distingue foco de TECLADO de foco dado pelo toque ou pelo clique. */
function focoDeTeclado(el: HTMLElement) {
  try {
    return el.matches(':focus-visible');
  } catch {
    // Navegador sem :focus-visible: melhor abrir a mais do que travar o teclado.
    return true;
  }
}

/** A headline vem do next-intl como "Quero |comprar|." e a parte entre barras sai serifada. */
function TituloComAncora({texto}: {texto: string}) {
  const partes = texto.split('|');
  return (
    <>
      {partes.map((p, i) =>
        i % 2 === 1 ? (
          <em key={i} className="ancora tracking-normal">
            {p}
          </em>
        ) : (
          <span key={i}>{p}</span>
        )
      )}
    </>
  );
}

export function PortasDosCaminhos({id = 'portas'}: {id?: string}) {
  const t = useTranslations('caminhos');
  const locale = useLocale() as Locale;
  const reduzido = useReducedMotion();

  const [layout, setLayout] = useState(() => {
    const ids = PORTAS.map((p) => p.id);
    return {row1: ids.slice(0, 2), row2: ids.slice(2, Math.min(PORTAS.length, 4))};
  });

  // Estado da porta no INÍCIO do gesto (toque, clique ou tecla). Só há um
  // gesto por vez, então uma referência só basta para as três portas.
  const abertaAoIniciarGesto = useRef(false);

  /* IDÊNTICO ao componente original: não reescrever */
  const handleExpand = (alvo: string) => {
    const inRow1 = layout.row1.includes(alvo);
    const inRow2 = layout.row2.includes(alvo);
    if ((inRow1 && layout.row1.length === 1) || (inRow2 && layout.row2.length === 1)) return;
    if (inRow1) {
      const vizinho = layout.row1.find((i) => i !== alvo)!;
      setLayout({
        row1: [alvo],
        row2: [vizinho, ...layout.row2.filter((i) => i !== vizinho)].slice(0, 2)
      });
    } else {
      const vizinho = layout.row2.find((i) => i !== alvo)!;
      setLayout({
        row1: [vizinho, ...layout.row1.filter((i) => i !== vizinho)].slice(0, 2),
        row2: [alvo]
      });
    }
  };

  // 260/32 dá amortecimento de ~0,99, ou seja, assenta em ~250ms SEM passar do
  // ponto. Não é a mola do componente original (100/25, ~800ms para assentar):
  // é a mesma mola com a constante certa para gesto de hover, onde o card tem
  // que acompanhar o ponteiro em vez de ficar para trás.
  // Sob prefers-reduced-motion a troca é instantânea: a porta continua
  // abrindo, sem o movimento (movimento.md).
  const molaLayout = reduzido
    ? {duration: 0}
    : {type: 'spring' as const, stiffness: 260, damping: 32};

  return (
    <LayoutGroup id={id}>
      <motion.div
        layout
        className="grid h-[min(66svh,500px)] w-full grid-cols-2 grid-rows-2 gap-4
                   min-[821px]:h-[clamp(430px,50vw,660px)] min-[821px]:gap-5
                   min-[1025px]:gap-6"
      >
        {PORTAS.map((porta) => {
          const isRow1 = layout.row1.includes(porta.id);
          const linha = isRow1 ? layout.row1 : layout.row2;
          const aberta = linha.length === 1 && linha[0] === porta.id;

          const gridRow = isRow1 ? 1 : 2;
          const gridColumn = aberta
            ? '1 / span 2'
            : isRow1
              ? layout.row1.indexOf(porta.id) === 0
                ? '1'
                : '2'
              : layout.row2.indexOf(porta.id) === 0
                ? '1'
                : '2';

          // Pathname localizado (buying/comprar, selling/vender) + âncora
          const destino =
            getPathname({locale, href: porta.rota}) + (porta.hash ? `#${porta.hash}` : '');

          return (
            <motion.div
              key={porta.id}
              layoutId={`${id}-${porta.id}`}
              style={{gridRow, gridColumn}}
              className={`relative min-h-0 min-w-0 ${aberta ? 'z-30' : 'z-10'}`}
              transition={{layout: molaLayout}}
            >
              <Link
                href={destino}
                data-aberta={aberta ? '1' : '0'}
                aria-label={t(porta.chaveTitulo).replace(/\|/g, '')}
                // Abrir por HOVER é gesto de aparelho com ponteiro fino. No
                // celular o toque dispara um mouseenter emulado, e era ele que
                // abria a porta ANTES do clique: no clique ela já estava aberta,
                // o guard não segurava, e a pessoa ia para a página sem ter lido
                // o card. A pergunta é feita na hora do evento, nunca na
                // renderização, para não haver divergência de hidratação.
                onMouseEnter={() => {
                  if (temHoverDeVerdade()) handleExpand(porta.id);
                }}
                // Abrir por FOCO é gesto de teclado. Sem :focus-visible, o foco
                // que o próprio toque dá no link abria a porta pelo mesmo caminho.
                onFocus={(e) => {
                  if (focoDeTeclado(e.currentTarget)) handleExpand(porta.id);
                }}
                // Trava final, independente de ordem de evento: quem decide se
                // navega é o estado de ANTES do gesto, não o do momento do clique.
                onPointerDown={() => {
                  abertaAoIniciarGesto.current = aberta;
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') abertaAoIniciarGesto.current = aberta;
                }}
                onClick={(e) => {
                  if (!abertaAoIniciarGesto.current) {
                    e.preventDefault();
                    handleExpand(porta.id);
                  }
                }}
                className="group absolute inset-0 block rounded-[32px] text-white no-underline
                           focus-visible:outline-2 focus-visible:outline-offset-4
                           focus-visible:outline-[#2A6DD6]"
              >
                {/* matéria */}
                <motion.div
                  layoutId={`${id}-${porta.id}-mask-wrapper`}
                  className="absolute inset-0 overflow-hidden bg-lapis"
                  style={{borderRadius: 32}}
                >
                  <Image
                    src={porta.imagem}
                    alt=""
                    fill
                    sizes="(max-width: 820px) 100vw, 860px"
                    className={`object-cover transition-[object-position] duration-500 ease-in-out
                                ${aberta ? 'object-[center_35%]' : 'object-[center_50%]'}`}
                  />
                  <motion.div
                    layoutId={`${id}-${porta.id}-mask`}
                    className="absolute inset-0 transition-colors duration-350"
                    style={{backgroundColor: aberta ? 'rgba(14,36,64,0)' : 'rgba(14,36,64,.12)'}}
                  />
                </motion.div>

                {/* degradê: mais forte na porta aberta, que carrega frase e CTA.
                    O reforço de tela estreita segue o MESMO desenho do degradê
                    normal, só um pouco mais forte na base. Ele NÃO pode ser
                    incondicional: a porta fechada não carrega parágrafo, e o
                    véu pesado da aberta virava chapa azul sobre a foto dela. */}
                <motion.div
                  layoutId={`${id}-${porta.id}-overlay`}
                  className={`pointer-events-none absolute inset-0 ${
                    aberta
                      ? 'max-[380px]:!bg-[linear-gradient(to_top,rgba(14,36,64,.94)_0%,rgba(14,36,64,.86)_26%,rgba(14,36,64,.62)_48%,rgba(14,36,64,.26)_72%,transparent_92%)]'
                      : 'max-[380px]:!bg-[linear-gradient(to_top,rgba(14,36,64,.90)_0%,rgba(14,36,64,.64)_20%,rgba(14,36,64,.24)_40%,transparent_62%)]'
                  }`}
                  style={{
                    borderRadius: 32,
                    background: aberta
                      ? 'linear-gradient(to top, rgba(14,36,64,0.95) 0%, rgba(14,36,64,0.90) 30%, rgba(14,36,64,0.72) 52%, rgba(14,36,64,0.32) 74%, transparent 92%)'
                      : 'linear-gradient(to top, rgba(14,36,64,0.88) 0%, rgba(14,36,64,0.60) 22%, rgba(14,36,64,0.20) 42%, transparent 60%)'
                  }}
                />
                <motion.div
                  layoutId={`${id}-${porta.id}-border`}
                  className="pointer-events-none absolute inset-0 border border-white/10
                             transition-colors duration-300 group-hover:border-white/20"
                  style={{borderRadius: 32}}
                />

                {/* ------- camada de texto: a única parte adaptada -------
                    leading-[normal] é obrigatório: o body do projeto tem
                    line-height 1.6 e o mock aprovado herda "normal". Título e
                    apoio não sentem (têm leading próprio), mas o CTA é uma
                    caixa inline, então a entrelinha do container virava altura
                    de linha em volta dele. Somando os 5,6px do próprio CTA com
                    2,7px de meia-entrelinha, a coluna (ancorada embaixo)
                    subia 8,3px e o título caía sobre a parte clara da foto:
                    2,51:1 medido em 540px, contra os 3,94:1 do mock. */}
                <motion.div
                  layout="position"
                  className="pointer-events-none absolute inset-0 z-10 flex select-none flex-col
                             justify-end p-[15px] leading-[normal]
                             min-[381px]:p-[18px] min-[821px]:p-6"
                >
                  <motion.div layout="position" className="overflow-hidden">
                    {/* a cota que se traça, caligrafia 1 do movimento.md */}
                    <motion.span
                      layout="position"
                      className={`mb-[14px] block h-[1.5px] bg-[#8FC0FF]
                                  transition-[width] delay-[120ms] duration-[380ms]
                                  ease-[cubic-bezier(.22,1,.36,1)] ${aberta ? 'w-12' : 'w-0'}`}
                    />
                    {/* text-white é OBRIGATÓRIO e não é redundante: o globals.css
                        pinta h1 a h4 com a Tinta na camada base, direto no
                        elemento, e regra direta ganha do text-white que o link
                        passaria por herança. Sem esta classe o título saía em
                        #0E2440 sobre degradê navy, quase invisível, enquanto a
                        frase e o CTA (que têm cor própria) saíam brancos. */}
                    <motion.h3
                      layout="position"
                      className={`mb-2 font-semibold leading-[1.12] tracking-[-.02em] text-white
                                  [text-shadow:0_1px_20px_rgba(14,36,64,.55)]
                                  ${
                                    aberta
                                      ? 'text-[23px] min-[381px]:text-[25px] min-[821px]:text-[clamp(26px,2.5vw,34px)]'
                                      : 'text-[17.5px] min-[381px]:text-[19px] min-[821px]:text-[22px]'
                                  }`}
                    >
                      <TituloComAncora texto={t(porta.chaveTitulo)} />
                    </motion.h3>

                    {/* sem whitespace-nowrap: a frase do roteiro quebra */}
                    <motion.p
                      layout="position"
                      aria-hidden={!aberta}
                      className={`overflow-hidden leading-[1.5] text-white/90
                                  [text-shadow:0_1px_14px_rgba(14,36,64,.6)]
                                  text-[14px] min-[381px]:text-[14.5px] min-[821px]:text-[15px]
                                  max-w-[26ch] min-[381px]:max-w-[30ch] min-[821px]:max-w-[38ch]
                                  transition-[max-height,opacity,margin-bottom] duration-[320ms]
                                  ease-[cubic-bezier(.22,1,.36,1)]
                                  ${
                                    aberta
                                      ? 'mb-[14px] max-h-[140px] opacity-100 delay-[60ms] min-[821px]:mb-4 min-[821px]:max-h-[120px]'
                                      : 'mb-0 max-h-0 opacity-0'
                                  }`}
                    >
                      {t(porta.chaveApoio)}
                    </motion.p>

                    <motion.span
                      layout="position"
                      aria-hidden={!aberta}
                      className={`relative inline-flex items-center gap-2 overflow-hidden pb-1.5
                                  text-[13.5px] font-semibold text-white
                                  after:absolute after:bottom-0 after:left-0 after:h-[1.5px]
                                  after:w-[26px] after:bg-[#8FC0FF] after:transition-[width]
                                  after:duration-500 after:ease-[cubic-bezier(.22,1,.36,1)]
                                  after:content-[''] group-hover:after:w-full
                                  transition-[max-height,opacity] duration-[320ms]
                                  ease-[cubic-bezier(.22,1,.36,1)]
                                  ${aberta ? 'max-h-10 opacity-100 delay-[110ms]' : 'max-h-0 opacity-0'}`}
                    >
                      {t(porta.chaveCta)} <Seta />
                    </motion.span>
                  </motion.div>
                </motion.div>
              </Link>
            </motion.div>
          );
        })}
      </motion.div>
    </LayoutGroup>
  );
}

export default PortasDosCaminhos;
