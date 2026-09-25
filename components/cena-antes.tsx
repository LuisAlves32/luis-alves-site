'use client';

/* =============================================================================
   CENA ANTES  ·  bloco 7 da home  ·  pré-construção
   -----------------------------------------------------------------------------
   Código escrito pela Tá Online, do zero, em 24/09/2026. Substitui
   `antes-pre-construcao.tsx`, que era uma reescrita fiel do "Parallax
   Scrolling" da Osmo (21st.dev, https://21st.dev/@osmosupply/components/parallax-scrolling):
   a licença da Osmo proíbe redistribuir o código, e o repositório vai ser
   público. Da referência fica só a IDEIA, que não tem dono: fotografias em
   camadas descendo em velocidades diferentes enquanto a página sobe. Crédito
   de inspiração em CREDITOS.md.

   O QUE A CENA FAZ, e é a composição aprovada pelo diretor em 31/08
   (mock-bloco7.html), que não pode mudar:
     · uma faixa de 100svh cuja cena tem 120% da altura dela e transborda 20%
       por cima do topo da faixa de texto (é esse transbordo que dá percurso);
     · quatro camadas DESCEM enquanto a página sobe, e a de TRÁS é a que mais
       anda: céu 70, floresta 55, palavra 40, homem e terra 10 (yPercent);
     · o trecho vai do topo da cena encostar no topo da tela até a base dela
       passar por lá, com scrub 0 (a cena é a rolagem, sem atraso);
     · o homem e a berma de terra são UMA camada: é o que impede a figura de
       descolar do chão.

   SEM PIN e SEM sticky (movimento.md: a exceção foi retirada em 31/08).
   Posse: GSAP + ScrollTrigger (seção autoral). A Lenis global do
   motion-provider.tsx dirige o relógio; não instanciar outra.
   Estrutura e medidas em app/globals.css, bloco "BLOCO 7".
   ========================================================================== */

import gsap from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import {useTranslations} from 'next-intl';
import {useEffect, useRef} from 'react';
import type {Locale} from '@/i18n/routing';
import {linkWhatsApp} from '@/lib/links';

/** Quanto cada camada desce, em porcentagem da própria altura, ao longo do
 *  trecho. A palavra e a figura que a tampa andam quase juntas (40 e 10 contra
 *  70 e 55 no fundo): a profundidade vem do fundo correndo, e a oclusão não
 *  escorrega (movimento.md, caligrafia 2, a exceção de amplitude do bloco 7). */
const DESCIDA: Record<'1' | '2' | '3' | '4', number> = {'1': 70, '2': 55, '3': 40, '4': 10};

/** Entrada do texto, uma vez: quanto cada peça sobe (px) e em quanto tempo (s). */
const ENTRADA = [
  {sobe: 24, dura: 0.75},
  {sobe: 18, dura: 0.75},
  {sobe: 14, dura: 0.65}
];

/** "Pré-construção, analisada |antes| de..." : o trecho entre barras sai na
 *  serifada itálica da palavra-âncora, como na hero e na seção 2. */
function Titulo({texto}: {texto: string}) {
  return (
    <>
      {texto.split('|').map((parte, i) =>
        i % 2 ? (
          <em key={i} className="ancora">
            {parte}
          </em>
        ) : (
          <span key={i}>{parte}</span>
        )
      )}
    </>
  );
}

export function CenaAntes({locale}: {locale: Locale}) {
  const t = useTranslations('preConstrucao');
  const secao = useRef<HTMLElement>(null);
  const cena = useRef<HTMLDivElement>(null);
  const texto = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduzir = window.matchMedia('(prefers-reduced-motion: reduce)');
    let vivo: gsap.Context | null = null;

    const montar = () => {
      vivo?.revert();
      vivo = null;
      // Movimento reduzido: nada nasce, e as camadas ficam em 0, que é a
      // composição de CHEGADA. Aqui a regra do "estado final" não vale: todo
      // estado da cena é visível, e o final deixaria a composição deslocada
      // (registrado no movimento.md).
      if (reduzir.matches) return;

      gsap.registerPlugin(ScrollTrigger);
      // O contexto recolhe só o que nasce aqui; nunca matar os gatilhos das
      // outras seções.
      vivo = gsap.context(() => {
        const descer = gsap.timeline({
          scrollTrigger: {trigger: cena.current, start: 'top top', end: 'bottom top', scrub: 0}
        });
        for (const [camada, yPercent] of Object.entries(DESCIDA)) {
          descer.to(`[data-camada="${camada}"]`, {yPercent, ease: 'none'}, 0);
        }

        gsap.from('[data-entrada]', {
          opacity: 0,
          y: (i: number) => ENTRADA[i]?.sobe ?? 14,
          duration: (i: number) => ENTRADA[i]?.dura ?? 0.65,
          stagger: 0.1,
          ease: 'power3.out',
          // Quando 60% do bloco de texto já está na tela.
          scrollTrigger: {trigger: texto.current, start: '60% bottom', once: true}
        });
      }, secao);
    };

    montar();
    reduzir.addEventListener('change', montar);
    return () => {
      reduzir.removeEventListener('change', montar);
      vivo?.revert();
    };
  }, []);

  return (
    <section
      ref={secao}
      data-bloco="pre-construcao"
      // Dona do próprio movimento: a câmera global (components/camera.tsx)
      // passa por cima de tudo que está sob [data-owner]. Sem isto, a entrada
      // global escreveria nos mesmos [data-entrada].
      data-owner="autoral"
      // A respiração global de cor não pinta esta faixa: ela tem preto próprio.
      data-respiracao="fora"
      className="s7"
    >
      <div className="s7-cabeca">
        <div className="s7-visuais">
          <div className="s7-linha-preta" />
          <div ref={cena} className="s7-camadas">
            {/* Fotos como fundo de div: decorativas. A informação está no texto. */}
            <div data-camada="1" className="s7-cam s7-foto s7-ceu" />
            <div data-camada="2" className="s7-cam s7-foto s7-meio" />
            <div data-camada="3" className="s7-cam s7-titulo" aria-hidden="true">
              <span className="s7-palavra">{t('palavra')}</span>
            </div>
            <div data-camada="4" className="s7-cam s7-foto s7-frente" />
          </div>
          <div className="s7-fade" />
        </div>
      </div>

      <div className="s7-wrap s7-texto">
        <div ref={texto}>
          <h2 data-entrada>
            <Titulo texto={t('titulo')} />
          </h2>
          <p data-entrada>{t('texto')}</p>
          <a
            data-entrada
            href={linkWhatsApp('presales', locale)}
            target="_blank"
            rel="noopener noreferrer"
            className="s7-cta"
          >
            {t('cta')}
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
              aria-hidden="true"
            >
              <path d="M5 12h13M13 6l6 6-6 6" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
