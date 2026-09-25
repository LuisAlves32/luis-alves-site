// A CALHA (rodada F2, 05/09/2026): o tratamento do VALE, do bloco de conteúdo
// que se repete numa página interna.
//
// O DEFEITO QUE ELA RESOLVE, medido no reconhecimento da F0: em 1510px as
// seções de texto corrido das internas usavam 697 de 1200px de calha e
// deixavam 503px de vazio à direita. Não era ar composto, era coluna de texto
// encostada à esquerda numa tela larga. A calha dá forma a esse ar: o conteúdo
// entra e a régua o delimita.
//
// REGRA DE USO, e ela importa mais que o componente: a calha é o tratamento do
// VALE. Bloco que já tem identidade própria (cor quente, mídia, mecânica) é
// PICO e fica FORA. Se todo bloco receber a calha, a calha vira a monotonia
// nova e a rodada terá trocado um problema por outro. Ficaram de fora, e cada
// um por um motivo: `comprar-first-home` (é o único bloco quente da página, em
// Areia, com chips e botão), `presales-perfil` (já é duas colunas com a foto),
// `vender-processo` (tem mecânica própria), os cabeçalhos (têm a palavra-
// fantasma e o h1), os formulários, a FAQ, o CtaFinal e o rodapé (são objetos,
// não blocos de conteúdo).
//
// A CONSTRUÇÃO OBEDECE A REGRA DURA DO design.md (linha 80, "aceite do Passe 1"
// de 28/08, REFORÇADA em 29/08): "a cota NUNCA aparece como traço solto
// flutuando ao lado de texto; ela só existe ancorada a um elemento: sublinhado
// de palavra, borda superior de card, LINHA DE SEÇÃO, FIO QUE CONECTA A
// TIMELINE, foco de teclado."
// Por isso a cota daqui NÃO flutua: ela entra por um FIO de 1px em Lápis, que é
// a "versão silenciosa" que o próprio design.md nomeia. É a mesma construção do
// bloco Venda da home e da página de Política de Privacidade, girada noventa
// graus. A primeira versão desta rodada tinha a cota solta na calha e foi
// recusada por violar essa regra.
//
// A ALTURA É A DO CONTEÚDO, NUNCA A DA SEÇÃO. O fio mora numa célula de grade
// que estica até a altura da linha, e a linha é o conteúdo. Se fosse a da
// seção, o py-secao de 96px uniforme faria dois blocos seguidos produzirem uma
// vertical quase contínua descendo a página: isso não seria uma régua, seria
// uma calha de página, e seria a monotonia nova.
import type {ReactNode} from 'react';

export function Calha({
  children,
  className = ''
}: {
  children: ReactNode;
  /** Acrescentado ao envelope da grade. */
  className?: string;
}) {
  return (
    <div className={`lg:grid lg:grid-cols-[210px_minmax(0,1fr)] lg:gap-12 ${className}`.trim()}>
      {/* A RÉGUA. Decorativa: aria-hidden. Isso também a mantém fora da entrada
          suave da câmera, que já exclui tudo sob [aria-hidden] e todo
          [data-cota] (ver `estaLivre` em components/camera.tsx). */}
      <div aria-hidden="true" className="relative">
        {/* MOBILE (abaixo de lg): sem calha, não há 210px para gastar. A cota
            vira horizontal e curta acima do h2, que é o gesto que os cards do
            bloco de processo já usam. O fio de Lápis NÃO entra aqui: uma
            horizontal de 1px atravessando acima do título viraria divisória de
            seção, que é outra coisa e o site já tem. */}
        <span data-cota className="mb-6 block h-[3px] w-11 rounded-full bg-avanco lg:hidden" />

        {/* DESKTOP: o fio de 1px em Lápis na borda direita da calha, e a cota
            entrando por ele no topo.
            `top-1.5` (6px) alinha o começo do fio à altura de maiúscula do h2,
            e não ao topo da caixa de linha: a régua marca onde o texto começa a
            ser visto, não onde o line-box abre.
            `data-cota="vertical"` é o mecanismo que JÁ EXISTIA no globals.css
            (scaleY a partir de center top) e nunca tinha sido implantado. Usar
            o que existe em vez de escrever um paralelo: dois mecanismos para a
            mesma coisa é como o projeto acumula dívida. */}
        <div
          data-cota="vertical"
          className="absolute bottom-0 right-0 top-1.5 hidden w-px bg-lapis lg:block"
        >
          {/* A cota, CENTRADA no fio: 3px sobre 1px, com -1px de deslocamento,
              para ler como engrossamento da linha e não como uma segunda linha
              ao lado dela.
              A altura é UMA LINHA DO h2, por construção e não por número
              chutado: é o próprio `clamp` do h2 (globals.css) vezes o
              line-height de 1,12. Assim ela acompanha o h2 em qualquer largura
              em vez de descolar dele. */}
          <span className="absolute -left-px top-0 block w-[3px] rounded-full bg-avanco h-[calc(clamp(1.7rem,3.2vw,2.4rem)*1.12)]" />
        </div>
      </div>

      <div>{children}</div>
    </div>
  );
}
