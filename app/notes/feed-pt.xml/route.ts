import {feedDasNotas} from '@/lib/feed-notas';

/* O feed RSS das notas em PORTUGUÊS (lib/feed-notas.ts). Mora em /notes/feed-pt.xml, e
   não em /pt/notas/feed.xml, porque uma pasta /pt estática aqui na raiz roubaria TODAS as
   rotas em português do [locale]. */
export const revalidate = 3600;

export function GET() {
  return feedDasNotas('pt');
}
