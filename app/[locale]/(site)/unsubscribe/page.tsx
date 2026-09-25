import type {Metadata} from 'next';
import {setRequestLocale} from 'next-intl/server';
import {DESCADASTRO_PAGINA, type EstadoDaPagina} from '@/content/descadastro';
import {Link} from '@/i18n/navigation';
import type {Locale} from '@/i18n/routing';
import {botaoPrimario, linkAcao, Seta} from '@/components/ui/botoes';
import {PARAMETRO_DA_FICHA, ehFichaValida} from '@/lib/descadastro';
import {cancelarAtualizacoes} from './acao';

/* =============================================================================
   DESCADASTRO DAS ATUALIZAÇÕES DE MERCADO · a página

   Ela existe por exigência da CASL, que pede link de descadastro FUNCIONAL em
   todo e-mail comercial, e chega só pelo rodapé do e-mail do guia.

   POR QUE UMA PÁGINA E NÃO UM LINK QUE JÁ RESOLVE: filtro de segurança
   corporativo e pré-carregamento do Gmail abrem as URLs de um e-mail sozinhos.
   Um GET que efetiva a baixa descadastraria gente que nunca clicou, em silêncio.
   A baixa é o POST do botão daqui. Ver `acao.ts`.

   NOINDEX e FORA DO SITEMAP: sem a ficha na URL esta página não significa nada,
   e uma "página de cancelamento" indexada é um convite a chegar aqui por engano.

   NO GRUPO (site), e não no (funil): a landing do ebook tem pele própria (Lora,
   Poppins, latão) e o latão é EXCLUSIVO dela por lei do projeto. Isto aqui é uma
   página de preferência do SITE, então usa a pele institucional e ganha de graça
   o cabeçalho e o rodapé com a identificação da corretora, que é o que dá
   contexto a quem chegou de um e-mail e não sabe onde caiu.

   SEM FIO, SEM RÉGUA, SEM TRAÇO. Regra de marca. O que separa o texto do botão
   é espaço.
   ========================================================================== */

export async function generateMetadata({
  params
}: {
  params: Promise<{locale: string}>;
}): Promise<Metadata> {
  const {locale} = await params;
  return {
    title: DESCADASTRO_PAGINA[locale as Locale].metaTitulo,
    robots: {index: false, follow: false}
  };
}

/**
 * O ESTADO vem de duas fontes, nesta ordem:
 *   1. `?estado=` que a ação escreveu depois do POST (sucesso, falha, inválido);
 *   2. a forma da ficha, para quem está chegando do e-mail agora.
 *
 * O `?estado=` NÃO é confiável e não precisa ser: ele só escolhe qual texto
 * aparece. Quem muda a planilha é a ação, e ela confere a ficha por conta.
 */
function estadoDaVez(
  estado: string | undefined,
  ficha: string | undefined
): EstadoDaPagina {
  if (estado === 'sucesso' || estado === 'falha' || estado === 'invalido') {
    return estado;
  }
  return ehFichaValida(ficha) ? 'confirmacao' : 'invalido';
}

export default async function PaginaDescadastro({
  params,
  searchParams
}: {
  params: Promise<{locale: string}>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const {locale} = await params;
  const l = locale as Locale;
  setRequestLocale(l);

  const busca = await searchParams;
  const umValor = (v: string | string[] | undefined) =>
    Array.isArray(v) ? v[0] : v;

  const ficha = umValor(busca[PARAMETRO_DA_FICHA]);
  const estado = estadoDaVez(umValor(busca.estado), ficha);

  const t = DESCADASTRO_PAGINA[l];
  const bloco = t.estados[estado];

  return (
    <main className="flex min-h-[60svh] items-center py-secao">
      <div className="conteudo">
        {/* Medida curta de propósito: são três linhas de texto e uma decisão.
            Uma coluna larga faria a pessoa procurar o botão. */}
        <div className="max-w-[34rem]">
          <h1 className="text-[clamp(1.7rem,3.4vw,2.3rem)] leading-[1.2] tracking-[-0.01em] text-tinta">
            {bloco.titulo}
          </h1>
          <p className="mt-5 text-[15px] leading-relaxed text-grafite lg:text-base">
            {bloco.corpo}
          </p>

          {estado === 'confirmacao' && bloco.botao ? (
            <form action={cancelarAtualizacoes} className="mt-8">
              {/* A ficha viaja no corpo do POST, não na ação: é o mesmo valor
                  que veio na URL, e mandá-lo pelo corpo evita que ele apareça
                  de novo na barra de endereço depois do envio. */}
              <input type="hidden" name={PARAMETRO_DA_FICHA} value={ficha ?? ''} />
              <input type="hidden" name="idioma" value={l} />
              <button type="submit" className={botaoPrimario}>
                {bloco.botao}
              </button>
            </form>
          ) : (
            <p className="mt-8">
              <Link href="/" className={linkAcao}>
                {t.voltar}
                <Seta />
              </Link>
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
