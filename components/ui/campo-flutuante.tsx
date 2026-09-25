// Página original (21st.dev): https://21st.dev/@ddoemonn/components/floating-label
// Licença: MIT, Copyright (c) 2026 ozzy. Créditos completos em CREDITOS.md.
'use client';

import {useId, useState, type ReactNode, type Ref} from 'react';
import {motion} from 'framer-motion';
import {useReducedMotion} from '@/lib/movimento-reduzido';
import {cn} from '@/lib/utils';

/* Origem: 21st.dev, "Floating Label" de ddoemonn (demo 23566), escolhido
 * pelo diretor para os campos do formulário final da landing do guia. O
 * rótulo sobe para um espaço JÁ RESERVADO acima do campo em vez de sumir
 * (nunca vira placeholder), com mola curta, só transform; foco e preenchido
 * mantêm o rótulo em cima; linha de dica ligada por `aria-describedby`.
 * Posse do movimento: o Framer daqui de dentro. A animação entra INTEIRA.
 *
 * Passada de tokens e simplificações de uso:
 * 1. Caixa de 48px, raio 8px, borda Lápis que vira latão no foco com o traço
 *    de 3px embaixo (o foco da casa), fundo branco, texto Tinta em Satoshi
 *    15px. Saíram o azul, o cinza-pedra e o asterisco de obrigatório.
 * 2. "Preenchido" é DERIVADO, não guardado em efeito: controlado, do próprio
 *    `value`; sem controle, de um estado que só o `onChange` toca. O autor
 *    media o campo num layout effect, que a lei do compilador não deixa.
 * 3. `initial={false}` no rótulo: no primeiro render ele já está no lugar
 *    certo, sem animar (o "instant" do autor).
 * 4. Movimento reduzido: o rótulo troca de lugar sem mola.
 * 5. `realce` é um espaço para uma marca dentro da caixa (a landing usa para
 *    dizer "recebi" quando o e-mail chega da hero). */

const MOLA = {type: 'spring', stiffness: 760, damping: 46, mass: 0.5} as const;
const INSTANTANEO = {duration: 0} as const;
const SOBE = -30;
const RECUA = -6;
const ENCOLHE = 0.86;

export function CampoFlutuante({
  rotulo,
  value,
  defaultValue,
  onChange,
  id,
  name,
  type = 'text',
  autoComplete,
  inputMode,
  required = false,
  dica,
  ref,
  className,
  realce,
  acento = 'latao'
}: {
  rotulo: string;
  value?: string;
  defaultValue?: string;
  onChange?: (valor: string) => void;
  id?: string;
  name?: string;
  type?: 'text' | 'email' | 'tel';
  autoComplete?: string;
  inputMode?: React.ComponentProps<'input'>['inputMode'];
  required?: boolean;
  dica?: string;
  /** React 19: o ref chega como prop comum e vai direto ao input. */
  ref?: Ref<HTMLInputElement>;
  className?: string;
  realce?: ReactNode;
  /** A cor do foco. Latão é EXCLUSIVO da landing do guia (lei do projeto); no site
   *  institucional (a inscrição do blog) o foco é Avanço. */
  acento?: 'latao' | 'avanco';
}) {
  const auto = useId();
  const idCampo = id ?? `${auto}-campo`;
  const idDica = `${auto}-dica`;
  const reduzido = useReducedMotion();

  const [focado, setFocado] = useState(false);
  const [preenchidoLocal, setPreenchidoLocal] = useState((defaultValue ?? '').length > 0);
  const preenchido = value !== undefined ? value.length > 0 : preenchidoLocal;
  const levantado = focado || preenchido;

  return (
    <div className={cn('w-full', className)}>
      <div className="relative pt-[22px]">
        <div
          className={cn(
            'relative h-12 overflow-hidden rounded-[8px] border border-lapis bg-white transition-[border-color,box-shadow] duration-200',
            acento === 'latao'
              ? 'focus-within:border-latao focus-within:shadow-[inset_0_-3px_0_0_var(--cor-latao)]'
              : 'focus-within:border-avanco focus-within:shadow-[inset_0_-3px_0_0_var(--cor-avanco)]'
          )}
        >
          <input
            ref={ref}
            id={idCampo}
            name={name}
            type={type}
            value={value}
            defaultValue={defaultValue}
            autoComplete={autoComplete}
            inputMode={inputMode}
            required={required}
            aria-required={required || undefined}
            aria-describedby={dica ? idDica : undefined}
            onFocus={() => setFocado(true)}
            onBlur={() => setFocado(false)}
            onChange={(e) => {
              if (value === undefined) setPreenchidoLocal(e.currentTarget.value.length > 0);
              onChange?.(e.currentTarget.value);
            }}
            className="absolute inset-0 h-full w-full bg-transparent px-4 pt-1 text-[15px] leading-none text-tinta outline-none focus-visible:outline-none"
          />
          {realce}
        </div>

        <motion.label
          htmlFor={idCampo}
          initial={false}
          animate={{y: levantado ? SOBE : 0, x: levantado ? RECUA : 0, scale: levantado ? ENCOLHE : 1}}
          transition={reduzido ? INSTANTANEO : MOLA}
          style={{originX: 0, originY: 0, willChange: 'transform'}}
          className={cn(
            'absolute left-4 top-[37px] block cursor-text select-none text-[15px] leading-none transition-colors duration-200',
            levantado ? 'text-grafite' : 'text-grafite/75'
          )}
        >
          {rotulo}
        </motion.label>
      </div>

      {dica ? (
        <p id={idDica} className="mt-1.5 text-[12px] leading-[1.4] text-grafite/85">
          {dica}
        </p>
      ) : null}
    </div>
  );
}
