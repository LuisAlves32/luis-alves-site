/**
 * PROVA DA ASSINATURA DO WEBHOOK DO RESEND (`lib/assinatura-resend.ts`).
 *
 * Usa o vetor de teste PÚBLICO do Svix, o padrão que o Resend segue: a assinatura
 * esperada (`v1,g0hM9SsE...`) é a mesma que a documentação do Resend mostra de exemplo.
 * Passar aqui prova que o nosso HMAC bate com o deles sem depender do nosso próprio código
 * para gerar o "certo". Rodar: `npm run prova:webhook`.
 */
import {assinaturaDoResendValida} from '@/lib/assinatura-resend';

const SEGREDO = 'whsec_MfKQ9r8GKYqrTwjUPD8ILPZIo2LaLaSw';
const ID = 'msg_p5jXN8AQM9LWM0D4loKWxJek';
const MOMENTO = '1614265330';
const CORPO = '{"test": 2432232314}';
const ASSINATURA = 'v1,g0hM9SsE+OTPJTGt/tmIKtSyZlE3uFJELVlNIOLJ1OE=';

const cab = (h: Record<string, string>) => ({get: (n: string) => h[n] ?? null});
const agora = Number(MOMENTO) + 10;

const casos: [string, boolean, boolean][] = [
  ['vetor oficial', assinaturaDoResendValida(CORPO, cab({'svix-id': ID, 'svix-timestamp': MOMENTO, 'svix-signature': ASSINATURA}), SEGREDO, agora), true],
  ['duas assinaturas, a boa em segundo', assinaturaDoResendValida(CORPO, cab({'svix-id': ID, 'svix-timestamp': MOMENTO, 'svix-signature': `v1,AAAA ${ASSINATURA}`}), SEGREDO, agora), true],
  ['corpo alterado', assinaturaDoResendValida(CORPO.replace('2432', '2433'), cab({'svix-id': ID, 'svix-timestamp': MOMENTO, 'svix-signature': ASSINATURA}), SEGREDO, agora), false],
  ['segredo errado', assinaturaDoResendValida(CORPO, cab({'svix-id': ID, 'svix-timestamp': MOMENTO, 'svix-signature': ASSINATURA}), 'whsec_' + Buffer.from('outro').toString('base64'), agora), false],
  ['evento de 6 minutos atrás', assinaturaDoResendValida(CORPO, cab({'svix-id': ID, 'svix-timestamp': MOMENTO, 'svix-signature': ASSINATURA}), SEGREDO, Number(MOMENTO) + 360), false],
  ['sem cabeçalhos', assinaturaDoResendValida(CORPO, cab({}), SEGREDO, agora), false]
];

let falhas = 0;
for (const [nome, obtido, esperado] of casos) {
  const ok = obtido === esperado;
  if (!ok) falhas++;
  console.log(`${ok ? 'OK   ' : 'FALHA'} ${nome}: ${obtido}`);
}
console.log(falhas ? `\n${falhas} falha(s)` : '\nTodas passaram.');
process.exit(falhas ? 1 : 0);
