'use client';

import {useTranslations} from 'next-intl';
import {Calculator, Mail, MessageSquare} from 'lucide-react';
import {FioDoPercurso} from '@/components/ui/fio-do-percurso';
import {fonteDisplay} from '@/components/landing/pele';
import {cn} from '@/lib/utils';

/* DEPOIS DO DOWNLOAD · três fichas numa escada, e o fio que passa por elas.
 *
 * Versão 3 (plano-landing-guia-v3.md, item 4). Saiu o Timeline da Aceternity
 * e saíram os números: o roteiro não tem título para os passos, e o número
 * era decoração de template. Cada passo é uma FICHA (branco, borda Lápis,
 * raio 12px) com o texto verbatim (landing.s3.p1..p3) e um MEDALHÃO com o
 * ícone de linha do gesto (o e-mail que chega, a mensagem que se manda, a
 * conta que se faz). De 1024px para cima as três ficam em ESCADA (a segunda
 * 40px mais baixa, a terceira 80px, por transform), o desenho literal de
 * "passos"; no celular, empilhadas.
 *
 * O FIO DE LATÃO atravessa os três medalhões e se traça com a rolagem, com a
 * luz correndo à frente (FioDoPercurso). Quando a luz chega a uma ficha, ela
 * ACENDE: a borda vira latão, o medalhão preenche, o traço de 3px aparece na
 * aresta de cima e a ficha sobe 6px. Estado, não decoração: cada ficha muda
 * uma vez, quando o fio chega. Só transform, opacity e cor de borda em
 * transição de estado. */

const ICONES = [Mail, MessageSquare, Calculator] as const;
const DEGRAUS = ['', 'lg:translate-y-10', 'lg:translate-y-20'] as const;

export function PassosComFio({className}: {className?: string}) {
  const t = useTranslations('landing.s3');

  return (
    <div className={className}>
      <h3
        className={`${fonteDisplay} text-[clamp(1.5rem,2.6vw,2.1rem)] font-medium leading-tight tracking-[-0.01em] text-tinta`}
      >
        {t('passosTitulo')}
      </h3>

      <FioDoPercurso className="mt-12 lg:mt-16 lg:pb-20">
        {(acesos) => (
          <ol className="grid gap-8 lg:grid-cols-3 lg:gap-6">
            {(['p1', 'p2', 'p3'] as const).map((p, i) => {
              const Icone = ICONES[i];
              const aceso = i < acesos;
              return (
                <li key={p} className={cn('relative', DEGRAUS[i])}>
                  <div
                    data-aceso={aceso ? 'true' : 'false'}
                    className="group relative h-full rounded-[12px] border border-lapis bg-white px-7 pb-7 pt-10 transition-[transform,border-color] duration-500 ease-out data-[aceso=true]:-translate-y-1.5 data-[aceso=true]:border-latao"
                  >
                    {/* O traço de 3px da pele, que aparece quando a ficha acende. */}
                    <span
                      aria-hidden="true"
                      className="absolute left-7 top-0 h-[3px] w-11 origin-left scale-x-0 rounded-b-[2px] bg-latao transition-transform duration-500 ease-out group-data-[aceso=true]:scale-x-100"
                    />
                    <span
                      data-medalhao
                      aria-hidden="true"
                      className="absolute -top-[22px] left-7 grid size-11 place-items-center rounded-full border border-lapis bg-white text-latao transition-colors duration-500 group-data-[aceso=true]:border-latao group-data-[aceso=true]:bg-latao group-data-[aceso=true]:text-tinta"
                    >
                      <Icone strokeWidth={1.5} className="size-5" />
                    </span>
                    <p className="text-[16px] leading-[1.6] text-grafite lg:text-[17px]">{t(p)}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </FioDoPercurso>
    </div>
  );
}
