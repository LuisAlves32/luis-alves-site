'use client';

import {useTranslations} from 'next-intl';
import {CampoDoEmail} from '@/components/ui/campo-do-email';
import {guardarEmail, irParaFormulario} from '@/lib/captura-guia';

/* O campo da hero: o começo do formulário final, não um segundo formulário.
   Ele NÃO envia nada. Guarda o e-mail (lib/captura-guia) e desce até o
   formulário do CTA final, que já nasce com o e-mail preenchido e o foco no
   nome. O rótulo acessível do botão diz o que ele faz de verdade ("Continue"),
   nunca "enviar o guia": quem envia é o botão do formulário final. */
export function CampoDaHero({className = ''}: {className?: string}) {
  const t = useTranslations('landing.s1');
  const placeholders = [t('placeholders.p1'), t('placeholders.p2'), t('placeholders.p3')];

  return (
    <CampoDoEmail
      placeholders={placeholders}
      rotulo={t('campoEmail')}
      rotuloBotao={t('continuar')}
      className={className}
      aoEnviar={(email) => {
        guardarEmail(email);
        // A partícula ainda está se desfazendo; a descida começa junto, e é
        // isso que liga o gesto ao destino.
        window.setTimeout(irParaFormulario, 120);
      }}
    />
  );
}
