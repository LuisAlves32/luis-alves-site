// Forma-assinatura (design.md): A BARRA, o traço inclinado do símbolo L/.
// Infiltra marcadores de lista, kickers e o separador de idioma.
export function Barra({className = ''}: {className?: string}) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block h-[0.9em] w-[3px] shrink-0 -skew-x-[24deg] rounded-full bg-avanco ${className}`}
    />
  );
}

// Kicker assinatura: barra + texto em caixa alta, tracking .18em (design.md).
export function Kicker({
  children,
  className = ''
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={`flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-tinta ${className}`}
    >
      <Barra />
      <span>{children}</span>
    </p>
  );
}
