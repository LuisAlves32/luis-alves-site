// Palavra-fantasma do topo das páginas internas (movimento.md): o título da
// página em Tinta a 4% de opacidade atrás do cabeçalho. O tamanho cede pelo
// comprimento da palavra, senão "Pré-construção" estoura a moldura.
export function FantasmaPagina({palavra}: {palavra: string}) {
  const tamanho = `min(12rem, ${(92 / (palavra.length * 0.62)).toFixed(1)}vw)`;
  return (
    <span
      data-camada="fundo"
      aria-hidden="true"
      className="pointer-events-none absolute left-1/2 top-6 -translate-x-1/2 select-none whitespace-nowrap font-extrabold uppercase leading-none tracking-[-0.02em] text-tinta opacity-[0.04]"
      style={{fontSize: tamanho}}
    >
      {palavra}
    </span>
  );
}
