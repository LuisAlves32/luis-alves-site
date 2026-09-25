// Página original (21st.dev): https://21st.dev/@dillionverma/components/interactive-hover-button
// Licença: MIT, Copyright (c) Magic UI. Créditos completos em CREDITOS.md.
import type {ReactNode} from 'react';
import {ArrowRight} from 'lucide-react';
import {Link} from '@/i18n/navigation';
import type {AppPathname} from '@/i18n/routing';
import {cn} from '@/lib/utils';

/* Origem: 21st.dev, "Interactive Hover Button" da Magic UI (dillionverma, demo
 * 969), escolhido pelo diretor para a porta da home até a landing do guia
 * (bloco 11). O gesto do autor: o rótulo desliza para a direita e some, um
 * ponto de cor no canto cresce até encher o botão, e o mesmo rótulo volta pela
 * direita com uma seta, sobre a cor. Posse do movimento: CSS puro, hover e
 * foco; nada de biblioteca.
 *
 * Passada de tokens e uma correção de lei:
 * 1. É um LINK, não um `<button>`: ele navega. Vai pelo `Link` do next-intl,
 *    com o pathname tipado e localizado.
 * 2. Raio 8px (o raio de interface do design.md, não a pílula do autor),
 *    altura mínima 52px no celular e 48 no desktop, largura total no celular,
 *    como os botões da casa. Traço de 1,5px em Papel a 45% sobre a Tinta; o
 *    ponto e o preenchimento são Avanço, e o rótulo que volta é branco.
 * 3. O autor enchia o botão animando `width` e `height` do ponto. A lei do
 *    movimento.md é só transform e opacity: aqui o ponto cresce por `scale`.
 *    E o ponto fica EM FLUXO, à esquerda do rótulo (no autor ele era absoluto
 *    a 20% da largura, o que cai em cima da letra quando o rótulo é longo).
 *    Em repouso ele lê como o ponto vivo da casa; no hover, vira o
 *    preenchimento. O fator de escala cobre até o botão de largura total.
 * 4. Foco visível com o anel da casa; movimento reduzido sem transições (os
 *    estados finais continuam valendo, então o hover ainda responde). O
 *    rótulo que volta é `aria-hidden`: para o leitor de tela o link diz o
 *    rótulo uma vez só. */

export function BotaoQueDesliza({
  href,
  children,
  className
}: {
  href: AppPathname;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'group relative inline-flex min-h-[52px] w-full items-center justify-center gap-3 overflow-hidden rounded-[8px] border-[1.5px] border-papel/45 pl-6 pr-7 text-center text-[15px] font-semibold text-papel transition-colors duration-300 active:scale-[0.98] focus-visible:outline-none focus-visible:shadow-[0_3px_0_0_var(--cor-papel)] sm:min-h-12 sm:w-auto motion-reduce:transition-none',
        className
      )}
    >
      {/* O ponto de Avanço, em fluxo: cresce até encher o botão (só scale). */}
      <span
        aria-hidden="true"
        className="size-2 shrink-0 rounded-full bg-avanco transition-transform duration-500 ease-out group-hover:scale-[90] motion-reduce:transition-none"
      />
      {/* O rótulo de repouso: desliza para a direita e some no hover. */}
      <span className="relative inline-block translate-x-0 transition-all duration-300 group-hover:translate-x-12 group-hover:opacity-0 motion-reduce:transition-none">
        {children}
      </span>
      {/* O rótulo que volta, com a seta, sobre o preenchimento. */}
      <span
        aria-hidden="true"
        className="absolute inset-0 z-10 flex translate-x-12 items-center justify-center gap-2 text-white opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 motion-reduce:transition-none"
      >
        <span>{children}</span>
        <ArrowRight strokeWidth={1.5} className="size-[18px] shrink-0" />
      </span>
    </Link>
  );
}
