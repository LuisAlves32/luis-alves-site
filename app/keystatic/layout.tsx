import KeystaticApp from './keystatic';
import {PAINEL_LIGADO} from '@/lib/painel';

/**
 * O painel do Second Opinion (`/keystatic`). Fica fora do `[locale]`: é ferramenta do Luís e da
 * agência, não página do site, e tem o próprio `<html>`. Fora do roteamento de idioma no
 * `proxy.ts`, fora do índice aqui e no robots.
 */
export const metadata = {title: 'Second Opinion, painel', robots: {index: false, follow: false}};

export default function Layout() {
  return (
    <html lang="pt-BR">
      <head />
      <body>
        {PAINEL_LIGADO ? (
          <KeystaticApp />
        ) : (
          <main style={{fontFamily: 'system-ui, sans-serif', padding: 32, maxWidth: 560}}>
            <h1>O painel ainda não está ligado</h1>
            <p>Ele abre depois que o app do GitHub estiver configurado na Vercel.</p>
          </main>
        )}
      </body>
    </html>
  );
}
