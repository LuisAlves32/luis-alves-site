import type {NextRequest} from 'next/server';
import {getPathname} from '@/i18n/navigation';
import type {Locale} from '@/i18n/routing';
import {enderecoDoGuia} from '@/lib/guia-pdf';
import {COOKIE_DO_GUIA, conferirPasse} from '@/lib/passe-do-guia';

/**
 * A PORTA DO GUIA na página de obrigado (24/09/2026, caminho B aprovado pelo
 * Gabriel na pré-auditoria do repositório público).
 *
 *   GET /api/guia?idioma=en|pt
 *
 * Com o passe (o cookie que a rota do formulário grava quando o guia é pedido):
 * redireciona para o arquivo. Sem ele: volta para a landing do idioma, que é
 * onde o guia se pede. Nunca 403: a pessoa que caiu aqui por um link
 * compartilhado precisa de um caminho, não de uma parede.
 *
 * SEM O SEGREDO NO AMBIENTE, a porta ABRE e o log grita. É decisão, não
 * descuido: o pior defeito possível aqui é uma pessoa que acabou de se
 * inscrever apertar o botão e não receber o guia. Porta aberta por engano de
 * configuração é o estado de antes desta rota, que já era aceito.
 */
export function GET(req: NextRequest) {
  const pedido = req.nextUrl.searchParams.get('idioma');
  const idioma: Locale = pedido === 'pt' ? 'pt' : 'en';
  const conferencia = conferirPasse(req.cookies.get(COOKIE_DO_GUIA)?.value);

  const cabecalhos = {'X-Robots-Tag': 'noindex, nofollow', 'Cache-Control': 'no-store'};

  if (conferencia === 'valido' || conferencia === 'sem-segredo') {
    if (conferencia === 'sem-segredo') {
      console.error('[guia] UNSUBSCRIBE_SECRET ausente: a porta do guia abriu sem conferir o passe.');
    }
    const destino = enderecoDoGuia(idioma, req.nextUrl.origin);
    return new Response(null, {status: 302, headers: {...cabecalhos, Location: destino}});
  }

  console.info(`[guia] porta=fechada motivo=${conferencia} idioma=${idioma}`);
  const landing = new URL(getPathname({href: '/real-cost-guide', locale: idioma}), req.nextUrl.origin);
  return new Response(null, {status: 303, headers: {...cabecalhos, Location: landing.toString()}});
}
