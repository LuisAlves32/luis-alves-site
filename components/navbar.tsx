'use client';

import {useEffect, useState} from 'react';
import {useLocale, useTranslations} from 'next-intl';
import {Menu, X} from 'lucide-react';
import {Link, usePathname} from '@/i18n/navigation';
import type {Locale} from '@/i18n/routing';
import {linkWhatsApp} from '@/lib/links';
import {Barra} from '@/components/ui/assinatura';
import {LogoHorizontal} from '@/components/ui/logo';

const ITENS = [
  {href: '/buying', chave: 'buying'},
  {href: '/selling', chave: 'selling'},
  {href: '/presales', chave: 'presales'},
  // O blog no menu de cima (25/09/2026), com o NOME da publicação e não "Blog": é o
  // "Journal" das referências, uma publicação do Luís. Antes do About, porque o
  // conteúdo vem antes de quem o escreve.
  {href: '/notes', chave: 'notes'},
  {href: '/about', chave: 'about'},
  {href: '/contact', chave: 'contact'}
] as const;

/* O MENU COMPLETO SÓ A PARTIR DE `xl` (1280px), e é MEDIDO (25/09/2026): com o blog, a
   barra em PT pede 1080px sem quebrar linha (logo 133, itens 556, idioma e WhatsApp 279,
   vãos e calhas 112). Em `lg` (1024px) sobram 1009px, e "Pré-construção", "Segunda
   Opinião" e o botão do WhatsApp quebravam em duas linhas. Entre 1024 e 1279 vale o menu
   recolhido, o mesmo do celular. Item novo no menu: medir de novo em PT. */

/* A seção fica marcada também dentro dela: numa nota (`/notes/[slug]`) o item do blog
   continua aceso. `aria-current="page"` só na página exata; dentro da seção, "true". */
function estadoDoItem(pathname: string, href: string) {
  if (pathname === href) return 'page' as const;
  if (href !== '/' && pathname.startsWith(`${href}/`)) return 'true' as const;
  return undefined;
}


function SeletorIdioma({
  sobreTinta = false,
  onNavegar
}: {
  sobreTinta?: boolean;
  onNavegar?: () => void;
}) {
  const locale = useLocale();
  const caminho = usePathname();
  // Uma NOTA do blog mora num idioma só (a tradução, quando existe, tem o próprio
  // link dentro da nota): trocar de idioma numa nota leva ao índice do outro idioma.
  const pathname = caminho === '/notes/[slug]' ? '/notes' : caminho;
  const ativo = sobreTinta ? 'font-semibold text-papel' : 'font-semibold text-tinta';
  const inativo = sobreTinta
    ? 'text-papel/70 hover:text-papel'
    : 'text-grafite hover:text-tinta';

  return (
    <div className="flex items-center text-sm font-medium">
      <Link
        href={pathname}
        locale="en"
        onClick={onNavegar}
        aria-current={locale === 'en' ? 'true' : undefined}
        className={`inline-flex min-h-11 min-w-11 items-center justify-center transition-colors duration-200 ${locale === 'en' ? ativo : inativo}`}
      >
        EN
      </Link>
      <Barra className="h-[13px] w-[2.5px]" />
      <Link
        href={pathname}
        locale="pt"
        onClick={onNavegar}
        aria-current={locale === 'pt' ? 'true' : undefined}
        className={`inline-flex min-h-11 min-w-11 items-center justify-center transition-colors duration-200 ${locale === 'pt' ? ativo : inativo}`}
      >
        PT
      </Link>
    </div>
  );
}

// Navbar do Passe 1: ESTÁTICA (a camaleoa de rolagem é do Passe 3).
// Na HOME ela fica SOBREPOSTA à hero, transparente sobre o vídeo (estado topo
// do design.md), porque o fundo vivo precisa dos 100svh inteiros. Para isso
// sai do fluxo e vira sticky DENTRO de um invólucro da altura da hero: assim
// ela acompanha os dois atos e, quando a hero acaba, rola embora junto, como
// nas outras páginas. Continua fora do <main>, então o landmark de banner não
// se perde. Nas demais páginas nada muda.
export function Navbar() {
  const t = useTranslations('nav');
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const [aberto, setAberto] = useState(false);
  const sobreposta = pathname === '/';

  // Trava a rolagem enquanto o overlay tinta está aberto.
  useEffect(() => {
    if (!aberto) return;
    const html = document.documentElement;
    const anterior = html.style.overflow;
    html.style.overflow = 'hidden';
    return () => {
      html.style.overflow = anterior;
    };
  }, [aberto]);

  const cabecalho = (
    <header
      className={
        sobreposta
          ? 'pointer-events-auto sticky top-0 border-b border-transparent'
          : 'border-b border-lapis bg-papel'
      }
    >
      <div className="conteudo flex h-16 items-center justify-between gap-6">
        <Link href="/" aria-label="Luis Alves REALTOR®" className="inline-flex min-h-11 shrink-0 items-center">
          <LogoHorizontal className="h-8 w-auto text-tinta" />
        </Link>

        <nav aria-label={t('menu')} className="hidden items-center gap-6 xl:flex">
          {ITENS.map((item) => {
            const estado = estadoDoItem(pathname, item.href);
            const ativo = estado !== undefined;
            return (
              <Link
                key={item.chave}
                href={item.href}
                aria-current={estado}
                className={`inline-flex min-h-11 min-w-11 items-center justify-center text-[14.5px] font-medium transition-colors duration-200 ${
                  ativo ? 'text-tinta' : 'text-grafite hover:text-tinta'
                }`}
              >
                {t(item.chave)}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-5 xl:flex">
          <SeletorIdioma />
          <a
            href={linkWhatsApp('hero', locale)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center rounded-[8px] bg-avanco px-5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-avanco-escuro focus-visible:shadow-[0_3px_0_0_var(--cor-tinta)] active:scale-[0.98]"
          >
            {t('whatsapp')}
          </a>
        </div>

        <button
          type="button"
          onClick={() => setAberto(true)}
          aria-expanded={aberto}
          aria-label={t('abrirMenu')}
          className="-mr-2 flex size-11 items-center justify-center text-tinta xl:hidden"
        >
          <Menu strokeWidth={1.5} className="size-6" />
        </button>
      </div>

      {aberto && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t('menu')}
          className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-tinta px-6 pb-[calc(24px+env(safe-area-inset-bottom))] pt-3 xl:hidden"
        >
          <div className="flex h-13 items-center justify-end">
            <button
              type="button"
              onClick={() => setAberto(false)}
              aria-label={t('fecharMenu')}
              className="-mr-2 flex size-11 items-center justify-center text-papel"
            >
              <X strokeWidth={1.5} className="size-7" />
            </button>
          </div>

          <nav aria-label={t('menu')} className="mt-6 flex flex-col gap-1.5">
            {ITENS.map((item) => {
              const estado = estadoDoItem(pathname, item.href);
              const ativo = estado !== undefined;
              return (
                <Link
                  key={item.chave}
                  href={item.href}
                  onClick={() => setAberto(false)}
                  aria-current={estado}
                  className={`rounded-[12px] px-4 py-3 text-[28px] font-semibold leading-tight tracking-[-0.02em] transition-colors duration-200 ${
                    ativo ? 'bg-papel text-tinta' : 'text-papel hover:text-white'
                  }`}
                >
                  {t(item.chave)}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto flex items-center justify-between gap-4 pt-12">
            <SeletorIdioma sobreTinta onNavegar={() => setAberto(false)} />
            <a
              href={linkWhatsApp('hero', locale)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[52px] items-center justify-center rounded-[8px] bg-avanco px-6 text-[15px] font-semibold text-white transition-colors duration-200 hover:bg-avanco-escuro active:scale-[0.98]"
            >
              {t('whatsapp')}
            </a>
          </div>
        </div>
      )}
    </header>
  );

  if (!sobreposta) return cabecalho;

  // Invólucro fora do fluxo, do topo do documento até o fim da hero: é ele que
  // limita até onde o sticky gruda. pointer-events só na barra, senão a área
  // vazia do invólucro comeria os cliques da hero inteira.
  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 z-50"
      style={{height: 'var(--hero-altura)'}}
    >
      {cabecalho}
    </div>
  );
}
