// Página original (21st.dev): https://21st.dev/@ravikatiyar162/components/parallax-card
// Licença: sem licença declarada pelo autor; usado com crédito, conforme os termos do 21st.dev. Créditos completos em CREDITOS.md.
'use client';

import * as React from 'react';
import Image from 'next/image';
import {motion, useMotionValue, useSpring, useTransform} from 'framer-motion';
import {useReducedMotion} from '@/lib/movimento-reduzido';
import {cn} from '@/lib/utils';

/* Origem: 21st.dev, "Parallax Card" de ravikatiyar162 (demo 7765), escolhido
 * pelo diretor para a foto do Luis na landing do guia. Um cartão que inclina
 * em 3D seguindo o ponteiro, com a imagem e o texto em profundidades
 * diferentes (a imagem anda mais que o texto), e a imagem transbordando a
 * borda de cima do cartão: com o recorte sem fundo do Luis, ele sai de dentro
 * da ficha. Posse do movimento: o Framer daqui de dentro (motion values, sem
 * estado por quadro). A animação entra INTEIRA. Passada de tokens:
 *
 * 1. Inclinação de 17,5 graus para 9: consultoria calma, não vitrine de jogo.
 * 2. A moldura em degradê do autor virou a ficha desta pele: Tinta, raio 12px,
 *    sem sombra, com o fio de latão na aresta de cima. O miolo claro saiu; a
 *    ficha é uma peça só.
 * 3. A imagem é o recorte real do Luis (nunca IA), com `next/image`.
 * 4. Toque e movimento reduzido: sem inclinação; o cartão fica parado na
 *    composição final.
 *
 * VERSÃO 3 (08/09/2026): o cartão cresce por `className` (a caixa da imagem
 * é quadrada, então escala com a largura em vez de ter altura fixa), o nome
 * é opcional (na landing ele subiu para a coluna de texto como display, e no
 * cartão fica só a linha), e existe a ENTRADA EM DUAS CAMADAS quando o
 * cartão chega na tela: a ficha sobe 32px e o recorte sobe 48px, um respiro
 * depois. É a caligrafia das camadas de manhã, dentro do dono desta seção, e
 * dá vida ao cartão sem depender do ponteiro. Movimento reduzido: parado. */

export function CartaoRetrato({
  imagem,
  alt,
  nome,
  linha,
  className,
  classeNome = '',
  classeLinha = '',
  entrada = false,
  tamanhos = '300px'
}: {
  imagem: {src: string; largura: number; altura: number};
  alt: string;
  nome?: React.ReactNode;
  linha: React.ReactNode;
  className?: string;
  classeNome?: string;
  classeLinha?: string;
  /** Entrada em duas camadas quando o cartão chega na tela, uma vez. */
  entrada?: boolean;
  /** `sizes` do `next/image`, para acompanhar a largura dada em `className`. */
  tamanhos?: string;
}) {
  const reduzido = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const xMola = useSpring(x, {stiffness: 300, damping: 30, bounce: 0});
  const yMola = useSpring(y, {stiffness: 300, damping: 30, bounce: 0});

  const rotateX = useTransform(yMola, [-0.5, 0.5], ['9deg', '-9deg']);
  const rotateY = useTransform(xMola, [-0.5, 0.5], ['-9deg', '9deg']);
  const yImagem = useTransform(yMola, [-0.5, 0.5], [-14, 14]);
  const yTexto = useTransform(yMola, [-0.5, 0.5], [10, -10]);

  const aoMover = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reduzido) return;
    const r = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - r.left) / r.width - 0.5);
    y.set((e.clientY - r.top) / r.height - 0.5);
  };
  const aoSair = () => {
    x.set(0);
    y.set(0);
  };

  const anima = entrada && !reduzido;
  const suave = {duration: 0.9, ease: [0.16, 1, 0.3, 1] as const};

  return (
    <motion.div
      onMouseMove={aoMover}
      onMouseLeave={aoSair}
      style={{rotateY, rotateX, transformStyle: 'preserve-3d'}}
      className={cn('relative w-[300px]', className)}
    >
      {/* A FACE da ficha (Tinta, raio, fio de latão) mora na camada que sobe
          em Z, e não no invólucro que só inclina: com o fundo no invólucro, a
          perspectiva descolava o fio da borda (medido: 12px acima do navy).
          A entrada anima ESTE invólucro (opacidade e subida), que não disputa
          transform com a inclinação do de fora nem com o Z de dentro. */}
      <motion.div
        initial={anima ? {opacity: 0, y: 32} : false}
        whileInView={anima ? {opacity: 1, y: 0} : undefined}
        viewport={{once: true, amount: 0.35}}
        transition={suave}
        style={{transformStyle: 'preserve-3d'}}
        className="relative h-full"
      >
        <div
          style={{transform: 'translateZ(40px)', transformStyle: 'preserve-3d'}}
          className="relative flex h-full flex-col rounded-[12px] bg-tinta"
        >
          <span aria-hidden="true" className="absolute left-6 top-0 h-[3px] w-11 rounded-b-[2px] bg-latao" />
          <motion.div
            style={{translateY: yImagem, transform: 'translateZ(30px)'}}
            className="relative -mt-12 aspect-square w-full"
          >
            {/* A segunda camada da entrada: o recorte sobe mais que a ficha,
                um respiro depois. Elemento próprio, para não escrever no
                mesmo transform que o ponteiro dirige. */}
            <motion.div
              initial={anima ? {y: 48} : false}
              whileInView={anima ? {y: 0} : undefined}
              viewport={{once: true, amount: 0.35}}
              transition={{...suave, delay: 0.1}}
              className="absolute inset-0"
            >
              <Image
                src={imagem.src}
                alt={alt}
                width={imagem.largura}
                height={imagem.altura}
                sizes={tamanhos}
                className="pointer-events-none absolute bottom-0 left-1/2 h-[112%] w-auto max-w-none -translate-x-1/2 object-contain object-bottom"
              />
            </motion.div>
          </motion.div>
          <motion.div
            style={{translateY: yTexto, transform: 'translateZ(24px)'}}
            className="relative border-t border-papel/12 px-6 pb-6 pt-5 text-papel"
          >
            {/* `div` e não `p`: o nome pode chegar como título (h2), e h2 dentro
                de p é marcação inválida que quebra a hidratação. */}
            {nome ? <div className={classeNome}>{nome}</div> : null}
            <p className={cn('text-[13px] leading-snug text-papel/70', nome ? 'mt-1.5' : '', classeLinha)}>{linha}</p>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}
