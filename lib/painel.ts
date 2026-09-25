/**
 * O painel do Second Opinion (Keystatic) só abre quando tem onde gravar.
 *
 * No computador, sempre (modo local). No AR, só com as três chaves do app do GitHub. Sem elas,
 * criar a API do Keystatic derruba o BUILD inteiro ("Missing required config"): a ordem de
 * cadastrar as variáveis na Vercel não pode quebrar o site. Do kit da skill `blog-com-painel`.
 */
export const PAINEL_LIGADO =
  process.env.NODE_ENV !== 'production' ||
  Boolean(
    process.env.KEYSTATIC_GITHUB_CLIENT_ID &&
      process.env.KEYSTATIC_GITHUB_CLIENT_SECRET &&
      process.env.KEYSTATIC_SECRET
  );
