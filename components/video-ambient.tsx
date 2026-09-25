'use client';

import Image from 'next/image';
import {useCallback, useEffect, useRef, useSyncExternalStore} from 'react';

// true só depois da hidratação: no servidor não existe viewport, então o
// <video> não renderiza no SSR e a escolha de variante é sempre do cliente
// (garante que UMA variante carrega, nunca as duas).
const assinaturaInerte = () => () => {};

export function useMediaQuery(query: string) {
  const assinar = useCallback(
    (aoMudar: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener('change', aoMudar);
      return () => mql.removeEventListener('change', aoMudar);
    },
    [query]
  );
  return useSyncExternalStore(
    assinar,
    () => window.matchMedia(query).matches,
    () => false
  );
}

// Vídeo ambiente da manhã do Pacífico (Passe 2, bloco 10): mídia de fundo,
// mudo, em loop, sem controle e sem botão. Não é animação: é matéria, e a
// câmera do Passe 3 não escreve nestes elementos (movimento.md).
// O pôster é a camada base sempre presente (SSR, reduced-motion e enquanto o
// vídeo carrega): nunca tela preta. Uma variante só por viewport (desktop
// 831KB, mobile 210KB); com prefers-reduced-motion o <video> nem renderiza e
// fica o pôster, que é o estado final. As media queries são vivas: mudar a
// preferência de movimento ou cruzar 768px troca o estado na hora.
export function VideoAmbient({
  className = '',
  sizes = '100vw'
}: {
  className?: string;
  sizes?: string;
}) {
  const hidratado = useSyncExternalStore(
    assinaturaInerte,
    () => true,
    () => false
  );
  const reduzido = useMediaQuery('(prefers-reduced-motion: reduce)');
  const desktop = useMediaQuery('(min-width: 768px)');
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Autoplay adiado pelo navegador (página carregada em aba de fundo, painel
  // fora de vista) não volta sozinho: quando o painel entra em vista, um
  // play() de resgate destrava o loop mudo.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const observador = new IntersectionObserver(([entrada]) => {
      if (entrada.isIntersecting && video.paused) {
        video.play().catch(() => {});
      }
    });
    observador.observe(video);
    return () => observador.disconnect();
  }, [hidratado, reduzido, desktop]);

  return (
    <div
      aria-hidden="true"
      className={`relative overflow-hidden rounded-[16px] ${className}`}
    >
      <Image
        src="/video/manha-pacifico-poster.webp"
        alt=""
        fill
        sizes={sizes}
        className="object-cover"
      />
      {hidratado && !reduzido && (
        <video
          ref={videoRef}
          muted
          loop
          playsInline
          autoPlay
          preload="metadata"
          poster="/video/manha-pacifico-poster.webp"
          src={
            desktop
              ? '/video/manha-pacifico-loop.mp4'
              : '/video/manha-pacifico-loop-mobile.mp4'
          }
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
    </div>
  );
}
