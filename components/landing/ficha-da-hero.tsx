import Image from 'next/image';
import {useTranslations} from 'next-intl';
import {Calculator, Landmark, ListChecks} from 'lucide-react';
import type {Locale} from '@/i18n/routing';
import {CAPA} from '@/components/landing/capas-do-guia';
import {fonteDisplay} from '@/components/landing/pele';

/* O DOSSIÊ QUE SE MONTA enquanto a câmera caminha (versão 3.3).
 *
 * Histórico curto, porque ele explica a forma. A 3.0 tinha UMA ficha branca no
 * pé da tela com as três linhas acendendo, e o Gabriel gostou dela, mas a
 * metade de cima ficava vazia. A 3.1 partiu a ficha em três (reprovada:
 * desproporcional). A 3.2 pôs o retrato do Luis em cima (reprovada: repete a
 * seção 3, e duas peças soltas de larguras diferentes não liam como uma
 * composição). A 3.3 faz UM OBJETO SÓ, da mesma largura, em duas partes que se
 * encaixam na rolagem:
 *
 * A CABEÇA (em Tinta, cantos de cima arredondados): a identidade do guia. A
 * capa, maior do que era, e os três fatos do kicker do roteiro
 * (landing.s1.kicker, verbatim, partido nos separadores): "guia gratuito", o
 * número de páginas em display, e a região. É a capa do dossiê.
 *
 * O CORPO (branco, cantos de baixo arredondados): as três linhas de valor
 * (landing.s1.v1..v3), verbatim, com os ícones de linha, que nascem escritas
 * e ACENDEM uma por trecho (a JanelaDaManha anima `[data-linha]`). O fio de
 * latão de 3px é a COSTURA entre as duas partes e SE TRAÇA ao longo da
 * caminhada (`[data-fio]`): a cota que se traça, medindo o percurso.
 *
 * Nada aqui muda de altura. As mesmas três linhas voltam embaixo do livro no
 * CTA final, de propósito: lá são a recapitulação no ponto de decisão. */

const ICONES = [Calculator, Landmark, ListChecks] as const;

/* "38 PAGES" vira número em display e palavra ao lado. Se a string não começar
   com número, ela é mostrada inteira, como está. */
function lerPaginas(texto: string): {numero: string; palavra: string} | null {
  const m = /^(\d+)\s+(.+)$/.exec(texto);
  return m ? {numero: m[1], palavra: m[2]} : null;
}

export function CabecaDaHero({locale}: {locale: Locale}) {
  const t = useTranslations('landing.s1');
  const tGuia = useTranslations('guia');
  const capa = CAPA[locale] ?? CAPA.en;
  const fatos = t('kicker')
    .split('·')
    .map((p) => p.trim())
    .filter(Boolean);
  const [gratuito, paginas, regiao] = fatos;
  const pag = paginas ? lerPaginas(paginas) : null;

  return (
    <div className="grid grid-cols-[56px_minmax(0,1fr)] items-center gap-3.5 rounded-t-[12px] bg-tinta p-4 text-papel min-[821px]:grid-cols-[84px_minmax(0,1fr)] min-[821px]:gap-6 min-[821px]:p-6">
      <div className="relative aspect-[3/4] overflow-hidden rounded-[4px] shadow-[0_8px_22px_rgb(0_0_0/0.35)]">
        <Image src={capa.mobile} alt={tGuia('titulo')} fill sizes="84px" className="object-cover" />
      </div>
      <div className="min-w-0">
        {gratuito ? (
          <p className="text-[12px] font-medium uppercase tracking-[0.18em] text-latao">{gratuito}</p>
        ) : null}
        {paginas ? (
          <p className={`${fonteDisplay} mt-1 flex items-baseline gap-1.5 font-medium leading-none`}>
            {pag ? (
              <>
                <span className="text-[28px] tracking-[-0.02em] min-[821px]:text-[34px]">{pag.numero}</span>
                <span className="text-[14px] lowercase text-papel/80 min-[821px]:text-[15px]">{pag.palavra}</span>
              </>
            ) : (
              <span className="text-[18px]">{paginas}</span>
            )}
          </p>
        ) : null}
        {regiao ? (
          <p className="mt-1.5 text-[12px] leading-snug text-papel/70 min-[821px]:text-[12.5px]">{regiao}</p>
        ) : null}
      </div>
    </div>
  );
}

export function FichaDaHero() {
  const t = useTranslations('landing.s1');

  return (
    <div className="relative overflow-hidden rounded-b-[12px] border border-t-0 border-lapis bg-white p-4 text-tinta min-[821px]:p-6">
      {/* A costura de latão entre a cabeça e o corpo, que se traça com a
          caminhada: nasce com os 44px da assinatura e cresce até a largura
          inteira (só scaleX). */}
      <span
        data-fio
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-[3px] origin-left bg-latao"
        style={{transform: 'scaleX(0.09)'}}
      />
      <ul className="grid gap-2.5 min-[821px]:gap-3.5">
        {(['v1', 'v2', 'v3'] as const).map((v, i) => {
          const Icone = ICONES[i];
          return (
            <li
              key={v}
              data-linha
              className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-2.5 text-[14px] leading-[1.45] min-[821px]:text-[15px]"
            >
              <Icone strokeWidth={1.5} className="mt-0.5 size-[18px] shrink-0 text-latao" aria-hidden="true" />
              <span>{t(v)}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
