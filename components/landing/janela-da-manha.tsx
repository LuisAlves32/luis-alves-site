// Página original (21st.dev): https://21st.dev/@jean.duthil13/components/hero-scrub
// Licença: sem licença declarada pelo autor; usado com crédito, conforme os termos do 21st.dev. Créditos completos em CREDITOS.md.
'use client';

import {useEffect, useRef, useState, type ReactNode} from 'react';
import gsap from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import {useReducedMotion} from 'framer-motion';
import {FundoDeVideo} from '@/components/ui/fundo-de-video';
import {useTecladoDoCampo} from '@/components/landing/teclado-do-campo';

/* A MANHÃ INTEIRA · hero da landing do guia (versão 3.3, 08/09/2026).
 *
 * Origem do motor: 21st.dev, "Hero Scrub" de jean.duthil13 (demo 12213):
 * sequência de quadros em canvas dirigida pela rolagem, bloco sticky (sem
 * pin do ScrollTrigger), scrub do GSAP, carga dos quadros em lotes, quadro
 * vizinho quando o pedido ainda não chegou, movimento reduzido. Origem da
 * COREOGRAFIA: "MacBook Neo Hero", do mesmo autor (demo 12330), em que cards
 * contextuais entram a cada trecho da sequência. Só a coreografia veio: o
 * motor daquele (scroll listener com estado por quadro, troca de `src` de
 * imagem, palco `fixed`) não entra, por lei do movimento.md.
 *
 * O QUE ESTA HERO FAZ (plano-landing-guia-v3.md):
 *
 * 1. A CENA É A TELA desde o primeiro pixel, no desktop como no celular. O
 *    lockup mora sobre a zona calma do céu, em Tinta.
 * 2. A ROLAGEM NUNCA FICA SÓ COM A MÍDIA. Enquanto a câmera caminha, UM
 *    DOSSIÊ SE MONTA na tela, em duas partes da mesma largura que se
 *    encaixam: a CABEÇA em Tinta (a identidade do guia: capa, gratuito,
 *    páginas, região) sobe primeiro; o CORPO branco (as três linhas de valor)
 *    encaixa embaixo dela; as linhas acendem uma por trecho e a costura de
 *    latão entre as duas partes se traça ao longo do percurso. Nada de trecho
 *    morto: a cada dez por cento da rolagem algo muda além da cena.
 * 3. O PERCURSO É CURTO: 110svh além da dobra (a 3.0 tinha 150 e o Gabriel
 *    sentiu que "rolava demais"). A caminhada dos quadros ocupa 74% dele, o
 *    descanso final é só o suficiente para a composição completa ser vista
 *    antes de a seção 2 chegar por cima. Continua sendo a ÚNICA exceção de
 *    trecho preso da landing.
 * 4. Só transform e opacity. As posições são CSS estático; o GSAP só escreve
 *    `y`, opacidade e o scaleX do fio.
 * 5. A VARIANTE DOS QUADROS (desktop 16:9 ou celular 9:16) segue a media
 *    query, não a largura de uma vez só na carga: se a janela cruzar o
 *    limiar depois, os quadros da outra variante são carregados e o canvas
 *    troca.
 * 6. Movimento reduzido: sem sticky, sem quadros, pôster parado, lockup
 *    parado, e as duas peças viram blocos normais em fluxo logo abaixo.
 *
 * Posse do movimento: GSAP + ScrollTrigger daqui de dentro. */

const PERCURSO_SVH = 110;
const LIMIAR = 820;

/* OS TRECHOS DO PROGRESSO (0 a 1 sobre os 110svh de percurso):
     0,00 a 0,14  kicker, H1 e subheadline sobem e somem; o campo desce e some
     0,02 a 0,08  o canvas entra por cima do loop
     0,08 a 0,82  a câmera caminha: quadro 0 ao último
     0,16 a 0,26  a cabeça do dossiê sobe
     0,28 a 0,38  o corpo encaixa embaixo dela; a costura começa a se traçar
     0,42 a 0,49  linha 1 acende · 0,52 a 0,59 linha 2 · 0,62 a 0,69 linha 3
     0,69         a costura chega ao fim
     0,72 a 1,00  descanso curto: a composição completa, e a seção 2 chega */
const T = {
  lockupSai: 0.14,
  canvasEntra: [0.02, 0.08],
  caminhada: [0.08, 0.82],
  cabeca: [0.16, 0.26],
  ficha: [0.28, 0.38],
  fio: [0.28, 0.69],
  linhas: [
    [0.42, 0.49],
    [0.52, 0.59],
    [0.62, 0.69]
  ]
} as const;

/* Os caminhos vêm como MOLDE de string com `{i}` no lugar do índice (dois
   dígitos), e não como função: função não atravessa a fronteira entre Server
   Component e Client Component. */
type Quadros = {desktop: string; mobile: string; total: number};

const caminhoDoQuadro = (molde: string, i: number) => molde.replace('{i}', String(i).padStart(2, '0'));

export function JanelaDaManha({
  quadros,
  loop,
  poster,
  lockupTopo,
  lockupBaixo,
  cabeca,
  ficha
}: {
  quadros: Quadros;
  loop: {desktop: string; mobile: string};
  poster: {desktop: string; mobile: string};
  lockupTopo: ReactNode;
  lockupBaixo: ReactNode;
  /** A cabeça do dossiê (Tinta), que sobe primeiro. */
  cabeca: ReactNode;
  /** O corpo do dossiê (branco), que encaixa embaixo; traz `[data-linha]` e `[data-fio]`. */
  ficha: ReactNode;
}) {
  const secaoRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const topoRef = useRef<HTMLDivElement>(null);
  const baixoRef = useRef<HTMLDivElement>(null);
  // O invólucro do levantamento do teclado, entre o do scrub (baixoRef) e o da
  // entrada (entradaRef): um dono de `transform` por elemento, sem briga.
  const tecladoRef = useRef<HTMLDivElement>(null);
  const entradaRef = useRef<HTMLDivElement>(null);
  // O trilho do scrub, para o foco no campo poder congelá-lo.
  const trilhoRef = useRef<ScrollTrigger | null>(null);
  const cabecaRef = useRef<HTMLDivElement>(null);
  const fichaRef = useRef<HTMLDivElement>(null);
  const imagensRef = useRef<HTMLImageElement[]>([]);
  const ultimoDesenhadoRef = useRef(-1);
  const [pronto, setPronto] = useState(false);
  // SSR-safe: nulo no servidor, booleano no cliente, sem estado em efeito.
  const reduzido = useReducedMotion() === true;

  /* CARGA DOS QUADROS: depois do load, no ocioso, a variante da media query.
     Se a media query mudar depois, a outra variante é carregada por cima. */
  useEffect(() => {
    if (reduzido) return;
    let cancelado = false;
    let ocioso: number | undefined;
    let temporizador: number | undefined;
    const consulta = window.matchMedia(`(max-width: ${LIMIAR}px)`);
    let variante: 'mobile' | 'desktop' = consulta.matches ? 'mobile' : 'desktop';
    let geracao = 0;

    const aoPrimeiro = (img: HTMLImageElement, minhaGeracao: number) => {
      if (cancelado || minhaGeracao !== geracao) return;
      const canvas = canvasRef.current;
      if (canvas && img.naturalWidth && img.naturalHeight) {
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        canvas.getContext('2d')?.drawImage(img, 0, 0);
        ultimoDesenhadoRef.current = 0;
      }
      setPronto(true);
    };

    const iniciar = () => {
      if (cancelado) return;
      const minhaGeracao = ++geracao;
      const molde = variante === 'mobile' ? quadros.mobile : quadros.desktop;
      const imagens: HTMLImageElement[] = new Array(quadros.total);
      imagensRef.current = imagens;
      ultimoDesenhadoRef.current = -1;
      const LOTE = 6;
      let cursor = 0;
      const carregar = (i: number) => {
        const img = new window.Image();
        img.decoding = 'async';
        if (i === 0) img.onload = () => aoPrimeiro(img, minhaGeracao);
        img.src = caminhoDoQuadro(molde, i);
        imagens[i] = img;
      };
      const proximo = () => {
        if (cancelado || minhaGeracao !== geracao) return;
        const fim = Math.min(quadros.total, cursor + LOTE);
        for (let i = cursor; i < fim; i++) carregar(i);
        cursor = fim;
        if (cursor < quadros.total) temporizador = window.setTimeout(proximo, 120);
      };
      proximo();
    };

    const agendar = () => {
      if (typeof window.requestIdleCallback === 'function') {
        ocioso = window.requestIdleCallback(iniciar, {timeout: 3000});
      } else {
        temporizador = window.setTimeout(iniciar, 1200);
      }
    };

    const aoMudarVariante = () => {
      const nova = consulta.matches ? 'mobile' : 'desktop';
      if (nova === variante) return;
      variante = nova;
      if (temporizador !== undefined) window.clearTimeout(temporizador);
      iniciar();
    };

    if (document.readyState === 'complete') agendar();
    else window.addEventListener('load', agendar, {once: true});
    consulta.addEventListener('change', aoMudarVariante);

    return () => {
      cancelado = true;
      window.removeEventListener('load', agendar);
      consulta.removeEventListener('change', aoMudarVariante);
      if (ocioso !== undefined) window.cancelIdleCallback?.(ocioso);
      if (temporizador !== undefined) window.clearTimeout(temporizador);
    };
  }, [reduzido, quadros]);

  /* ENTRADA, uma vez: o campo chega por opacidade; a headline tem a própria
     entrada (TextoDesfoque) dentro do lockup de cima. A entrada escreve num
     invólucro PRÓPRIO (entradaRef), nunca no mesmo elemento que o scrub
     anima (baixoRef). Foi um defeito real: o tween de rolagem gravava o
     valor inicial de opacidade enquanto a entrada ainda o segurava em zero,
     e ao voltar ao topo o campo ficava invisível para sempre. */
  useEffect(() => {
    if (reduzido) return;
    const ctx = gsap.context(() => {
      gsap.from(entradaRef.current, {opacity: 0, y: 12, duration: 0.9, ease: 'power3.out', delay: 0.55});
    }, secaoRef);
    return () => ctx.revert();
  }, [reduzido]);

  /* A COREOGRAFIA DA ROLAGEM. */
  useEffect(() => {
    if (reduzido) return;
    const secao = secaoRef.current;
    const canvas = canvasRef.current;
    const cabecaEl = cabecaRef.current;
    const fichaEl = fichaRef.current;
    if (!secao || !canvas || !cabecaEl || !fichaEl) return;

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      const celular = () => window.innerWidth <= LIMIAR;

      const carregado = (i: number) => {
        const img = imagensRef.current[i];
        return !!img && img.complete && img.naturalWidth > 0;
      };

      const desenhar = (indice: number) => {
        let usar = indice;
        if (!carregado(usar)) {
          let achado = -1;
          for (let d = 1; d < quadros.total; d++) {
            if (usar - d >= 0 && carregado(usar - d)) {
              achado = usar - d;
              break;
            }
            if (usar + d < quadros.total && carregado(usar + d)) {
              achado = usar + d;
              break;
            }
          }
          if (achado === -1) return;
          usar = achado;
        }
        if (ultimoDesenhadoRef.current === usar) return;
        const img = imagensRef.current[usar];
        const c2 = canvas.getContext('2d');
        if (!c2 || !img) return;
        if (canvas.width !== img.naturalWidth || canvas.height !== img.naturalHeight) {
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
        }
        c2.drawImage(img, 0, 0, canvas.width, canvas.height);
        ultimoDesenhadoRef.current = usar;
      };

      const [inicioCaminhada, fimCaminhada] = T.caminhada;
      const [inicioCanvas, fimCanvas] = T.canvasEntra;

      const linha = gsap.timeline({
        scrollTrigger: {
          trigger: secao,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.4,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const p = self.progress;
            const mapeado = gsap.utils.clamp(0, 1, (p - inicioCaminhada) / (fimCaminhada - inicioCaminhada));
            const indice = Math.min(quadros.total - 1, Math.floor(mapeado * quadros.total));
            desenhar(indice);
            // O canvas só aparece quando tem quadro para mostrar.
            const temQuadro = ultimoDesenhadoRef.current >= 0;
            gsap.set(canvas, {
              opacity: temQuadro ? gsap.utils.clamp(0, 1, (p - inicioCanvas) / (fimCanvas - inicioCanvas)) : 0
            });
          }
        }
      });

      // A duração total é 1, então cada posição da timeline É o progresso.
      // `fromTo` com valores explícitos, nunca `to`: o `to` grava o valor
      // inicial na primeira renderização, e se ela cair no meio de outra
      // animação o valor gravado é o errado e volta errado ao rolar de volta.
      linha.fromTo(
        topoRef.current,
        {opacity: 1, y: 0},
        {opacity: 0, y: -24, ease: 'power1.in', duration: T.lockupSai, immediateRender: false},
        0
      );
      /* O CAMPO SAI COM `autoAlpha`, NÃO COM `opacity`, e a diferença não é
         de estilo: `autoAlpha` escreve `visibility: hidden` quando a opacidade
         chega a zero. Sem isso o campo continua apagado E TOCÁVEL no chão da
         tela, e um toque na grama focava um campo invisível, o que agora
         travaria a rolagem e congelaria a cena por causa de algo que ninguém
         vê (teclado-do-campo.ts). `visibility` não é animada: ela troca no
         extremo, então o laço da rolagem continua só com transform e opacity.

         O `topoRef` NÃO recebe o mesmo tratamento, de propósito: ali mora o
         H1, e `visibility: hidden` tira o título da árvore de acessibilidade,
         de modo que quem navega por cabeçalho perderia o H1 conforme rola. No
         lockup de cima não há nada focável, então não há o que proteger. */
      linha.fromTo(
        baixoRef.current,
        {autoAlpha: 1, y: 0},
        {autoAlpha: 0, y: 24, ease: 'power1.in', duration: T.lockupSai, immediateRender: false},
        0
      );

      linha.fromTo(
        cabecaEl,
        {opacity: 0, y: () => (celular() ? 28 : 40)},
        {opacity: 1, y: 0, ease: 'power2.out', duration: T.cabeca[1] - T.cabeca[0]},
        T.cabeca[0]
      );
      linha.fromTo(
        fichaEl,
        {opacity: 0, y: () => (celular() ? -24 : -32)},
        {opacity: 1, y: 0, ease: 'power2.out', duration: T.ficha[1] - T.ficha[0]},
        T.ficha[0]
      );

      const fio = fichaEl.querySelector<HTMLElement>('[data-fio]');
      if (fio) {
        linha.fromTo(fio, {scaleX: 0.09}, {scaleX: 1, ease: 'none', duration: T.fio[1] - T.fio[0]}, T.fio[0]);
      }

      const linhas = Array.from(fichaEl.querySelectorAll<HTMLElement>('[data-linha]'));
      linhas.forEach((el, i) => {
        const trecho = T.linhas[i] ?? T.linhas[T.linhas.length - 1];
        linha.fromTo(
          el,
          {opacity: 0.32, y: 6},
          {opacity: 1, y: 0, ease: 'power1.out', duration: trecho[1] - trecho[0]},
          trecho[0]
        );
      });

      // Espaço até o fim, para o scrub cobrir o percurso inteiro.
      const ultimoFim = T.linhas[T.linhas.length - 1][1];
      linha.to({}, {duration: 1 - ultimoFim}, ultimoFim);

      trilhoRef.current = linha.scrollTrigger ?? null;

      ScrollTrigger.refresh();
    }, secaoRef);

    return () => {
      trilhoRef.current = null;
      ctx.revert();
    };
  }, [reduzido, quadros, pronto]);

  /* O TECLADO DO CELULAR E O CAMPO (teclado-do-campo.ts). O campo mora no chão
     da tela dentro de um sticky: focar exige rolagem, e a rolagem apagava o
     campo e adiantava a cena. Enquanto houver foco, o scrub congela, a rolagem
     fica presa e o campo sobe acima do teclado. Só em aparelho de toque. */
  useTecladoDoCampo({involucroRef: tecladoRef, trilhoRef, ativo: !reduzido});

  return (
    <>
      <section
        ref={secaoRef}
        data-bloco="landing-janela"
        data-owner="hero"
        className="relative w-full bg-tinta text-tinta"
        style={{height: reduzido ? '100svh' : `calc(100svh + ${PERCURSO_SVH}svh)`}}
      >
        <div className="sticky top-0 h-[100svh] w-full overflow-hidden">
          {/* A CENA: o loop vivo e, por cima, o canvas da caminhada (invisível
              até ter quadro). Tela inteira em toda largura. */}
          <div className="absolute inset-0">
            <FundoDeVideo
              videoDesktop={loop.desktop}
              videoMobile={loop.mobile}
              posterDesktop={poster.desktop}
              posterMobile={poster.mobile}
              limiar={LIMIAR}
              className="absolute inset-0 h-full w-full"
            />
            <canvas
              ref={canvasRef}
              aria-hidden="true"
              className="absolute inset-0 h-full w-full object-cover opacity-0"
            />
          </div>

          {/* O LOCKUP E O CAMPO. A camada cobre a tela mas não pega o ponteiro;
              só o texto e o campo pegam. `pt` reserva a faixa da logo, que
              flutua por cima (72px), mais um respiro que cresce com a tela. No
              celular o campo vai para o chão da tela, sobre a grama; de 821px
              para cima ele fica em fluxo, embaixo da subheadline, na mesma
              coluna à esquerda. A coluna alinha pela `.conteudo`, como a logo. */}
          <div className="pointer-events-none absolute inset-0 z-10">
            <div className="conteudo pt-[calc(76px+3svh)] min-[821px]:pt-[calc(72px+6svh)]">
              <div ref={topoRef} className="pointer-events-auto max-w-[40rem]">
                {lockupTopo}
              </div>
              <div
                ref={baixoRef}
                className="pointer-events-auto absolute inset-x-6 bottom-[max(20px,env(safe-area-inset-bottom))] min-[821px]:static min-[821px]:mt-6 min-[821px]:max-w-[34rem]"
              >
                <div ref={tecladoRef}>
                  <div ref={entradaRef}>{lockupBaixo}</div>
                </div>
              </div>
            </div>
          </div>

          {/* O DOSSIÊ. Uma coluna só, da largura da ficha, com as duas partes
              empilhadas e encaixadas: a cabeça em Tinta em cima, o corpo branco
              embaixo, a costura de latão entre elas. A caixa replica a
              `.conteudo` (largura máxima e calhas), então a coluna alinha com
              a logo. No desktop a coluna fica CENTRADA na altura da tela, à
              esquerda, espelhando a casa do lado direito; no celular ela mora
              no CÉU, no lugar exato do lockup (o texto vira dossiê onde os
              olhos já estavam), e a casa, a mata e a grama ficam visíveis a
              caminhada inteira. Medidas compactas no celular para o dossiê
              terminar acima da casa, que fica a 52% da tela. A cabeça
              sobe de baixo; o corpo desce de cima e encaixa nela: o dossiê se
              fecha. Nada aqui pega o ponteiro: invisível, taparia o campo. */}
          {!reduzido ? (
            <div className="pointer-events-none absolute inset-0 z-10">
              <div className="relative mx-auto h-full w-full max-w-[var(--largura-conteudo)] px-6 lg:px-8">
                <div className="absolute inset-x-6 top-[calc(76px+3svh)] lg:inset-x-8 min-[821px]:inset-y-0 min-[821px]:right-auto min-[821px]:flex min-[821px]:w-[30rem] min-[821px]:flex-col min-[821px]:justify-center">
                  <div ref={cabecaRef} className="relative z-10" style={{opacity: 0}}>
                    {cabeca}
                  </div>
                  <div ref={fichaRef} style={{opacity: 0}}>
                    {ficha}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {/* MOVIMENTO REDUZIDO: o dossiê montado, em fluxo, logo abaixo da cena. */}
      {reduzido ? (
        <div className="bg-tinta px-6 py-8">
          <div className="mx-auto w-full max-w-[30rem]">
            {cabeca}
            {ficha}
          </div>
        </div>
      ) : null}
    </>
  );
}
