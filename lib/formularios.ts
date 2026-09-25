/**
 * CONTRATO DE CAMPOS DOS FORMULÁRIOS.
 *
 * Este arquivo é CONTRATO com o `apps-script-luis.js` (a cópia dele vive na
 * pasta acima, e é colada no Apps Script da planilha). Cada chave de
 * `FORMULARIOS` vira uma COLUNA da aba correspondente, NA ORDEM EXATA em que
 * está escrita aqui. O `ABAS[...].chaves` de lá é o espelho desta lista.
 *
 * Renomear ou reordenar de um lado só desalinha a planilha inteira EM
 * SILÊNCIO: a coluna sai vazia, ninguém recebe erro, e o defeito só aparece
 * dias depois, quando alguém abre a planilha. Mexeu aqui, mexeu lá.
 *
 * A lista é UMA SÓ de propósito: o formulário e a rota (`app/api/enviar`) leem
 * daqui. Duas listas sempre divergem, e quando divergem é sempre o servidor que
 * fica permissivo.
 *
 * Diferença deliberada entre esta lista e a do Apps Script: lá cada aba termina
 * com `idioma`, `origem` e `campanha`. Aqui não, porque esses três são do
 * ENVELOPE (valem para os três formulários) e a rota os acrescenta ao corpo
 * antes de enviar. O corpo que vai para o Apps Script é PLANO: ele lê
 * `d[chave]` no topo do JSON.
 */

export const FORMULARIOS = {
  guia: ['name', 'email', 'profile', 'consent', 'consentTexto'],
  contato: ['name', 'email', 'phone', 'topic', 'message'],
  avaliacao: [
    'name',
    'email',
    'phone',
    'propertyAddress',
    'propertyType',
    'timeline',
    'message'
  ],
  // A newsletter do blog (Second Opinion, 24/09/2026). O consentimento é
  // OBRIGATÓRIO aqui, ao contrário do guia: a inscrição NÃO É outra coisa senão
  // o aceite de receber os e-mails. A rota confere `consent === true`.
  newsletter: ['name', 'email', 'consent', 'consentTexto']
} as const;

export type TipoFormulario = keyof typeof FORMULARIOS;
/** Os formulários que disparam e-mail (aviso ao Luís e confirmação ao lead). A
    newsletter não dispara: a cada nota sai um Broadcast, não um e-mail por inscrição. */
export type FormularioComEmail = Exclude<TipoFormulario, 'newsletter'>;
export type CampoDeFormulario =
  (typeof FORMULARIOS)[TipoFormulario][number];

/**
 * O MÍNIMO para uma linha valer alguma coisa: um nome para chamar a pessoa e um
 * e-mail para responder. Nada mais é obrigatório nos três, e isso é decisão de
 * projeto, não descuido: cada campo obrigatório a mais é uma pessoa a menos que
 * termina o formulário, e telefone é justamente o que trava quem está só
 * pesquisando.
 */
export const OBRIGATORIOS = {
  guia: ['name', 'email'],
  contato: ['name', 'email'],
  avaliacao: ['name', 'email'],
  newsletter: ['name', 'email']
} as const satisfies Record<TipoFormulario, readonly CampoDeFormulario[]>;

/**
 * OS VALORES QUE TRAFEGAM nos dois campos de escolha do site.
 *
 * Este é o ÚNICO lugar onde eles existem: a tela lê `chave` para achar o rótulo
 * traduzido, e o `<input>`/`<option>` carrega `valor`. Uma lista, duas leituras.
 *
 * POR QUE ISTO EXISTE. Até 04/09 o `profile` da landing gravava "o1".."o4" na
 * planilha (não diz nada para quem abre) e o `topic` do contato gravava o
 * RÓTULO TRADUZIDO, então a mesma intenção virava duas strings diferentes e a
 * coluna não agrupava. O roteiro.md pede justamente para acompanhar a
 * distribuição do terceiro campo da landing, para decidir qual é o segundo
 * ebook. Com a coluna assim, não dava.
 *
 * POR QUE EM INGLÊS, e não em português: o valor precisa ser ESTÁVEL, o site
 * tem inglês como idioma padrão, e se um dia estes leads forem para um CRM é
 * isto que ele espera receber.
 *
 * O RÓTULO NA TELA NÃO MUDA, em idioma nenhum. Mudou só o que viaja.
 *
 * `chave` é o sufixo da chave de i18n: `landing.s1.opcoes.<chave>` para o
 * perfil e `paginaContato.campos.opcoes.<chave>` para o assunto. Acrescentar
 * uma opção é acrescentar uma linha AQUI e a tradução nos dois messages/.
 */
export const PERFIS = [
  {chave: 'o1', valor: 'buying'},
  {chave: 'o2', valor: 'selling'},
  {chave: 'o3', valor: 'both'},
  {chave: 'o4', valor: 'researching'}
] as const;

export const ASSUNTOS = [
  {chave: 'o1', valor: 'buying'},
  {chave: 'o2', valor: 'selling'},
  {chave: 'o3', valor: 'first-home'},
  {chave: 'o4', valor: 'presale'},
  {chave: 'o5', valor: 'other'}
] as const;

/**
 * Whitelist dos dois campos de escolha, usada pela rota.
 *
 * Vazio é sempre aceito: os dois campos são opcionais, e ninguém é obrigado a
 * escolher. Valor DESCONHECIDO vira vazio e vai para o LOG, nunca para a
 * célula: o ponto desta rodada é a coluna agrupar, e uma string inventada por
 * um robô estraga exatamente isso. O lead continua sendo gravado, porque
 * perder a pessoa inteira por causa de um campo opcional seria pior.
 *
 * Como a lista acima é a única fonte das opções da tela, um valor fora dela
 * nunca pode ter saído do nosso próprio formulário.
 */
export const VALORES_ACEITOS: Partial<Record<CampoDeFormulario, readonly string[]>> = {
  profile: PERFIS.map((p) => p.valor),
  topic: ASSUNTOS.map((a) => a.valor)
};

/**
 * O CAMPO-ARMADILHA (honeypot). Existe escondido no formulário, fora da tela e
 * fora da árvore de acessibilidade. Gente nunca o vê; robô preenche tudo que
 * encontra. É o que substitui o CAPTCHA, que quebraria o respiro da página.
 */
export const CAMPO_ARMADILHA = 'empresa';

/**
 * PISO de tempo entre montar o formulário e enviar. PISO E SÓ PISO, NUNCA TETO:
 * gente real abre o formulário, vai buscar uma informação, atende o telefone e
 * volta no dia seguinte com a aba aberta. Um teto descartaria esse envio em
 * silêncio, mostrando sucesso na tela.
 */
export const PISO_TEMPO_MS = 4000;

/** Freio por IP: cinco envios por dez minutos. */
export const FREIO_LIMITE = 5;
export const FREIO_JANELA_MS = 10 * 60 * 1000;

/**
 * Teto de tamanho por campo, para uma linha não estourar a célula da planilha.
 * O corte é silencioso (truncagem), porque devolver erro a quem colou um texto
 * longo perde o lead inteiro por causa do excesso.
 *
 * `consentTexto` tem teto próprio, e o motivo é jurídico: ele guarda a FRASE
 * EXATA que a pessoa aceitou, que é o que a CASL pede para provar. Cortada ao
 * meio, essa prova vale menos que nenhuma. A frase de hoje tem cerca de 140
 * caracteres, então 200 não deixaria margem para a revisão do advogado.
 */
export const TETO_PADRAO = 200;
export const TETOS: Partial<Record<CampoDeFormulario, number>> = {
  message: 2000,
  consentTexto: 500
};

export function tetoDoCampo(campo: CampoDeFormulario): number {
  return TETOS[campo] ?? TETO_PADRAO;
}

/**
 * TETOS DOS CAMPOS DE ENVELOPE. Moram aqui, junto dos outros, porque teto solto
 * dentro da rota é teto que ninguém acha quando precisa mudar.
 *
 * `origem` cabe folgado em 200: é caminho mais âncora (`/selling#market-review`
 * são 22 caracteres).
 *
 * `campanha` é a query CRUA da página, e 500 existe para caber uma marcação de
 * rede de anúncio inteira, que empilha utm_source, utm_medium, utm_campaign,
 * utm_content, utm_term, gclid e fbclid sem pedir licença. O corte é SILENCIOSO,
 * como o dos outros campos: query gigante nunca pode custar um lead.
 */
export const TETO_ORIGEM = 200;
export const TETO_CAMPANHA = 500;

/**
 * Whitelist do tipo de formulário. Qualquer outro valor é 400 na rota: o
 * envelope vem do navegador, e o navegador não decide em que aba grava.
 */
export function ehTipoFormulario(valor: unknown): valor is TipoFormulario {
  return typeof valor === 'string' && Object.hasOwn(FORMULARIOS, valor);
}

/** Idiomas aceitos no envelope. Espelha `i18n/routing.ts`. */
export function ehIdioma(valor: unknown): valor is 'en' | 'pt' {
  return valor === 'en' || valor === 'pt';
}
