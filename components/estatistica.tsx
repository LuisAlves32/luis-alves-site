'use client';

import Script from 'next/script';
import {useEffect} from 'react';
import {EVENTOS, marca} from '@/lib/estatistica';

/**
 * O SCRIPT DA ESTATÍSTICA E OS CLIQUES DE CONTATO, num ponto só (Passe 4).
 *
 * Montado UMA vez no layout do locale, que cobre o site e a landing do guia.
 * Sem `NEXT_PUBLIC_UMAMI_ID` ele não carrega nada e o site roda igual.
 * `NEXT_PUBLIC_*` é embutida no BUILD: depois de cadastrar a variável na
 * Vercel, o deploy tem de ser NOVO, sem cache, ou a medição fica morta calada.
 *
 * OS CLIQUES SÃO OUVIDOS POR DELEGAÇÃO, no documento, e não link a link. O
 * WhatsApp aparece em dez lugares, quase todos componentes de servidor; marcar
 * cada um seria a regra de sempre (movimento, órfãs): o que é sistema mora num
 * ponto só, e o link que nascer daqui a seis meses já nasce medido. O `lugar`
 * é o `data-bloco` mais próximo (ou navbar, rodapé, flutuante), que é o que
 * responde "qual chamada converte".
 *
 * `capture: true` para ler o clique antes de qualquer componente que pare a
 * propagação. Nada aqui chama `preventDefault`: medir nunca atrasa o contato.
 */
export function Estatistica() {
  const id = process.env.NEXT_PUBLIC_UMAMI_ID;

  useEffect(() => {
    if (!id) return;

    function aoClicar(evento: MouseEvent) {
      const alvo = evento.target;
      if (!(alvo instanceof Element)) return;
      const link = alvo.closest('a[href]');
      if (!link) return;
      const href = link.getAttribute('href') ?? '';

      const nome = href.includes('wa.me/')
        ? EVENTOS.whatsapp
        : href.startsWith('tel:')
          ? EVENTOS.telefone
          : href.startsWith('mailto:')
            ? EVENTOS.email
            : href.includes('/api/guia')
              ? EVENTOS.guia
              : null;
      if (!nome) return;

      marca(nome, {pagina: window.location.pathname, lugar: lugarDo(link)});
    }

    document.addEventListener('click', aoClicar, {capture: true});
    return () => document.removeEventListener('click', aoClicar, {capture: true});
  }, [id]);

  if (!id) return null;
  const host = process.env.NEXT_PUBLIC_UMAMI_HOST ?? 'https://cloud.umami.is';
  // `afterInteractive`: a medição nunca disputa a primeira tela com a hero.
  return <Script src={`${host}/script.js`} data-website-id={id} strategy="afterInteractive" />;
}

function lugarDo(link: Element): string {
  const bloco = link.closest('[data-bloco]')?.getAttribute('data-bloco');
  if (bloco) return bloco;
  if (link.closest('nav, header')) return 'navbar';
  if (link.closest('footer')) return 'rodape';
  return 'flutuante';
}
