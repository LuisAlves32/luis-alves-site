// Página original (21st.dev): https://21st.dev/@ddoemonn/components/reading-progress
// Licença: MIT, Copyright (c) 2026 ozzy (ddoemonn/interior). Créditos completos em CREDITOS.md.
'use client';

import {motion, useReducedMotion} from 'framer-motion';
import {useEffect, useRef, useState, type ReactNode} from 'react';

/* Origem: 21st.dev, "Reading Progress" de ddoemonn (demo 23553), escolhido para a RÉGUA
   DA LEITURA do Second Opinion (blog/componentes-blog.md, design-blog.md 5.5).

   O que veio dele, intacto: o gancho `useProgressoDaLeitura` (a leitura da posição por
   `getBoundingClientRect` do alvo, agrupada por quadro, em degraus, com setState só
   quando o degrau muda), a mola do preenchimento, o tempo que falta pelas palavras, o
   `role="progressbar"` completo e o traço que se DESENHA uma vez no fim (`pathLength`),
   fora do laço da rolagem. Movimento reduzido: tudo instantâneo, nada escondido (a régua
   é informação, não enfeite).

   O que mudou (passada de tokens e adaptação criativa aprovada no Passe 0):
   1. `motion/react` virou `framer-motion`; cores e fontes viraram os tokens do projeto.
   2. A FORMA é a cota do Luís: no computador, uma cota VERTICAL na margem esquerda, com
      uma marca em cada subtítulo (cota de nível) que acende em Avanço quando o leitor
      passa; no celular, uma linha de 3px no topo da tela, com as mesmas marcas.
   3. O check do fim virou o L/ da marca, o visto que o brand guide diz que ele é.
   4. Os textos vêm por propriedade (EN e PT) e o mostrador tem 12px, não 10,5px.
   Posse do movimento: o Framer daqui de dentro. A câmera (GSAP) não escreve aqui. */

const MOLA = {type: 'spring', stiffness: 210, damping: 34, mass: 0.9} as const;
const DESENHO = {duration: 0.45, ease: [0.23, 1, 0.32, 1], delay: 0.08} as const;
const JA = {duration: 0} as const;

type Ref = {readonly current: HTMLElement | null};

function entre0e1(n: number) {
  if (!Number.isFinite(n) || n < 0) return 0;
  return n > 1 ? 1 : n;
}

/** O gancho do original: o progresso do leitor ao longo de `alvo`, em `degraus`. */
export function useProgressoDaLeitura({alvo, degraus = 48}: {alvo: Ref; degraus?: number}) {
  const [degrau, setDegrau] = useState(0);
  const quadro = useRef(0);

  useEffect(() => {
    const ler = () => {
      quadro.current = 0;
      const el = alvo.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const percurso = r.height - window.innerHeight;
      const razao = percurso <= 0 ? 1 : -r.top / percurso;
      const proximo = Math.round(entre0e1(razao) * degraus);
      setDegrau((d) => (d === proximo ? d : proximo));
    };
    const agendar = () => {
      if (quadro.current) return;
      quadro.current = requestAnimationFrame(ler);
    };
    window.addEventListener('scroll', agendar, {passive: true});
    window.addEventListener('resize', agendar);
    const observador = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(agendar);
    if (observador && alvo.current) observador.observe(alvo.current);
    // A primeira leitura no próximo quadro (o ResizeObserver também dispara ao observar).
    agendar();
    return () => {
      window.removeEventListener('scroll', agendar);
      window.removeEventListener('resize', agendar);
      observador?.disconnect();
      if (quadro.current) cancelAnimationFrame(quadro.current);
      quadro.current = 0;
    };
  }, [alvo, degraus]);

  const progresso = degraus > 0 ? degrau / degraus : 1;
  return {degrau, degraus, progresso, completo: degrau >= degraus};
}

/** Onde cada subtítulo cai, de 0 a 1, ao longo do alvo. */
function useMarcas(alvo: Ref) {
  const [marcas, setMarcas] = useState<number[]>([]);
  useEffect(() => {
    const el = alvo.current;
    if (!el) return;
    const medir = () => {
      const r = el.getBoundingClientRect();
      const percurso = Math.max(1, r.height - window.innerHeight);
      setMarcas(
        [...el.querySelectorAll('h2')].map((h) => entre0e1((h.getBoundingClientRect().top - r.top - window.innerHeight * 0.3) / percurso))
      );
    };
    const observador = new ResizeObserver(medir);
    observador.observe(el);
    return () => observador.disconnect();
  }, [alvo]);
  return marcas;
}

export function LeituraDaNota({
  children,
  palavras,
  palavrasPorMinuto = 200,
  rotulo,
  falta,
  lido
}: {
  children: ReactNode;
  palavras: number;
  palavrasPorMinuto?: number;
  /** Nome acessível da régua. */
  rotulo: string;
  /** "{n} min left" / "faltam {n} min", com {n}. */
  falta: string;
  /** "Read" / "Lida". */
  lido: string;
}) {
  const alvo = useRef<HTMLDivElement>(null);
  const reduzido = useReducedMotion();
  const {degrau, degraus, progresso, completo} = useProgressoDaLeitura({alvo});
  const marcas = useMarcas(alvo);
  const minutosFaltando = Math.ceil(((1 - progresso) * palavras) / palavrasPorMinuto);
  const mostrador = completo ? lido : falta.replace('{n}', String(Math.max(1, minutosFaltando)));
  const mola = reduzido ? JA : MOLA;

  return (
    <div className="nota-leitura">
      {/* O valor acessível, uma vez só; as duas réguas visuais são decorativas. */}
      <div
        role="progressbar"
        aria-label={rotulo}
        aria-valuemin={0}
        aria-valuemax={degraus}
        aria-valuenow={degrau}
        aria-valuetext={`${Math.round(progresso * 100)}%, ${mostrador}`}
        className="sr-only"
      />

      {/* CELULAR: a linha no topo da tela. */}
      <div className="regua-topo" aria-hidden="true" data-owner="catalogo">
        <span data-regua="trilho" />
        <motion.span data-regua="feito" initial={false} animate={{scaleX: progresso}} transition={mola} />
        {marcas.map((m, i) => (
          <span key={i} data-regua="marca" data-lida={progresso >= m || undefined} style={{left: `${m * 100}%`}} />
        ))}
      </div>

      {/* COMPUTADOR: a cota vertical na margem. */}
      <aside className="regua-leitura" aria-hidden="true" data-owner="catalogo">
        <div className="regua-cola">
          <span data-regua="trilho" />
          <motion.span data-regua="feito" initial={false} animate={{scaleY: progresso}} transition={mola} />
          <span data-regua="ponta" />
          {marcas.map((m, i) => (
            <span key={i} data-regua="marca" data-lida={progresso >= m || undefined} style={{top: `calc(${m} * (100% - 40px))`}} />
          ))}
          <p data-regua="falta">
            {completo ? (
              <svg width="18" height="16" viewBox="0 0 24 21" fill="none" className="mb-1.5 ml-auto block">
                <motion.path
                  d="M3 2v17h9"
                  stroke="var(--cor-tinta)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{pathLength: reduzido ? 1 : 0}}
                  animate={{pathLength: 1}}
                  transition={reduzido ? JA : DESENHO}
                />
                <motion.path
                  d="M13 19L20 2"
                  stroke="var(--cor-avanco)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  initial={{pathLength: reduzido ? 1 : 0}}
                  animate={{pathLength: 1}}
                  transition={reduzido ? JA : {...DESENHO, delay: 0.3}}
                />
              </svg>
            ) : null}
            {mostrador}
          </p>
        </div>
      </aside>

      <div ref={alvo} className="leitura-alvo">
        {children}
      </div>
    </div>
  );
}
