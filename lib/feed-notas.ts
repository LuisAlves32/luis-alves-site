import 'server-only';
import {getPathname} from '@/i18n/navigation';
import {siteUrl} from '@/lib/seo';
import {notasPublicadas, type IdiomaNota} from '@/lib/notas';

/**
 * O FEED RSS DO SECOND OPINION, um por idioma (blog/newsletter.md).
 *
 * É daqui que o envio automático da newsletter lê cada nota nova (o cron do Resend), e
 * serve também a quem lê por leitor de RSS. SÓ notas "Pronto para publicar": rascunho
 * nunca entra no feed, porque entrar no feed é entrar no e-mail de todos os inscritos.
 * O `guid` é o endereço da nota, e não muda depois de publicado: é ele que impede o
 * mesmo texto de sair duas vezes.
 */

const escapar = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const NOME: Record<IdiomaNota, {titulo: string; descricao: string; caminho: string}> = {
  en: {
    titulo: 'Second Opinion, by Luis Alves REALTOR®',
    descricao: 'One real estate number for Greater Vancouver every two weeks, with its source and what to ask before you sign.',
    caminho: '/notes/feed.xml'
  },
  pt: {
    titulo: 'Segunda Opinião, por Luis Alves REALTOR®',
    descricao: 'Um número do mercado imobiliário de Greater Vancouver a cada duas semanas, com a fonte e o que perguntar antes de assinar.',
    caminho: '/notes/feed-pt.xml'
  }
};

/** Data de publicação no formato do RSS (RFC 822), ao meio-dia de Vancouver. */
function dataRss(iso: string): string {
  const [a, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(a, m - 1, d, 19, 0, 0)).toUTCString();
}

export async function feedDasNotas(idioma: IdiomaNota): Promise<Response> {
  const notas = (await notasPublicadas()).filter((n) => n.idioma === idioma);
  const n = NOME[idioma];
  const listagem = siteUrl + getPathname({locale: idioma, href: '/notes'});
  const itens = notas
    .map((nota) => {
      const url = siteUrl + getPathname({locale: idioma, href: {pathname: '/notes/[slug]', params: {slug: nota.slug}}});
      const numero = nota.numero ? `${nota.numero}. ` : '';
      return `    <item>
      <title>${escapar(nota.titulo)}</title>
      <link>${escapar(url)}</link>
      <guid isPermaLink="true">${escapar(url)}</guid>
      <pubDate>${dataRss(nota.publicado)}</pubDate>
      <category>${escapar(nota.categoria)}</category>
      <description>${escapar(numero + nota.resumo)}</description>
    </item>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapar(n.titulo)}</title>
    <link>${escapar(listagem)}</link>
    <description>${escapar(n.descricao)}</description>
    <language>${idioma === 'pt' ? 'pt-BR' : 'en-CA'}</language>
    <atom:link href="${escapar(siteUrl + n.caminho)}" rel="self" type="application/rss+xml" />
${itens}
  </channel>
</rss>
`;
  return new Response(xml, {
    headers: {'Content-Type': 'application/rss+xml; charset=utf-8', 'Cache-Control': 'public, max-age=0, s-maxage=3600'}
  });
}
