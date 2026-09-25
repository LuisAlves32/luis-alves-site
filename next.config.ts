import type {NextConfig} from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const nextConfig: NextConfig = {
  // O painel do blog (`/keystatic`) se abre por 127.0.0.1 no desenvolvimento: sem esta linha o Next
  // bloqueia os recursos e a página fica em branco (lição da Cora, skill `blog-com-painel`).
  allowedDevOrigins: ['127.0.0.1'],

  /**
   * A SEGUNDA CAMADA que mantém os PDFs do guia fora da busca. A primeira é o
   * `Disallow` de `app/robots.ts`, e o motivo das duas está escrito lá: PDF
   * indexado aparece NO LUGAR da landing e a pessoa baixa o guia sem passar
   * pelo formulário.
   *
   * SEJA HONESTO SOBRE O QUE CADA UMA FAZ, porque elas não são intercambiáveis
   * e nem se cobrem inteiramente:
   *   . o robots.txt impede o RASTREAMENTO. Robô que obedece nunca lê o
   *     arquivo, então o conteúdo do guia não entra no índice.
   *   . este cabeçalho impede a INDEXAÇÃO de quem BAIXOU o arquivo assim mesmo:
   *     rastreador que ignora robots.txt, raspador de IA que respeita
   *     X-Robots-Tag, e o dia em que alguém afrouxar o Disallow sem lembrar
   *     desta linha.
   *
   * O RESÍDUO, que nenhuma das duas resolve e é bom saber que existe: uma URL
   * bloqueada no robots.txt e apontada por link externo ainda pode ser listada
   * pelo Google SÓ COMO URL, sem título nem trecho, porque para ler o `noindex`
   * ele precisaria buscar o arquivo, e o robots.txt o proíbe. Tirar até isso
   * exigiria liberar o rastreamento e confiar apenas no cabeçalho. Não vale a
   * troca: uma URL nua na busca não entrega o guia a ninguém.
   *
   * Isto NÃO é proteção. Quem tem a URL baixa, de propósito (roteiro.md: link
   * direto, sem obrigar a esperar o e-mail).
   */
  async headers() {
    return [
      {
        // `:arquivo` com regex casa qualquer `.pdf` sob /guia/, hoje os dois do
        // guia e amanhã o que vier, sem precisar mexer aqui de novo.
        source: '/guia/:arquivo(.*\\.pdf)',
        headers: [{key: 'X-Robots-Tag', value: 'noindex, nofollow'}]
      },
      {
        // O ENDEREÇO DE TESTE FORA DA BUSCA, por HOST (Passe 4, peça do acervo
        // `passe-4-a-praca`). O `.vercel.app` responde 200 e serve o site inteiro:
        // sem isto ele vira conteúdo duplicado do luisrealtor.ca. Por cabeçalho
        // e não por `meta`, porque a meta obrigaria a página a saber o host e
        // mataria a pré-renderização de todas as rotas. NÃO redirecionar o
        // `.vercel.app` para o domínio: é a prévia de cada implantação.
        // `index: false` cravado no código seria a bomba-relógio: no dia do
        // domínio o site continuaria fora do Google e ninguém lembraria.
        source: '/:path*',
        has: [{type: 'host', value: '(?<previa>.*\\.vercel\\.app)'}],
        headers: [{key: 'X-Robots-Tag', value: 'noindex, nofollow'}]
      }
    ];
  },

  // O guia passa a ter UMA porta só: a landing do funil. A página
  // /first-home-guide era um esqueleto (reaproveitava o bloco 11 da home numa
  // URL separada) e saiu no 2.32, com a rota fora de i18n/routing.ts.
  // O site ainda não lançou, mas o link pode já ter sido mandado para alguém,
  // e redirect é barato. 308 e não 301 porque o Next preserva o método.
  // As DUAS grafias localizadas apontam para a grafia correspondente da
  // landing. Estes redirects rodam ANTES do proxy do next-intl (ordem
  // documentada em next/docs: headers, redirects, proxy), então a rota antiga
  // nunca chega ao 404.
  async redirects() {
    return [
      {source: '/first-home-guide', destination: '/real-cost-guide', permanent: true},
      {
        source: '/pt/guia-primeiro-imovel',
        destination: '/pt/guia-custo-real',
        permanent: true
      },
      // O prefixo /en existiu enquanto a rota existia (localePrefix as-needed
      // aceita a forma prefixada e redireciona para a limpa). Sem esta linha,
      // um link com /en cairia no 404 em vez de na landing.
      {source: '/en/first-home-guide', destination: '/real-cost-guide', permanent: true},

      // A página de IMÓVEIS saiu do site no 2.39 e está guardada em
      // _arquivo/listings/ (ver _arquivo/README.md). Ela dependia da
      // integração MLS/IDX da Stonehaus, que segue pendente, e por isso vivia
      // de listing esquelético. O site já esteve em produção, então a URL pode
      // ter sido aberta ou indexada: as três grafias caem na home em vez do
      // 404. A PT vai para /pt, e não para /, para não trocar o idioma de quem
      // clicou (mesmo critério dos três redirects do guia acima).
      {source: '/listings', destination: '/', permanent: true},
      {source: '/pt/imoveis', destination: '/pt', permanent: true},
      {source: '/en/listings', destination: '/', permanent: true},
      // As DUAS grafias cruzadas também existiam, e isto foi MEDIDO com a rota
      // viva /buying como controle: /comprar responde 307 para /buying, e
      // /pt/buying responde 307 para /pt/comprar. Ou seja, o next-intl servia
      // QUATRO formas por rota, não três, então sem estas duas linhas as duas
      // últimas grafias de imóveis cairiam em 404.
      {source: '/imoveis', destination: '/', permanent: true},
      {source: '/pt/listings', destination: '/pt', permanent: true}
    ];
  },

  // A ZONA DOS IMÓVEIS (15/09/2026, pedido do Gabriel para mostrar ao Luis sem domínio novo): cada landing de listing
  // mora no projeto homes-luis-alves da Vercel (Produtos/landing-de-listing/codigo, com basePath /homes) e aparece
  // aqui como luisrealtor.ca/homes/<listing>. Tudo que começa com /homes vai para lá: a página, os arquivos, as
  // imagens e a rota do lead. beforeFiles, para nenhuma rota deste site responder antes. O proxy.ts deixa /homes de
  // fora do next-intl, senão ele responderia 404 primeiro.
  async rewrites() {
    return {
      beforeFiles: [
        {source: '/homes', destination: 'https://homes-luis-alves.vercel.app/homes'},
        {source: '/homes/:caminho*', destination: 'https://homes-luis-alves.vercel.app/homes/:caminho*'}
      ],
      afterFiles: [],
      fallback: []
    };
  }
};

const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
