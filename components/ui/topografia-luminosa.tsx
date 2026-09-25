// Página original (21st.dev): https://21st.dev/@rmahammad/components/luminous-topography
// Licença: MIT, Copyright (c) 2026 Mahammad Rustamov. Créditos completos em CREDITOS.md.
'use client';

import * as React from 'react';
import {useReducedMotion} from '@/lib/movimento-reduzido';
import {cn} from '@/lib/utils';

/* Origem: 21st.dev, "Luminous Topography" de rmahammad (demo 23412), do
 * catálogo Motiq, MIT. Escolhido pelo diretor para o fundo do CTA final da
 * landing do guia: é o "desenho de linha arquitetônica em latão de baixo
 * contraste" que o roteiro pediu, vivo. Linhas de contorno em SVG que
 * derivam devagar em camadas de paralaxe, com uma luz que passa e clareia as
 * linhas perto dela; opcionalmente uma segunda luz segue o cursor. Sem canvas,
 * sem WebGL, sem laço de JS: só CSS. Pausa fora da tela e com a aba
 * escondida. Geometria semeada, então servidor e cliente geram o mesmo SVG.
 *
 * Passada de tokens (obrigatória, sem mudar o gesto):
 * 1. O bloco de tokens Motiq que o autor injetava em `:root` SAIU: as cores
 *    vêm dos tokens da marca. O traço apagado é latão de baixo contraste, a
 *    luz acende o mesmo latão a cheio.
 * 2. Movimento reduzido: o próprio componente desliga deriva e luz por media
 *    query; a versão estática é a composição final, como manda o movimento.md.
 *
 * REESCRITA DE DESEMPENHO (08/09/2026, pedido do Gabriel: "trava, principalmente
 * no celular"). MEDIDO em emulação de celular com CPU 4x mais lenta: a seção
 * rolava a 19 fps; com a animação deste fundo pausada, 161 fps. O livro 3D e
 * o formulário não pesavam nada. A causa: o autor animava `transform` em
 * grupos DENTRO do SVG, e a luz era uma elipse animada dentro de um `<mask>`,
 * com `drop-shadow` por cima. Transform em elemento interno de SVG não vai
 * para o compositor: cada quadro repintava as 84 curvas, as duas máscaras e o
 * filtro, na altura inteira da seção, em DPR 3.
 *
 * O que mudou é SÓ a arquitetura de pintura; geometria, cores, opacidades,
 * velocidades e amplitudes são as mesmas:
 * a. Cada camada de profundidade virou um `<svg>` PRÓPRIO, elemento HTML, e a
 *    deriva anima o transform DO ELEMENTO: vira camada composta, rasterizada
 *    uma vez e só deslocada pela GPU.
 * b. A luz que passa deixou de ser máscara. Invertida: as linhas ACESAS ficam
 *    embaixo, sempre pintadas, e por cima delas passa uma COBERTURA na cor do
 *    fundo (Tinta) com um furo em gradiente radial, o negativo exato da luz do
 *    autor (alfa 0 no centro, 45% aos 55% do raio, 100% na borda). Cobrir
 *    latão aceso com Tinta a alfa A equivale a mascarar a alfa 1 menos A: é o
 *    mesmo pixel. As linhas apagadas ficam POR CIMA da cobertura, então fora
 *    do furo se vê só elas, como antes. A cobertura é um `<div>` com
 *    gradiente CSS que só translada: composto, zero repintura.
 * c. A máscara da área segura (o vale atrás do formulário) continua em SVG,
 *    mas ESTÁTICA, dentro de cada camada: entra na rasterização única.
 * d. A luz do cursor virou uma cópia das linhas acesas por camada, acima da
 *    cobertura, dentro de um DISCO recortado por `mask-image` FIXA. O que
 *    segue o ponteiro é o disco (transform), e dentro dele a cena inteira
 *    recebe a translação inversa, para as linhas ficarem paradas no lugar. Só
 *    transform muda a cada movimento: nada é repintado. (A primeira versão
 *    movia a máscara em vez do disco, e MEDIDO: 16 fps com o mouse andando,
 *    porque cada movimento re-rasterizava três camadas de tela inteira.) Só
 *    existe com ponteiro fino: no toque não há cursor e não há custo.
 * e. O `drop-shadow` de 2px a 35% ficou só no desktop: no celular um filtro
 *    de tela inteira por quadro é pesado, e a 2px sob uma linha de 1,4px a
 *    35% ele é invisível.
 * A escala do `preserveAspectRatio="xMidYMid slice"` (que mapeia a cena de
 * 1200x760 para o contêiner) vira a variável `--e`: UM PIXEL DA CENA como
 * comprimento, em unidades de container query (max de 100cqw/1200 e
 * 100cqh/760). Número vezes `--e` dá o comprimento na tela; por isso as
 * medidas da cena entram sem `px` (px vezes comprimento não é comprimento, e
 * a declaração inteira cairia). É o que põe o furo, a lavagem e o cursor no
 * mesmo lugar da cena. */

export interface PontoTopografia {
  x: number;
  y: number;
}

export interface AreaTopografia {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface TopografiaLuminosaProps extends React.HTMLAttributes<HTMLDivElement> {
  densidade?: number;
  profundidade?: number;
  deriva?: number;
  intensidade?: number;
  foco?: PontoTopografia | PontoTopografia[];
  areaSegura?: AreaTopografia;
  acento?: string;
  /** A cor do fundo que hospeda a peça. A cobertura da luz é pintada NELA, então
   *  precisa ser exatamente a cor da seção atrás. */
  fundo?: string;
  larguraLinha?: number;
  semente?: number;
  pausarEscondido?: boolean;
  interativo?: boolean;
  movimentoReduzido?: boolean;
}

/* Movimento reduzido pelo `useReducedMotion` do Framer (SSR-safe: nulo no
   servidor, booleano no cliente, sem estado escrito dentro de efeito). */

/* Pausa fora da tela e com a aba escondida. O hook é DONO do ref que devolve,
   para nenhum ref ser lido durante o render. */
function usePausaPorVisibilidade<T extends Element>({threshold = 0.1}: {threshold?: number} = {}) {
  const ref = React.useRef<T | null>(null);
  const [naTela, setNaTela] = React.useState(true);
  const abaVisivel = React.useSyncExternalStore(
    (avisar) => {
      document.addEventListener('visibilitychange', avisar);
      return () => document.removeEventListener('visibilitychange', avisar);
    },
    () => document.visibilityState !== 'hidden',
    () => true
  );

  React.useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver((entradas) => setNaTela(entradas.some((e) => e.isIntersecting)), {
      threshold
    });
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);

  return {ref, ativo: naTela && abaVisivel};
}

const W = 1200;
const H = 760;
const MARGEM = 96;
const PASSO = 60;
// Amplitude da luz que passa, em pixels da cena (igual ao autor).
const CURSO_DA_LUZ = 330;
// Raio da luz do cursor, em pixels da cena (0,2 da largura, igual ao autor).
const RAIO_DO_CURSOR = W * 0.2;

function criarRng(semente: number) {
  let a = semente >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const r1 = (n: number) => Math.round(n * 10) / 10;
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

interface FocoPx {
  x: number;
  y: number;
  amp: number;
  sx: number;
  sy: number;
}
interface Harmonico {
  f: number;
  a: number;
  p: number;
  g: number;
}
interface Contorno {
  d: string;
  o: number;
}
interface Camada {
  contornos: Contorno[];
  dx: number;
  dy: number;
  dur: number;
}

function paraPath(pts: Array<[number, number]>): string {
  if (pts.length < 2) return '';
  let d = `M ${r1(pts[0][0])} ${r1(pts[0][1])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${r1(c1x)} ${r1(c1y)}, ${r1(c2x)} ${r1(c2y)}, ${r1(p2[0])} ${r1(p2[1])}`;
  }
  return d;
}

function construirGeometria(
  semente: number,
  profundidade: number,
  densidade: number,
  deriva: number,
  focos: FocoPx[]
): {camadas: Camada[]} {
  const camadas: Camada[] = [];
  const n = clamp(Math.round(profundidade), 1, 4);

  for (let li = 0; li < n; li++) {
    const rng = criarRng((semente >>> 0) * 2654435761 + li * 40503 + 17);
    const harmonicos: Harmonico[] = Array.from({length: 3}, () => ({
      f: 0.0032 + rng() * 0.0052,
      a: (5 + rng() * 9) * (1 - li * 0.12),
      p: rng() * Math.PI * 2,
      g: (rng() - 0.5) * 0.012
    }));

    const count = Math.max(5, Math.round((8 + densidade * 6) * (1 - li * 0.07)));
    const span = H + MARGEM * 2;
    const espaco = span / count;
    const contornos: Contorno[] = [];

    for (let k = 0; k < count; k++) {
      const baseY = -MARGEM + espaco * (k + 0.5) + (rng() - 0.5) * 7;
      const pts: Array<[number, number]> = [];
      for (let x = -MARGEM; x <= W + MARGEM; x += PASSO) {
        let dsp = 0;
        for (const f of focos) {
          const dx = x - f.x;
          const ex = Math.exp(-(dx * dx) / (2 * f.sx * f.sx));
          const dy = baseY - f.y;
          const vy = Math.exp(-(dy * dy) / (2 * f.sy * f.sy));
          const dir = dy >= 0 ? 1 : -1;
          dsp += f.amp * ex * (0.52 + 0.48 * vy * dir) * (1 - li * 0.14);
        }
        for (const h of harmonicos) dsp += h.a * Math.sin(x * h.f + h.p + baseY * h.g);
        pts.push([x, baseY - dsp]);
      }
      contornos.push({d: paraPath(pts), o: r1(clamp(0.46 - li * 0.12, 0.12, 0.5))});
    }

    const dir = li % 2 === 0 ? -1 : 1;
    camadas.push({
      contornos,
      dx: r1(dir * (18 - li * 4) * deriva),
      dy: r1(-(7 - li * 1.5) * deriva),
      dur: r1(16 + li * 6 + (li === 0 ? 0 : 2))
    });
  }
  return {camadas};
}

function normalizarFocos(foco: TopografiaLuminosaProps['foco']): FocoPx[] {
  const lista = Array.isArray(foco) ? foco : [foco ?? {x: 0.72, y: 0.34}];
  return lista.map((f, i) => ({
    x: f.x * W,
    y: f.y * H,
    amp: 74 - i * 12,
    sx: 210 - i * 26,
    sy: 150 - i * 18
  }));
}

/* Uma camada de contornos: um `<svg>` inteiro, elemento HTML, com a máscara da
   área segura ESTÁTICA dentro. É o elemento que a deriva translada. */
function CamadaDeContornos({
  camada,
  li,
  classe,
  cor,
  opacidade,
  larguraLinha,
  mascara
}: {
  camada: Camada;
  li: number;
  classe: string;
  cor: string;
  opacidade: number | ((c: Contorno) => number);
  larguraLinha: number;
  mascara: string;
}) {
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid slice"
      role="presentation"
      className={cn('topo-camada', classe)}
      data-i={li}
      style={
        {
          '--dx': `${camada.dx}px`,
          '--dy': `${camada.dy}px`,
          '--dur': `${camada.dur}s`,
          animationDelay: `${r1(-li * 2.5)}s`
        } as React.CSSProperties
      }
    >
      <g mask={`url(#${mascara})`}>
        {camada.contornos.map((c, i) => (
          <path
            key={i}
            d={c.d}
            stroke={cor}
            strokeOpacity={typeof opacidade === 'function' ? opacidade(c) : opacidade}
            strokeWidth={larguraLinha}
            strokeLinecap="round"
          />
        ))}
      </g>
    </svg>
  );
}

export function TopografiaLuminosa({
  densidade = 1,
  profundidade = 3,
  deriva = 1,
  intensidade = 1,
  foco,
  areaSegura = {x: 0.04, y: 0.12, w: 0.56, h: 0.76},
  acento = 'var(--cor-latao)',
  fundo = 'var(--cor-tinta)',
  larguraLinha = 1.4,
  semente = 1,
  pausarEscondido = true,
  interativo = false,
  movimentoReduzido,
  className,
  style,
  children,
  onPointerMove,
  ...props
}: TopografiaLuminosaProps) {
  const uid = React.useId().replace(/[^a-zA-Z0-9]/g, '');
  const cls = `topo-${uid}`;
  const reduzidoSistema = useReducedMotion() === true;
  const estatico = movimentoReduzido === true;
  const {ref: fundoRef, ativo} = usePausaPorVisibilidade<HTMLDivElement>({threshold: 0.01});
  const pausado = pausarEscondido && !ativo;

  const focos = React.useMemo(() => normalizarFocos(foco), [foco]);
  const geom = React.useMemo(
    () => construirGeometria(semente, profundidade, densidade, estatico ? 0 : deriva, focos),
    [semente, profundidade, densidade, deriva, estatico, focos]
  );

  /* A luz do cursor: escreve o transform do disco e o da cena dentro dele
     DIRETO nos dois elementos, no máximo uma vez por quadro. Escrita direta, e
     não custom property no invólucro como no autor: a custom property herda
     para as centenas de `<path>`, e cada movimento virava um recálculo de
     estilo da subárvore inteira (MEDIDO: 35 fps com CPU 4x mais lenta, contra
     os 75 da rolagem). Só ponteiro de mouse: no toque não existe cursor, e a
     cópia acesa nem é pintada. */
  React.useEffect(() => {
    const el = fundoRef.current;
    if (!el || !interativo || estatico) return;
    const disco = el.querySelector<HTMLElement>('.topo-cursor');
    const cenaDoDisco = el.querySelector<HTMLElement>('.topo-cursor-cena');
    if (!disco || !cenaDoDisco) return;
    let raf = 0;
    let nx = 0;
    let ny = 0;
    let raio = 0;
    const aplicar = () => {
      raf = 0;
      disco.style.transform = `translate3d(${r1(nx - raio)}px, ${r1(ny - raio)}px, 0)`;
      cenaDoDisco.style.transform = `translate3d(${r1(raio - nx)}px, ${r1(raio - ny)}px, 0)`;
      disco.style.opacity = '0.9';
    };
    const aoMover = (e: PointerEvent) => {
      if (reduzidoSistema || e.pointerType !== 'mouse') return;
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      nx = e.clientX - r.left;
      ny = e.clientY - r.top;
      // Um pixel da cena em pixels da tela: o mesmo `--e` do CSS.
      raio = RAIO_DO_CURSOR * Math.max(r.width / W, r.height / H);
      if (!raf) raf = requestAnimationFrame(aplicar);
    };
    const aoSair = () => {
      disco.style.opacity = '0';
    };
    const host = el.parentElement ?? el;
    host.addEventListener('pointermove', aoMover);
    host.addEventListener('pointerleave', aoSair);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      host.removeEventListener('pointermove', aoMover);
      host.removeEventListener('pointerleave', aoSair);
    };
  }, [interativo, estatico, reduzidoSistema, fundoRef]);

  const principal = focos[0] ?? {x: W * 0.72, y: H * 0.34};
  const sa = {
    cx: (areaSegura.x + areaSegura.w / 2) * W,
    cy: (areaSegura.y + areaSegura.h / 2) * H,
    rx: (areaSegura.w / 2) * W * 1.18,
    ry: (areaSegura.h / 2) * H * 1.18
  };
  const n = clamp(Math.round(profundidade), 1, 4);
  const idMascara = `safe-${uid}`;

  // O traço apagado é LATÃO de baixo contraste (o roteiro pede linha
  // arquitetônica em latão), não o cinza do autor; a luz que passa acende o
  // mesmo latão a cheio.
  const tracoApagado = `color-mix(in oklab, var(--cor-latao) ${r1(clamp(34 * intensidade, 10, 50))}%, transparent)`;
  const tracoAceso = acento;
  const opacidadeAcesa = r1(clamp(0.9 * intensidade, 0.3, 1));

  /* A lavagem do autor era um `radialGradient` em objectBoundingBox sobre a
     cena inteira: raio de 72% vira elipse de 0,72W por 0,72H, centrada no foco
     principal. Aqui é o mesmo gradiente em CSS, nas mesmas coordenadas via
     `--e`; o centro parte do meio do contêiner (o `xMidYMid` da cena). */
  const lavCx = `calc(50% + ${r1((principal.x / W - 0.5) * W)} * var(--e))`;
  const lavCy = `calc(50% + ${r1((principal.y / H - 0.5) * H)} * var(--e))`;
  const raioCursor = r1(RAIO_DO_CURSOR);
  const mascaraCursor = `radial-gradient(circle calc(${raioCursor} * var(--e)) at center, #fff 0%, rgb(255 255 255 / 0.55) 55%, transparent 100%)`;

  const css = `
.${cls} { position: absolute; inset: 0; overflow: hidden; }
.${cls} .topo-cena { position: absolute; inset: 0; container-type: size; }
.${cls} .topo-cena > * { --e: max(100cqw / ${W}, 100cqh / ${H}); }
.${cls} .topo-camada, .${cls} .topo-cobertura, .${cls} .topo-lavagem { position: absolute; inset: 0; }
.${cls} svg { width: 100%; height: 100%; display: block; }
.${cls} path { fill: none; vector-effect: non-scaling-stroke; }
.${cls} .topo-cobertura {
  left: calc(${-CURSO_DA_LUZ} * var(--e));
  right: calc(${-CURSO_DA_LUZ} * var(--e));
  background: radial-gradient(ellipse calc(${r1(W * 0.42)} * var(--e)) calc(${r1(H * 0.72)} * var(--e)) at 50% 50%, transparent 0%, color-mix(in srgb, ${fundo} 45%, transparent) 55%, ${fundo} 100%);
}
.${cls} .topo-lavagem {
  background: radial-gradient(ellipse calc(${r1(W * 0.72)} * var(--e)) calc(${r1(H * 0.72)} * var(--e)) at ${lavCx} ${lavCy}, color-mix(in srgb, ${acento} ${r1(16 * intensidade)}%, transparent) 0%, color-mix(in srgb, ${acento} ${r1(5 * intensidade)}%, transparent) 55%, transparent 100%);
}
.${cls} .topo-cursor {
  display: none;
  position: absolute;
  left: 0;
  top: 0;
  width: calc(${raioCursor * 2} * var(--e));
  height: calc(${raioCursor * 2} * var(--e));
  overflow: hidden;
  opacity: 0;
  transform: translate3d(-9999px, -9999px, 0);
  will-change: transform, opacity;
  -webkit-mask-image: ${mascaraCursor};
  mask-image: ${mascaraCursor};
}
.${cls} .topo-cursor-cena {
  position: absolute;
  left: 0;
  top: 0;
  width: 100cqw;
  height: 100cqh;
  will-change: transform;
}
@media (hover: hover) and (pointer: fine) {
  .${cls} .topo-cursor { display: block; }
  .${cls} .topo-acesa { filter: drop-shadow(0 0 2px color-mix(in oklab, ${acento} 35%, transparent)); }
}
.${cls}.topo-animado .topo-camada {
  animation: ${cls}-deriva var(--dur, 18s) ease-in-out infinite alternate;
  will-change: transform;
}
.${cls}.topo-animado .topo-cobertura {
  animation: ${cls}-luz ${r1(13 + profundidade)}s ease-in-out infinite alternate;
  will-change: transform;
}
@keyframes ${cls}-deriva {
  from { transform: translate3d(0, 0, 0); }
  to   { transform: translate3d(var(--dx, 0px), var(--dy, 0px), 0); }
}
@keyframes ${cls}-luz {
  from { transform: translate3d(calc(${-CURSO_DA_LUZ} * var(--e)), 0, 0); }
  to   { transform: translate3d(calc(${CURSO_DA_LUZ} * var(--e)), 0, 0); }
}
.${cls}[data-pausado="true"] .topo-camada,
.${cls}[data-pausado="true"] .topo-cobertura { animation-play-state: paused !important; }
${
  n > 1
    ? `@media (max-width: 640px) {
  .${cls} .topo-camada[data-i="${n - 1}"] { display: none; }
  .${cls} .topo-acesa { opacity: 0.82; }
}`
    : ''
}
@media (prefers-reduced-motion: reduce) {
  .${cls} .topo-camada, .${cls} .topo-cobertura { animation: none !important; }
  .${cls} .topo-cursor { display: none !important; }
}
@media (forced-colors: active) {
  .${cls} .topo-acesa, .${cls} .topo-lavagem, .${cls} .topo-cursor, .${cls} .topo-cobertura { display: none !important; }
  .${cls} svg { forced-color-adjust: none; }
  .${cls} .topo-apagada path { stroke: CanvasText !important; stroke-opacity: 0.5 !important; }
}`.trim();

  return (
    <div className={cn('relative isolate overflow-hidden', className)} style={style} onPointerMove={onPointerMove} {...props}>
      <div
        ref={fundoRef}
        aria-hidden="true"
        data-pausado={pausado ? 'true' : 'false'}
        className={cn('pointer-events-none absolute inset-0 overflow-hidden', cls, !estatico && 'topo-animado')}
      >
        {/* Os recursos compartilhados, definidos UMA vez: a máscara da área
            segura (o vale atrás do conteúdo) e o gradiente dela. Referência por
            id atravessa `<svg>`s do mesmo documento. */}
        <svg width="0" height="0" aria-hidden="true" style={{position: 'absolute'}}>
          <defs>
            <radialGradient id={`seg-${uid}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgb(26,26,26)" />
              <stop offset="62%" stopColor="rgb(120,120,120)" />
              <stop offset="100%" stopColor="#fff" />
            </radialGradient>
            <mask id={idMascara} maskUnits="userSpaceOnUse" x="0" y="0" width={W} height={H}>
              <rect x="0" y="0" width={W} height={H} fill="#fff" />
              <ellipse cx={r1(sa.cx)} cy={r1(sa.cy)} rx={r1(sa.rx)} ry={r1(sa.ry)} fill={`url(#seg-${uid})`} />
            </mask>
          </defs>
        </svg>

        <div className="topo-cena">
          {/* 1. As linhas ACESAS, sempre pintadas, embaixo de tudo. */}
          {geom.camadas.map((camada, li) => (
            <CamadaDeContornos
              key={`a${li}`}
              camada={camada}
              li={li}
              classe="topo-acesa"
              cor={tracoAceso}
              opacidade={opacidadeAcesa}
              larguraLinha={r1(larguraLinha * (1 - li * 0.08))}
              mascara={idMascara}
            />
          ))}

          {/* 2. A COBERTURA na cor do fundo, com o furo da luz, que passa. */}
          <div className="topo-cobertura" />

          {/* 3. A lavagem de latão, e por cima dela as linhas APAGADAS. */}
          <div className="topo-lavagem" />
          {geom.camadas.map((camada, li) => (
            <CamadaDeContornos
              key={`p${li}`}
              camada={camada}
              li={li}
              classe="topo-apagada"
              cor={tracoApagado}
              opacidade={(c) => c.o}
              larguraLinha={r1(larguraLinha * (1 - li * 0.12))}
              mascara={idMascara}
            />
          ))}

          {/* 4. A luz do cursor: o disco que segue o ponteiro, e dentro dele a
              cena acesa inteira, deslocada ao contrário para ficar parada. */}
          {interativo && !estatico ? (
            <div className="topo-cursor">
              <div className="topo-cursor-cena">
                {geom.camadas.map((camada, li) => (
                  <CamadaDeContornos
                    key={`c${li}`}
                    camada={camada}
                    li={li}
                    classe="topo-cursor-camada"
                    cor={tracoAceso}
                    opacidade={opacidadeAcesa}
                    larguraLinha={r1(larguraLinha * (1 - li * 0.08))}
                    mascara={idMascara}
                  />
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <style dangerouslySetInnerHTML={{__html: css}} />
      </div>

      {children != null ? <div className="relative z-10">{children}</div> : null}
    </div>
  );
}

export default TopografiaLuminosa;
