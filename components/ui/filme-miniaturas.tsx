// Página original (21st.dev): https://21st.dev/@uilayout.contact/components/framer-moveable-thumbnails
// Licença: MIT, Copyright (c) 2024 UI LAYOUT. Créditos completos em CREDITOS.md.
'use client';

import type {CSSProperties, KeyboardEvent, ReactNode} from 'react';
import {useCallback, useEffect, useId, useRef, useState} from 'react';
import {animate, motion, useMotionValue, useReducedMotion} from 'framer-motion';

/* ==========================================================================
   FILME DE MINIATURAS
   Origem: 21st.dev, "Framer Moveable Thumbnails" de uilayout.contact (19086),
   escolhido pelo diretor para o Recently sold (Passe 2).

   A MECÂNICA É O ARRASTO, e ela é do componente: o visor rola por x com
   drag mais mola, e a miniatura ativa se abre no filme enquanto as outras se
   recolhem. Não existe crossfade aqui, e isso é decisão registrada (2.36):
   o movimento.md manda o vendidos ser trilho por gesto no celular ("swipe
   com snap"), e trocar o arrasto por uma troca de opacidade cumpriria a
   letra dessa linha matando o sentido dela, porque o dedo se moveria sem
   nada responder. Só x anima, que é transform: dentro da regra dura.
   Nada intercepta a roda do mouse: a rolagem vertical da página segue livre.

   A seção tem dono de movimento (data-owner="catalogo"): o GSAP do Passe 3
   passa por cima e não escreve em elemento nenhum daqui.

   PASSADA DE TOKENS E TRAVAS sobre o original (nível 1, obrigatório):
   setas nos tokens da casa, alvo de toque de 44px, molduras Lápis, raio da
   casa, sem autoplay, sem sombra de autor. Mola em 210/32 (era 300/30): o
   pouso fica mais calmo, no registro da marca, sem atrasar a resposta ao
   dedo. Reduced-motion: grade estática de 2 colunas com foto E ficha, nunca
   só a foto, porque esta seção existe para ser prova verificável.

   A PROP lateral é o que torna o componente um PALCO. Quando ela vem, o
   índice ativo continua morando aqui dentro (nada de estado espelhado, nada
   de içar estado para o pai) e é o próprio componente que monta a geometria
   do 2.36: visor à esquerda, ficha e filme à direita, com a regra
   --vendidos-hh / --vendidos-hw e flex-wrap. Sem ela, o componente se
   comporta como antes.
   ========================================================================== */

// Mola do assentamento. 210/32 no lugar do 300/30 do catálogo (2.36).
const MOLA = {type: 'spring', stiffness: 210, damping: 32} as const;

function Seta({sentido}: {sentido: 'anterior' | 'proximo'}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-5"
    >
      {sentido === 'anterior' ? <path d="M15 6l-6 6 6 6" /> : <path d="M9 6l6 6-6 6" />}
    </svg>
  );
}

export function FilmeMiniaturas({
  quadros,
  rotulos,
  lateral,
  className = ''
}: {
  quadros: {principal: ReactNode; miniatura: ReactNode}[];
  rotulos: {anterior: string; proximo: string; card: string; de: string};
  /** Uma ficha por quadro, na MESMA ordem. Quando existe, o componente monta
      o palco (visor mais coluna) em vez de devolver só o visor e o filme. */
  lateral?: ReactNode[];
  className?: string;
}) {
  const [indice, setIndice] = useState(0);
  const [arrastando, setArrastando] = useState(false);
  const visorRef = useRef<HTMLDivElement | null>(null);
  const abasRef = useRef<(HTMLButtonElement | null)[]>([]);
  const x = useMotionValue(0);
  const reduzido = useReducedMotion();
  const total = quadros.length;
  const ultimo = total - 1;
  const base = useId();

  const idAba = (i: number) => `${base}-aba-${i}`;
  const idFicha = (i: number) => `${base}-ficha-${i}`;

  // Assenta o visor no quadro ativo quando o arrasto solta (mola do original).
  useEffect(() => {
    if (!arrastando && visorRef.current) {
      const largura = visorRef.current.offsetWidth || 1;
      const controle = animate(x, -indice * largura, MOLA);
      return () => controle.stop();
    }
  }, [indice, x, arrastando]);

  // Teclado do filme: setas andam um imóvel, Home e End vão às pontas, e o
  // foco ACOMPANHA (tabIndex rotativo).
  const irPara = useCallback(
    (destino: number) => {
      const alvo = Math.max(0, Math.min(ultimo, destino));
      setIndice(alvo);
      abasRef.current[alvo]?.focus();
    },
    [ultimo]
  );

  const tecla = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      const mapa: Record<string, number | undefined> = {
        ArrowLeft: indice - 1,
        ArrowRight: indice + 1,
        Home: 0,
        End: ultimo
      };
      const destino = mapa[e.key];
      if (destino === undefined) return;
      e.preventDefault();
      irPara(destino);
    },
    [indice, irPara, ultimo]
  );

  /* Grade estática com reduced-motion: mesmos quadros, sem visor e sem filme,
     mas com a FICHA junto de cada foto. Duas colunas, não três: com três, o
     endereço fica estreito demais para ser lido como prova. */
  if (reduzido) {
    return (
      <div className={`grid gap-8 sm:grid-cols-2 ${className}`}>
        {quadros.map((q, i) => (
          <div key={i} className="flex flex-col gap-4">
            <div
              aria-hidden="true"
              className="relative aspect-video overflow-hidden"
              style={{
                borderRadius: 'var(--vendidos-card-raio)',
                boxShadow: 'var(--vendidos-card-sombra)'
              }}
            >
              {q.principal}
            </div>
            {lateral ? lateral[i] : null}
          </div>
        ))}
      </div>
    );
  }

  const filme = (
    <div
      role="tablist"
      aria-label={rotulos.card}
      onKeyDown={tecla}
      className="vendidos-filme"
      style={
        {
          // O CSS trava a largura do filme a partir da altura e da contagem.
          // O fator é a soma das proporções (a ativa em 16:9, as outras em
          // 0,62) e sai daqui porque é o componente que sabe quantos quadros
          // existem. Acrescentar um quinto imóvel muda a LARGURA do filme,
          // nunca a altura da seção.
          '--filme-n': total,
          '--filme-fator': (16 / 9 + (total - 1) * 0.62).toFixed(4)
        } as CSSProperties
      }
    >
      {quadros.map((q, i) => {
        const ativa = i === indice;
        return (
          <button
            key={i}
            ref={(el) => {
              abasRef.current[i] = el;
            }}
            type="button"
            role="tab"
            id={idAba(i)}
            aria-selected={ativa}
            aria-controls={lateral ? idFicha(i) : undefined}
            aria-label={`${rotulos.card} ${i + 1} ${rotulos.de} ${total}`}
            tabIndex={ativa ? 0 : -1}
            onClick={() => setIndice(i)}
            data-ativa={ativa ? '' : undefined}
            className="vendidos-aba"
          >
            <span className="vendidos-aba-recorte">{q.miniatura}</span>
            {/* A COTA: a forma-assinatura do projeto marcando o estado ativo
                de um elemento FUNCIONAL. É o que impede o filme de parecer
                carrossel de catálogo. Entra por scaleX, que é transform. */}
            <span aria-hidden="true" className="vendidos-aba-cota" />
          </button>
        );
      })}
    </div>
  );

  const visor = (
    <div
      ref={visorRef}
      className={lateral ? 'vendidos-heroi' : 'relative overflow-hidden rounded-[12px]'}
    >
      {/* As fotos são DECORATIVAS (alt=""): o endereço está no h3 da ficha e
          é ele que o leitor de tela anuncia. O aria-hidden fica na esteira,
          não no palco, senão as setas sairiam da árvore de acessibilidade. */}
      <motion.div
        aria-hidden="true"
        className="flex h-full cursor-grab active:cursor-grabbing"
        drag="x"
        dragElastic={0.2}
        dragMomentum={false}
        onDragStart={() => setArrastando(true)}
        onDragEnd={(_e, info) => {
          setArrastando(false);
          const largura = visorRef.current?.offsetWidth || 1;
          let destino = indice;
          if (Math.abs(info.velocity.x) > 500) {
            destino = info.velocity.x > 0 ? indice - 1 : indice + 1;
          } else if (Math.abs(info.offset.x) > largura * 0.3) {
            destino = info.offset.x > 0 ? indice - 1 : indice + 1;
          }
          setIndice(Math.max(0, Math.min(ultimo, destino)));
        }}
        style={{x}}
      >
        {quadros.map((q, i) => (
          <div key={i} className="h-full w-full shrink-0">
            {q.principal}
          </div>
        ))}
      </motion.div>

      <button
        type="button"
        aria-label={rotulos.anterior}
        disabled={indice === 0}
        onClick={() => setIndice((i) => Math.max(0, i - 1))}
        className="vendidos-seta left-3 md:left-4"
      >
        <Seta sentido="anterior" />
      </button>
      <button
        type="button"
        aria-label={rotulos.proximo}
        disabled={indice === ultimo}
        onClick={() => setIndice((i) => Math.min(ultimo, i + 1))}
        className="vendidos-seta right-3 md:right-4"
      >
        <Seta sentido="proximo" />
      </button>
    </div>
  );

  /* Sem ficha: o componente devolve visor e filme empilhados, como antes. */
  if (!lateral) {
    return (
      <div className={`flex flex-col gap-3 ${className}`}>
        {visor}
        <div className="flex justify-center">{filme}</div>
        <div aria-live="polite" className="sr-only">
          {`${rotulos.card} ${indice + 1} ${rotulos.de} ${total}`}
        </div>
      </div>
    );
  }

  /* Com ficha: o PALCO do 2.36. A geometria mora no globals.css, numa regra
     só, sem breakpoint: no desktop o teto de altura manda e a coluna fica AO
     LADO; no celular a largura manda e a coluna DESCE, por flex-wrap. */
  return (
    <div className={`vendidos-caixa ${className}`}>
      <div className="vendidos-palco">
        {visor}
        <div className="vendidos-coluna">
          {/* As fichas ficam TODAS no DOM, empilhadas, e só a ativa aparece.
              Empilhadas de propósito: a coluna passa a ter a altura da MAIOR
              ficha e para de pular quando o endereço muda de comprimento. As
              inativas saem da árvore de acessibilidade por visibility, que
              esconde de verdade, e não por opacity, que não esconde. */}
          <div className="vendidos-fichas">
            {lateral.map((ficha, i) => (
              <div
                key={i}
                role="tabpanel"
                id={idFicha(i)}
                aria-labelledby={idAba(i)}
                data-ativa={i === indice ? '' : undefined}
                className="vendidos-ficha"
              >
                {ficha}
              </div>
            ))}
          </div>
          <div className="flex justify-center md:justify-start">{filme}</div>
        </div>
      </div>
      {/* As SETAS mudam o imóvel sem mover o foco para o filme, então nesse
          caminho nada seria anunciado. É esta região que cobre esse caso; ao
          navegar pelo filme quem anuncia é o aria-selected das abas. */}
      <div aria-live="polite" className="sr-only">
        {`${rotulos.card} ${indice + 1} ${rotulos.de} ${total}`}
      </div>
    </div>
  );
}
