// Página original (21st.dev): https://21st.dev/@beratberkayg/components/glassmorphism-profile-card
// Licença: sem licença declarada pelo autor; usado com crédito, conforme os termos do 21st.dev. Créditos completos em CREDITOS.md.
'use client';

import {useCallback, useEffect, useRef, useState} from 'react';
import {motion} from 'framer-motion';
import {useReducedMotion} from '@/lib/movimento-reduzido';
import {useTranslations} from 'next-intl';
import type {Locale} from '@/i18n/routing';
import {EMAIL_CONTATO, linkWhatsApp} from '@/lib/links';
import {botaoPrimario, botaoSecundario, Seta} from '@/components/ui/botoes';
import {Barra} from '@/components/ui/assinatura';
import {cn} from '@/lib/utils';

// CARTÃO DE IDENTIDADE do Luís, cabeçalho da página SOBRE.
//
// BASE: 21st.dev 5717, "Glassmorphism Profile Card" de beratberkayg. Do
// original ficam o esqueleto (topo com dois dados, foto, nome, dois botões,
// faixa por baixo) e a entrada por fade e 8px. Todo o resto foi adaptado à
// marca, e as trocas estão comentadas onde acontecem: o brilho lime virou
// halo de Avanço, o vidro virou os tokens da vitrine da hero, o relógio foi
// refeito porque o do autor diverge na hidratação, o botão sem destino virou
// o WhatsApp e a faixa passou a carregar o Ruby Award em Areia.
//
// POSSE: a seção que monta este cartão declara data-owner="catalogo". O
// movimento de dentro é daqui (Framer na entrada, CSS no brilho) e a câmera do
// Passe 3 passa por cima sem escrever nele.
//
// NADA DE TILT 3D NO HOVER, e é decisão registrada do diretor: girar a foto de
// uma pessoa no hover lê como gadget, e o registro desta marca é documento e
// medida. Se alguém propuser de novo, a resposta está aqui.

const RETRATO_DESKTOP = '/fotos/luis-recorte.webp';
const RETRATO_MOBILE = '/fotos/luis-recorte-mobile.webp';
// Mesmo limiar da hero: é o ponto em que a variante mobile do recorte passa a
// ser a certa. Uma régua só no site inteiro.
const LIMIAR_MOBILE = 820;

// O `sizes` descreve a largura RENDERIZADA da figura, que é a largura útil do
// cartão vezes 1,075 (a figura é mais alta que o quadro, ver --cartao-fora no
// globals.css, e mais alta significa mais larga). Com <picture media> e um
// único candidato por <source> ele não muda a escolha do arquivo, que é feita
// pela media query: fica como documentação da medida e como rede se um dia
// entrar uma segunda resolução.
const SIZES_MOBILE = '(min-width: 516px) 400px, calc((100vw - 96px) * 1.075)';
const SIZES_DESKTOP = '(min-width: 1024px) 413px, 400px';

// Hora de Vancouver. O componente original calcula a hora UMA vez, num
// useMemo, e com render no servidor isso mostra a hora do SERVIDOR e diverge na
// hidratação. Aqui o valor nasce nulo nos dois lados (servidor e primeira
// pintura do cliente concordam sempre) e só existe depois da montagem.
// O fuso é travado em America/Vancouver, não no fuso de quem lê: metade do
// público está em outro fuso e a informação útil é que horas são LÁ.
function useHoraVancouver(): string | null {
  const [hora, setHora] = useState<string | null>(null);

  useEffect(() => {
    // en-CA com hour12 falso dá 24h com zero à esquerda nos dois idiomas do
    // site. Formato único de propósito: 14:23 não é ambíguo em lugar nenhum.
    const formato = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Vancouver',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

    let intervalo: ReturnType<typeof setInterval> | undefined;
    const marcar = () => setHora(formato.format(new Date()));
    marcar();

    // Alinha na virada do minuto e só então passa a bater de 60 em 60s. Um
    // setInterval solto de 60s erraria em até 59 segundos para sempre.
    const ateOProximoMinuto = 60_000 - (Date.now() % 60_000);
    const alinhamento = setTimeout(() => {
      marcar();
      intervalo = setInterval(marcar, 60_000);
    }, ateOProximoMinuto);

    return () => {
      clearTimeout(alinhamento);
      if (intervalo) clearInterval(intervalo);
    };
  }, []);

  return hora;
}

export function CartaoIdentidade({locale}: {locale: Locale}) {
  const t = useTranslations('paginaSobre');
  const nav = useTranslations('nav');
  const cred = useTranslations('sobre.credibilidade');
  const rodape = useTranslations('rodape');
  const semMovimento = useReducedMotion();
  const hora = useHoraVancouver();

  const [copiado, setCopiado] = useState(false);
  const relogioCopia = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (relogioCopia.current) clearTimeout(relogioCopia.current);
    },
    []
  );

  const copiar = useCallback(async () => {
    let deuCerto = false;
    try {
      await navigator.clipboard.writeText(EMAIL_CONTATO);
      deuCerto = true;
    } catch {
      // Contexto não seguro (http numa rede local) não expõe a área de
      // transferência. O caminho antigo ainda funciona em todos os navegadores
      // atuais, e um controle que não responde ao clique é justamente o que a
      // rodada D matou: nenhum nasce de novo aqui.
      try {
        const campo = document.createElement('textarea');
        campo.value = EMAIL_CONTATO;
        campo.setAttribute('readonly', '');
        campo.style.position = 'fixed';
        campo.style.opacity = '0';
        document.body.appendChild(campo);
        campo.select();
        deuCerto = document.execCommand('copy');
        document.body.removeChild(campo);
      } catch {
        deuCerto = false;
      }
    }
    if (!deuCerto) return;
    setCopiado(true);
    if (relogioCopia.current) clearTimeout(relogioCopia.current);
    relogioCopia.current = setTimeout(() => setCopiado(false), 2400);
  }, []);

  return (
    <div className="cartao-id">
      {/* O halo QUIETO, por baixo do cartão. Ele não é enfeite: o vidro da
          vitrine é branco a 27,5% e a página é Papel, então sem uma cama de luz
          atrás o cartão inteiro (fundo e fio branco) some no fundo. Quem descola
          o card é o halo, nunca sombra dura, como diz o comentário da vitrine.
          Este NÃO respira: o que respira é o de dentro. */}
      <div className="cartao-id-halo" aria-hidden="true" />

      <motion.article
        className="cartao-id-vidro"
        initial={semMovimento ? false : {opacity: 0, y: 8}}
        animate={{opacity: 1, y: 0}}
        transition={{duration: 0.4, ease: 'easeOut'}}
      >
        {/* TOPO. Saiu o ponto pulsante e saiu "Available for work", que é sinal
            de freelancer disponível e está errado para um REALTOR® licenciado.
            Entram os dois dados que um cartão de identidade carrega: a licença
            e o fuso de quem lê do outro lado. */}
        <div className="cartao-id-topo">
          <span>{rodape('licenca')}</span>
          <span className="cartao-id-relogio">
            {/* Vancouver é nome próprio: não se traduz e não é chave. */}
            <span>Vancouver</span>
            {/* Largura reservada em algarismos tabulares: antes de montar o
                slot fica vazio e nada salta quando a hora chega. */}
            <span className="cartao-id-hora">{hora ?? ''}</span>
          </span>
        </div>

        {/* A FOTO. Quadro na proporção do arquivo (858x1000). O recorte tem
            fundo TRANSPARENTE, então sobre o vidro do cartão o próprio vidro
            apareceria ATRAVÉS da silhueta e o Luís viraria um vulto: por isso o
            quadro tem CHÃO, um degradê de Céu para Papel com o brilho de Avanço
            nascendo por trás dos ombros. É o raciocínio do véu e do halo da
            vitrine da hero, trazido para dentro de um cartão. */}
        <div className="cartao-id-foto">
          <div className="cartao-id-chao" aria-hidden="true">
            <div className="cartao-id-brilho" />
          </div>
          {/* O invólucro é mais alto que o quadro e não recorta em cima: é por
              ali que a CABEÇA SAI. Recorta só nos lados, porque a figura é mais
              larga que o quadro, e é esse corte lateral que faz o recorte ler
              como fotografia dentro de uma vitrine e não como adesivo colado. */}
          <div className="cartao-id-recorte">
            <picture>
              <source
                media={`(max-width: ${LIMIAR_MOBILE}px)`}
                srcSet={`${RETRATO_MOBILE} 652w`}
                sizes={SIZES_MOBILE}
              />
              <img
                src={RETRATO_DESKTOP}
                srcSet={`${RETRATO_DESKTOP} 858w`}
                sizes={SIZES_DESKTOP}
                alt={t('altFoto')}
                width={858}
                height={1000}
                // Prioridade alta e nada de lazy: MEDIDO, o cartão começa em
                // y=161 no desktop e y=277 no celular, ou seja o retrato está
                // acima da dobra nos dois e é o maior elemento com conteúdo da
                // página. Com loading="lazy" ele entrava na fila depois do
                // resto e atrasava o LCP da própria página que é sobre ele.
                fetchPriority="high"
                decoding="async"
              />
            </picture>
          </div>
          {/* O véu cobre só a área do quadro, nunca a cabeça, e nasce numa
              rampa: sem ela aparece uma linha horizontal dura no colarinho. */}
          <div className="cartao-id-veu" aria-hidden="true" />
        </div>

        {/* Parágrafo, não título: um h3 aqui cairia ANTES do primeiro h2 da
            página (o credo) e quebraria a hierarquia de cabeçalhos. */}
        <p className="cartao-id-nome">{rodape('nome')}</p>
        <p className="cartao-id-regiao">{cred('regiao')}</p>

        {/* Os dois botões carregam AÇÃO, não canal, e os dois têm destino real.
            "Hire Me" do original não fazia nada; virou o WhatsApp com a mensagem
            pré-escrita do roteiro. */}
        {/* EMPILHADOS, e não lado a lado: MEDIDO, com os dois na mesma linha a
            largura útil do cartão (380px no desktop) dá 184px por botão, e
            "Falar no WhatsApp" precisa de 134px de texto mais a seta mais o
            padding. Ele quebrava em duas linhas em português, que é o defeito
            que a régua de CTA proíbe. Empilhado, cada botão fica com os 380px
            inteiros: sobra folga nos dois idiomas, a seta-assinatura do CTA
            continua onde deve, e copy mais longa amanhã não quebra nada.
            O `sm:w-auto` do botão da casa é anulado aqui pelo mesmo motivo. */}
        <div className="mt-6 flex flex-col gap-3">
          <a
            href={linkWhatsApp('hero', locale)}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(botaoPrimario, 'w-full sm:w-full')}
          >
            {nav('whatsapp')}
            <Seta className="group-hover:translate-x-[3px]" />
          </a>
          <button
            type="button"
            onClick={copiar}
            className={cn(botaoSecundario, 'w-full sm:w-full')}
          >
            {/* aria-live polite: sem isso a troca do rótulo acontece só para
                quem enxerga, e o leitor de tela não sabe que algo aconteceu. */}
            <span aria-live="polite">
              {copiado ? t('cartao.copiado') : t('cartao.copiarEmail')}
            </span>
          </button>
        </div>
      </motion.article>

      {/* A FAIXA. Saiu "Currently High on Creativity" e saiu o ícone Zap (raio
          para prêmio imobiliário é a coisa errada). Entra o prêmio, com a BARRA
          da assinatura como marcador e fundo AREIA: é o único token quente do
          site e esta página não tinha nenhum bloco quente, então a faixa é o
          respiro de calor da página inteira. */}
      <div className="cartao-id-faixa">
        <Barra className="h-[1.05em] w-[3px]" />
        <p>
          {/* O espaço entre os dois trechos é o ponto de quebra; o nome da corretora desce
              inteiro (em 320 e 390 partia em "Stonehaus / Realty", 24/09/2026). */}
          <span className="font-semibold text-tinta">{cred('premio')}</span>{' '}
          <span className="ml-1 whitespace-nowrap text-grafite">{cred('premioRotulo')}</span>
        </p>
      </div>
    </div>
  );
}
