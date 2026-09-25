// Página original (21st.dev): https://21st.dev/@youcefbnm/components/text-scroll-read
// Licença: MIT, Copyright (c) 2025 Youcef Benmessabih. Créditos completos em CREDITOS.md.
'use client';

import * as React from 'react';
import {
  motion,
  useScroll,
  useTransform,
  type HTMLMotionProps,
  type MotionValue
} from 'framer-motion';
import {cn} from '@/lib/utils';

/* Origem: 21st.dev, "Text Scroll Read" de youcefbnm (demo 19275), escolhido
 * pelo diretor para o bloco da simulação da landing do guia. As palavras
 * acendem da esquerda para a direita conforme a rolagem, por uma máscara de
 * gradiente recortada no texto: a pessoa lê linha por linha a conta que o
 * guia faz linha por linha. Posse do movimento: o Framer daqui de dentro.
 * Passada de tokens: o preto do autor virou Papel (o texto acende de Papel a
 * 22% para Papel cheio, sobre Tinta), o espaçador de 240px que vinha colado
 * no fim ficou opcional, e `motion/react` virou `framer-motion`.
 * Movimento reduzido: o texto nasce inteiro aceso (estado final). */

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  offset?: [string, string];
  classeEspaco?: string;
}

const Contexto = React.createContext<{progresso: MotionValue<number>} | undefined>(undefined);

function useContexto() {
  const c = React.useContext(Contexto);
  if (!c) throw new Error('TextoQueAcende: use dentro de <TextoQueAcende>');
  return c;
}

export function TextoQueAcende({
  classeEspaco,
  offset = ['start end', 'center start'],
  children,
  className,
  ...props
}: Props) {
  const ref = React.useRef<HTMLDivElement>(null);
  const {scrollYProgress} = useScroll({
    target: ref,
    // O tipo do Framer é uma união de literais; a string do chamador é válida.
    offset: offset as unknown as undefined
  });
  return (
    <Contexto.Provider value={{progresso: scrollYProgress}}>
      <div ref={ref} className={cn('relative', className)} {...props}>
        {children}
        {classeEspaco ? <div className={classeEspaco} /> : null}
      </div>
    </Contexto.Provider>
  );
}

export function TextoQueAcendeEnvelope({
  yEntrada = [0, 1],
  ySaida = [0, 0],
  style,
  ...props
}: HTMLMotionProps<'div'> & {yEntrada?: number[]; ySaida?: number[]; style?: React.CSSProperties}) {
  const {progresso} = useContexto();
  const y = useTransform(progresso, yEntrada, ySaida);
  return <motion.div style={{y, willChange: 'transform', ...style}} {...props} />;
}

export function TextoRecortado({className, style, ...props}: HTMLMotionProps<'span'>) {
  const {progresso} = useContexto();
  const reduzido =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const backgroundPositionX = useTransform(progresso, [0, 1], ['100%', '0%']);
  return (
    <motion.span
      className={cn('bg-[length:200%_100%] bg-clip-text bg-no-repeat bg-scroll text-transparent', className)}
      style={{
        backgroundImage:
          'linear-gradient(-90deg, color-mix(in srgb, var(--cor-papel) 22%, transparent) 50%, var(--cor-papel) 50%)',
        backgroundPositionX: reduzido ? '0%' : backgroundPositionX,
        ...style
      }}
      {...props}
    />
  );
}
