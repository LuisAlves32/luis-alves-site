// Página original (21st.dev): https://21st.dev/@educalvolpz/components/hover-image-list
// Licença: MIT, Copyright (c) 2024 Eduardo Calvo (educlopez/smoothui). Créditos completos em CREDITOS.md.
'use client';

import {AnimatePresence, motion, useMotionValue, useSpring} from 'framer-motion';
import {useReducedMotion} from '@/lib/movimento-reduzido';
import type {FocusEvent, PointerEvent, ReactNode} from 'react';
import {useCallback, useEffect, useRef, useState, useSyncExternalStore} from 'react';
import {cn} from '@/lib/utils';

/* Origem: 21st.dev, "Hover Image List" de educalvolpz (demo 28258), escolhido para o
   ÍNDICE DO DOSSIÊ do Second Opinion (blog/componentes-blog.md): passar o ponteiro ou
   o foco numa linha acende a capa daquela nota ao lado.

   O que veio dele, intacto: a prévia que segue o ponteiro por mola (`useSpring` em x e
   y), a inclinação pela VELOCIDADE do ponteiro (`skewX`, com teto de 8 graus), o
   movimento agrupado por quadro (`requestAnimationFrame`), a posição FIXA quando a
   linha é ativada pelo teclado, e o comportamento no toque (sem hover, sem prévia: a
   linha já traz o número). É a RESPOSTA do pico 1 (movimento-blog.md, seção 3).

   O que mudou (passada de tokens e adaptação de uso, 24/09/2026):
   1. `motion/react` virou `framer-motion` (o projeto não tem o pacote `motion`).
   2. A prévia não é foto: é um ReactNode (a CAPA DE COTA da nota, desenhada pelo código),
      com largura e altura próprias em vez de um quadrado, porque a capa é 3:2.
   3. As linhas chegam PRONTAS do servidor (o `Link` com o N.º, o título e o valor): o
      componente só observa ponteiro e foco no `li`. Sai o `ArrowUpRight` e o `text-brand`
      (token inexistente aqui).
   4. Raio 12px e a sombra da variante mídia do design.md (objeto flutuante), tingida
      na Tinta, no lugar do `rounded-2xl shadow-xl`.
   5. A troca de uma capa para outra é um corte limpo com a opacidade do contêiner (o
      `AnimatePresence` com a imagem saindo por dentro não faz sentido para uma capa que
      é texto), o que também tira a duplicação momentânea de conteúdo.
   Posse do movimento: o Framer daqui de dentro. A câmera (GSAP) não escreve aqui. */

export type LinhaComPrevia = {id: string; conteudo: ReactNode; previa: ReactNode};

type Origem = 'foco' | 'ponteiro' | null;

const MOLA = {damping: 26, stiffness: 260};
const MOLA_INCLINACAO = {damping: 18, stiffness: 220};
const INCLINACAO_MAXIMA = 8;
const FATOR_INCLINACAO = 0.12;
const DELTA_MAXIMO_MS = 50;

const limitar = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

const CONSULTA_HOVER = '(hover: hover) and (pointer: fine)';
function assinarHover(avisar: () => void) {
  const consulta = window.matchMedia(CONSULTA_HOVER);
  consulta.addEventListener('change', avisar);
  return () => consulta.removeEventListener('change', avisar);
}
const lerHover = () => window.matchMedia(CONSULTA_HOVER).matches;

export function ListaComPrevia({
  linhas,
  larguraPrevia = 300,
  alturaPrevia = 200,
  className,
  classeLista,
  rotulo,
  idLista
}: {
  linhas: LinhaComPrevia[];
  larguraPrevia?: number;
  alturaPrevia?: number;
  className?: string;
  classeLista?: string;
  rotulo?: string;
  idLista?: string;
}) {
  const reduzido = useReducedMotion();
  // Aparelho com ponteiro fino e hover, lido como loja externa (no servidor: não).
  const temHover = useSyncExternalStore(assinarHover, lerHover, () => false);
  const [ativa, setAtiva] = useState<number | null>(null);
  const [origem, setOrigem] = useState<Origem>(null);
  const caixa = useRef<HTMLDivElement>(null);
  const ultimo = useRef<{t: number; x: number; y: number} | null>(null);
  const pendente = useRef<{x: number; y: number} | null>(null);
  const quadroPedido = useRef(false);
  const idQuadro = useRef<number | null>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const inclinacao = useMotionValue(0);
  const xMola = useSpring(x, MOLA);
  const yMola = useSpring(y, MOLA);
  const inclinacaoMola = useSpring(inclinacao, MOLA_INCLINACAO);

  useEffect(
    () => () => {
      if (idQuadro.current !== null) cancelAnimationFrame(idQuadro.current);
    },
    []
  );

  const fixa = Boolean(reduzido) || !temHover || origem === 'foco';

  const ativar = (i: number, o: Origem) => {
    setAtiva(i);
    setOrigem(o);
  };
  const desativar = (o: Origem) => {
    setAtiva(null);
    setOrigem((atual) => (atual === o ? null : atual));
  };

  const aoMoverPonteiro = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      if (fixa) return;
      pendente.current = {x: e.clientX, y: e.clientY};
      if (quadroPedido.current) return;
      quadroPedido.current = true;
      idQuadro.current = requestAnimationFrame((agora) => {
        quadroPedido.current = false;
        const p = pendente.current;
        const c = caixa.current;
        if (!(p && c)) return;
        const r = c.getBoundingClientRect();
        const lx = p.x - r.left;
        const ly = p.y - r.top;
        let vx = 0;
        if (ultimo.current) {
          const dt = Math.min(agora - ultimo.current.t, DELTA_MAXIMO_MS);
          if (dt > 0) vx = (lx - ultimo.current.x) / dt;
        }
        ultimo.current = {t: agora, x: lx, y: ly};
        inclinacao.set(limitar(vx * FATOR_INCLINACAO, -INCLINACAO_MAXIMA, INCLINACAO_MAXIMA));
        // A capa ao lado do ponteiro, não embaixo dele: o título da linha continua legível.
        x.set(lx + 28);
        y.set(ly - alturaPrevia / 2);
      });
    },
    [fixa, alturaPrevia, inclinacao, x, y]
  );

  const aoSairDaLista = () => {
    desativar('ponteiro');
    ultimo.current = null;
  };
  const aoPerderFoco = (e: FocusEvent<HTMLDivElement>) => {
    if (origem === 'foco' && !e.currentTarget.contains(e.relatedTarget)) desativar('foco');
  };

  const previa = ativa === null ? null : linhas[ativa]?.previa;
  const posicao = fixa
    ? {width: larguraPrevia, height: alturaPrevia}
    : {width: larguraPrevia, height: alturaPrevia, left: 0, top: 0, x: xMola, y: yMola};

  return (
    // Só observa o ponteiro e o foco saindo da lista, para apagar a prévia.
    <div
      ref={caixa}
      className={cn('relative', className)}
      onBlur={aoPerderFoco}
      onPointerLeave={aoSairDaLista}
      onPointerMove={aoMoverPonteiro}
    >
      <ol id={idLista} className={classeLista} aria-label={rotulo}>
        {/* O filtro (indice-do-dossie.tsx) troca as linhas: a que sai some em 140ms e as que
            ficam deslizam para o lugar novo. Gesto do Filter Grid 23525, com a curva da marca. */}
        <AnimatePresence initial={false} mode="popLayout">
          {linhas.map((l, i) => (
            <motion.li
              key={l.id}
              layout={reduzido ? false : 'position'}
              initial={{opacity: 0}}
              animate={{opacity: 1}}
              exit={{opacity: 0, transition: reduzido ? {duration: 0} : {duration: 0.14, ease: [0.4, 0, 1, 1]}}}
              transition={reduzido ? {duration: 0} : {type: 'tween', duration: 0.5, ease: [0.16, 1, 0.3, 1]}}
              onFocus={() => ativar(i, 'foco')}
              onMouseEnter={() => {
                if (temHover) ativar(i, 'ponteiro');
              }}
            >
              {l.conteudo}
            </motion.li>
          ))}
        </AnimatePresence>
      </ol>

      {/* A capa flutuante: decorativa (o número já está na linha), fora da árvore de acessibilidade. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden overflow-visible lg:block">
        <motion.div
          className={cn(
            'absolute overflow-hidden rounded-[12px] shadow-[0_18px_40px_-18px_rgba(14,36,64,0.35)]',
            fixa && 'right-6 top-1/2 -translate-y-1/2'
          )}
          initial={{opacity: 0, scale: reduzido ? 1 : 0.94}}
          animate={reduzido ? {opacity: previa ? 1 : 0} : {opacity: previa ? 1 : 0, scale: previa ? 1 : 0.94}}
          style={{...posicao, skewX: reduzido || fixa ? 0 : inclinacaoMola}}
          transition={reduzido ? {duration: 0} : {bounce: 0.1, duration: 0.25, type: 'spring'}}
        >
          {previa}
        </motion.div>
      </div>
    </div>
  );
}
