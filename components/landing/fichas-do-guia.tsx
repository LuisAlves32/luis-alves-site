'use client';

import {useRef} from 'react';
import Image from 'next/image';
import {motion, useScroll, useTransform} from 'framer-motion';
import {useReducedMotion} from '@/lib/movimento-reduzido';
import {useTranslations} from 'next-intl';
import {Ficha, FichasEmpilhadas} from '@/components/ui/fichas-empilhadas';
import {NumeroQueAparece} from '@/components/ui/numero-que-aparece';
import {fonteDisplay, KickerLanding} from '@/components/landing/pele';

/* SEÇÃO 2 · TRÊS COISAS QUE A MAIORIA DESCOBRE TARDE DEMAIS (versão 3).
 *
 * Cada "coisa" é uma FICHA (card da pele: Branco, borda Lápis, raio 12px)
 * que prende no topo e recua quando a próxima chega por cima (Stacking Cards,
 * 21st 25275). A pilha diz o argumento sem uma palavra: os custos escondidos
 * se acumulam. E ficha empilhando é o dossiê, a metáfora do site.
 *
 * O QUE MUDOU DA VERSÃO 2 (plano-landing-guia-v3.md): a ficha era 45% da
 * tela dentro de um trecho de 78svh, com número e texto num cartão de 1200px
 * e 60% dele em branco, e era a única seção sem imagem. Agora cada ficha é um
 * SPREAD de 76svh: FOTO na metade esquerda (as imagens já aprovadas do site,
 * uma por número, escolhidas pelo sentido: a casa que se compra, a obra do
 * imóvel novo, o interior pronto para vender), o número grande e o texto à
 * direita. A foto ASSENTA (escala 1,06 a 1,0) enquanto a ficha chega ao topo,
 * dirigida pela rolagem do próprio componente: mesmo dono, só transform.
 * Movimento reduzido: foto parada.
 *
 * O NÚMERO APARECE (Count Up, 21st 20068), com os dígitos entrando por
 * desfoque quando a ficha entra na tela. O NÚMERO É COPY VERBATIM: "$8,000",
 * "$50.000", "730 days" saem do messages exatamente como o roteiro escreveu,
 * e o que anima é a apresentação. `lerNumero` separa prefixo, dígitos,
 * separador de milhar e sufixo da própria string, então EN e PT (vírgula e
 * ponto) funcionam sem uma chave a mais. Se a string não tiver dígitos, ela é
 * mostrada parada. O leitor de tela recebe a string inteira, nunca os
 * dígitos soltos. Ressalva registrada: o site limita contagem ao 100+; aqui o
 * número é o conteúdo da seção, e a exceção foi decisão do diretor. */

function lerNumero(texto: string) {
  const m = /^([^\d]*)(\d[\d.,]*)(.*)$/.exec(texto);
  if (!m) return null;
  const [, prefixo, digitos, sufixo] = m;
  const separador = digitos.replace(/\d/g, '')[0] ?? '';
  const valor = Number(digitos.replace(/[.,]/g, ''));
  if (!Number.isFinite(valor)) return null;
  return {prefixo, valor, separador, sufixo};
}

function NumeroDaFicha({texto}: {texto: string}) {
  const n = lerNumero(texto);
  if (!n) return <span>{texto}</span>;
  return (
    <>
      <span className="sr-only">{texto}</span>
      <span aria-hidden="true" className="inline-flex items-baseline">
        {n.prefixo}
        <NumeroQueAparece ate={n.valor} separador={n.separador} efeito="blur" duracao={1.1} />
        {n.sufixo}
      </span>
    </>
  );
}

/* A FOTO QUE ASSENTA: escala 1,06 enquanto a ficha sobe pela tela, 1,0 quando
   ela prende no topo. `useScroll` no próprio artigo, no mesmo dono (Framer)
   da pilha. Sem `alt` de conteúdo: a foto é atmosfera da ficha, e o número e
   o texto ao lado dizem tudo o que ela diria. */
function FotoDaFicha({src, className}: {src: string; className?: string}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduzido = useReducedMotion();
  const {scrollYProgress} = useScroll({target: ref, offset: ['start end', 'start 12%']});
  const escala = useTransform(scrollYProgress, [0, 1], [1.06, 1]);

  return (
    <div ref={ref} className={className}>
      <motion.div className="absolute inset-0 origin-center" style={{scale: reduzido ? 1 : escala}}>
        <Image src={src} alt="" fill sizes="(min-width: 1024px) 40vw, 100vw" className="object-cover" />
      </motion.div>
    </div>
  );
}

// A correspondência foto e número é de SENTIDO, não de enfeite.
const FICHAS = [
  {numero: 'b1Numero', texto: 'b1Texto', foto: '/ia/casa-bc-exterior.webp'},
  {numero: 'b2Numero', texto: 'b2Texto', foto: '/ia/obra-amanhecer-4x5.webp'},
  {numero: 'b3Numero', texto: 'b3Texto', foto: '/ia/interior-preparado.webp'}
] as const;

export function FichasDoGuia() {
  const t = useTranslations('landing.s2');

  return (
    <section data-bloco="landing-fichas" className="bg-papel text-grafite">
      <div className="conteudo pt-secao">
        <KickerLanding>{t('kicker')}</KickerLanding>
        <h2
          className={`${fonteDisplay} mt-3 max-w-[22ch] text-balance text-[clamp(1.75rem,3.4vw,2.6rem)] font-medium leading-[1.12] tracking-[-0.015em] text-tinta`}
        >
          {t('titulo')}
        </h2>
      </div>

      <FichasEmpilhadas total={FICHAS.length} fatorEscala={0.035} className="pb-12 pt-6 lg:pb-20">
        {FICHAS.map((f, i) => (
          <Ficha key={f.numero} indice={i} className="h-[90svh] min-h-[640px]" topo={`${5 + i * 3}%`}>
            <article className="conteudo h-[84%] min-h-[540px]">
              <div className="relative grid h-full grid-rows-[38%_minmax(0,1fr)] overflow-hidden rounded-[12px] border border-lapis bg-white lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:grid-rows-none">
                <FotoDaFicha src={f.foto} className="relative h-full overflow-hidden" />
                <div className="relative flex flex-col justify-center p-6 sm:p-8 lg:px-12 lg:py-10 xl:px-14">
                  {/* O fio de latão na aresta de cima da coluna de texto: a
                      assinatura de linha desta pele, ancorada à ficha. */}
                  <span
                    aria-hidden="true"
                    className="absolute left-6 top-0 h-[3px] w-11 rounded-b-[2px] bg-latao sm:left-8 lg:left-12 xl:left-14"
                  />
                  <p
                    className={`${fonteDisplay} text-[clamp(3rem,7vw,6rem)] font-medium leading-none tracking-[-0.02em] text-latao`}
                  >
                    <NumeroDaFicha texto={t(f.numero)} />
                  </p>
                  <p className="mt-5 max-w-[46ch] text-[15px] leading-[1.6] text-grafite sm:text-[16px] lg:mt-7 lg:text-[17px]">
                    {t(f.texto)}
                  </p>
                </div>
              </div>
            </article>
          </Ficha>
        ))}
      </FichasEmpilhadas>
    </section>
  );
}
