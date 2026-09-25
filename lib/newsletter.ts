import 'server-only';

/**
 * A LISTA DA NEWSLETTER DO BLOG no Resend (blog/newsletter.md, 24/09/2026).
 *
 * Quem se inscreve pelo blog vira CONTATO no Resend, no segmento do idioma em que se
 * inscreveu. É desse segmento que os Broadcasts de cada nota saem (o cron do feed, a
 * etapa seguinte da newsletter).
 *
 * VARIÁVEIS DE AMBIENTE:
 *   NEWSLETTER_API_KEY          chave do Resend com permissão de CONTATOS. A chave do
 *                               site (RESEND_API_KEY) é só de envio e não serve; sem esta,
 *                               cai nela e o log diz se o Resend recusou.
 *   NEWSLETTER_SEGMENTO_EN      id do segmento dos inscritos em inglês
 *   NEWSLETTER_SEGMENTO_PT      id do segmento dos inscritos em português
 *
 * Falta de variável NÃO quebra a inscrição: a planilha é o registro durável e a prova
 * do consentimento (CASL). O contato pode ser importado depois.
 */

export type ResultadoContato = {ok: boolean; motivo: string};

export async function adicionarContato({
  email,
  nome,
  idioma
}: {
  email: string;
  nome: string;
  idioma: 'en' | 'pt';
}): Promise<ResultadoContato> {
  const chave = process.env.NEWSLETTER_API_KEY || process.env.RESEND_API_KEY;
  const segmento = idioma === 'pt' ? process.env.NEWSLETTER_SEGMENTO_PT : process.env.NEWSLETTER_SEGMENTO_EN;
  const ausentes: string[] = [];
  if (!chave) ausentes.push('NEWSLETTER_API_KEY');
  if (!segmento) ausentes.push(idioma === 'pt' ? 'NEWSLETTER_SEGMENTO_PT' : 'NEWSLETTER_SEGMENTO_EN');
  if (!chave || !segmento) return {ok: false, motivo: `${ausentes.join(' e ')} ausente`};

  try {
    const resposta = await fetch('https://api.resend.com/contacts', {
      method: 'POST',
      headers: {Authorization: `Bearer ${chave}`, 'Content-Type': 'application/json'},
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        first_name: nome.trim().slice(0, 80),
        unsubscribed: false,
        segments: [{id: segmento}]
      }),
      signal: AbortSignal.timeout(8000)
    });
    if (resposta.ok) return {ok: true, motivo: ''};
    const texto = (await resposta.text()).slice(0, 200);
    // A documentação não diz o que acontece com e-mail repetido. Quem já está na lista
    // e se inscreve de novo não é falha: o contato existe.
    if (resposta.status === 409 || /already exists/i.test(texto)) return {ok: true, motivo: 'ja existia'};
    return {ok: false, motivo: `HTTP ${resposta.status} . ${texto}`};
  } catch (e) {
    return {ok: false, motivo: e instanceof Error ? `${e.name}: ${e.message}` : String(e)};
  }
}
