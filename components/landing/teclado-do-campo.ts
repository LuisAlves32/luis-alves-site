'use client';

import {useEffect, type RefObject} from 'react';
import type {ScrollTrigger} from 'gsap/ScrollTrigger';
import {pausarRolagem, retomarRolagem} from '@/lib/rolagem';

/* O TECLADO E O CAMPO DA HERO (09/09/2026).
 *
 * O DEFEITO QUE ESTE ARQUIVO EXISTE PARA IMPEDIR, medido no navegador em
 * 375x812 e reproduzido pelo diretor num iPhone: o campo de e-mail da hero
 * mora no CHÃO DA TELA, dentro de um contêiner `sticky` de 100svh, e a cena
 * atrás dele é dirigida por rolagem. Quando o teclado do iOS abre, ele cobre
 * perto de metade do aparelho, o campo focado fica atrás dele, e o Safari
 * rola a página para revelá-lo. Só que revelar é impossível: MEDIDO, a caixa
 * do campo fica em `top: 752` em TODAS as posições de rolagem do percurso
 * (0, 125, 250, 350, 500, 893). O `sticky` faz o campo acompanhar a rolagem,
 * então rolar não o move um pixel na tela. O que a rolagem move é a CENA: os
 * mesmos 350px levam o scrub a um progresso perto de 0,39, onde o campo já
 * está em opacidade zero há muito tempo e o dossiê está montado. A pessoa
 * digita de verdade, com o campo focado, e não enxerga nada.
 *
 * A REGRA GERAL, que vale para todo projeto: campo de formulário nunca mora
 * dentro de cena dirigida por rolagem que o apague. Quando as duas coisas
 * tiverem que conviver, o foco CONGELA a cena e o levantamento é feito à mão.
 *
 * A POSSE DA ESCRITA, que é o que impede o conserto de virar outro defeito:
 * o invólucro que este arquivo levanta é EXCLUSIVO dele. O `baixoRef` é do
 * scrub e o `entradaRef` é da entrada; escrever `transform` em qualquer um
 * dos dois seria a mesma briga de duas escritas na mesma propriedade que já
 * foi defeito real neste componente (ver o comentário da entrada em
 * janela-da-manha.tsx).
 *
 * NADA DISSO VALE NO DESKTOP nem com movimento reduzido. Com movimento
 * reduzido a seção tem 100svh e o filho sticky também, então o sticky não tem
 * curso: MEDIDO, ali a caixa do campo anda 1 para 1 com a rolagem
 * (740, 640, 540, 390, 240 para 0, 100, 200, 350, 500), o navegador revela o
 * campo sozinho, e qualquer trava nossa seria uma regressão. */

/* RESPIRO ENTRE A BASE DO CAMPO E O TOPO DO TECLADO, em pixels de CSS.
 *
 * ESTE É O ÚNICO NÚMERO A AJUSTAR depois do teste no aparelho. Se o campo
 * encostar no teclado ou ficar apertado contra a barra de acessibilidade do
 * iOS (a faixa com as setas e o "OK"), suba SÓ este valor. O mecanismo não
 * muda.
 *
 * O QUE ESTÁ MEDIDO E O QUE NÃO ESTÁ, sem enfeite: o levantamento se apoia
 * inteiramente no que o `visualViewport` informa, e no navegador de teste NÃO
 * EXISTE teclado nenhum. A altura foi SIMULADA encolhendo o `visualViewport`
 * na mão, então a folga de 16px que eu tinha medido provava a ARITMÉTICA, não
 * a folga real: nenhuma barra de acessibilidade foi renderizada ali, e
 * nenhuma poderia ser.
 *
 * O QUE SE SABE SEM CHUTAR: no iOS a barra de acessibilidade é a
 * `inputAccessoryView` do teclado, e ela viaja DENTRO do retângulo do teclado
 * que o sistema publica. O `visualViewport` do Safari encolhe pelo conjunto,
 * teclado mais barra, e não só pelas teclas. Se isso valer no aparelho do
 * diretor, este número é respiro puro e 24 basta com sobra.
 *
 * SE NÃO VALER, o erro será exatamente a altura da barra, e ela também não é
 * chute: a `inputAccessoryView` padrão do iPhone em retrato é uma barra de
 * 44pt, a mesma altura de toolbar do UIKit, que em CSS dá 44px
 * independentemente da densidade da tela. Ou seja, o conserto seria 24 + 44 =
 * 68 AQUI, e em lugar nenhum mais. */
const FOLGA = 24;
/** O iOS emite poucos `resize` enquanto o teclado sobe. Enquanto durar esta
 *  janela, a altura é remedida a cada quadro, e o campo acompanha a subida do
 *  teclado em vez de saltar no fim dela. */
const PERSEGUICAO_MS = 600;

export function useTecladoDoCampo({
  involucroRef,
  trilhoRef,
  ativo
}: {
  /** O invólucro que recebe o levantamento. Ninguém mais escreve nele. */
  involucroRef: RefObject<HTMLDivElement | null>;
  /** O ScrollTrigger do scrub da hero, para congelar enquanto houver foco. */
  trilhoRef: RefObject<ScrollTrigger | null>;
  /** Falso com movimento reduzido: lá não existe scrub nem sticky com curso. */
  ativo: boolean;
}) {
  useEffect(() => {
    if (!ativo) return;
    const el = involucroRef.current;
    const vv = window.visualViewport;
    // PORTÃO: só em aparelho de toque, e só onde dá para medir o teclado.
    // No desktop, travar a rolagem por foco em campo seria defeito novo.
    if (!el || !vv || !window.matchMedia('(pointer: coarse)').matches) return;

    let focado = false;
    let ancora = 0;
    let levantamento = 0;
    let trilho: ScrollTrigger | null = null;
    let perseguicao = 0;

    const escrever = (px: number) => {
      levantamento = px;
      el.style.transform = px > 0 ? `translate3d(0, ${-px}px, 0)` : '';
    };

    /* (b) O CAMPO SOBE ACIMA DO TECLADO.
       A medida se corrige sozinha e nunca precisa da posição de repouso:
       `rect.bottom` já vem com o levantamento aplicado, então o alvo é
       simplesmente `levantamento + invasão`. Uma passada basta; as seguintes
       só acompanham o teclado enquanto ele termina de subir. */
    const levantar = () => {
      if (!focado) return;
      const coberto = window.innerHeight - (vv.height + vv.offsetTop);
      // Teclado fechado (teclado físico, ou ainda não abriu): nada a fazer, e
      // o campo volta ao chão, que é onde o desenho o quer.
      if (coberto < 1) {
        if (levantamento) escrever(0);
        return;
      }
      const rect = el.getBoundingClientRect();
      const invasao = rect.bottom + FOLGA - (vv.offsetTop + vv.height);
      const alvo = Math.max(0, Math.round(levantamento + invasao));
      if (alvo !== levantamento) escrever(alvo);
    };

    /* (c) A PÁGINA NÃO PASSEIA.
       A rolagem que causa o defeito NÃO é a do dedo: é a que o próprio Safari
       faz para revelar o campo focado, e essa nenhum ouvinte cancela, porque
       não é evento nosso. Ela se desfaz aqui, devolvendo o documento ao ponto
       em que estava no instante do foco.

       Por que POR EVENTO E POR QUADRO, e não só um dos dois: o evento `scroll`
       chega no início do quadro seguinte, então sozinho ele atrasa a devolução
       e uma rajada de rolagens seguidas passa por cima dele; e o quadro sozinho
       depende de o rAF estar correndo, o que não é garantido (aba em segundo
       plano, modo de baixo consumo; MEDIDO numa aba dirigida por DevTools, o
       rAF caiu para 1 quadro por segundo enquanto os eventos continuaram
       normais). Os dois juntos custam a leitura de um número e cobrem a
       fraqueza um do outro.

       O que o usuário vê durante o deslocamento é NADA, e isso não é sorte: o
       contêiner é sticky, então rolar dentro do percurso não move um pixel na
       tela. MEDIDO: a caixa do campo fica em `top: 752` em todas as posições
       de rolagem do percurso. O mesmo sticky que tornava o defeito insolúvel
       pelo navegador é o que torna esta devolução invisível. */
    const segurar = () => {
      if (!focado) return;
      if (Math.abs(window.scrollY - ancora) > 1) window.scrollTo(0, ancora);
    };

    /* UM laço só enquanto houver foco, com dois trabalhos: segurar a rolagem
       (o tempo todo) e remedir o levantamento (só na janela da perseguição,
       porque medir caixa a cada quadro para sempre seria layout à toa). */
    const laco = (t0: number) => {
      perseguicao = window.requestAnimationFrame(() => {
        if (!focado) return;
        segurar();
        if (performance.now() - t0 < PERSEGUICAO_MS) levantar();
        laco(t0);
      });
    };

    const aoFocar = (e: FocusEvent) => {
      if (focado) return;
      const alvo = e.target;
      if (!(alvo instanceof HTMLElement) || !alvo.matches('input, textarea')) return;
      focado = true;
      ancora = window.scrollY;

      /* (a) O SCRUB CONGELA no progresso em que estava. `disable(false)` não
         reverte nada: a cena fica exatamente como está e para de ouvir a
         rolagem. Não é zelo: entre a rolagem do Safari e a devolução dela
         existe pelo menos um quadro, e um quadro já bastaria para a cena
         saltar para a frente e voltar. */
      trilho = trilhoRef.current;
      trilho?.disable(false);

      /* A Lenis para. Ela registra `touchmove` como NÃO passivo sempre (não
         só com `syncTouch`) e chama `preventDefault` enquanto estiver parada,
         então o dedo também não rola. Verificado no código da 1.3.26. */
      pausarRolagem();
      window.addEventListener('scroll', segurar, {passive: true});

      levantar();
      laco(performance.now());
    };

    const aoDesfocar = (e?: FocusEvent) => {
      if (!focado) return;
      // Foco que anda DENTRO do campo (do input para a seta) não é perder o
      // foco: o teclado continua aberto e nada deve ser devolvido ainda.
      if (e?.relatedTarget instanceof Node && el.contains(e.relatedTarget)) return;
      focado = false;
      window.cancelAnimationFrame(perseguicao);
      window.removeEventListener('scroll', segurar);
      escrever(0);

      // A ORDEM IMPORTA: devolver a rolagem ao ponto do foco ANTES de religar
      // o trilho. Religar faz um refresh, e um refresh lendo outra posição
      // devolveria a cena num progresso diferente, que é o salto.
      window.scrollTo(0, ancora);
      retomarRolagem();
      trilho?.enable();
      trilho = null;
    };

    el.addEventListener('focusin', aoFocar);
    el.addEventListener('focusout', aoDesfocar);
    vv.addEventListener('resize', levantar);
    vv.addEventListener('scroll', levantar);

    return () => {
      el.removeEventListener('focusin', aoFocar);
      el.removeEventListener('focusout', aoDesfocar);
      vv.removeEventListener('resize', levantar);
      vv.removeEventListener('scroll', levantar);
      aoDesfocar();
      window.cancelAnimationFrame(perseguicao);
      window.removeEventListener('scroll', segurar);
    };
  }, [ativo, involucroRef, trilhoRef]);
}
