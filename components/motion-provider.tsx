'use client';

import 'lenis/dist/lenis.css';
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
export function MotionProvider({children}: {children: React.ReactNode}) {
  useEffect(() => {
    const preferencia = window.matchMedia('(prefers-reduced-motion: reduce)');
    let desligar: (() => void) | null = null;

    function ligar() {
      gsap.registerPlugin(ScrollTrigger);

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

    return () => {
      preferencia.removeEventListener('change', avaliar);
      desligar?.();
    };
  }, []);

  return <>{children}</>;
}
