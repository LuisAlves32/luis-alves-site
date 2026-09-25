'use client';

import {useCallback, useRef, useState} from 'react';
import {useTranslations} from 'next-intl';
import {CoverflowCarousel} from '@/components/ui/baralho-coverflow';

// Ilha cliente do bloco 6: o baralho e o halo que acende atrás dele. Só isto
// precisa de estado; o resto da seção (título, apoio, painel e CTA) continua
// renderizando no servidor, em venda.tsx.
//
// POSSE DO MOVIMENTO: o baralho é do rAF do próprio componente do catálogo
// (21st 23997). Aqui não entra GSAP nem Framer, e o Passe 3 não escreve nos
// cards. O halo é uma camada de FUNDO e anima só `opacity`.

// A ordem foi validada em mock; não é arbitrária.
const FOTOS = [
  '/venda/venda-1-janela-montanha.webp',
  '/venda/venda-2-pinheiros-sala.webp',
  '/venda/venda-3-bosque-quarto.webp',
  '/venda/venda-4-poltronas-bosque.webp',
  '/venda/venda-5-vidro-flores.webp'
].map((src) => ({src}));

// Tons MEDIDOS nas fotos finais (já com a grade de cor aplicada) e travados
// dentro da família do Céu. São valores fechados do prompt 2.33: não
// recalcular, não "melhorar".
const TONS = ['#D3DAB5', '#D1D6D2', '#EACFC3', '#D7DDD4', '#C7D8BC'];

// Um tom só até o transparente DELE MESMO (e não `transparent`, que é
// rgba(0,0,0,0) e faz a rampa passar por cinza).
const halo = (tom: string) =>
  `radial-gradient(58% 66% at 50% 50%, ${tom} 0%, ${tom}B3 34%, ${tom}00 74%)`;

export function VendaBaralho({className = ''}: {className?: string}) {
  const t = useTranslations('venda');
  const rotulos = useTranslations('colecao');

  const [indice, setIndice] = useState(0);
  // A camada que SAI: guarda o tom anterior e uma chave, que remonta o
  // elemento e reinicia o fade a cada troca.
  const [saindo, setSaindo] = useState<{tom: string; chave: number} | null>(
    null
  );
  const indiceRef = useRef(0);
  const chaveRef = useRef(0);

  const aoTrocar = useCallback((novo: number) => {
    const anterior = indiceRef.current;
    if (anterior === novo) return;
    indiceRef.current = novo;
    chaveRef.current += 1;
    setSaindo({tom: TONS[anterior], chave: chaveRef.current});
    setIndice(novo);
  }, []);

  return (
    <div className={`relative ${className}`}>
      {/* O HALO. Dois irmãos empilhados: o de baixo já está no tom NOVO, o de
          cima leva o tom velho e faz fade-out. Só `opacity` anima; o fundo da
          seção continua Céu. */}
      <div aria-hidden="true" data-camada="fundo" className="venda-halo">
        <div className="absolute inset-0" style={{background: halo(TONS[indice])}} />
        {saindo ? (
          <div
            key={saindo.chave}
            className="venda-halo-saida absolute inset-0"
            style={{background: halo(saindo.tom)}}
          />
        ) : null}
      </div>

      <div data-camada="meio" className="relative z-[1]">
        <CoverflowCarousel
          slides={FOTOS}
          /* `altFoto` descreve a foto ANTIGA (casa vista da rua) e ficou sem
             uso; a chave não se apaga sem ordem. O rótulo da região passa a
             ser o próprio título da seção. */
          label={t('titulo')}
          navLabels={{previous: rotulos('anterior'), next: rotulos('proximo')}}
          showNavigation
          onSelect={aoTrocar}
        />
      </div>
    </div>
  );
}
