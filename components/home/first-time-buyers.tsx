import {useTranslations} from 'next-intl';
import {Link} from '@/i18n/navigation';
import {Barra} from '@/components/ui/assinatura';
import {botaoPrimario, Seta} from '@/components/ui/botoes';
import {PlaceholderMidia} from '@/components/ui/placeholder-midia';

// Bloco 5 do roteiro.md, em Areia: o ÚNICO bloco quente da página.
// Camadas: fundo = bloco Areia (cor da seção), meio = mockup do guia,
// frente = texto e chips de custo com o marcador-barra da assinatura.
export function FirstTimeBuyers() {
  const t = useTranslations('primeiroImovel');
  const chips = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6'] as const;

  return (
    <section data-bloco="first-home" className="bg-areia py-secao">
      <div className="conteudo grid items-center gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-16">
        <div data-camada="frente">
          <h2 className="max-w-[24ch]">{t('titulo')}</h2>
          <ul className="mt-7 flex max-w-[36rem] flex-wrap gap-x-6 gap-y-3">
            {chips.map((chip) => (
              <li key={chip} className="flex items-center gap-2 text-[15px] font-medium text-tinta">
                <Barra className="h-[0.8em] w-[2.5px]" />
                {t(`chips.${chip}`)}
              </li>
            ))}
          </ul>
          <p className="mt-7 max-w-[60ch]">{t('texto1')}</p>
          <p className="mt-4 max-w-[60ch]">{t('texto2')}</p>
          <div className="mt-8">
            <Link href="/real-cost-guide" className={botaoPrimario}>
              {t('cta')}
              <Seta className="group-hover:translate-x-[3px]" />
            </Link>
          </div>
        </div>
        <div data-camada="meio">
          <PlaceholderMidia
            proporcao="3:4"
            rotulo="mockup capa do guia 3:4"
            className="mx-auto w-full max-w-[340px]"
          />
        </div>
      </div>
    </section>
  );
}
