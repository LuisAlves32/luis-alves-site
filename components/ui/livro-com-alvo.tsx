'use client';

/* O INVÓLUCRO DO LIVRO, e ele existe por um motivo só.
 *
 * `Livro` precisa de `alvoRolagem`, que é um ref para o elemento cuja subida
 * abre a capa. Ref só nasce no cliente, e a landing do funil é Server
 * Component: sem este invólucro, hospedar o livro lá obrigaria a marcar a
 * seção inteira como `'use client'`, e a seção é quase toda texto estático que
 * não tem motivo nenhum para ir ao bundle.
 *
 * Ele prende o ref no PRÓPRIO elemento raiz. Na home o alvo é a seção inteira
 * (`guia-newsletter.tsx`), aqui é a caixa do livro: o trilho fica mais curto,
 * e é a diferença certa, porque numa seção alta o topo dela pode estar na tela
 * com o livro ainda fora.
 *
 * Sem estado, sem efeito, sem observador. Tudo que se mexe continua morando em
 * `livro.tsx`, que é o dono do movimento desta peça. */

import {useRef} from 'react';
import {Livro} from '@/components/ui/livro';

export function LivroComAlvo({
  capaDesktop,
  capaMobile,
  contracapaDesktop,
  contracapaMobile,
  titulo,
  className = '',
  classeLivro = '',
  anguloDescanso,
  entradaAnimada
}: {
  capaDesktop: string;
  capaMobile: string;
  contracapaDesktop: string;
  contracapaMobile: string;
  titulo: string;
  /** Vai para o elemento raiz do invólucro, que é o alvo do trilho. */
  className?: string;
  /** Repassado ao `Livro` como `className`. */
  classeLivro?: string;
  /** Repassados ao `Livro`. Sem valor aqui, valem os padrões dele. */
  anguloDescanso?: number;
  entradaAnimada?: boolean;
}) {
  const alvo = useRef<HTMLDivElement>(null);

  return (
    <div ref={alvo} className={className}>
      <Livro
        capaDesktop={capaDesktop}
        capaMobile={capaMobile}
        contracapaDesktop={contracapaDesktop}
        contracapaMobile={contracapaMobile}
        titulo={titulo}
        alvoRolagem={alvo}
        className={classeLivro}
        anguloDescanso={anguloDescanso}
        entradaAnimada={entradaAnimada}
      />
    </div>
  );
}
