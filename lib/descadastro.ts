import {createHmac} from 'node:crypto';

/**
 * A FICHA DE DESCADASTRO: o identificador opaco que viaja na URL do e-mail.
 *
 * A REGRA QUE NÃO SE NEGOCIA: o e-mail da pessoa NUNCA entra na URL. Nem em
 * claro, nem em base64, que é a mesma coisa com uma etapa a mais. Endereço em
 * query string vaza em log de servidor, em histórico de navegador, em cabeçalho
 * de referência para todo domínio de terceiro que a página carregar, e em toda
 * ferramenta de estatística que registrar a URL inteira. Um vazamento desses
 * não tem como ser desfeito.
 *
 * Então o que viaja é `hmac_sha256(email, SEGREDO)`, em hexadecimal. É opaco
 * (não dá para voltar ao endereço), é estável (a mesma pessoa gera sempre a
 * mesma ficha, então um link antigo continua valendo) e é INFALSIFICÁVEL sem o
 * segredo, que é o que impede alguém de descadastrar terceiros em massa
 * varrendo endereços.
 *
 * QUEM RESOLVE A FICHA É O APPS SCRIPT, não este servidor. Ele recalcula o
 * mesmo HMAC linha a linha e vira "Aceita marketing" para Nao onde casar. Duas
 * consequências boas: nenhuma coluna nova na planilha, e este servidor nunca
 * fica sabendo QUEM se descadastrou, porque ele não tem como voltar da ficha ao
 * endereço. Varrer a planilha é O(n) numa lista de leads, ou seja irrelevante.
 *
 * O SEGREDO é `UNSUBSCRIBE_SECRET`, variável de ambiente na Vercel e constante
 * no Apps Script, do mesmo jeito que o `SHEET_TOKEN` já é. Os dois lados
 * precisam do MESMO valor, senão nenhuma linha casa e todo descadastro vira
 * "zero linhas", que é silencioso de propósito (ver a página).
 */

/** O nome da variável, escrito uma vez, para o log e a mensagem de erro. */
export const VARIAVEL_DO_SEGREDO = 'UNSUBSCRIBE_SECRET';

/**
 * NORMALIZAÇÃO ANTES DO HMAC, e ela é o par exato do que o Apps Script faz.
 *
 * Sem isto, "Marta@Exemplo.com " na planilha e "marta@exemplo.com" no envio
 * geram fichas diferentes e a linha nunca casa. A parte à esquerda do @ é
 * tecnicamente sensível a maiúscula na especificação do e-mail, mas nenhum
 * provedor real trata assim, e aqui o custo de errar é uma pessoa que clicou
 * em cancelar e continuou recebendo. Se mudar aqui, muda no Apps Script.
 */
export function normalizarEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** A ficha da pessoa. Hexadecimal, 64 caracteres. */
export function fichaDeDescadastro(email: string, segredo: string): string {
  return createHmac('sha256', segredo)
    .update(normalizarEmail(email))
    .digest('hex');
}

/**
 * A CONFERÊNCIA POSSÍVEL NESTE LADO, que é só a FORMA.
 *
 * Este servidor não consegue dizer se a ficha é de alguém de verdade: ele não
 * tem a lista. O que ele evita é gastar uma ida ao Apps Script com lixo
 * (`?u=` vazio, `?u=<script>`, um id de outro sistema). Quem decide de fato é
 * a varredura da planilha, e ela é a única que sabe.
 */
export function ehFichaValida(ficha: unknown): ficha is string {
  return typeof ficha === 'string' && /^[0-9a-f]{64}$/.test(ficha);
}

/** O nome do parâmetro na URL. Curto de propósito: ele já é longo demais. */
export const PARAMETRO_DA_FICHA = 'u';

/**
 * O ENDEREÇO QUE O PROVEDOR CHAMA no descadastro de um clique (RFC 8058).
 *
 * É PROPOSITALMENTE DIFERENTE da página que a pessoa vê. Os dois endereços
 * existem porque são dois interlocutores diferentes:
 *
 *   . A PÁGINA (`/unsubscribe`, `/cancelar-inscricao`) é para GENTE, chega por
 *     GET a partir do link "cancele aqui" no rodapé, e NÃO muda nada: ela
 *     mostra um botão. Isso existe porque filtro de segurança corporativo e
 *     pré-carregamento do Gmail abrem URLs de e-mail sozinhos.
 *   . ESTA ROTA é para MÁQUINA, aceita SÓ POST, e muda. O Gmail e o Outlook só
 *     a chamam depois que a pessoa aperta o botão "Cancelar inscrição" do
 *     PRÓPRIO cliente de e-mail, que é um clique humano de verdade. Sem GET
 *     nenhum aqui, então nenhum rastreador tem como disparar a baixa.
 */
export const ROTA_UM_CLIQUE = '/api/unsubscribe';

/** Quantas linhas a planilha mudou, ou o motivo de não ter dado. */
export type ResultadoDaBaixa = {ok: boolean; linhas: number; motivo: string};

/**
 * A BAIXA NA PLANILHA. Uma implementação só, dois chamadores: o botão da página
 * e o descadastro de um clique do provedor. Duas cópias disto divergiriam, e a
 * que divergisse em silêncio seria a que ninguém testa à mão.
 *
 * NUNCA loga o token, o segredo nem a ficha inteira. Quem chama decide o log.
 */
export async function darBaixaNaPlanilha(
  ficha: string,
  /** 'resend' quando quem avisou foi o webhook do Resend: o Apps Script não avisa de volta. */
  origem: 'site' | 'resend' = 'site'
): Promise<ResultadoDaBaixa> {
  const url = process.env.SHEET_WEBHOOK_URL;
  const token = process.env.SHEET_TOKEN;
  const segredo = process.env[VARIAVEL_DO_SEGREDO];

  const ausentes: string[] = [];
  if (!url) ausentes.push('SHEET_WEBHOOK_URL');
  if (!token) ausentes.push('SHEET_TOKEN');
  if (!segredo) ausentes.push(VARIAVEL_DO_SEGREDO);
  if (!url || !token || !segredo) {
    return {ok: false, linhas: 0, motivo: `${ausentes.join(' e ')} ausente`};
  }

  if (!ehFichaValida(ficha)) {
    return {ok: false, linhas: 0, motivo: 'ficha com forma invalida'};
  }

  try {
    const resposta = await fetch(url, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      // A AÇÃO é o que separa isto de um envio de formulário no mesmo endpoint.
      // O `token` é o mesmo que já protege a gravação; a ficha é o HMAC, e o
      // SEGREDO nunca viaja: quem o tem dos dois lados é quem calcula.
      body: JSON.stringify({token, acao: 'descadastrar', ficha, origem}),
      // O Apps Script responde 302 para um domínio do googleusercontent, e quem
      // não segue conclui que falhou TENDO MUDADO a planilha.
      redirect: 'follow',
      signal: AbortSignal.timeout(8000)
    });

    const texto = (await resposta.text()).slice(0, 200);
    if (!resposta.ok) {
      return {ok: false, linhas: 0, motivo: `HTTP ${resposta.status} . ${texto}`};
    }

    // O Apps Script responde 200 MESMO quando recusa. Conferir só o status
    // daria "sucesso" sem nenhuma célula mudada.
    const json = JSON.parse(texto) as {
      ok?: unknown;
      linhas?: unknown;
      error?: unknown;
    };
    if (json.ok !== true) {
      return {ok: false, linhas: 0, motivo: String(json.error ?? texto)};
    }
    return {
      ok: true,
      linhas: typeof json.linhas === 'number' ? json.linhas : 0,
      motivo: ''
    };
  } catch (e) {
    return {
      ok: false,
      linhas: 0,
      motivo: e instanceof Error ? `${e.name}: ${e.message}` : String(e)
    };
  }
}

/**
 * Os oito primeiros caracteres da ficha, e só eles, para o log.
 *
 * Bastam para casar uma reclamação com uma linha do log, e não bastam para
 * nada além disso. A ficha inteira é o identificador da pessoa, e log é o lugar
 * mais fácil de vazar do sistema todo.
 */
export function marcaParaLog(ficha: string): string {
  return typeof ficha === 'string' ? ficha.slice(0, 8) : '';
}
