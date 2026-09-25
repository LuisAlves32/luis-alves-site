import {useLocale, useTranslations} from 'next-intl';
import type {Locale} from '@/i18n/routing';
import {JanelaDaManha} from '@/components/landing/janela-da-manha';
import {CampoDaHero} from '@/components/landing/campo-da-hero';
import {CabecaDaHero, FichaDaHero} from '@/components/landing/ficha-da-hero';
import {dividirDestaque, fonteDestaqueHeadline, headlineFunil, KickerLanding} from '@/components/landing/pele';
import {TextoDesfoque} from '@/components/ui/texto-desfoque';

/* SEÇÃO 1 · A MANHÃ INTEIRA (versão 3).
 *
 * Copy verbatim do roteiro (landing.s1). O que a hero mostra na chegada:
 * kicker, H1, subheadline e o campo do e-mail, ALINHADOS À ESQUERDA sobre a
 * zona calma do céu da cena, em toda largura. Na rolagem o dossiê do guia se
 * monta: a cabeça com a identidade (do kicker) e o corpo com as três linhas
 * de valor. A microcopy,
 * a linha de confiança e o resto do formulário vivem no CTA final.
 *
 * A HEADLINE ENTRA LETRA A LETRA (TextoDesfoque) em três segmentos, porque a
 * palavra em destaque tem outro peso. `indiceInicial` faz os três continuarem
 * a mesma sequência.
 *
 * CORES: o lockup mora sobre o céu em TODAS as larguras, então ele é Tinta em
 * todas (medido no pôster: Tinta sobre o céu passa de 9:1). A palavra em
 * destaque é Tinta em peso 700, porque latão sobre céu claro não passa em AA.
 * O kicker idem: Tinta a 75%. Nenhuma troca de cor por tela. */

// Moldes de caminho (o `{i}` vira o índice com dois dígitos, dentro do
// componente cliente): função não atravessa a fronteira servidor/cliente.
// 30 quadros por aparelho, extraídos dos brutos da caminhada (1600 e 640 de
// largura), carregados depois do `load` e no ocioso.
const QUADROS = {
  total: 30,
  desktop: '/video/guia-manha-frames/d-{i}.webp',
  mobile: '/video/guia-manha-frames/m-{i}.webp'
};

export function HeroDaManha() {
  const t = useTranslations('landing.s1');
  const locale = useLocale() as Locale;
  const [antes, palavra, depois] = dividirDestaque(t('titulo'));

  return (
    <JanelaDaManha
      quadros={QUADROS}
      loop={{desktop: '/video/guia-manha-loop.mp4', mobile: '/video/guia-manha-loop-mobile.mp4'}}
      poster={{desktop: '/video/guia-manha-poster.webp', mobile: '/video/guia-manha-poster-mobile.webp'}}
      lockupTopo={
        <div className="text-tinta">
          <KickerLanding className="text-tinta/75">{t('kicker')}</KickerLanding>
          {/* Cor explícita no h1: o globals.css dá Tinta a todo título, mas a
              regra fica escrita aqui para a cor do lockup não depender da
              cascata de outro arquivo. */}
          <h1
            className={`${headlineFunil} mt-3 max-w-[14ch] text-balance text-[clamp(2rem,8.6vw,2.6rem)] leading-[1.06] tracking-[-0.02em] text-tinta min-[821px]:mt-4 min-[821px]:max-w-[21ch] min-[821px]:text-[clamp(2.4rem,3.6vw,3.4rem)] min-[821px]:leading-[1.05]`}
          >
            {palavra ? (
              <>
                <TextoDesfoque>{antes}</TextoDesfoque>
                <TextoDesfoque indiceInicial={antes.length} className={`${fonteDestaqueHeadline} text-tinta`}>
                  {palavra}
                </TextoDesfoque>
                <TextoDesfoque indiceInicial={antes.length + palavra.length}>{depois}</TextoDesfoque>
              </>
            ) : (
              <TextoDesfoque>{t('titulo')}</TextoDesfoque>
            )}
          </h1>
          <p className="mt-3 max-w-[38ch] text-[15px] leading-[1.5] text-tinta/85 min-[821px]:mt-4 min-[821px]:max-w-[46ch] min-[821px]:text-[17px]">
            {t('subtitulo')}
          </p>
        </div>
      }
      lockupBaixo={<CampoDaHero className="w-full" />}
      cabeca={<CabecaDaHero locale={locale} />}
      ficha={<FichaDaHero />}
    />
  );
}
