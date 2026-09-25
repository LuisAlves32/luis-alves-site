import type {Locale} from '@/i18n/routing';

// Número único do WhatsApp (roteiro.md: 236 971 2721). O formato wa.me exige
// o DDI 1 do Canadá na frente.
export const WHATSAPP_NUMERO = '12369712721';

export type OrigemWhatsApp =
  | 'hero'
  | 'buyers'
  | 'firstHome'
  | 'sellers'
  | 'presales';

// Mensagens pré-escritas por origem, verbatim do roteiro.md.
const MENSAGENS_WHATSAPP: Record<Locale, Record<OrigemWhatsApp, string>> = {
  en: {
    hero: 'Hi Luis, I found your website and I would like to talk.',
    buyers:
      'Hi Luis, I am thinking about buying and I would like to understand my options.',
    firstHome: 'Hi Luis, it would be my first home. Where do I start?',
    sellers: 'Hi Luis, I am considering selling my property.',
    presales: 'Hi Luis, I have a question about a presale project.'
  },
  pt: {
    hero: 'Oi Luis, cheguei pelo seu site e queria conversar.',
    buyers: 'Oi Luis, estou pensando em comprar e queria entender minhas opções.',
    firstHome: 'Oi Luis, seria meu primeiro imóvel. Por onde eu começo?',
    sellers: 'Oi Luis, estou considerando vender meu imóvel.',
    presales: 'Oi Luis, tenho uma dúvida sobre um projeto de pré-construção.'
  }
};

export function linkWhatsApp(origem: OrigemWhatsApp, locale: Locale): string {
  const texto = encodeURIComponent(MENSAGENS_WHATSAPP[locale][origem]);
  return `https://wa.me/${WHATSAPP_NUMERO}?text=${texto}`;
}

// Dados de contato exibidos (roteiro.md, rodapé). Fonte única.
//
// O `+1` NA EXIBIÇÃO é pedido do cliente, textual: "+1 antes de todos os
// números mano. Sempre." (04/09/2026). Antes disso os LINKS já estavam certos
// (`TELEFONE_TEL` com +1, `WHATSAPP_NUMERO` com o 1 do DDI) e só a exibição
// estava sem: quem clicava ligava certo, quem lia via errado.
//
// Estas duas constantes são a fonte de TODO número visível do site. Se um dia
// um número aparecer escrito à mão num componente, o defeito é esse, não aqui.
export const TELEFONE_DISPLAY = '+1 778 233 9906';
export const TELEFONE_TEL = '+17782339906';
export const WHATSAPP_DISPLAY = '+1 236 971 2721';
// Grafia exatamente como o cliente escreve, com L maiúsculo. A caixa do lado
// esquerdo do @ é significativa na especificação do e-mail e o mailto: a
// preserva; o Gmail ignora, então funciona nos dois casos.
// Trocado em 03/09/2026 por decisão do diretor: o antigo (luis@luisrealtor.ca)
// NÃO recebia nada, porque o domínio luisrealtor.ca não tem registro MX. Todo
// visitante que escrevesse para lá sumia. Não volte ao endereço do domínio sem
// antes conferir o MX.
export const EMAIL_CONTATO = 'Luisalves.realestate@gmail.com';
export const INSTAGRAM_URL = 'https://www.instagram.com/luisalvesrealestate';
export const TIKTOK_URL = 'https://www.tiktok.com/@soldbyluis';
