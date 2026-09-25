// Página original (21st.dev): https://21st.dev/@ruixen.ui/components/coverflow-carousel
// Licença: MIT, Copyright (c) 2025 Ruixen UI. Créditos completos em CREDITOS.md.
'use client';

/* Origem: 21st.dev, "Coverflow Carousel" de ruixen.ui (demo 23997), escolhido
   pelo diretor para o bloco 6 (Venda). A MECÂNICA vem intacta: o rAF daqui de
   dentro é o DONO do movimento do baralho. Nem GSAP, nem ScrollTrigger, nem
   Framer escrevem nos cards (posse por seção, movimento.md). Se a seção ganhar
   reveal de entrada no Passe 3, ele vai num elemento ENVOLVENTE.

   Ficam como vieram, de propósito: o cardWidth em clamp (a fluidez dele é o
   motivo de ter sido escolhido; nada de breakpoints), o touchAction "pan-y"
   (a rolagem vertical da página nunca é capturada) e o keydown escopado ao
   quadro (nunca no window).

   QUATRO CONSERTOS sobre o original, e só quatro:
   1. os dois chevrons saíram do lucide-react e viraram SVG inline, com
      fill/stroke/vector-effect em atributo, sem depender de classe global;
   2. o <img> puro virou next/image (800x800, sizes coerente com o clamp,
      priority false: a seção está abaixo da dobra);
   3. entrou prefers-reduced-motion: a transição de card passa a ser
      INSTANTÂNEA e o baralho assume o estado FINAL. Arrasto, teclado e setas
      continuam inteiros, porque movimento reduzido não desliga função;
   4. passada de tokens do design.md: raio de foto, sombra difusa na Tinta,
      setas em Lápis/Avanço com alvo de 44px. Nada de cor, raio, fonte ou
      espaçamento do autor original.

   Removidos por decisão de direção (prompt 2.33): legenda, metadados e
   paginação numerada. Não existe dado por card, e inventar um seria fabricar
   registro; contador na tela está fora. O código morto saiu junto. */

import * as React from 'react';
import Image from 'next/image';
import {cn} from '@/lib/utils';

const useIsoLayoutEffect =
  typeof window !== 'undefined' ? React.useLayoutEffect : React.useEffect;

/** SSR-safe. Só é lido em callback, nunca renderizado: sem risco de hidratação. */
function usePrefereMovimentoReduzido(): boolean {
  const [reduzido, setReduzido] = React.useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  React.useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const aoMudar = (e: MediaQueryListEvent) => setReduzido(e.matches);
    mq.addEventListener('change', aoMudar);
    return () => mq.removeEventListener('change', aoMudar);
  }, []);
  return reduzido;
}

/* As fotos são DECORATIVAS (alt=""): não carregam informação que a copy já não
   carregue. Por isso o slide só precisa do caminho. */
export interface CoverflowSlide {
  src: string;
}

export interface CoverflowCarouselProps {
  slides: CoverflowSlide[];
  /** Degrees the first neighbour tilts. */
  rotate?: number;
  /** How far the first neighbour recedes, as a fraction of card width. */
  depth?: number;
  /** Viewer distance as a multiple of card width — smaller is a wider lens. */
  perspective?: number;
  /** Exponent on distance. Below 1 the rake eases off as cards travel out. */
  falloff?: number;
  /** Opacity lost per step from the centre. */
  fade?: number;
  /** Any CSS length. Everything else is derived from it, so the rake scales. */
  cardWidth?: string;
  /** Space between cards, as a fraction of card width. */
  gap?: number;
  loop?: boolean;
  showNavigation?: boolean;
  /** Names the carousel for assistive tech. */
  label?: string;
  /** Rótulos das setas. Vêm do i18n do projeto; nenhuma string nasce aqui. */
  navLabels?: {previous: string; next: string};
  /** Avisa a seção qual card está no centro (o halo do fundo vive disto). */
  onSelect?: (index: number) => void;
  className?: string;
  cardClassName?: string;
}

/* Chevron em SVG inline. fill, stroke, strokeWidth, vector-effect e as medidas
   são ATRIBUTOS, não classe: o desenho não depende de cascata global nenhuma.
   A cor entra por currentColor, que é o que dá o hover do botão. */
function Chevron({sentido}: {sentido: 'anterior' | 'proximo'}) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path
        d={sentido === 'anterior' ? 'M15 6l-6 6 6 6' : 'M9 6l6 6-6 6'}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/* Alvo de 44x44 (design.md e CLAUDE.md global), fora da área dos cards. O foco
   visível é o sublinhado-cota global de 3px em Avanço. */
const botaoSeta =
  'flex size-11 items-center justify-center rounded-full border border-lapis bg-white text-tinta transition-colors duration-200 hover:border-avanco hover:text-avanco active:scale-[0.98]';

export function CoverflowCarousel({
  slides,
  rotate = 44,
  depth = 0.6,
  perspective = 3,
  falloff = 0.56,
  fade = 0.1,
  cardWidth = 'clamp(148px, 22vw, 260px)',
  gap = 0.05,
  loop = true,
  showNavigation = false,
  label = 'Cover carousel',
  navLabels,
  onSelect,
  className,
  cardClassName
}: CoverflowCarouselProps) {
  const count = slides.length;
  const reduzido = usePrefereMovimentoReduzido();

  const frameRef = React.useRef<HTMLDivElement>(null);
  const cardRefs = React.useRef<(HTMLDivElement | null)[]>([]);
  /** Fractional card index at the centre. The single source of truth. */
  const posRef = React.useRef(0);
  /** Where the current settle is headed. Stepping off `pos` instead would
      swallow a keypress that lands mid-flight, before the round-off moves. */
  const targetRef = React.useRef(0);
  const widthRef = React.useRef(0);
  const rafRef = React.useRef<number | null>(null);
  const dragRef = React.useRef<{
    id: number;
    x: number;
    pos: number;
    v: number;
    t: number;
  } | null>(null);

  const [selected, setSelected] = React.useState(0);

  /** Nearest whole card, folded back into 0..count-1. */
  const indexAt = React.useCallback(
    (pos: number) => ((Math.round(pos) % count) + count) % count,
    [count]
  );

  // Paint straight to the DOM. Sixty state updates a second would re-render
  // every card for numbers React never needs to see.
  const paint = React.useCallback(() => {
    const width = widthRef.current;
    if (!width) return;
    const pitch = width * (1 + gap);
    const pos = posRef.current;

    cardRefs.current.forEach((card, index) => {
      if (!card) return;

      // Fold the distance into the shorter way round the ring. This is the
      // whole looping mechanism — no cloned nodes, no shuffling the DOM.
      let offset = index - pos;
      if (loop) {
        offset = ((offset % count) + count) % count;
        if (offset > count / 2) offset -= count;
      }

      const distance = Math.abs(offset);
      // Both the tilt and the recession ease off as cards travel out —
      // doubling the distance adds only about half again as much of each.
      // A linear ramp folds the second card shut; this keeps it readable.
      const ramp = Math.pow(distance, falloff);
      // Capped short of edge-on so a far card never turns its back.
      const tilt = Math.min(rotate * ramp, 82) * Math.sign(offset);

      card.style.transform =
        `translateX(calc(-50% + ${offset * pitch}px)) ` +
        `translateZ(${-depth * width * ramp}px) rotateY(${-tilt}deg)`;

      // A card is teleported across the ring at exactly half a turn out, so it
      // has to be gone by then or the jump is visible.
      const edge = loop ? Math.min(1, Math.max(0, count / 2 - distance)) : 1;
      card.style.opacity = String(Math.max(0, 1 - fade * distance) * edge);
      card.style.zIndex = String(100 - Math.round(distance));
    });
  }, [count, depth, fade, falloff, gap, loop, rotate]);

  const settle = React.useCallback(
    (target: number) => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      targetRef.current = target;
      setSelected(indexAt(target));

      // Movimento reduzido: sem transição nenhuma, o baralho ASSUME O ESTADO
      // FINAL. O resto da interação segue igual, porque quem chegou aqui já
      // pediu a troca (arrasto, teclado ou seta).
      if (reduzido) {
        posRef.current = target;
        paint();
        rafRef.current = null;
        return;
      }

      const step = () => {
        const remaining = target - posRef.current;
        if (Math.abs(remaining) < 0.0004) {
          posRef.current = target;
          paint();
          rafRef.current = null;
          return;
        }
        // ponytail: exponential ease-out, not a spring. Swap in a spring only
        // if the settle needs overshoot.
        posRef.current += remaining * 0.16;
        paint();
        rafRef.current = requestAnimationFrame(step);
      };
      rafRef.current = requestAnimationFrame(step);
    },
    [indexAt, paint, reduzido]
  );

  const clamp = React.useCallback(
    (pos: number) => (loop ? pos : Math.max(0, Math.min(count - 1, pos))),
    [count, loop]
  );

  const nudge = React.useCallback(
    (by: number) => settle(clamp(Math.round(targetRef.current) + by)),
    [clamp, settle]
  );

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    targetRef.current = posRef.current;
    dragRef.current = {
      id: event.pointerId,
      x: event.clientX,
      pos: posRef.current,
      v: 0,
      t: performance.now()
    };
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.id !== event.pointerId) return;

    const pitch = widthRef.current * (1 + gap);
    if (!pitch) return;

    const now = performance.now();
    const previous = posRef.current;
    posRef.current = clamp(drag.pos - (event.clientX - drag.x) / pitch);
    // Cards per second, for the throw.
    drag.v = ((posRef.current - previous) / Math.max(now - drag.t, 1)) * 1000;
    drag.t = now;

    const index = indexAt(posRef.current);
    if (index !== selected) setSelected(index);
    paint();
  };

  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.id !== event.pointerId) return;
    dragRef.current = null;
    // Let a flick carry, but never more than two cards.
    const carried = Math.max(-2, Math.min(2, drag.v * 0.18));
    settle(clamp(Math.round(posRef.current + carried)));
  };

  // Card width drives pitch, depth and perspective, so it is the only thing
  // worth measuring — and only when the box actually changes.
  useIsoLayoutEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    const measure = () => {
      const card = cardRefs.current[0];
      if (!card) return;
      widthRef.current = card.offsetWidth;
      paint();
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(frame);
    return () => observer.disconnect();
  }, [paint]);

  React.useEffect(
    () => () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    },
    []
  );

  // O halo da seção acende no tom da foto do centro. O aviso sai daqui por
  // efeito, uma vez por troca; na montagem ele repete o 0 e a seção ignora.
  const onSelectRef = React.useRef(onSelect);
  React.useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);
  React.useEffect(() => {
    onSelectRef.current?.(selected);
  }, [selected]);

  return (
    <div
      className={cn('w-full', className)}
      style={{['--cf-card' as string]: cardWidth}}
      role="region"
      aria-label={label}
    >
      <div className="relative">
        <div
          ref={frameRef}
          tabIndex={0}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onKeyDown={(event) => {
            if (event.key === 'ArrowLeft') {
              event.preventDefault();
              nudge(-1);
            } else if (event.key === 'ArrowRight') {
              event.preventDefault();
              nudge(1);
            }
          }}
          // Vertical padding keeps the drop shadows clear of the overflow clip.
          // `baralho-quadro` só existe para o foco de teclado: ver globals.css.
          className="baralho-quadro relative cursor-grab overflow-hidden py-8 outline-none active:cursor-grabbing lg:py-10"
          style={{
            perspective: `calc(var(--cf-card) * ${perspective})`,
            // Horizontal drag is ours; the page keeps vertical scrolling.
            touchAction: 'pan-y'
          }}
        >
          <div
            className="relative select-none"
            style={{
              height: 'var(--cf-card)',
              transformStyle: 'preserve-3d'
            }}
          >
            {slides.map((slide, index) => (
              <div
                key={slide.src}
                ref={(node) => {
                  cardRefs.current[index] = node;
                }}
                /* Foto decorativa (alt=""): nada aqui para a leitura de tela,
                   que fica com o rótulo da região. */
                aria-hidden="true"
                className={cn(
                  'absolute left-1/2 top-0 aspect-square overflow-hidden bg-papel will-change-transform',
                  'rounded-[var(--midia-raio)] shadow-[var(--baralho-card-sombra)]',
                  cardClassName
                )}
                style={{width: 'var(--cf-card)'}}
              >
                <Image
                  src={slide.src}
                  alt=""
                  width={800}
                  height={800}
                  /* Os cortes seguem o clamp do cardWidth: 148px até 673px de
                     viewport, 22vw entre 673 e 1182, 260px acima disso. */
                  sizes="(min-width: 1182px) 260px, (min-width: 673px) 22vw, 148px"
                  /* A seção está abaixo da dobra: nada disto é LCP. */
                  priority={false}
                  draggable={false}
                  className="h-full w-full select-none object-cover"
                />
              </div>
            ))}
          </div>
        </div>

        {showNavigation && navLabels && (
          /* FORA da área dos cards, de propósito (item 6.5 do prompt): as
             fotos ficam limpas e a interação continua descoberta. */
          <div className="mt-1 flex items-center justify-center gap-3 lg:mt-2">
            <button
              type="button"
              aria-label={navLabels.previous}
              onClick={() => nudge(-1)}
              className={botaoSeta}
            >
              <Chevron sentido="anterior" />
            </button>
            <button
              type="button"
              aria-label={navLabels.next}
              onClick={() => nudge(1)}
              className={botaoSeta}
            >
              <Chevron sentido="proximo" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
