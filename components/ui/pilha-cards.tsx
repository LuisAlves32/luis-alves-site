// Página original (21st.dev): https://21st.dev/@educalvolpz/components/scrollable-card-stack
// Licença: MIT, Copyright (c) 2024 Eduardo Calvo. Créditos completos em CREDITOS.md.
'use client';

import {useCallback, useRef, useState} from 'react';
import {motion, useReducedMotion} from 'framer-motion';

// Origem: 21st.dev, "Scrollable Card Stack" de educalvolpz (demo 25296),
// escolhido pelo diretor para as coleções da home (Passe 2). A seção que usa
// esta pilha tem DONO de movimento: o Framer Motion daqui dentro; o GSAP do
// Passe 3 não toca nestes elementos (movimento.md, posse por seção).
//
// Passada de tokens (design.md) e travas do aceite aplicadas sobre o original:
// - REMOVIDA a interceptação de wheel (preventDefault): a roda do mouse rola
//   a página normalmente através da seção; sem scroll-hijack.
// - O toque vertical ficou LIVRE (touch-action: pan-y): o dedo rola a página;
//   a troca de card é por arrasto HORIZONTAL (pointer events, mouse e toque).
// - Setas anteriores/próxima adicionadas (lapis/avanco, alvo de 44px).
// - Teclado: setas esquerda/direita, Home e End (cima/baixo seguem com a
//   página). Foco visível pelo sublinhado-cota global.
// - prefers-reduced-motion: grade estática simples com os MESMOS cards,
//   conteúdo integral, sem parallax, blur ou transição.
// - Sem autoplay de qualquer tipo (o original já não tinha; continua não
//   tendo). A mecânica de pilha, o spring e o fade/blur de saída são do
//   componente original.
const DESLOCAMENTO_FRAME = -30;
const FRAMES_VISIVEIS = 3;
const FATOR_ESCALA = 0.08;
const INTERVALO_MINIMO = 350;
const LIMIAR_ARRASTO = 48;

const MOLA = {type: 'spring', stiffness: 250, damping: 20, mass: 0.5} as const;

function Seta({sentido}: {sentido: 'anterior' | 'proximo'}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-5"
    >
      {sentido === 'anterior' ? (
        <path d="M15 6l-6 6 6 6" />
      ) : (
        <path d="M9 6l6 6-6 6" />
      )}
    </svg>
  );
}

export function PilhaCards({
  cards,
  tituloId,
  rotulos,
  className = ''
}: {
  cards: React.ReactNode[];
  tituloId: string;
  rotulos: {anterior: string; proximo: string; card: string; de: string};
  className?: string;
}) {
  const [indice, setIndice] = useState(0);
  const travadoAte = useRef(0);
  const ponteiro = useRef<{x: number; y: number; consumido: boolean} | null>(null);
  const reduzido = useReducedMotion();
  const total = cards.length;
  const ultimo = total - 1;

  const irPara = useCallback(
    (destino: number) => {
      const alvo = Math.min(Math.max(destino, 0), ultimo);
      const agora = Date.now();
      if (alvo === indice || agora < travadoAte.current) return;
      travadoAte.current = agora + INTERVALO_MINIMO;
      setIndice(alvo);
    },
    [indice, ultimo]
  );

  // Grade estática integral com reduced-motion: nada escondido atrás de
  // interação, nenhum controle necessário.
  if (reduzido) {
    return (
      <div className={`grid gap-6 md:grid-cols-3 ${className}`}>{cards}</div>
    );
  }

  return (
    <div
      role="group"
      aria-labelledby={tituloId}
      tabIndex={0}
      className={`relative mx-auto w-full select-none ${className}`}
      style={{touchAction: 'pan-y'}}
      onKeyDown={(e) => {
        switch (e.key) {
          case 'ArrowLeft':
            e.preventDefault();
            irPara(indice - 1);
            break;
          case 'ArrowRight':
            e.preventDefault();
            irPara(indice + 1);
            break;
          case 'Home':
            e.preventDefault();
            irPara(0);
            break;
          case 'End':
            e.preventDefault();
            irPara(ultimo);
            break;
        }
      }}
      onPointerDown={(e) => {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        ponteiro.current = {x: e.clientX, y: e.clientY, consumido: false};
      }}
      onPointerMove={(e) => {
        const p = ponteiro.current;
        if (!p || p.consumido) return;
        const dx = e.clientX - p.x;
        const dy = e.clientY - p.y;
        if (Math.abs(dx) > LIMIAR_ARRASTO && Math.abs(dx) > Math.abs(dy)) {
          p.consumido = true;
          irPara(indice + (dx < 0 ? 1 : -1));
        }
      }}
      onPointerUp={() => {
        ponteiro.current = null;
      }}
      onPointerCancel={() => {
        ponteiro.current = null;
      }}
      onPointerLeave={() => {
        ponteiro.current = null;
      }}
    >
      {/* Respiro para os frames de trás subirem (3 frames x 30px) */}
      <div className="pt-[96px]">
        {/* TODOS os cards na MESMA célula de grade. A linha cresce sozinha até
            o card mais alto e cada card ocupa a altura cheia.
            Isto substituiu um sizer invisível que era `cards[0]`: a altura do
            conjunto era a do PRIMEIRO card e os outros ficavam `absolute
            inset-0` dentro dela. Funcionou enquanto os cards eram fichas
            esqueléticas idênticas; com conteúdo real de tamanhos diferentes o
            card mais longo vazava por baixo e o mais curto era esticado até a
            altura do primeiro, jogando o rodapé contra a parede.
            Item de grade aceita `z-index` sem precisar de `position`, e
            `transform` não entra no cálculo de layout: a linha é medida com os
            cards em escala 1, então a escala e o deslocamento dos frames de
            trás continuam iguais. */}
        <div className="grid cursor-grab">
          {cards.map((card, i) => {
            const distancia = i - indice;
            const passou = distancia < 0;
            return (
              <motion.div
                key={i}
                aria-hidden={i !== indice}
                initial={false}
                animate={{
                  scale: Math.max(1 - distancia * FATOR_ESCALA, FATOR_ESCALA),
                  y: Math.max(
                    distancia * DESLOCAMENTO_FRAME,
                    DESLOCAMENTO_FRAME * FRAMES_VISIVEIS
                  )
                }}
                transition={MOLA}
                className="col-start-1 row-start-1"
                style={{
                  zIndex: total - i,
                  opacity: passou ? 0 : 1,
                  filter: passou ? 'blur(2px)' : 'blur(0px)',
                  pointerEvents: i === indice ? 'auto' : 'none',
                  transitionProperty: 'opacity, filter',
                  transitionDuration: '200ms',
                  transitionTimingFunction: 'cubic-bezier(0.645, 0.045, 0.355, 1)',
                  willChange: 'transform, opacity, filter'
                }}
              >
                {card}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* 28px de respiro entre a base da pilha e os controles: com 24px o dot
          quase encostava no card mais alto depois da mudança para grade. */}
      <div className="mt-7 flex items-center justify-center gap-2">
        <button
          type="button"
          aria-label={rotulos.anterior}
          disabled={indice === 0}
          onClick={() => irPara(indice - 1)}
          className="flex size-11 items-center justify-center rounded-full border border-lapis bg-white text-tinta transition-colors duration-200 hover:border-avanco hover:text-avanco active:scale-[0.98] disabled:pointer-events-none disabled:border-lapis/50 disabled:text-lapis"
        >
          <Seta sentido="anterior" />
        </button>
        {cards.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`${rotulos.card} ${i + 1} ${rotulos.de} ${total}`}
            aria-current={i === indice}
            onClick={() => irPara(i)}
            className="flex size-11 items-center justify-center"
          >
            <span
              className={`size-2 rounded-full transition-all duration-200 ${
                i === indice ? 'scale-125 bg-avanco' : 'bg-lapis hover:bg-grafite/40'
              }`}
            />
          </button>
        ))}
        <button
          type="button"
          aria-label={rotulos.proximo}
          disabled={indice === ultimo}
          onClick={() => irPara(indice + 1)}
          className="flex size-11 items-center justify-center rounded-full border border-lapis bg-white text-tinta transition-colors duration-200 hover:border-avanco hover:text-avanco active:scale-[0.98] disabled:pointer-events-none disabled:border-lapis/50 disabled:text-lapis"
        >
          <Seta sentido="proximo" />
        </button>
      </div>

      <div aria-live="polite" className="sr-only">
        {`${rotulos.card} ${indice + 1} ${rotulos.de} ${total}`}
      </div>
    </div>
  );
}
