// Página original (21st.dev): https://21st.dev/@arunachalam/components/scroll-expansion-hero
// Licença: MIT segundo a página do 21st.dev. Créditos completos em CREDITOS.md.
'use client';

import {useEffect, useRef} from 'react';
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useTransform
} from 'framer-motion';
import {useMediaQuery, VideoAmbient} from '@/components/video-ambient';

// Origem: 21st.dev, "Scroll media expansion hero" de arunachalam (demo 1932),
// escolhido pelo diretor para o PICO 3 (bloco 10 da home). Posse do
// movimento: o Framer daqui de dentro (data-owner="catalogo" na seção); é a
// ÚNICA exceção de pin do site (movimento.md, 29/08), com trecho sticky de
// 120vh (teto autorizado: 150vh).
//
// Travas aplicadas sobre o original, que era hero de topo de página e
// sequestrava a rolagem INTEIRA (wheel e touch globais com preventDefault e
// window.scrollTo(0,0) prendendo a página no topo): tudo removido. Aqui a
// expansão é scrub NATIVO (sticky + useScroll): rolar avança o scroll de
// verdade e a expansão é a dica visual de progresso; o gesto é reversível e,
// vencido o trecho, a rolagem segue normal. A expansão usa clip-path (paint)
// no lugar de width/height (lei do movimento.md). O vocabulário do
// componente fica: o painel de mídia pequeno que toma a tela, o título
// verbatim partido ao meio saindo em blend, o conteúdo calmo depois.
// Vídeo, pôster, variante por viewport e reduced-motion: do VideoAmbient.
// Legibilidade do título: papel + mix-blend-difference se auto-adapta à
// manhã clara e dispensou véu; se uma mídia futura pedir, o autorizado é um
// véu de tinta de NO MÁXIMO 20% de opacidade, sem backdrop-filter (vidro
// sobre vídeo é proibido).
// Reduced-motion: sem sticky e sem expansão; título + pôster em painel fixo
// 16:10 + conteúdo completo, tudo estático e visível.

const FAIXA_STICKY_VH = 120;

// Folga além da borda da tela, para o antisserrilhado e o subpixel não
// deixarem meio traço de letra encostado na moldura.
const FOLGA_SAIDA = 48;
// A saída do título termina em 70% do progresso; daí até 92% as duas metades
// apagam. É cinto de segurança: mesmo que uma medição chegue tarde em algum
// aparelho, nada fica visível com o vídeo cheio.
const SAIDA_INICIO = 0.7;
const APAGADO = 0.92;

export function ExpansaoMidia({
  titulo,
  children
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  const faixaRef = useRef<HTMLDivElement | null>(null);
  const reduzido = useReducedMotion();
  const desktop = useMediaQuery('(min-width: 768px)');

  const {scrollYProgress} = useScroll({
    target: faixaRef,
    offset: ['start start', 'end end']
  });

  // A janela de recorte nasce card centrado (~300x400, geometria do
  // original) e abre até quase a tela cheia (95vw x 85svh, teto do original)
  const insetX = useTransform(
    scrollYProgress,
    [0, 1],
    desktop ? [38, 2.5] : [10, 2.5]
  );
  const insetY = useTransform(
    scrollYProgress,
    [0, 1],
    desktop ? [22, 7.5] : [25, 7.5]
  );
  const recorte = useMotionTemplate`inset(${insetY}% ${insetX}% round 16px)`;

  // As metades do título se afastam conforme a manhã toma a tela.
  // O PERCURSO É MEDIDO, não estimado: metade da janela (do centro até a
  // borda) mais metade da própria palavra (do centro dela até a sua borda de
  // fuga) mais a folga. Assim ele é suficiente POR CONSTRUÇÃO em qualquer
  // largura, sem breakpoint. O valor antigo era 48vw no celular e 55vw no
  // desktop: fração só da JANELA, cega para a largura do texto. Medido com o
  // vídeo cheio, faltavam 31px em 390px e 30px em 320px, e sobrava um pedaço
  // de letra colado na borda direita; em 768px passava por 1,5px.
  const percursoEsquerda = useMotionValue(0);
  const percursoDireita = useMotionValue(0);
  const esquerdaRef = useRef<HTMLSpanElement | null>(null);
  const direitaRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const esquerda = esquerdaRef.current;
    const direita = direitaRef.current;
    if (!esquerda || !direita) return;

    const medir = () => {
      const meiaJanela = window.innerWidth / 2;
      // offsetWidth ignora o transform, então mede a palavra parada
      percursoEsquerda.set(meiaJanela + esquerda.offsetWidth / 2 + FOLGA_SAIDA);
      percursoDireita.set(meiaJanela + direita.offsetWidth / 2 + FOLGA_SAIDA);
    };

    medir();
    // O observador cobre resize, giro do aparelho e troca de fonte (a palavra
    // muda de largura quando a Inter substitui a fonte de sistema). O listener
    // de orientationchange é o cinto para os navegadores que só entregam a
    // largura nova depois do evento.
    const observador = new ResizeObserver(medir);
    observador.observe(esquerda);
    observador.observe(direita);
    observador.observe(document.documentElement);
    window.addEventListener('orientationchange', medir);
    return () => {
      observador.disconnect();
      window.removeEventListener('orientationchange', medir);
    };
  }, [percursoEsquerda, percursoDireita, reduzido]);

  const avanco = useTransform(scrollYProgress, [0, SAIDA_INICIO], [0, 1]);
  const xEsquerda = useTransform(
    [avanco, percursoEsquerda],
    ([passo, percurso]: number[]) => -passo * percurso
  );
  const xDireita = useTransform(
    [avanco, percursoDireita],
    ([passo, percurso]: number[]) => passo * percurso
  );
  // Cinto de segurança do cinto: com o vídeo cheio o título não existe mais.
  const opacidadeTitulo = useTransform(scrollYProgress, (p) => {
    if (p <= SAIDA_INICIO) return 1;
    if (p >= APAGADO) return 0;
    return 1 - (p - SAIDA_INICIO) / (APAGADO - SAIDA_INICIO);
  });

  const [primeira, ...restoPartes] = titulo.split(' ');
  const resto = restoPartes.join(' ');

  if (reduzido) {
    return (
      <div>
        <div className="conteudo pt-secao">
          <h2 className="max-w-[24ch]">{titulo}</h2>
          <div className="mt-8">
            <VideoAmbient
              className="aspect-[16/10] w-full"
              sizes="(min-width: 1264px) 1136px, calc(100vw - 48px)"
            />
          </div>
        </div>
        {children}
      </div>
    );
  }

  return (
    <div>
      <div
        ref={faixaRef}
        style={{height: `calc(100svh + ${FAIXA_STICKY_VH}vh)`}}
      >
        <div className="sticky top-0 flex h-[100svh] items-center justify-center overflow-hidden">
          <motion.div
            data-camada="fundo"
            aria-hidden="true"
            className="absolute inset-0"
            style={{clipPath: recorte, willChange: 'clip-path'}}
          >
            <VideoAmbient className="h-full w-full" sizes="100vw" />
          </motion.div>
          <h2
            aria-label={titulo}
            data-camada="frente"
            className="pointer-events-none relative z-[1] flex flex-wrap items-baseline justify-center gap-x-[0.35em] px-6 text-center text-[clamp(2.2rem,6vw,3.8rem)] text-papel mix-blend-difference"
          >
            <motion.span
              ref={esquerdaRef}
              aria-hidden="true"
              className="inline-block"
              style={{x: xEsquerda, opacity: opacidadeTitulo}}
            >
              {primeira}
            </motion.span>
            <motion.span
              ref={direitaRef}
              aria-hidden="true"
              className="inline-block"
              style={{x: xDireita, opacity: opacidadeTitulo}}
            >
              {resto}
            </motion.span>
          </h2>
        </div>
      </div>
      {children}
    </div>
  );
}
