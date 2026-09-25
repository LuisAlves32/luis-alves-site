import {useTranslations} from 'next-intl';
import {CartaoRetrato} from '@/components/ui/cartao-retrato';
import {TextoPorPalavra} from '@/components/ui/texto-por-palavra';
import {PassosComFio} from '@/components/landing/passos-com-fio';
import {fonteDisplay, KickerLanding} from '@/components/landing/pele';

/* SEÇÃO 3 · QUEM ESCREVEU, E O QUE ACONTECE DEPOIS (versão 3).
 *
 * A foto do Luis (recorte real, nunca IA) mora numa FICHA em Tinta que inclina
 * seguindo o ponteiro, com ele saindo de dentro da ficha (Parallax Card, 21st
 * 7765), agora a 440px no desktop e com entrada em duas camadas quando a
 * seção chega. O NOME subiu para a coluna de texto, como display (é o H2 da
 * seção); no cartão fica a linha de identificação. O parágrafo verbatim, a
 * 19px, se revela palavra a palavra na chegada. Busquei três ângulos no
 * catálogo e não havia nada melhor que o cartão para uma pessoa só: o defeito
 * da v2 era ESCALA (cartão de 300px e texto de 17px num container de 1200px),
 * não componente. Depois, os três passos de "Depois do download" em fichas
 * numa escada, com o fio de latão que passa por elas (PassosComFio). Copy
 * verbatim de landing.s3. */
export function QuemEscreveu() {
  const t = useTranslations('landing.s3');

  return (
    <section data-bloco="landing-autor" className="bg-papel py-secao text-grafite">
      <div className="conteudo">
        <KickerLanding>{t('kicker')}</KickerLanding>

        <div className="mt-10 grid gap-14 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-center lg:gap-20">
          <div className="flex justify-center pt-12 [perspective:1100px] lg:justify-start lg:pt-16">
            <CartaoRetrato
              imagem={{src: '/fotos/luis-recorte.webp', largura: 858, altura: 1000}}
              alt={t('titulo')}
              linha={t('linha')}
              entrada
              className="w-full max-w-[300px] lg:w-[440px] lg:max-w-[440px]"
              tamanhos="(min-width: 1024px) 440px, 300px"
              classeLinha="text-[14px] lg:text-[15px] lg:leading-[1.5]"
            />
          </div>
          <div>
            <h2
              className={`${fonteDisplay} text-[clamp(2.4rem,4.6vw,4rem)] font-medium leading-[1.02] tracking-[-0.02em] text-tinta`}
            >
              {t('titulo')}
            </h2>
            <p className="mt-6 max-w-[50ch] text-[18px] leading-[1.55] text-grafite lg:mt-8 lg:text-[19px]">
              <TextoPorPalavra atraso={0.15}>{t('corpo')}</TextoPorPalavra>
            </p>
          </div>
        </div>

        <PassosComFio className="mt-20 lg:mt-28" />
      </div>
    </section>
  );
}
