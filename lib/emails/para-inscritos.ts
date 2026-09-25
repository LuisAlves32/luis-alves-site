import {IDENTIFICACAO, NEWSLETTER} from '@/lib/emails/copy';
import {COR, FONTE, botao, escapar, faixa, moldura, paragrafo, rotulo, wordmark} from '@/lib/emails/molde';
import {colarUltimasPalavrasEm, TETO_CORPO} from '@/lib/tipografia-notas';

/**
 * O E-MAIL DE CADA NOTA do Second Opinion, o que sai como Broadcast do Resend para os
 * inscritos do idioma (blog/newsletter.md, "O e-mail de cada artigo").
 *
 * O DESENHO, e o que ele herda do molde dos e-mails do funil (`molde.ts`), sem exceção:
 * tabela, estilo inline, Georgia e Arial, nenhuma imagem, nenhum filete. Separação por
 * COR e ESPAÇO.
 *
 * A CAPA VIRA TIPOGRAFIA. O `newsletter.md` previa a capa exportada como imagem; o
 * molde proíbe imagem (o Outlook bloqueia por padrão e a peça chegaria decapitada),
 * e a lei do molde ganha. O número da nota em Arial Bold grande, com o rótulo em
 * caixa alta embaixo, é o mesmo gesto da capa do site, e chega mesmo com imagem
 * bloqueada. Sem a linha da cota, porque filete está proibido aqui.
 *
 * NÃO é o artigo inteiro: o título, o número, dois parágrafos de abertura e UM botão.
 * E-mail longo é cortado pelo Gmail em 102 KB e perde a leitura que o site dá.
 *
 * O rodapé leva os três itens da CASL: quem envia (nome, corretora, licença), o
 * endereço postal e o descadastro. O link é o marcador do Resend, que ele troca pelo
 * endereço de cada contato no envio e que vale na hora.
 */

export const MARCADOR_DESCADASTRO = '{{{RESEND_UNSUBSCRIBE_URL}}}';

export type DadosDoEmailDaNota = {
  idioma: 'en' | 'pt';
  /** "Second Opinion" / "Segunda Opinião". */
  nomeDoBlog: string;
  /** "N.º 002", vazio se não houver. */
  serie: string;
  /** O nome da categoria no idioma ("Buying"). */
  categoria: string;
  titulo: string;
  /** "$11,250"; vazio numa nota sem número. */
  numero: string;
  rotuloDoNumero: string;
  /** "Province of BC, measured Sep 2026"; vazio sem fonte. */
  fonte: string;
  abertura: string[];
  /** URL absoluta da nota. */
  url: string;
  /** URL absoluta do site, para o "luisrealtor.ca" do rodapé. */
  base: string;
};

export function emailDaNota(d: DadosDoEmailDaNota): {assunto: string; html: string; texto: string} {
  const c = NEWSLETTER[d.idioma];
  const kicker = [d.serie, d.categoria].filter(Boolean);

  const cabeca = `${wordmark(COR.papel)}<div style="margin:6px 0 0 0;font-family:${FONTE.leitura};font-size:20px;line-height:26px;font-style:italic;color:${COR.papel};">${escapar(d.nomeDoBlog)}</div>`;

  /* O kicker "N.º 002 / BUYING", com a barra em Avanço como no site. */
  const linhaKicker = `<div style="margin:0;font-family:${FONTE.rotulo};font-size:11px;line-height:16px;letter-spacing:0.16em;text-transform:uppercase;color:${COR.apoioSobrePapel};">${kicker
    .map(escapar)
    .join(`<span style="color:${COR.avanco};padding:0 8px;">/</span>`)}</div>`;

  const numero = d.numero
    ? `<div style="margin:22px 0 0 0;font-family:${FONTE.rotulo};font-size:52px;line-height:56px;font-weight:bold;letter-spacing:-1px;color:${COR.tinta};">${escapar(d.numero)}</div>${
        d.rotuloDoNumero ? rotulo(d.rotuloDoNumero, COR.grafite, 10) : ''
      }`
    : '';

  const titulo = `<h1 style="margin:${d.numero ? 26 : 18}px 0 0 0;font-family:${FONTE.leitura};font-size:26px;line-height:32px;font-weight:normal;color:${COR.tinta};">${escapar(colarUltimasPalavrasEm(d.titulo))}</h1>`;

  /* As órfãs valem no e-mail também: "things." sozinho fechava o parágrafo a 375px. O NBSP
     funciona em todo cliente de e-mail. Só no HTML: a versão em texto puro sai limpa. */
  const abertura = d.abertura
    .map((p, i) => paragrafo(escapar(colarUltimasPalavrasEm(p, TETO_CORPO)), COR.tinta, {topo: i === 0 ? 18 : 14}))
    .join('');

  const fonte = d.fonte
    ? `<div style="margin:18px 0 0 0;font-family:${FONTE.rotulo};font-size:13px;line-height:19px;color:${COR.apoioSobrePapel};">${escapar(c.fonte)}: ${escapar(colarUltimasPalavrasEm(d.fonte))}</div>`
    : '';

  const acao = `<div style="margin:26px 0 0 0;">${botao({rotulo: c.botao, href: d.url, fundo: COR.avanco, cor: COR.branco})}</div>`;

  const [antes, depois] = c.acao.split(c.ancora);
  const dominio = d.base.replace(/^https?:\/\//, '');
  const rodape = `${wordmark(COR.papel)}<div style="margin:10px 0 0 0;font-family:${FONTE.rotulo};font-size:13px;line-height:20px;color:${COR.apoioSobreTinta};">${escapar(IDENTIFICACAO.corretora)}<br>${escapar(IDENTIFICACAO.licenca)}<br>${escapar(IDENTIFICACAO.endereco1)}<br>${escapar(IDENTIFICACAO.endereco2)}<br><a href="${escapar(d.base)}" style="color:${COR.papel};text-decoration:underline;">${escapar(dominio)}</a></div><div style="margin:14px 0 0 0;font-family:${FONTE.rotulo};font-size:12px;line-height:19px;color:${COR.apoioSobreTinta};">${escapar(c.motivo)}<br>${escapar(antes)}<a href="${MARCADOR_DESCADASTRO}" style="color:${COR.papel};text-decoration:underline;">${escapar(c.ancora)}</a>${escapar(depois ?? '')}</div>`;

  const corpo = [
    faixa({fundo: COR.tinta, conteudo: cabeca, respiro: '24px 24px'}),
    faixa({
      fundo: COR.branco,
      conteudo: `${linhaKicker}${numero}${titulo}${abertura}${fonte}${acao}`,
      respiro: '30px 24px'
    }),
    faixa({fundo: COR.tinta, conteudo: rodape, respiro: '24px 24px'})
  ].join('\n');

  const preview = d.numero ? `${d.numero}, ${d.rotuloDoNumero}.` : d.abertura[0] ?? '';
  const html = moldura({titulo: d.titulo, preview, fundo: COR.papel, corpo}).replace(
    '<html lang="en"',
    `<html lang="${d.idioma === 'pt' ? 'pt-BR' : 'en'}"`
  );

  const texto = [
    d.nomeDoBlog,
    kicker.join(' / '),
    d.numero ? `\n${d.numero}\n${d.rotuloDoNumero}` : '',
    `\n${d.titulo}\n`,
    d.abertura.join('\n\n'),
    d.fonte ? `\n${c.fonte}: ${d.fonte}` : '',
    `\n${c.botao}: ${d.url}`,
    `\n${IDENTIFICACAO.nome}`,
    IDENTIFICACAO.corretora,
    IDENTIFICACAO.licenca,
    IDENTIFICACAO.endereco1,
    IDENTIFICACAO.endereco2,
    dominio,
    `\n${c.motivo}\n${c.acao}\n${MARCADOR_DESCADASTRO}`
  ]
    .filter((l) => l !== '')
    .join('\n');

  return {assunto: d.titulo, html, texto};
}
