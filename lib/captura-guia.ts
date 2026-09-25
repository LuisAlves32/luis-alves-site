/* O E-MAIL QUE VIAJA DA HERO PARA O FORMULÁRIO FINAL.
 *
 * A landing tem UM formulário de verdade, no CTA final. O campo da hero é o
 * começo dele: a pessoa digita o e-mail, o texto se desfaz, e a página desce
 * até o formulário já com o e-mail preenchido e o foco no nome. Duas fontes
 * de verdade para o dado que É a conversão seriam um defeito; por isso o
 * e-mail passa por aqui, uma vez, e o formulário o lê.
 *
 * `sessionStorage` e não `localStorage`: o e-mail de uma pessoa não pode
 * reaparecer no computador de outra num navegador compartilhado. Dura a aba. */

import {rolarAte} from '@/lib/rolagem';

export const ANCORA_FORMULARIO = 'guia-form';

/* Quanto dura a descida. O formulário final espera 750ms para pôr o foco no
   nome (formulario-final.tsx), então a descida tem que terminar ANTES disso,
   ou o foco chega no meio do caminho. Somando os 120ms que a hero espera para
   deixar a partícula começar a se desfazer, 0,6s fecha em 720ms. */
const SEGUNDOS_DA_DESCIDA = 0.6;
const CHAVE = 'guia-email';
const EVENTO = 'guia:email';

export function guardarEmail(email: string) {
  try {
    window.sessionStorage.setItem(CHAVE, email);
  } catch {
    // Armazenamento bloqueado: o evento abaixo ainda entrega o valor.
  }
  window.dispatchEvent(new CustomEvent<string>(EVENTO, {detail: email}));
}

export function lerEmail(): string {
  try {
    return window.sessionStorage.getItem(CHAVE) ?? '';
  } catch {
    return '';
  }
}

export function aoReceberEmail(ouvinte: (email: string) => void) {
  const tratar = (e: Event) => ouvinte((e as CustomEvent<string>).detail);
  window.addEventListener(EVENTO, tratar);
  return () => window.removeEventListener(EVENTO, tratar);
}

/** Desce até o formulário final; quem chega já encontra o e-mail no lugar. */
export function irParaFormulario() {
  const alvo = document.getElementById(ANCORA_FORMULARIO);
  if (!alvo) return;
  const reduzido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  /* Com movimento reduzido a Lenis NÃO é instanciada (motion-provider.tsx),
     então `rolarAte` devolve false e a descida cai no nativo, sem animação,
     que é o que o movimento reduzido pede. Fora dele, a Lenis é a dona da
     rolagem e é ela quem desce; o nativo só sobra se o provider ainda não
     montou, e aí `smooth` continua sendo o comportamento certo. */
  if (!reduzido && rolarAte(alvo, SEGUNDOS_DA_DESCIDA)) return;
  alvo.scrollIntoView({behavior: reduzido ? 'auto' : 'smooth', block: 'start'});
}
