import {useTranslations} from 'next-intl';
import {Kicker} from '@/components/ui/assinatura';
import {ExpansaoMidia} from '@/components/ui/expansao-midia';
import {RegioesPalco} from '@/components/regioes-palco';

// Bloco 10 do roteiro.md: PICO 3 da home em dois atos (decisão 29/08, .md).
// Ato 1: a expansão de vídeo (Scroll media expansion hero, INTOCADA).
// Ato 2: o palco das 12 cidades (lumina-interactive-list, 21st.dev 9952,
// reescrita fiel de produção em regioes-palco.tsx), que carrega a ÚNICA
// exceção de autoplay do site inteiro. Entre os dois, a faixa curta do apoio
// sobre Céu. O mapa autoral SAIU do site (linha técnica exige fundo liso;
// mapa-regioes.tsx fica no repo, sem uso). A respiração global do fundo não
// é tocada pelo palco; depois dele o bloco 11 segue normal.
const CIDADES = [
  {chave: 'c1', slug: 'south-surrey'},
  {chave: 'c2', slug: 'white-rock'},
  {chave: 'c3', slug: 'surrey'},
  // TODO: cidade-langley.webp é STAND-IN (cópia de cidade vizinha; a foto
  // original foi reprovada no QC de curadoria). A definitiva entra por troca
  // de arquivo com o MESMO nome, sem tocar em código. Nunca foto por IA.
  {chave: 'c4', slug: 'langley'},
  {chave: 'c5', slug: 'coquitlam'},
  {chave: 'c6', slug: 'port-coquitlam'},
  {chave: 'c7', slug: 'port-moody'},
  {chave: 'c8', slug: 'burnaby'},
  {chave: 'c9', slug: 'new-westminster'},
  {chave: 'c10', slug: 'vancouver'},
  // TODO: cidade-maple-ridge.webp é STAND-IN (mesma regra do langley acima)
  {chave: 'c11', slug: 'maple-ridge'},
  {chave: 'c12', slug: 'north-vancouver'}
] as const;

export function Regioes() {
  const t = useTranslations('regioes');
  const c = useTranslations('colecao');
  const cidades = CIDADES.map((cidade) => ({
    nome: t(`cidades.${cidade.chave}`),
    slug: cidade.slug
  }));

  return (
    <section data-bloco="regioes" data-owner="catalogo">
      <ExpansaoMidia titulo={t('titulo')}>
        {/* Faixa do apoio: kicker com o título verbatim (a Barra da
            assinatura é o "/") e o apoio em escala editorial. Nada além
            disso na faixa. */}
        <div className="bg-ceu">
          <div className="conteudo py-14 lg:py-16">
            <Kicker>{t('titulo')}</Kicker>
            <p
              data-camada="frente"
              className="mt-5 max-w-[30em] text-[clamp(1.25rem,2.2vw,1.75rem)] leading-[1.45] text-tinta"
            >
              {t('apoio')}
            </p>
          </div>
        </div>

        <RegioesPalco
          cidades={cidades}
          rotuloSecao={t('titulo')}
          rotulos={{pausar: c('pausar'), retomar: c('retomar')}}
        />
      </ExpansaoMidia>
    </section>
  );
}
