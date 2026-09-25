/**
 * A CAMADA DE ESTATÍSTICA (Passe 4, skill `seo-e-medicao`; peça do acervo
 * `componentes-ta-online/passe-4-a-praca`).
 *
 * POR QUE UMAMI E NÃO GA4, e é decisão de direção, não detalhe técnico: o site
 * é Modo A. Umami não usa cookie, então não exige aviso de consentimento, e
 * aviso de consentimento no primeiro segundo mata o que o Modo A existe para
 * proteger. O painel se compartilha por um link de leitura: o Luís abre no
 * celular, sem conta e sem senha.
 *
 * VISITA NÃO É RESULTADO. A pergunta do Luís vai ser quanta gente virou
 * CONVERSA, e ela só tem resposta com os eventos abaixo.
 *
 * TRÊS TRAVAS, todas por erro conhecido:
 * 1. O evento de formulário dispara quando a ROTA JÁ CONFIRMOU o envio, nunca
 *    no clique do botão.
 * 2. Nada aqui pode derrubar o envio: bloqueador de anúncio é comum. Sem o
 *    script, `marca` não faz nada e ninguém nota.
 * 3. O script só nasce com `NEXT_PUBLIC_UMAMI_ID` (components/estatistica.tsx).
 */

export const EVENTOS = {
  /** Um dos formulários gravou (contato, avaliação, guia). Propriedade `tipo`. */
  formulario: 'formulario_enviado',
  /** Inscrição no Second Opinion confirmada pela rota. */
  newsletter: 'newsletter_inscrita',
  /** Clique num link do WhatsApp. É o próprio contato: não há sucesso a esperar. */
  whatsapp: 'whatsapp',
  /** Clique para ligar. */
  telefone: 'telefone',
  /** Clique no e-mail. */
  email: 'email',
  /** O botão da página de obrigado que baixa o PDF do guia. */
  guia: 'guia_baixado'
} as const;

type Propriedades = Record<string, string | number | boolean>;

declare global {
  interface Window {
    umami?: {track?: (nome: string, dados?: Propriedades) => void};
  }
}

export function marca(nome: string, dados?: Propriedades): void {
  try {
    window.umami?.track?.(nome, dados);
  } catch {
    /* medição nunca interrompe a pessoa */
  }
}
