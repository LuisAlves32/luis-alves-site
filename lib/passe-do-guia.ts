import {createHmac, timingSafeEqual} from 'node:crypto';
import {VARIAVEL_DO_SEGREDO} from '@/lib/descadastro';

/**
 * O PASSE DO GUIA: o cookie que diz "esta pessoa acabou de enviar o formulário".
 *
 * Por que existe (24/09/2026): o botão da página de obrigado entrega o guia na
 * hora, sem esperar o e-mail, e isso continua (roteiro.md). Mas a página de
 * obrigado é um endereço, e endereço se compartilha: sem este passe, quem
 * soubesse a URL baixava o guia sem se inscrever. Com ele, a rota
 * `/api/guia` só entrega a quem tem o cookie que a rota do formulário gravou.
 *
 * O QUE ELE NÃO É: proteção do arquivo. Quem recebeu o guia pode encaminhar o
 * PDF, e está certo que possa. O passe protege a PORTA, não o conteúdo.
 *
 * O valor é `<momento>.<hmac("guia:" + momento)>`. Não carrega nada da pessoa:
 * nem e-mail, nem nome. O segredo é o mesmo do descadastro (`UNSUBSCRIBE_SECRET`),
 * com o prefixo "guia:" separando os dois usos, para uma ficha de um nunca
 * valer como a do outro.
 */
export const COOKIE_DO_GUIA = 'passe_guia';

/** Uma semana: a pessoa que volta no dia seguinte para baixar de novo consegue. */
export const VALIDADE_DO_PASSE_S = 7 * 24 * 60 * 60;

function segredo(): string | null {
  return process.env[VARIAVEL_DO_SEGREDO]?.trim() || null;
}

function assinar(momento: string, chave: string): string {
  return createHmac('sha256', chave).update(`guia:${momento}`).digest('hex');
}

/** O valor do cookie, ou null se o segredo não existir (quem chama loga). */
export function emitirPasse(agora = Date.now()): string | null {
  const chave = segredo();
  if (!chave) return null;
  const momento = String(agora);
  return `${momento}.${assinar(momento, chave)}`;
}

/** O cabeçalho Set-Cookie inteiro: só HTTPS, invisível ao JavaScript, só para a rota do guia. */
export function cabecalhoDoPasse(valor: string): string {
  return `${COOKIE_DO_GUIA}=${valor}; Path=/api/guia; Max-Age=${VALIDADE_DO_PASSE_S}; HttpOnly; Secure; SameSite=Lax`;
}

export type Conferencia = 'valido' | 'ausente' | 'invalido' | 'vencido' | 'sem-segredo';

export function conferirPasse(valor: string | undefined, agora = Date.now()): Conferencia {
  const chave = segredo();
  if (!chave) return 'sem-segredo';
  if (!valor) return 'ausente';
  const [momento, assinatura] = valor.split('.');
  if (!momento || !assinatura || !/^\d+$/.test(momento) || !/^[0-9a-f]{64}$/.test(assinatura)) return 'invalido';
  const esperada = Buffer.from(assinar(momento, chave), 'hex');
  const recebida = Buffer.from(assinatura, 'hex');
  if (esperada.length !== recebida.length || !timingSafeEqual(esperada, recebida)) return 'invalido';
  const idade = agora - Number(momento);
  if (idade < 0 || idade > VALIDADE_DO_PASSE_S * 1000) return 'vencido';
  return 'valido';
}
