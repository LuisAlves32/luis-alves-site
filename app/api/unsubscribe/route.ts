import type {NextRequest} from 'next/server';
import {
  PARAMETRO_DA_FICHA,
  darBaixaNaPlanilha,
  ehFichaValida,
  marcaParaLog
} from '@/lib/descadastro';

/**
 * O DESCADASTRO DE UM CLIQUE (RFC 8058), que é o par do cabeçalho
 * `List-Unsubscribe-Post` do e-mail do guia.
 *
 * QUEM CHAMA ISTO É O GMAIL, o Outlook e o Yahoo, não uma pessoa. Eles mostram
 * um "Cancelar inscrição" ao lado do remetente, e quando alguém aperta ESSE
 * botão, o provedor faz um POST direto aqui, sem abrir navegador nenhum. Isso
 * vale conformidade e vale ENTREGABILIDADE: os provedores grandes usam a
 * presença desses cabeçalhos para decidir reputação de remetente, e um remetente
 * sem eles pontua pior mesmo estando tudo o resto certo.
 *
 * SÓ POST, E NENHUM GET, e essa ausência é a peça de segurança inteira: um
 * rastreador de link ou um pré-carregamento só sabe fazer GET, então não tem
 * como disparar a baixa daqui. Quem chega por GET leva 405.
 *
 * A PESSOA NÃO VÊ ESTA ROTA. O link "cancele aqui" do rodapé aponta para a
 * PÁGINA bilíngue, que mostra um botão e confirma. São dois interlocutores
 * diferentes, e por isso dois endereços.
 *
 * A RESPOSTA É SEMPRE 200 quando a ficha tem forma válida, inclusive quando
 * nenhuma linha muda. Zero linhas é o link antigo de quem já saiu: o estado do
 * mundo já é o que a pessoa pediu, e devolver erro faria o provedor marcar o
 * remetente como quebrado.
 */

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  /* A ficha vem na query, que é como o provedor recebeu a URL no cabeçalho.
     O corpo que o RFC manda (`List-Unsubscribe=One-Click`) não carrega
     identificação nenhuma, e por isso não é lido: ele é só a confirmação de que
     a chamada é mesmo um descadastro de um clique. */
  const ficha = req.nextUrl.searchParams.get(PARAMETRO_DA_FICHA);

  if (!ehFichaValida(ficha)) {
    return new Response('ficha invalida', {status: 400});
  }

  const r = await darBaixaNaPlanilha(ficha);

  if (r.ok) {
    console.info(
      `[descadastro-1clique] ok linhas=${r.linhas} ficha=${marcaParaLog(ficha)}`
    );
    return new Response(null, {status: 200});
  }

  console.error(
    `[descadastro-1clique] FALHOU ficha=${marcaParaLog(ficha)} motivo=${r.motivo}`
  );
  /* 502 e não 200: aqui a falha é nossa, e o provedor tentando de novo mais
     tarde é exatamente o comportamento que se quer. */
  return new Response('falha ao registrar', {status: 502});
}
