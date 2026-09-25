import 'server-only';
import {getTranslations} from 'next-intl/server';
import {getPathname} from '@/i18n/navigation';
import type {AppPathname, Locale} from '@/i18n/routing';
import {EMAIL_CONTATO, INSTAGRAM_URL, TELEFONE_TEL, TIKTOK_URL} from '@/lib/links';
import {ID_DO_LUIS} from '@/lib/notas-schema';
import {ID_DO_AGENTE, siteUrl} from '@/lib/seo';

/**
 * OS DADOS ESTRUTURADOS DO SITE (Passe 4, skill `seo-e-medicao`; molde do acervo
 * `componentes-ta-online/passe-4-a-praca`).
 *
 * É aqui que o site diz em linguagem de MÁQUINA o que a prosa diz em linguagem
 * humana: quem é o Luís, que negócio é este, por qual corretora, onde atende e
 * em que idiomas.
 *
 * FONTE ÚNICA: nada de URL, telefone, e-mail, endereço ou cidade escrito à mão.
 * Contatos saem de `lib/links.ts` e o resto das mensagens de i18n, as MESMAS
 * fontes que a tela desenha. Divergência entre o que o site mostra e o que o
 * grafo declara é o que faz a máquina hesitar em afirmar quem ele é.
 *
 * PESSOA E NEGÓCIO SÃO DUAS ENTIDADES. O `RealEstateAgent` é a prática
 * ("Luis Alves REALTOR®"); a `Person` é o Luís, com o MESMO `@id` que o blog
 * já usa como autor (`ID_DO_LUIS`), para as notas e o site se reconhecerem.
 * A Stonehaus entra como `parentOrganization`: é a corretora dele, e o endereço
 * publicado no rodapé é o dela.
 *
 * `knowsLanguage` É O CAMPO QUE MAIS RENDE AQUI: a frente 1 de busca do Luís é
 * justamente "corretor que fala português em Vancouver", e quase nenhum
 * concorrente declara isso.
 *
 * O QUE NÃO ENTRA, de propósito: `aggregateRating`. Depoimento do próprio site
 * marcado como nota torna a página INELEGÍVEL para estrela e abre risco de ação
 * manual. A nota que conta é a do Perfil da Empresa no Google; quando o link
 * dele existir, entra em `sameAs`, junto do perfil do REW.ca.
 */

const ID_DO_SITE = `${siteUrl}/#site`;
const ID_DA_CORRETORA = `${siteUrl}/#stonehaus`;

const CIDADES = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8', 'c9', 'c10', 'c11', 'c12'] as const;
const PERFIS = [INSTAGRAM_URL, TIKTOK_URL];

/** O NBSP é acabamento de TELA posto na leitura (`i18n/request.ts`); máquina lê o texto limpo. */
const limpo = (texto: string) => texto.replace(/ /g, ' ');

const url = (locale: Locale, href: AppPathname) => siteUrl + getPathname({locale, href});

export async function grafoDoSite(locale: Locale) {
  const rodape = await getTranslations({locale, namespace: 'rodape'});
  const regioes = await getTranslations({locale, namespace: 'regioes'});
  const sobre = await getTranslations({locale, namespace: 'hero'});
  const idioma = locale === 'pt' ? 'pt-BR' : 'en-CA';

  const [cidade, resto] = limpo(rodape('endereco2')).split(', ');
  const [regiao, ...cep] = (resto ?? '').split(' ');

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': ID_DO_SITE,
        url: url(locale, '/'),
        name: limpo(rodape('nome')),
        inLanguage: idioma,
        publisher: {'@id': ID_DO_AGENTE}
      },
      {
        '@type': 'RealEstateAgent',
        '@id': ID_DO_AGENTE,
        name: limpo(rodape('nome')),
        url: url(locale, '/'),
        image: `${siteUrl}/fotos/luis-retrato-1080.webp`,
        logo: `${siteUrl}/icon-512.png`,
        description: limpo(sobre('apoio')),
        telephone: TELEFONE_TEL,
        email: EMAIL_CONTATO,
        address: {
          '@type': 'PostalAddress',
          streetAddress: limpo(rodape('endereco1')),
          addressLocality: cidade,
          addressRegion: regiao,
          postalCode: cep.join(' '),
          addressCountry: 'CA'
        },
        areaServed: CIDADES.map((c) => ({
          '@type': 'City',
          name: limpo(regioes(`cidades.${c}`)),
          containedInPlace: {'@type': 'AdministrativeArea', name: 'British Columbia'}
        })),
        knowsLanguage: ['en', 'pt'],
        parentOrganization: {'@id': ID_DA_CORRETORA},
        employee: {'@id': ID_DO_LUIS},
        sameAs: PERFIS
      },
      {
        '@type': 'RealEstateAgent',
        '@id': ID_DA_CORRETORA,
        name: limpo(rodape('corretora'))
      },
      {
        '@type': 'Person',
        '@id': ID_DO_LUIS,
        name: 'Luis Alves',
        jobTitle: 'REALTOR®',
        url: url(locale, '/about'),
        image: `${siteUrl}/fotos/luis-retrato-1080.webp`,
        worksFor: {'@id': ID_DO_AGENTE},
        knowsLanguage: ['en', 'pt'],
        sameAs: PERFIS
      }
    ]
  };
}

/**
 * O FAQ VAI EM BLOCO SEPARADO do grafo do layout (armadilha do acervo): o layout
 * roda em todas as páginas e cada FAQ existe numa só. `no` e `itens` são os
 * MESMOS que a página passa para `<Faq>`: copy verbatim, da mesma chave.
 */
export async function grafoDoFaq(
  locale: Locale,
  href: AppPathname,
  no: string,
  itens: readonly string[]
) {
  const t = await getTranslations({locale, namespace: no});
  const endereco = url(locale, href);
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${endereco}#faq`,
    url: endereco,
    inLanguage: locale === 'pt' ? 'pt-BR' : 'en-CA',
    mainEntity: itens.map((i) => ({
      '@type': 'Question',
      name: limpo(t(`${i}.pergunta`)),
      acceptedAnswer: {'@type': 'Answer', text: limpo(t(`${i}.resposta`))}
    }))
  };
}
