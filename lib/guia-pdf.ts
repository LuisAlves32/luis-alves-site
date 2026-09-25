import type {Locale} from '@/i18n/routing';

/**
 * OS DOIS PDFs DO GUIA, um por idioma. FONTE ÚNICA.
 *
 * Morava dentro de `app/[locale]/(funil)/real-cost-guide/thank-you/page.tsx`,
 * e saiu de lá na rodada 4.4 porque ganhou um segundo leitor: o e-mail de
 * entrega. Caminho de arquivo escrito em dois lugares é caminho que um dia
 * diverge, e o dia em que divergir é o dia em que o link do e-mail dá 404 e
 * ninguém percebe, porque a página de obrigado continua funcionando.
 *
 * O ARQUIVO SAIU DO REPOSITÓRIO (24/09/2026). O repositório vai ser público, e
 * PDF dentro de `public/` é PDF que qualquer um baixa pelo GitHub sem passar
 * pelo formulário. O endereço agora vem de variável de ambiente
 * (`GUIA_PDF_URL_EN`, `GUIA_PDF_URL_PT`), apontando para o armazenamento de
 * arquivos da Vercel (Blob) na conta do Luís. Nenhum endereço de arquivo fica
 * escrito no código.
 *
 * ENQUANTO A VARIÁVEL NÃO EXISTIR, vale o `legado`: o caminho antigo em
 * `public/guia/`, que continua no disco até a limpeza do histórico. A ordem da
 * mudança, e ela não pode inverter: 1) subir os PDFs no Blob, 2) criar as duas
 * variáveis na Vercel, 3) publicar, 4) só então apagar `public/guia/*.pdf`.
 * Invertida, o e-mail de entrega manda um link 404 para todo lead novo.
 *
 * `arquivo` é o nome com que o PDF cai na pasta de Downloads da pessoa, e ele
 * precisa dizer o que é SOZINHO, meses depois, longe deste site. Por isso leva
 * o nome do Luís na frente. É também o nome a dar ao arquivo quando ele subir
 * para o Blob: é ele que o `?download=1` do Blob usa.
 *
 * A grafia sai do próprio roteiro.md: o e-mail de entrega chama o material de
 * "your real cost guide" e "seu guia de custos reais". Não usei "O preço não é
 * o preço" (o apelido da landing no roteiro), porque é uma manchete, não o nome
 * do produto, e não tem equivalente escrito em inglês.
 */
export const GUIA_PDF: Record<Locale, {legado: string; arquivo: string; variavel: string}> = {
  en: {
    legado: '/guia/real-cost-guide-en.pdf',
    arquivo: 'Luis Alves - The Real Cost Guide.pdf',
    variavel: 'GUIA_PDF_URL_EN'
  },
  pt: {
    legado: '/guia/real-cost-guide-pt.pdf',
    arquivo: 'Luis Alves - Guia de Custos Reais.pdf',
    variavel: 'GUIA_PDF_URL_PT'
  }
};

/**
 * A PORTA DA PÁGINA DE OBRIGADO: a rota que confere se a pessoa enviou o
 * formulário antes de entregar o arquivo (ver `app/api/guia/route.ts`). O
 * e-mail NÃO passa por ela: quem tem o e-mail já é quem pediu.
 */
export const ROTA_DO_GUIA = '/api/guia';

/**
 * O endereço ABSOLUTO do arquivo, só no servidor. Sem a variável, o caminho
 * legado montado sobre `base`. Link relativo em e-mail é link morto, por isso a
 * base é obrigatória.
 */
export function enderecoDoGuia(idioma: Locale, base: string): string {
  const guia = GUIA_PDF[idioma] ?? GUIA_PDF.en;
  const doBlob = process.env[guia.variavel]?.trim();
  if (doBlob) {
    // O Blob da Vercel entrega como anexo, com o nome do arquivo, quando o
    // endereço leva `download=1`. Sem isso o navegador abre o PDF na aba.
    const url = new URL(doBlob);
    if (url.hostname.endsWith('.blob.vercel-storage.com')) url.searchParams.set('download', '1');
    return url.toString();
  }
  return `${base.replace(/\/+$/, '')}${guia.legado}`;
}
