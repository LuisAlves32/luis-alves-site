import {ArrowRight} from 'lucide-react';

// Componentes-assinatura de CTA (design.md): raio 8px, SEM sombra, altura
// mínima 52px no mobile (48 no desktop), largura total no mobile. Hover do
// primário escurece um passo e a seta avança 3px; active scale .98.
const botaoBase =
  'group inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-[8px] px-7 text-center text-[15px] font-semibold transition duration-200 active:scale-[0.98] sm:min-h-12 sm:w-auto';

export const botaoPrimario = `${botaoBase} bg-avanco text-white hover:bg-avanco-escuro focus-visible:shadow-[0_3px_0_0_var(--cor-tinta)]`;

export const botaoSecundario = `${botaoBase} border-[1.5px] border-tinta text-tinta hover:bg-tinta hover:text-papel`;

// LINK SOZINHO, servindo de alvo de toque: é por isso que ele tem inline-flex,
// min-h-11 (os 44px do alvo) e tamanho próprio. Use quando o link é o único
// conteúdo da linha, como o "Past sales · REW.ca" de vendidos-home.tsx.
export const linkDiscreto =
  'inline-flex min-h-11 items-center gap-1.5 text-[15px] font-medium text-grafite underline decoration-lapis underline-offset-4 transition-colors duration-200 hover:text-tinta hover:decoration-avanco';

// LINK NO MEIO DE UMA FRASE. Mesma aparência do de cima, sem o que serve ao
// alvo de toque: sem inline-flex, sem min-h-11, sem items-center, sem gap e sem
// tamanho próprio, então ele herda o tamanho do texto em volta.
// MEDIDO em 05/09/2026, e é o motivo de esta classe existir: o linkDiscreto
// dentro de um parágrafo text-sm (line-height 20px) inflava AQUELA linha para
// 44px e renderizava 1px maior que o texto vizinho. Link em meio de frase não é
// alvo isolado, então os 44px não se aplicam; a regra continua valendo para os
// botões, que seguem em 52px.
// Vai se repetir: a linha de consentimento CASL da landing e o consentTexto do
// formulário do guia são frase com link dentro, iguais a este caso.
export const linkNoTexto =
  'font-medium text-grafite underline decoration-lapis underline-offset-4 transition-colors duration-200 hover:text-tinta hover:decoration-avanco';

// Link de ação dentro de card (grupo próprio para a seta não depender do
// hover do card inteiro).
export const linkAcao =
  'group/acao inline-flex min-h-11 items-center gap-1.5 text-[15px] font-semibold text-avanco transition-colors duration-200 hover:text-avanco-escuro';

export function Seta({className = ''}: {className?: string}) {
  return (
    <ArrowRight
      aria-hidden="true"
      strokeWidth={1.5}
      className={`size-[18px] shrink-0 transition-transform duration-200 ${className}`}
    />
  );
}
