// Card padrão "ficha com cota" (design.md): fundo branco, borda 1px lápis,
// raio 12px, SEM sombra. A cota Avanço (44x3px) entra pela borda superior,
// alinhada à esquerda do conteúdo. Hover: a borda vira Avanço em 200ms.
export function CardFicha({
  children,
  className = ''
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`group relative rounded-[12px] border border-lapis bg-white p-7 transition-colors duration-200 hover:border-avanco lg:p-8 ${className}`}
    >
      {/* A cota da borda superior. Com data-cota ela nasce traçada pela câmera
          global (caligrafia 1). Nas seções com [data-owner] (depoimentos,
          processo de venda) a câmera não entra e a cota fica inteira, que é o
          comportamento certo: lá o dono do movimento é o componente. */}
      <span
        data-cota
        aria-hidden="true"
        className="absolute -top-px left-7 h-[3px] w-11 rounded-b-full bg-avanco lg:left-8"
      />
      {children}
    </div>
  );
}
