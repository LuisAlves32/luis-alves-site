// Página original (21st.dev): https://21st.dev/@unlumen/components/count-up
// Licença: MIT, Copyright (c) 2026 Léo Wicki. Créditos completos em CREDITOS.md.
'use client';

import * as React from 'react';
import {
  AnimatePresence,
  motion,
  useInView,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionValue,
  type TargetAndTransition
} from 'framer-motion';
import {cn} from '@/lib/utils';

/* Origem: 21st.dev, "Count Up" de unlumen (demo 20068), escolhido pelo
 * diretor para os três números da seção 2 da landing do guia. O número
 * corre até o alvo numa mola quando entra na tela, com efeito por dígito
 * (deslize de odômetro, fade ou desfoque). Posse do movimento: o Framer
 * daqui de dentro. A animação entra INTEIRA. Passada de tokens e duas
 * adaptações técnicas:
 *
 * 1. `motion/react` virou `framer-motion`, o pacote deste projeto.
 * 2. `react-use-measure` não está no projeto e não vale uma dependência por
 *    uma medida de altura: o `medirAltura` abaixo faz o mesmo com um
 *    ResizeObserver. O odômetro precisa da altura de UM dígito para saber
 *    quanto deslizar; é só isso que a biblioteca fazia.
 * 3. Movimento reduzido (lei do movimento.md, estado FINAL): o número nasce
 *    já no alvo, sem mola e sem efeito por dígito. */

type EfeitoDigito = 'none' | 'fade' | 'blur' | 'slide';

interface Props {
  ate: number;
  de?: number;
  direcao?: 'up' | 'down';
  atraso?: number;
  duracao?: number;
  efeito?: EfeitoDigito;
  className?: string;
  comecarQuando?: boolean;
  separador?: string;
  aoComecar?: () => void;
  aoTerminar?: () => void;
}

function useMedirAltura(): [React.RefCallback<HTMLElement>, number] {
  const [altura, setAltura] = React.useState(0);
  const ref = React.useCallback((el: HTMLElement | null) => {
    if (!el) return;
    setAltura(el.getBoundingClientRect().height);
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver((entradas) => {
      for (const e of entradas) setAltura(e.contentRect.height);
    });
    ro.observe(el);
  }, []);
  return [ref, altura];
}

function DigitoOdometro({valor, casa}: {valor: MotionValue<number>; casa: number}) {
  const [ref, altura] = useMedirAltura();

  const y = useTransform(valor, (v) => {
    if (!altura) return 0;
    const digito = (Math.abs(v) / casa) % 10;
    return -digito * altura;
  });

  return (
    <span
      style={{
        position: 'relative',
        display: 'inline-block',
        width: '1ch',
        overflowY: 'clip',
        overflowX: 'visible',
        lineHeight: 1,
        fontVariantNumeric: 'tabular-nums'
      }}
    >
      <span ref={ref} style={{visibility: 'hidden', display: 'block'}}>
        0
      </span>
      <motion.span
        style={{
          y,
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* 11 dígitos (0 a 9 e o 0 repetido) para a volta de 9 para 0 não pular */}
        {Array.from({length: 11}, (_, i) => (
          <span
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: altura || '1em'
            }}
          >
            {i % 10}
          </span>
        ))}
      </motion.span>
    </span>
  );
}

const VARIANTES = {
  fade: {
    initial: {opacity: 0, scale: 0.7},
    animate: {opacity: 1, scale: 1},
    exit: {opacity: 0, scale: 0.7},
    transition: {duration: 0.14, ease: 'easeOut'},
    overflow: 'hidden' as const
  },
  blur: {
    initial: (sobe: boolean) => ({opacity: 0, filter: 'blur(8px)', y: sobe ? -8 : 8}),
    animate: {opacity: 1, filter: 'blur(0px)', y: 0},
    exit: (sobe: boolean) => ({opacity: 0, filter: 'blur(8px)', y: sobe ? 8 : -8}),
    transition: {duration: 0.18, ease: 'easeOut'},
    overflow: 'visible' as const
  }
};

function Caractere({
  char,
  chave,
  efeito,
  sobe
}: {
  char: string;
  chave: string;
  efeito: Exclude<EfeitoDigito, 'none' | 'slide'>;
  sobe: boolean;
}) {
  const ehDigito = /\d/.test(char);
  if (!ehDigito) return <span style={{display: 'inline-block'}}>{char}</span>;

  const v = VARIANTES[efeito];
  const initial = typeof v.initial === 'function' ? v.initial(sobe) : v.initial;
  const exit =
    'exit' in v && typeof v.exit === 'function'
      ? (v.exit as (s: boolean) => object)(sobe)
      : (v.exit as object);

  return (
    <span style={{position: 'relative', display: 'inline-block', overflow: v.overflow}}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={chave}
          initial={initial as TargetAndTransition}
          animate={v.animate as TargetAndTransition}
          exit={exit as TargetAndTransition}
          transition={v.transition as object}
          style={{display: 'inline-block'}}
        >
          {char}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

export function NumeroQueAparece({
  ate,
  de = 0,
  direcao = 'up',
  atraso = 0,
  duracao = 2,
  efeito = 'none',
  className,
  comecarQuando = true,
  separador = '',
  aoComecar,
  aoTerminar
}: Props) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const reduzido =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Com movimento reduzido o valor inicial já é o alvo: sem mola, sem efeito.
  const inicial = reduzido ? ate : direcao === 'down' ? ate : de;
  const valorMotion = useMotionValue(inicial);

  const damping = 20 + 40 * (1 / duracao);
  const stiffness = 100 * (1 / duracao);

  const mola = useSpring(valorMotion, {damping, stiffness});
  const naTela = useInView(ref, {once: true, margin: '0px'});

  const casasDecimais = (n: number) => {
    const s = n.toString();
    if (s.includes('.')) {
      const dec = s.split('.')[1];
      if (dec && parseInt(dec) !== 0) return dec.length;
    }
    return 0;
  };
  const maxDecimais = Math.max(casasDecimais(de), casasDecimais(ate));

  const formatar = React.useCallback(
    (v: number) => {
      const temDecimais = maxDecimais > 0;
      const opcoes: Intl.NumberFormatOptions = {
        useGrouping: !!separador,
        minimumFractionDigits: temDecimais ? maxDecimais : 0,
        maximumFractionDigits: temDecimais ? maxDecimais : 0
      };
      const f = Intl.NumberFormat('en-US', opcoes).format(v);
      return separador ? f.replace(/,/g, separador) : f;
    },
    [maxDecimais, separador]
  );

  const textoInicial = formatar(inicial);
  const [chars, setChars] = React.useState<string[]>(textoInicial.split(''));

  // No modo sem efeito o texto é escrito direto no DOM (sem estado); nos
  // modos por caractere o estado inicial já nasce formatado no `useState`.
  React.useEffect(() => {
    if (efeito === 'none' && ref.current) ref.current.textContent = formatar(inicial);
  }, [inicial, formatar, efeito]);

  React.useEffect(() => {
    if (reduzido) return;
    if (naTela && comecarQuando) {
      aoComecar?.();
      const t1 = setTimeout(() => {
        valorMotion.set(direcao === 'down' ? de : ate);
      }, atraso * 1000);
      const t2 = setTimeout(() => aoTerminar?.(), atraso * 1000 + duracao * 1000);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [naTela, comecarQuando, valorMotion, direcao, de, ate, atraso, aoComecar, aoTerminar, duracao, reduzido]);

  React.useEffect(() => {
    const desligar = mola.on('change', (v: number) => {
      if (efeito === 'none') {
        if (ref.current) ref.current.textContent = formatar(v);
      } else if (efeito !== 'slide') {
        setChars(formatar(v).split(''));
      }
    });
    return () => desligar();
  }, [mola, formatar, efeito]);

  const sobe = direcao === 'up';

  if (efeito === 'slide') {
    const alvo = formatar(direcao === 'down' ? de : ate);
    const estrutura: Array<{tipo: 'digito' | 'sep'; char?: string; casa?: number}> = [];
    let total = 0;
    for (const ch of alvo) if (/\d/.test(ch)) total++;
    let d = 0;
    for (const ch of alvo) {
      if (/\d/.test(ch)) {
        estrutura.push({tipo: 'digito', casa: total - 1 - d});
        d++;
      } else {
        estrutura.push({tipo: 'sep', char: ch});
      }
    }
    return (
      <span
        ref={ref}
        className={cn('inline-flex items-center', className)}
        style={{fontVariantNumeric: 'tabular-nums'}}
      >
        {estrutura.map((item, i) =>
          item.tipo === 'sep' ? (
            <span key={i}>{item.char}</span>
          ) : (
            <DigitoOdometro key={i} valor={mola} casa={Math.pow(10, item.casa!)} />
          )
        )}
      </span>
    );
  }

  if (efeito === 'none') {
    return <span ref={ref} className={cn(className)} />;
  }

  return (
    <span ref={ref} className={cn('inline-flex items-center', className)}>
      {chars.map((char, i) => (
        <Caractere
          key={i}
          char={char}
          chave={`${i}-${char}`}
          efeito={efeito as Exclude<EfeitoDigito, 'none' | 'slide'>}
          sobe={sobe}
        />
      ))}
    </span>
  );
}
