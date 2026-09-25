import {createHmac, timingSafeEqual} from 'node:crypto';

/**
 * A ASSINATURA DOS WEBHOOKS DO RESEND, que segue o padrão Svix.
 *
 * Conteúdo assinado = `svix-id.svix-timestamp.corpo cru`, HMAC-SHA256 com o segredo
 * (`whsec_` + base64, decodificado), comparado com cada `v1,<base64>` do cabeçalho
 * `svix-signature` (pode vir mais de um, separados por espaço, na troca de segredo).
 * Evento com mais de 5 minutos de diferença é recusado: é reenvio de evento antigo.
 *
 * Arquivo à parte da rota para a prova (`scripts/prova-webhook.ts`) testar sem servidor.
 */

const TOLERANCIA_S = 5 * 60;

export function assinaturaDoResendValida(
  corpo: string,
  cabecalhos: {get(nome: string): string | null},
  segredo: string,
  agoraS = Date.now() / 1000
): boolean {
  const id = cabecalhos.get('svix-id');
  const momento = cabecalhos.get('svix-timestamp');
  const assinaturas = cabecalhos.get('svix-signature');
  if (!id || !momento || !assinaturas) return false;
  if (!Number.isFinite(Number(momento)) || Math.abs(agoraS - Number(momento)) > TOLERANCIA_S) return false;
  const chave = Buffer.from(segredo.replace(/^whsec_/, ''), 'base64');
  const esperada = createHmac('sha256', chave).update(`${id}.${momento}.${corpo}`).digest();
  return assinaturas.split(' ').some((par) => {
    const [versao, valor] = par.split(',');
    if (versao !== 'v1' || !valor) return false;
    const recebida = Buffer.from(valor, 'base64');
    return recebida.length === esperada.length && timingSafeEqual(recebida, esperada);
  });
}
