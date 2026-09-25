// Página original (21st.dev): https://21st.dev/@designali-in/components/book
// Licença: sem licença declarada pelo autor; usado com crédito, conforme os termos do 21st.dev. Créditos completos em CREDITOS.md.
'use client';

/* Origem: 21st.dev, "Book" de designali-in (demo 1758). Do componente original
   sobrou a IDEIA (capa, lombada impressa, corte das páginas girado 90deg em Y);
   a geometria foi refeita porque a dele não é um objeto: é uma capa com duas
   lajes penduradas, e isso só engana enquanto o livro balança 20 graus no hover.
   Aqui ele dá voltas inteiras, então precisa ser uma CAIXA de verdade.

   O QUE MUDOU, e por quê (tudo medido no navegador):

   1. SEIS FACES, não três. Capa, contracapa, corte das páginas, dorso, topo e
      base. Sem topo e base o livro fica oco quando inclina.
   2. EIXO NO CENTRO. Antes a capa estava em z=0 e a contracapa em z=-D: o
      livro ORBITAVA em vez de girar em torno de si. Agora a caixa é simétrica,
      de z=-D/2 a z=+D/2.
   3. `backface-visibility: hidden` nas seis. É a única coisa que impede a capa
      ESPELHADA aparecer aos 140 graus. Sem isso, passar de 90 graus mostrava a
      capa invertida e, atrás dela, uma laje bege vazia.
   4. O dorso virou `rotateY(-90deg)` (era +90). Com as costas escondidas, uma
      face só é visível pelo lado para onde a normal dela aponta, e a normal do
      dorso tem que apontar para FORA, à esquerda.
   5. A SOMBRA SAIU DA CAPA. Era `box-shadow` na própria capa, e sombra que gira
      junto com o objeto não é sombra. Virou um irmão, fora da caixa 3D. Isso
      também protege a cena: qualquer `filter`, `opacity < 1`, `overflow` ou
      `mix-blend-mode` no elemento que carrega `preserve-3d` faz o navegador
      ACHATAR a cena inteira em silêncio, e aí `backface-visibility` para de
      funcionar. `.guia-livro-3d` recebe só transform, transform-style e
      will-change.

   O padrão de arrastar-para-girar vem do "Interactive Globe" de dev.yadhakim
   (21st 10073), que NÃO foi instalado: dele veio a mecânica, que é estado do
   gesto em ref (nunca em state, senão re-renderiza a árvore a cada milímetro),
   `setPointerCapture` no pointerdown e `releasePointerCapture` no pointerup.
   É isso que faz o MESMO código servir mouse e toque.

   POSSE DO MOVIMENTO: o Framer Motion daqui de dentro. */

import {useCallback, useEffect, useRef} from 'react';
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useTransform
} from 'framer-motion';

// Mesmo limiar de variante de mídia do resto do site (hero, processo).
const LIMIAR_MOBILE = 820;

/* A ROTAÇÃO TEM UMA FONTE DE VERDADE SÓ:

       rotacaoY = baseRolagem + arrasto

   baseRolagem é TRILHO, o vocabulário do projeto (movimento.md): o livro entra
   virado e vai se abrindo até o ângulo de descanso conforme a seção sobe. Não
   depende de gesto nenhum, então gira igual no desktop e no celular.
   arrasto é o gesto, somado POR CIMA da base e SEM TETO. Somar, em vez de "ou
   um ou outro", é o que impede o pulo no instante em que o dedo encosta e no
   instante em que solta.

   -22 no descanso, e não -14: a -14 a capa aparece com 97% da largura, e nove
   pixels de diferença não leem como objeto. A -22 são 92,7%. */
const ANGULO_ENTRADA = -40;
const ANGULO_DESCANSO = -22;

// Pixels de ponteiro por grau. 1,1 dá uma volta inteira em 396px, que é um
// gesto de polegar e meio no celular. (Com o divisor 2,2 de antes seriam
// 792px por volta, e a volta ficava cansativa.)
const DIVISOR_ARRASTO = 1.1;

// INÉRCIA. Abaixo de 40 graus/s o gesto foi um ajuste, não um giro, e o livro
// simplesmente para onde o dedo deixou. O atrito é por quadro NORMALIZADO a
// 60fps: em tela de 120Hz o quadro vale metade, e sem essa normalização a
// mesma inércia morreria duas vezes mais rápido.
const VELOCIDADE_MINIMA = 40;
const VELOCIDADE_DE_PARADA = 8;
const ATRITO_A_60FPS = 0.94;
// Amostra de ponteiro mais velha que isto não vale como velocidade: é o caso
// de quem arrasta, PARA com o dedo na tela, e só então solta.
const AMOSTRA_VALIDA = 120;

// Tempo parado, depois que tudo cessa, antes de a capa voltar para a frente.
const ESPERA_DA_VOLTA = 1200;
const MOLA_DA_VOLTA = {type: 'spring', stiffness: 90, damping: 18} as const;

/* A VOLTA DE ENTRADA. Uma revolução inteira, uma vez, quando o livro chega.
   No celular não existe cursor para contar que dá para pegar; um objeto que se
   mexe sozinho uma vez conta a mesma coisa sem uma palavra.

   1900ms é decisão de direção, não número solto: com `backface-visibility` cada
   face fica visível por volta de 180 graus, então a contracapa passa cerca de
   0,95s na tela. É tempo de registrar que existe outro lado e não é tempo de
   ler, que é o certo, porque a contracapa é atmosfera. Mais rápido vira borrão
   e parece truque; mais lento e a seção fica esperando o livro.

   O SENTIDO É POSITIVO por dois motivos que se somam. O trilho de entrada já
   leva a base de -40 para -22, que é positivo, então a volta e a entrada leem
   como UM gesto só. E no positivo quem vem de frente primeiro é a borda
   esquerda, que é a lombada: a ordem que a pessoa vê é capa, lombada com o
   título, verso, corte das páginas, capa. É como se vira um livro na mão.

   O easing entra com peso, cruza quase constante e assenta firme. `ease-out`
   puro numa volta inteira começa rápido demais e arrasta o fim. */
const VOLTA_GRAUS = 360;
const VOLTA_DURACAO = 1.9;
const VOLTA_EASING = [0.45, 0, 0.15, 1] as const;
// Depois de cruzar o limiar, espera e CONFIRMA que o livro continua na tela.
// Sem isso quem passa rolando rápido gasta a única volta com o livro já fora
// da vista e nunca vê nada.
const VOLTA_CONFIRMACAO = 350;
const VOLTA_FRACAO_VISIVEL = 0.6;

/* O caminho curto. Se a pessoa deu três voltas, o arrasto vale 1080 graus, e
   uma mola até zero desenrolaria as três voltas na cara dela. 1080 e 0 são o
   MESMO ângulo na tela, então reescrever o valor antes de animar não muda um
   pixel e faz a mola percorrer o menor arco. */
const paraOCurto = (a: number) => (((a + 180) % 360) + 360) % 360 - 180;

/* Fração da altura do elemento que está dentro da janela. Serve à segunda
   checagem da volta de entrada: o `intersectionRatio` do observador conta o
   instante em que o limiar foi cruzado, e o que importa 350ms depois é se o
   livro AINDA está lá. */
function fracaoVisivel(el: HTMLElement) {
  const r = el.getBoundingClientRect();
  if (r.height <= 0) return 0;
  const dentro = Math.min(window.innerHeight, r.bottom) - Math.max(0, r.top);
  return Math.max(0, dentro) / r.height;
}

/* AS TRÊS CAMADAS DE LUZ DA CENA, e elas nascem INERTES.

   Ficam DENTRO de cada face (capa e contracapa), NUNCA no elemento que carrega
   `preserve-3d`: qualquer `filter`, `opacity` menor que 1, `clip-path`, `mask`
   ou `isolation` naquele elemento achata a cena 3D em silêncio e o livro vira
   uma folha. As faces já são contexto de empilhamento próprio (têm `overflow`
   e `translateZ`), então o blend acontece dentro da face e para ali.

   `display: none` no CSS base, e isso é de propósito: na HOME o livro está
   sobre a Tinta chapada do bloco 11 e não existe luz de cena nenhuma para
   casar. Elas só ganham corpo dentro de `[data-cena='nicho']`, que é a hero da
   landing do funil. Ou seja: estes três nós existem no DOM dos dois lugares e
   pintam em um só. */
function CamadasDeLuz() {
  return (
    <>
      <span className="guia-livro-ambiente" />
      <span className="guia-livro-sombra-cena" />
      <span className="guia-livro-luz-borda" />
    </>
  );
}

export function Livro({
  capaDesktop,
  capaMobile,
  contracapaDesktop,
  contracapaMobile,
  titulo,
  alvoRolagem,
  className = '',
  anguloDescanso = ANGULO_DESCANSO,
  entradaAnimada = true
}: {
  capaDesktop: string;
  capaMobile: string;
  /* A contracapa é a MESMA paisagem da capa, continuando para a esquerda: as
     duas faces mais a lombada são uma sobrecapa impressa que dá a volta. */
  contracapaDesktop: string;
  contracapaMobile: string;
  /* Vem do nó `guia` do i18n, verbatim. É a única coisa escrita no livro que
     não vem de imagem, e é ela que faz a lombada ler como lombada. */
  titulo: string;
  /* A seção inteira: é a subida DELA que abre o livro. Quem dispara a volta de
     entrada é o LIVRO, observado à parte, porque o que precisa estar na tela
     para valer a pena girar é o objeto, não a seção. */
  alvoRolagem: React.RefObject<HTMLElement | null>;
  className?: string;
  /* Ângulo em que o livro descansa. -22 é o da HOME, calibrado contra o fundo
     Tinta chapado do bloco 11. A landing do funil pede -34, porque lá o livro
     mora dentro de um nicho fotografado e precisa apresentar mais lombada para
     casar com a perspectiva da chapa.
     ATENÇÃO: este número tem um GÊMEO no CSS, a custom property
     `--livro-descanso`. O do CSS é quem segura o ângulo sem JS e com movimento
     reduzido; este aqui é o que o Framer escreve. Se os dois divergirem, o
     livro dá um pulo no instante em que o JS assume. */
  anguloDescanso?: number;
  /* A chegada teatral: o trilho de rolagem que abre a capa de -40 até o
     descanso, mais a volta de 360 graus, uma vez por carregamento.
     FALSA na landing, e é decisão de direção, não economia: dentro de uma cena
     fotográfica um objeto que roda sozinho denuncia a colagem na hora. Parado
     no ângulo de descanso ele lê como coisa que está ali. Com ela falsa o livro
     só se mexe no arrasto, e o laço de rAF morre junto com a inércia. */
  entradaAnimada?: boolean;
}) {
  const reduzido = useReducedMotion();

  const {scrollYProgress} = useScroll({
    target: alvoRolagem,
    offset: ['start end', 'center center']
  });
  /* O trilho, quando existe. Com `entradaAnimada` falsa os dois extremos são o
     MESMO ângulo, então a cadeia continua idêntica (mesma ordem de hooks, mesmo
     `useTransform`) e simplesmente devolve uma constante. Nada de ramo
     condicional em hook. */
  const baseRolagem = useTransform(
    scrollYProgress,
    [0, 1],
    entradaAnimada
      ? [ANGULO_ENTRADA, anguloDescanso]
      : [anguloDescanso, anguloDescanso]
  );
  const arrasto = useMotionValue(0);

  /* A SOMA, e ela é declarativa de propósito. Uma versão anterior somava à mão
     numa assinatura dentro de efeito, e MEDIDO: o primeiro `set` depois da
     montagem some dentro do ciclo de montagem do Framer e o elemento acaba com
     `transform: none`. A cadeia de `useTransform` não tem esse buraco, é a
     mesma de expansao-midia.tsx e video-na-rolagem.tsx, e nasce em -40deg no
     servidor e no cliente (progresso 0 mais arrasto 0), que é o que mantém a
     hidratação intacta.

     MOVIMENTO REDUZIDO não entra aqui: entra no CSS (bloco 11 do globals.css).
     Não é rede de segurança, é a única coisa que segura o ângulo: MEDIDO, com a
     preferência ligada o Framer PARA de escrever (deixa `transform: none` no
     elemento e o `useScroll` nem atualiza mais), então sem a regra do CSS o
     livro ficaria chapado. De quebra, é o Framer parado que garante o "nada de
     rAF"; o que falta desligar é o gesto, e disso cuidam os manipuladores
     abaixo, que saem na porta quando `reduzido`. */
  const rotacaoY = useTransform<number, number>(
    [baseRolagem, arrasto],
    ([base, gestoAcumulado]) => base + gestoAcumulado
  );

  const gesto = useRef({ativo: false, xInicial: 0, arrastoInicial: 0});
  // Duas amostras bastam para a velocidade de soltura, e duas não crescem.
  const amostras = useRef<{x: number; t: number}[]>([]);
  const relogioDaVolta = useRef<ReturnType<typeof setTimeout> | null>(null);
  const molaDaVolta = useRef<{stop: () => void} | null>(null);
  const quadroDaInercia = useRef(0);
  const naTela = useRef(true);
  const jaTocou = useRef(false);
  // A volta de entrada: o elemento observado, a animação, o relógio da segunda
  // checagem, a trava de uma vez por carregamento, e a marca de que ela está em
  // curso (é ela que impede o `jump` final de rodar numa volta interrompida).
  const livroRef = useRef<HTMLDivElement | null>(null);
  const voltaDeEntrada = useRef<{stop: () => void} | null>(null);
  const relogioDaConfirmacao = useRef<ReturnType<typeof setTimeout> | null>(null);
  const voltaJaRodou = useRef(false);
  const voltaEmCurso = useRef(false);

  const pararInercia = useCallback(() => {
    if (quadroDaInercia.current) {
      cancelAnimationFrame(quadroDaInercia.current);
      quadroDaInercia.current = 0;
    }
  }, []);

  const agendarVolta = useCallback(() => {
    if (relogioDaVolta.current) clearTimeout(relogioDaVolta.current);
    relogioDaVolta.current = setTimeout(() => {
      relogioDaVolta.current = null;
      /* `jump` e não `set`, e a diferença aqui vale as três voltas inteiras:
         `set` guarda o valor anterior e a hora dele, então reescrever 1080
         para 0 num quadro só deixa uma velocidade SINTÉTICA de dezenas de
         milhares de graus por segundo no motion value. A mola do Framer usa
         `value.getVelocity()` como velocidade inicial, então ela partia de
         distância zero e mesmo assim disparava: MEDIDO, 720 graus de giro numa
         volta que devia ter zero. `jump` escreve o valor e zera o histórico. */
      arrasto.jump(paraOCurto(arrasto.get()));
      molaDaVolta.current = animate(arrasto, 0, MOLA_DA_VOLTA);
    }, ESPERA_DA_VOLTA);
  }, [arrasto]);

  // Tudo que pode estar rodando, num lugar só. Chamado no pointerdown, na saída
  // da tela e na desmontagem: nenhum laço sobrevive a nenhuma dessas.
  const pararTudo = useCallback(() => {
    pararInercia();
    if (relogioDaVolta.current) {
      clearTimeout(relogioDaVolta.current);
      relogioDaVolta.current = null;
    }
    if (relogioDaConfirmacao.current) {
      clearTimeout(relogioDaConfirmacao.current);
      relogioDaConfirmacao.current = null;
    }
    molaDaVolta.current?.stop();
    molaDaVolta.current = null;
    /* A volta para NO ÂNGULO EM QUE ESTÁ, e é isso que faz o dedo assumir dali
       sem pulo: `stop` deixa o motion value onde ele chegou, e o pointerdown
       lê esse valor como início do arrasto. `voltaEmCurso` cai antes, para o
       `jump(0)` do fim nunca rodar numa volta que foi interrompida. */
    voltaEmCurso.current = false;
    voltaDeEntrada.current?.stop();
    voltaDeEntrada.current = null;
  }, [pararInercia]);

  useEffect(() => pararTudo, [pararTudo]);

  /* A volta mora no MESMO `arrasto` de todo o resto, para a soma continuar
     sendo a única fonte de verdade. Ao terminar, `jump(0)`: 360 e 0 são o mesmo
     ângulo na tela, então o salto é invisível e o acumulador volta limpo para a
     inércia e para a mola. `jump` e não `set` pelo motivo do histórico de
     velocidade, o mesmo que já valia na volta por mola. */
  const rodarVoltaDeEntrada = useCallback(() => {
    voltaEmCurso.current = true;
    voltaDeEntrada.current = animate(arrasto, VOLTA_GRAUS, {
      duration: VOLTA_DURACAO,
      ease: [...VOLTA_EASING],
      onComplete: () => {
        if (!voltaEmCurso.current) return;
        voltaEmCurso.current = false;
        voltaDeEntrada.current = null;
        arrasto.jump(0);
      }
    });
  }, [arrasto]);

  /* Uma observação só resolve as duas coisas que dependem de o LIVRO estar na
     tela: a volta de entrada (limiar 0,6) e a trava da inércia (livro girando
     fora da vista é bateria queimada à toa). Observa o livro, e não a seção:
     numa seção alta o topo dela pode estar na tela com o livro ainda fora.
     Sob movimento reduzido nem o observador existe: não há nada para observar,
     e nenhum quadro roda. */
  useEffect(() => {
    if (reduzido) return;
    const alvo = livroRef.current;
    if (!alvo || typeof IntersectionObserver === 'undefined') return;

    const observador = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) {
          naTela.current = entrada.isIntersecting;
          if (!entrada.isIntersecting) {
            pararInercia();
            continue;
          }
          if (
            entradaAnimada &&
            entrada.intersectionRatio >= VOLTA_FRACAO_VISIVEL &&
            !voltaJaRodou.current &&
            !jaTocou.current &&
            !relogioDaConfirmacao.current
          ) {
            /* SEGUNDA CHECAGEM. Cruzar o limiar não basta: quem passa rolando
               rápido cruzaria, gastaria a única volta com o livro já fora da
               tela, e nunca veria nada. Se a checagem falhar, a volta NÃO é
               gasta e o observador segue armado para a próxima vez que o livro
               parar na tela. */
            relogioDaConfirmacao.current = setTimeout(() => {
              relogioDaConfirmacao.current = null;
              if (voltaJaRodou.current || jaTocou.current) return;
              if (fracaoVisivel(alvo) < VOLTA_FRACAO_VISIVEL) return;
              voltaJaRodou.current = true;
              rodarVoltaDeEntrada();
            }, VOLTA_CONFIRMACAO);
          }
        }
      },
      {threshold: [0, VOLTA_FRACAO_VISIVEL]}
    );
    observador.observe(alvo);
    return () => observador.disconnect();
  }, [reduzido, entradaAnimada, pararInercia, rodarVoltaDeEntrada]);

  const rodarInercia = useCallback(
    (velocidadeInicial: number) => {
      let velocidade = velocidadeInicial;
      let anterior = performance.now();
      const passo = (agora: number) => {
        if (!naTela.current) {
          quadroDaInercia.current = 0;
          agendarVolta();
          return;
        }
        const dt = Math.min((agora - anterior) / 1000, 0.05);
        anterior = agora;
        arrasto.set(arrasto.get() + velocidade * dt);
        velocidade *= Math.pow(ATRITO_A_60FPS, dt * 60);
        if (Math.abs(velocidade) < VELOCIDADE_DE_PARADA) {
          quadroDaInercia.current = 0;
          agendarVolta();
          return;
        }
        quadroDaInercia.current = requestAnimationFrame(passo);
      };
      quadroDaInercia.current = requestAnimationFrame(passo);
    },
    [arrasto, agendarVolta]
  );

  const aoPressionar = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (reduzido) return;
      jaTocou.current = true;
      pararTudo();
      gesto.current = {
        ativo: true,
        xInicial: e.clientX,
        // Parte de onde o livro ESTÁ, não do zero: pegar o livro no meio de
        // uma volta não pode teletransportá-lo.
        arrastoInicial: arrasto.get()
      };
      amostras.current = [{x: e.clientX, t: e.timeStamp}];
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    [reduzido, pararTudo, arrasto]
  );

  const aoMover = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!gesto.current.ativo) return;
      const percorrido = (e.clientX - gesto.current.xInicial) / DIVISOR_ARRASTO;
      arrasto.set(gesto.current.arrastoInicial + percorrido);
      amostras.current.push({x: e.clientX, t: e.timeStamp});
      if (amostras.current.length > 2) amostras.current.shift();
    },
    [arrasto]
  );

  const aoSoltar = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!gesto.current.ativo) return;
      gesto.current.ativo = false;
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }

      const [inicio, fim] = amostras.current;
      let velocidade = 0;
      if (inicio && fim) {
        const dt = (fim.t - inicio.t) / 1000;
        const parado = e.timeStamp - fim.t > AMOSTRA_VALIDA;
        if (dt > 0 && !parado) {
          velocidade = (fim.x - inicio.x) / DIVISOR_ARRASTO / dt;
        }
      }
      amostras.current = [];

      if (Math.abs(velocidade) > VELOCIDADE_MINIMA) {
        rodarInercia(velocidade);
        return;
      }
      // A volta espera: soltar e ver a capa fugir na mesma hora tira da pessoa
      // a chance de olhar o que ela acabou de girar.
      agendarVolta();
    },
    [rodarInercia, agendarVolta]
  );

  return (
    <div
      ref={livroRef}
      className={`guia-livro ${className}`}
      /* O CSS desta peça é DO COMPONENTE, não do bloco que a hospeda: as
         regras `.guia-livro*` do globals.css não pedem mais ancestral nenhum,
         então o livro renderiza igual em qualquer seção. Este atributo é só a
         identidade da peça, para quem mexer aqui depois não procurar um
         `data-bloco` que não existe mais. */
      data-peca="livro"
      /* Decorativo de ponta a ponta: o título do guia já está no <h2> da
         seção, então o leitor de tela não precisa ouvir de novo (nem na
         lombada, nem na contracapa), e o livro fica fora da ordem de
         tabulação. */
      aria-hidden="true"
      onPointerDown={aoPressionar}
      onPointerMove={aoMover}
      onPointerUp={aoSoltar}
      onPointerCancel={aoSoltar}
    >
      {/* IRMÃO da caixa 3D, nunca filtro dentro dela: ver o item 5 do topo. */}
      <span className="guia-livro-sombra" />

      {/* rotateX fixo de 4 graus: é ele que faz o topo aparecer e o objeto ter
          peso em vez de flutuar. O Framer compõe `rotateX() rotateY()` nesta
          ordem, que é a de mesa giratória: gira em torno do próprio eixo e o
          conjunto fica inclinado para o observador. */}
      <motion.div
        className="guia-livro-3d"
        style={{rotateX: 4, rotateY: rotacaoY}}
      >
        <div className="guia-livro-capa">
          {/* Art direction por <picture>, nunca por srcset: a variante -mobile
              tem o MESMO enquadramento com a tipografia maior, para a capa
              continuar legível a 216px, e o srcset escolheria pelo tamanho do
              slot, não pelo aparelho. O idioma da arte é escolhido antes, na
              seção, porque é caminho de arquivo e não copy.
              O width/height declarado é o do arquivo DESKTOP (1086x1448 desde a
              arte nova de 05/09/2026); a variante -mobile é 720x960. Os dois
              são 3:4 exato, então a razão que reserva o espaço é a mesma e a
              troca por media query não desloca nada. */}
          <picture>
            <source media={`(max-width: ${LIMIAR_MOBILE}px)`} srcSet={capaMobile} />
            <img
              src={capaDesktop}
              alt=""
              width={1086}
              height={1448}
              loading="lazy"
              decoding="async"
            />
          </picture>
          <span className="guia-livro-lombada" />
          <CamadasDeLuz />
        </div>

        <div className="guia-livro-paginas" />

        <div className="guia-livro-dorso">
          <span className="guia-livro-dorso-titulo">{titulo}</span>
        </div>

        <div className="guia-livro-topo" />
        <div className="guia-livro-base" />

        {/* A contracapa é FOTOGRAFIA, e é a mesma paisagem da capa continuando
            para a esquerda: com a lombada no meio, as três faces leem como uma
            sobrecapa impressa que dá a volta. Montada igual à capa, inclusive na
            troca por media query. O rotateY(180deg) que ela leva no CSS é o que
            impede a arte de aparecer espelhada. */}
        <div className="guia-livro-verso">
          <picture>
            <source
              media={`(max-width: ${LIMIAR_MOBILE}px)`}
              srcSet={contracapaMobile}
            />
            <img
              src={contracapaDesktop}
              alt=""
              width={1086}
              height={1448}
              loading="lazy"
              decoding="async"
            />
          </picture>
          <CamadasDeLuz />
        </div>
      </motion.div>
    </div>
  );
}
