'use client';

import {Fragment, useEffect, useLayoutEffect, useRef} from 'react';
import {useTranslations} from 'next-intl';
import type {Locale} from '@/i18n/routing';
import {linkWhatsApp} from '@/lib/links';

// Bloco 1 do roteiro.md, em DOIS ATOS (design.md, mapa de seções; PICO 1 do
// movimento.md). Estrutura, medidas e tempos vêm do mock-hero.html aprovado
// pelo diretor em 30/08.
//
// ATO 1, na chegada: o nome LUIS / ALVES em escala de monumento com o retrato
// numa pílula cravada no meio das letras, a linha de identificação e a dica de
// rolagem. A PASSAGEM, ligada à rolagem: o nome se dissolve subindo, o retrato
// viaja para a posição do ato 2 e a headline se revela linha a linha por
// máscara. ATO 2: a hero funcional completa, e a rolagem segue normal.
//
// POSSE: data-owner="autoral". A passagem tem DOIS MOTORES e UMA conta só, a
// função estado(p):
//   . no computador, scroll listener + rAF escrevendo o estado a cada quadro;
//   . no TOQUE (25/09/2026), animação de CSS ligada à rolagem
//     (animation-timeline: scroll()), com os quadros-chave AMOSTRADOS do mesmo
//     estado(p) e reescritos só quando a medição muda. Motivo medido no iPhone
//     do Gabriel: no Safari do iOS a rolagem roda no compositor e o JavaScript
//     chega atrasado, então tudo que o JS escreve em função da rolagem anda aos
//     degraus. Desde o Safari 26.4 a animação ligada à rolagem roda no
//     compositor, fora da thread principal. Só transform e opacity nesse motor:
//     a abertura da cápsula, que era recorte animado, vira troca de opacidade
//     entre a cápsula (recorte PARADO) e as cópias inteiras do card, do véu e
//     da figura (.hero2-inteiro).
//   ?passagem=js e ?passagem=css forçam um motor, para comparar no aparelho.
//
// TRAVAS desta seção: nenhuma camada entre o vídeo e o olho (sem véu, sem
// gradiente, sem filtro, sem blend); só transform, opacity, filter e
// CLIP-PATH; a rolagem nunca é sequestrada.
//
// O `clip-path` entrou na lista no prompt 2.34, e entrou MEDIDO, não no
// escuro. Ele não dispara layout (não é da família de width, height, top,
// left), mas dispara PAINT, e a área repintada é a caixa do conjunto, que no
// desktop mede 259x418 CSS px, ou seja 0,9% da tela em 1510x774.
// MEDIDO: o trabalho SÍNCRONO de estilo e layout por passo da passagem ficou
// em 0,1ms de mediana antes e 0,1ms depois (121 passos, mesma janela, mesmo
// build de produção). O custo de quadro do compositor NÃO foi medido, e isso
// está relatado: o navegador deste ambiente roda com a janela não composta e
// estrangula o rAF em 1 quadro por segundo, então "quadro perdido" não é
// observável aqui. Medir isso é tarefa de uma sessão com janela real.

const LIMIAR_MOBILE = 820; // troca variante de mídia E composição
const LIMIAR_CELULAR = 519; // regime 1 de contraste (texto branco na base)

const VIDEO_DESKTOP = '/video/hero-manha-loop.mp4';
const VIDEO_MOBILE = '/video/hero-manha-loop-mobile.mp4';
const POSTER_DESKTOP = '/video/hero-manha-poster.webp';
const POSTER_MOBILE = '/video/hero-manha-poster-mobile.webp';
// TODO: o recorte do Luís saiu da única foto existente (1080px). Quando chegar
// a versão em alta, basta substituir os dois .webp de mesmo nome em
// public/fotos/ (luis-recorte.webp e luis-recorte-mobile.webp). Nada de código
// muda. Registrado em pendencias-luis-alves.md.
const RETRATO_DESKTOP = '/fotos/luis-recorte.webp';
const RETRATO_MOBILE = '/fotos/luis-recorte-mobile.webp';

// Reserva de altura da navbar sobreposta para o BLOCO DE TEXTO do desktop (a
// barra tem 64,8px medidos; a reserva inclui o respiro). A reserva do celular
// deixou de existir: quem sobe até a barra agora é a cabeça, e a régua dela é
// a mesma dos dois lados (ver TOPO_CABECA_MIN).
const NAV_RESERVA_DESKTOP = 86;

// Margem entre a base do bloco e a borda de baixo, no regime celular.
const RODAPE_FONE_BAIXO = 16; // telas com menos de 800px de altura
const RODAPE_FONE = 40;

// Altura real da barra (medida: 64,8px em todas as larguras) mais a folga de
// 24px que o briefing exige entre ela e o TOPO DA CABEÇA. É esta a âncora do
// conjunto: a cabeça atravessa a borda do painel e sobe, então quem pode
// encostar na nav não é mais o topo da foto, é o cabelo dele.
const NAV_ALTURA = 65;
const FOLGA_CABECA = 24;
const TOPO_CABECA_MIN = NAV_ALTURA + FOLGA_CABECA;
// Folga da BASE do painel: até a base do herói no desktop, até o topo do bloco
// de texto no celular (briefing 2.27, itens 2.3 e Parte 5).
const FOLGA_BASE_DESKTOP = 24;
const FOLGA_BASE_MOBILE = 16;
// Os MÍNIMOS dos dois respiros do celular, e a ordem em que eles cedem quando
// o conjunto não cabe (folha de cotas 2.29): primeiro o respiro do topo, só
// depois o respiro entre o card e o texto.
const FOLGA_CABECA_MIN = 12;
const FOLGA_BASE_MOBILE_MIN = 12;
// Folga horizontal entre o fim do texto e a esquerda do painel, no desktop.
const FOLGA_TEXTO_PAINEL = 48;
// Respiro entre a direita do painel e a borda da tela, quando a folga acima
// obriga o painel a andar mais para a direita do que os 15,6vw do desenho.
const MARGEM_DIREITA = 24;
// Opacidade do halo no ato 2. Subiu de 0,55 para 0,85 na folha de cotas 2.29:
// é o halo que descola o card do céu, e a 0,55 o card sumia na tela.
const HALO_OPACIDADE = 0.85;
// Opacidade do painel no ato 1. Ela VIAJA até 1 no ato 2 (briefing 3.1): no
// ato 1 o painel fica cravado entre LUIS e ALVES, e opaco ele lê como caixa
// branca por cima das letras.
const PAINEL_OPACIDADE_ATO1 = 0.55;

const TETO_BLOCO = 0.7; // o bloco do ato 2 nunca cruza 70% da altura da tela
// Trava do último recurso no tablet. Era 0,86, com a nota de que abaixo disso
// começava a faixa de mistura do quadro. MEDIDO quando o recurso passou a
// engatar sempre no tablet: com a base em 86% a linha de cidades (Grafite,
// 10px) fica em 4,50:1 na primeira linha e 4,13:1 na segunda, ou seja já
// REPROVA em AA. Em 78%, que é o número que a própria nota certificava, ela
// volta a passar. A trava é do TEXTO, não do quadro.
const TETO_TABLET_MAXIMO = 0.78;

// A viagem horizontal do desktop: o conjunto sai do meio do nome e vai para a
// direita da headline. Espelha o `15.6vw` do <style> embutido e o da regra de
// movimento reduzido. É um PISO: onde o texto chega perto demais do painel, a
// medição empurra o conjunto mais para a direita (ver FOLGA_TEXTO_PAINEL).
// Era 0,18 até o 2.29. A folha 2.30 tirou 2,4vw porque o conjunto lia como
// ilha encostada na direita: 36px de aproximação em 1510, escrito em fração da
// tela para acompanhar a janela em vez de virar número fixo.
const VIAGEM_X_DESKTOP = 0.156;

// ATO 1, prompt 2.34. O TAMANHO DO ATO 1 É UMA RAZÃO, NÃO UM PIXEL:
//
//   altura da cápsula / altura do bloco LUIS / ALVES = 0,60 desktop
//                                                      0,62 celular
//
// São os números do prompt 2.11, que foi quem definiu a pílula, conferidos
// contra o print do cliente. A altura da cápsula É a altura da figura em
// escala, porque a cápsula é o conjunto inteiro com as pontas arredondadas.
// A regra anterior (largura do retrato x 1,28, teto de 20% da largura do nome)
// SAIU: era um número absoluto herdado de duas folhas atrás, e número absoluto
// herdado envelhece mal. Trava relativa sobrevive a qualquer tela e a qualquer
// mudança do nome.
const CAPSULA_SOBRE_NOME_DESKTOP = 0.6;
const CAPSULA_SOBRE_NOME_MOBILE = 0.62;
// Proporção da cápsula, largura sobre altura. Espelha
// --vitrine-capsula-proporcao no globals.css: os dois precisam bater, senão a
// medição calcula um recorte e o CSS pinta outro.
const CAPSULA_PROPORCAO = 0.585;
// Onde o recorte do CARD começa no ato 1. Não é folga estética: são os 2px da
// borda do painel mais o fio interno (inset 4px, espessura 1px). Sem comer
// esses 5px, a borda superior do card vira um traço branco atravessando a
// cápsula na altura do colarinho. Medido em tela, 1510x774.
const CARD_TOPO_ATO1 = 5;
// A figura nasce 5% da própria altura mais abaixo e sobe até zero, para ela
// NASCER subindo em vez de só ser desmascarada (prompt 2.34, item 3.3).
const FIGURA_DESCE_ATO1 = 0.05;

// A FOLHA DE COTAS 2.29 inteira mora nestas seis constantes.
//
// A razão que fecha o mecanismo: dado o lado S, a figura é S / 0,62, o
// transbordo da cabeça é a diferença (38% da figura), e a largura da figura
// sai sozinha da proporção do arquivo (858 x 1000, ou seja 0,858 x F). Nada
// aqui cresce a figura para "resolver" falta de espaço; quando falta espaço
// quem diminui é o S.
// Espelha o 0.62 do --vitrine-figura-altura no globals.css: os dois precisam
// bater, senão a medição calcula uma altura e o CSS pinta outra.
const CARD_SOBRE_FIGURA = 0.62;
const FIGURA_SOBRE_LADO = 1 / CARD_SOBRE_FIGURA;

// DESKTOP: tudo sai de UMA medida, a altura do herói. F = 0,54 x altura, e
// como S = 0,62 x F, o lado do card é 0,3348 x altura do herói. Espelha o
// 33.48svh do --vitrine-lado no globals.css.
const FIGURA_SOBRE_HEROI = 0.54;
const LADO_SOBRE_HEROI = FIGURA_SOBRE_HEROI * CARD_SOBRE_FIGURA;
const LADO_TETO_DESKTOP = 310;
const LADO_PISO_DESKTOP = 190;

// CELULAR E TABLET: o card fica empilhado sobre o texto, então quem manda é a
// LARGURA da janela. Em 390px isso dá S 190 e F 306, o mock aprovado.
// window.innerWidth e não a largura do palco, porque é a régua que a folha
// declara (e é a mesma coisa em aparelho de verdade, onde a barra de rolagem
// é sobreposta).
const LADO_SOBRE_LARGURA_MOBILE = 0.487;
const LADO_TETO_MOBILE = 200;
const LADO_PISO_MOBILE = 140;

// Estado escondido da linha na máscara. 112% e não 104%: a máscara tem 0.1em
// a mais embaixo para caber o descendente do "g" (ver .hero2-linha no CSS).
const ESCONDIDO = 112;

// Âncora do ato 1: espelha --hero-topo-palco no globals.css.
const TOPO_PALCO = 0.41;
// Origem da viagem vertical no celular. Era 47%, seis pontos abaixo dos 41%
// da âncora, e esses seis pontos existiam para EMPURRAR o retrato flutuante
// para junto da navbar: sem eles ele boiava no meio da tela.
// Voltou para 41% porque o mecanismo mudou de mãos. Quem sobe até a navbar
// agora é a CABEÇA, que sai por cima do painel por construção, e os 6% viraram
// um vão morto de 50px em 844 entre a base do painel e o texto. Vão morto é
// altura, e altura é exatamente o recurso que faltava para a vitrine: com os
// 6% de volta ao lugar, o painel do ato 2 em 390x844 passou de 114px para
// 133px de largura, e a folga da cabeça saiu de 9,4px para os 24px do
// briefing. Com 41% aqui o desloca vira zero e o centro do painel no ato 2 é
// exatamente o centroY medido.
const ORIGEM_VIAGEM_MOBILE = 0.41;

// A TROCA DO MOTOR DE CSS: a cápsula (recorte parado) cede para o card, o véu e a
// figura inteiros nesta faixa do progresso, enquanto o conjunto ainda cresce. A
// figura contida só sai DEPOIS de a inteira estar opaca por baixo dela: se as duas
// trocassem juntas, o corpo dele ficaria translúcido no meio da passagem.
const TROCA_INICIO = 0.1;
const TROCA_FIM = 0.5;
const FIGURA_CONTIDA_FIM = 0.62;
// Quadros-chave por trilho no motor de CSS: um a cada 2,5% da passagem, ligados
// em linha reta. As curvas suaves do estado(p) ficam desenhadas por eles.
const PASSOS_DA_PASSAGEM = 40;

type ConexaoDeRede = {saveData?: boolean; effectiveType?: string};

function trava(valor: number, minimo: number, maximo: number) {
  return Math.min(maximo, Math.max(minimo, valor));
}

// Progresso normalizado dentro de uma faixa da passagem.
function faixa(p: number, inicio: number, fim: number) {
  return trava((p - inicio) / (fim - inicio), 0, 1);
}

// Ease cubic in-out, o mesmo do mock.
function suave(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// useLayoutEffect no cliente e useEffect no servidor: a medição precisa
// acontecer ANTES da pintura, senão o retrato pisca na posição errada no
// celular; no SSR o hook simplesmente não roda.
const useEfeitoDeLayout = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

// Reparte um texto do roteiro nos separadores "·" para pintá-los com a cor da
// linha. A copy continua verbatim: só a apresentação muda.
// Cada trecho entre os "·" é INDIVISÍVEL (`.hero2-trecho`): a linha só quebra nos
// separadores. Com a identificação a 12px no celular (24/09/2026) ela passou a ter duas
// linhas, e a quebra caía no meio de "Stonehaus Realty Corp."; nas cidades, no meio de
// "White Rock". O "·" vai colado no FIM do trecho (espaço inflexível), para a linha
// seguinte nunca abrir com ele. O espaço normal fica FORA do trecho: é onde se quebra.
function comSeparadores(texto: string) {
  const partes = texto.split('·');
  return partes.map((parte, indice) => (
    <Fragment key={indice}>
      <span className="hero2-trecho">
        {parte.trim()}
        {indice < partes.length - 1 ? (
          <>
            {' '}
            <span className="hero2-sep" aria-hidden="true">
              ·
            </span>
          </>
        ) : null}
      </span>
      {indice < partes.length - 1 ? ' ' : null}
    </Fragment>
  ));
}

export function HeroDoisAtos({locale}: {locale: Locale}) {
  const t = useTranslations('hero');
  const secaoRef = useRef<HTMLElement>(null);
  const palcoRef = useRef<HTMLDivElement>(null);

  useEfeitoDeLayout(() => {
    const encontrado = secaoRef.current;
    if (!encontrado) return;
    // tipo já estreitado: as funções declaradas abaixo dependem disso
    const secao: HTMLElement = encontrado;

    const busca = <T extends HTMLElement>(seletor: string) =>
      secao.querySelector<T>(seletor)!;

    const nome = busca('.hero2-nome');
    // A caixa da vitrine É a caixa do painel: offsetHeight dela dá a altura do
    // painel, e a da figura dá a altura do conjunto visível (a base das duas
    // coincide, então a figura é tudo que existe acima da base do painel).
    // offsetHeight ignora transform, então as duas medidas são as de layout.
    const vitrine = busca('.hero2-vitrine');
    // As peças da CÁPSULA. As cópias .hero2-inteiro existem só para o motor de
    // CSS e nunca são tocadas pelo JS.
    const involucro = busca('.hero2-figura:not(.hero2-inteiro)');
    const figura = busca<HTMLImageElement>('.hero2-figura:not(.hero2-inteiro) img');
    const halo = busca('.hero2-halo');
    const painel = busca('.hero2-painel:not(.hero2-inteiro)');
    // O véu entrou na lista no prompt 2.34: ele é decorativo do card e leva o
    // mesmo recorte, senão vaza para fora da cápsula no ato 1.
    const veu = busca('.hero2-veu:not(.hero2-inteiro)');
    // A régua existe só para resolver --vitrine-ato1-largura em px: o valor do
    // token é um clamp(), e getComputedStyle devolveria a string.
    const regua = busca('.hero2-regua');
    const identificacao = busca('.hero2-identificacao');
    const dica = busca('.hero2-dica');
    const ato2 = busca('.hero2-ato2');
    const video = busca<HTMLVideoElement>('.hero2-video');

    const linhas = [...secao.querySelectorAll<HTMLElement>('.hero2-linha > i')];
    // A ordem da cascata é do mock e NÃO é a ordem do DOM: o apoio entra
    // primeiro e o kicker por último, para o olho pousar na headline.
    const cascata = [
      busca('.hero2-sub'),
      busca('.hero2-botoes'),
      busca('.hero2-cidades'),
      busca('.hero2-kicker')
    ];
    const focaveis = [...ato2.querySelectorAll<HTMLElement>('a[href]')];
    // Estado anterior do ato 2 (clicável ou não): começa indefinido para o primeiro
    // desenho sempre aplicar.
    let ato2Ativo: boolean | null = null;
    // Aparelho de toque: a passagem corta o PESO (desfoque do nome, recorte do halo).
    const toque = window.matchMedia('(hover: none) and (pointer: coarse)').matches;

    // O MOTOR DA PASSAGEM. CSS ligado à rolagem no toque, onde o navegador souber
    // fazer (Safari 26+, Chrome 115+); JS por quadro no resto. O parâmetro da URL
    // força um dos dois, e é assim que se compara no aparelho.
    const suportaTrilhoCss =
      typeof CSS !== 'undefined' &&
      CSS.supports('animation-timeline: scroll()') &&
      CSS.supports('animation-range: 0px 1px');
    const motorPedido = new URLSearchParams(window.location.search).get('passagem');
    const motorCss =
      suportaTrilhoCss && (motorPedido === 'css' || (motorPedido !== 'js' && toque));

    const preferenciaMovimento = window.matchMedia('(prefers-reduced-motion: reduce)');

    // O palco tem height:100svh e overflow:hidden. Ele é quem recorta,
    // então é a altura DELE que posiciona o que vive dentro dele.
    // window.innerHeight NÃO serve: no celular ela cresce e encolhe com a
    // barra do navegador durante a rolagem, dispara resize, e o bloco era
    // remedido no meio do gesto. Era isso que ligava o modo compacto e
    // empurrava a linha de cidades para fora do recorte.
    const alturaPalco = () => palcoRef.current?.clientHeight || window.innerHeight;
    // Mesma história na horizontal: o palco é quem recorta, e ele não conta a
    // barra de rolagem que a window.innerWidth conta.
    const larguraPalco = () => palcoRef.current?.clientWidth || window.innerWidth;

    // Onde o texto do ato 2 REALMENTE termina à direita. A caixa do bloco não
    // serve: ela tem a largura do container (660px no desktop) e não a da
    // linha mais longa, o que dava uma folga imaginária de 14px em 1280.
    // Range mede a linha de verdade.
    function direitaDoTexto() {
      let direita = 0;
      const alcance = document.createRange();
      for (const alvo of [
        busca('.hero2-kicker'),
        busca('.hero2-h1'),
        busca('.hero2-sub'),
        busca('.hero2-cidades')
      ]) {
        alcance.selectNodeContents(alvo);
        for (const caixa of alcance.getClientRects()) {
          direita = Math.max(direita, caixa.right);
        }
      }
      // Os botões são caixas de verdade, então a caixa deles vale.
      return Math.max(direita, busca('.hero2-botoes').getBoundingClientRect().right);
    }

    // Estado da medição. dx e dy vêm da medição porque as duas folgas do
    // aceite (cabeça até a nav, texto até o painel) são medidas, não constantes.
    // compensaY é o deslocamento vertical que existe SÓ no ato 1: ver
    // medida.compensaY na medição.
    const medida = {
      escala: 1,
      centroY: 0,
      dx: 0,
      dy: 0,
      escalaInicio: 1,
      escalaFim: 1,
      compensaY: 0,
      // A GEOMETRIA DO RECORTE (prompt 2.34). Tudo em px do espaço LOCAL da
      // vitrine, ou seja antes do scale: é assim que clip-path resolve.
      lado: 0,
      alturaFigura: 0,
      capsulaLado: 0, // L, a sobra lateral dentro do quadrado
      capsulaRaio: 0, // Rcap, metade da largura da cápsula
      cardRaio: 16, // --vitrine-raio resolvido em px
      haloDesvio: 0, // 14% do lado: a caixa do halo nasce fora do card
      involucroTopo: 0,
      involucroLado: 0
    };

    // A ALTURA RENDERIZADA do bloco do nome, que é a régua do ato 1 desde o
    // prompt 2.34. Aqui a caixa do <h2> SERVE, e é ela que o prompt chama de
    // "bloco": inset-inline 0 estica a caixa na horizontal, mas na vertical
    // ela é exatamente as duas linhas (2 x font-size x line-height).
    // O scale que a passagem aplica ao nome sai da conta, senão uma remedição
    // no meio do caminho leria o nome até 6% menor e encolheria a cápsula sem
    // motivo. Devolve 0 quando o nome não existe (movimento reduzido esconde
    // o bloco com display:none), e quem chama trata esse caso.
    function alturaDoNome() {
      const escalaDoNome =
        new DOMMatrixReadOnly(getComputedStyle(nome).transform).a || 1;
      return nome.getBoundingClientRect().height / escalaDoNome;
    }

    // A base da ÚLTIMA LINHA da lista de cidades, em coordenada do palco. É
    // com ela que a base do card alinha no ato 2 (folha 2.30).
    // Range e não a caixa do <p>: a lista quebra em duas linhas e a caixa
    // devolveria a base do parágrafo, que fica abaixo da linha por causa da
    // entrelinha. O translateY da cascata sai da conta, porque a medição quer
    // a posição de LAYOUT, e o topo do palco converte de tela para palco.
    function baseDasCidades() {
      const cidades = busca('.hero2-cidades');
      const alcance = document.createRange();
      alcance.selectNodeContents(cidades);
      const caixas = [...alcance.getClientRects()];
      const fundo = caixas.length
        ? caixas.reduce((maior, caixa) => (caixa.bottom > maior.bottom ? caixa : maior))
            .bottom
        : cidades.getBoundingClientRect().bottom;
      const desvioDaCascata =
        new DOMMatrixReadOnly(getComputedStyle(cidades).transform).f;
      const topoDoPalco = palcoRef.current?.getBoundingClientRect().top ?? 0;
      return fundo - desvioDaCascata - topoDoPalco;
    }

    // ---- MEDIÇÃO (o mobile é calculado, nunca chutado) -------------------
    function medir() {
      const alturaViewport = alturaPalco();
      const mobile = window.innerWidth <= LIMIAR_MOBILE;
      ato2.dataset.compacto = 'nao';

      // A ALTURA DO NOME PUBLICADA PARA O CSS, que é o terceiro braço do
      // --hero-identificacao (ver o comentário dele no globals.css). Sem ela a
      // linha de identificação some POR BAIXO do nome em notebook largo e
      // baixo, porque a altura do nome vem da LARGURA da janela e a posição da
      // linha vinha da ALTURA. Publicar a medida faz as duas usarem a mesma
      // régua, em vez de um breakpoint que só conserta as telas lembradas.
      //
      // NO :root, E NÃO NO ELEMENTO DA VITRINE COMO O --vitrine-lado. Isto não
      // é preferência, é como o CSS funciona, e foi MEDIDO no navegador em
      // 04/09: `var()` dentro de uma custom property é substituído no elemento
      // onde a PROPRIEDADE FOI DECLARADA, não onde ela é consumida. Como
      // --hero-identificacao é declarada no :root, escrever a parcela num
      // descendente não muda nada (medido: o valor ficou nos 100px do fallback
      // escrevendo na vitrine E no próprio consumidor, e só mudou escrevendo
      // no :root).
      //
      // Sem laço de layout: a altura do nome é 2 x font-size x line-height, e
      // o font-size é clamp(78px, 14.6vw, 218px), que só depende da LARGURA da
      // janela. Mover a identificação e o SCROLL, que é tudo o que esta escrita
      // provoca, não pode mudá-la de volta.
      document.documentElement.style.setProperty(
        '--hero-nome-altura',
        `${alturaDoNome()}px`
      );

      // O LADO QUE A FOLHA DE COTAS 2.29 MANDA. É o teto: o que vem depois só
      // sabe reduzir. Uma medida manda em cada regime, e é aqui que a folha
      // vira número: no desktop a ALTURA DO HERÓI (S = 0,3348 x altura), no
      // celular e no tablet a LARGURA DA JANELA (S = 0,487 x largura).
      // Não se lê mais o --vitrine-lado do CSS: o clamp lá é o espelho desta
      // conta para a primeira pintura e para o noscript, e ler os dois só
      // criaria duas fontes de verdade para o mesmo número.
      const ladoAlvo = mobile
        ? trava(
            window.innerWidth * LADO_SOBRE_LARGURA_MOBILE,
            LADO_PISO_MOBILE,
            LADO_TETO_MOBILE
          )
        : trava(
            alturaViewport * LADO_SOBRE_HEROI,
            LADO_PISO_DESKTOP,
            LADO_TETO_DESKTOP
          );

      // Aplica um lado e devolve a geometria que ele produz. Escrever o token
      // e reler o layout é o que garante que o número da medição e o número
      // que o CSS pinta são o mesmo, inclusive borda, raio e rampa do véu, que
      // continuam em px de verdade em vez de encolherem dentro de um scale().
      const aplicarLado = (valor: number) => {
        vitrine.style.setProperty('--vitrine-lado', `${valor}px`);
        // O lado devolvido é o valor ESCRITO, não o offsetHeight: o layout
        // renderiza em subpixel e o offsetHeight arredonda para inteiro. Em
        // 320x568 esse arredondamento sozinho já punha 0,31px de erro na
        // trava principal.
        const lado = valor;
        // Da base do painel até o topo do cabelo. Lido do layout, somando os
        // dois deslocamentos que existem entre o painel e a figura (o recuo do
        // invólucro e o pendurar da imagem dentro dele): mexer em qualquer um
        // dos dois no CSS não pode desalinhar a âncora da nav.
        const visivel = lado - (involucro.offsetTop + figura.offsetTop);
        // A GEOMETRIA DO RECORTE nasce aqui, porque é aqui que o layout acabou
        // de ser reescrito com este lado. O invólucro é LIDO (offsetTop e
        // offsetLeft) em vez de ter os 2px e os 40px do CSS repetidos: mexer
        // no CSS não pode desalinhar a cápsula.
        medida.lado = lado;
        medida.alturaFigura = lado * FIGURA_SOBRE_LADO;
        const capsulaLargura = medida.alturaFigura * CAPSULA_PROPORCAO;
        medida.capsulaLado = (lado - capsulaLargura) / 2;
        medida.capsulaRaio = capsulaLargura / 2;
        medida.haloDesvio = lado * 0.14;
        medida.involucroTopo = involucro.offsetTop;
        medida.involucroLado = involucro.offsetLeft;
        medida.cardRaio =
          parseFloat(
            getComputedStyle(vitrine).getPropertyValue('--vitrine-raio')
          ) || 16;
        return {lado, visivel};
      };

      // O RECUO que sobra entre a base da figura e a base do card. Medido, não
      // escrito: hoje dá ZERO, porque a figura pendura 2px por baixo do
      // invólucro exatamente para fechar a identidade "fora + S = F" da folha.
      // Se um dia voltar a existir, as duas contas abaixo já o carregam.
      const sonda = aplicarLado(ladoAlvo);
      const recuo = sonda.visivel - ladoAlvo * FIGURA_SOBRE_LADO;
      // O que o conjunto OCUPA (da base do card até o topo do cabelo) dado um
      // lado, e o inverso: o maior lado que cabe num espaço.
      const conjuntoDe = (lado: number) => lado * FIGURA_SOBRE_LADO + recuo;
      const ladoQueCabeEm = (espaco: number) =>
        Math.max(0, (espaco - recuo) * CARD_SOBRE_FIGURA);

      // A ESCALA DO ATO 1 É DERIVADA (prompt 2.34, item 2.3), e não mais um
      // número cravado: mede-se a ALTURA RENDERIZADA do bloco do nome e
      // resolve-se a escala que põe a cápsula na razão do item 2.2. Como a
      // cápsula ocupa a altura INTEIRA da figura, altura-da-cápsula é
      // F x escala, e a escala sai por uma divisão só.
      // FALLBACK: quando o nome não tem altura (movimento reduzido o esconde
      // com display:none), volta a valer a régua do desenho, que é o número
      // que o CSS já pinta. Nesse caminho a escala nunca chega a ser usada,
      // porque o estado final é o ato 2, mas ela não pode virar NaN.
      const razaoCapsula = mobile
        ? CAPSULA_SOBRE_NOME_MOBILE
        : CAPSULA_SOBRE_NOME_DESKTOP;
      const escalaDeChegada = (lado: number) => {
        if (lado <= 0) return 1;
        const alturaNome = alturaDoNome();
        const figuraDoLado = lado * FIGURA_SOBRE_LADO;
        if (alturaNome <= 0 || figuraDoLado <= 0) {
          return regua.getBoundingClientRect().width / lado;
        }
        return (razaoCapsula * alturaNome) / figuraDoLado;
      };
      // A escala SEM crescimento. Ela deixou de ser o tamanho do ato 1 e
      // continua sendo só a ÂNCORA da compensação vertical abaixo, que é o
      // que mantém a cápsula cravada onde o cliente a aprovou, no meio das
      // letras (item 2.4: não recentralizar o conjunto). Por isso a régua
      // continua existindo, e --vitrine-ato1-largura com ela (o
      // --hero-identificacao também depende desse token).
      const escalaDe229 = (lado: number) =>
        lado > 0 ? regua.getBoundingClientRect().width / lado : 1;

      // O CONJUNTO CRESCE EM TORNO DO PRÓPRIO CENTRO (folha 2.30, item 1.2).
      // O scale do CSS cresce em torno do centro do CARD, e o conjunto tem a
      // cabeça saindo por cima dele: crescer sozinho subiria o centro do
      // conjunto em (Δescala x transbordo / 2). Esta é a devolução disso, e
      // ela existe SÓ no ato 1: a viagem a leva a zero, então o ato 2 fica
      // exatamente onde a medição o pôs.
      // O transbordo entra por conjuntoDe(), não pelo `visivel` medido: aquele
      // vem de offsetTop, que arredonda para inteiro, e o arredondamento
      // aparecia como 0,2px de movimento do centro no aceite.
      const compensacaoDoCrescimento = (lado: number) =>
        ((escalaDeChegada(lado) - escalaDe229(lado)) * (conjuntoDe(lado) - lado)) / 2;

      // O ato 2 é sempre o tamanho natural do painel: nunca há scale no fim da
      // viagem. Quando falta altura, quem diminui é o LADO.
      medida.escalaFim = 1;

      if (!mobile) {
        ato2.style.bottom = '';
        medida.escala = 1;
        medida.centroY = 0;

        // O bloco de texto primeiro, porque é o centro dele que alinha o
        // conjunto. Centralizado na vertical, sem nunca cruzar os 70% de cima
        // (regime 3 de contraste); se não couber, compacta ANTES de descer
        // para a faixa escura do quadro.
        const limite = alturaViewport * TETO_BLOCO;
        let alturaBloco = ato2.offsetHeight;
        if (NAV_RESERVA_DESKTOP + alturaBloco > limite) {
          ato2.dataset.compacto = 'sim';
          alturaBloco = ato2.offsetHeight;
        }
        let topo = Math.max(NAV_RESERVA_DESKTOP, (alturaViewport - alturaBloco) / 2);
        if (topo + alturaBloco > limite) {
          topo = Math.max(NAV_RESERVA_DESKTOP, limite - alturaBloco);
        }
        ato2.style.top = `${topo}px`;
        ato2.style.transform = 'none';

        // TRAVA VERTICAL do desktop, e ela virou rede de segurança: a figura
        // inteira cabe entre a folga da cabeça e a folga da base. Se não
        // couber, o LADO encolhe. Com a folha 2.29 ela não morde em nenhuma
        // das janelas de aceite, porque a figura passou a ser 54% da altura
        // do herói e sempre sobram os 113px das duas folgas.
        const figuraDisponivel = alturaViewport - TOPO_CABECA_MIN - FOLGA_BASE_DESKTOP;
        const {lado, visivel} = aplicarLado(
          Math.min(ladoAlvo, ladoQueCabeEm(figuraDisponivel))
        );

        medida.escalaInicio = escalaDeChegada(lado);
        medida.compensaY = compensacaoDoCrescimento(lado);

        // A BASE DO CARD ALINHA COM A BASE DA ÚLTIMA LINHA DA LISTA DE CIDADES
        // (folha 2.30, item 2). Antes o conjunto e o bloco de texto dividiam a
        // linha de centro, e o resultado lia BAIXO: a massa que o olho vê é o
        // CARD, e a cabeça acima dele pesa menos que a altura que ocupa, então
        // centrar pela altura total afundava o card. Alinhar duas bases é uma
        // regra medida, não um número: se a copy ou o corpo mudarem, ela
        // continua valendo.
        let centro = baseDasCidades() - lado / 2;
        // As duas folgas verticais mandam mais que o alinhamento.
        centro = Math.max(centro, TOPO_CABECA_MIN + visivel - lado / 2);
        centro = Math.min(centro, alturaViewport - FOLGA_BASE_DESKTOP - lado / 2);
        medida.dy = centro - alturaViewport * TOPO_PALCO;

        // FOLGA HORIZONTAL: os 15,6vw do desenho são um PISO. Onde o texto chega
        // perto demais (medido: 0px de folga em 1280 e sobreposição em 1024),
        // o conjunto anda mais para a direita, até o respiro da borda da tela.
        // A régua horizontal é o PALCO, não a janela: window.innerWidth inclui a
        // barra de rolagem clássica, e o palco não. Medido em 1280: 15px de
        // diferença viravam 7,6px de folga a menos, que é justamente o que
        // fazia o aceite de 48px reprovar por pouco.
        const meia = larguraPalco() / 2;
        const minimo = direitaDoTexto() + FOLGA_TEXTO_PAINEL + lado / 2 - meia;
        const maximo = larguraPalco() - MARGEM_DIREITA - lado / 2 - meia;
        // Math.ceil porque a borda do painel cai em subpixel: sem ele a folga
        // media 47,9px em 1280 e reprovava por um décimo.
        medida.dx = Math.ceil(
          Math.min(Math.max(larguraPalco() * VIAGEM_X_DESKTOP, minimo), Math.max(maximo, 0))
        );
        return;
      }

      ato2.style.top = '';
      ato2.style.transform = '';
      medida.dx = 0;

      // Onde a BASE do bloco pousa. No celular ele fica ancorado no rodapé,
      // para a linha de cidades cair sempre na faixa escura do vídeo (branco
      // puro, medido entre 7,8 e 11,7:1). No tablet a base do quadro é faixa
      // de mistura, onde nenhuma cor de texto passa: ali o bloco inteiro fica
      // nos 70% de cima, que são claros.
      const fone = window.innerWidth <= LIMIAR_CELULAR;
      let base = fone
        ? alturaViewport - (alturaViewport < 800 ? RODAPE_FONE_BAIXO : RODAPE_FONE)
        : alturaViewport * TETO_BLOCO;

      // A viagem desloca o conjunto. Hoje dá zero, porque a origem voltou para
      // os 41% da âncora, mas a conta fica explícita para o dia em que alguém
      // mexer nela.
      const desloca = (TOPO_PALCO - ORIGEM_VIAGEM_MOBILE) * alturaViewport;

      // Os DOIS RESPIROS do celular. Eles são o que cede primeiro quando o
      // conjunto não cabe, e nesta ordem (folha de cotas 2.29).
      let respiroTopo = FOLGA_CABECA;
      let folgaTexto = FOLGA_BASE_MOBILE;
      let alturaBloco = ato2.offsetHeight;

      // O espaço que sobra para o CONJUNTO: da base da nav mais o respiro do
      // topo até o topo do bloco de texto menos o respiro de baixo.
      const espacoDoConjunto = () =>
        base - alturaBloco - folgaTexto + desloca - (NAV_ALTURA + respiroTopo);
      const cabe = () => conjuntoDe(ladoAlvo) <= espacoDoConjunto();

      // A ordem de recurso é a da folha: primeiro o respiro do topo, depois o
      // respiro card→texto. Só então os dois recursos que já eram do 2.27.
      if (!cabe()) respiroTopo = FOLGA_CABECA_MIN;
      if (!cabe()) folgaTexto = FOLGA_BASE_MOBILE_MIN;

      // 3º recurso: o bloco de texto compacta. Ele deixou de ter gatilho por
      // fração do lado (o lado agora vem da largura da janela, não da altura
      // que sobra) e passou a ter o gatilho direto: só compacta quando o card
      // da folha não cabe sem isso.
      if (!cabe()) {
        ato2.dataset.compacto = 'sim';
        alturaBloco = ato2.offsetHeight;
      }

      // 4º recurso, SÓ no tablet: a base do bloco desce o necessário, até o
      // teto de contraste. No celular ele não existe, porque lá a base já é o
      // rodapé.
      if (!cabe() && !fone) {
        base = Math.min(
          alturaViewport * TETO_TABLET_MAXIMO,
          NAV_ALTURA + respiroTopo + conjuntoDe(ladoAlvo) + folgaTexto - desloca + alturaBloco
        );
      }

      // ÚLTIMO recurso, e ele é uma EXCEÇÃO DECLARADA à folha: quando nem
      // assim cabe, o lado desce abaixo do piso de 140. A alternativa seria
      // deixar o card entrar por cima do texto, que é tela quebrada. MEDIDO:
      // só acontece em 320x568, onde o piso de 140 pede 91px a mais de altura
      // do que a tela tem. Está relatado no 2.29.
      const valor = cabe() ? ladoAlvo : ladoQueCabeEm(espacoDoConjunto());

      const {lado, visivel} = aplicarLado(valor);
      ato2.style.bottom = `${Math.max(8, alturaViewport - base)}px`;

      medida.escala = 1;
      medida.escalaInicio = escalaDeChegada(lado);
      medida.compensaY = compensacaoDoCrescimento(lado);
      // A ÂNCORA DO CELULAR É O TOPO (folha de cotas 2.29): o topo da cabeça
      // fica o respiro abaixo da base da nav, e a base do card cai em
      // topo + F. Antes a âncora era o texto, e o card era o que sobrava.
      // centroY é o centro NOMINAL do PAINEL: o desenhar() ainda soma o
      // deslocamento da viagem, e é a soma dos dois que põe o painel no lugar
      // medido aqui.
      medida.centroY =
        NAV_ALTURA + respiroTopo + visivel - lado / 2 - desloca;
    }

    // ---- A PASSAGEM ------------------------------------------------------
    // A geometria de uma pintura, lida UMA vez (o motor de CSS amostra o estado
    // 41 vezes seguidas e não precisa reler o palco em cada uma).
    type Geometria = {alturaViewport: number; mobile: boolean};
    const geometria = (): Geometria => ({
      alturaViewport: alturaPalco(),
      mobile: window.innerWidth <= LIMIAR_MOBILE
    });
    // Como um número vira texto: cru no JS (o ato 2 precisa sair idêntico ao de
    // sempre, sem arredondamento), curto nos quadros-chave do CSS.
    type Formato = (valor: number) => string;
    const cru: Formato = (valor) => `${valor}`;
    const curto: Formato = (valor) => `${+valor.toFixed(3)}`;

    // O ESTADO DA PASSAGEM num progresso p. É a ÚNICA conta da passagem: o motor
    // de JS escreve o resultado a cada quadro e o motor de CSS o amostra em
    // quadros-chave. Mexer num tempo ou numa faixa aqui muda os dois.
    function estado(p: number, g: Geometria, f: Formato) {
      // o nome se dissolve subindo
      const saida = suave(faixa(p, 0, 0.36));
      // identificação e dica saem antes de todo o resto
      const saidaCredito = suave(faixa(p, 0, 0.2));

      // a vitrine viaja para a posição do ato 2. Painel, invólucro, figura e
      // véu andam JUNTOS, como um conjunto só: a caixa que escala é a do
      // painel e os outros três vivem dentro dela, então a relação entre eles
      // não muda no meio do caminho. Só transform.
      const viagem = suave(faixa(p, 0.06, 0.78));
      const dx = g.mobile ? 0 : medida.dx * viagem;
      const alvoY = g.mobile
        ? medida.centroY - g.alturaViewport * ORIGEM_VIAGEM_MOBILE
        : medida.dy;
      // A viagem vertical NASCE na compensação do crescimento do ato 1 e morre
      // em zero no ato 2 (folha 2.30, item 1.2), em vez de nascer em zero. É
      // isso que faz o conjunto crescer em torno do próprio centro sem mexer
      // um pixel no lugar onde ele pousa no ato 2.
      const dy = medida.compensaY + (alvoY - medida.compensaY) * viagem;
      const escala =
        medida.escalaInicio + (medida.escalaFim - medida.escalaInicio) * viagem;

      return {
        viagem,
        nomeOpacidade: 1 - saida,
        nomeDesfoque: saida * 16,
        nome: `translateY(-50%) translateY(${f(-saida * 54)}px) scale(${f(1 - saida * 0.06)})`,
        creditoOpacidade: 1 - saidaCredito,
        credito: `translateY(${f(saidaCredito * 18)}px)`,
        vitrine: `translate(-50%, -50%) translate(${f(dx)}px, ${f(dy)}px) scale(${f(escala)})`,
        // A figura NASCE SUBINDO: 5% da própria altura para baixo no ato 1, zero no
        // ato 2. No ato 2 isto é exatamente o translateX(-50%) do CSS.
        figura: `translateX(-50%) translateY(${f(
          (1 - viagem) * medida.alturaFigura * FIGURA_DESCE_ATO1
        )}px)`,
        // O PAINEL fica opaco no MESMO progresso. No ato 1 ele está cravado
        // entre LUIS e ALVES, e opaco lia como caixa branca por cima das letras;
        // a 0,55 o nome se lê ATRAVÉS dele.
        painel: PAINEL_OPACIDADE_ATO1 + (1 - PAINEL_OPACIDADE_ATO1) * viagem,
        // o halo entra por OPACIDADE, girando. Faixa própria e mais tarde que a
        // do conjunto, para ele não acender enquanto o nome ainda está na tela.
        halo: suave(faixa(p, 0.3, 0.86)) * HALO_OPACIDADE,
        // Só o motor de CSS usa: a cápsula cedendo para as cópias inteiras.
        troca: suave(faixa(p, TROCA_INICIO, TROCA_FIM)),
        figuraContida: 1 - faixa(p, TROCA_FIM, FIGURA_CONTIDA_FIM),
        // a headline se revela linha a linha por máscara
        linhas: linhas.map((_, indice) => {
          const q = suave(faixa(p, 0.14 + indice * 0.05, 0.5 + indice * 0.05));
          return {opacidade: q, transform: `translateY(${f((1 - q) * ESCONDIDO)}%)`};
        }),
        // apoio, botões, cidades e kicker entram em cascata
        cascata: cascata.map((_, indice) => {
          const q = suave(faixa(p, 0.38 + indice * 0.045, 0.72 + indice * 0.045));
          return {opacidade: q, transform: `translateY(${f((1 - q) * 16)}px)`};
        })
      };
    }
    type EstadoDaPassagem = ReturnType<typeof estado>;

    // O bloco só fica clicável (e alcançável pelo teclado) quando já está
    // visível: botão invisível recebendo foco é armadilha.
    // Só quando o estado MUDA: regravar o atributo a cada quadro era mutação de DOM por
    // quadro, que obriga o navegador a recalcular estilo no meio da rolagem.
    function ativarAto2(p: number) {
      const ativo = p > 0.7;
      if (ativo === ato2Ativo) return;
      ato2Ativo = ativo;
      ato2.style.pointerEvents = ativo ? 'auto' : 'none';
      for (const alvo of focaveis) {
        if (ativo) alvo.removeAttribute('tabindex');
        else alvo.setAttribute('tabindex', '-1');
      }
    }

    // O MOTOR DE JS: escreve o estado a cada quadro, mais o recorte animado da
    // cápsula, que só existe aqui.
    function desenhar(p: number) {
      const e = estado(p, geometria(), cru);
      const viagem = e.viagem;

      // O DESFOQUE só com ponteiro fino: no toque ele era o quadro mais caro da
      // passagem (25/09/2026, iPhone travando só aqui): um blur de até 16px refeito a
      // cada quadro sobre um nome de ~1170x500 pixels na densidade 3. No celular
      // corta-se PESO, não movimento: o nome sobe, encolhe e some igual.
      nome.style.opacity = `${e.nomeOpacidade}`;
      if (!toque) nome.style.filter = `blur(${e.nomeDesfoque}px)`;
      nome.style.transform = e.nome;

      identificacao.style.opacity = `${e.creditoOpacidade}`;
      identificacao.style.transform = e.credito;
      dica.style.opacity = `${e.creditoOpacidade}`;

      vitrine.style.transform = e.vitrine;

      // ---- A ABERTURA DA CÁPSULA (prompt 2.34) --------------------------
      // A caixa do conjunto NÃO muda de tamanho em nenhum quadro: continua
      // lado x figura. O que muda é o RECORTE dentro dela, e ele é
      // interpolado pelo MESMO progresso da viagem, então a passagem existe
      // em qualquer valor intermediário. Sem crossfade entre elementos, sem
      // troca de nó no meio, sem steps().
      const entre = (de: number, ate: number) => de + (ate - de) * viagem;
      // Chegando no ato 2, o recorte já é um NO-OP geométrico, e aí ele SAI.
      // Não é step nem troca de nó: a forma não muda, some uma camada de
      // recorte que não recorta mais nada. Existe por uma razão medida: com o
      // clip ligado, o anti-aliasing dos cantos arredondados fica ~11/255
      // diferente do anti-aliasing do próprio border-radius, e isso são 862
      // pixels de diferença num ato 2 que precisa ser IDÊNTICO ao de antes
      // deste prompt. Com o clip solto, a comparação fecha byte a byte.
      const noAto2 = viagem >= 1;
      const L = medida.capsulaLado;
      const Rcap = medida.capsulaRaio;
      const R = medida.cardRaio;
      const fora = medida.alturaFigura - medida.lado;
      const recorte = (
        t: number,
        r: number,
        b: number,
        l: number,
        rtl: number,
        rtr: number,
        rbr: number,
        rbl: number
      ) =>
        `inset(${t.toFixed(2)}px ${r.toFixed(2)}px ${b.toFixed(2)}px ${l.toFixed(2)}px round ${rtl.toFixed(2)}px ${rtr.toFixed(2)}px ${rbr.toFixed(2)}px ${rbl.toFixed(2)}px)`;

      // CARD: a cápsula → o quadrado. No ato 2 isto é inset(0 0 0 0 round
      // --vitrine-raio), que é um NO-OP sobre a caixa do painel: por isso o
      // ato 2 sai idêntico ao de antes deste prompt.
      // Os cantos DE CIMA são retos no ato 1 porque a caixa do card só tem
      // `lado` de altura; a ponta arredondada de cima da cápsula quem desenha
      // é a figura, que é a única camada alta o bastante.
      painel.style.clipPath = noAto2
        ? 'none'
        : recorte(
            entre(CARD_TOPO_ATO1, 0),
            entre(L, 0),
            0,
            entre(L, 0),
            entre(0, R),
            entre(0, R),
            entre(Rcap, R),
            entre(Rcap, R)
          );
      // O VÉU é decorativo do card e leva o mesmo recorte. O topo começa em 0
      // porque ele não tem borda nenhuma: nasce transparente na rampa.
      veu.style.clipPath = noAto2
        ? 'none'
        : recorte(
            0,
            entre(L, 0),
            0,
            entre(L, 0),
            entre(0, R),
            entre(0, R),
            entre(Rcap, R),
            entre(Rcap, R)
          );
      // O HALO também, na caixa dele, que é 128% do card e começa 14% acima e
      // à esquerda. No ato 2 o inset vai para valores NEGATIVOS de propósito:
      // clip-path é aplicado DEPOIS do filter, então um inset(0) cortaria o
      // desfoque e o halo do ato 2 mudaria. Meio lado de folga cobre com
      // sobra os ~3 sigma do blur (13% do lado).
      // NO TOQUE O HALO NÃO GANHA RECORTE ANIMADO (25/09/2026): recorte que muda a cada
      // quadro sobre um brilho com desfoque de ~25px obrigava o Safari a repintar o halo
      // inteiro por quadro. Ele só acende a partir de p=0,3 (faixa da opacidade, abaixo),
      // quando a cápsula já está se abrindo, então sem o recorte a diferença é mínima.
      const folgaHalo = -medida.lado * 0.5;
      halo.style.clipPath = noAto2 || toque
        ? 'none'
        : recorte(
            entre(medida.haloDesvio - fora, folgaHalo),
            entre(L + medida.haloDesvio, folgaHalo),
            entre(medida.haloDesvio, folgaHalo),
            entre(L + medida.haloDesvio, folgaHalo),
            entre(Rcap, 0),
            entre(Rcap, 0),
            entre(Rcap, 0),
            entre(Rcap, 0)
          );
      // FIGURA: cabeça CONTIDA → sem recorte, cabeça fora. O recorte mora no
      // INVÓLUCRO, não na imagem, porque é o invólucro que fica parado.
      const topoFigura = -fora - medida.involucroTopo;
      const ladoFigura = L - medida.involucroLado;
      involucro.style.clipPath = noAto2
        ? 'none'
        : recorte(
            entre(topoFigura, 0),
            entre(ladoFigura, 0),
            0,
            entre(ladoFigura, 0),
            entre(Rcap, 0),
            entre(Rcap, 0),
            entre(Rcap, 0),
            entre(Rcap, 0)
          );
      // Só transform, e na IMAGEM, porque o recorte precisa ficar parado no
      // invólucro.
      figura.style.transform = e.figura;
      painel.style.opacity = `${e.painel}`;
      halo.style.opacity = `${e.halo}`;

      linhas.forEach((linha, indice) => {
        linha.style.transform = e.linhas[indice].transform;
        linha.style.opacity = `${e.linhas[indice].opacidade}`;
      });
      cascata.forEach((elemento, indice) => {
        elemento.style.opacity = `${e.cascata[indice].opacidade}`;
        elemento.style.transform = e.cascata[indice].transform;
      });

      ativarAto2(p);
    }

    // ---- O MOTOR DE CSS (toque) -------------------------------------------
    // Os quadros-chave nascem do MESMO estado(p), amostrado a cada 2,5% da
    // passagem, e só são reescritos quando a medição muda (resize de verdade,
    // fontes, orientação). Durante a rolagem o JavaScript não escreve NADA na
    // passagem: quem anda é o compositor.
    let folha: HTMLStyleElement | null = null;

    function gerarPassagem() {
      const g = geometria();
      const amostras = Array.from({length: PASSOS_DA_PASSAGEM + 1}, (_, indice) =>
        estado(indice / PASSOS_DA_PASSAGEM, g, curto)
      );
      // O trilho é o MESMO do motor de JS: do topo da seção até 0,9 palco abaixo.
      const inicio = secao.getBoundingClientRect().top + window.scrollY;
      const fim = inicio + 0.9 * g.alturaViewport;
      const ultimo = PASSOS_DA_PASSAGEM;
      let css = '';

      const trilho = (
        seletor: string,
        nomeDaAnimacao: string,
        quadro: (e: EstadoDaPassagem) => string
      ) => {
        const quadros = amostras.map(quadro);
        // Quadro igual ao vizinho dos dois lados não muda nada: sai.
        const passos = quadros
          .map((q, indice) =>
            indice === 0 ||
            indice === ultimo ||
            q !== quadros[indice - 1] ||
            q !== quadros[indice + 1]
              ? `${+((indice * 100) / ultimo).toFixed(2)}%{${q}}`
              : ''
          )
          .join('');
        css +=
          `@keyframes ${nomeDaAnimacao}{${passos}}` +
          `.hero2[data-passagem="css"] ${seletor}{` +
          `animation-name:${nomeDaAnimacao};` +
          'animation-duration:1ms;animation-duration:auto;' +
          'animation-timing-function:linear;animation-fill-mode:both;' +
          'animation-timeline:scroll(root block);' +
          `animation-range:${inicio.toFixed(1)}px ${fim.toFixed(1)}px}`;
      };

      trilho('.hero2-nome', 'hero2-p-nome', (e) =>
        `opacity:${curto(e.nomeOpacidade)};transform:${e.nome}`
      );
      trilho('.hero2-identificacao', 'hero2-p-credito', (e) =>
        `opacity:${curto(e.creditoOpacidade)};transform:${e.credito}`
      );
      trilho('.hero2-dica', 'hero2-p-dica', (e) => `opacity:${curto(e.creditoOpacidade)}`);
      trilho('.hero2-vitrine', 'hero2-p-vitrine', (e) => `transform:${e.vitrine}`);
      trilho('.hero2-figura img', 'hero2-p-figura', (e) => `transform:${e.figura}`);
      trilho('.hero2-halo', 'hero2-p-halo', (e) => `opacity:${curto(e.halo)}`);
      // A CÁPSULA cede para as cópias inteiras. Painel e véu trocam em cruz; a
      // figura contida fica opaca por cima até a inteira estar toda acesa.
      trilho('.hero2-painel:not(.hero2-inteiro)', 'hero2-p-painel', (e) =>
        `opacity:${curto(e.painel * (1 - e.troca))}`
      );
      trilho('.hero2-painel.hero2-inteiro', 'hero2-p-painel-inteiro', (e) =>
        `opacity:${curto(e.painel * e.troca)}`
      );
      trilho('.hero2-veu:not(.hero2-inteiro)', 'hero2-p-veu', (e) =>
        `opacity:${curto(1 - e.troca)}`
      );
      trilho('.hero2-veu.hero2-inteiro', 'hero2-p-veu-inteiro', (e) =>
        `opacity:${curto(e.troca)}`
      );
      trilho('.hero2-figura:not(.hero2-inteiro)', 'hero2-p-figura-contida', (e) =>
        `opacity:${curto(e.figuraContida)}`
      );
      trilho('.hero2-figura.hero2-inteiro', 'hero2-p-figura-inteira', (e) =>
        `opacity:${curto(e.troca)}`
      );
      linhas.forEach((_, indice) =>
        trilho(`.hero2-linha:nth-child(${indice + 1}) > i`, `hero2-p-linha-${indice}`, (e) =>
          `opacity:${curto(e.linhas[indice].opacidade)};transform:${e.linhas[indice].transform}`
        )
      );
      ['.hero2-sub', '.hero2-botoes', '.hero2-cidades', '.hero2-kicker'].forEach(
        (seletor, indice) =>
          trilho(seletor, `hero2-p-cascata-${indice}`, (e) =>
            `opacity:${curto(e.cascata[indice].opacidade)};transform:${e.cascata[indice].transform}`
          )
      );

      if (!folha) {
        folha = document.createElement('style');
        folha.dataset.hero2Passagem = '';
        document.head.append(folha);
      }
      folha.textContent = css;
    }

    // No motor de CSS a rolagem só precisa saber de UMA coisa: quando o ato 2
    // fica clicável. Nada é escrito a não ser nessa troca.
    function aoRolarNoTrilho() {
      ativarAto2(progresso());
    }

    // Uma pintura fora da rolagem (armar, resize, fontes).
    function pintar() {
      if (preferenciaMovimento.matches) {
        desenhar(1);
      } else if (motorCss) {
        gerarPassagem();
        ativarAto2(progresso());
      } else {
        desenhar(progresso());
      }
    }

    // O percurso do scrub usa a MESMA constante da medição. Com
    // window.innerHeight a velocidade da passagem também mudava quando a barra
    // do navegador se mexia, e o retrato dava um salto de escala no meio da
    // viagem.
    function progresso() {
      return trava(-secao.getBoundingClientRect().top / (0.9 * alturaPalco()), 0, 1);
    }

    // ---- FUNDO VIVO ------------------------------------------------------
    function podeCarregarVideo() {
      if (preferenciaMovimento.matches) return false;
      if (window.matchMedia('(prefers-reduced-data: reduce)').matches) return false;
      const conexao = (navigator as Navigator & {connection?: ConexaoDeRede}).connection;
      if (conexao?.saveData) return false;
      if (conexao?.effectiveType && conexao.effectiveType !== '4g') return false;
      return true;
    }

    function escolherFonte() {
      const alvo = window.innerWidth <= LIMIAR_MOBILE ? VIDEO_MOBILE : VIDEO_DESKTOP;
      if (video.getAttribute('src') === alvo) return; // uma variante por vez
      video.dataset.visivel = 'nao';
      video.src = alvo;
      video.load();
      video.play().catch(() => {}); // iOS rejeita a promise fora de gesto
    }

    function aoPoderTocar() {
      video.dataset.visivel = 'sim';
    }

    // ---- LIGAÇÃO ---------------------------------------------------------
    let quadroPedido = false;
    let ocioso: number | undefined;
    let temporizador: number | undefined;
    let videoLigado = false;

    function aoRolar() {
      if (quadroPedido) return;
      quadroPedido = true;
      requestAnimationFrame(() => {
        quadroPedido = false;
        desenhar(progresso());
      });
    }

    let ultimaLargura = window.innerWidth;
    let ultimaAlturaPalco = alturaPalco();

    function aoRedimensionar() {
      ultimaLargura = window.innerWidth;
      ultimaAlturaPalco = alturaPalco();
      medir();
      pintar();
      if (videoLigado) escolherFonte();
    }

    // resize dispara a cada vez que a barra do navegador aparece ou some.
    // Como nem a largura nem o palco mudam nesse evento, ele vira no-op.
    // Sem esta trava a hero era remedida dezenas de vezes por rolagem.
    function aoRedimensionarJanela() {
      if (window.innerWidth === ultimaLargura && alturaPalco() === ultimaAlturaPalco) {
        return;
      }
      aoRedimensionar();
    }

    function ligarVideo() {
      if (!podeCarregarVideo()) return;
      videoLigado = true;
      video.addEventListener('canplay', aoPoderTocar);
      escolherFonte();
    }

    function agendarVideo() {
      // O vídeo só começa a carregar DEPOIS do load da página: o pôster é o
      // LCP e não pode disputar banda com ele.
      if (typeof window.requestIdleCallback === 'function') {
        ocioso = window.requestIdleCallback(ligarVideo, {timeout: 2500});
      } else {
        temporizador = window.setTimeout(ligarVideo, 900);
      }
    }

    function armar() {
      medir();

      if (preferenciaMovimento.matches) {
        // Movimento reduzido: estado FINAL, nada de passagem e nada de vídeo.
        secao.dataset.passagem = 'js';
        pintar();
        return;
      }

      secao.dataset.passagem = motorCss ? 'css' : 'js';
      pintar();
      window.addEventListener('scroll', motorCss ? aoRolarNoTrilho : aoRolar, {
        passive: true
      });
      if (document.readyState === 'complete') agendarVideo();
      else window.addEventListener('load', agendarVideo, {once: true});
    }

    function desarmar() {
      window.removeEventListener('scroll', aoRolar);
      window.removeEventListener('scroll', aoRolarNoTrilho);
      window.removeEventListener('load', agendarVideo);
      video.removeEventListener('canplay', aoPoderTocar);
      if (ocioso !== undefined) window.cancelIdleCallback?.(ocioso);
      if (temporizador !== undefined) window.clearTimeout(temporizador);
      ocioso = undefined;
      temporizador = undefined;
      if (videoLigado) {
        videoLigado = false;
        video.pause();
        video.removeAttribute('src');
        video.load();
        video.dataset.visivel = 'nao';
      }
    }

    function reavaliar() {
      desarmar();
      armar();
    }

    // O halo gira em CSS, então ninguém precisa de quadro em JS para ele. O
    // que precisa de vigilância é o desperdício: com o vídeo tocando atrás,
    // manter um conic-gradient borrado girando fora da tela é gasto puro de
    // GPU. O observador só liga e desliga a animação.
    const observadorHalo = new IntersectionObserver(
      ([entrada]) => {
        secao.dataset.halo = entrada.isIntersecting ? 'girando' : 'parado';
      },
      {threshold: 0}
    );
    observadorHalo.observe(secao);

    armar();
    window.addEventListener('resize', aoRedimensionarJanela);
    // orientationchange e fonts.ready forçam a medição SEMPRE, sem passar
    // pela trava: nos dois casos a geometria mudou de verdade.
    window.addEventListener('orientationchange', aoRedimensionar);
    preferenciaMovimento.addEventListener('change', reavaliar);
    // As fontes chegam depois do primeiro quadro e mudam a altura do bloco:
    // sem esta remedição o cálculo do celular usaria a métrica da fonte de
    // sistema.
    document.fonts?.ready.then(aoRedimensionar).catch(() => {});

    return () => {
      desarmar();
      observadorHalo.disconnect();
      window.removeEventListener('resize', aoRedimensionarJanela);
      window.removeEventListener('orientationchange', aoRedimensionar);
      preferenciaMovimento.removeEventListener('change', reavaliar);
      // O --hero-nome-altura é a ÚNICA coisa que esta seção escreve fora da
      // própria árvore: ela mora no :root porque o CSS exige (ver o comentário
      // na medição). Então ela sai daqui na desmontagem, senão a medida de uma
      // hero que não existe mais fica pendurada no documento inteiro.
      document.documentElement.style.removeProperty('--hero-nome-altura');
      // A folha do motor de CSS também mora fora da árvore (no <head>).
      folha?.remove();
    };
  }, []);

  return (
    <section
      ref={secaoRef}
      data-bloco="hero"
      data-owner="autoral"
      className="hero2"
    >
      {/* Sem JS a passagem não acontece: a seção entrega o ato 2 inteiro,
          parado, em vez de uma tela com texto invisível. */}
      <noscript>
        <style>{`:root{--hero-altura:100svh}
          .hero2-palco{position:relative}
          .hero2-nome,.hero2-identificacao,.hero2-dica{display:none}
          .hero2-ato2{pointer-events:auto}
          .hero2-linha>i,.hero2-fade{opacity:1;transform:none}
          .hero2-halo{opacity:.85}
          .hero2-painel{opacity:1}
          .hero2-painel,.hero2-veu,.hero2-halo,.hero2-figura{clip-path:none}
          .hero2-vitrine{transform:translate(-50%,-50%) translate(15.6vw,10vh) scale(1)}
          @media (max-width:820px){
            .hero2-vitrine{transform:translate(-50%,-50%) translate(0,-6vh) scale(.8)}
          }`}</style>
      </noscript>

      <div ref={palcoRef} className="hero2-palco">
        {/* z0 · FUNDO VIVO. O pôster é o LCP. Par PAISAGEM no desktop, par
            RETRATO no celular: nunca cruzar os pares. */}
        <picture data-camada="fundo">
          <source media={`(max-width: ${LIMIAR_MOBILE}px)`} srcSet={POSTER_MOBILE} />
          <img
            src={POSTER_DESKTOP}
            alt=""
            aria-hidden="true"
            fetchPriority="high"
            decoding="async"
            className="hero2-fundo"
          />
        </picture>
        {/* Sem som, sem controle, sem filtro. A fonte entra por JS depois do
            load (e não entra em rede fraca, saveData ou movimento reduzido). */}
        <video
          className="hero2-fundo hero2-video"
          data-camada="fundo"
          data-visivel="nao"
          muted
          loop
          playsInline
          autoPlay
          preload="none"
          aria-hidden="true"
          tabIndex={-1}
        />

        {/* z2 · PALCO */}
        <div className="hero2-cena">
          {/* Régua invisível de altura zero: a largura dela é a que o retrato
              tinha no ato 1, e é dela que sai a escala de chegada. Existe
              porque getComputedStyle devolve o clamp() do token como texto,
              não como px.
              Ela mora AQUI, fora da vitrine, e isso não é detalhe: dentro da
              vitrine o getBoundingClientRect dela vinha multiplicado pelo
              scale do ato 1, e a escala se realimentava. Medido: 0,404, depois
              0,163, depois 0,066 a cada remedição, até o conjunto sumir. */}
          <i className="hero2-regua" aria-hidden="true" />
          {/* ATO 2 primeiro no DOM: o H1 verdadeiro existe desde o primeiro
              render e só é revelado por transform e opacity. É ele que o
              Google lê. */}
          <div className="hero2-ato2" data-camada="frente" data-compacto="nao">
            {/* Sem traço, hífen ou barra antes do kicker (regra do design.md) */}
            <p className="hero2-kicker hero2-fade">{t('kicker')}</p>

            {/* Duas linhas EXPLÍCITAS, cada uma com sua máscara. O <i> é o que
                anima. TODO: headline encurtada por decisão do diretor (saiu
                "imobiliárias" / "real estate"); pendente de validação com o
                Luís. A redação integral do roteiro.md continua em hero.titulo
                nos dois idiomas. */}
            <h1 className="hero2-h1">
              <span className="hero2-linha">
                <i>
                  {t.rich('tituloLinha1', {
                    ancora: (parte) => <em className="ancora">{parte}</em>
                  })}
                </i>
              </span>
              <span className="hero2-linha">
                <i>
                  {t.rich('tituloLinha2', {
                    ancora: (parte) => <em className="ancora">{parte}</em>
                  })}
                </i>
              </span>
            </h1>

            <p className="hero2-sub hero2-fade">{t('apoio')}</p>

            {/* UM botão só, desde o 2.39. O "buscar imóveis" (hero.ctaBusca)
                saiu junto com a página /listings, arquivada em
                _arquivo/listings/: ele prometia uma busca que o site não tem
                enquanto o MLS/IDX da Stonehaus for pendência, e botão que
                promete o que a página não entrega é pior que botão nenhum.
                O WhatsApp herda o peso primário, que é o certo: com um botão
                só, ele é A ação da hero, e a ação única do site (design.md).
                A chave hero.ctaBusca continua nos dois idiomas, sem uso, para
                o dia em que a busca existir. */}
            <div className="hero2-botoes hero2-fade">
              <a
                href={linkWhatsApp('hero', locale)}
                target="_blank"
                rel="noopener noreferrer"
                className="hero2-btn hero2-btn-primario"
              >
                {t('ctaWhatsapp')}
              </a>
            </div>

            <p className="hero2-cidades hero2-fade">{comSeparadores(t('regioes'))}</p>
          </div>

          {/* ATO 1. O nome é decorativo: repete a marca que já está na navbar e
              no kicker, então sai da árvore de acessibilidade e não desarruma a
              hierarquia de títulos. */}
          <h2 className="hero2-nome" aria-hidden="true" data-camada="frente">
            <span>{t('nome1')}</span>
            <span>{t('nome2')}</span>
          </h2>

          <p className="hero2-identificacao" data-camada="frente">
            {comSeparadores(t('identificacao'))}
          </p>

          <div className="hero2-dica" aria-hidden="true" data-camada="frente">
            <span className="hero2-dica-rotulo">{t('dicaRolagem')}</span>
            <span className="hero2-dica-fio" />
          </div>

          {/* A VITRINE. O retrato pertence aos dois atos: é ele que atravessa
              a passagem. A variante é escolhida pelo <picture> no mesmo limiar
              da mídia, então só UM arquivo entra na rede.
              fetchPriority alto porque, MEDIDO no trace, é ELE o LCP e não o
              pôster: o Chrome descarta como fundo qualquer imagem que cubra a
              viewport inteira, então o maior elemento contentful do ato 1 é o
              retrato.

              A PILHA, e a ordem é o mecanismo inteiro:
              z1 halo, z2 painel COM A BORDA, z3 figura, z4 véu.
              O painel recorta o corpo embaixo e nos lados; a cabeça sai por
              cima porque o invólucro da figura é muito mais alto que ele. Não
              existe nenhuma borda, contorno ou sombra do painel ACIMA da
              figura: se existisse, a linha de cima cruzaria a testa dele. */}
          <div className="hero2-vitrine" data-camada="meio">
            <div className="hero2-halo" aria-hidden="true">
              <i />
            </div>
            <div className="hero2-painel" aria-hidden="true" />
            {/* AS CÓPIAS INTEIRAS (.hero2-inteiro) existem só no motor de CSS do
                toque: são o card, a figura e o véu do ato 2, sem recorte, que
                acendem por opacidade enquanto a cápsula apaga. Fora dele ficam
                em display:none. A figura inteira vem ANTES da contida no DOM
                para ficar por BAIXO dela: o corpo nunca fica translúcido. */}
            <div className="hero2-painel hero2-inteiro" aria-hidden="true" />
            <div className="hero2-figura hero2-inteiro" aria-hidden="true">
              <picture>
                <source
                  media={`(max-width: ${LIMIAR_MOBILE}px)`}
                  srcSet={RETRATO_MOBILE}
                />
                <img src={RETRATO_DESKTOP} alt="" decoding="async" />
              </picture>
            </div>
            <div className="hero2-figura">
              <picture>
                <source
                  media={`(max-width: ${LIMIAR_MOBILE}px)`}
                  srcSet={RETRATO_MOBILE}
                />
                <img
                  src={RETRATO_DESKTOP}
                  alt={t('altFoto')}
                  fetchPriority="high"
                  decoding="async"
                />
              </picture>
            </div>
            <div className="hero2-veu" aria-hidden="true" />
            <div className="hero2-veu hero2-inteiro" aria-hidden="true" />
          </div>
        </div>
      </div>
    </section>
  );
}
