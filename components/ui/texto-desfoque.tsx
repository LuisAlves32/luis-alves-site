// Página original (21st.dev): https://21st.dev/@educalvolpz/components/soft-blur-in
// Licença: MIT, Copyright (c) 2024 Eduardo Calvo. Créditos completos em CREDITOS.md.
'use client';

import {motion, useInView} from 'framer-motion';
import {useReducedMotion} from '@/lib/movimento-reduzido';
import {useRef} from 'react';

/* Origem: 21st.dev, "Soft Blur In" de educalvolpz (demo 19835), escolhido
 * pelo diretor para a entrada da headline da landing do guia. Cada letra sai
 * de um desfoque com uma subida curta, no ease de saída da Apple. Posse do
 * movimento: o Framer daqui de dentro. A animação do componente entra
 * INTEIRA; o que mudou foi a passada de tokens e três adaptações de uso:
 *
 * 1. `motion/react` virou `framer-motion`, que é o pacote deste projeto.
 * 2. `indiceInicial`: a headline tem uma palavra em destaque no meio, com
 *    outro peso e outra cor, então ela é composta de TRÊS segmentos deste
 *    componente. Sem este número cada segmento recomeçaria o escalonamento do
 *    zero e as três partes entrariam ao mesmo tempo; com ele, o segmento sabe
 *    quantas letras vieram antes e continua a sequência de onde a anterior
 *    parou. A frase entra como UMA frase.
 * 3. AS PALAVRAS NÃO QUEBRAM NO MEIO. O autor põe cada letra num
 *    `inline-block` solto, e o navegador quebra linha entre letras ("num /
 *    ber", medido na primeira prova). Aqui cada PALAVRA é um `inline-block`
 *    com `white-space: nowrap`, e os espaços entre elas são espaços comuns:
 *    a linha só quebra onde a língua quebra. O escalonamento continua por
 *    letra, contando os espaços, para o ritmo da entrada não mudar.
 * 4. Movimento reduzido: texto parado desde o primeiro quadro (o original já
 *    fazia isso; fica registrado que é lei do movimento.md). */

const DURACAO_S = 0.9;
const MS = 1000;
const EASE = [0.22, 1, 0.36, 1] as const;

export function TextoDesfoque({
  children,
  className = '',
  delay = 0,
  stagger = 25,
  aoEntrar = false,
  indiceInicial = 0
}: {
  children: string;
  className?: string;
  /** Atraso antes de começar, em ms. */
  delay?: number;
  /** Escalonamento entre letras, em ms. */
  stagger?: number;
  /** Só anima quando o texto entra na tela. */
  aoEntrar?: boolean;
  /** Quantas letras vieram antes deste segmento, para a sequência continuar. */
  indiceInicial?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const naTela = useInView(ref, {once: true});
  const reduzido = useReducedMotion();
  const toca = (!aoEntrar || naTela) && !reduzido;

  // Palavras e espaços, na ordem, cada um sabendo em que letra global começa
  // (computado de uma vez, sem variável mutada durante o render).
  const segmentos = children
    .split(/(\s+)/)
    .filter((p) => p.length > 0)
    .reduce<{texto: string; espaco: boolean; inicio: number}[]>((lista, texto) => {
      const anterior = lista[lista.length - 1];
      const inicio = anterior ? anterior.inicio + anterior.texto.length : indiceInicial;
      lista.push({texto, espaco: /^\s+$/.test(texto), inicio});
      return lista;
    }, []);

  return (
    <span aria-label={children} className={className} ref={ref}>
      {segmentos.map((seg, p) => {
        if (seg.espaco) {
          return (
            <span key={p} aria-hidden="true">
              {seg.texto}
            </span>
          );
        }
        const inicioDaPalavra = seg.inicio;
        return (
          <span key={p} aria-hidden="true" style={{display: 'inline-block', whiteSpace: 'nowrap'}}>
            {Array.from(seg.texto).map((letra, i) => (
              <motion.span
                key={i}
                initial={reduzido ? {opacity: 1} : {opacity: 0, y: 16, filter: 'blur(12px)'}}
                animate={toca ? {opacity: 1, y: 0, filter: 'blur(0px)'} : undefined}
                style={{display: 'inline-block'}}
                transition={
                  reduzido
                    ? {duration: 0}
                    : {
                        duration: DURACAO_S,
                        delay: delay / MS + ((inicioDaPalavra + i) * stagger) / MS,
                        ease: EASE
                      }
                }
              >
                {letra}
              </motion.span>
            ))}
          </span>
        );
      })}
    </span>
  );
}
