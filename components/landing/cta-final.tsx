import {useTranslations} from 'next-intl';
import {Calculator, ListChecks, Landmark} from 'lucide-react';
import type {Locale} from '@/i18n/routing';
import {CAPA, CONTRACAPA} from '@/components/landing/capas-do-guia';
import {FormularioFinal} from '@/components/landing/formulario-final';
import {LivroComAlvo} from '@/components/ui/livro-com-alvo';
import {TopografiaLuminosa} from '@/components/ui/topografia-luminosa';

/* CTA FINAL · O LIVRO E O FORMULÁRIO, o mergulho na Tinta.
 *
 * Aqui vive o livro 3D (a volta completa na entrada e o arrasto, do
 * LivroComAlvo que já existia), ao lado do único formulário da landing, numa
 * ficha em Papel. Por trás, o "desenho de linha arquitetônica em latão de
 * baixo contraste" que o roteiro pediu, vivo: as linhas de contorno da
 * Topografia Luminosa (21st 23412) derivando devagar e clareando perto do
 * cursor. As três linhas de valor do roteiro (S1) moram embaixo do livro,
 * com ícones de linha (SVG, traço 1,5, latão), como o roteiro descreveu. */

const ICONES = [Calculator, Landmark, ListChecks] as const;

export function CtaFinal({locale}: {locale: Locale}) {
  const t = useTranslations('landing.s1');
  const tGuia = useTranslations('guia');
  const capa = CAPA[locale] ?? CAPA.en;
  const contracapa = CONTRACAPA[locale] ?? CONTRACAPA.en;

  return (
    <section data-bloco="landing-cta" className="relative bg-tinta text-papel">
      <TopografiaLuminosa
        className="absolute inset-0"
        densidade={1.1}
        profundidade={3}
        deriva={0.6}
        intensidade={0.55}
        interativo
        foco={{x: 0.26, y: 0.42}}
        areaSegura={{x: 0.48, y: 0.08, w: 0.5, h: 0.84}}
        semente={7}
      />

      <div className="conteudo relative z-10 grid gap-12 py-secao lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-center lg:gap-16">
        <div data-camada="meio">
          <div className="flex justify-center lg:justify-start">
            <LivroComAlvo
              capaDesktop={capa.desktop}
              capaMobile={capa.mobile}
              contracapaDesktop={contracapa.desktop}
              contracapaMobile={contracapa.mobile}
              titulo={tGuia('titulo')}
              anguloDescanso={-26}
              entradaAnimada
            />
          </div>

          <ul className="mx-auto mt-10 max-w-[30rem] space-y-4 lg:mx-0 lg:mt-12">
            {(['v1', 'v2', 'v3'] as const).map((v, i) => {
              const Icone = ICONES[i];
              return (
                <li key={v} className="flex items-start gap-3.5 text-[15px] leading-[1.5] text-papel/85">
                  <Icone strokeWidth={1.5} className="mt-0.5 size-5 shrink-0 text-latao" aria-hidden="true" />
                  <span>{t(v)}</span>
                </li>
              );
            })}
          </ul>
        </div>

        <div data-camada="frente">
          <FormularioFinal />
        </div>
      </div>
    </section>
  );
}
