// Página original (21st.dev): https://21st.dev/@ishamsu/components/scroll-cards
// Licença: sem licença declarada pelo autor; usado com crédito, conforme os termos do 21st.dev. Créditos completos em CREDITOS.md.
// Origem: 21st.dev, "Scroll Cards" de ishamsu (demo 2077), escolhido pelo
// diretor para o processo do Selling (Passe 2). A mecânica do componente é
// position: sticky puro: os cards se empilham conforme a PÁGINA rola, no
// ritmo do leitor; nada intercepta, prende ou acelera a rolagem (movimento.md
// proíbe scroll-hijack; aqui não existe nem JS). A seção que usa esta pilha
// tem dono de movimento (data-owner="catalogo"); o GSAP do Passe 3 não toca.
//
// Passada de tokens sobre o original: sem imagem de fundo, sem sombra, sem
// cor arbitrária; os cards são a nossa ficha e chegam prontos via props.
// As molduras de 100vh do original viraram 60svh: mesma mecânica de
// empilhamento, metade da rolagem (seis viewports inteiros para seis títulos
// esticariam a página).
// Reduced-motion (variante CSS motion-reduce, sem JS): as molduras deixam de
// ser sticky e viram lista vertical estática com o mesmo conteúdo integral.
export function CardsRolagem({
  cards,
  className = ''
}: {
  cards: React.ReactNode[];
  className?: string;
}) {
  return (
    <div className={className}>
      {cards.map((card, i) => (
        <div
          key={i}
          className="sticky top-[20svh] flex h-[60svh] min-h-[300px] items-center justify-center motion-reduce:static motion-reduce:h-auto motion-reduce:min-h-0 motion-reduce:py-3"
        >
          {card}
        </div>
      ))}
    </div>
  );
}
