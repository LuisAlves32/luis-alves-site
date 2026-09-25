/* O REGISTRO DA ROLAGEM SUAVE.
 *
 * A Lenis nasce e morre dentro do `MotionProvider`, que é o dono dela e usa a
 * classe core de propósito (com movimento reduzido ela não pode nem ser
 * instanciada, e montagem condicional de um wrapper remontaria a página).
 * Quem precisa PAUSAR a rolagem não pode instanciar outra nem alcançar aquela
 * por contexto de React, então o provider deixa a instância aqui, num registro
 * de um item só, e quem precisa pede pausa por nome.
 *
 * Dois pedintes hoje: o campo de e-mail da hero da landing do guia, quando o
 * teclado do celular abre (components/landing/teclado-do-campo.ts), e a
 * descida até o formulário final (lib/captura-guia.ts).
 *
 * Sem Lenis (movimento reduzido, ou provider ainda não montado), pausar e
 * retomar não fazem nada: a rolagem nativa segue, que é o certo. */

import type Lenis from 'lenis';

let atual: Lenis | null = null;

/** Só o MotionProvider chama. `null` ao desmontar. */
export function registrarRolagem(lenis: Lenis | null) {
  atual = lenis;
}

/* `stop()` da Lenis 1.3 faz `reset()` antes de parar: mata qualquer rolagem
   suave em curso e sincroniza o valor interno com a rolagem real. `start()`
   faz o mesmo `reset()`, então retomar NÃO salta para uma posição velha
   (lido em node_modules/lenis/dist/lenis.mjs, internalStart/internalStop). */
export function pausarRolagem() {
  atual?.stop();
}

export function retomarRolagem() {
  atual?.start();
}

/* A DESCIDA ATÉ UM ALVO, pela Lenis quando ela existe.
 *
 * Por que não `scrollIntoView` nativo: com a Lenis viva, a rolagem suave do
 * navegador e o laço dela disputam a mesma posição do documento, e o resultado
 * não é uma descida, é uma queda de braço. Descer é trabalho da Lenis quando a
 * Lenis é a dona da rolagem.
 *
 * Devolve `false` quando não há Lenis (movimento reduzido, ou provider ainda
 * não montado). Quem chama decide o que fazer nesse caso, porque a alternativa
 * certa depende do lugar. */
export function rolarAte(alvo: HTMLElement, segundos: number): boolean {
  if (!atual) return false;
  atual.scrollTo(alvo, {
    duration: segundos,
    // Saída rápida e chegada macia: a descida é navegação, não cena.
    easing: (t: number) => 1 - Math.pow(1 - t, 3)
  });
  return true;
}
