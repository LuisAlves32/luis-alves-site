// Página original (21st.dev): https://21st.dev/@ddoemonn/components/filter-grid
// Licença: MIT, Copyright (c) 2026 ozzy (ddoemonn/interior). Créditos completos em CREDITOS.md.
'use client';

import {motion} from 'framer-motion';
import {useReducedMotion} from '@/lib/movimento-reduzido';
import {useCallback, useEffect, useId, useMemo, useRef, useState, useSyncExternalStore, type KeyboardEvent, type ReactNode} from 'react';
import {ListaComPrevia} from '@/components/ui/lista-com-previa';
import './notas.css';

/* Origem: 21st.dev, "Filter Grid" de ddoemonn (demo 23525), reusado do ACERVO (a mesma
   mecânica rodou no The Cora Journal, 23/09/2026). O que veio dele: o `radiogroup` com
   setas, Home e End, o `tabIndex` que roda, o anúncio da contagem para leitor de tela e o
   indicador que DESLIZA de um filtro para o outro (`layoutId`). A grade de altura fixa
   dele não veio (o índice é uma lista), e da Cora veio o filtro no endereço
   (`?categoria=`), lido como loja externa (`useSyncExternalStore`).

   A FORMA é do Luís (design-blog.md, 5.3): o indicador não é pílula, é a COTA de 3px em
   Avanço sob a categoria ativa, o mesmo sublinhado das headlines do site. A curva é a da
   marca, sem ricochete. Posse: o Framer daqui de dentro. */

export type ItemDoIndice = {slug: string; categoria: string; linha: ReactNode; previa: ReactNode};
type Filtro = {id: string; rotulo: string};

const nuncaMuda = () => () => {};
const DESLIZA = {type: 'tween', duration: 0.45, ease: [0.16, 1, 0.3, 1]} as const;

export function IndiceDoDossie({
  itens,
  filtros,
  rotuloFiltros,
  tituloIndice,
  textoVazio
}: {
  itens: ItemDoIndice[];
  filtros: Filtro[];
  rotuloFiltros: string;
  tituloIndice: string;
  textoVazio: string;
}) {
  const uid = useId();
  const reduzido = useReducedMotion();
  const pedido = useSyncExternalStore(
    nuncaMuda,
    () => new URLSearchParams(window.location.search).get('categoria'),
    () => null
  );
  const [escolhido, setEscolhido] = useState<string | null>(null);
  const ativo = escolhido ?? (pedido && filtros.some((f) => f.id === pedido) ? pedido : 'todas');
  const botoes = useRef<(HTMLButtonElement | null)[]>([]);

  const escolher = useCallback((id: string) => {
    setEscolhido(id);
    const url = new URL(window.location.href);
    if (id === 'todas') url.searchParams.delete('categoria');
    else url.searchParams.set('categoria', id);
    window.history.replaceState(window.history.state, '', url);
  }, []);

  // A lista mudou de altura: avisa a câmera do blog (components/camera-notas.ts), que refaz a
  // medida do número que arquiva no índice quando a animação de layout assenta.
  const primeiraVez = useRef(true);
  useEffect(() => {
    if (primeiraVez.current) {
      primeiraVez.current = false;
      return;
    }
    window.dispatchEvent(new Event('notas:indice'));
  }, [ativo]);

  const visiveis = useMemo(() => (ativo === 'todas' ? itens : itens.filter((i) => i.categoria === ativo)), [itens, ativo]);
  const indice = Math.max(0, filtros.findIndex((f) => f.id === ativo));

  const teclas = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const destino: Record<string, number> = {
      ArrowRight: i + 1,
      ArrowDown: i + 1,
      ArrowLeft: i - 1,
      ArrowUp: i - 1,
      Home: 0,
      End: filtros.length - 1
    };
    if (!(e.key in destino)) return;
    e.preventDefault();
    const n = (destino[e.key] + filtros.length) % filtros.length;
    botoes.current[n]?.focus();
    escolher(filtros[n].id);
  };

  return (
    <div>
      <h2 id={`${uid}-titulo`} className="sr-only">
        {tituloIndice}
      </h2>
      <div
        role="radiogroup"
        aria-label={rotuloFiltros}
        aria-controls={`${uid}-lista`}
        className="-mx-3 mb-6 flex gap-6 overflow-x-auto px-3 pb-3 text-xs font-semibold uppercase tracking-[0.16em]"
      >
        {filtros.map((f, i) => {
          const on = i === indice;
          return (
            <button
              key={f.id}
              ref={(n) => {
                botoes.current[i] = n;
              }}
              type="button"
              role="radio"
              aria-checked={on}
              tabIndex={on ? 0 : -1}
              onClick={() => escolher(f.id)}
              onKeyDown={(e) => teclas(e, i)}
              // `-mx-3 px-3`: a área de toque ganha 12px de cada lado (44px mesmo em "All"),
              // e o desenho fica onde estava; a cota acompanha só o texto (`inset-x-3`).
              className={`relative -mx-3 min-h-11 shrink-0 whitespace-nowrap px-3 transition-colors duration-200 focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--cor-avanco)] ${on ? 'text-tinta' : 'text-grafite hover:text-tinta'}`}
            >
              {f.rotulo}
              {on ? (
                <motion.span
                  aria-hidden="true"
                  className="absolute inset-x-3 bottom-1.5 h-[3px] rounded-full bg-avanco"
                  layoutId={reduzido ? undefined : `${uid}-cota`}
                  transition={reduzido ? {duration: 0} : DESLIZA}
                />
              ) : null}
            </button>
          );
        })}
      </div>

      {visiveis.length ? (
        <ListaComPrevia
          idLista={`${uid}-lista`}
          classeLista="indice-notas"
          rotulo={tituloIndice}
          linhas={visiveis.map((i) => ({id: i.slug, conteudo: i.linha, previa: i.previa}))}
        />
      ) : (
        <p id={`${uid}-lista`} className="text-lg text-grafite">
          {textoVazio}
        </p>
      )}

      <p aria-live="polite" className="sr-only">
        {filtros[indice]?.rotulo}: {visiveis.length}
      </p>
    </div>
  );
}
