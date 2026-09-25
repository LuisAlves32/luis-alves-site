import {readFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {DESCADASTRO, PECAS, rotuloLegivel} from '@/lib/emails/copy';
import {ASSUNTOS, FORMULARIOS, PERFIS, type FormularioComEmail} from '@/lib/formularios';

/**
 * O CONFERIDOR DE COPY. Compara, caractere a caractere, o que o código manda
 * para o mundo com o que o roteiro.md diz que ele deve mandar.
 *
 * Rodar:  npm run conferir:copy
 *
 * POR QUE ISTO EXISTE. O roteiro.md é a fonte de verdade da copy, e o código
 * tem uma CÓPIA dela em `lib/emails/copy.ts`, porque copy que só o servidor lê
 * não vira chave de tradução. Duas cópias da mesma frase divergem no dia em que
 * alguém corrige uma vírgula num lado só, e a divergência é silenciosa: o build
 * passa, o lint passa, e o cliente recebe um texto que o diretor não aprovou.
 * Este script é o que torna essa divergência barulhenta.
 *
 * MESMO MÉTODO DA RODADA 4.1, quando a frase do consentimento foi conferida
 * contra o roteiro. A diferença é que agora ele é um comando, não uma conferida
 * à mão que ninguém repete.
 *
 * ELE CONFERE TRÊS COISAS:
 *   1. cada string das peças de e-mail existe VERBATIM no roteiro.md;
 *   2. a frase inteira do roteiro remonta, para o corte entre corpo e
 *      assinatura não ter comido nem inventado um caractere;
 *   3. cada rótulo de opção que o e-mail usa (`messages/`) existe verbatim no
 *      roteiro, porque agora eles VIAJAM no assunto e no corpo dos e-mails.
 */

const raiz = path.resolve(fileURLToPath(import.meta.url), '..', '..');
const roteiro = readFileSync(path.join(raiz, 'roteiro.md'), 'utf8');

const falhas: string[] = [];
let conferidas = 0;

function exigirNoRoteiro(onde: string, texto: string) {
  if (texto === '') return;
  conferidas++;
  if (!roteiro.includes(texto)) {
    falhas.push(
      `${onde}\n     nao existe verbatim no roteiro.md:\n     ${JSON.stringify(texto.slice(0, 110))}`
    );
  }
}

/* 1 e 2. AS TRÊS PEÇAS DO LEAD. */
const IDIOMAS = ['en', 'pt'] as const;
for (const formulario of (Object.keys(FORMULARIOS) as FormularioComEmail[]).filter((f) => (f as string) !== "newsletter")) {
  for (const idioma of IDIOMAS) {
    const p = PECAS[formulario][idioma];
    const onde = `PECAS.${formulario}.${idioma}`;
    exigirNoRoteiro(`${onde}.assunto`, p.assunto);
    exigirNoRoteiro(`${onde}.preHeader`, p.preHeader);
    exigirNoRoteiro(`${onde}.botao`, p.botao);

    /* O CORPO foi PARTIDO em `corpo` mais `assinatura` para a assinatura ler
       como assinatura no e-mail. Isso é apresentação, e a prova de que nenhum
       caractere se perdeu é a frase remontada bater com o roteiro. */
    const remontado = p.assinatura ? `${p.corpo} ${p.assinatura}` : p.corpo;
    exigirNoRoteiro(`${onde}.corpo + assinatura`, remontado);
  }
}

/* A LINHA DE DESCADASTRO. */
for (const idioma of IDIOMAS) {
  exigirNoRoteiro(`DESCADASTRO.${idioma}.motivo`, DESCADASTRO[idioma].motivo);
  exigirNoRoteiro(`DESCADASTRO.${idioma}.acao`, DESCADASTRO[idioma].acao);
  /* A ÂNCORA é recortada da frase, então ela tem que ESTAR na frase. Sem esta
     conferida, trocar "cancele aqui" por "cancelar aqui" no roteiro tiraria o
     link do rodapé em silêncio, e o e-mail sairia sem descadastro nenhum, que é
     justamente a falha de conformidade que a rodada veio fechar. */
  const {acao, ancora} = DESCADASTRO[idioma];
  conferidas++;
  if (acao.split(ancora).length !== 2) {
    falhas.push(
      `DESCADASTRO.${idioma}.ancora\n     nao recorta a frase uma vez so: ${JSON.stringify(ancora)}`
    );
  }
}

/* 3. OS RÓTULOS DE OPÇÃO que agora viajam nos e-mails.
   Eles vêm de `messages/`, mas passaram a ser CONTEÚDO DE E-MAIL, então ficam
   sujeitos à mesma régua: o que sai daqui tem que estar escrito no roteiro. */
const OPCOES: Array<{campo: string; lista: readonly {valor: string}[]}> = [
  {campo: 'profile', lista: PERFIS},
  {campo: 'topic', lista: ASSUNTOS}
];
for (const {campo, lista} of OPCOES) {
  for (const {valor} of lista) {
    for (const idioma of IDIOMAS) {
      const rotulo = rotuloLegivel(campo, valor, idioma);
      conferidas++;
      if (rotulo === valor) {
        falhas.push(
          `rotuloLegivel(${campo}, ${valor}, ${idioma})\n     voltou o valor cru: a opcao sumiu de messages/`
        );
        continue;
      }
      conferidas--;
      exigirNoRoteiro(`rotulo ${campo}.${valor} (${idioma})`, rotulo);
    }
  }
}

if (falhas.length > 0) {
  console.error(`\nCOPY DIVERGENTE. ${falhas.length} de ${conferidas} conferidas falharam:\n`);
  for (const f of falhas) console.error(`  . ${f}\n`);
  console.error(
    'O roteiro.md manda. Corrija o codigo para bater com ele, nunca o contrario.\n'
  );
  process.exit(1);
}

console.log(
  `copy conferida: ${conferidas} strings batem VERBATIM com o roteiro.md`
);
