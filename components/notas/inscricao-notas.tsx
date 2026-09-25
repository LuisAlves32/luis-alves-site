'use client';

import {motion, useReducedMotion} from 'framer-motion';
import {useId, useState, type FormEvent} from 'react';
import {useLocale, useTranslations} from 'next-intl';
import {CampoFlutuante} from '@/components/ui/campo-flutuante';
import {botaoPrimario, Seta} from '@/components/ui/botoes';
import {CAMPO_ARMADILHA} from '@/lib/formularios';
import {WHATSAPP_NUMERO} from '@/lib/links';
import {colarUltimasPalavrasEm} from '@/lib/tipografia-notas';

/* A INSCRIÇÃO DO SECOND OPINION (design-blog.md, 5.11): UM formulário, três lugares.
   `bloco` no fim de cada nota e na página curta da bio; `faixa` no topo da listagem.

   Envia pela rota do site (`/api/enviar`, `formulario: 'newsletter'`): a planilha grava
   a PROVA do consentimento (a frase exata, `consentTexto`) e o Resend recebe o contato no
   segmento do idioma (lib/newsletter.ts). As mesmas proteções dos outros formulários:
   armadilha, piso de tempo (`iniciadoEm`) e freio por IP na rota.

   O consentimento é DESMARCADO por padrão e obrigatório (CASL): sem ele o botão não
   envia e a mensagem diz o que falta. No sucesso, o formulário dá lugar ao L/ que se
   desenha, o mesmo gesto do fim de cada nota. */

type Estado = 'parado' | 'enviando' | 'sucesso' | 'erro-campos' | 'erro-sistema';

/* `pagina`: o bloco da página de inscrição. A página já diz o nome e a promessa logo acima,
   então o sobretítulo e o título do bloco saem da TELA (ficam para o leitor de tela, que
   precisa do rótulo da seção) e sobram os campos. Acabamento de 25/09/2026. */
export function InscricaoNotas({variante = 'bloco'}: {variante?: 'bloco' | 'faixa' | 'pagina'}) {
  const t = useTranslations('notas');
  const locale = useLocale();
  const reduzido = useReducedMotion();
  const uid = useId();
  const [aceito, setAceito] = useState(false);
  const [estado, setEstado] = useState<Estado>('parado');
  const [iniciadoEm] = useState(() => Date.now());

  const titulo = variante === 'faixa' ? t('faixa.titulo') : t('inscricao.titulo');
  const apoio = variante === 'faixa' ? t('faixa.apoio') : t('inscricao.apoio');

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (estado === 'enviando') return;
    const form = e.currentTarget;
    const dados = new FormData(form);
    const nome = String(dados.get('name') ?? '').trim();
    const email = String(dados.get('email') ?? '').trim();
    if (!nome || !email || !aceito || !form.checkValidity()) {
      setEstado('erro-campos');
      return;
    }
    setEstado('enviando');
    try {
      const resposta = await fetch('/api/enviar', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          formulario: 'newsletter',
          idioma: locale,
          origem: `${window.location.pathname}#inscricao-${variante}`,
          campanha: window.location.search.replace(/^\?/, ''),
          iniciadoEm,
          [CAMPO_ARMADILHA]: String(dados.get(CAMPO_ARMADILHA) ?? ''),
          name: nome,
          email,
          consent: true,
          // A frase EXATA que a pessoa leu ao lado da caixa, da mesma chave de i18n, sem o espaço
          // inflexível do acabamento: a prova na planilha fica com o texto limpo.
          consentTexto: t('inscricao.consentimento').replace(/ /g, ' ')
        })
      });
      if (resposta.ok) setEstado('sucesso');
      else setEstado(resposta.status === 400 ? 'erro-campos' : 'erro-sistema');
    } catch {
      setEstado('erro-sistema');
    }
  }

  const whatsapp = `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(t('pergunteMensagem', {titulo: t('inscricao.kicker')}))}`;

  return (
    <section
      id={`inscricao-${variante}`}
      data-bloco={variante === 'faixa' ? 'notas-faixa' : 'notas-inscricao'}
      className="scroll-mt-28 rounded-[12px] bg-ceu px-6 py-7 sm:px-8"
      aria-labelledby={`${uid}-titulo`}
    >
      <div data-camada="frente" className={variante === 'faixa' ? 'grid gap-6 lg:grid-cols-[1fr_2fr] lg:items-start' : ''}>
        <div className={variante === 'pagina' ? 'sr-only' : undefined}>
          {variante !== 'faixa' ? (
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-tinta">{t('inscricao.kicker')}</p>
          ) : null}
          <h2 id={`${uid}-titulo`} className="max-w-[26ch] text-[1.4rem] leading-tight text-balance sm:text-[1.5rem]">
            {titulo.split('|').map((parte, i) =>
              i % 2 ? (
                <em key={i} className="ancora">
                  {parte}
                </em>
              ) : (
                <span key={i}>{parte}</span>
              )
            )}
          </h2>
          <p className="mt-2 max-w-[48ch] text-[15px] text-grafite">{apoio}</p>
        </div>

        {estado === 'sucesso' ? (
          <div role="status" className={`flex items-start gap-4 ${variante === 'bloco' ? 'mt-6' : ''}`}>
            {/* O L/ que assina, desenhado uma vez. */}
            <svg width="30" height="26" viewBox="0 0 24 21" fill="none" aria-hidden="true" className="mt-1 shrink-0">
              <motion.path
                d="M3 2v17h9"
                stroke="var(--cor-tinta)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{pathLength: reduzido ? 1 : 0}}
                animate={{pathLength: 1}}
                transition={reduzido ? {duration: 0} : {duration: 0.45, ease: [0.23, 1, 0.32, 1]}}
              />
              <motion.path
                d="M13 19L20 2"
                stroke="var(--cor-avanco)"
                strokeWidth="3"
                strokeLinecap="round"
                initial={{pathLength: reduzido ? 1 : 0}}
                animate={{pathLength: 1}}
                transition={reduzido ? {duration: 0} : {duration: 0.4, ease: [0.23, 1, 0.32, 1], delay: 0.35}}
              />
            </svg>
            <div>
              <p className="text-lg font-semibold text-tinta">{t('inscricao.sucessoTitulo')}</p>
              <p className="mt-1 max-w-[52ch] text-[15px] text-grafite">{t('inscricao.sucessoTexto')}</p>
            </div>
          </div>
        ) : (
          <form className={variante === 'bloco' ? 'mt-6' : ''} onSubmit={enviar} noValidate>
            {/* A armadilha: fora da tela e da árvore de acessibilidade. Robô preenche. */}
            <div aria-hidden="true" style={{position: 'absolute', left: '-9999px', width: '1px', height: '1px', overflow: 'hidden'}}>
              <label htmlFor={`${uid}-armadilha`}>Company</label>
              <input id={`${uid}-armadilha`} name={CAMPO_ARMADILHA} type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {/* `acento="avanco"`: o campo nasceu na landing do guia, com o foco em latão, e latão
                  é exclusivo de lá. No blog o foco é Avanço (achado no portão de 24/09/2026). */}
              <CampoFlutuante rotulo={t('inscricao.nome')} name="name" autoComplete="given-name" required acento="avanco" />
              <CampoFlutuante
                rotulo={t('inscricao.email')}
                name="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                required
                acento="avanco"
              />
            </div>
            <div className="mt-4 flex items-start gap-3">
              <input
                id={`${uid}-consentimento`}
                type="checkbox"
                name="consent"
                checked={aceito}
                onChange={(e) => setAceito(e.target.checked)}
                className="mt-0.5 size-5 shrink-0 accent-[var(--cor-avanco)]"
              />
              <label htmlFor={`${uid}-consentimento`} className="text-[13px] leading-relaxed text-grafite">
                {/* A cola do site pega duas palavras; na letra de 13px "any time." ainda fechava
                    a linha em 21% (medido em 390). Três: "at any time." */}
                {colarUltimasPalavrasEm(t('inscricao.consentimento'))}
              </label>
            </div>
            <button type="submit" className={`${botaoPrimario} mt-5`} disabled={estado === 'enviando'} aria-busy={estado === 'enviando'}>
              {estado === 'enviando' ? t('inscricao.enviando') : t('inscricao.botao')}
              <Seta />
            </button>
            {estado === 'erro-campos' || estado === 'erro-sistema' ? (
              <p role="alert" className="mt-4 text-[14px] font-medium text-tinta">
                {estado === 'erro-campos' ? t('inscricao.erroCampos') : t('inscricao.erroSistema')}{' '}
                {estado === 'erro-sistema' ? (
                  <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="font-semibold text-avanco underline underline-offset-4">
                    WhatsApp
                  </a>
                ) : null}
              </p>
            ) : null}
          </form>
        )}
      </div>
    </section>
  );
}
