'use client';

import {useTranslations} from 'next-intl';
import {TextoQueAcende, TextoQueAcendeEnvelope, TextoRecortado} from '@/components/ui/texto-que-acende';
import {botaoContornoPapel, fonteDisplay} from '@/components/landing/pele';
import {ANCORA_FORMULARIO} from '@/lib/captura-guia';

/* SEÇÃO 2b · AS DUAS CONTAS COMPLETAS, a pausa em Tinta no meio do papel.
 *
 * O parágrafo da simulação ACENDE conforme a rolagem (Text Scroll Read, 21st
 * 19275): a pessoa lê linha por linha a conta que o guia faz linha por linha.
 * Depois, o CTA secundário do roteiro, que rola de volta ao formulário.
 *
 * VERSÃO 3: a composição mudou, o componente não. Antes o parágrafo era uma
 * coluna de 34ch a 2rem, que numa tela de 1440 ocupava 40% da largura e
 * deixava o resto em Tinta vazia. Agora ele ocupa a largura do conteúdo, em
 * Author 500 maior, com 40ch de medida: cinco ou seis linhas de declaração,
 * não uma coluna perdida. O fio virou o traço de 3px das fichas, o mesmo
 * objeto em toda a pele.
 *
 * A ÚLTIMA FRASE INTEIRA (08/09, pedido do Gabriel): em celular apertado o
 * parágrafo terminava com a frase final partida em fragmentos ("move. It is
 * the / mortgage penalty."). Agora a última frase é uma unidade que não
 * quebra (espaços inflexíveis entre TODAS as palavras dela, na leitura, nunca
 * na copy), então ela ocupa sozinha a última linha, e o tamanho do celular
 * foi calibrado para essa unidade caber em 360px. É acabamento de
 * apresentação: a string do messages não muda um caractere. */
const NBSP = ' ';

function ultimaFraseInteira(texto: string) {
  const corte = texto.lastIndexOf('. ');
  if (corte === -1) return texto;
  const cabeca = texto.slice(0, corte + 1);
  const cauda = texto.slice(corte + 2).replace(/ /g, NBSP);
  return `${cabeca} ${cauda}`;
}

export function Simulacao() {
  const t = useTranslations('landing.s2');

  return (
    <section data-bloco="landing-simulacao" className="bg-tinta py-secao text-papel">
      <div className="conteudo">
        <span aria-hidden="true" className="block h-[3px] w-11 rounded-[2px] bg-latao" />
        <TextoQueAcende offset={['start 85%', 'end 55%']}>
          <TextoQueAcendeEnvelope>
            <p
              className={`${fonteDisplay} mt-8 max-w-[40ch] text-[clamp(1.4rem,6.2vw,1.9rem)] font-medium leading-[1.28] tracking-[-0.01em] min-[821px]:text-[clamp(1.75rem,3.3vw,2.85rem)] lg:mt-10`}
            >
              <TextoRecortado>{ultimaFraseInteira(t('simulacao'))}</TextoRecortado>
            </p>
          </TextoQueAcendeEnvelope>
        </TextoQueAcende>
        <div className="mt-10 lg:mt-12">
          <a href={`#${ANCORA_FORMULARIO}`} className={botaoContornoPapel}>
            {t('cta')}
          </a>
        </div>
      </div>
    </section>
  );
}
