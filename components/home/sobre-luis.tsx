'use client';

import {useEffect, useLayoutEffect, useRef, useState} from 'react';
import {useTranslations} from 'next-intl';
import {Link} from '@/i18n/navigation';
import {botaoSecundario} from '@/components/ui/botoes';
import {BorderBeamPanel} from '@/components/ui/painel-facho';
import {
  ContainerAnimated,
  ContainerInset,
  ContainerScroll,
  ContainerSticky,
  MidiaDaRolagem
} from '@/components/ui/video-na-rolagem';

// Bloco 3 do roteiro.md, em DOIS ATOS.
//
// ATO PRESO (trecho sticky de 180svh): headline, primeiro parágrafo, o VÍDEO
// QUE ABRE de uma cápsula até o quadro cheio, e o CTA. ATO SOLTO (fluxo
// normal): os outros dois parágrafos em coluna dupla e o cartão de
// credibilidade com o facho. A copy do roteiro.md entra inteira: p1 no ato
// preso, p2 e p3 no ato solto. Nada foi cortado.
//
// PIN: este trecho preso é a TERCEIRA exceção de pin do site, decidida pelo
// Gabriel. As outras duas estão declaradas no movimento.md: a passagem do ato
// 1 para o ato 2 da HERO (PICO 1, ~90vh) e a expansão de vídeo da seção
// Regiões (PICO 3, 120vh). Aqui são 180svh, e não os 350vh do demo original.
// A rolagem sempre responde ao usuário: nada de wheel capturado, nada de
// scroll-hijack.
//
// POSSE: data-owner="catalogo". Os dois componentes vêm do 21st.dev com a
// animação deles inteira (o quadro que abre, id 1959; o facho do cartão, id
// 23408) e o Framer/rAF de dentro deles é o dono do movimento desta seção. A
// câmera do Passe 3 (GSAP) passa por cima e não escreve nestes elementos.
// Por isso não há data-camada dentro do ato preso: só o ato solto, que é
// texto autoral em fluxo normal, segue disponível para a câmera.
//
// O que SAIU nesta reescrita: a palavra-fantasma "SOBRE" (a 4% de opacidade
// ela só era visível no pedaço que escapava por trás da mídia, e ali lia como
// bug de renderização; a chave sobre.fantasma continua nos dois idiomas, sem
// uso), a foto /ia/mesa-consultor-4x5.webp e a grade de duas colunas.

const LIMIAR_MOBILE = 820; // o mesmo da hero: troca variante de mídia

const VIDEO_DESKTOP = '/video/sobre-vale-loop.mp4';
const VIDEO_MOBILE = '/video/sobre-vale-loop-mobile.mp4';
const POSTER_DESKTOP = '/video/sobre-vale-poster.webp';
const POSTER_MOBILE = '/video/sobre-vale-poster-mobile.webp';

// Contagem do 100+ (movimento.md: "contagem animada SÓ no número 100+, uma vez
// por sessão").
const CHAVE_CONTAGEM = 'luis-sobre-contagem';
const DURACAO_CONTAGEM = 1200;

// useLayoutEffect no cliente e useEffect no servidor: a contagem precisa
// decidir o valor inicial ANTES da pintura, senão o número aparece em 100 e
// salta para 0 quando o cartão entra na tela.
const useEfeitoDeLayout = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

function suave(t: number) {
  return 1 - Math.pow(1 - t, 3); // ease-out cúbica
}

// O valor vem do roteiro.md verbatim ("100+"). Só a parte numérica conta; o
// "+" nunca anima. Se um dia o texto não começar com número, ele é renderizado
// como está e nada acontece.
function NumeroQueConta({valor, className}: {valor: string; className?: string}) {
  const partes = valor.match(/^(\d+)(.*)$/);
  const alvo = partes ? Number(partes[1]) : null;
  const sufixo = partes ? partes[2] : '';
  // null = mostrar o valor final. É o estado do SSR, o do movimento reduzido e
  // o de quem já viu a contagem nesta sessão.
  const [exibido, setExibido] = useState<number | null>(null);
  const ref = useRef<HTMLSpanElement>(null);

  useEfeitoDeLayout(() => {
    const no = ref.current;
    if (!no || alvo === null) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    try {
      if (sessionStorage.getItem(CHAVE_CONTAGEM) === '1') return;
    } catch {
      // aba anônima com armazenamento bloqueado: a contagem roda e pronto
    }

    setExibido(0);
    let quadro = 0;
    let inicio = 0;

    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (!entrada.isIntersecting) return;
        observador.disconnect();
        try {
          sessionStorage.setItem(CHAVE_CONTAGEM, '1');
        } catch {
          // idem
        }
        const passo = (agora: number) => {
          if (!inicio) inicio = agora;
          const t = Math.min(1, (agora - inicio) / DURACAO_CONTAGEM);
          setExibido(Math.round(alvo * suave(t)));
          if (t < 1) quadro = requestAnimationFrame(passo);
          else setExibido(null); // devolve o texto do roteiro, inteiro
        };
        quadro = requestAnimationFrame(passo);
      },
      {threshold: 0.4}
    );
    observador.observe(no);

    return () => {
      observador.disconnect();
      if (quadro) cancelAnimationFrame(quadro);
    };
  }, [alvo]);

  return (
    <span ref={ref} className={className}>
      {/* O leitor de tela recebe sempre o valor final, nunca um número no meio
          da contagem. */}
      <span aria-hidden="true">
        {exibido === null ? valor : `${exibido}${sufixo}`}
      </span>
      <span className="sr-only">{valor}</span>
    </span>
  );
}

// Ato solto: os dois parágrafos restantes e o cartão de credibilidade. É o
// mesmo em movimento normal e em movimento reduzido.
function AtoSolto() {
  const t = useTranslations('sobre');

  const credibilidade = [
    {
      valor: t('credibilidade.numero'),
      rotulo: t('credibilidade.numeroRotulo'),
      destaque: true
    },
    {
      valor: t('credibilidade.premio'),
      rotulo: t('credibilidade.premioRotulo'),
      destaque: false
    },
    {valor: t('credibilidade.regiao'), rotulo: null, destaque: false},
    {valor: t('credibilidade.idiomas'), rotulo: null, destaque: false}
  ];

  return (
    // SEM respiro no topo: quem separa o ato solto do ato preso é o respiro
    // que o próprio painel já tem embaixo do CTA. Somar `py-secao` aqui era
    // contar a mesma separação duas vezes, e era isso que abria os 202px
    // medidos entre o botão e este parágrafo no celular.
    <div className="conteudo pb-secao">
      <div
        data-camada="frente"
        className="grid gap-6 min-[821px]:grid-cols-2 min-[821px]:gap-14"
      >
        <p className="max-w-[65ch]">{t('p2')}</p>
        <p className="max-w-[65ch]">{t('p3')}</p>
      </div>

      <BorderBeamPanel
        beams={2}
        // Avanço e o azul claro que as portas usam.
        colors={['#2A6DD6', '#8FC0FF']}
        thickness={2}
        radius={12}
        // Mais lento que o padrão do autor (42 e 240): marca premium.
        idleSpeed={26}
        hoverSpeed={130}
        glow
        className="mt-12 border-transparent bg-tinta px-0 py-8 min-[821px]:mt-16 min-[821px]:py-9"
      >
        <ul className="sobre-credibilidade grid grid-cols-2 min-[821px]:grid-cols-4">
          {credibilidade.map((item) => (
            // O item ESTICA na altura da linha (é ele que carrega o
            // separador, que precisa ser inteiro); o conteúdo é que se
            // centraliza dentro dele, senão os três dados curtos flutuariam
            // no topo ao lado do 100+, que tem o dobro da altura.
            <li
              key={item.valor}
              // A calha horizontal e o corpo do valor são fluidos e moram no
              // globals.css (.sobre-credibilidade > li e .sobre-valor): numa
              // grade de 2 colunas de celular a calha come a largura duas
              // vezes, e o texto precisava caber na coluna medida.
              className="flex flex-col justify-center text-papel"
            >
              {item.destaque ? (
                <NumeroQueConta
                  valor={item.valor}
                  className="block text-[36px] font-semibold leading-none tracking-[-0.02em] tabular-nums min-[821px]:text-[46px]"
                />
              ) : (
                <span className="sobre-valor block font-semibold leading-[1.25]">
                  {item.valor}
                </span>
              )}
              {item.rotulo && (
                <span className="mt-2 block text-sm text-papel/75">{item.rotulo}</span>
              )}
            </li>
          ))}
        </ul>
      </BorderBeamPanel>
    </div>
  );
}

export function SobreLuis() {
  const t = useTranslations('sobre');

  // MOVIMENTO REDUZIDO: resolvido em CSS (bloco "SOBRE LUIS" do globals.css),
  // não em ramo de JSX. Um `if (reduzido) return <outra árvore/>` entrega ao
  // servidor uma marcação e ao cliente outra, e o React reprova a hidratação
  // e refaz a árvore inteira ("Hydration failed", mais o "Target ref is
  // defined but not hydrated" do próprio useScroll). MEDIDO neste projeto:
  // dois erros de console com a preferência ligada. Com uma árvore só, o
  // servidor e o cliente concordam sempre, e a media query desliga os 180svh,
  // o sticky, o recorte e a entrada por blur ANTES da primeira pintura, sem
  // nem o piscar de um quadro. O vídeo é barrado no efeito do MidiaDaRolagem,
  // que não influi na marcação.
  return (
    <section data-bloco="sobre" data-owner="catalogo">
      {/* ATO PRESO. 180svh: 100svh de painel preso mais 80svh de percurso. */}
      <ContainerScroll className="sobre-trilho h-[180svh]">
        {/* A folga e o respiro vertical vêm de .sobre-preso no globals.css:
            é lá que a tela baixa consegue apertá-los (ver o comentário do
            orçamento vertical). */}
        <ContainerSticky className="sobre-preso flex h-[100svh] flex-col items-center justify-center overflow-hidden px-6 lg:px-8">
          <ContainerAnimated className="sobre-entrada flex w-full shrink-0 flex-col items-center gap-4 text-center">
            <h2 className="max-w-[30ch] text-balance">
              {t.rich('titulo', {
                ancora: (parte) => <em className="ancora">{parte}</em>
              })}
            </h2>
            <p className="max-w-[58ch]">{t('p1')}</p>
          </ContainerAnimated>

          {/* roundednessRange [1000, 16]: a mídia ABRE de uma cápsula até o
              quadro. A cápsula é a forma-assinatura do site (design.md), e é
              por isso que este componente foi escolhido.
              capsulaRazao 2: a cápsula de partida é sempre duas vezes mais
              larga que alta, MEDIDA da caixa. Sem isso a forma herdava a
              proporção do quadro, e como o quadro estica para encher o painel
              (chega a quadrado no celular), a cápsula virava círculo. */}
          <ContainerInset
            className="sobre-midia"
            insetYRange={[45, 0]}
            insetXRange={[45, 0]}
            roundednessRange={[1000, 16]}
            capsulaRazao={2}
          >
            <MidiaDaRolagem
              videoDesktop={VIDEO_DESKTOP}
              videoMobile={VIDEO_MOBILE}
              posterDesktop={POSTER_DESKTOP}
              posterMobile={POSTER_MOBILE}
              limiarMobile={LIMIAR_MOBILE}
            />
          </ContainerInset>

          {/* O HeroButton do componente (borda e sombra em verde limão) não
              entra: o CTA é o botão secundário da marca. */}
          <ContainerAnimated
            transition={{delay: 0.4}}
            inputRange={[0, 0.7]}
            outputRange={[-120, 0]}
            className="sobre-entrada flex w-full shrink-0 justify-center"
          >
            <div className="w-full sm:w-auto">
              <Link href="/about" className={botaoSecundario}>
                {t('cta')}
              </Link>
            </div>
          </ContainerAnimated>
        </ContainerSticky>
      </ContainerScroll>

      <AtoSolto />
    </section>
  );
}
