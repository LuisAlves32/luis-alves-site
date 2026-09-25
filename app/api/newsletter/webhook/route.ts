import {assinaturaDoResendValida} from '@/lib/assinatura-resend';
import {darBaixaNaPlanilha, fichaDeDescadastro, marcaParaLog, VARIAVEL_DO_SEGREDO} from '@/lib/descadastro';

/* O WEBHOOK DO RESEND (blog/newsletter.md, "Os dois descadastros").
   Quem clica em "unsubscribe" no e-mail de uma nota sai da lista do Resend na hora. Este
   webhook leva essa saída para a PLANILHA, virando "Aceita marketing" para Nao em todas as
   abas: quem sai por um lado não pode continuar recebendo pelo outro (CASL).

   O laço está cortado dos dois lados: a baixa daqui vai com `origem: 'resend'`, e o Apps
   Script, com essa origem, NÃO avisa o Resend de volta.

   Assinatura conferida em `lib/assinatura-resend.ts` (padrão Svix, provada por
   `npm run prova:webhook`). Variável: `RESEND_WEBHOOK_SECRET`. No painel do Resend, o webhook escuta
   `contact.updated` e `contact.deleted`. */

export const runtime = 'nodejs';

type Evento = {type?: string; data?: {email?: string; unsubscribed?: boolean}};

export async function POST(request: Request) {
  const segredo = process.env.RESEND_WEBHOOK_SECRET;
  if (!segredo) {
    console.error('[newsletter-webhook] RESEND_WEBHOOK_SECRET ausente');
    return new Response('not configured', {status: 503});
  }
  const corpo = await request.text();
  if (!assinaturaDoResendValida(corpo, request.headers, segredo)) return new Response('invalid signature', {status: 401});

  let evento: Evento;
  try {
    evento = JSON.parse(corpo) as Evento;
  } catch {
    return new Response('bad json', {status: 400});
  }

  const saiu =
    (evento.type === 'contact.updated' && evento.data?.unsubscribed === true) || evento.type === 'contact.deleted';
  const email = evento.data?.email;
  // Qualquer outro evento responde 200: não é erro, só não nos interessa.
  if (!saiu || !email) return Response.json({ok: true, ignorado: evento.type ?? '?'});

  const segredoDaFicha = process.env[VARIAVEL_DO_SEGREDO];
  if (!segredoDaFicha) {
    console.error(`[newsletter-webhook] ${VARIAVEL_DO_SEGREDO} ausente: a baixa não chegou à planilha`);
    // 500 faz o Resend tentar de novo mais tarde, quando a variável existir.
    return new Response('not configured', {status: 500});
  }
  const ficha = fichaDeDescadastro(email, segredoDaFicha);
  const baixa = await darBaixaNaPlanilha(ficha, 'resend');
  console.info(
    `[newsletter-webhook] ${evento.type} ficha=${marcaParaLog(ficha)} planilha=${baixa.ok ? `ok linhas=${baixa.linhas}` : `FALHOU ${baixa.motivo}`}`
  );
  return baixa.ok ? Response.json({ok: true}) : new Response('sheet failed', {status: 500});
}
