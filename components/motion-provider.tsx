'use client';

import 'lenis/dist/lenis.css';
import {MotionConfig} from 'framer-motion';
import gsap from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import {useEffect} from 'react';
import {registrarRolagem} from '@/lib/rolagem';

// Camada global de movimento (movimento.md), ADORMECIDA: só rolagem suave,
// nenhuma animação de conteúdo e nenhum ScrollTrigger criado aqui.
// Lenis e GSAP no MESMO relógio: o ticker do GSAP dirige o raf da Lenis,
// senão o scrub do Passe 3 treme.
// Usa a classe Lenis core (não o wrapper ReactLenis) de propósito: com
// prefers-reduced-motion a Lenis NÃO pode nem ser instanciada, e montagem
// condicional do wrapper forçaria remount da página inteira nesses casos.
//
// SEM LENIS EM APARELHO DE TOQUE (25/09/2026, o Gabriel viu a rolagem "quadro a
// quadro" no celular, no site inteiro). A Lenis registra `touchstart` e `touchmove`
// como NÃO passivos sempre (lido em node_modules/lenis/dist/lenis.mjs), mesmo com
// `syncTouch` desligado, em que ela nem suaviza o toque. Escutador de toque não
// passivo obriga o navegador a esperar o JavaScript a cada movimento do dedo antes
// de rolar, e com a câmera escrevendo a cada quadro a rolagem vira degrau. No toque
// a rolagem é nativa de qualquer jeito: sem a Lenis ela fica igual e para de esperar.
// O ScrollTrigger lê a rolagem nativa sozinho; `lib/rolagem.ts` já cai no nativo.
const TOQUE = '(hover: none) and (pointer: coarse)';

export function MotionProvider({children}: {children: React.ReactNode}) {
  useEffect(() => {
    const preferencia = window.matchMedia('(prefers-reduced-motion: reduce)');
    const toque = window.matchMedia(TOQUE);
    let desligar: (() => void) | null = null;

    // A barra de endereço do celular muda a altura da janela a cada rolagem, e cada
    // `resize` refaria as medidas de todos os gatilhos no meio do gesto.
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ignoreMobileResize: true});

    function ligar() {
      if (toque.matches) return;

      const lenis = new Lenis({autoRaf: false});
      const raf = (tempo: number) => lenis.raf(tempo * 1000);

      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(raf);
      gsap.ticker.lagSmoothing(0);
      // Quem precisa pausar a rolagem pede por lib/rolagem, porque a instância
      // vive só aqui dentro. Hoje: o campo da hero da landing, quando o
      // teclado do celular abre.
      registrarRolagem(lenis);

      desligar = () => {
        desligar = null;
        registrarRolagem(null);
        gsap.ticker.remove(raf);
        lenis.destroy();
      };
    }

    // Movimento reduzido: rolagem nativa e nada mais acontece.
    // Reavaliado ao vivo se a preferência do sistema mudar.
    function avaliar() {
      desligar?.();
      if (!preferencia.matches) ligar();
    }

    avaliar();
    preferencia.addEventListener('change', avaliar);
    toque.addEventListener('change', avaliar);

    return () => {
      preferencia.removeEventListener('change', avaliar);
      toque.removeEventListener('change', avaliar);
      desligar?.();
    };
  }, []);

  // `reducedMotion="user"`: para quem pediu menos movimento no aparelho, o Framer das seções do
  // catálogo não anima deslocamento nem escala, só opacidade. Complementa o gancho de
  // lib/movimento-reduzido.ts, que na hidratação usa o valor do servidor (25/09/2026).
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
