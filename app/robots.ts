import type {MetadataRoute} from 'next';
import {siteUrl} from '@/lib/seo';

// Gerado pelo framework, nunca à mão (regra do projeto).
//
// OS ROBÔS DE IA NOMEADOS UM A UM (Passe 4, skill seo-e-medicao). Não muda
// comportamento: o `*` já os cobre. Está aqui para DOCUMENTAR A INTENÇÃO, e para
// quem endurecer este arquivo daqui a um ano ver o que está desligando. Conferido
// em 25/09/2026: GPTBot e ClaudeBot recebem 200 do host.
// ATENÇÃO À REGRA DO robots.txt: robô que tem grupo PRÓPRIO ignora o grupo `*`.
// Por isso os dois grupos leem as MESMAS listas.
const ROBOS_DE_IA = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-User',
  'PerplexityBot',
  'Google-Extended',
  'Bingbot',
  'Applebot-Extended'
];

// `/api/` recebe pedido, não tem o que indexar. As EXCEÇÕES são as capas de
// compartilhamento: `/api/capa/` (das notas, e a `image` do BlogPosting) e
// `/api/compartilhar/` (a do site e a da landing do guia). Robô de prévia de link precisa buscá-las.
// `/keystatic` é o painel do Luís.
const LIBERADO = ['/', '/api/capa/', '/api/compartilhar/'];

/**
 * OS PDFs DO GUIA FORA DA BUSCA (`/guia/*.pdf$`), e isto não é detalhe de SEO:
 * é o funil.
 *
 * Um PDF solto em `public/` é indexável como qualquer página. Indexado, ele
 * passa a aparecer na busca NO LUGAR da landing, e a pessoa baixa o material
 * sem nunca passar pelo formulário. O ativo vira gratuito e o funil deixa de
 * capturar, que é a única coisa que ele faz.
 *
 * SEJA HONESTO: isto NÃO é proteção, é HIGIENE DE BUSCA. Desde 24/09/2026 os
 * PDFs moram no Blob e a entrega passa por `/api/guia`; a linha fica para o
 * caso de a cópia local (`public/guia/`, sem as variáveis do Blob) servir.
 *
 * O padrão cobre só os `.pdf` de `/guia/`, e não a pasta inteira, porque ali
 * também moram as capas `.webp` que a home e a landing exibem.
 *
 * `*` e `$` são extensões do padrão original do robots.txt, mas Google e Bing as
 * suportam há anos. A segunda camada (o `X-Robots-Tag` do `next.config.ts`) é o
 * que segura quem não entende curinga.
 */
const FECHADO = ['/api/', '/keystatic', '/guia/*.pdf$'];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {userAgent: '*', allow: LIBERADO, disallow: FECHADO},
      {userAgent: ROBOS_DE_IA, allow: LIBERADO, disallow: FECHADO}
    ],
    sitemap: `${siteUrl}/sitemap.xml`
  };
}
