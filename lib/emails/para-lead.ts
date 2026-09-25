import {FORMULARIOS, type CampoDeFormulario, type FormularioComEmail} from '@/lib/formularios';
import {enderecoDoGuia} from '@/lib/guia-pdf';
import {
  DESCADASTRO,
  IDENTIFICACAO,
  PECAS,
  ROTULOS_LEAD,
  rotuloLegivel
} from '@/lib/emails/copy';
import {
  COR,
  FONTE,
  botao,
  escapar,
  escaparMultilinha,
  faixa,
  linhaDeDado,
  moldura,
  paragrafo,
  rotulo,
  wordmark
} from '@/lib/emails/molde';

/**
 * O E-MAIL PARA O LEAD. Critério oposto ao do aviso interno: aqui é MARCA.
 *
 * É o primeiro objeto de design que a pessoa recebe depois de sair do site, e
 * chega numa caixa de entrada, ao lado de promoção de varejo. O que ele tem
 * que fazer em um segundo é parecer que veio de alguém, não de um sistema.
 *
 * O DESENHO, e de onde cada decisão vem:
 *   . QUATRO FAIXAS, e a separação entre elas é COR e ESPAÇO, nunca filete. O
 *     diretor proibiu fio decorativo, e o molde clássico deste tipo de e-mail é
 *     justamente um filete dourado centralizado. Aqui a Tinta abre, o Papel
 *     recebe a leitura, e a Tinta fecha com a identificação.
 *   . GEORGIA no corpo. O site lê em Instrument Serif e a landing em Lora;
 *     nenhuma das duas existe num cliente de e-mail sem webfont, e webfont está
 *     proibida. Georgia é a serifa que existe em todo Windows e todo macOS, e
 *     é a que preserva o registro editorial da marca.
 *   . O WORDMARK É TEXTO, com o mesmo `letter-spacing` dos kickers do site.
 *     Imagem chegaria bloqueada no Outlook e decapitaria a peça.
 *
 * O LATÃO, e isto é lei do projeto: `#B08D57` é EXCLUSIVO da landing do ebook.
 * O e-mail de entrega do guia É a landing do ebook continuando na caixa de
 * entrada, então o botão dele é latão. Os e-mails de contato e de avaliação são
 * site institucional e não têm botão nenhum: não há para onde mandar a pessoa,
 * e um botão inventado ali seria enfeite.
 *
 * `Reply-To` é o e-mail do LUÍS (montado em `index.ts`): os dois e-mails que
 * pedem resposta ("é só responder este e-mail", "responda este e-mail dizendo
 * isso") precisam que essa resposta chegue nele, não no remetente técnico.
 */

/**
 * O nome entra no lugar do marcador do roteiro (`[nome]` / `[name]`).
 *
 * Nome vazio não deveria acontecer (a rota exige `name`), mas se acontecer a
 * saudação inteira SAI, em vez de virar "Oi, ." na cara do lead. É o tipo de
 * defeito que só aparece em produção e humilha a peça inteira.
 */
function aplicarNome(
  corpo: string,
  marcador: string,
  nome: string,
  /**
   * `escapar` quando o destino é o HTML, identidade quando é o texto puro. Sem
   * este parâmetro o "&" de um "Marta & Filhos" chegaria escrito "&amp;" na
   * versão em texto, que é justamente a que existe para ser lida crua.
   */
  tratar: (v: string) => string
): string {
  if (marcador === '') return corpo;
  const limpo = nome.trim();
  if (limpo === '') {
    return corpo.replace(/^(Oi, \[nome\]\. |Hi \[name\]\. )/, '');
  }
  return corpo.split(marcador).join(tratar(limpo));
}

/** Os campos que voltam para o lead na cópia do envio. */
function camposDaCopia(formulario: FormularioComEmail): readonly CampoDeFormulario[] {
  return (FORMULARIOS[formulario] as readonly CampoDeFormulario[]).filter(
    // `consentTexto` é prova jurídica para o nosso lado, não informação para
    // quem enviou: a pessoa acabou de ler a frase na tela, ao lado da caixa.
    // Repeti-la aqui só empurraria a assinatura para fora do primeiro olhar.
    (campo) => campo !== 'consentTexto'
  );
}

export type ConteudoDoLead = {
  assunto: string;
  html: string;
  texto: string;
};

export function conteudoParaLead(dados: {
  formulario: FormularioComEmail;
  idioma: 'en' | 'pt';
  campos: Record<string, string | boolean>;
  /** Base absoluta do site. Link relativo em e-mail é link morto. */
  base: string;
  /**
   * A URL de descadastro desta pessoa, já absoluta e com a ficha. Vem pronta de
   * `index.ts` porque montá-la exige o segredo e o mapa de rotas localizadas,
   * e nada disso tem o que fazer dentro de um montador de HTML.
   * Vazia quando o segredo não está configurado: aí o rodapé sai sem a linha,
   * em vez de sair com um link quebrado.
   */
  urlDescadastro?: string;
}): ConteudoDoLead {
  const {formulario, idioma, campos, base, urlDescadastro = ''} = dados;
  const r = ROTULOS_LEAD[idioma];
  const peca = PECAS[formulario][idioma];
  const nome = typeof campos.name === 'string' ? campos.name : '';
  const ehGuia = formulario === 'guia';

  /* O ACENTO E O TEXTO QUE VAI EM CIMA DELE, sempre em par.
     Branco sobre latão dá 3,09:1 e REPROVA, e a prova da 4.4 pegou isso. O site
     já tinha resolvido na tela: `preenchimentoLatao`, em `components/landing/
     pele.tsx`, é `bg-latao text-tinta`, que dá 5,05:1. O e-mail faz o mesmo, e
     não é só conformidade: latão com texto branco parece dourado de banner de
     promoção, e latão com Tinta parece papel timbrado. */
  const acento = COR.latao;
  const corDoRotuloDoBotao = COR.tinta;

  const corpoHtml = aplicarNome(peca.corpo, peca.marcador, nome, escapar);

  /* O LINK DO PDF: ABSOLUTO, montado sobre a base do site. NUNCA anexo: dois
     megabytes de anexo derrubam entregabilidade e vários filtros arrancam o
     arquivo no caminho. E é o link que torna o guia recuperável no dia em que a
     pessoa fechar a aba, que é a razão inteira desta rodada existir.
     Desde 24/09/2026 o arquivo mora no Blob da Vercel (fora do repositório
     público); `enderecoDoGuia` escolhe o Blob ou, sem a variável, o legado. O
     e-mail NÃO passa pela porta `/api/guia`: quem tem o e-mail já pediu. */
  const href = enderecoDoGuia(idioma, base);

  /* A CÓPIA DO QUE A PESSOA ENVIOU, para ela saber o que chegou.
     Os dois campos de escolha voltam com o RÓTULO que ela viu na tela, nunca
     com o valor cru: quem recebe "How can I help? / both" não reconhece a
     própria resposta. O valor cru continua indo para a planilha, intocado. */
  const valorDoCampo = (campo: string): string => {
    const bruto = campos[campo];
    if (campo === 'consent') return bruto === true ? r.sim : r.nao;
    if (typeof bruto !== 'string') return '';
    return rotuloLegivel(campo, bruto.trim(), idioma);
  };

  const linhasDaCopia = camposDaCopia(formulario)
    .map((campo, indice) => {
      const texto = valorDoCampo(campo);
      if (texto === '') return '';
      return linhaDeDado({
        etiqueta: (r as Record<string, string>)[campo] ?? campo,
        valorHtml: escaparMultilinha(texto),
        corEtiqueta: COR.apoioSobrePapel,
        corValor: COR.tinta,
        primeira: indice === 0,
        fonte: campo === 'message' ? 'leitura' : 'rotulo'
      });
    })
    .filter((l) => l !== '')
    .join('');

  /* O RODAPÉ, e os TRÊS ITENS que a CASL exige moram nele: identificação do
     remetente, endereço postal e link de descadastro funcional.

     A LINHA DE DESCADASTRO SÓ NO E-MAIL DO GUIA, e isso está escrito no
     roteiro: contato e avaliação são resposta a um pedido direto e não carregam
     aceite de marketing nenhum. Oferecer saída neles faria a pessoa achar que
     está cancelando o ATENDIMENTO, que é o oposto do que ela quer.

     A âncora é recortada da frase inteira em vez de a frase chegar partida em
     três pedaços: assim `copy.ts` guarda a sentença como o roteiro a escreveu,
     e o conferidor consegue comparar verbatim. */
  const d = DESCADASTRO[idioma];
  const cortou = d.acao.split(d.ancora);
  const linhaDescadastro =
    ehGuia && urlDescadastro !== '' && cortou.length === 2
      ? `<div style="margin:14px 0 0 0;font-family:${FONTE.rotulo};font-size:12px;line-height:19px;color:${COR.apoioSobreTinta};">${escapar(d.motivo)}<br>${escapar(cortou[0])}<a href="${escapar(urlDescadastro)}" style="color:${COR.papel};text-decoration:underline;">${escapar(d.ancora)}</a>${escapar(cortou[1])}</div>`
      : '';

  const rodape = `${wordmark(COR.papel)}<div style="margin:10px 0 0 0;font-family:${FONTE.rotulo};font-size:13px;line-height:20px;color:${COR.apoioSobreTinta};">${escapar(IDENTIFICACAO.corretora)}<br>${escapar(IDENTIFICACAO.licenca)}<br>${escapar(IDENTIFICACAO.endereco1)}<br>${escapar(IDENTIFICACAO.endereco2)}</div>${linhaDescadastro}`;

  const leitura = [
    paragrafo(corpoHtml, COR.tinta),
    peca.assinatura
      ? paragrafo(escapar(peca.assinatura), COR.apoioSobrePapel, {
          tamanho: 15,
          alturaLinha: 23,
          topo: 22
        })
      : '',
    peca.botao
      ? `<div style="margin:26px 0 0 0;">${botao({
          rotulo: peca.botao,
          href,
          fundo: acento,
          cor: corDoRotuloDoBotao
        })}</div>`
      : ''
  ]
    .filter((p) => p !== '')
    .join('');

  const corpo = [
    faixa({
      fundo: COR.tinta,
      conteudo: wordmark(COR.papel),
      respiro: '26px 24px'
    }),
    faixa({fundo: COR.branco, conteudo: leitura, respiro: '30px 24px'}),
    faixa({
      fundo: COR.papel,
      conteudo: `${rotulo(r.copiaDoEnvio, COR.apoioSobrePapel)}<div style="height:14px;line-height:14px;font-size:0;">&nbsp;</div>${linhasDaCopia}`,
      respiro: '24px 24px'
    }),
    faixa({fundo: COR.tinta, conteudo: rodape, respiro: '24px 24px'})
  ].join('\n');

  const html = moldura({
    titulo: peca.assunto,
    preview: peca.preHeader,
    fundo: COR.papel,
    corpo
  });

  /* A VERSÃO EM TEXTO PURO, sempre junto do HTML. */
  const textoCopia = camposDaCopia(formulario)
    .map((campo) => {
      const texto = valorDoCampo(campo);
      if (texto === '') return '';
      return `${(r as Record<string, string>)[campo] ?? campo}: ${texto}`;
    })
    .filter((l) => l !== '')
    .join('\n');

  const texto = [
    aplicarNome(peca.corpo, peca.marcador, nome, (v) => v),
    peca.assinatura ? `\n${peca.assinatura}` : '',
    peca.botao ? `\n${peca.botao}: ${href}` : '',
    `\n${r.copiaDoEnvio}`,
    textoCopia,
    `\n${IDENTIFICACAO.nome}`,
    IDENTIFICACAO.corretora,
    IDENTIFICACAO.licenca,
    IDENTIFICACAO.endereco1,
    IDENTIFICACAO.endereco2,
    linhaDescadastro !== ''
      ? `\n${d.motivo}\n${d.acao}\n${urlDescadastro}`
      : ''
  ]
    .filter((l) => l !== '')
    .join('\n');

  return {assunto: peca.assunto, html, texto};
}
