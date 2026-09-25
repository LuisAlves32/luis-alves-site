import type {Metadata, Viewport} from 'next';
import {hasLocale, NextIntlClientProvider} from 'next-intl';
import {setRequestLocale} from 'next-intl/server';
import {notFound} from 'next/navigation';
import {MotionProvider} from '@/components/motion-provider';
import {routing} from '@/i18n/routing';
import {siteUrl} from '@/lib/seo';
import '../globals.css';

/* AS FONTES DO SITE NÃO MORAM MAIS AQUI (06/09/2026).
   A Inter e a Instrument Serif desceram para `(site)/layout.tsx`, e o motivo é
   MEDIDO: este layout cobre os DOIS grupos de rota, então toda visita à landing
   do funil pré-carregava 70,8 KB de fonte que a landing nunca desenha (Inter
   47,3 KB, Instrument Serif 23,5 KB em dois arquivos). A landing é tráfego
   pago, e KB no caminho crítico ali custa dinheiro.
   O funil traz o próprio elenco em `components/landing/pele.tsx`, e o site
   passou a trazer o dele no layout do grupo. Este arquivo fica só com o que é
   de verdade comum aos dois: <html>, <body>, i18n e a camada de movimento. */

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  icons: {
    icon: [
      {url: '/favicon-32.png', sizes: '32x32', type: 'image/png'},
      {url: '/icon-192.png', sizes: '192x192', type: 'image/png'},
      {url: '/icon-512.png', sizes: '512x512', type: 'image/png'}
    ],
    apple: '/apple-touch-icon.png'
  }
};

/* MODO ESCURO FORÇADO (portão da prova no aparelho, 24/09/2026): o Chrome do Android e o
   Samsung Internet escurecem à força a página que julgam "só clara" e invertem a paleta do
   Luís. `color-scheme: light` NÃO recusa isso; a recusa é `only light`, em DOIS lugares: esta
   meta (chega antes da folha de estilo, que é quando o navegador decide) e o `:root` do
   globals.css. Limite honesto: no Samsung Internet vale só se o usuário ligar a opção de
   respeitar o site. */
export const viewport: Viewport = {colorScheme: 'only light'};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({locale}));
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    // `suppressHydrationWarning` vale SÓ para os atributos do próprio <html>: o script da espera
    // da câmera (layout do grupo (site)) marca `data-camera` antes da hidratação, de propósito.
    <html lang={locale} suppressHydrationWarning>
      <body className="antialiased">
        {/* O chrome do site (navbar, rodapé, flutuante) vive no grupo (site);
            o grupo (funil) fica sem chrome, para a landing do ebook */}
        <NextIntlClientProvider>
          <MotionProvider>{children}</MotionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
