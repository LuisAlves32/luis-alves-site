'use client';

/* O CHÃO DE VÍDEO, extraído.
 *
 * O padrão de carregar vídeo de fundo já estava provado em dois lugares
 * (`components/home/hero-dois-atos.tsx` e `components/ui/video-na-rolagem.tsx`)
 * e nos dois foi escrito à mão. Um portão com quatro condições de rede e
 * preferência, copiado uma terceira vez, é como nasce o defeito que ninguém
 * acha: basta uma cópia esquecer o `saveData` para o site baixar megabytes no
 * plano de dados de alguém, e nada na tela denuncia.
 *
 * O que este componente NÃO tem, de propósito: nenhum acoplamento com rolagem.
 * Sem contexto de scroll, sem escala, sem ScrollTrigger. É chão parado. Quem
 * quiser vídeo que reage à rolagem continua indo no `video-na-rolagem.tsx`,
 * que é outra peça e tem outro dono de movimento.
 *
 * As duas implementações antigas seguem como estão: trocá-las por esta é
 * limpeza de outra rodada, e limpeza misturada com estreia é como se perde a
 * chance de saber qual das duas quebrou.
 *
 * POSSE DO MOVIMENTO: nenhuma. Vídeo de fundo não é animação, é MATÉRIA
 * (movimento.md). A câmera do Passe 3 não escreve nestes elementos, e a única
 * propriedade que este arquivo anima é `opacity`, na entrada do quadro. */

import {useEffect, useRef} from 'react';

// O mesmo limiar de variante de mídia do resto do site (hero, sobre, livro).
const LIMIAR_PADRAO = 820;

// Fora da tela por mais que isto, a fonte é devolvida: a banda e a memória
// voltam para o resto da página. Ao reaproximar, ela é reatada.
const ATRASO_DESCARTE = 15000;

// Quanto antes da tela a mídia começa a se preparar, em telas de altura.
const MARGEM_APROXIMACAO = '150% 0px';

type ConexaoDeRede = {saveData?: boolean; effectiveType?: string};

export function FundoDeVideo({
  videoDesktop,
  videoMobile,
  posterDesktop,
  posterMobile,
  limiar = LIMIAR_PADRAO,
  className = '',
  classeVideo = ''
}: {
  videoDesktop: string;
  videoMobile: string;
  posterDesktop: string;
  posterMobile: string;
  /** Largura em px abaixo da qual valem as variantes `-mobile`. */
  limiar?: number;
  /** Vai para o envelope, que é quem define tamanho, recorte e posição. */
  className?: string;
  /** Vai para o `<video>`, por cima das classes de opacidade. */
  classeVideo?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    /* AS QUATRO TRAVAS, idênticas às da hero e às do video-na-rolagem.
       Elas moram AQUI, dentro do efeito, e não num ramo de JSX: assim não
       mudam a marcação e a hidratação continua idêntica no servidor e no
       cliente. Recusando, o <video> fica sem fonte nenhuma, não pede nada à
       rede, e o que se vê é o pôster. */
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
      const alvo = window.innerWidth <= limiar ? videoMobile : videoDesktop;
      if (video!.getAttribute('src') === alvo) return; // uma variante por vez
      video!.dataset.visivel = 'nao';
      video!.autoplay = true; // só depois de existir fonte
      video!.src = alvo;
      video!.load();
      video!.play().catch(() => {}); // iOS rejeita a promise fora de gesto
    }

    let armado = false; // a página já carregou e o navegador já ficou ocioso
    let perto = false; // o chão está a menos de 1,5 tela de distância
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

    // O vídeo só começa a carregar DEPOIS do load da página: o pôster é o LCP
    // e não pode disputar banda com ele.
    function agendar() {
      if (typeof window.requestIdleCallback === 'function') {
        ocioso = window.requestIdleCallback(armar, {timeout: 2500});
      } else {
        temporizador = window.setTimeout(armar, 900);
      }
    }

    /* O observador resolve DUAS coisas que a lista do padrão já resolvia nos
       dois originais: não gastar banda com um chão que está longe da tela, e
       destravar o autoplay que o navegador adiou (página aberta em aba de
       fundo). Sem o segundo, o loop mudo simplesmente nunca começa e ninguém
       descobre por quê. */
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

    // Cruzar o limiar troca a variante, sem baixar as duas.
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
  }, [videoDesktop, videoMobile, limiar]);

  return (
    <div aria-hidden="true" className={`relative overflow-hidden ${className}`}>
      {/* O PÔSTER É A CAMADA BASE, e está sempre presente: no servidor, com
          movimento reduzido, em rede fraca e no tempo até o vídeo poder tocar.
          Nunca existe tela preta. Art direction por <picture>, nunca por
          srcset: as variantes têm ENQUADRAMENTO diferente (o par mobile é
          retrato), e o srcset escolheria pelo tamanho do slot, não pelo
          aparelho.
          Carrega ansioso e com prioridade alta porque este chão nasce para
          ficar atrás de uma dobra, onde o pôster É o LCP. Descendo a peça para
          o meio da página um dia, esta é a linha a trocar por `loading="lazy"`. */}
      <picture>
        <source media={`(max-width: ${limiar}px)`} srcSet={posterMobile} />
        <img
          src={posterDesktop}
          alt=""
          fetchPriority="high"
          decoding="async"
          className="h-full w-full object-cover"
        />
      </picture>

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
        className={`absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500 data-[visivel=sim]:opacity-100 ${classeVideo}`}
      />
    </div>
  );
}
