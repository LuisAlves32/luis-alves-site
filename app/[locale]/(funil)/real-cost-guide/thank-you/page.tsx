import type {Metadata} from 'next';
import {useTranslations} from 'next-intl';
import {setRequestLocale} from 'next-intl/server';
import type {Locale} from '@/i18n/routing';
import {INSTAGRAM_URL} from '@/lib/links';
import {GUIA_PDF, ROTA_DO_GUIA} from '@/lib/guia-pdf';
import {
  botaoLatao,
  fonteCorpo,
  headlineFunil,
  PeleLanding
} from '@/components/landing/pele';

const TITULOS = {
  en: 'Done. Your guide is on the way.',
  pt: 'Pronto. O guia está a caminho.'
};

/**
 * OS DOIS PDFs DO GUIA saíram deste arquivo em 09/09/2026, na rodada 4.4, e
 * viraram `lib/guia-pdf.ts`. O motivo é que ganharam um SEGUNDO LEITOR: o
 * e-mail de entrega, que precisa do mesmo caminho em versão absoluta. Caminho
 * de arquivo escrito em dois lugares é caminho que um dia diverge, e o dia em
 * que divergir é o dia em que o link do e-mail dá 404 sem ninguém perceber,
 * porque esta página aqui continua funcionando.
 */
const GUIA = GUIA_PDF;

// Página pós-conversão: fora do índice e fora do sitemap. O evento de
// conversão dispara no envio do formulário, nunca aqui (roteiro.md).
export async function generateMetadata({
  params
}: {
  params: Promise<{locale: string}>;
}): Promise<Metadata> {
  const {locale} = await params;
  return {
    title: TITULOS[locale as Locale],
    robots: {index: false, follow: false}
  };
}

function ConteudoObrigado({locale}: {locale: Locale}) {
  const t = useTranslations('obrigado');
  const guia = GUIA[locale] ?? GUIA.en;

  return (
    <main className="flex min-h-svh items-center py-14">
      <div className="conteudo max-w-[42rem]">
        <h1 className={`${headlineFunil} text-[clamp(1.9rem,4vw,2.7rem)] leading-[1.15] text-white`}>
          {t('titulo')}
        </h1>
        <p className="mt-5 max-w-[58ch] text-[15px] leading-relaxed text-papel/85 lg:text-base">
          {t('corpo')}
        </p>
        <div className="mt-8">
          {/* O guia NA HORA, sem obrigar ninguém a esperar o e-mail (decisão do
              roteiro.md, e ela continua valendo). Desde 24/09/2026 o botão passa
              pela porta `/api/guia`, que só entrega a quem acabou de enviar o
              formulário (o passe gravado pela rota do envio). Quem chegar aqui
              por um link compartilhado volta para a landing. O `download` fica
              como pedido ao navegador; o nome do arquivo vem do próprio Blob. */}
          <a href={`${ROTA_DO_GUIA}?idioma=${locale}`} download={guia.arquivo} className={botaoLatao}>
            {t('botao')}
          </a>
        </div>
        <p className={`${fonteCorpo} mt-10 max-w-[50ch] border-t border-papel/15 pt-6 text-sm text-papel/80`}>
          {/* Espaço inflexível: o @ desce junto com a última palavra da frase, nunca
              sozinho (em 320px ele abria a última linha, 24/09/2026). */}
          {t('secundario')}
          {' '}
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-papel/30 underline-offset-4 transition-colors duration-200 hover:text-papel"
          >
            @luisalvesrealestate
          </a>
        </p>
      </div>
    </main>
  );
}

export default async function PaginaObrigado({
  params
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  setRequestLocale(locale);

  return (
    <PeleLanding>
      <ConteudoObrigado locale={locale as Locale} />
    </PeleLanding>
  );
}
