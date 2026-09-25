// Página original (21st.dev): https://21st.dev/@youcefbnm/components/animated-video-on-scroll
// Licença: MIT, Copyright (c) 2025 Youcef Benmessabih. Créditos completos em CREDITOS.md.
'use client';

import * as React from 'react';
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useScroll,
  useTransform,
  type HTMLMotionProps,
  type MotionValue,
  type Variants
} from 'framer-motion';
import {cn} from '@/lib/utils';

// Origem: 21st.dev, "Animated Video on Scroll" de youcefbnm (demo 1959),
// escolhido pelo diretor para o bloco 3 da home. Posse do movimento: o Framer
// daqui de dentro (data-owner="catalogo" na seção). A animação do componente
// entra INTEIRA: o quadro que abre de uma cápsula, a escala da mídia e a
// entrada dos textos por blur são o motivo de o componente ter sido escolhido.
//
// PIN: o trecho preso desta seção é a TERCEIRA exceção de pin do site,
// decidida pelo Gabriel. As outras duas estão no movimento.md: a passagem do
// ato 1 para o ato 2 da HERO (PICO 1) e a expansão de vídeo da seção Regiões
// (PICO 3). Aqui o trecho é de 180svh, não os 350vh do demo. A rolagem sempre
// responde ao usuário: nada de wheel capturado, nada de scroll-hijack; a
// abertura do quadro é a dica visual de progresso.
//
// QUATRO ADAPTAÇÕES sobre o original (as duas primeiras são defeitos do
// componente, as duas últimas são leis deste projeto):
//
// 1. UNIDADES DE VIEWPORT. O original misturava `h-[350vh]` no contêiner com
//    `min-h-svh` no sticky. No celular `vh` é a viewport GRANDE e `svh` a
//    PEQUENA, e elas discordam de 60 a 110px enquanto a barra do navegador se
//    mexe: o percurso do scrub mudava de tamanho durante o próprio gesto. É o
//    mesmo defeito que já tinha sido corrigido na hero. Aqui não sobra nenhum
//    `vh` puro: todas as alturas são `svh`.
//
// 2. O PAINEL PRESO NÃO PODE TRANSBORDAR. O demo empilhava texto, mídia e
//    botão sem centralizar e sem breakpoint. O que transborda de um painel
//    PRESO é inalcançável, porque a rolagem não o traz de volta. Agora o
//    sticky tem altura DEFINIDA (100svh) e centraliza, o texto e o CTA são
//    `shrink-0`, e a mídia é o único item que cede espaço (ver .sobre-midia no
//    globals.css: teto de largura derivado do orçamento de altura, mais
//    encolhimento como último recurso). O painel não transborda em nenhuma
//    tela, em nenhum ponto da rolagem.
//
// 3. CARREGAMENTO DO VÍDEO. O original fazia `autoPlay muted loop playsInline`
//    direto no `<video>` com `src` fixo: baixava a mídia inteira assim que a
//    seção montava. Aqui vale o padrão do hero-dois-atos.tsx: o pôster é a
//    camada base sempre presente, o `<video>` nasce sem `src` e com
//    `preload="none"`, e só recebe fonte depois do evento `load` da página,
//    dentro de um `requestIdleCallback` (com `setTimeout` de reserva) e quando
//    a seção está perto da tela. Fora da tela por muito tempo, a fonte é
//    devolvida. Em `saveData`, `prefers-reduced-data` ou rede fraca, o vídeo
//    não carrega: fica o pôster.
//
// 4. MOVIMENTO REDUZIDO. O original não tinha `prefers-reduced-motion` em
//    lugar nenhum. Quem resolve isso é a seção (components/home/sobre-luis.tsx),
//    que entrega o ato preso inteiro no ESTADO FINAL e sem os 180svh de
//    rolagem morta, e nem chega a montar este componente.
//
// Correção de digitação do original: `ContainerInset` tinha a classe
// "relateive" em vez de "relative". Inofensiva (o Tailwind ignora classe
// desconhecida), mas o contêiner ficava sem posicionamento.
//
// Import: o original vinha de `motion/react`; este projeto usa
// `framer-motion`. `useMotionTemplate` existe na versão instalada (13.1.1), a
// composição do clipPath é a mesma do autor.

interface ContainerScrollContextValue {
  scrollYProgress: MotionValue<number>;
}

interface ContainerInsetProps extends HTMLMotionProps<'div'> {
  insetYRange?: [number, number];
  insetXRange?: [number, number];
  roundednessRange?: [number, number];
  /**
   * Razão largura/altura da CÁPSULA de partida. Quando informada, o inset
   * horizontal inicial deixa de ser a porcentagem fixa do autor e passa a ser
   * MEDIDO a partir da caixa real, para a cápsula ter sempre a mesma forma.
   *
   * Por que existe: no original os dois insets são 45%, então a forma de
   * partida herda a proporção da CAIXA. Numa caixa 16:9 isso dá uma cápsula
   * deitada, que é a intenção; numa caixa quadrada dá um CÍRCULO. Como aqui a
   * mídia estica para encher o painel preso, a caixa muda de proporção de
   * aparelho para aparelho, e a forma-assinatura ia junto.
   */
  capsulaRazao?: number;
}

const SPRING_TRANSITION_CONFIG = {
  type: 'spring' as const,
  stiffness: 100,
  damping: 16,
  mass: 0.75,
  restDelta: 0.005
};

const variants: Variants = {
  hidden: {filter: 'blur(10px)', opacity: 0},
  visible: {filter: 'blur(0px)', opacity: 1}
};

const ContainerScrollContext = React.createContext<
  ContainerScrollContextValue | undefined
>(undefined);

function useContainerScrollContext() {
  const context = React.useContext(ContainerScrollContext);
  if (!context) {
    throw new Error(
      'useContainerScrollContext precisa estar dentro de um ContainerScroll'
    );
  }
  return context;
}

export const ContainerScroll: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...props
}) => {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const {scrollYProgress} = useScroll({
    target: scrollRef,
    offset: ['start center', 'end end']
  });

  return (
    <ContainerScrollContext.Provider value={{scrollYProgress}}>
      <div
        ref={scrollRef}
        className={cn('relative min-h-[100svh] w-full', className)}
        {...props}
      >
        {children}
      </div>
    </ContainerScrollContext.Provider>
  );
};
ContainerScroll.displayName = 'ContainerScroll';

interface ContainerAnimatedProps extends HTMLMotionProps<'div'> {
  inputRange?: number[];
  outputRange?: number[];
}

export const ContainerAnimated = React.forwardRef<
  HTMLDivElement,
  ContainerAnimatedProps
>(
  (
    {
      className,
      transition,
      style,
      inputRange = [0.2, 0.8],
      outputRange = [80, 0],
      ...props
    },
    ref
  ) => {
    const {scrollYProgress} = useContainerScrollContext();
    const y = useTransform(scrollYProgress, inputRange, outputRange);
    return (
      <motion.div
        ref={ref}
        className={className}
        variants={variants}
        initial="hidden"
        whileInView="visible"
        viewport={{once: true}}
        style={{y, ...style}}
        transition={{...SPRING_TRANSITION_CONFIG, ...transition}}
        {...props}
      />
    );
  }
);
ContainerAnimated.displayName = 'ContainerAnimated';

export const ContainerSticky = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({className, ...props}, ref) => {
  return (
    <div
      ref={ref}
      className={cn('sticky left-0 top-0 min-h-[100svh] w-full', className)}
      {...props}
    />
  );
});
ContainerSticky.displayName = 'ContainerSticky';

export const ContainerInset = React.forwardRef<
  HTMLDivElement,
  ContainerInsetProps
>(
  (
    {
      className,
      style,
      insetYRange = [45, 0],
      insetXRange = [45, 0],
      roundednessRange = [1000, 16],
      capsulaRazao,
      // desestruturado só para NÃO chegar ao motion.div: aqui o clipPath é
      // MotionValue e não passa por transição.
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      transition,
      ...props
    },
    ref
  ) => {
    const {scrollYProgress} = useContainerScrollContext();
    const caixaRef = React.useRef<HTMLDivElement | null>(null);

    const insetY = useTransform(scrollYProgress, [0, 0.8], insetYRange);
    const roundedness = useTransform(scrollYProgress, [0, 1], roundednessRange);

    // Inset horizontal de PARTIDA. Sem capsulaRazao é o número do autor; com
    // ela, é medido da caixa (ver o comentário da prop).
    const inicioX = useMotionValue(insetXRange[0]);

    React.useEffect(() => {
      const caixa = caixaRef.current;
      if (!capsulaRazao || !caixa) return;

      const medir = () => {
        const {width, height} = caixa.getBoundingClientRect();
        if (!width || !height) return;
        // altura visível da cápsula depois do inset vertical de partida
        const alturaVisivel = height * (1 - (2 * insetYRange[0]) / 100);
        const larguraVisivel = capsulaRazao * alturaVisivel;
        const inset = ((1 - larguraVisivel / width) / 2) * 100;
        inicioX.set(Math.min(49, Math.max(0, inset)));
      };

      medir();
      const observador = new ResizeObserver(medir);
      observador.observe(caixa);
      return () => observador.disconnect();
    }, [capsulaRazao, insetYRange, inicioX]);

    const insetX = useTransform(
      [scrollYProgress, inicioX],
      ([progresso, inicio]: number[]) => {
        const t = Math.min(1, Math.max(0, progresso / 0.8));
        return inicio + (insetXRange[1] - inicio) * t;
      }
    );

    const clipPath = useMotionTemplate`inset(${insetY}% ${insetX}% ${insetY}% ${insetX}% round ${roundedness}px)`;

    return (
      <motion.div
        ref={(no: HTMLDivElement | null) => {
          caixaRef.current = no;
          if (typeof ref === 'function') ref(no);
          else if (ref) ref.current = no;
        }}
        className={cn('relative overflow-hidden', className)}
        style={{clipPath, ...style}}
        {...props}
      />
    );
  }
);
ContainerInset.displayName = 'ContainerInset';

/* ------------------------------------------------------------------
   A MÍDIA · substitui o HeroVideo do original
   Mantém a escala de 0,7 a 1 ligada à rolagem (é ela que faz a imagem
   crescer enquanto o quadro abre) e acrescenta a disciplina de
   carregamento da hero. Decorativa: a headline e os parágrafos já dizem
   tudo, então nem o pôster nem o vídeo entram na árvore de acessibilidade.
   ------------------------------------------------------------------ */

type ConexaoDeRede = {saveData?: boolean; effectiveType?: string};

// Fora da tela por mais que isso, a fonte do vídeo é devolvida (a banda e a
// memória voltam para o resto da página). Ao reaproximar, ela é reatada.
const ATRASO_DESCARTE = 15000;
// Quanto antes da tela a mídia começa a se preparar, em telas de altura.
const MARGEM_APROXIMACAO = '150% 0px';

// O pôster é a camada base da mídia: SSR, movimento reduzido, rede fraca e o
// tempo até o vídeo poder tocar. Nunca tela preta. Vive fora do MidiaDaRolagem
// porque o ato preso e o ato de movimento reduzido usam o MESMO quadro.
export function PosterDaMidia({
  posterDesktop,
  posterMobile,
  limiarMobile
}: {
  posterDesktop: string;
  posterMobile: string;
  limiarMobile: number;
}) {
  return (
    <picture>
      <source media={`(max-width: ${limiarMobile}px)`} srcSet={posterMobile} />
      <img
        src={posterDesktop}
        alt=""
        aria-hidden="true"
        loading="lazy"
        decoding="async"
        className="h-full w-full object-cover"
      />
    </picture>
  );
}

export function MidiaDaRolagem({
  videoDesktop,
  videoMobile,
  posterDesktop,
  posterMobile,
  limiarMobile,
  className
}: {
  videoDesktop: string;
  videoMobile: string;
  posterDesktop: string;
  posterMobile: string;
  limiarMobile: number;
  className?: string;
}) {
  const {scrollYProgress} = useContainerScrollContext();
  const escala = useTransform(scrollYProgress, [0, 0.8], [0.7, 1]);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  React.useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Rede e preferência: as mesmas travas da hero. A trava de movimento
    // reduzido vive AQUI, dentro do efeito, e não num ramo de JSX: assim ela
    // não muda a marcação e a hidratação continua idêntica no servidor e no
    // cliente. Com a preferência ligada o <video> fica sem fonte nenhuma, não
    // pede nada à rede, e o que se vê é o pôster.
    function podeCarregar() {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
      if (window.matchMedia('(prefers-reduced-data: reduce)').matches) return false;
      const conexao = (navigator as Navigator & {connection?: ConexaoDeRede}).connection;
      if (conexao?.saveData) return false;
      if (conexao?.effectiveType && conexao.effectiveType !== '4g') return false;
      return true;
    }

    function aoPoderTocar() {
      video!.dataset.visivel = 'sim';
    }

    function escolherFonte() {
      const alvo = window.innerWidth <= limiarMobile ? videoMobile : videoDesktop;
      if (video!.getAttribute('src') === alvo) return; // uma variante por vez
      video!.dataset.visivel = 'nao';
      video!.autoplay = true; // só depois de existir fonte
      video!.src = alvo;
      video!.load();
      video!.play().catch(() => {}); // iOS rejeita a promise fora de gesto
    }

    let armado = false; // a página já carregou e o navegador já ficou ocioso
    let perto = false; // a seção está a menos de 1,5 tela de distância
    let ligado = false; // o <video> está com fonte
    let ocioso: number | undefined;
    let temporizador: number | undefined;
    let descarte: number | undefined;

    function ligar() {
      if (ligado || !armado || !perto || !podeCarregar()) return;
      ligado = true;
      video!.addEventListener('canplay', aoPoderTocar);
      escolherFonte();
    }

    function desligar() {
      if (!ligado) return;
      ligado = false;
      video!.removeEventListener('canplay', aoPoderTocar);
      video!.pause();
      video!.removeAttribute('src');
      video!.load();
      video!.autoplay = false;
      video!.dataset.visivel = 'nao';
    }

    function armar() {
      armado = true;
      ligar();
    }

    // O vídeo só começa a carregar DEPOIS do load da página: o pôster não pode
    // disputar banda com o resto da chegada.
    function agendar() {
      if (typeof window.requestIdleCallback === 'function') {
        ocioso = window.requestIdleCallback(armar, {timeout: 2500});
      } else {
        temporizador = window.setTimeout(armar, 900);
      }
    }

    const observador = new IntersectionObserver(
      ([entrada]) => {
        perto = entrada.isIntersecting;
        if (perto) {
          if (descarte !== undefined) window.clearTimeout(descarte);
          descarte = undefined;
          ligar();
          if (ligado && video!.paused) video!.play().catch(() => {});
        } else if (ligado && descarte === undefined) {
          descarte = window.setTimeout(desligar, ATRASO_DESCARTE);
        }
      },
      {rootMargin: MARGEM_APROXIMACAO}
    );
    observador.observe(video);

    // Cruzar o limiar de 820px troca a variante, sem baixar as duas.
    let ultimaLargura = window.innerWidth;
    function aoRedimensionar() {
      if (window.innerWidth === ultimaLargura) return;
      ultimaLargura = window.innerWidth;
      if (ligado) escolherFonte();
    }

    if (document.readyState === 'complete') agendar();
    else window.addEventListener('load', agendar, {once: true});
    window.addEventListener('resize', aoRedimensionar);

    return () => {
      window.removeEventListener('load', agendar);
      window.removeEventListener('resize', aoRedimensionar);
      observador.disconnect();
      if (ocioso !== undefined) window.cancelIdleCallback?.(ocioso);
      if (temporizador !== undefined) window.clearTimeout(temporizador);
      if (descarte !== undefined) window.clearTimeout(descarte);
      desligar();
    };
  }, [videoDesktop, videoMobile, limiarMobile]);

  return (
    <motion.div
      style={{scale: escala}}
      className={cn('absolute inset-0', className)}
    >
      <PosterDaMidia
        posterDesktop={posterDesktop}
        posterMobile={posterMobile}
        limiarMobile={limiarMobile}
      />
      {/* Sem som, sem controle, sem filtro. A fonte entra por JS. */}
      <video
        ref={videoRef}
        data-visivel="nao"
        muted
        loop
        playsInline
        preload="none"
        aria-hidden="true"
        tabIndex={-1}
        className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500 data-[visivel=sim]:opacity-100"
      />
    </motion.div>
  );
}
