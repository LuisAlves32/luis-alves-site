import {Link} from '@/i18n/navigation';
import type {Nota} from '@/lib/notas';
import {dataDaNota, serieDaNota} from '@/lib/notas-formato';
import {CapaCota} from './capa-cota';
import {IndiceDoDossie} from './indice-do-dossie';
import './notas.css';

/* O ÍNDICE DO DOSSIÊ (design-blog.md, 5.2): uma linha por nota, com o N.º, o título, a
   categoria, a data e o tempo, e o NÚMERO-TESE alinhado à direita em algarismos
   tabulares, como um livro-razão. As linhas e as capas nascem AQUI, no servidor; o
   `IndiceDoDossie` (cliente) só filtra e acende a capa sob o ponteiro. No Passe 3 o
   número da capa grande vem arquivar na primeira linha (`data-indice-valor`). */
export function IndiceNotas({
  notas,
  locale,
  categorias,
  minutos,
  rotuloLeitura,
  rotuloFiltros,
  rotuloTodas,
  tituloIndice,
  textoVazio
}: {
  notas: Nota[];
  locale: string;
  categorias: Record<string, string>;
  minutos: (n: number) => string;
  rotuloLeitura: string;
  rotuloFiltros: string;
  rotuloTodas: string;
  tituloIndice: string;
  textoVazio: string;
}) {
  // Só as categorias que têm nota: filtro que devolve lista vazia é filtro que não devia existir.
  const presentes = Object.keys(categorias).filter((c) => notas.some((n) => n.categoria === c));
  const filtros = [{id: 'todas', rotulo: rotuloTodas}, ...presentes.map((c) => ({id: c, rotulo: categorias[c]}))];

  const itens = notas.map((n, i) => ({
    slug: n.slug,
    categoria: n.categoria,
    linha: (
      <Link
        href={{pathname: '/notes/[slug]', params: {slug: n.slug}}}
        locale={n.idioma}
        className="indice-linha"
        hrefLang={n.idioma}
      >
        <span className="indice-serie">{serieDaNota(n.serie)}</span>
        <span className="indice-titulo">
          {n.tela.titulo}
          <span className="indice-meta">
            {categorias[n.categoria]} · {dataDaNota(n.publicado, locale)} · {minutos(n.minutos)}
            {n.idioma !== locale ? ` · ${n.idioma.toUpperCase()}` : ''}
          </span>
        </span>
        <span className="indice-pontilhado" aria-hidden="true" />
        <span className="indice-valor" data-indice-valor={i === 0 ? 'primeiro' : undefined}>
          {n.numero || minutos(n.minutos)}
        </span>
      </Link>
    ),
    previa: (
      <CapaCota
        tamanho="previa"
        categoria={n.categoria}
        numero={n.numero}
        rotulo={n.rotuloDoNumero}
        titulo={n.tela.titulo}
        minutosTexto={minutos(n.minutos)}
        rotuloLeitura={rotuloLeitura}
        kicker={
          <>
            {serieDaNota(n.serie)}
            <i>/</i>
            {categorias[n.categoria]}
          </>
        }
        descricao={n.titulo}
        className="h-full"
      />
    )
  }));

  return (
    // `data-owner`: o índice é do Framer (filtros e prévia), e é o ALVO onde o número da capa
    // arquiva. A entrada genérica da câmera deslocaria a lista depois da medida do encaixe.
    <div data-camada="frente" data-owner="catalogo">
      <IndiceDoDossie
        itens={itens}
        filtros={filtros}
        rotuloFiltros={rotuloFiltros}
        tituloIndice={tituloIndice}
        textoVazio={textoVazio}
      />
    </div>
  );
}
