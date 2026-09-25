import {fichaDeDescadastro, normalizarEmail} from '@/lib/descadastro';

/**
 * GERA A FICHA DE DESCADASTRO de um e-mail, para testar o mecanismo à mão.
 *
 * Rodar:  npm run ficha -- alguem@exemplo.com
 *
 * O SEGREDO vem do ambiente (`UNSUBSCRIBE_SECRET`) e NUNCA é impresso. Se ele
 * não estiver definido, o script recusa em vez de gerar uma ficha com um valor
 * de mentira: uma ficha calculada com o segredo errado tem a forma certa, passa
 * em toda validação, e simplesmente não casa com linha nenhuma. Isso é o pior
 * resultado possível num teste, porque parece que o código está quebrado.
 */

const email = process.argv[2];
const segredo = process.env.UNSUBSCRIBE_SECRET;

if (!email || !email.includes('@')) {
  console.error('uso: npm run ficha -- alguem@exemplo.com');
  process.exit(1);
}

if (!segredo) {
  console.error(
    'UNSUBSCRIBE_SECRET nao esta no ambiente.\n' +
      'Defina o MESMO valor que esta na Vercel e no SEGREDO_DESCADASTRO do Apps Script.\n' +
      'No PowerShell:  $env:UNSUBSCRIBE_SECRET = "o-valor"'
  );
  process.exit(1);
}

console.log(`e-mail normalizado: ${normalizarEmail(email)}`);
console.log(`ficha:              ${fichaDeDescadastro(email, segredo)}`);
