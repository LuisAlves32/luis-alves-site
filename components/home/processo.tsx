// Página original (21st.dev): https://21st.dev/@daiwiikharihar/components/elastic-gallery
// Licença: sem licença declarada pelo autor; usado com crédito, conforme os termos do 21st.dev. Créditos completos em CREDITOS.md.
'use client';

/* =============================================================================
   COMO A GENTE TRABALHA JUNTO  ·  bloco 8 da home  ·  filmstrip de 5 painéis
   -----------------------------------------------------------------------------
   Base: Elastic Gallery, 21st.dev id 9859, adaptada à marca (aprovada pelo
   Gabriel). Cinco painéis fotográficos lado a lado numa faixa de altura fixa.
   O ativo ocupa 4 partes de 8 e mostra etapa, título e apoio sobre a foto; os
   outros ocupam 1 parte, escurecem e mostram só o título.

   O QUE FOI ADAPTADO em relação ao componente original:
     1. o original anima `flex` por transição CSS. AQUI NÃO: animar flex é
        animar layout, e a regra do projeto (movimento.md) é só transform e
        opacity. O CSS define as duas larguras e o `layout` do Framer resolve a
        diferença em transform, exatamente como portas-dos-caminhos.tsx faz.
     2. a distorção da foto durante a animação de layout é corrigida pelo
        motion.div interno, também com `layout`: o Framer aplica a escala
        inversa nele, então a imagem não estica no meio da transição. É o mesmo
        recurso que o wrapper da máscara cumpre nas portas.
     3. hover só abre em aparelho com ponteiro fino, e foco só abre no teclado:
        os dois guards vêm do arquivo de referência. Sem eles o toque no
        celular dispara um mouseenter emulado e o painel abre antes do dedo.

   POR QUE O BOTÃO É UMA CAMADA POR CIMA, e não o pai do texto: <button> só
   aceita conteúdo de FRASE, e <h3> e <p> são conteúdo de fluxo. Um <h3> dentro
   de <button> é marcação inválida, o parser do navegador reestrutura a árvore
   ao ler o HTML do servidor e a hidratação quebra. Então o gatilho é um
   <button> absoluto cobrindo o painel inteiro (mesma área de clique, foco e
   Enter/Espaço nativos) e o título continua sendo um <h3> de verdade, ligado a
   ele por aria-labelledby.

   NÃO tem pin, NÃO tem scrub, NÃO tem scroll-hijack.
   O texto das cinco etapas fica SEMPRE no DOM, nos cinco painéis: leitor de
   tela lê o processo inteiro sem interagir com nada. Nos fechados ele é
   escondido só visualmente (opacity e translate), nunca com display:none nem
   renderização condicional.

   Estrutura e medidas em app/globals.css, bloco "BLOCO 8".
   ========================================================================== */

import {useState} from 'react';
import {LayoutGroup, motion, useReducedMotion} from 'framer-motion';
import {useTranslations} from 'next-intl';

const ETAPAS = [
  {id: 'e1', foto: 'processo-1-conversa'},
  {id: 'e2', foto: 'processo-2-preparacao'},
  {id: 'e3', foto: 'processo-3-busca'},
  {id: 'e4', foto: 'processo-4-analise'},
  {id: 'e5', foto: 'processo-5-fechamento'}
] as const;

// A fronteira é 820px, a mesma do resto do site (não o md: do Tailwind).
const LIMIAR_MOBILE = 820;

/**
 * Aparelho com ponteiro fino e hover de verdade (mouse, trackpad). Num celular
 * isto é falso, e o mouseenter que o toque emula deixa de abrir o painel.
 * A pergunta é feita NO EVENTO, nunca na renderização, para não divergir na
 * hidratação.
 */
function temHoverDeVerdade() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(hover: hover) and (pointer: fine)').matches
  );
}

/** Distingue foco de TECLADO de foco dado pelo toque ou pelo clique. */
function focoDeTeclado(el: HTMLElement) {
  try {
    return el.matches(':focus-visible');
  } catch {
    // Navegador sem :focus-visible: melhor abrir a mais do que travar o teclado.
    return true;
  }
}

export function Processo() {
  const t = useTranslations('processo');
  const reduzido = useReducedMotion();

  // A primeira etapa nasce aberta: é o começo do processo e a leitura é da
  // esquerda para a direita.
  const [ativa, setAtiva] = useState<string>('e1');

  // A mesma mola das portas: 260/32 assenta rápido e sem passar do ponto.
  const molaLayout = reduzido
    ? {duration: 0}
    : {type: 'spring' as const, stiffness: 260, damping: 32};

  return (
    <section
      data-bloco="processo"
      // POSSE DECLARADA (movimento.md, revisão de 03/09): o PICO 2 caiu e este
      // bloco virou VALE FORTE dirigido por GESTO. O movimento é o do
      // componente (Framer Motion, LayoutGroup logo abaixo), a seção não
      // declara camadas, e a câmera global passa por cima dela.
      data-owner="catalogo"
      className="py-secao"
    >
      <div className="conteudo">
        <div className="max-w-[65ch]">
          <h2>{t('titulo')}</h2>
          <p className="mt-4">{t('apoio')}</p>
        </div>

        <LayoutGroup id="processo">
          <ol className="proc-faixa">
            {ETAPAS.map((etapa, i) => {
              const aberta = etapa.id === ativa;
              const numero = String(i + 1).padStart(2, '0');
              const titulo = t(`etapas.${etapa.id}.titulo`);
              const idTitulo = `proc-titulo-${etapa.id}`;

              return (
                <motion.li
                  key={etapa.id}
                  layout
                  data-ativa={aberta ? 'sim' : 'nao'}
                  transition={{layout: molaLayout}}
                >
                  {/* O painel também é nó de projeção, e não um <div> comum:
                      a correção de escala do Framer só desce por uma cadeia de
                      nós de projeção. Com um <div> simples aqui no meio, a
                      escala da caixa chegava inteira na foto e ela esticava
                      (medido: 0,275 na horizontal contra 1,10 na vertical). */}
                  <motion.div
                    layout
                    className="proc-painel"
                    data-ativa={aberta ? 'sim' : 'nao'}
                    transition={{layout: molaLayout}}
                  >
                    {/* O `layout` daqui é o que impede a foto de esticar: o
                        Framer aplica a escala inversa neste nó enquanto a
                        caixa de fora muda de largura. */}
                    <motion.div
                      layout
                      className="proc-foto"
                      transition={{layout: molaLayout}}
                    >
                      {/* Art direction por <picture>, nunca por srcset: a
                          variante -mobile tem o mesmo enquadramento mas é um
                          arquivo menor de propósito, e o srcset escolheria
                          pelo tamanho do slot, não pelo aparelho. */}
                      <picture>
                        <source
                          media={`(max-width: ${LIMIAR_MOBILE}px)`}
                          srcSet={`/processo/${etapa.foto}-mobile.webp`}
                        />
                        <img
                          src={`/processo/${etapa.foto}.webp`}
                          alt=""
                          width={1200}
                          height={1600}
                          loading="lazy"
                          decoding="async"
                        />
                      </picture>
                    </motion.div>

                    <span className="proc-veu" aria-hidden="true" />

                    <div className="proc-texto">
                      {/* Sempre no DOM, nos cinco painéis. Nos fechados some
                          por opacidade, não por renderização. */}
                      <div className="proc-aberto">
                        <span className="proc-chip">
                          {t('rotuloEtapa')} {numero}
                        </span>
                        <h3 id={idTitulo}>{titulo}</h3>
                        <p>{t(`etapas.${etapa.id}.texto`)}</p>
                      </div>

                      {/* O mesmo título, sem o ponto final: aqui ele é rótulo,
                          não frase. aria-hidden porque o h3 acima já o diz. */}
                      <span className="proc-vertical" aria-hidden="true">
                        {titulo.replace(/\.$/, '')}
                      </span>
                    </div>

                    <button
                      type="button"
                      className="proc-gatilho"
                      aria-labelledby={idTitulo}
                      aria-expanded={aberta}
                      onClick={() => setAtiva(etapa.id)}
                      onMouseEnter={() => {
                        if (temHoverDeVerdade()) setAtiva(etapa.id);
                      }}
                      onFocus={(e) => {
                        if (focoDeTeclado(e.currentTarget)) setAtiva(etapa.id);
                      }}
                    />
                  </motion.div>
                </motion.li>
              );
            })}
          </ol>
        </LayoutGroup>

        <p className="mt-12 max-w-[65ch] text-[15px] text-grafite/90">
          {t('linhaFinal')}
        </p>
      </div>
    </section>
  );
}
