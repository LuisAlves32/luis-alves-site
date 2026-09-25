'use client';

import {useState} from 'react';
import {useTranslations} from 'next-intl';
import {Minus, Plus} from 'lucide-react';

// Acordeão de FAQ (roteiro.md, Parte 4): linha única, fechado por padrão, um
// aberto por vez, sinal de mais/menos em Avanço. Abertura por
// grid-template-rows (transição de estado, 200ms).
//
// REUTILIZÁVEL desde 05/09/2026 (rodada E2): a home, /buying e /selling usam o
// MESMO componente com conteúdos diferentes. Antes ele estava cravado no nó
// `faq` e nos seis itens da home. As duas páginas internas tinham cada uma a
// sua <section> com o <h2>FAQ</h2> escrito à mão e um esqueleto no lugar do
// conteúdo; quem desenha a seção agora é este arquivo, e é por isso que o
// `className` existe: ele carrega o fundo (bg-ceu em /buying, nenhum em
// /selling) que mantém a alternância de fundo daquelas páginas.
//
// O TÍTULO não é parametrizável de propósito: "FAQ" é rótulo compartilhado, é
// o mesmo nas três páginas e nos dois idiomas, e vive em `faq.titulo`. Só os
// ITENS mudam de nó.
//
// DÍVIDA CONHECIDA, registrada em pendencias-luis-alves.md: este arquivo mora
// em components/home/ e serve o site inteiro. O CtaFinal tem o mesmo problema e
// já era usado pelas internas antes desta rodada. Mover só um dos dois criaria
// duas convenções em vez de uma; os dois se mudam juntos, num dia próprio.
const PADRAO_HOME = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6'] as const;

export function Faq({
  no = 'faq.itens',
  itens = PADRAO_HOME,
  idPrefixo = 'faq',
  className = '',
  fechamento = true
}: {
  /** Caminho do nó que guarda os itens, ex.: 'paginaComprar.faq'. */
  no?: string;
  /** Quais chaves entram, e em que ordem. */
  itens?: readonly string[];
  /** Prefixo dos ids. Com três FAQ no site, prefixo é higiene: mesmo que duas
   *  nunca apareçam na mesma página, id global é armadilha esperando alguém
   *  compor duas seções. */
  idPrefixo?: string;
  /** Acrescentado à <section>. Carrega o fundo da página que a hospeda. */
  className?: string;
  /** O EIXO da seção.
   *  true (padrão, e é a home): contêiner ESTREITO centrado (52rem). A FAQ e o
   *  CTA final fecham a home juntos num eixo óptico próprio, e ali estreitar
   *  funciona porque a home é longa e variada e o recuo marca o fecho.
   *  false: a seção mantém o eixo da PÁGINA (a `.conteudo` inteira, 1200px).
   *  MEDIDO em 05/09/2026 e é o motivo de o parâmetro existir: nas páginas
   *  internas, depois de seis blocos com o título em x=180, os dois últimos
   *  saltavam para x=364. O mesmo recuo que na home lê como fecho, ali lê como
   *  gabarito trocado no fim da página. */
  fechamento?: boolean;
}) {
  const t = useTranslations(no);
  const rotulo = useTranslations('faq');
  const [aberta, setAberta] = useState<number | null>(null);

  // O .trim() não é decoração: sem ele o className vazio da home deixaria um
  // espaço à direita na classe e o HTML dela mudaria de um byte.
  return (
    <section data-bloco="faq" className={`py-secao ${className}`.trim()}>
      <div className={`conteudo${fechamento ? ' max-w-[52rem]' : ''}`}>
        <h2>{rotulo('titulo')}</h2>

        {/* A MEDIDA DO DESENHO É 768px DE CONTEÚDO, e ela é a mesma nos dois
            modos. O que muda é ONDE a trava mora, e por isso o NÚMERO ESCRITO
            difere entre os dois lugares:
            fechamento=true  -> na SEÇÃO, acima, como `max-w-[52rem]` (832px).
                                A `.conteudo` é border-box com padding-inline de
                                32px, então sobram 832 - 64 = 768px de conteúdo,
                                e a lista herda.
            fechamento=false -> aqui, na LISTA, como `max-w-[48rem]` (768px).
                                A lista já está DENTRO do padding, então o
                                número escrito é o próprio conteúdo. A seção
                                fica no eixo da página (x=180, alinhada com os
                                blocos de cima) e só a linha é travada.
            OS DOIS DÃO 768px. Escrever 52rem aqui daria 832 e o mesmo componente
            passaria a ter duas medidas entre páginas, nenhuma delas decidida: o
            768 é o que se olhou e aprovou na home, o 832 seria a soma dele com
            um padding que existe por outro motivo.
            POR QUE NA LISTA E NÃO NO <button>: a divisória de 1px é a borda de
            cada ITEM. Travando o botão, a régua horizontal encolheria junto e a
            seção perderia a linha que hoje atravessa a lista inteira.
            POR QUE CONDICIONAL E NÃO NOS DOIS: com fechamento=true a trava seria
            inerte (768 < 832) mas acrescentaria classe ao HTML da home, e a
            prova byte a byte da home deixaria de fechar.
            MEDIDO, e é o motivo de a trava existir: sem ela a linha ia a 1136px
            e o sinal de mais ficava a até 982px do fim da pergunta ("E se não
            vender?", em /pt/vender). Um controle cujo rótulo e cuja afordância
            estão a quase mil pixels um do outro deixou de ser um objeto só. */}
        <div className={`mt-8${fechamento ? '' : ' max-w-[48rem]'}`}>
          {itens.map((item, i) => {
            const estaAberta = aberta === i;
            return (
              <div key={item} className="border-b border-lapis">
                <h3 className="text-[17px]">
                  <button
                    type="button"
                    id={`${idPrefixo}-pergunta-${i}`}
                    aria-expanded={estaAberta}
                    aria-controls={`${idPrefixo}-resposta-${i}`}
                    onClick={() => setAberta(estaAberta ? null : i)}
                    className="flex min-h-[52px] w-full items-center justify-between gap-6 py-4 text-left font-semibold text-tinta transition-colors duration-200 hover:text-avanco"
                  >
                    {t(`${item}.pergunta`)}
                    {estaAberta ? (
                      <Minus aria-hidden="true" strokeWidth={1.5} className="size-5 shrink-0 text-avanco" />
                    ) : (
                      <Plus aria-hidden="true" strokeWidth={1.5} className="size-5 shrink-0 text-avanco" />
                    )}
                  </button>
                </h3>
                <div
                  id={`${idPrefixo}-resposta-${i}`}
                  role="region"
                  aria-labelledby={`${idPrefixo}-pergunta-${i}`}
                  className={`grid transition-[grid-template-rows] duration-200 ease-out ${
                    estaAberta ? '[grid-template-rows:1fr]' : '[grid-template-rows:0fr]'
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="max-w-[65ch] pb-5 text-[15px]">
                      {t(`${item}.resposta`)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
