'use client';

import {useGSAP} from '@gsap/react';
import gsap from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import {usePathname} from 'next/navigation';
import {useEffect, useRef, useState} from 'react';
import {moverNotas} from '@/components/camera-notas';
import {aoMedirEnergia} from '@/lib/energia';

/* =============================================================================
   A CÂMERA  ·  Passe 3, parte A  ·  camadas de manhã e entradas
   -----------------------------------------------------------------------------
   Este é o movimento GLOBAL do site, montado UMA vez no layout do grupo (site).
   Nenhuma seção anima por conta própria por causa deste arquivo: a câmera varre
   o documento e trabalha a partir do que o Passe 1 já declarou na marcação
   (data-camada="fundo|meio|frente"). Animação escrita dentro de cada seção
   vira slideshow de fade-ins, e é isso que o movimento.md existe para evitar.

   AMPLITUDES: todas do movimento.md (caligrafia 2, "camadas de manhã").
   Fundo 8 a 16px e meio 4 a 8px no desktop; 6 a 8 e 3 a 4 no celular. Ficamos
   com 14 e 6, o miolo alto da faixa. A DECISÃO-MÃE do briefing é CÂMERA
   CONTIDA: o critério de aceite é o site ler como fluidez de leitura, sem
   ninguém apontar "animação".

   O deslocamento é CENTRADO em zero (de -amplitude/2 a +amplitude/2 ao longo
   da passagem da seção pela tela). Duas razões: no meio do percurso, que é
   onde a seção é lida, a composição é EXATAMENTE a aprovada no Passe 1 e 2; e
   a excursão máxima cai para 7px, que é o que "contida" quer dizer. A camada
   mais funda anda mais, e sempre para BAIXO conforme a página sobe: é a camada
   de trás ficando para trás. Nada além de translateY.

   [data-owner] É IGNORADO DE PROPÓSITO. Essas seções já têm dono do movimento
   (hero e bloco 7 autorais; sobre, vendidos, depoimentos e regiões do
   catálogo, com o Framer que veio dentro delas). Duas bibliotecas escrevendo a
   MESMA propriedade do MESMO elemento é o único conflito proibido do método, e
   é assim que ele nasce. A câmera passa POR CIMA dessas seções e segue nas
   outras.

   Além do [data-owner], a câmera se recusa a escrever em qualquer elemento que
   JÁ declare transição ou animação de CSS em transform/opacity (ver
   `jaAnimaSozinho`). É a mesma regra do conflito, aplicada de forma mecânica
   em vez de por lista: uma seção que ganhar movimento próprio amanhã já nasce
   protegida.

   A COTA QUE SE TRAÇA (caligrafia 1, parte B): as cotas do site não tinham
   marca comum (cada uma com nome próprio: .portas-regua, o fio da seção, a
   cota do card), então a câmera não tinha como encontrá-las. A convenção
   data-cota fecha essa lacuna do mesmo jeito que data-camada fechou a do
   parallax.

   E a câmera NÃO anima o transform da cota: anima a custom property
   --cota-traco, e o CSS usa essa property dentro de um scaleX (regra
   [data-cota] no globals.css). O motivo é duro e não é preferência de estilo:
   boa parte das cotas do site é ::after, e GSAP não alcança pseudo-elemento.
   Uma property no elemento dono serve os dois casos sem converter
   pseudo-elemento em elemento real, o que mexeria no layout de várias seções.
   O padrão da property é 1, então sem JS, com JS falhando e com
   reduced-motion a cota aparece INTEIRA sozinha, sem branch nenhum.
   NÃO troque isto por um scaleX direto: as cotas em pseudo-elemento param de
   funcionar e ninguém vê o erro, porque elas simplesmente ficam paradas.

   A RESPIRAÇÃO DO PAPEL (caligrafia 3, parte C): a cor de fundo do site
   atravessa as fronteiras entre seções, costurando o site num documento só.

   E ela NÃO interpola background-color. São TRÊS camadas de cor sólida, fixas,
   empilhadas atrás de todo o conteúdo (Papel sempre em 1, Céu e Tinta de 0 a
   1), e o que a rolagem dirige é a OPACIDADE delas. Interpolar cor é repintura
   a cada quadro e quebra a regra dura do projeto (só transform e opacity);
   opacidade de camada é composição de GPU, sem layout e sem repintura.
   NÃO "simplifique" isto para um tween de background-color depois.

   Quem participa declara na marcação: data-fundo="ceu" | "tinta". Seção sem o
   atributo é Papel, que é o chão. As classes bg-ceu e bg-tinta das seções NÃO
   saem do CSS: elas são o estado sem JS e com movimento reduzido. Só quando a
   câmera liga é que ela marca <html data-respiracao="ativa"> e o CSS torna
   essas seções transparentes. O padrão é o estado final; a respiração é o
   acréscimo.

   São ILHAS OPACAS, e a respiração passa por trás sem tocá-las: o bloco 7
   (preto, com degradê próprio), o rodapé (Tinta permanente) e a hero (vídeo e
   céu próprios). Nenhuma das três tem data-fundo.

   SEM pin, SEM hijack, SEM efeito decorativo. Só transform e opacity.
   ========================================================================== */

// A mesma fronteira do resto do projeto (hero, processo, min-[821px]), não o
// md: do Tailwind.
const LIMIAR_MOBILE = 820;

const AMPLITUDE = {
  desktop: {fundo: 14, meio: 6, entrada: 16},
  celular: {fundo: 7, meio: 3, entrada: 12}
} as const;

const ENTRADA_DURACAO = 0.55; // 550ms
const ENTRADA_STAGGER = 0.075; // 75ms entre irmãos
const ENTRADA_INICIO = 'top 88%';

// O traço da cota completa em 25% de viewport de rolagem (movimento.md manda
// 20 a 30%). Curto de propósito: cota que demora a fechar vira barra de
// carregamento. A medida é a MESMA no celular: traçado é barato e fica
// integral no mobile; o que cai lá é o parallax.
const COTA_PERCURSO = 0.25;

// A faixa em que uma cor troca, em alturas de janela, CENTRADA na fronteira
// entre as seções. Meia janela: a troca começa um quarto de tela antes da
// emenda e termina um quarto depois, então ela atravessa o corte em vez de
// acontecer nele. É o objetivo inteiro da caligrafia 3.
const RESPIRACAO_FAIXA = 0.5;

// As cores que a respiração sabe pintar. Papel é o chão e não entra aqui.
type CorDeFundo = 'ceu' | 'tinta';

// Nós que existem no DOM mas não pintam nada.
const TAGS_SEM_PINTURA = new Set([
  'STYLE',
  'SCRIPT',
  'NOSCRIPT',
  'TEMPLATE',
  'LINK',
  'META'
]);

/** Alguém acima deste elemento já é dono do movimento dele. */
function temDono(el: Element) {
  return el.closest('[data-owner]') !== null;
}

/**
 * O elemento já escreve transform ou opacity por conta própria (transição de
 * CSS com duração real, ou @keyframes). `transition-property: all` com duração
 * zero é o PADRÃO do CSS e não conta: por isso a duração entra na conta.
 */
function jaAnimaSozinho(el: Element) {
  const estilo = getComputedStyle(el);
  if (estilo.animationName !== 'none') return true;

  const props = estilo.transitionProperty.split(',').map((p) => p.trim());
  const duracoes = estilo.transitionDuration
    .split(',')
    .map((d) => parseFloat(d) || 0);
  if (!duracoes.length) return false;

  return props.some(
    (prop, i) =>
      (prop === 'all' ||
        prop === 'transform' ||
        prop === 'opacity' ||
        prop === 'translate') &&
      duracoes[i % duracoes.length] > 0
  );
}

/** Está livre para receber a entrada suave (fade + subida). */
function estaLivre(el: Element) {
  return (
    !TAGS_SEM_PINTURA.has(el.tagName) &&
    !el.hasAttribute('data-entrada') && // já anima por conta (bloco 7)
    !el.hasAttribute('data-cota') && // o traço da cota já é dono do transform dela
    !el.closest('[aria-hidden="true"]') && // cota, halo, fantasma: decoração
    !jaAnimaSozinho(el)
  );
}

/** Filho de um grupo: livre, e sem ser ele mesmo um bloco de camada. */
function filhoPodeEntrar(el: Element) {
  return !el.hasAttribute('data-camada') && estaLivre(el);
}

export function Camera() {
  // Caminho COMPLETO (com o locale): é o sinal de que o conteúdo abaixo do
  // layout trocou. O layout do grupo (site) não desmonta ao navegar, então sem
  // isto a câmera ficaria apontando para elementos que já saíram do DOM.
  const caminho = usePathname();

  // As camadas da respiração só EXISTEM com movimento normal. Com
  // prefers-reduced-motion elas não são nem criadas, e cada seção fica com a
  // cor estática dela, que é o que o movimento.md manda. Reavaliado ao vivo.
  const [respirar, setRespirar] = useState(false);
  const camadaCeu = useRef<HTMLSpanElement>(null);
  const camadaTinta = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const preferencia = window.matchMedia('(prefers-reduced-motion: reduce)');
    const avaliar = () => setRespirar(!preferencia.matches);
    avaliar();
    preferencia.addEventListener('change', avaliar);
    return () => preferencia.removeEventListener('change', avaliar);
  }, []);

  useGSAP(
    () => {
      gsap.registerPlugin(ScrollTrigger);

      // gsap.matchMedia (o ScrollTrigger.matchMedia está depreciado desde a
      // 3.11 e hoje é só um envelope em cima deste). Duas coisas de graça: as
      // amplitudes são REAVALIADAS quando a janela muda de faixa, e o
      // movimento reduzido vira uma CONDIÇÃO, não um if. Com `reduce` ligado
      // nenhuma das duas casa, o callback não roda, e então NENHUM
      // ScrollTrigger nasce e nada é tocado: todo elemento fica no estado
      // final (opacidade 1, translate 0, parallax zero). Se a preferência
      // mudar ao vivo, o GSAP reverte o que existia e reavalia sozinho, que é
      // o mesmo contrato do motion-provider.tsx.
      const faixas = gsap.matchMedia();

      faixas.add(
        {
          desktop: `(prefers-reduced-motion: no-preference) and (min-width: ${LIMIAR_MOBILE + 1}px)`,
          celular: `(prefers-reduced-motion: no-preference) and (max-width: ${LIMIAR_MOBILE}px)`
        },
        (contexto) => {
          const amplitude = contexto.conditions?.desktop
            ? AMPLITUDE.desktop
            : AMPLITUDE.celular;

          // Devolvida no fim do callback: o gsap.matchMedia chama isso ao
          // reverter (unmount, troca de rota, troca de faixa de janela e
          // movimento reduzido ligado ao vivo).
          let limparRespiracao: (() => void) | null = null;

          /* ------------------------------------------------------------------
             PASSO 2 · CAMADAS DE MANHÃ (o trilho, a espinha)
             Ligado ao progresso da rolagem (scrub), pela passagem da própria
             seção pela tela. "frente" não entra na conta: ela fica parada e é
             a régua contra a qual as outras andam.
          ------------------------------------------------------------------ */
          const blocos = [
            ...document.querySelectorAll<HTMLElement>('[data-camada]')
          ].filter((el) => !temDono(el));

          const trilhos: gsap.core.Tween[] = [];

          for (const el of blocos) {
            const camada = el.getAttribute('data-camada');
            if (camada !== 'fundo' && camada !== 'meio') continue;
            if (jaAnimaSozinho(el)) continue;

            const percurso = amplitude[camada];
            const secao = el.closest('[data-bloco]') ?? el.parentElement;
            if (!secao) continue;

            trilhos.push(gsap.fromTo(
              el,
              {y: -percurso / 2},
              {
                y: percurso / 2,
                ease: 'none',
                scrollTrigger: {
                  trigger: secao,
                  start: 'top bottom', // o topo da seção entra por baixo
                  end: 'bottom top', // a base sai por cima
                  scrub: true
                }
              }
            ));
          }

          // ENERGIA BAIXA (lib/energia.ts): com o iPhone no Modo de Pouca Energia o
          // JavaScript só ganha ~30 quadros por segundo, e o parallax, que é escrito
          // por quadro, anda aos degraus contra a rolagem. Nesse caso ele sai e as
          // camadas voltam ao meio do percurso, que é a composição aprovada. A cota,
          // as entradas e a respiração ficam: é peso que se corta, não a vida.
          const desistirDaEnergia = aoMedirEnergia((baixa) => {
            if (!baixa) return;
            for (const trilho of trilhos) {
              const alvos = trilho.targets();
              trilho.scrollTrigger?.kill();
              trilho.kill();
              gsap.set(alvos, {clearProps: 'transform'});
            }
          });

          /* ------------------------------------------------------------------
             A RESPIRAÇÃO DO PAPEL (caligrafia 3)
             UM ScrollTrigger só para o site inteiro, de propósito. Duas seções
             podem pedir a MESMA cor (as portas e a venda pedem Céu), e um par
             de tweens por seção na mesma camada brigaria pela opacidade: num
             refresh do ScrollTrigger vale quem renderizar por último, e a cor
             saltaria. Aqui a opacidade de cada camada é CALCULADA a cada
             atualização, como o máximo da contribuição de cada seção. Nunca há
             dois donos.

             As posições são medidas no refresh e guardadas: durante a rolagem
             só se lê window.scrollY, sem tocar no layout.
          ------------------------------------------------------------------ */
          const camadas: Record<CorDeFundo, HTMLElement | null> = {
            ceu: camadaCeu.current,
            tinta: camadaTinta.current
          };
          const participantes = [
            ...document.querySelectorAll<HTMLElement>('[data-fundo]')
          ].filter((el) => camadas[el.getAttribute('data-fundo') as CorDeFundo]);

          if (participantes.length && camadas.ceu && camadas.tinta) {
            const raiz = document.documentElement;
            raiz.setAttribute('data-respiracao', 'ativa');

            const escrever: Record<CorDeFundo, (v: number) => void> = {
              ceu: gsap.quickSetter(camadas.ceu, 'opacity') as (v: number) => void,
              tinta: gsap.quickSetter(camadas.tinta, 'opacity') as (v: number) => void
            };

            type Faixa = {
              cor: CorDeFundo;
              entraDe: number;
              entraAte: number;
              saiDe: number;
              saiAte: number;
            };
            let faixas: Faixa[] = [];

            // A faixa de troca é centrada na FRONTEIRA: metade antes do corte,
            // metade depois. É isso que faz a cor atravessar a emenda.
            const medir = () => {
              const meia = (window.innerHeight * RESPIRACAO_FAIXA) / 2;
              faixas = participantes.map((el) => {
                const r = el.getBoundingClientRect();
                const topo = r.top + window.scrollY;
                const base = topo + r.height;
                return {
                  cor: el.getAttribute('data-fundo') as CorDeFundo,
                  entraDe: topo - meia,
                  entraAte: topo + meia,
                  saiDe: base - meia,
                  saiAte: base + meia
                };
              });
            };

            const rampa = (v: number, de: number, ate: number) =>
              ate === de ? (v >= ate ? 1 : 0) : Math.min(1, Math.max(0, (v - de) / (ate - de)));

            // A linha de leitura é o meio da janela: é onde o olho está.
            const pintar = () => {
              const linha = window.scrollY + window.innerHeight / 2;
              let ceu = 0;
              let tinta = 0;
              for (const f of faixas) {
                const valor =
                  rampa(linha, f.entraDe, f.entraAte) * (1 - rampa(linha, f.saiDe, f.saiAte));
                if (f.cor === 'ceu') ceu = Math.max(ceu, valor);
                else tinta = Math.max(tinta, valor);
              }
              escrever.ceu(ceu);
              escrever.tinta(tinta);
            };

            ScrollTrigger.create({
              trigger: raiz,
              start: 'top top',
              end: 'bottom bottom',
              onRefresh: () => {
                medir();
                pintar();
              },
              onUpdate: pintar
            });

            medir();
            pintar();

            // Sai junto com o resto da câmera: no unmount, na troca de rota e
            // quando o movimento reduzido é ligado ao vivo.
            limparRespiracao = () => raiz.removeAttribute('data-respiracao');
          }

          /* ------------------------------------------------------------------
             A COTA QUE SE TRAÇA (caligrafia 1)
             A caneta do consultor desenhando o dossiê: toda linha de documento
             nasce traçada conforme o leitor rola. Trilho curto, começando
             quando a cota entra na tela por baixo.

             O gatilho é a PRÓPRIA cota, e não a seção: uma cota de card
             precisa traçar quando AQUELE card chega, não quando a seção
             inteira entra. `end` é função para o percurso ser remedido a cada
             refresh do ScrollTrigger, e não congelar a altura de janela que
             existia na montagem.
          ------------------------------------------------------------------ */
          const cotas = [...document.querySelectorAll<HTMLElement>('[data-cota]')].filter(
            (el) => !temDono(el) && !jaAnimaSozinho(el)
          );

          for (const cota of cotas) {
            gsap.fromTo(
              cota,
              {'--cota-traco': 0},
              {
                '--cota-traco': 1,
                ease: 'none',
                scrollTrigger: {
                  trigger: cota,
                  start: 'top bottom',
                  end: () => '+=' + window.innerHeight * COTA_PERCURSO,
                  scrub: true
                }
              }
            );
          }

          /* ------------------------------------------------------------------
             PASSO 3 · AS ENTRADAS (o gatilho, e ele é secundário)
             Nasce JUNTO com o trilho, nunca depois: entrada sem trilho é o que
             faz um site parecer slideshow de blocos.

             O grupo de entrada é o que a marcação já declarou: cada bloco de
             camada que sobrou e, nas seções que não declararam camada nenhuma,
             a `.conteudo`, que é a calha de conteúdo do projeto. Quem anima
             são os FILHOS do grupo, nunca o grupo: o grupo é quem carrega o
             trilho, e um elemento só pode ter um dono.
          ------------------------------------------------------------------ */
          const grupos: Element[] = [];

          for (const el of blocos) {
            // "fundo" fica de fora: é céu, textura, palavra-fantasma. Fundo não
            // entra em cena, ele já estava lá. O que ele tem é o trilho.
            if (el.getAttribute('data-camada') === 'fundo') continue;
            grupos.push(el);
          }

          for (const secao of document.querySelectorAll('[data-bloco]')) {
            if (temDono(secao)) continue;
            if (secao.querySelector('[data-camada]')) continue;
            const calha = secao.querySelector(':scope > .conteudo');
            if (calha) grupos.push(calha);
          }

          for (const grupo of grupos) {
            // O grupo já entra por conta própria (o palco das portas faz isso
            // em CSS, com a classe .esta-visivel). Animar os filhos dele seria
            // um fade dentro de outro fade: a mesma leitura, duas vezes.
            if (jaAnimaSozinho(grupo)) continue;

            const camada = grupo.getAttribute('data-camada');
            const carregaTrilho = camada === 'fundo' || camada === 'meio';
            let alvos = [...grupo.children].filter(filhoPodeEntrar);

            // O bloco que É o próprio conteúdo: o <p> do manifesto, o <h1> de
            // uma página interna, um <h2> solto. Não tem filho de elemento
            // nenhum, então ou ele entra, ou aquele texto fica de fora da
            // câmera. Só vale para quem não carrega trilho: em "fundo" e
            // "meio" o elemento já é do parallax, e um elemento tem UM dono.
            if (!alvos.length && !carregaTrilho && estaLivre(grupo)) {
              alvos = [grupo];
            }
            if (!alvos.length) continue;

            gsap.from(alvos, {
              opacity: 0,
              y: amplitude.entrada,
              duration: ENTRADA_DURACAO,
              ease: 'power2.out',
              stagger: ENTRADA_STAGGER,
              scrollTrigger: {
                trigger: grupo,
                start: ENTRADA_INICIO,
                once: true
              }
            });
          }

          /* ------------------------------------------------------------------
             O BLOG (Second Opinion): o módulo dele, no MESMO matchMedia, então
             nasce e morre junto com o resto da câmera. Só age onde a marcação
             do blog existe (capas com data-owner="notas", frase marcada, conta).
          ------------------------------------------------------------------ */
          const limparNotas = moverNotas({desktop: Boolean(contexto.conditions?.desktop)});

          return () => {
            desistirDaEnergia();
            limparNotas();
            limparRespiracao?.();
          };
        }
      );
    },
    {dependencies: [caminho, respirar], revertOnUpdate: true}
  );

  // As três camadas da respiração. Ficam fixas e atrás de tudo (.respiracao no
  // globals.css). Nada aqui é lido por leitor de tela nem recebe ponteiro.
  if (!respirar) return null;

  return (
    <div className="respiracao" aria-hidden="true">
      <span className="respiracao-papel" />
      <span ref={camadaCeu} className="respiracao-ceu" />
      <span ref={camadaTinta} className="respiracao-tinta" />
    </div>
  );
}
