// A PUBLICAÇÃO PROGRAMADA DO BLOG (27/10/2026).
//
// O blog é gerado no build: nota com data futura não aparece sozinha quando a data chega, porque
// ninguém refaz o site. Este script é quem "chega na data": roda pela tarefa do GitHub
// (.github/workflows/publicar-notas-programadas.yml), procura as notas com "Publicar sozinha na
// data" marcada (publicarNaData: true), "Pronto para publicar" desmarcado e a data de publicação
// já alcançada no relógio de VANCOUVER, e marca a nota como pronta. O commit que a tarefa faz
// dispara o deploy da Vercel, como qualquer commit do painel.
//
// Mexe só nas duas linhas da ficha (frontmatter); o texto da nota fica intocado.
// Uso: node scripts/publicar-notas-programadas.mjs [--hoje=AAAA-MM-DD]   (o --hoje é para a prova)

import {readdirSync, readFileSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';

const PASTA = 'content/notas';

const argHoje = process.argv.find((a) => a.startsWith('--hoje='));
const hoje =
  argHoje?.slice('--hoje='.length) ??
  new Intl.DateTimeFormat('en-CA', {timeZone: 'America/Vancouver', year: 'numeric', month: '2-digit', day: '2-digit'}).format(new Date());

if (!/^\d{4}-\d{2}-\d{2}$/.test(hoje)) {
  console.error(`data inválida: ${hoje}`);
  process.exit(1);
}

const publicadas = [];

for (const arquivo of readdirSync(PASTA).filter((a) => a.endsWith('.mdoc'))) {
  const caminho = join(PASTA, arquivo);
  const texto = readFileSync(caminho, 'utf8');
  const fim = texto.indexOf('\n---', 3);
  if (!texto.startsWith('---') || fim < 0) continue;

  const ficha = texto.slice(0, fim);
  const campo = (nome) => ficha.match(new RegExp(`^${nome}:\\s*(.+?)\\s*$`, 'm'))?.[1];

  if (campo('publicarNaData') !== 'true') continue;
  if (campo('prontoParaPublicar') === 'true') continue;
  const data = campo('publicado')?.replace(/^['"]|['"]$/g, '');
  if (!data || data > hoje) continue;

  const novaFicha = ficha
    .replace(/^prontoParaPublicar:.*$/m, 'prontoParaPublicar: true')
    .replace(/^publicarNaData:.*$/m, 'publicarNaData: false');
  writeFileSync(caminho, novaFicha + texto.slice(fim));
  publicadas.push(`${arquivo} (${data})`);
}

console.log(`hoje em Vancouver: ${hoje}`);
console.log(publicadas.length ? `publicadas: ${publicadas.join(', ')}` : 'nenhuma nota programada para hoje');
