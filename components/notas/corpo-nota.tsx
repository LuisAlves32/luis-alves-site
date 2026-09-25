import React from 'react';
import Markdoc, {type RenderableTreeNode} from '@markdoc/markdoc';
import {colarUltimasPalavrasEm, TETO_CORPO} from '@/lib/tipografia-notas';
import './notas.css';

/* O CORPO DA NOTA: a árvore do Markdoc (lib/notas.ts, já com as órfãs coladas e
   os ids dos subtítulos) vira React, e as três peças próprias do painel viram
   componentes. Passe 1: tudo parado. */

/** A frase que o Luís marca no painel (design-blog.md, 5.6). */
function Marcada({children}: {children?: React.ReactNode}) {
  return (
    <span className="marcada" data-cota-frase>
      {children}
    </span>
  );
}

type Linha = {item?: string; valor?: string};

export function componentesDoCorpo(rotuloNota: string) {
  /** A nota de margem (5.7). Entra no fluxo DEPOIS do parágrafo a que se refere. */
  function NotaDoLuis({texto}: {texto?: string}) {
    if (!texto) return null;
    return (
      <aside className="nota-do-luis">
        <b>{rotuloNota}</b>
        {colarUltimasPalavrasEm(texto, TETO_CORPO)}
      </aside>
    );
  }

  /** O livro-razão (5.8). */
  function AConta({
    titulo,
    linhas,
    rotuloDoTotal,
    total,
    nota
  }: {
    titulo?: string;
    linhas?: Linha[];
    rotuloDoTotal?: string;
    total?: string;
    nota?: string;
  }) {
    return (
      <figure className="a-conta">
        {titulo ? <h3>{titulo}</h3> : null}
        <ul>
          {(linhas ?? []).map((l, i) => (
            <li key={i}>
              {/* Os atributos do bloco não passam pela cola do corpo (lib/notas.ts): colados aqui. */}
              <span className="item">{colarUltimasPalavrasEm(l.item ?? '')}</span>
              <span className="pontilhado" aria-hidden="true" />
              <span className="valor">{l.valor}</span>
            </li>
          ))}
        </ul>
        {total ? (
          <p className="total">
            <span>{rotuloDoTotal}</span>
            <strong>{total}</strong>
          </p>
        ) : null}
        {nota ? <small>{colarUltimasPalavrasEm(nota, TETO_CORPO)}</small> : null}
      </figure>
    );
  }

  return {Marcada, NotaDoLuis, AConta};
}

export function CorpoNota({arvore, rotuloNota}: {arvore: RenderableTreeNode; rotuloNota: string}) {
  // A raiz já vem como <div class="corpo-nota"> do leitor (lib/notas.ts).
  return <>{Markdoc.renderers.react(arvore, React, {components: componentesDoCorpo(rotuloNota)})}</>;
}
