'use client';

import {useRef} from 'react';
import {useLocale, useTranslations} from 'next-intl';
import type {Locale} from '@/i18n/routing';
import {FormularioEnvio} from '@/components/ui/formulario-envio';
import {Livro} from '@/components/ui/livro';
import {BorderBeamPanel} from '@/components/ui/painel-facho';
import {BotaoQueDesliza} from '@/components/ui/botao-que-desliza';

// Bloco 11 do roteiro.md: o mergulho na Tinta, VALE NOBRE (movimento.md, 29/08:
// pico colado em pico cansa, então aqui a respiração do papel chega ao fundo
// escuro sem cerimônia extra). Camadas: meio = o livro, frente = título, texto
// e formulário.
//
// Sem pop-up em nenhum momento (pedido explícito do cliente, roteiro.md).
//
// Duas peças do catálogo nesta seção, cada uma com o dono do seu movimento:
// o livro (21st 1758 + o gesto do 10073, posse do Framer daqui) e o painel do
// formulário (Border Beam Panel, 21st 23408, posse do rAF do próprio
// componente). Elas não disputam propriedade nenhuma: uma escreve `transform`
// no livro, a outra escreve uma custom property no painel.
// A arte da capa existe nos dois idiomas. É CAMINHO DE ARQUIVO, não copy, então
// não vira chave de tradução: escolhe-se pelo locale, como o resto do site
// resolve idioma. A troca desktop/celular continua por media query, dentro do
// componente do livro.
//
// A PORTA PARA A LANDING (08/09/2026, pedido do Gabriel): a home não tinha
// nenhum caminho até /real-cost-guide (só a página de compra tinha). Abaixo do
// painel entra um link vivo (Interactive Hover Button, 21st 969, adaptado em
// `components/ui/botao-que-desliza.tsx`) com o rótulo que o roteiro já dá para
// esse botão no bloco 5, `primeiroImovel.cta`: nenhuma chave nova. É a porta de
// quem quer LER o guia antes de deixar o email; o formulário continua sendo o
// gesto principal do bloco, e por isso o link é de contorno, não cheio.
export const CAPA: Record<Locale, {desktop: string; mobile: string}> = {
  pt: {desktop: '/guia/capa-guia.webp', mobile: '/guia/capa-guia-mobile.webp'},
  en: {
    desktop: '/guia/capa-guia-en.webp',
    mobile: '/guia/capa-guia-en-mobile.webp'
  }
};

// A contracapa é a MESMA paisagem da capa, continuando para a esquerda.
export const CONTRACAPA: Record<Locale, {desktop: string; mobile: string}> = {
  pt: {
    desktop: '/guia/contracapa-guia.webp',
    mobile: '/guia/contracapa-guia-mobile.webp'
  },
  en: {
    desktop: '/guia/contracapa-guia-en.webp',
    mobile: '/guia/contracapa-guia-en-mobile.webp'
  }
};

export function GuiaNewsletter() {
  const t = useTranslations('guia');
  const tPorta = useTranslations('primeiroImovel');
  const locale = useLocale() as Locale;
  const capa = CAPA[locale] ?? CAPA.en;
  const contracapa = CONTRACAPA[locale] ?? CONTRACAPA.en;
  // A seção inteira é o alvo do trilho do livro: é a subida dela que abre a
  // capa. Por isso o `useScroll` mora no livro mas mede ESTE elemento.
  const secaoRef = useRef<HTMLElement | null>(null);
  // UMA leitura só da chave, usada nos DOIS lugares: o rótulo que a pessoa lê e
  // a prova do que ela aceitou, que viaja no envio. Duas leituras da mesma
  // chave seriam duas fontes, e um dia divergiriam.
  const textoConsentimento = t('newsletter');

  return (
    <section
      ref={secaoRef}
      /* A ÂNCORA DESTE BLOCO, criada em 09/09/2026 na rodada 4.4.
         Antes daqui a seção não tinha id nenhum, e por isso o `FormularioEnvio`
         abaixo não podia passar `ancora`: a coluna `Origem` da planilha gravava
         só "/" e "/pt", enquanto a landing gravava o endereço inteiro.
         Hoje "/" é inequívoco porque só existe um formulário na home. O
         problema é o futuro: no dia em que entrar um segundo ponto de captura
         aqui, todas as linhas antigas viram ambíguas RETROATIVAMENTE, e não há
         como recuperar de onde vieram.
         O valor é um id DE VERDADE, e é essa a exigência: a `origem` gravada
         precisa ser um endereço que leve de volta ao formulário exato. Segue a
         convenção das outras âncoras do site (`#first-home`, `#send-a-message`,
         `#market-review`): inglês, kebab-case, e a mesma em qualquer idioma,
         porque só o CAMINHO é localizado, nunca a âncora. */
      id="free-guide"
      data-bloco="guia"
      // O mergulho na Tinta é o auge da respiração (movimento.md). A classe
      // bg-tinta FICA: é o estado sem JS e com movimento reduzido.
      data-fundo="tinta"
      className="bg-tinta py-secao text-papel"
    >
      <div className="conteudo grid items-center gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
        <div data-camada="meio" className="flex justify-center lg:justify-start">
          <Livro
            capaDesktop={capa.desktop}
            capaMobile={capa.mobile}
            contracapaDesktop={contracapa.desktop}
            contracapaMobile={contracapa.mobile}
            /* Mesma chave do <h2>, verbatim: num livro de verdade o título se
               repete na lombada. Nenhuma chave nova. */
            titulo={t('titulo')}
            alvoRolagem={secaoRef}
          />
        </div>

        <div data-camada="frente">
          <h2 className="max-w-[26ch] text-papel">{t('titulo')}</h2>
          <p className="mt-4 max-w-[55ch] text-papel/85">{t('texto')}</p>

          {/* Envio real desde a rodada 4.2: toda a lógica mora em
              `components/ui/formulario-envio.tsx`, e aqui fica só a marcação.
              TODO(copy): `guia.confirmacao` é provisória, emprestada do H1 da
              página de obrigado. Ver o `_confirmacaoNota` em messages/. */}
          <BorderBeamPanel
            beams={2}
            // Avanço e o azul claro que as portas usam.
            colors={['#2A6DD6', '#8FC0FF']}
            thickness={2}
            radius={14}
            // 22 é mais lento até que os 26 do cartão do bloco 3: aqui o facho
            // fica a centímetros de um campo de e-mail, e um facho apressado ao
            // lado de um formulário puxa a seção para o lado de funil, que é
            // exatamente o que o MODO A não faz.
            idleSpeed={22}
            hoverSpeed={110}
            glow
            className="mt-8 border-transparent bg-[rgb(245_243_239_/_0.04)] p-6 min-[821px]:p-8"
          >
            <FormularioEnvio
              tipo="guia"
              consentTexto={textoConsentimento}
              origemWhatsApp="firstHome"
              // O gêmeo do `id` da seção acima. Se um dos dois mudar sem o
              // outro, a planilha volta a gravar um endereço que não existe.
              ancora="free-guide"
              sucesso={{modo: 'mensagem', texto: t('confirmacao')}}
              botao={{rotulo: t('botao'), className: 'guia-botao mt-5'}}
              classeMensagem="max-w-[55ch] text-[15px] leading-relaxed text-papel/85"
              rodape={
                <label className="guia-consentimento">
                  <input type="checkbox" name="consent" className="guia-caixa" />
                  <span>{textoConsentimento}</span>
                </label>
              }
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="guia-grupo">
                  <label htmlFor="guia-nome" className="guia-rotulo">
                    {t('campoNome')}
                  </label>
                  <input
                    id="guia-nome"
                    name="name"
                    type="text"
                    autoComplete="given-name"
                    className="guia-campo"
                  />
                </div>
                <div className="guia-grupo">
                  <label htmlFor="guia-email" className="guia-rotulo">
                    {t('campoEmail')}
                  </label>
                  <input
                    id="guia-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    className="guia-campo"
                  />
                </div>
              </div>
            </FormularioEnvio>
          </BorderBeamPanel>

          <div className="mt-6">
            <BotaoQueDesliza href="/real-cost-guide">{tPorta('cta')}</BotaoQueDesliza>
          </div>
        </div>
      </div>
    </section>
  );
}
