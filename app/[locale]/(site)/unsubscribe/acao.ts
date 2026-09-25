'use server';

import {redirect} from 'next/navigation';
import {getPathname} from '@/i18n/navigation';
import {routing, type Locale} from '@/i18n/routing';
import {
  PARAMETRO_DA_FICHA,
  darBaixaNaPlanilha,
  ehFichaValida,
  marcaParaLog
} from '@/lib/descadastro';

/**
 * A BAIXA PELO BOTÃO DA PÁGINA, e ela SÓ acontece num POST.
 *
 * A ARMADILHA QUE ISTO EVITA, e ela é a razão de a página existir em vez de o
 * link do e-mail já resolver: filtro de segurança corporativo e pré-carregamento
 * de link do Gmail ABREM as URLs de um e-mail sozinhos, sem ninguém clicar. Se o
 * GET efetivasse o descadastro, o sistema tiraria da lista pessoas que nunca
 * clicaram, e ninguém descobriria, porque não existe reclamação possível: a
 * pessoa simplesmente para de receber.
 *
 * Então: GET nunca muda estado. O link do e-mail leva a uma página com um botão,
 * e a baixa é o POST desse botão. É o mesmo motivo pelo qual um link de e-mail
 * nunca deve apagar nada.
 *
 * SEM JAVASCRIPT NO NAVEGADOR TAMBÉM FUNCIONA: é um `<form action={...}>` de
 * verdade. Cliente de e-mail abre a página em navegador embutido, e navegador
 * embutido é o lugar onde JS falha mais.
 */
export async function cancelarAtualizacoes(dados: FormData): Promise<void> {
  const ficha = dados.get(PARAMETRO_DA_FICHA);
  const bruto = dados.get('idioma');
  const idioma: Locale = routing.locales.includes(bruto as Locale)
    ? (bruto as Locale)
    : routing.defaultLocale;

  const caminho = getPathname({locale: idioma, href: '/unsubscribe'});

  if (!ehFichaValida(ficha)) {
    redirect(`${caminho}?estado=invalido`);
  }

  const r = await darBaixaNaPlanilha(ficha);

  if (r.ok) {
    console.info(`[descadastro] ok linhas=${r.linhas} ficha=${marcaParaLog(ficha)}`);
  } else {
    console.error(
      `[descadastro] FALHOU ficha=${marcaParaLog(ficha)} motivo=${r.motivo}`
    );
  }

  /* ZERO LINHAS NÃO É ERRO, e isto é decisão de produto, não descuido.
     É o caso de quem já se descadastrou e clicou de novo num e-mail antigo. O
     estado do mundo é exatamente o que a pessoa pediu, então dizer "falhou"
     seria mentir e, pior, faria ela tentar de novo achando que não funcionou.

     O redirecionamento depois do POST é o padrão que impede o "reenviar
     formulário?" do navegador se a pessoa atualizar a página. */
  redirect(`${caminho}?estado=${r.ok ? 'sucesso' : 'falha'}`);
}
