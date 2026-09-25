import {feedDasNotas} from '@/lib/feed-notas';

/* O feed RSS das notas em INGLÊS (lib/feed-notas.ts). Fora do [locale] porque o
   proxy.ts não roteia caminhos com ponto; a listagem continua em /notes. */
export const revalidate = 3600;

export function GET() {
  return feedDasNotas('en');
}
