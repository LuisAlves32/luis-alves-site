import './notas.css';
import type {Categoria} from '@/lib/notas';

/* A CAPA GERADA PELO CÓDIGO do Second Opinion (blog/design-blog.md, 5.1):
   "todo artigo abre com o número que ele mede". O número-tese da nota, medido por
   uma cota de desenho técnico. A categoria se diz pela FORMA da cota, nunca só
   pela cor. Sem número (ou número sem fonte e data), a cota mede o tempo de
   leitura e o título entra: nunca inventa dado.

   Passe 1: parada. Cada peça da cota tem `data-cota-peca` para o Passe 3 traçar
   (chamadas sobem, a linha corre do centro, os tiques assentam, o número resolve). */

type Forma = 'horizontal' | 'vertical' | 'inclinada' | 'nivel' | 'leitura';

const FORMA: Record<Categoria, Forma> = {
  buying: 'horizontal',
  selling: 'vertical',
  presale: 'inclinada',
  market: 'nivel',
  notes: 'leitura'
};

function Linha() {
  return (
    <div className="cota-linha" aria-hidden="true">
      <span data-cota-peca="chamada" data-lado="e" />
      <span data-cota-peca="chamada" data-lado="d" />
      <span data-cota-peca="linha" />
      <span data-cota-peca="tique" data-lado="e" />
      <span data-cota-peca="tique" data-lado="d" />
    </div>
  );
}

export function CapaCota({
  categoria,
  numero,
  rotulo,
  kicker,
  rodapeEsquerda,
  rodapeDireita,
  titulo,
  minutosTexto,
  rotuloLeitura,
  tamanho = 'cabecalho',
  descricao,
  className = ''
}: {
  categoria: Categoria;
  /** O número com a unidade ("$11,250"). Vazio: capa pobre, que mede a leitura. */
  numero: string;
  rotulo: string;
  /** "N.º 006 / BUYING", já montado pelo chamador, com a barra em Avanço. */
  kicker: React.ReactNode;
  rodapeEsquerda?: string;
  rodapeDireita?: string;
  /** Só a capa pobre mostra o título. */
  titulo: string;
  minutosTexto: string;
  rotuloLeitura: string;
  tamanho?: 'grande' | 'cabecalho' | 'previa';
  /** O número dito em frase, para leitor de tela (Dimensions: o número dito duas vezes). */
  descricao: string;
  className?: string;
}) {
  const forma: Forma = numero ? FORMA[categoria] : 'leitura';
  const valor = numero || minutosTexto;
  const legenda = numero ? rotulo : rotuloLeitura;

  return (
    <figure
      className={`capa-cota ${className}`}
      data-forma={forma}
      data-tamanho={tamanho}
      data-camada="meio"
      // Dono do movimento: o módulo do blog da câmera (components/camera-notas.ts). A prévia
      // do índice já vive sob o dono dela (o Framer da lista) e fica fora.
      data-owner={tamanho === 'previa' ? undefined : 'notas'}
      aria-label={descricao}
    >
      <p className="capa-kicker">{kicker}</p>

      <div className="capa-medida" aria-hidden="true">
        {forma === 'vertical' ? (
          <>
            <div className="cota-vertical">
              <span data-cota-peca="chamada" data-lado="e" />
              <span data-cota-peca="chamada" data-lado="d" />
              <span data-cota-peca="linha" />
              <span data-cota-peca="tique" data-lado="e" />
              <span data-cota-peca="tique" data-lado="d" />
            </div>
            <p className="capa-numero">{valor}</p>
            {legenda ? <p className="capa-rotulo">{legenda}</p> : null}
          </>
        ) : forma === 'nivel' ? (
          <>
            <p className="capa-numero">{valor}</p>
            <div className="cota-nivel">
              <span data-cota-peca="linha" />
              <svg data-cota-peca="tique" viewBox="0 0 24 20" fill="none">
                <path d="M2 2h20L12 18Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
              </svg>
            </div>
            {legenda ? <p className="capa-rotulo">{legenda}</p> : null}
          </>
        ) : (
          <>
            <div className="cota-bloco">
              <div className="cota-par">
                <p className="capa-numero">{valor}</p>
                <Linha />
              </div>
              {legenda ? <p className="capa-rotulo">{legenda}</p> : null}
            </div>
            {forma === 'leitura' ? <p className="capa-titulo">{titulo}</p> : null}
          </>
        )}
      </div>

      {rodapeEsquerda || rodapeDireita ? (
        <p className="capa-rodape">
          <span>{rodapeEsquerda}</span>
          <span>{rodapeDireita}</span>
        </p>
      ) : null}
    </figure>
  );
}
