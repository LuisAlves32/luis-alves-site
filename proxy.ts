import createMiddleware from 'next-intl/middleware';
import type {NextRequest} from 'next/server';
import {routing} from './i18n/routing';

/**
 * DETECÇÃO DE IDIOMA SÓ NA RAIZ DO DOMÍNIO.
 *
 * O DEFEITO, medido em produção em 04/09/2026: com `localeDetection` ligado em
 * todo caminho, o next-intl consultava o cookie e o `accept-language` em
 * QUALQUER rota sem prefixo. Consequência:
 *   /real-cost-guide  com accept-language pt-BR   -> 307 para /pt/guia-custo-real
 *   /real-cost-guide  com cookie NEXT_LOCALE=pt   -> 307, mesmo em navegador EN
 * Ou seja, as URLs em inglês NÃO eram estáveis, e as em /pt eram. Isso quebra
 * link de campanha, quebra link de revisão mandado ao cliente, e faz o cookie
 * sequestrar link direto: a pessoa clica num endereço em inglês e cai em outro.
 *
 * O CONSERTO usa a opção documentada `localeDetection` do próprio next-intl,
 * com DOIS manipuladores, e não lógica de redirecionamento escrita à mão:
 *   "/"            -> detecção LIGADA: cookie e navegador escolhem o idioma.
 *   qualquer outra -> detecção DESLIGADA: manda o caminho, e só ele.
 *
 * POR QUE ISSO BASTA, e está no `resolveLocale` do next-intl: a resolução tem
 * quatro prioridades, e só a 2 (cookie) e a 3 (accept-language) dependem de
 * `localeDetection`. A prioridade 1, o PREFIXO do caminho, roda sempre. Então
 * com a detecção desligada `/pt/vender` continua PT pelo prefixo, e `/selling`,
 * que não tem prefixo, cai na prioridade 4, o `defaultLocale`, sem redirecionar.
 *
 * O SELETOR DE IDIOMA NÃO MUDA e continua gravando o cookie. Ele usa o `Link`
 * do next-intl com a prop `locale`, e essa troca escreve o `NEXT_LOCALE` NO
 * CLIENTE (`navigation/shared/syncLocaleCookie`), sem depender deste arquivo. O
 * cookie passa a valer para a próxima visita à RAIZ, que é o que se queria: ele
 * lembra a escolha, não sequestra endereço.
 *
 * EFEITO COLATERAL QUE VALE SABER: o `syncCookie` do middleware não depende de
 * `localeDetection`, então ele continua alinhando o cookie ao idioma servido em
 * toda navegação de documento. Quem tem o cookie em `pt` e abre um link em
 * inglês agora É SERVIDO EM INGLÊS (que é o pedido) e tem o cookie reescrito
 * para `en`. O cookie passa a guardar o último idioma LIDO, e não a última
 * escolha explícita no seletor.
 */

// Raiz: detecta, como sempre detectou.
const naRaiz = createMiddleware(routing);

// Todo o resto: o caminho é a única fonte do idioma.
const nasDemais = createMiddleware({...routing, localeDetection: false});

export default function proxy(request: NextRequest) {
  // `nextUrl.pathname` ignora a query, então "/?utm_source=x" também é a raiz.
  const ehRaiz = request.nextUrl.pathname === '/';
  return (ehRaiz ? naRaiz : nasDemais)(request);
}

export const config = {
  // Tudo, exceto rotas internas do Next, arquivos estáticos, API e /homes. O /homes é a ZONA DOS IMÓVEIS: as
  // landings de listing moram num projeto próprio na Vercel (Produtos/landing-de-listing, multi-zone do Next) e
  // chegam aqui pela regra de rota do next.config.ts. Sem esta exclusão, o next-intl trataria /homes/silverbrook
  // como página deste site e responderia 404 antes da regra (15/09/2026).
  // `keystatic` é o painel do blog (Second Opinion): ferramenta, não página, fora do idioma (24/09/2026).
  // `guia-do-painel` é o guia dele, uma página estática em public/ (25/09/2026).
  matcher: '/((?!api|trpc|_next|_vercel|homes|keystatic|guia-do-painel|.*\\..*).*)'
};
