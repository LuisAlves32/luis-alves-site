'use client';

import {useEffect, useId, useRef, useState} from 'react';
import {motion, useReducedMotion} from 'framer-motion';
import {useTranslations} from 'next-intl';
import {PERFIS} from '@/lib/formularios';
import {FormularioEnvio} from '@/components/ui/formulario-envio';
import {CampoFlutuante} from '@/components/ui/campo-flutuante';
import {botaoLatao, fonteDisplay} from '@/components/landing/pele';
import {ANCORA_FORMULARIO, aoReceberEmail, lerEmail} from '@/lib/captura-guia';

/* O FORMULÁRIO DE VERDADE, o único da landing. Vive no CTA final, numa ficha
 * em Papel sobre a Tinta (o único alto contraste daquela dobra, como o
 * roteiro pedia para o formulário). O `<form>`, o envio, a frase de
 * consentimento lida UMA vez e usada nos dois lugares (rótulo e prova que
 * viaja, exigência da CASL), o campo-armadilha, o carimbo de tempo, o piso
 * anti-robô e a saída de emergência para o WhatsApp continuam sendo do
 * `FormularioEnvio`. Este arquivo é só os campos.
 *
 * O E-MAIL CHEGA DA HERO (lib/captura-guia): quando a pessoa digita lá em cima,
 * o valor aparece aqui e o foco vai para o nome, sem rolar de novo (a página
 * já está descendo). Quem chega direto preenche tudo aqui. O consentimento
 * de marketing é OPCIONAL e nunca pré-marcado (PIPA e CASL; decisão de
 * 04/09/2026 em funil-arquitetura.md).
 *
 * VERSÃO 3 (plano-landing-guia-v3.md, item 5): o formulário ganhou vida de
 * estado sem virar mágica. Campos com RÓTULO FLUTUANTE (CampoFlutuante, do
 * Floating Label 23566), o indicador de latão que DESLIZA entre as pílulas
 * de perfil (layoutId do Framer, em vez de acender e apagar), o botão com
 * a barra fina de envio (CSS, `aria-busy`, só transform), o traço de latão
 * que VARRE a base do campo quando o e-mail chega da hero ("recebi", sem
 * palavra), e a cascata dos campos na entrada, uma vez. Multi-etapa foi
 * visto e recusado: três campos em etapas é atrito inventado. */

const NBSP = ' ';

/* A LINHA DE CONFIANÇA COM UM ÚNICO PONTO DE QUEBRA POSSÍVEL (regra que veio
   da hero antiga): todo espaço dentro de cada trecho e ao redor dos separadores
   vira NBSP, e só o espaço depois do ÚLTIMO separador continua comum. A quebra
   só pode cair ali, e só se faltar largura. A copy não muda um caractere. */
function linhaComUmaQuebra(texto: string) {
  const trechos = texto.split('·').map((t) => t.trim());
  if (trechos.length < 2) return texto;
  const cola = (t: string) => t.replace(/ /g, NBSP);
  const cabeca = trechos.slice(0, -1).map(cola).join(NBSP + '·' + NBSP);
  return cabeca + NBSP + '· ' + cola(trechos[trechos.length - 1]);
}

const cascata = {
  antes: {},
  depois: {transition: {staggerChildren: 0.08, delayChildren: 0.1}}
};
const degrau = {
  antes: {opacity: 0, y: 12},
  depois: {opacity: 1, y: 0, transition: {duration: 0.55, ease: [0.16, 1, 0.3, 1] as const}}
};

export function FormularioFinal() {
  const t = useTranslations('landing.s1');
  const textoConsentimento = t('consentimento');
  const idPerfil = useId();
  const nomeRef = useRef<HTMLInputElement>(null);
  const reduzido = useReducedMotion();
  const [email, setEmail] = useState('');
  const [perfil, setPerfil] = useState('');
  // O selo muda a cada chegada, e é a chave que faz o traço varrer de novo.
  const [seloChegada, setSeloChegada] = useState(0);

  useEffect(() => {
    /* O e-mail guardado entra num tick depois da montagem, e não no corpo do
       efeito: o servidor não tem sessionStorage, então o primeiro render
       precisa ser vazio nos dois lados para a hidratação bater. */
    const guardado = window.setTimeout(() => {
      const v = lerEmail();
      if (v) setEmail(v);
    }, 0);
    const desligar = aoReceberEmail((valor) => {
      setEmail(valor);
      setSeloChegada(Date.now());
      // A descida suave da hero leva uns 700ms; o foco chega quando ela chega.
      window.setTimeout(() => nomeRef.current?.focus({preventScroll: true}), 750);
    });
    return () => {
      window.clearTimeout(guardado);
      desligar();
    };
  }, []);

  const anima = !reduzido;

  return (
    <div className="rounded-[12px] bg-papel p-6 text-tinta sm:p-8 lg:p-10">
      <h2 className={`${fonteDisplay} text-[clamp(1.6rem,3vw,2.2rem)] font-medium leading-tight tracking-[-0.01em]`}>
        {t('formTitulo')}
      </h2>

      <FormularioEnvio
        tipo="guia"
        consentTexto={textoConsentimento}
        origemWhatsApp="firstHome"
        sucesso={{modo: 'redireciona', para: '/real-cost-guide/thank-you'}}
        ancora={ANCORA_FORMULARIO}
        id={ANCORA_FORMULARIO}
        className="mt-4 scroll-mt-28"
        classeMensagem="mt-3 text-sm leading-relaxed text-grafite"
        botao={{
          rotulo: t('botao'),
          className: `${botaoLatao} relative mt-6 w-full overflow-hidden sm:w-full aria-busy:after:absolute aria-busy:after:inset-x-0 aria-busy:after:bottom-0 aria-busy:after:h-[3px] aria-busy:after:origin-left aria-busy:after:bg-tinta/70 aria-busy:after:content-[''] aria-busy:after:[animation:varredura_1.1s_ease-in-out_infinite]`
        }}
        rodape={
          <>
            <p className="mt-3 text-[12.5px] leading-relaxed text-grafite/85">{t('microcopy')}</p>
            <p className="mt-5 text-[12px] leading-relaxed tracking-wide text-grafite/70">
              {linhaComUmaQuebra(t('confianca'))}
            </p>
          </>
        }
      >
        <motion.div
          variants={cascata}
          initial={anima ? 'antes' : false}
          whileInView={anima ? 'depois' : undefined}
          viewport={{once: true, amount: 0.3}}
        >
          <motion.div variants={degrau} className="grid gap-x-4 sm:grid-cols-2">
            <CampoFlutuante
              rotulo={t('campoNome')}
              id="guia-nome"
              name="name"
              type="text"
              required
              autoComplete="given-name"
              ref={nomeRef}
            />
            <CampoFlutuante
              rotulo={t('campoEmail')}
              id="guia-email-final"
              name="email"
              type="email"
              required
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={setEmail}
              realce={
                seloChegada && anima ? (
                  <motion.span
                    key={seloChegada}
                    aria-hidden="true"
                    initial={{scaleX: 0, opacity: 1}}
                    animate={{scaleX: 1, opacity: 0}}
                    transition={{scaleX: {duration: 0.7, ease: [0.16, 1, 0.3, 1]}, opacity: {delay: 0.7, duration: 0.5}}}
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-[3px] origin-left bg-latao"
                  />
                ) : null
              }
            />
          </motion.div>

          {/* O TERCEIRO CAMPO segmenta a lista inteira desde o primeiro contato,
              e a nota de produção do roteiro.md proíbe cortar. O rótulo vem do
              messages; o que VIAJA é o valor estável de PERFIS. */}
          {/* O nome acessível do seletor é o título do bloco, que já está na
              tela como h2: repetir o texto visível seria duplicar o título. */}
          <p id={idPerfil} className="sr-only">
            {t('formTitulo')}
          </p>
          <motion.div variants={degrau} role="radiogroup" aria-labelledby={idPerfil} className="mt-5 flex flex-wrap gap-2">
            {PERFIS.map(({chave, valor}) => {
              const marcado = perfil === valor;
              return (
                <label key={chave} className="cursor-pointer">
                  <input
                    type="radio"
                    name="profile"
                    value={valor}
                    checked={marcado}
                    onChange={() => setPerfil(valor)}
                    className="peer sr-only"
                  />
                  <span className="relative inline-flex min-h-11 items-center rounded-[8px] border border-lapis bg-white px-4 text-[13px] font-medium text-tinta transition-colors duration-200 peer-checked:border-latao peer-focus-visible:shadow-[0_3px_0_0_var(--cor-latao)]">
                    {/* O INDICADOR que desliza de uma pílula para a outra. Uma
                        instância só na página, com o mesmo layoutId: o Framer
                        anima a viagem entre as posições. */}
                    {marcado ? (
                      <motion.span
                        layoutId={anima ? 'perfil-indicador' : undefined}
                        aria-hidden="true"
                        transition={{type: 'spring', stiffness: 520, damping: 42}}
                        className="absolute inset-0 rounded-[7px] bg-latao"
                      />
                    ) : null}
                    <span className="relative">{t(`opcoes.${chave}`)}</span>
                  </span>
                </label>
              );
            })}
          </motion.div>

          <motion.label variants={degrau} className="mt-5 flex items-start gap-2.5 text-[12.5px] leading-snug text-grafite">
            <input type="checkbox" name="consent" className="mt-0.5 size-4 shrink-0 accent-latao" />
            <span>{textoConsentimento}</span>
          </motion.label>
        </motion.div>
      </FormularioEnvio>
    </div>
  );
}
