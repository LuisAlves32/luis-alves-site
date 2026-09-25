'use client';

import {useLayoutEffect, useRef, useState, type ReactNode} from 'react';
import {motion, useMotionValueEvent, useScroll, useSpring, useTransform} from 'framer-motion';
import {useReducedMotion} from '@/lib/movimento-reduzido';
import {cn} from '@/lib/utils';

/* O FIO DO PERCURSO: os três passos de "Depois do download" da landing do guia
 * ligados por um fio que se traça com a rolagem, com uma luz de latão correndo
 * à frente e acendendo cada passo quando chega nele.
 *
 * Código escrito pela Tá Online, do zero, em 24/09/2026. Substitui
 * `fio-que-passa.tsx`, que partia do "Tracing Beam" da Aceternity (21st.dev,
 * https://21st.dev/@manuarora700/components/tracing-beam): a licença da
 * Aceternity proíbe redistribuir o código-fonte, e o repositório vai ser
 * público. Crédito de inspiração em CREDITOS.md.
 *
 * COMO É FEITO, e não é como o original:
 *   · o caminho é desenhado PELOS MEDALHÕES dos filhos (`[data-medalhao]`),
 *     medidos no layout: horizontal em escada de 1024px para cima, vertical no
 *     celular (era a nossa adaptação e continua);
 *   · a rolagem vira um avanço ao longo do EIXO do caminho (x no computador, y
 *     no celular), e esse avanço vira COMPRIMENTO DE ARCO no próprio caminho,
 *     segmento a segmento. É o comprimento de arco que posiciona a luz;
 *   · a luz é feita de TRÊS SEGMENTOS DE TRAÇO (`stroke-dasharray`) que terminam
 *     no mesmo ponto: uma cauda longa e fraca, um meio, e uma ponta curta e mais
 *     clara. Nada de gradiente com coordenadas vivas;
 *   · o traço que FICA desenhado atrás da luz (a cota que se traça, caligrafia 1
 *     do movimento.md) usa `pathLength`.
 *
 * Os filhos recebem quantos medalhões a luz já passou (`acesos`), e é com isso
 * que cada ficha acende. Movimento reduzido: traço inteiro, sem luz, tudo aceso.
 * Posse do movimento: o Framer daqui de dentro (a câmera global não entra). */

type Ponto = {x: number; y: number};
type Percurso = {
  d: string;
  horizontal: boolean;
  /** Posição no eixo e comprimento de arco acumulado de cada vértice. */
  eixos: number[];
  arcos: number[];
  total: number;
  /** Posição no eixo de cada medalhão. */
  medalhoes: number[];
};

/** Os três segmentos da luz, da cauda para a ponta: comprimento (px) e opacidade. */
const LUZ = [
  {comprimento: 220, opacidade: 0.22, cor: 'var(--cor-latao)'},
  {comprimento: 110, opacidade: 0.55, cor: 'var(--cor-latao)'},
  {comprimento: 34, opacidade: 1, cor: '#dcc79f'}
] as const;

/** Do avanço no eixo ao comprimento de arco, interpolando no segmento certo. */
function arcoNoEixo(p: Percurso, eixo: number): number {
  const {eixos, arcos} = p;
  if (eixo <= eixos[0]) return 0;
  for (let i = 1; i < eixos.length; i++) {
    if (eixo <= eixos[i]) {
      const trecho = eixos[i] - eixos[i - 1];
      const f = trecho > 0 ? (eixo - eixos[i - 1]) / trecho : 1;
      return arcos[i - 1] + f * (arcos[i] - arcos[i - 1]);
    }
  }
  return p.total;
}

export function FioDoPercurso({
  children,
  className
}: {
  children: (acesos: number) => ReactNode;
  className?: string;
}) {
  const caixa = useRef<HTMLDivElement>(null);
  const reduzido = useReducedMotion();
  const [percurso, setPercurso] = useState<Percurso | null>(null);
  const [acesos, setAcesos] = useState(0);

  // O percurso sai do layout e é refeito a cada mudança de tamanho. O
  // ResizeObserver dispara uma vez ao começar a observar: é a única medição.
  useLayoutEffect(() => {
    const el = caixa.current;
    if (!el) return;
    const medir = () => {
      const r = el.getBoundingClientRect();
      const centros: Ponto[] = [...el.querySelectorAll<HTMLElement>('[data-medalhao]')].map((m) => {
        const b = m.getBoundingClientRect();
        return {x: b.left - r.left + b.width / 2, y: b.top - r.top + b.height / 2};
      });
      if (!centros.length) return;
      const horizontal = window.innerWidth >= 1024;
      const a = centros[0];
      const z = centros[centros.length - 1];
      // O fio entra e sai para além das pontas, 48px no computador e 40px no celular.
      const pontos: Ponto[] = horizontal
        ? [{x: -48, y: a.y}, ...centros, {x: r.width + 48, y: z.y}]
        : [{x: a.x, y: -40}, ...centros, {x: z.x, y: r.height + 40}];
      const noEixo = (p: Ponto) => (horizontal ? p.x : p.y);
      const arcos = [0];
      for (let i = 1; i < pontos.length; i++) {
        arcos.push(arcos[i - 1] + Math.hypot(pontos[i].x - pontos[i - 1].x, pontos[i].y - pontos[i - 1].y));
      }
      setPercurso({
        d: pontos.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' '),
        horizontal,
        eixos: pontos.map(noEixo),
        arcos,
        total: arcos[arcos.length - 1],
        medalhoes: centros.map(noEixo)
      });
    };
    const observador = new ResizeObserver(medir);
    observador.observe(el);
    return () => observador.disconnect();
  }, []);

  // Do primeiro medalhão entrando a 85% da tela até o último passando dos 60%.
  const {scrollYProgress} = useScroll({target: caixa, offset: ['start 85%', 'end 60%']});
  const tracado = useSpring(scrollYProgress, {stiffness: 400, damping: 80, restDelta: 0.001});
  // A ponta da luz no eixo do caminho, com a mesma mola do traço.
  const pontaNoEixo = useSpring(
    useTransform(scrollYProgress, (v) => (percurso ? percurso.eixos[0] + v * (percurso.eixos.at(-1)! - percurso.eixos[0]) : 0)),
    {stiffness: 400, damping: 80, restDelta: 0.5}
  );
  const pontaNoArco = useTransform(pontaNoEixo, (v) => (percurso ? arcoNoEixo(percurso, v) : 0));

  // Cada segmento termina na ponta: o traço começa em (ponta - comprimento).
  const deslocamentos = [
    useTransform(pontaNoArco, (s) => -(s - LUZ[0].comprimento)),
    useTransform(pontaNoArco, (s) => -(s - LUZ[1].comprimento)),
    useTransform(pontaNoArco, (s) => -(s - LUZ[2].comprimento))
  ];

  useMotionValueEvent(pontaNoEixo, 'change', (v) => {
    if (!percurso) return;
    setAcesos(percurso.medalhoes.filter((m) => m <= v + 4).length);
  });

  const quantos = reduzido ? (percurso?.medalhoes.length ?? 3) : acesos;

  return (
    <div ref={caixa} className={cn('relative', className)}>
      {percurso ? (
        <svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" fill="none">
          {/* O trilho apagado, inteiro o tempo todo. */}
          <path d={percurso.d} stroke="var(--cor-lapis)" strokeWidth="1.25" strokeOpacity="0.7" />
          {/* O traço que fica: se desenha com a rolagem e não some. */}
          <motion.path
            d={percurso.d}
            stroke="var(--cor-latao)"
            strokeWidth="1.5"
            strokeOpacity="0.6"
            strokeLinecap="round"
            style={{pathLength: reduzido ? 1 : tracado}}
          />
          {/* A luz: três segmentos terminando na ponta, do mais longo e fraco ao mais curto e claro. */}
          {!reduzido
            ? LUZ.map((segmento, i) => (
                <motion.path
                  key={i}
                  d={percurso.d}
                  stroke={segmento.cor}
                  strokeOpacity={segmento.opacidade}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeDasharray={`${segmento.comprimento} ${percurso.total + 400}`}
                  style={{strokeDashoffset: deslocamentos[i]}}
                />
              ))
            : null}
        </svg>
      ) : null}
      <div className="relative">{children(quantos)}</div>
    </div>
  );
}
