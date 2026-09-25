// Página original (21st.dev): https://21st.dev/@danielpetho/components/stacking-cards
// Licença: MIT, Copyright (c) 2024 Daniel Petho. Créditos completos em CREDITOS.md.
'use client';

import {createContext, useContext, useRef, type HTMLAttributes, type PropsWithChildren} from 'react';
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
  type UseScrollOptions
} from 'framer-motion';
import {cn} from '@/lib/utils';

/* Origem: 21st.dev, "Stacking Cards" de danielpetho (fancycomponents, demo
 * 25275; autor do código Khoa Phan). Escolhido pelo diretor para a seção 2
 * da landing do guia: cada uma das três "coisas" é uma ficha que prende no
 * topo e recua de escala quando a próxima chega por cima. Sticky nativo, só
 * `scale` (transform) dirigido pelo progresso da rolagem. Posse do movimento:
 * o Framer daqui de dentro. A animação entra INTEIRA; `motion/react` virou
 * `framer-motion` e os nomes ficaram em português. Movimento reduzido (lei do
 * movimento.md): as fichas empilham sem recuar de escala. */

interface FichasProps extends PropsWithChildren, HTMLAttributes<HTMLDivElement> {
  opcoesRolagem?: UseScrollOptions;
  fatorEscala?: number;
  total: number;
}

interface FichaProps extends HTMLAttributes<HTMLDivElement>, PropsWithChildren {
  indice: number;
  topo?: string;
}

const Contexto = createContext<{
  progresso: MotionValue<number>;
  fatorEscala?: number;
  total?: number;
} | null>(null);

export function FichasEmpilhadas({children, className, opcoesRolagem, fatorEscala, total, ...props}: FichasProps) {
  const alvo = useRef<HTMLDivElement>(null);
  const {scrollYProgress} = useScroll({
    offset: ['start start', 'end end'],
    ...opcoesRolagem,
    target: alvo
  });

  return (
    <Contexto.Provider value={{progresso: scrollYProgress, fatorEscala, total}}>
      <div className={cn(className)} ref={alvo} {...props}>
        {children}
      </div>
    </Contexto.Provider>
  );
}

export function Ficha({indice, topo, className, children, ...props}: FichaProps) {
  const contexto = useContext(Contexto);
  if (!contexto) throw new Error('Ficha deve viver dentro de FichasEmpilhadas');
  const {progresso, fatorEscala, total = 0} = contexto;
  const reduzido = useReducedMotion();

  const escalaFinal = 1 - (total - indice) * (fatorEscala ?? 0.03);
  const faixa = [indice * (1 / total), 1];
  const escala = useTransform(progresso, faixa, [1, escalaFinal]);
  const top = topo ?? `${5 + indice * 3}%`;

  return (
    <div className={cn('sticky top-0 h-full', className)} {...props}>
      <motion.div className="relative h-full origin-top" style={{top, scale: reduzido ? 1 : escala}}>
        {children}
      </motion.div>
    </div>
  );
}
