/**
 * Gera public/guia-do-painel/index.html: o guia de uma página do painel do Second Opinion, para o
 * Luís. Irmão do guia da Bruna (Website Bruna Gomes, scripts/gera-guia-do-painel.py), na marca dele.
 *
 * Rodar: node scripts/gera-guia-do-painel.mjs
 *
 * Servido em /guia-do-painel (next.config.ts reescreve para o index.html, com noindex; proxy.ts o
 * deixa fora do roteamento de idioma). Os rótulos citados são os do keystatic.config.ts: mudou um
 * rótulo lá, muda aqui e roda de novo.
 */
import {writeFileSync, mkdirSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const NBSP = ' ';
const PAINEL = 'https://luisrealtor.ca/keystatic';

/** Regra das órfãs, na apresentação: cola as TRÊS últimas palavras quando cabem no teto, senão duas. */
function cola(t, teto = 18) {
  const palavras = t.split(' ');
  for (const n of [3, 2]) {
    if (palavras.length > n && palavras.slice(-n).join(' ').length <= teto) {
      return palavras.slice(0, -n).join(' ') + ' ' + palavras.slice(-n).join(NBSP);
    }
  }
  return t;
}

const escapa = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Texto com **negrito** vira <b>, depois cola o fim. */
const p = (t) => escapa(cola(t)).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');

const passos = [
  ['Entre', 'Abra o painel e toque em **Log in with GitHub**, na conta **LuisAlves32**.', 'botao'],
  [
    'Escreva',
    'Em **Notas (artigos)**, toque em **Add**. Preencha o título, o idioma, a categoria e o resumo. O texto vai no campo grande, no fim da página, com **Título 2** para os subtítulos.',
    null
  ],
  [
    'Dê o número',
    'Se a nota gira em torno de um número, escreva em **O número da capa**, com a unidade, e diga **O que o número mede** e a **Fonte do número**. A capa se desenha sozinha a partir dele. Sem número, ela mostra o tempo de leitura.',
    'capa'
  ],
  [
    'Publique',
    'Com o texto revisado, marque **Pronto para publicar** e toque em **Create**, numa nota nova, ou em **Save**, numa que você editou. Em uns dois minutos ela está no site. Desmarcada, a nota fica guardada como rascunho, fora do site.',
    null
  ]
];

function extra(tipo) {
  if (tipo === 'botao') return `<a class="botao" href="${PAINEL}">Abrir o painel</a>`;
  if (tipo === 'capa') {
    return `<div class="capa" aria-hidden="true">
      <p class="capa-kicker">N.º 002 <span>/</span> Comprar</p>
      <div class="capa-medida"><span class="capa-numero">$11.250</span><span class="capa-cota"></span></div>
      <p class="capa-rotulo">Em dinheiro, além da entrada</p>
    </div>`;
  }
  return '';
}

const itens = passos
  .map(
    ([titulo, texto, tipo], i) => `<li class="passo">
  <div class="passo-marca" aria-hidden="true"><span>${String(i + 1).padStart(2, '0')}</span></div>
  <div class="passo-texto">
    <h2>${titulo}</h2>
    <p>${p(texto)}</p>
    ${extra(tipo)}
  </div>
</li>`
  )
  .join('\n');

const dicas = [
  'Para a frase que importa, selecione e toque em **Marcar com a cota**: uma por seção, no máximo.',
  '**Nota do Luís** põe um comentário seu na margem, e **A conta** monta uma conta linha a linha, com o total. Os dois ficam no botão **+** do editor.',
  'Escreveu a mesma nota nos dois idiomas? Na versão traduzida, escolha a original em **Esta nota é a tradução de**.',
  'Revisou um texto? Mude a **Última revisão** para hoje.',
  'Com a newsletter ligada, a nota marcada sai no e-mail dos inscritos na manhã seguinte, e e-mail não tem volta. Marque só depois de revisar.',
  'Para tirar uma nota do ar, abra a nota e use **Delete entry**, no menu de três pontinhos.'
];
const listaDicas = dicas.map((d) => `<li>${p(d)}</li>`).join('\n');

const HTML = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="color-scheme" content="only light">
<meta name="robots" content="noindex, nofollow">
<title>Guia do painel · Second Opinion</title>
<link rel="icon" href="/favicon-32.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Instrument+Serif:ital@1&display=swap">
<style>
/* Tokens: os mesmos da marca (app/globals.css). Avanço sobre papel mede 4,4:1: só em texto grande. */
:root {
  color-scheme: only light;
  --tinta: #0e2440;
  --avanco: #2a6dd6;
  --papel: #f5f3ef;
  --ceu: #e8f0f9;
  --lapis: #c8ccd1;
  --grafite: #3d4d63;
  --curva: cubic-bezier(0.16, 1, 0.3, 1);
}
* { box-sizing: border-box; margin: 0; padding: 0; }
html { background: var(--papel); -webkit-text-size-adjust: 100%; }
body {
  background: var(--papel); color: var(--grafite);
  font: 400 1.0625rem/1.65 "Inter", system-ui, sans-serif;
  padding: 0 20px env(safe-area-inset-bottom);
  overflow-x: clip;
}
::selection { background: var(--ceu); color: var(--tinta); }
b { font-weight: 600; color: var(--tinta); }
p, li { text-wrap: pretty; }
h1, h2 { color: var(--tinta); font-weight: 600; letter-spacing: -0.02em; text-wrap: balance; }
em { font-family: "Instrument Serif", Georgia, serif; font-style: italic; font-weight: 400; color: var(--avanco); letter-spacing: 0; }
.folha { max-width: 34rem; margin: 0 auto; padding: 48px 0 40px; }

/* A barra do L/, o gesto da marca: fina, inclinada no ângulo do logo, em Avanço */
.barra { display: inline-block; width: 3px; height: 0.9em; border-radius: 9px; background: var(--avanco); transform: skewX(-24deg); vertical-align: -0.1em; }

/* Topo: o símbolo se monta, o L primeiro e a barra depois */
.topo { text-align: center; }
.simbolo { width: 72px; height: 72px; margin: 0 auto 26px; display: block; overflow: visible; }
.simbolo .l { opacity: 0; transform: translateY(8px); animation: entra 0.7s var(--curva) 0.2s forwards; }
.simbolo .b { transform-box: fill-box; transform-origin: 50% 100%; transform: scaleY(0); animation: cresce 0.8s var(--curva) 0.6s forwards; }
@keyframes entra { to { opacity: 1; transform: none; } }
@keyframes cresce { to { transform: scaleY(1); } }
.marca { display: inline-flex; align-items: center; gap: 10px; font: 600 0.75rem/1 "Inter", sans-serif; letter-spacing: 0.18em; text-transform: uppercase; color: var(--tinta); }
h1 { font-size: clamp(2rem, 1.5rem + 2.6vw, 2.75rem); line-height: 1.1; margin: 16px 0 16px; }
h1 em { font-size: 1.12em; }
.lead { max-width: 27rem; margin: 0 auto; }

/* Entrada de cada bloco, quando chega na tela */
.chega, .passo { opacity: 0; transform: translateY(18px); transition: opacity 0.7s var(--curva), transform 0.7s var(--curva); }
.visto { opacity: 1; transform: none; }

/* Os passos: o número em serifa itálica, e uma COTA vertical costura os quatro, crescendo com a rolagem */
.passos { list-style: none; margin: 56px 0 0; position: relative; }
.passos::before { content: ""; position: absolute; left: 21px; top: 44px; bottom: 56px; width: 1.5px;
  background: var(--tinta); opacity: 0.3; transform-origin: top; transform: scaleY(var(--fio, 0)); }
.passo { display: grid; grid-template-columns: 44px 1fr; gap: 20px; padding-bottom: 40px; position: relative; }
.passo-marca { position: relative; width: 44px; height: 44px; background: var(--papel); display: grid; place-items: center; }
.passo-marca span { font: italic 400 1.75rem/1 "Instrument Serif", serif; color: var(--avanco); }
.passo-marca::after { content: ""; position: absolute; left: 50%; bottom: -2px; width: 14px; height: 2px; margin-left: -7px; border-radius: 2px;
  background: var(--avanco); transform: skewX(-24deg) scaleX(0); transform-origin: left; transition: transform 0.6s var(--curva) 0.4s; }
.passo.visto .passo-marca::after { transform: skewX(-24deg) scaleX(1); }
.passo h2 { font-size: 1.5rem; line-height: 1.2; margin: 8px 0 8px; }

.botao { display: inline-flex; align-items: center; justify-content: center; gap: 10px; min-height: 52px; padding: 0 28px; margin-top: 18px;
  border-radius: 8px; background: var(--avanco); color: #fff; font-weight: 600; font-size: 0.9375rem; text-decoration: none;
  transition: transform 200ms var(--curva), box-shadow 200ms var(--curva), background-color 200ms; }
.botao::after { content: "→"; transition: transform 200ms var(--curva); }
.botao:hover { background: #2258ae; transform: translateY(-2px); box-shadow: 0 10px 22px -12px rgb(14 36 64 / 0.55); }
.botao:hover::after { transform: translateX(3px); }
.botao:active { transform: scale(0.98); }
.botao:focus-visible { outline: none; box-shadow: 0 0 0 3px var(--papel), 0 0 0 6px rgb(42 109 214 / 0.45); }

/* A demonstração: a capa de uma nota, com a cota medindo o número (a mesma do blog) */
.capa { margin-top: 20px; padding: 18px 20px 22px; border: 1px solid var(--lapis); border-radius: 12px; background: #fff; text-align: center; }
.capa-kicker { text-align: left; font: 600 0.6875rem/1 "Inter", sans-serif; letter-spacing: 0.16em; text-transform: uppercase; color: var(--tinta); }
.capa-kicker span { color: var(--avanco); padding: 0 4px; }
.capa-medida { display: inline-flex; flex-direction: column; align-items: stretch; margin-top: 18px; }
.capa-numero { font: 700 3rem/1 "Inter", sans-serif; letter-spacing: -0.03em; color: var(--tinta); padding: 0 12px; }
.capa-cota { position: relative; height: 2px; margin: 12px -14px 0; background: var(--tinta); transform: scaleX(0); transition: transform 1.1s var(--curva) 0.3s; }
.capa-cota::before, .capa-cota::after { content: ""; position: absolute; top: -9px; width: 3px; height: 20px; border-radius: 2px; background: var(--avanco);
  transform: skewX(-24deg); }
.capa-cota::before { left: 0; } .capa-cota::after { right: 0; }
.passo.visto .capa-cota { transform: scaleX(1); }
.capa-rotulo { margin-top: 14px; font: 600 0.6875rem/1.3 "Inter", sans-serif; letter-spacing: 0.16em; text-transform: uppercase; color: var(--grafite); }

/* As dicas: um cartão céu, sem sombra, com a barra como marcador */
.dicas { margin-top: 8px; padding: 26px 24px 24px; border-radius: 12px; background: var(--ceu); }
.dicas h2 { font-size: 1.25rem; margin-bottom: 14px; }
.dicas ul { list-style: none; display: grid; gap: 12px; font-size: 0.96875rem; }
.dicas li { padding-left: 20px; position: relative; }
.dicas li::before { content: ""; position: absolute; left: 3px; top: 0.4em; width: 2.5px; height: 0.85em; border-radius: 3px; background: var(--avanco); transform: skewX(-24deg); }

/* O fecho: a cota horizontal que se traça, e a assinatura */
.fecho { text-align: center; margin-top: 56px; font-size: 0.9375rem; }
.fecho-cota { position: relative; width: 120px; height: 2px; margin: 0 auto 20px; background: var(--tinta); opacity: 0.8; transform: scaleX(0); transition: transform 1.2s var(--curva); }
.fecho-cota::before, .fecho-cota::after { content: ""; position: absolute; top: -8px; width: 3px; height: 18px; border-radius: 2px; background: var(--avanco); transform: skewX(-24deg); }
.fecho-cota::before { left: 0; } .fecho-cota::after { right: 0; }
.fecho.visto .fecho-cota { transform: scaleX(1); }
.assinatura { margin-top: 6px; font-size: 0.8125rem; color: var(--grafite); }

@media (min-width: 768px) {
  body { font-size: 1.125rem; }
  .folha { padding-top: 80px; }
  .simbolo { width: 84px; height: 84px; }
}

/* Movimento reduzido: tudo no estado final, parado */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation: none !important; transition: none !important; }
  .simbolo .l, .chega, .passo { opacity: 1; transform: none; }
  .simbolo .b { transform: none; }
  .passos::before { transform: none; }
  .passo-marca::after { transform: skewX(-24deg); }
  .capa-cota, .fecho-cota { transform: none; }
}
</style>
</head>
<body>
<main class="folha">
  <header class="topo">
    <svg class="simbolo" viewBox="80 90 350 320" aria-hidden="true">
      <polygon class="l" points="96.667,110 163.333,110 163.333,323.333 263.333,323.333 263.333,390 96.667,390" fill="#0E2440"/>
      <polygon class="b" points="240,390 313.333,390 410,110 336.667,110" fill="#2A6DD6"/>
    </svg>
    <p class="marca"><span class="barra"></span>Second Opinion</p>
    <h1>Escreva a nota. <em>O site faz o resto.</em></h1>
    <p class="lead">${p('Um guia de um minuto para escrever, revisar e publicar no seu blog. Tudo o que você salva vai direto para o site.')}</p>
  </header>

  <ol class="passos">
${itens}
  </ol>

  <section class="dicas chega" aria-labelledby="dicas-titulo">
    <h2 id="dicas-titulo">Para ter à mão</h2>
    <ul>
${listaDicas}
    </ul>
  </section>

  <footer class="fecho chega">
    <div class="fecho-cota" aria-hidden="true"></div>
    <p>${p('Qualquer dúvida, é só chamar. A gente está do outro lado.')}</p>
    <p class="assinatura">Tá Online</p>
  </footer>
</main>
<script>
/* Cada bloco entra quando chega na tela; a cota que costura os passos cresce com a rolagem */
(() => {
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add("visto"); io.unobserve(e.target); }
  }), { rootMargin: "0px 0px -12% 0px" });
  document.querySelectorAll(".passo, .chega").forEach((el) => io.observe(el));
  const lista = document.querySelector(".passos");
  let pedido = 0;
  const fio = () => {
    pedido = 0;
    const r = lista.getBoundingClientRect();
    const v = Math.min(1, Math.max(0, (innerHeight * 0.75 - r.top) / r.height));
    lista.style.setProperty("--fio", v.toFixed(3));
  };
  addEventListener("scroll", () => { if (!pedido) pedido = requestAnimationFrame(fio); }, { passive: true });
  fio();
})();
</script>
</body>
</html>
`;

const destino = join(RAIZ, 'public/guia-do-painel/index.html');
mkdirSync(dirname(destino), {recursive: true});
writeFileSync(destino, HTML, 'utf8');
console.log(destino, HTML.length);
