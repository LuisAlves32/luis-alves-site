const PROPORCOES = {
  '4:5': 'aspect-[4/5]',
  '3:2': 'aspect-[3/2]',
  '3:4': 'aspect-[3/4]',
  '16:10': 'aspect-[16/10]'
} as const;

// Placeholder mudo do Passe 1: bloco céu com a proporção correta e um rótulo
// do que entra ali no Passe 2. Morre quando a mídia real chegar.
export function PlaceholderMidia({
  proporcao,
  rotulo,
  raio = 'rounded-[16px]',
  className = ''
}: {
  proporcao: keyof typeof PROPORCOES;
  rotulo: string;
  raio?: string;
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={`${PROPORCOES[proporcao]} ${raio} flex items-end border border-lapis/60 bg-ceu p-4 ${className}`}
    >
      <span className="text-xs tracking-wide text-grafite/60">{rotulo}</span>
    </div>
  );
}
