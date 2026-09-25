import {createElement} from 'react';
import {collection, config, fields} from '@keystatic/core';
import {block, mark} from '@keystatic/core/content-components';

/**
 * O PAINEL DO SECOND OPINION (Keystatic), o blog do Luis Alves (blog/design-blog.md).
 *
 * O Luís e a agência escrevem, editam e publicam em `/keystatic`, sem tocar em código. Cada nota é
 * um ARQUIVO no próprio repositório (`content/notas/*.mdoc`): não existe banco nem fornecedor.
 * Rótulos em português porque quem usa é o Luís. Saber mais: skill `blog-com-painel`.
 *
 * ONDE GRAVA: no computador, no próprio disco (modo local, para a agência escrever e medir). No ar,
 * no repositório do GitHub: cada nota salva vira um commit e a Vercel publica sozinha. No ar o
 * painel só abre com as chaves do app do GitHub (`lib/painel.ts`).
 *
 * O REPOSITÓRIO fica escrito aqui, e não numa variável: esta configuração também roda no
 * NAVEGADOR, e variável sem `NEXT_PUBLIC_` não chega lá (lição da Cora, 23/09/2026).
 * TROCAR NA TRANSFERÊNCIA para o repositório na conta do Luís.
 */
const REPOSITORIO = 'uolivergab/luis-alves-site';

/** As categorias, e cada uma tem a FORMA da cota da capa (design-blog.md, 5.1). */
export const CATEGORIAS = [
  {label: 'Comprar (cota horizontal)', value: 'buying'},
  {label: 'Vender (cota vertical)', value: 'selling'},
  {label: 'Pré-construção (cota inclinada)', value: 'presale'},
  {label: 'Mercado (cota de nível)', value: 'market'},
  {label: 'Nota (sem número; a capa mede o tempo de leitura)', value: 'notes'}
] as const;

export default config({
  storage:
    process.env.NODE_ENV === 'production'
      ? {kind: 'github', repo: REPOSITORIO}
      : {kind: 'local'},
  ui: {brand: {name: 'Second Opinion'}},
  collections: {
    notas: collection({
      label: 'Notas (artigos)',
      slugField: 'titulo',
      path: 'content/notas/*',
      format: {contentField: 'corpo'},
      entryLayout: 'content',
      columns: ['titulo', 'categoria', 'idioma', 'publicado'],
      schema: {
        titulo: fields.slug({
          name: {
            label: 'Título',
            description: 'Como aparece no site. Curto e direto: até duas linhas no índice.',
            validation: {length: {min: 4, max: 90}}
          },
          slug: {
            label: 'Endereço',
            description:
              'No idioma da nota, curto, sem acento, com hífens. Ex.: property-transfer-tax (inglês) ou o-preco-nao-e-o-preco (português).'
          }
        }),
        prontoParaPublicar: fields.checkbox({
          label: 'Pronto para publicar',
          description:
            'Desmarcado, a nota fica salva mas NÃO aparece no site, no Google nem no e-mail dos inscritos. Marque só quando o texto estiver revisado: marcada, ela sai no e-mail da manhã seguinte e e-mail não tem volta.',
          defaultValue: false
        }),
        idioma: fields.select({
          label: 'Idioma da nota',
          description: 'O idioma em que a nota foi escrita.',
          options: [
            {label: 'Inglês', value: 'en'},
            {label: 'Português', value: 'pt'}
          ],
          defaultValue: 'en'
        }),
        traducaoDe: fields.relationship({
          label: 'Esta nota é a tradução de (opcional)',
          description: 'Se esta nota é a versão em outro idioma de uma nota que já existe, escolha a original aqui.',
          collection: 'notas'
        }),
        categoria: fields.select({
          label: 'Categoria',
          description: 'Decide o desenho da capa.',
          options: [...CATEGORIAS],
          defaultValue: 'buying'
        }),
        resumo: fields.text({
          label: 'Resumo',
          description: 'Uma ou duas frases, embaixo do título dentro da nota e no e-mail. Até 220 caracteres.',
          multiline: true,
          validation: {length: {min: 20, max: 220}}
        }),
        numero: fields.text({
          label: 'O número da capa (opcional)',
          description:
            'O número-tese da nota, COM a unidade, como aparece na capa: "$11,250", "730 days", "+2.1%". Sem número, a capa mede o tempo de leitura.',
          validation: {length: {max: 14}}
        }),
        rotuloDoNumero: fields.text({
          label: 'O que o número mede',
          description: 'Aparece embaixo da linha da capa, em caixa alta. Ex.: "In cash, beyond the down payment". Até 40 caracteres.',
          validation: {length: {max: 40}}
        }),
        fonte: fields.text({
          label: 'Fonte do número',
          description: 'De onde o número vem. Ex.: "BC Property Transfer Tax Act". Número sem fonte não vai para a capa.'
        }),
        linkDaFonte: fields.url({
          label: 'Link da fonte (opcional)',
          description: 'O endereço oficial, se houver.'
        }),
        medidoEm: fields.date({
          label: 'Medido em',
          description: 'A data em que o número foi conferido. Aparece na ficha do topo da nota.'
        }),
        validade: fields.text({
          label: 'Vale até (opcional)',
          description: 'Até quando o número vale. Ex.: "The 2026 tax year".'
        }),
        publicado: fields.date({
          label: 'Data de publicação',
          description: 'Ordena o índice e numera a nota (N.º).',
          validation: {isRequired: true},
          defaultValue: {kind: 'today'}
        }),
        atualizado: fields.date({
          label: 'Última revisão',
          description: 'Mude sempre que revisar o texto.',
          validation: {isRequired: true},
          defaultValue: {kind: 'today'}
        }),
        tituloGoogle: fields.text({
          label: 'Título para o Google (opcional, até 60 caracteres)',
          validation: {length: {max: 60}}
        }),
        descricaoGoogle: fields.text({
          label: 'Descrição para o Google (opcional, até 155 caracteres)',
          multiline: true,
          validation: {length: {max: 155}}
        }),
        corpo: fields.markdoc({
          label: 'Texto',
          description:
            'Use Título 2 para os subtítulos (cada um vira uma marca na régua da leitura). Para a frase que importa, selecione e toque em "Marcar com a cota": uma por seção, no máximo.',
          options: {
            image: false,
            table: false,
            codeBlock: false,
            code: false,
            divider: true,
            heading: [2, 3]
          },
          components: {
            /* A COTA sob a frase (design-blog.md, 5.6). O ícone é só o traço: o painel embrulha
               num <svg> 24x24. O `style` faz a frase marcada aparecer no editor como no site. */
            cota: mark({
              label: 'Marcar com a cota (a frase que importa)',
              icon: createElement('path', {d: 'M4 20h16M7 4v11M17 4v11M7 15h10'}),
              schema: {},
              tag: 'span',
              className: 'marcada',
              style: {
                textDecorationLine: 'underline',
                textDecorationColor: '#2A6DD6',
                textDecorationThickness: '3px',
                textUnderlineOffset: '5px'
              }
            }),
            /* A NOTA DE MARGEM (design-blog.md, 5.7): o Luís anotando o próprio texto. */
            notaDoLuis: block({
              label: 'Nota do Luís (na margem)',
              description: 'Uma ou duas frases suas, que aparecem na margem ao lado do parágrafo de cima.',
              schema: {
                texto: fields.text({
                  label: 'A nota',
                  multiline: true,
                  validation: {length: {min: 10, max: 240}}
                })
              }
            }),
            /* A CONTA (design-blog.md, 5.8): o livro-razão, linha a linha, com o total. */
            aConta: block({
              label: 'A conta (linhas e total)',
              description: 'Para mostrar uma conta: cada linha com o que é e o valor, e o total embaixo.',
              schema: {
                titulo: fields.text({label: 'Título da conta', description: 'Ex.: "Closing week, a $780,000 condo"'}),
                linhas: fields.array(
                  fields.object({
                    item: fields.text({label: 'O que é'}),
                    valor: fields.text({label: 'Valor, como aparece', description: 'Ex.: "$1,600" ou "less $8,000"'})
                  }),
                  {label: 'Linhas', itemLabel: (l) => `${l.fields.item.value || 'linha'}  ${l.fields.valor.value}`}
                ),
                rotuloDoTotal: fields.text({label: 'O que o total é', description: 'Ex.: "Total beyond the down payment"'}),
                total: fields.text({label: 'Total', description: 'Ex.: "$11,250"'}),
                nota: fields.text({label: 'Observação embaixo (opcional)', multiline: true})
              }
            })
          }
        })
      }
    })
  }
});
