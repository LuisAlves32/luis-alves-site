import type {MetadataRoute} from 'next';
import {siteUrl} from '@/lib/seo';

// Gerado pelo framework, nunca à mão (regra do projeto). A lista nomeada de
// robôs de IA entra no Passe 4 (skill seo-e-medicao).
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      /**
       * OS PDFs DO GUIA FORA DA BUSCA, e isto não é detalhe de SEO: é o funil.
       *
       * Um PDF solto em `public/` é indexável como qualquer página. Indexado,
       * ele passa a aparecer na busca NO LUGAR da landing, e a pessoa baixa o
       * material sem nunca passar pelo formulário. O ativo vira gratuito e o
       * funil deixa de capturar, que é a única coisa que ele faz.
       *
       * SEJA HONESTO: isto NÃO é proteção, é HIGIENE DE BUSCA. Quem tiver a URL
       * baixa, e é assim DE PROPÓSITO: o roteiro.md decidiu link direto na
       * página de obrigado para ninguém ter que esperar e-mail, e essa decisão
       * continua valendo. O que se evita aqui é o PDF roubar o lugar da landing
       * no Google.
       *
       * O padrão cobre só os `.pdf` de `/guia/`, e não a pasta inteira, porque
       * ali também moram as capas `.webp` que a home e a landing exibem. Essas
       * podem e devem ser rastreadas.
       *
       * `*` e `$` são extensões do padrão original do robots.txt, mas Google e
       * Bing as suportam há anos. A segunda camada (o `X-Robots-Tag` do
       * `next.config.ts`) é o que segura quem não entende curinga.
       */
      disallow: '/guia/*.pdf$'
    },
    sitemap: `${siteUrl}/sitemap.xml`
  };
}
