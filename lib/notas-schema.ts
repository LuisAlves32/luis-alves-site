import 'server-only';
import {getPathname} from '@/i18n/navigation';
import {ID_DO_AGENTE, siteUrl} from '@/lib/seo';
import type {Nota} from '@/lib/notas';

/**
 * OS DADOS ESTRUTURADOS DO SECOND OPINION (skill seo-e-medicao), fonte única do blog.
 *
 * `Blog` na listagem e `BlogPosting` em cada nota. O autor é o Luís, com o `@id` da
 * pessoa: o grafo do site (lib/dados-estruturados.ts, Passe 4) usa o MESMO `@id` e os
 * dois se reconhecem. Nada de avaliação ou estrela aqui.
 */

export const ID_DO_LUIS = `${siteUrl}/about#luis-alves`;

/** A capa de compartilhamento da nota, desenhada pelo código (app/api/capa/[slug]). */
export const capaDaNota = (slug: string) => `${siteUrl}/api/capa/${slug}`;

const autor = {
  '@type': 'Person',
  '@id': ID_DO_LUIS,
  name: 'Luis Alves',
  jobTitle: 'REALTOR®',
  // O negócio do grafo do site (lib/dados-estruturados.ts), que liga à Stonehaus.
  worksFor: {'@id': ID_DO_AGENTE},
  url: `${siteUrl}/about`
};

export function schemaDoBlog(locale: 'en' | 'pt', nome: string, descricao: string, notas: Nota[]) {
  const url = siteUrl + getPathname({locale, href: '/notes'});
  return {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    '@id': `${url}#blog`,
    name: nome,
    description: descricao,
    url,
    inLanguage: locale === 'pt' ? 'pt-BR' : 'en-CA',
    author: autor,
    blogPost: notas.slice(0, 20).map((n) => ({
      '@type': 'BlogPosting',
      headline: n.titulo,
      url: siteUrl + getPathname({locale: n.idioma, href: {pathname: '/notes/[slug]', params: {slug: n.slug}}}),
      datePublished: n.publicado
    }))
  };
}

export function schemaDaNota(nota: Nota, nomeDoBlog: string) {
  const url = siteUrl + getPathname({locale: nota.idioma, href: {pathname: '/notes/[slug]', params: {slug: nota.slug}}});
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': `${url}#nota`,
    headline: nota.titulo,
    description: nota.descricaoGoogle || nota.resumo,
    url,
    mainEntityOfPage: url,
    image: capaDaNota(nota.slug),
    inLanguage: nota.idioma === 'pt' ? 'pt-BR' : 'en-CA',
    datePublished: nota.publicado,
    dateModified: nota.atualizado || nota.publicado,
    wordCount: nota.palavras,
    articleSection: nota.categoria,
    author: autor,
    publisher: autor,
    isPartOf: {'@type': 'Blog', name: nomeDoBlog, url: siteUrl + getPathname({locale: nota.idioma, href: '/notes'})},
    ...(nota.linkDaFonte ? {citation: nota.linkDaFonte} : {})
  };
}

/** O `<script>` do JSON-LD, com o `<` escapado (nenhum texto do painel fecha a tag). */
export function jsonLd(dados: unknown): {__html: string} {
  return {__html: JSON.stringify(dados).replace(/</g, '\\u003c')};
}
