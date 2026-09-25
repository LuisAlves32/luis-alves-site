import {FORMULARIOS, type CampoDeFormulario, type FormularioComEmail} from '@/lib/formularios';
import {
  CAMPO_DE_DECISAO,
  PREFIXO_ASSUNTO,
  ROTULOS_LUIS,
  rotuloLegivel
} from '@/lib/emails/copy';
import {
  COR,
  FONTE,
  escapar,
  escaparMultilinha,
  faixa,
  linhaDeDado,
  moldura,
  rotulo
} from '@/lib/emails/molde';

/**
 * O AVISO PARA O LUÍS. O critério aqui é UM SÓ: velocidade de leitura.
 *
 * Não é peça de marca. É a mensagem que ele abre no celular na fila do café e
 * precisa decidir em dois segundos se responde agora ou às seis da tarde. Por
 * isso, e cada uma destas é uma decisão contra o instinto de "caprichar":
 *
 *   . SEM WORDMARK e SEM RODAPÉ. Ele sabe de quem é o e-mail. Assinatura e
 *     endereço postal aqui só empurrariam o dado para baixo da dobra.
 *   . ARIAL EM TUDO, menos na mensagem escrita pela pessoa. Serifa é para
 *     leitura corrida; isto é uma ficha, e ficha se varre, não se lê.
 *   . O CAMPO DE DECISÃO PROMOVIDO ao topo, grande, e NUNCA repetido na lista
 *     de baixo. Repetir o dado mais importante ensina o olho a ignorar o topo.
 *   . O ASSUNTO carrega esse mesmo campo, porque metade das vezes a decisão se
 *     toma na lista da caixa de entrada, sem abrir nada.
 *
 * `Reply-To` é o e-mail do LEAD (montado em `index.ts`): responder é a ação
 * mais provável, e ela tem que ser um toque, sem copiar endereço.
 */

/**
 * O que o Luís confere primeiro, já em texto puro. Vazio quando não veio.
 *
 * O RÓTULO LEGÍVEL, NUNCA O VALOR CRU, e isto corrige um defeito da 4.4: o
 * aviso abria com "COMO POSSO AJUDAR?" e, no maior corpo da peça inteira, a
 * palavra `both`. Na planilha `both` embaixo de uma coluna "Perfil" tem
 * contexto; aqui é a primeira coisa que se lê e não tem nenhum.
 *
 * NO IDIOMA DO LEAD, e não em português como o resto deste aviso: o rótulo do
 * campo é a moldura e é do Luís, mas o VALOR é a resposta da pessoa, e ver a
 * frase exata que ela viu na tela vale mais do que a tradução dela.
 */
function valorDeDecisao(
  formulario: FormularioComEmail,
  campos: Record<string, string | boolean>,
  idioma: 'en' | 'pt'
): string {
  const campo = CAMPO_DE_DECISAO[formulario];
  const bruto = campos[campo];
  if (typeof bruto !== 'string') return '';
  return rotuloLegivel(campo, bruto.trim(), idioma);
}

/**
 * O ASSUNTO, na grafia que o diretor pediu, com o dado de decisão na frente do
 * nome. O separador é o ponto médio, o mesmo do rodapé e dos kickers do site.
 *
 * Segmento vazio SAI da linha, e isto importa: `topic` e `profile` são campos
 * opcionais, e "Contato ·  · Maria" com o buraco no meio é pior que
 * "Contato · Maria". Quem não escolheu assunto não fica com um vão.
 */
export function assuntoParaLuis(
  formulario: FormularioComEmail,
  campos: Record<string, string | boolean>,
  idioma: 'en' | 'pt'
): string {
  const nome = typeof campos.name === 'string' ? campos.name.trim() : '';
  const partes = [
    PREFIXO_ASSUNTO[formulario],
    formulario === 'guia' ? '' : valorDeDecisao(formulario, campos, idioma),
    nome
  ].filter((p) => p !== '');
  return partes.join(' · ');
}

/** Os campos do contrato, na ordem dele, MENOS o que já subiu para o topo. */
function camposDaLista(formulario: FormularioComEmail): readonly CampoDeFormulario[] {
  const promovido = CAMPO_DE_DECISAO[formulario];
  return (FORMULARIOS[formulario] as readonly CampoDeFormulario[]).filter(
    (campo) => campo !== promovido
  );
}

function textoDoCampo(
  campo: string,
  valor: string | boolean | undefined,
  idioma: 'en' | 'pt'
): string {
  if (campo === 'consent') return valor === true ? 'Sim' : 'Não';
  if (typeof valor !== 'string') return '';
  return rotuloLegivel(campo, valor.trim(), idioma);
}

export function htmlParaLuis(dados: {
  formulario: FormularioComEmail;
  idioma: 'en' | 'pt';
  origem: string;
  campanha: string;
  campos: Record<string, string | boolean>;
}): string {
  const {formulario, idioma, origem, campanha, campos} = dados;
  const decisao = valorDeDecisao(formulario, campos, idioma);
  const email = textoDoCampo('email', campos.email, idioma);

  /* O TOPO: o campo de decisão, grande. Quando ele veio vazio (os dois campos
     de escolha são opcionais), o lugar não fica com um buraco rotulado: quem
     sobe é o nome, que nunca é vazio porque é obrigatório na rota. */
  const temDecisao = decisao !== '';
  const etiquetaTopo = temDecisao
    ? (ROTULOS_LUIS[CAMPO_DE_DECISAO[formulario]] ?? CAMPO_DE_DECISAO[formulario])
    : ROTULOS_LUIS.name;
  const valorTopo = temDecisao ? decisao : textoDoCampo('name', campos.name, idioma);

  const topo = `${rotulo(etiquetaTopo, COR.apoioSobreTinta)}<div style="margin:6px 0 0 0;font-family:${FONTE.rotulo};font-size:22px;line-height:30px;font-weight:bold;color:${COR.papel};word-break:break-word;">${escapar(valorTopo)}</div>`;

  /* A LISTA. `message` e `consentTexto` são prosa e vão em Georgia; o resto é
     dado e fica em Arial, que se varre mais rápido. */
  const linhas = camposDaLista(formulario)
    .map((campo, indice) => {
      const texto = textoDoCampo(campo, campos[campo], idioma);
      if (texto === '') return '';
      const prosa = campo === 'message' || campo === 'consentTexto';
      const valorHtml =
        campo === 'email'
          ? `<a href="mailto:${escapar(texto)}" style="color:${COR.avanco};text-decoration:underline;">${escapar(texto)}</a>`
          : escaparMultilinha(texto);
      return linhaDeDado({
        etiqueta: ROTULOS_LUIS[campo] ?? campo,
        valorHtml,
        corEtiqueta: COR.apoioSobrePapel,
        corValor: COR.tinta,
        primeira: indice === 0,
        fonte: prosa ? 'leitura' : 'rotulo'
      });
    })
    .filter((l) => l !== '')
    .join('');

  /* O ENVELOPE: de que página e de que anúncio veio. Fica por último e em corpo
     menor porque não é o que decide a resposta, mas é o que responde "de onde
     saiu esse lead" quando a pergunta aparece semanas depois. */
  const envelope = [
    {campo: 'idioma', texto: idioma},
    {campo: 'origem', texto: origem},
    {campo: 'campanha', texto: campanha}
  ]
    .map(
      ({campo, texto}) =>
        /* O rótulo era LÁPIS, e a prova reprovou: 1,46:1 sobre o Papel. Lápis é
           cor de BORDA no design.md, nunca de texto, e usá-la aqui foi erro meu.
           Agora rótulo e valor se distinguem por PESO e por COR DE TEXTO de
           verdade (apoio contra Tinta), não por um cinza lavado. */
        `<tr><td style="padding:0 0 4px 0;font-family:${FONTE.rotulo};font-size:13px;line-height:19px;color:${COR.tinta};word-break:break-word;"><span style="color:${COR.apoioSobrePapel};">${escapar(ROTULOS_LUIS[campo] ?? campo)}</span>&nbsp;&nbsp;${texto ? escapar(texto) : '&mdash;'}</td></tr>`
    )
    .join('');

  const corpo = [
    faixa({fundo: COR.tinta, conteudo: topo, respiro: '24px 24px'}),
    faixa({
      fundo: COR.branco,
      conteudo: linhas,
      respiro: '26px 24px'
    }),
    faixa({
      fundo: COR.papel,
      conteudo: `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;border-collapse:collapse;">${envelope}</table>`,
      respiro: '18px 24px'
    })
  ].join('\n');

  return moldura({
    titulo: assuntoParaLuis(formulario, campos, idioma),
    // A prévia da caixa de entrada já mostra quem é e como responder.
    preview: email,
    fundo: COR.papel,
    corpo
  });
}

/**
 * A VERSÃO EM TEXTO PURO. Vai junto do HTML em todo envio, sempre: mensagem só
 * em HTML pontua pior nos filtros de spam, e um aviso de lead novo caindo no
 * spam é o defeito mais caro que este sistema pode ter.
 */
export function textoParaLuis(dados: {
  formulario: FormularioComEmail;
  idioma: 'en' | 'pt';
  origem: string;
  campanha: string;
  campos: Record<string, string | boolean>;
}): string {
  const {formulario, idioma, origem, campanha, campos} = dados;
  const decisao = valorDeDecisao(formulario, campos, idioma);
  const promovido = CAMPO_DE_DECISAO[formulario];

  const linhas: string[] = [];
  if (decisao !== '') {
    linhas.push(`${ROTULOS_LUIS[promovido] ?? promovido}: ${decisao}`, '');
  }
  for (const campo of camposDaLista(formulario)) {
    const texto = textoDoCampo(campo, campos[campo], idioma);
    if (texto === '') continue;
    linhas.push(`${ROTULOS_LUIS[campo] ?? campo}: ${texto}`);
  }
  linhas.push(
    '',
    `${ROTULOS_LUIS.idioma}: ${idioma}`,
    `${ROTULOS_LUIS.origem}: ${origem || '-'}`,
    `${ROTULOS_LUIS.campanha}: ${campanha || '-'}`
  );
  return linhas.join('\n');
}
