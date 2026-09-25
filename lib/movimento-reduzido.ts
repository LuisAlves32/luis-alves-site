import {useSyncExternalStore} from 'react';

/**
 * MOVIMENTO REDUZIDO SEM QUEBRAR A HIDRATAÇÃO (25/09/2026).
 *
 * Substitui o `useReducedMotion` do Framer em todo componente que decide MARCAÇÃO com ele
 * (`initial`, classe, estilo, layout). O do Framer nasce, no navegador, já com o valor do
 * aparelho; no servidor ele é nulo. Com movimento reduzido ligado, o primeiro desenho do
 * navegador divergia do HTML do servidor e o React descartava a árvore inteira (erro #418),
 * MEDIDO na home, no About e na landing do guia: `CartaoIdentidade`, `PilhaCards`,
 * `FilmeMiniaturas`, `JanelaDaManha` e `TextoDesfoque` desenhavam outra coisa.
 *
 * Aqui a hidratação usa o MESMO valor do servidor (falso) e, logo depois, o React troca para o
 * valor real do aparelho e acompanha a mudança se a pessoa mexer na configuração. É o padrão
 * do próprio React para valor que só o navegador conhece (`useSyncExternalStore` com o valor do
 * servidor). O `MotionConfig reducedMotion="user"` do `motion-provider.tsx` segura o resto:
 * nesse instante o Framer já não anima deslocamento para quem pediu menos movimento.
 */
const CONSULTA = '(prefers-reduced-motion: reduce)';

function assinar(avisar: () => void) {
  const mq = window.matchMedia(CONSULTA);
  mq.addEventListener('change', avisar);
  return () => mq.removeEventListener('change', avisar);
}

const noAparelho = () => window.matchMedia(CONSULTA).matches;
const noServidor = () => false;

export function useReducedMotion(): boolean {
  return useSyncExternalStore(assinar, noAparelho, noServidor);
}
