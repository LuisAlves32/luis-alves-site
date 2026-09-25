import {ArrowUpRight} from 'lucide-react';
import {useLocale, useTranslations} from 'next-intl';
import type {Locale} from '@/i18n/routing';
import {linkDiscreto} from '@/components/ui/botoes';
import {imoveisVendidos, REW_VENDAS, Vendidos} from '@/components/vendidos';

// Fiação da seção de vendidos NA HOME. O componente é um só
// (components/vendidos.tsx); o que muda de página para página é o rodapé, e
// desde o 2.39 a home é a única página que o usa.
// O rodapé tem UMA saída. O botão "ver todos os imóveis" saiu junto com a
// página /listings, que foi arquivada em _arquivo/listings/ enquanto a
// integração MLS/IDX com a Stonehaus não existir: botão que promete uma busca
// que o site não tem é pior que botão nenhum. Sobra o link do REW, que leva à
// lista pública e verificável das vendas do Luis, e é justamente o que esta
// seção existe para provar.
export function VendidosHome() {
  const locale = useLocale() as Locale;
  const t = useTranslations('paginaImoveis');

  return (
    <Vendidos
      titulo={t('soldTitulo')}
      tituloId="titulo-vendidos-home"
      etiquetaSold={t('etiquetaSold')}
      itens={imoveisVendidos(locale)}
      rodape={
        /* TODO: rótulo do link externo pendente de confirmação do diretor.
           "Past sales" é o nome que a própria fonte dá à página, e por isso
           ele fica igual nos dois idiomas, pela mesma razão de
           "Listing agent" (item 3.4 do 2.35). Não veio do roteiro.md. */
        <a
          href={REW_VENDAS}
          target="_blank"
          rel="noopener noreferrer"
          className={linkDiscreto}
        >
          Past sales · REW.ca
          <ArrowUpRight
            aria-hidden="true"
            strokeWidth={1.5}
            className="size-[16px] shrink-0"
          />
        </a>
      }
    />
  );
}
