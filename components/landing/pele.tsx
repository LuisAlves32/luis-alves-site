import {preconnect} from 'react-dom';
import './pele.css';

// Pela da landing do ebook (design.md, "Pele da landing"): Tinta dominante,
// latão SOMENTE em fio, número, kicker e no botão de latão (a exceção do
// roteiro). Este módulo só é importado pelas rotas do funil, então as fontes
// não entram no bundle do site. Instrument Serif, cota e barra NÃO entram aqui.
//
// ELENCO 7, "A MANHÃ" (decisão do diretor, 07/09/2026, com mock de seis
// candidatas renderizado com as fontes reais). Saíram a Melodrama e a Boska:
// duas serifas de display de contraste altíssimo na mesma página liam como
// revista de moda, e as hastes finas sumiam no celular a ponto de o peso ter
// que trocar por breakpoint. Entra a AUTHOR (Fontshare, Indian Type Foundry,
// gratuita para uso comercial; servida pela Fontshare desde 24/09): uma sans de baixo
// contraste com terminais próprios, exclusiva sem ser excêntrica, que a 56px
// tem a voz de consultoria contemporânea do brand guide e a 32px no celular
// continua firme com UM peso só. A Satoshi continua no corpo e na interface.
//
// O SITE continua em Inter e Instrument Serif. Este elenco é do FUNIL.
//
// DE ONDE AS FONTES VÊM (24/09/2026): da própria Fontshare, e não mais do
// repositório. A licença delas (ITF Free Font License) proíbe redistribuir o
// arquivo, e o repositório vai ser público. O porquê, a prova de que os
// arquivos são os mesmos e as métricas da fonte de reserva estão em pele.css.
//
// AUTHOR, display: 500 para títulos e números, 700 para a palavra em destaque
// da headline. SATOSHI, corpo e interface: 400, 500 e 700. Nenhum outro peso.
const FOLHA_FONTSHARE =
  'https://api.fontshare.com/v2/css?f[]=author@500,700&f[]=satoshi@400,500,700&display=swap';

export const fonteDisplay = 'font-[family-name:var(--fonte-display)]';
export const fonteCorpo = 'font-[family-name:var(--fonte-corpo)]';

/* A HEADLINE DO FUNIL: Author 500 em todos os breakpoints. A troca de peso por
   tela que a Melodrama exigia acabou com ela. Escrita por extenso porque o
   Tailwind v4 varre o código como texto e não monta classe por concatenação. */
export const headlineFunil = 'font-[family-name:var(--fonte-display)] font-medium';

/* A PALAVRA EM DESTAQUE dentro da headline: MESMA família, peso 700. A cor é
   do chamador, porque ela muda por tela (latão sobre Tinta, Tinta sobre o
   céu). Nada de segunda família para dar ênfase. */
export const fonteDestaqueHeadline = 'font-bold';

export function PeleLanding({children}: {children: React.ReactNode}) {
  // A folha é pequena e pede os arquivos ao cdn.fontshare.com: abrir as duas
  // conexões cedo tira a ida e volta de DNS e TLS do caminho da headline.
  preconnect('https://api.fontshare.com');
  preconnect('https://cdn.fontshare.com', {crossOrigin: 'anonymous'});
  return (
    <>
    {/* React 19 sobe a folha para o <head> por causa do `precedence`. */}
    <link rel="stylesheet" href={FOLHA_FONTSHARE} precedence="fontes-do-funil" />
    <div
      /* A fonte PADRÃO do funil é o corpo: todo parágrafo sem classe de fonte
         nasce em Satoshi 400. `relative` existe por causa do cabeçalho, que é
         absoluto por cima da hero e precisa de um bloco de contenção. */
      className={`pele-fontes ${fonteCorpo} relative bg-tinta text-papel antialiased`}
    >
      {children}
    </div>
    </>
  );
}

/* O KICKER: Satoshi 500, caixa alta, 12px, entreletra .18em, latão. É o rótulo
   do design.md, sem a barra (a landing não herda a assinatura do site). A cor
   pode ser trocada pelo chamador (na hero do celular ele fica em Tinta, porque
   latão sobre céu claro não passa em AA). */
export function KickerLanding({children, className = ''}: {children: React.ReactNode; className?: string}) {
  return (
    <p className={`${fonteCorpo} text-[12px] font-medium uppercase tracking-[0.18em] text-latao ${className}`}>
      {children}
    </p>
  );
}

// Fio de latão, a assinatura de linha desta pele.
export function FioLatao({className = ''}: {className?: string}) {
  return <span aria-hidden="true" className={`block h-px bg-latao/60 ${className}`} />;
}

/* A DIVISÃO DA HEADLINE em [antes, palavra, depois], para a palavra em
   destaque ganhar peso e cor sem marcação na string. A palavra é a MESMA nos
   dois idiomas ("real"). A divisão acontece no componente e não por tag no
   messages porque o acabamento de órfãs (i18n/request.ts) pula toda mensagem
   com `<`: enfiar uma tag na headline desligaria o NBSP que segura a última
   palavra dela. Se a palavra não estiver na frase (a headline alternativa de
   teste A/B não a tem), volta ['', '', titulo]: o chamador mostra tudo sem
   destaque. Degrada calado, nunca quebra. */
const PALAVRA_DESTAQUE = 'real';

export function dividirDestaque(titulo: string): [string, string, string] {
  const marca = new RegExp(`(^|\\s)(${PALAVRA_DESTAQUE})(?=\\s|$)`, 'i');
  const achado = marca.exec(titulo);
  if (!achado) return ['', '', titulo];
  const inicio = achado.index + achado[1].length;
  const fim = inicio + achado[2].length;
  return [titulo.slice(0, inicio), titulo.slice(inicio, fim), titulo.slice(fim)];
}

/* O MIOLO DO BOTÃO DE LATÃO: preenchimento, glifo, resposta ao ponteiro. Sem
   foco aqui, de propósito: cada consumidor declara o próprio anel, porque um
   `shadow-*` por elemento é a regra (vencedor indefinido com dois). */
export const preenchimentoLatao = `bg-latao text-tinta transition duration-200 hover:brightness-95 active:scale-[0.98]`;

export const botaoLatao = `${fonteCorpo} ${preenchimentoLatao} inline-flex min-h-[52px] w-full items-center justify-center rounded-[8px] px-7 text-center text-[15px] font-bold focus-visible:outline-none focus-visible:shadow-[0_3px_0_0_var(--cor-tinta)] sm:w-auto`;

// CTA secundário sobre o papel creme.
export const botaoContornoTinta = `${fonteCorpo} inline-flex min-h-[52px] w-full items-center justify-center rounded-[8px] border-[1.5px] border-tinta px-7 text-center text-[15px] font-medium text-tinta transition duration-200 hover:bg-tinta hover:text-papel active:scale-[0.98] sm:w-auto`;

// CTA secundário sobre a Tinta (o bloco da simulação).
export const botaoContornoPapel = `${fonteCorpo} inline-flex min-h-[52px] w-full items-center justify-center rounded-[8px] border-[1.5px] border-papel/70 px-7 text-center text-[15px] font-medium text-papel transition duration-200 hover:bg-papel hover:text-tinta active:scale-[0.98] focus-visible:outline-none focus-visible:shadow-[0_3px_0_0_var(--cor-latao)] sm:w-auto`;
