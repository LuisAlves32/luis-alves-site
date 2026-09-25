import {registerHooks} from 'node:module';
import {existsSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

/**
 * O `@/` do projeto, resolvido fora do Next.
 *
 * O `paths` do tsconfig só existe para o TypeScript e para o empacotador do
 * Next. Um `node` puro não sabe nada dele, e a prova dos e-mails roda em `node`
 * puro de propósito: ela precisa importar os MESMOS módulos que a rota importa,
 * sem subir um servidor e sem passar por build. Prova que roda por outro
 * caminho que não o do código real é prova que mente no dia em que os dois
 * caminhos divergirem.
 *
 * São dez linhas e um gancho síncrono, e é o preço de a prova ser verdadeira.
 */
const raiz = path.resolve(fileURLToPath(import.meta.url), '..', '..');

registerHooks({
  resolve(especificador, contexto, proximo) {
    if (!especificador.startsWith('@/')) {
      return proximo(especificador, contexto);
    }
    const base = path.join(raiz, especificador.slice(2));
    // A ordem importa: `@/lib/emails` tem que achar `lib/emails/index.ts`, e
    // `@/lib/links` tem que achar `lib/links.ts`.
    const candidatos = [
      // O caminho exato primeiro: `@/messages/en.json` ja vem com extensao.
      base,
      `${base}.ts`,
      `${base}.tsx`,
      path.join(base, 'index.ts')
    ];
    const achado = candidatos.find((c) => existsSync(c));
    if (!achado) {
      throw new Error(`alias nao resolvido: ${especificador}`);
    }
    return proximo(pathToFileURL(achado).href, contexto);
  }
});
