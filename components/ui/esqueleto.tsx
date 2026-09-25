const LARGURAS = ['w-full', 'w-full', 'w-3/4', 'w-5/6', 'w-2/3'];

// Linhas esqueléticas do Passe 1 para copy pendente: o bloco existe na
// estrutura, o texto ainda não existe no roteiro.md.
export function LinhasEsqueleto({
  linhas = 3,
  className = ''
}: {
  linhas?: number;
  className?: string;
}) {
  return (
    <span aria-hidden="true" className={`block space-y-2.5 ${className}`}>
      {Array.from({length: linhas}, (_, i) => (
        <span
          key={i}
          className={`block h-3 rounded-full bg-lapis/50 ${LARGURAS[i % LARGURAS.length]}`}
        />
      ))}
    </span>
  );
}
