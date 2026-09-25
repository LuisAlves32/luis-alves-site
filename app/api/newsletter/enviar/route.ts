import {enviarNotasNovas, montarEmailDaNota} from '@/lib/newsletter-envio';
import {notaPorSlug} from '@/lib/notas';

/* O CRON DA NEWSLETTER (vercel.json, uma vez por dia, 9h de Vancouver no horário de verão).
   A Vercel chama com `Authorization: Bearer <CRON_SECRET>`; sem a variável, a rota não
   abre para ninguém no ar. No computador (desenvolvimento) abre sem ela, para a prova.

   ?ensaio=1        diz o que SAIRIA, sem tocar no Resend (aceita `inicio` e `agora`).
   ?previa=<slug>   devolve o HTML do e-mail daquela nota (o mock), sem enviar nada. */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function autorizado(request: Request): boolean {
  const segredo = process.env.CRON_SECRET;
  if (!segredo) return process.env.NODE_ENV !== 'production';
  return request.headers.get('authorization') === `Bearer ${segredo}`;
}

export async function GET(request: Request) {
  if (!autorizado(request)) return new Response('Unauthorized', {status: 401});
  const url = new URL(request.url);

  const previa = url.searchParams.get('previa');
  if (previa) {
    const nota = await notaPorSlug(previa);
    if (!nota) return new Response('Not found', {status: 404});
    const email = await montarEmailDaNota(nota);
    return url.searchParams.get('formato') === 'texto'
      ? new Response(email.texto, {headers: {'Content-Type': 'text/plain; charset=utf-8'}})
      : new Response(email.html, {headers: {'Content-Type': 'text/html; charset=utf-8'}});
  }

  const ensaio = url.searchParams.get('ensaio') === '1';
  // No ensaio dá para simular o marco e o relógio (`?inicio=AAAA-MM-DD&agora=ISO`), para
  // provar a janela de 12 horas sem esperar o dia passar. Fora do ensaio, nada disso vale.
  const agora = ensaio && url.searchParams.get('agora') ? Date.parse(url.searchParams.get('agora')!) : Date.now();
  const relatorio = await enviarNotasNovas({
    ensaio,
    agora: Number.isNaN(agora) ? Date.now() : agora,
    inicioDoEnsaio: ensaio ? (url.searchParams.get('inicio') ?? '') : ''
  });
  const resumo = relatorio.itens.map((i) => `${i.nome}=${i.situacao}${i.motivo ? `(${i.motivo})` : ''}`).join(' ');
  console.info(`[newsletter-envio] modo=${relatorio.modo} inicio=${relatorio.inicio || '-'} ${resumo || 'nada-a-enviar'}`);
  if (relatorio.erro) console.error(`[newsletter-envio] por que parou . ${relatorio.erro}`);
  const falhou = relatorio.erro || relatorio.itens.some((i) => i.situacao === 'falhou');
  return Response.json(relatorio, {status: falhou ? 500 : 200});
}
