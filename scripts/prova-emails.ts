import {writeFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import type {FormularioComEmail} from '@/lib/formularios';
import {COPY_PENDENTE} from '@/lib/emails/copy';
import {PARAMETRO_DA_FICHA, fichaDeDescadastro} from '@/lib/descadastro';
import {COR} from '@/lib/emails/molde';
import {assuntoParaLuis, htmlParaLuis} from '@/lib/emails/para-luis';
import {conteudoParaLead} from '@/lib/emails/para-lead';

/**
 * A PROVA DOS DOIS E-MAILS.
 *
 * Ela IMPORTA os montadores de verdade, os mesmos que a rota chama. Prova
 * escrita à mão mente no dia em que o código muda: esta aqui quebra junto.
 *
 * Rodar:  npm run prova:emails
 * Saída:  ../prova-emails-4.5.html  (fora do git, ao lado do roteiro.md)
 *
 * NÃO MANDA E-MAIL NENHUM. Não toca no Resend, não lê a chave, não faz rede.
 */

/**
 * A BASE ABSOLUTA usada só para desenhar o link do PDF nesta prova.
 *
 * EM PRODUÇÃO ELA NÃO VEM DAQUI: vem de `NEXT_PUBLIC_SITE_URL`, lida em
 * `lib/emails/index.ts`. Localmente essa variável vale `http://localhost:3000`,
 * que na prova daria um link que não diz nada, então aqui entra o domínio do
 * site. O valor aparece escrito no cabeçalho da prova para ninguém confundir
 * um exemplo com o link que vai sair de verdade.
 */
const BASE = 'https://luisrealtor.ca';

/**
 * O SEGREDO DE MENTIRA DESTA PROVA. Serve so para a ficha de exemplo ter a
 * forma certa (64 hexadecimais) no rodape. O valor real e `UNSUBSCRIBE_SECRET`
 * na Vercel, e ele nunca entra em arquivo nenhum do repositorio.
 */
const SEGREDO_DE_EXEMPLO = 'exemplo-de-prova-nao-e-o-segredo-de-verdade';

function urlDeDescadastro(email: string, idioma: 'en' | 'pt'): string {
  const ficha = fichaDeDescadastro(email, SEGREDO_DE_EXEMPLO);
  const caminho = idioma === 'pt' ? '/pt/cancelar-inscricao' : '/unsubscribe';
  return `${BASE}${caminho}?${PARAMETRO_DA_FICHA}=${ficha}`;
}

/**
 * O NOME DE EXEMPLO É UM ATAQUE, de propósito. Traz `<`, `>`, `&`, aspas duplas
 * e apóstrofo, que são os cinco caracteres que o `escapar` cobre. Se o escape
 * quebrar, ele quebra AQUI, na tela do diretor, e não na caixa de entrada de um
 * cliente com uma tag pendurada no meio da saudação.
 */
const NOME_ATAQUE = `Marta <b>& "Filhos" O'Neil`;

type Exemplo = {
  formulario: FormularioComEmail;
  idioma: 'en' | 'pt';
  origem: string;
  campanha: string;
  campos: Record<string, string | boolean>;
};

const EXEMPLOS: Record<string, Exemplo> = {
  'guia-pt': {
    formulario: 'guia',
    idioma: 'pt',
    origem: '/pt/guia-custo-real#guia-form',
    campanha: 'utm_source=instagram&utm_medium=bio&utm_campaign=guia-set',
    campos: {
      name: NOME_ATAQUE,
      email: 'marta.oneil@exemplo.com',
      profile: 'both',
      consent: true,
      consentTexto:
        'Quero receber também a atualização mensal do mercado, o que mudou e o que isso significa para quem compra ou vende.'
    }
  },
  'guia-en': {
    formulario: 'guia',
    idioma: 'en',
    origem: '/real-cost-guide#guia-form',
    campanha: '',
    campos: {
      name: 'Priya Raghunathan',
      email: 'priya.r@exemplo.com',
      profile: 'researching',
      consent: false,
      consentTexto:
        'I agree to receive occasional market updates from Luis Alves and Stonehaus Realty. I can unsubscribe at any time.'
    }
  },
  'contato-pt': {
    formulario: 'contato',
    idioma: 'pt',
    origem: '/pt/contato#send-a-message',
    campanha: '',
    campos: {
      name: NOME_ATAQUE,
      email: 'marta.oneil@exemplo.com',
      phone: '+1 604 555 0142',
      topic: 'first-home',
      message:
        'Oi Luis, estamos olhando condo de dois quartos em Port Moody e New Westminster.\nA pré-aprovação sai semana que vem. Dá para conversar numa quinta à noite?'
    }
  },
  'contato-en': {
    formulario: 'contato',
    idioma: 'en',
    origem: '/contact#send-a-message',
    campanha: 'gclid=Cj0KCQ',
    campos: {
      name: 'Priya Raghunathan',
      email: 'priya.r@exemplo.com',
      phone: '+1 778 555 0199',
      topic: 'selling',
      message: 'We are weighing selling in the spring versus renting it out for a year.'
    }
  },
  'avaliacao-pt': {
    formulario: 'avaliacao',
    idioma: 'pt',
    origem: '/pt/vender#market-review',
    campanha: '',
    campos: {
      name: NOME_ATAQUE,
      email: 'marta.oneil@exemplo.com',
      phone: '+1 604 555 0142',
      propertyAddress: '1204 - 220 Salter Street, New Westminster',
      propertyType: 'Condo',
      timeline: 'Nos próximos 6 meses',
      message: 'Reformamos a cozinha em 2024.'
    }
  },
  'avaliacao-en': {
    formulario: 'avaliacao',
    idioma: 'en',
    origem: '/selling#market-review',
    campanha: '',
    campos: {
      name: 'Priya Raghunathan',
      email: 'priya.r@exemplo.com',
      phone: '+1 778 555 0199',
      propertyAddress: '14877 60A Avenue, Surrey',
      propertyType: 'Townhouse',
      timeline: 'Next 3 months',
      message: ''
    }
  }
};

/* ── CONTRASTE, MEDIDO E NÃO ESTIMADO ─────────────────────────────────────
   WCAG 2.1, relação de contraste sobre luminância relativa. Os números do
   relatório saem daqui, das MESMAS constantes que os e-mails usam: se alguém
   clarear um tom de apoio, o número muda na prova antes de chegar no cliente. */
function luminancia(hex: string): number {
  const canais = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = canais.map((c) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  ) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contraste(frente: string, fundo: string): number {
  const a = luminancia(frente);
  const b = luminancia(fundo);
  const [claro, escuro] = a > b ? [a, b] : [b, a];
  return (claro + 0.05) / (escuro + 0.05);
}

const MEDICOES = [
  {onde: 'Corpo de leitura sobre o cartao branco', f: COR.tinta, b: COR.branco, tamanho: 'corpo 17px'},
  {onde: 'Assinatura sobre o cartao branco', f: COR.apoioSobrePapel, b: COR.branco, tamanho: 'apoio 15px'},
  {onde: 'Wordmark e topo sobre a Tinta', f: COR.papel, b: COR.tinta, tamanho: 'corpo'},
  {onde: 'Identificacao e endereco postal sobre a Tinta', f: COR.apoioSobreTinta, b: COR.tinta, tamanho: 'apoio 13px'},
  {onde: 'Rotulo do campo de decisao sobre a Tinta', f: COR.apoioSobreTinta, b: COR.tinta, tamanho: 'rotulo 11px'},
  {onde: 'Rotulo de campo sobre o cartao branco', f: COR.apoioSobrePapel, b: COR.branco, tamanho: 'rotulo 11px'},
  {onde: 'Valor de campo sobre o cartao branco', f: COR.tinta, b: COR.branco, tamanho: 'dado 15px'},
  {onde: 'Copia do envio sobre o Papel', f: COR.tinta, b: COR.papel, tamanho: 'dado 15px'},
  {onde: 'Rotulo da copia sobre o Papel', f: COR.apoioSobrePapel, b: COR.papel, tamanho: 'rotulo 11px'},
  {onde: 'Valor do envelope sobre o Papel', f: COR.tinta, b: COR.papel, tamanho: 'apoio 13px'},
  {onde: 'Rotulo do envelope sobre o Papel', f: COR.apoioSobrePapel, b: COR.papel, tamanho: 'rotulo 13px'},
  {onde: 'Botao do guia: Tinta sobre Latao', f: COR.tinta, b: COR.latao, tamanho: 'botao 15px negrito'},
  {onde: 'Linha de descadastro sobre a Tinta', f: COR.apoioSobreTinta, b: COR.tinta, tamanho: 'apoio 12px'},
  {onde: 'Link "cancele aqui" sobre a Tinta', f: COR.papel, b: COR.tinta, tamanho: 'link 12px sublinhado'},
  {onde: 'Link de e-mail: Avanco sobre o branco', f: COR.avanco, b: COR.branco, tamanho: 'link 15px'}
];

/* ── A PÁGINA DA PROVA ────────────────────────────────────────────────────
   Cada e-mail vai num `<iframe srcdoc>`: documento próprio, do jeito que um
   cliente de e-mail o entrega. Ver o HTML colado dentro desta página seria ver
   os estilos DESTA página misturados, que é exatamente o erro que a prova
   existe para não cometer. */
const escapeAttr = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

function quadro(titulo: string, sub: string, html: string, largura: number, alerta = ''): string {
  return `<figure class="quadro" style="--largura:${largura}px">
<figcaption>
  <span class="q-titulo">${escapeAttr(titulo)}</span>
  <span class="q-sub">${escapeAttr(sub)}</span>
  ${alerta ? `<span class="q-alerta">${escapeAttr(alerta)}</span>` : ''}
</figcaption>
<iframe title="${escapeAttr(titulo)}" srcdoc="${escapeAttr(html)}"></iframe>
</figure>`;
}

function paraLuis(chave: string, largura: number): string {
  const e = EXEMPLOS[chave]!;
  return quadro(
    `Aviso interno . ${chave}`,
    `Assunto: ${assuntoParaLuis(e.formulario, e.campos, e.idioma)}`,
    htmlParaLuis(e),
    largura
  );
}

function paraLead(chave: string, largura: number): string {
  const e = EXEMPLOS[chave]!;
  const peca = conteudoParaLead({
    formulario: e.formulario,
    idioma: e.idioma,
    campos: e.campos,
    base: BASE,
    // So o guia carrega descadastro. Os outros dois recebem string vazia e o
    // rodape sai sem a linha, que e exatamente o comportamento em producao.
    urlDescadastro:
      e.formulario === 'guia'
        ? urlDeDescadastro(String(e.campos.email), e.idioma)
        : ''
  });
  const pendente = COPY_PENDENTE[e.formulario];
  return quadro(
    `Lead . ${chave}`,
    `Assunto: ${peca.assunto}`,
    peca.html,
    largura,
    pendente.length > 0
      ? `NAO ENVIA. Falta no roteiro.md: ${pendente.join(' / ')}`
      : ''
  );
}

const linhasContraste = MEDICOES.map((m) => {
  const valor = contraste(m.f, m.b);
  const passaCorpo = valor >= 4.5;
  return `<tr>
<td>${m.onde}</td>
<td class="mono">${m.f} / ${m.b}</td>
<td class="mono">${m.tamanho}</td>
<td class="mono num">${valor.toFixed(2)}:1</td>
<td class="${passaCorpo ? 'ok' : 'falha'}">${passaCorpo ? 'passa AA' : 'ABAIXO DE 4,5'}</td>
</tr>`;
}).join('\n');

const pagina = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Prova dos e-mails . rodada 4.5</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body {
    margin: 0; padding: 40px 28px 80px;
    background: #0b1626; color: #e6e9ee;
    font: 15px/1.6 ui-sans-serif, system-ui, -apple-system, "Segoe UI", Arial, sans-serif;
  }
  .conteudo { max-width: 1280px; margin: 0 auto; }
  h1 { margin: 0 0 6px; font-size: 26px; letter-spacing: -0.01em; font-weight: 650; }
  .sub { margin: 0 0 34px; color: #9aa6b8; max-width: 78ch; }
  h2 {
    margin: 46px 0 4px; font-size: 12px; font-weight: 650;
    letter-spacing: .18em; text-transform: uppercase; color: #7e8ca3;
  }
  h2 + p { margin: 0 0 20px; color: #9aa6b8; max-width: 78ch; }
  .fileira { display: flex; gap: 22px; flex-wrap: wrap; align-items: flex-start; }
  .quadro { margin: 0; width: var(--largura); max-width: 100%; }
  figcaption { display: flex; flex-direction: column; gap: 3px; padding: 0 0 9px; }
  .q-titulo { font-weight: 650; font-size: 13.5px; }
  .q-sub { font-size: 12.5px; color: #8b98ab; word-break: break-word; }
  .q-alerta {
    margin-top: 4px; align-self: flex-start; padding: 3px 8px; border-radius: 5px;
    background: #4a2020; color: #ffc7c7; font-size: 11.5px; font-weight: 600;
  }
  iframe {
    width: 100%; height: 760px; border: 0; border-radius: 8px;
    background: #f5f3ef; display: block;
  }
  .aviso {
    border-left: 3px solid #c98a3a; background: #221a10; color: #f0dcc0;
    padding: 16px 18px; border-radius: 0 8px 8px 0; max-width: 92ch;
  }
  .aviso b { color: #ffd79a; }
  .aviso ul { margin: 10px 0 0; padding-left: 20px; }
  .aviso li { margin: 4px 0; }
  table { border-collapse: collapse; width: 100%; max-width: 1000px; font-size: 13.5px; }
  th, td { text-align: left; padding: 8px 12px 8px 0; border-bottom: 1px solid #1d2b40; }
  th { color: #7e8ca3; font-weight: 600; font-size: 11.5px; letter-spacing: .1em; text-transform: uppercase; }
  .mono { font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace; font-size: 12.5px; color: #9aa6b8; }
  .num { text-align: right; color: #e6e9ee; font-variant-numeric: tabular-nums; }
  .ok { color: #7fd1a0; font-weight: 600; }
  .falha { color: #ff9b9b; font-weight: 700; }
</style>
</head>
<body>
<div class="conteudo">

<h1>Prova dos e-mails, rodada 4.5</h1>
<p class="sub">
  Renderizada a partir de <code>lib/emails/</code>, os mesmos montadores que a rota
  <code>app/api/enviar</code> chama. Nenhum e-mail foi enviado. O nome de exemplo carrega
  <code>&lt;</code>, <code>&amp;</code>, aspas e apóstrofo de propósito: se o escape estiver
  quebrado, ele aparece quebrado aqui.
</p>
<p class="sub">
  O botão do guia aponta para <code>${BASE}/guia/real-cost-guide-{en|pt}.pdf</code>.
  Essa base é só desta prova: em produção ela vem de <code>NEXT_PUBLIC_SITE_URL</code>,
  na Vercel. O link é sempre absoluto, nunca relativo, porque link relativo em e-mail
  é link morto.
</p>

<div class="aviso">
  <b>O que a 4.5 fechou.</b> Os três buracos que a 4.4 deixou abertos:
  <ul>
    <li><b>A copy dos três formulários está no roteiro.md</b> e conferida verbatim por
      <code>npm run conferir:copy</code>. Os três e-mails enviam.</li>
    <li><b>O valor cru saiu do e-mail.</b> Onde a 4.4 mostrava <code>both</code> em corpo
      22px, agora aparece o rótulo que a pessoa viu na tela, no idioma dela. O valor cru
      continua indo para a planilha, intocado.</li>
    <li><b>O descadastro existe.</b> A linha da CASL entra no rodapé do e-mail do guia, e
      só nele. O link leva a uma página com botão de confirmação, porque um GET que
      cancela seria disparado por rastreador de link sem ninguém clicar.</li>
  </ul>
</div>

<h2>Desktop, os dois e-mails lado a lado</h2>
<p>O aviso interno e a peça do lead, o mesmo envio visto dos dois lados.</p>
<div class="fileira">
${paraLuis('guia-pt', 560)}
${paraLead('guia-pt', 560)}
</div>

<h2>As três peças do lead</h2>
<p>
  O guia entrega e leva botão em latão. A avaliação promete um prazo e pede a informação
  que o formulário não tem. O contato confirma em uma linha. Só o do guia tem rodapé de
  descadastro, e isso é decisão do roteiro: os outros dois não carregam aceite de marketing.
</p>
<div class="fileira">
${paraLead('guia-en', 560)}
${paraLead('contato-pt', 560)}
${paraLead('avaliacao-en', 560)}
</div>

<h2>Celular a 375px, que é onde o lead abre</h2>
<p>Mesma largura de um iPhone SE ou de um Android de entrada.</p>
<div class="fileira">
${paraLead('guia-pt', 375)}
${paraLead('guia-en', 375)}
${paraLead('contato-en', 375)}
${paraLuis('avaliacao-pt', 375)}
</div>

<h2>Os três avisos internos, um por formulário</h2>
<p>
  O campo de decisão sobe para o topo e para o assunto, e não se repete na lista. Ele
  agora aparece como a pessoa o leu na tela, não como o token que vai para a planilha.
</p>
<div class="fileira">
${paraLuis('guia-en', 460)}
${paraLuis('contato-pt', 460)}
${paraLuis('avaliacao-en', 460)}
</div>

<h2>Contraste medido</h2>
<p>
  WCAG 2.1, calculado no momento da geração a partir das constantes de
  <code>lib/emails/molde.ts</code>. Nenhum número aqui foi digitado à mão.
</p>
<table>
<thead><tr><th>Onde</th><th>Frente / fundo</th><th>Uso</th><th>Razão</th><th>Piso 4,5:1</th></tr></thead>
<tbody>
${linhasContraste}
</tbody>
</table>

</div>
<script>
  // Cada e-mail tem altura própria. Sem isto, ou sobra tarja cinza embaixo dos
  // curtos, ou os longos ficam cortados, e um e-mail cortado não se julga.
  //
  // Ouvir SÓ o 'load' não bastava, e isto foi medido: um srcdoc não faz
  // requisição nenhuma, então vários quadros já estavam prontos antes deste
  // script rodar, e o evento deles nunca mais chegava. Por isso ajusta agora e
  // continua ouvindo.
  function ajustar(quadro) {
    const doc = quadro.contentDocument;
    if (!doc || !doc.documentElement) return;
    quadro.style.height = doc.documentElement.scrollHeight + 'px';
  }
  for (const quadro of document.querySelectorAll('iframe')) {
    ajustar(quadro);
    quadro.addEventListener('load', () => ajustar(quadro));
  }
</script>
</body>
</html>`;

const destino = path.resolve(
  fileURLToPath(import.meta.url),
  '..',
  '..',
  '..',
  'prova-emails-4.5.html'
);
writeFileSync(destino, pagina, 'utf8');
console.log(`prova escrita em: ${destino}`);
