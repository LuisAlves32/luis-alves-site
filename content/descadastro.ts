import type {Locale} from '@/i18n/routing';

/**
 * A COPY DA PÁGINA DE DESCADASTRO.
 *
 * ATENÇÃO, E ISTO PRECISA DE APROVAÇÃO: estas frases NÃO estão no roteiro.md.
 * O `copy-emails-faltante.md` aprovou a linha do RODAPÉ do e-mail, que é a que
 * convida, e disse que o mecanismo era "rodada de código, não de texto". A
 * página precisa de texto para existir, então ele está escrito aqui, em voz
 * funcional e na primeira pessoa que o roteiro já usa ("Eu mesmo retorno"),
 * isolado num arquivo só para o diretor trocar o que quiser sem procurar.
 *
 * Segue a convenção de `content/privacidade.ts`: o texto mora fora do
 * componente, e o componente só o desenha.
 *
 * O ESTADO DE SUCESSO DIZ O QUE ACONTECEU DE VERDADE, e isso foi pedido: a
 * pessoa deixa de receber as atualizações de mercado, o guia que ela já baixou
 * continua com ela, e nenhuma conversa em andamento é cancelada. Um "pronto!"
 * sozinho deixaria as três dúvidas de pé.
 */

export type EstadoDaPagina = 'confirmacao' | 'sucesso' | 'invalido' | 'falha';

type Bloco = {titulo: string; corpo: string; botao?: string};

export const DESCADASTRO_PAGINA: Record<
  Locale,
  {
    metaTitulo: string;
    voltar: string;
    estados: Record<EstadoDaPagina, Bloco>;
  }
> = {
  en: {
    metaTitulo: 'Unsubscribe from market updates',
    voltar: 'Go to the site',
    estados: {
      confirmacao: {
        titulo: 'Stop the market updates',
        corpo:
          'You will stop receiving the monthly market update. The guide you already downloaded stays yours, and this does not cancel any conversation we have going.',
        botao: 'Stop the market updates'
      },
      sucesso: {
        titulo: 'Done. The market updates have stopped.',
        corpo:
          'The guide you downloaded stays yours. If you want to talk about a property, just reply to any email from me or send a WhatsApp message.'
      },
      invalido: {
        titulo: 'This link is not valid.',
        corpo:
          'It may have been copied halfway. Open the link straight from the email, or reply to that email asking to be removed and I will do it for you.'
      },
      falha: {
        titulo: 'I could not finish that right now.',
        corpo:
          'Try again in a few minutes. If it keeps failing, reply to the email asking to be removed and I will do it for you.'
      }
    }
  },
  pt: {
    metaTitulo: 'Cancelar as atualizações de mercado',
    voltar: 'Ir para o site',
    estados: {
      confirmacao: {
        titulo: 'Cancelar as atualizações de mercado',
        corpo:
          'Você deixa de receber a atualização mensal do mercado. O guia que você já baixou continua seu, e isto não cancela nenhuma conversa em andamento.',
        botao: 'Cancelar as atualizações'
      },
      sucesso: {
        titulo: 'Pronto. As atualizações pararam.',
        corpo:
          'O guia que você baixou continua seu. Se quiser falar sobre um imóvel, é só responder qualquer e-mail meu ou chamar no WhatsApp.'
      },
      invalido: {
        titulo: 'Este link não é válido.',
        corpo:
          'Ele pode ter sido copiado pela metade. Abra o link direto do e-mail, ou responda aquele e-mail pedindo para sair que eu faço por você.'
      },
      falha: {
        titulo: 'Não consegui concluir agora.',
        corpo:
          'Tente de novo em alguns minutos. Se continuar falhando, responda o e-mail pedindo para sair que eu faço por você.'
      }
    }
  }
};
