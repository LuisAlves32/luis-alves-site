'use client';

import {AnimatePresence, motion} from 'framer-motion';
import {useCallback, useEffect, useId, useRef, useState} from 'react';
import {cn} from '@/lib/utils';

/* O CAMPO DO E-MAIL da hero da landing do guia: uma linha, sugestões que se
 * revezam sozinhas no lugar do placeholder, a seta que se completa quando há
 * texto e, no envio, o texto se DESFAZ em pó da direita para a esquerda. É a
 * única animação da página no instante exato da conversão.
 *
 * Código escrito pela Tá Online, do zero, em 24/09/2026. Substitui
 * `campo-que-some.tsx`, que partia do "Placeholders And Vanish Input" da
 * Aceternity (21st.dev,
 * https://21st.dev/@manuarora700/components/placeholders-and-vanish-input): a
 * licença da Aceternity proíbe redistribuir o código-fonte, e o repositório vai
 * ser público. Crédito de inspiração em CREDITOS.md.
 *
 * O que continua valendo das rodadas anteriores, e não pode se perder:
 * 1. Campo de e-mail de verdade: `type="email"`, `name`, `autoComplete`,
 *    `inputMode`, `required`, rótulo acessível. O valor vai para o pai
 *    (`aoEnviar`) ANTES de a animação limpar o campo, e só se o navegador
 *    validar o e-mail (validação nativa, no idioma da pessoa).
 * 2. Nada é desenhado enquanto a pessoa digita. Medido em 09/09/2026 na versão
 *    anterior: redesenhar a cada tecla custava de 6 a 51ms síncronos por
 *    caractere e era parte do "não deixa eu digitar" no celular. O pó só existe
 *    no envio, então só é calculado no envio.
 * 3. As sugestões param com a aba escondida e voltam sem duplicar o intervalo.
 * 4. Movimento reduzido: as sugestões não trocam e o envio não desfaz; o campo
 *    simplesmente limpa. O envio funciona igual.
 * 5. Pele da landing: Papel, borda Lápis, raio 8px, 52px de altura, texto
 *    Tinta, seta em latão com glifo Tinta.
 *
 * O PÓ, como é feito aqui: o texto é pintado UMA vez num canvas do tamanho do
 * campo (na densidade da tela) e lido numa grade de 2px. Cada ponto aceso vira
 * um grão com um atraso proporcional à distância da borda direita, então a
 * onda corre da direita para a esquerda. Depois do atraso o grão sobe um
 * pouco, espalha para os lados e apaga em ~500ms. Tudo termina em ~900ms. */

type Grao = {x: number; y: number; vx: number; vy: number; atraso: number};

const TROCA_MS = 3000;
const PASSO = 2; // px de CSS entre dois grãos
const ONDA_MS = 380; // quanto a onda leva da direita à esquerda
const VIDA_MS = 520; // quanto cada grão leva para apagar

export function CampoDoEmail({
  placeholders,
  aoEnviar,
  rotulo,
  rotuloBotao,
  name = 'email',
  className
}: {
  placeholders: string[];
  aoEnviar: (valor: string) => void;
  /** Rótulo acessível do campo (só para leitor de tela). */
  rotulo: string;
  /** Rótulo acessível do botão de seta. */
  rotuloBotao: string;
  name?: string;
  className?: string;
}) {
  const id = useId();
  const [sugestao, setSugestao] = useState(0);
  const [valor, setValor] = useState('');
  const [desfazendo, setDesfazendo] = useState(false);
  const relogio = useRef<ReturnType<typeof setInterval> | null>(null);
  const semMovimento = useRef(false);
  const campo = useRef<HTMLInputElement>(null);
  const tela = useRef<HTMLCanvasElement>(null);

  const pararSugestoes = () => {
    if (relogio.current) clearInterval(relogio.current);
    relogio.current = null;
  };
  const girarSugestoes = useCallback(() => {
    pararSugestoes();
    if (semMovimento.current || placeholders.length < 2) return;
    relogio.current = setInterval(() => setSugestao((n) => (n + 1) % placeholders.length), TROCA_MS);
  }, [placeholders.length]);

  useEffect(() => {
    semMovimento.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    girarSugestoes();
    const aoTrocarDeAba = () => (document.hidden ? pararSugestoes() : girarSugestoes());
    document.addEventListener('visibilitychange', aoTrocarDeAba);
    return () => {
      pararSugestoes();
      document.removeEventListener('visibilitychange', aoTrocarDeAba);
    };
  }, [girarSugestoes]);

  /** Pinta o texto uma vez e devolve os grãos, em coordenadas de CSS. */
  function colherGraos(texto: string): {graos: Grao[]; cor: string} | null {
    const input = campo.current;
    const canvas = tela.current;
    if (!input || !canvas) return null;
    const caixa = input.getBoundingClientRect();
    const estilo = getComputedStyle(input);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.ceil(caixa.width * dpr);
    canvas.height = Math.ceil(caixa.height * dpr);
    canvas.style.width = `${caixa.width}px`;
    canvas.style.height = `${caixa.height}px`;
    const ctx = canvas.getContext('2d', {willReadFrequently: true});
    if (!ctx) return null;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, caixa.width, caixa.height);
    ctx.font = `${estilo.fontWeight} ${estilo.fontSize} ${estilo.fontFamily}`;
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#000';
    // O texto no mesmo lugar em que ele está no campo, descontando a rolagem interna.
    const esquerda = parseFloat(estilo.paddingLeft) - input.scrollLeft;
    ctx.fillText(texto, esquerda, caixa.height / 2);

    const {data, width} = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const passo = Math.max(1, Math.round(PASSO * dpr));
    const pontos: {x: number; y: number}[] = [];
    let direita = 0;
    for (let py = 0; py < canvas.height; py += passo) {
      for (let px = 0; px < canvas.width; px += passo) {
        if (data[(py * width + px) * 4 + 3] > 110) {
          const x = px / dpr;
          pontos.push({x, y: py / dpr});
          if (x > direita) direita = x;
        }
      }
    }
    const esquerdaMin = pontos.reduce((m, p) => Math.min(m, p.x), direita);
    const largura = Math.max(1, direita - esquerdaMin);
    const graos = pontos.map(({x, y}) => ({
      x,
      y,
      vx: (Math.random() - 0.5) * 0.9,
      vy: -0.25 - Math.random() * 0.55,
      atraso: ((direita - x) / largura) * ONDA_MS
    }));
    return {graos, cor: estilo.color || '#0E2440'};
  }

  function desfazer(texto: string) {
    const colheita = colherGraos(texto);
    const ctx = tela.current?.getContext('2d');
    if (!colheita || !ctx || !colheita.graos.length) {
      setValor('');
      return;
    }
    const {graos, cor} = colheita;
    const caixa = campo.current!.getBoundingClientRect();
    setDesfazendo(true);
    const inicio = performance.now();
    const quadro = (agora: number) => {
      const t = agora - inicio;
      ctx.clearRect(0, 0, caixa.width, caixa.height);
      ctx.fillStyle = cor;
      let vivos = 0;
      for (const g of graos) {
        const idade = t - g.atraso;
        if (idade >= VIDA_MS) continue;
        vivos++;
        const passo = Math.max(0, idade) / 16;
        const opacidade = idade <= 0 ? 1 : 1 - idade / VIDA_MS;
        ctx.globalAlpha = opacidade;
        ctx.fillRect(g.x + g.vx * passo, g.y + g.vy * passo, 1.4, 1.4);
      }
      ctx.globalAlpha = 1;
      if (vivos) {
        requestAnimationFrame(quadro);
      } else {
        ctx.clearRect(0, 0, caixa.width, caixa.height);
        setDesfazendo(false);
      }
    };
    // O texto do campo some no mesmo quadro em que o pó aparece.
    setValor('');
    requestAnimationFrame(quadro);
  }

  function enviar() {
    const input = campo.current;
    if (!input || desfazendo) return;
    if (!input.checkValidity()) {
      input.reportValidity();
      return;
    }
    const texto = input.value;
    if (!texto) return;
    aoEnviar(texto); // antes de qualquer limpeza
    if (semMovimento.current) {
      setValor('');
      return;
    }
    desfazer(texto);
  }

  return (
    <div
      className={cn(
        'relative h-[52px] w-full overflow-hidden rounded-[8px] border border-lapis/70 bg-papel transition-colors duration-200 focus-within:border-latao',
        className
      )}
    >
      <canvas
        ref={tela}
        aria-hidden="true"
        className={cn('pointer-events-none absolute left-0 top-0 z-20', desfazendo ? 'opacity-100' : 'opacity-0')}
      />
      <label htmlFor={id} className="sr-only">
        {rotulo}
      </label>
      <input
        ref={campo}
        id={id}
        name={name}
        type="email"
        required
        autoComplete="email"
        inputMode="email"
        value={valor}
        onChange={(e) => {
          if (!desfazendo) setValor(e.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            enviar();
          }
        }}
        className="relative z-10 h-full w-full rounded-[8px] border-none bg-transparent pl-4 pr-16 text-[16px] text-tinta focus:outline-none focus:ring-0 sm:pl-6"
      />

      <button
        type="button"
        disabled={!valor}
        onClick={enviar}
        aria-label={rotuloBotao}
        className="absolute right-1 top-1/2 z-30 flex size-11 -translate-y-1/2 items-center justify-center rounded-[6px] bg-latao text-tinta transition duration-200 hover:brightness-95 active:scale-[0.98] disabled:bg-latao/35 disabled:text-tinta/45 focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--cor-tinta)]"
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          {/* A haste da seta se completa quando há o que enviar. */}
          <motion.path
            d="M5 12h14"
            initial={false}
            // Vazio: só um toco junto da ponta. Com texto: a haste inteira.
            animate={{pathLength: valor ? 1 : 0.15, pathOffset: valor ? 0 : 0.85}}
            transition={{duration: 0.28, ease: 'easeOut'}}
          />
          <path d="M13 18l6-6M13 6l6 6" />
        </svg>
      </button>

      <div className="pointer-events-none absolute inset-0 flex items-center">
        <AnimatePresence mode="wait" initial={false}>
          {!valor && !desfazendo ? (
            <motion.p
              key={sugestao}
              initial={{opacity: 0, y: 8}}
              animate={{opacity: 1, y: 0}}
              exit={{opacity: 0, y: -8}}
              transition={{duration: 0.28, ease: 'easeOut'}}
              className="w-[calc(100%-4rem)] truncate pl-4 text-left text-[15px] text-grafite/75 sm:pl-6"
            >
              {placeholders[sugestao]}
            </motion.p>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
