import type {Metadata} from 'next';
import {useTranslations} from 'next-intl';
import {setRequestLocale} from 'next-intl/server';
import {Link} from '@/i18n/navigation';
import type {Locale} from '@/i18n/routing';
import {alternatesPara} from '@/lib/seo';
import {LogoHorizontal} from '@/components/ui/logo';
import {PeleLanding} from '@/components/landing/pele';
import {HeroDaManha} from '@/components/landing/hero-da-manha';
import {FichasDoGuia} from '@/components/landing/fichas-do-guia';
import {Simulacao} from '@/components/landing/simulacao';
import {QuemEscreveu} from '@/components/landing/quem-escreveu';
import {CtaFinal} from '@/components/landing/cta-final';
import {AssinaturaTaOnline} from '@/components/ui/AssinaturaTaOnline';

/* A LANDING DO GUIA, versão 3 · "A manhã inteira" (08/09/2026).
 *
 * Ordem das seções e posse do movimento (plano-landing-guia-v3.md):
 *   1. Hero, a manhã inteira ........... GSAP (Hero Scrub 12213 + coreografia do 12330), único trecho preso
 *   2. As três fichas ................. Framer (Stacking Cards 25275 + Count Up 20068)
 *   2b. A simulação, pausa em Tinta ... Framer (Text Scroll Read 19275)
 *   3. Quem escreveu e os passos ...... Framer (Parallax Card 7765 + fio dos passos, Tracing Beam 1149)
 *   4. CTA final, livro e formulário .. Topografia Luminosa (23412) + livro 3D + formulário (Floating Label 23566)
 *   5. Rodapé legal ................... nosso
 *
 * Copy: verbatim do roteiro.md via messages (landing.*). Sem navbar, por
 * decisão do funil: só a logo, como porta de volta. */

// Meta EN verbatim da tabela do roteiro.md (linha "First home, âncora e
// landing"); PT composto por autorização, seguindo a estrutura.
const META = {
  en: {
    title: 'Real Cost Guide for BC | Luis Alves REALTOR®',
    description:
      'The full cost and the real steps to buy your first home in British Columbia. Free guide.'
  },
  pt: {
    title: 'Guia de Custos Reais em BC | Luis Alves REALTOR®',
    description:
      'O custo completo e as etapas reais para comprar seu primeiro imóvel na British Columbia. Guia gratuito.'
  }
};

export async function generateMetadata({params}: {params: Promise<{locale: string}>}): Promise<Metadata> {
  const {locale} = await params;
  const l = locale as Locale;
  return {
    title: META[l].title,
    description: META[l].description,
    alternates: alternatesPara('/real-cost-guide', l)
  };
}

function RodapeLegal({locale}: {locale: Locale}) {
  const t = useTranslations('landing.s3');
  return (
    <footer data-bloco="landing-legal" className="border-t border-papel/10 bg-tinta py-8 text-papel">
      <div className="conteudo">
        <p className="max-w-[95ch] text-[13px] leading-relaxed text-papel/70">
          {t('legal')}{' '}
          <Link
            href="/privacy-policy"
            className="underline decoration-papel/30 underline-offset-4 transition-colors duration-200 hover:text-papel"
          >
            {t('legalPrivacidade')}
          </Link>
        </p>
        {/* A ASSINATURA DA TÁ ONLINE, a mesma do rodapé do site (components/footer.tsx):
            a última linha, no Papel a 75% sobre o Tinta, no idioma da página. */}
        <div data-entrada="assinatura" className="mt-6 border-t border-papel/10 pt-4 text-papel/75">
          <AssinaturaTaOnline idioma={locale} />
        </div>
      </div>
    </footer>
  );
}

export default async function PaginaGuiaCustoReal({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  setRequestLocale(locale);

  return (
    <PeleLanding>
      {/* A PORTA DE VOLTA: só a logo, ligada à home. Navbar aqui devolveria à
          landing as seis saídas que o funil existe para não ter. Flutua por
          cima da hero, inerte ao ponteiro fora da marca. A hero é a cena em toda
          largura e a marca mora sobre o céu, então ela é Tinta em toda tela. */}
      <header
        data-bloco="landing-marca"
        className="conteudo pointer-events-none absolute inset-x-0 top-0 z-20 pt-6 lg:pt-8"
      >
        <Link
          href="/"
          aria-label="Luis Alves REALTOR®"
          className="pointer-events-auto inline-flex min-h-11 items-center rounded-[4px] focus-visible:shadow-[0_0_0_3px_var(--cor-latao)] focus-visible:outline-none"
        >
          <LogoHorizontal className="h-8 w-auto text-tinta transition-opacity duration-200 hover:opacity-80" />
        </Link>
      </header>
      <main>
        <HeroDaManha />
        <FichasDoGuia />
        <Simulacao />
        <QuemEscreveu />
        <CtaFinal locale={locale as Locale} />
      </main>
      <RodapeLegal locale={locale as Locale} />
    </PeleLanding>
  );
}
