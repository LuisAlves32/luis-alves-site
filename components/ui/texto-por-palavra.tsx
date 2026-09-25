'use client';

import {motion, useReducedMotion} from 'framer-motion';
import {cn} from '@/lib/utils';

/* TEXTO QUE SE REVELA PALAVRA A PALAVRA, uma vez, quando entra na tela.
 *
 * Gatilho de entrada (não é trilho): cada palavra sobe 10px e aparece, em
 * cascata curta. Só transform e opacity. A divisão é pelo ESPAÇO COMUM: o
 * espaço inflexível que o acabamento de órfãs (i18n/request.ts) põe entre
 * as duas últimas palavras não é separador aqui, então as duas continuam
 * coladas como o acabamento manda. A copy chega verbatim e sai verbatim.
 * Movimento reduzido: texto pronto. */
export function TextoPorPalavra({
  children,
  className,
  atraso = 0,
  passo = 0.014
}: {
  children: string;
  className?: string;
  /** Segundos antes da primeira palavra. */
  atraso?: number;
  /** Segundos entre uma palavra e a seguinte. */
  passo?: number;
}) {
  const reduzido = useReducedMotion();
  const palavras = children.split(' ');

  if (reduzido) return <span className={className}>{children}</span>;

  return (
    <motion.span
      className={cn('inline', className)}
      initial="antes"
      whileInView="depois"
      viewport={{once: true, amount: 0.4}}
      transition={{staggerChildren: passo, delayChildren: atraso}}
    >
      {palavras.map((palavra, i) => (
        <motion.span
          key={`${palavra}-${i}`}
          className="inline-block"
          variants={{antes: {opacity: 0, y: 10}, depois: {opacity: 1, y: 0}}}
          transition={{duration: 0.55, ease: [0.16, 1, 0.3, 1]}}
        >
          {palavra}
          {i < palavras.length - 1 ? ' ' : ''}
        </motion.span>
      ))}
    </motion.span>
  );
}
