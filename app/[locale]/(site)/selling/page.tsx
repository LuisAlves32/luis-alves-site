import type {Metadata} from 'next';
import {useTranslations} from 'next-intl';
import {setRequestLocale} from 'next-intl/server';
import type {Locale} from '@/i18n/routing';
import {alternatesPara} from '@/lib/seo';
import {Barra} from '@/components/ui/assinatura';
import {Calha} from '@/components/ui/calha';
import {botaoPrimario} from '@/components/ui/botoes';
import {CardFicha} from '@/components/ui/card-ficha';
import {CardsRolagem} from '@/components/ui/cards-rolagem';
import {LinhasEsqueleto} from '@/components/ui/esqueleto';
import {FantasmaPagina} from '@/components/ui/fantasma';
import {Campo, CampoArea} from '@/components/ui/formulario';
import {FormularioEnvio} from '@/components/ui/formulario-envio';
import {CtaFinal} from '@/components/home/cta-final';
import {Faq} from '@/components/home/faq';

// Meta EN verbatim da tabela do roteiro.md; PT composto por autorização,
// seguindo a estrutura da tabela.
const META = {
  en: {
    title: 'Sell My Home in South Surrey and Surrey | Luis Alves REALTOR®',
    description:
      'Pricing strategy, preparation, marketing and negotiation for sellers in Greater Vancouver.'
  },
  pt: {
    title: 'Vender Imóvel em South Surrey e Surrey | Luis Alves REALTOR®',
    description:
      'Estratégia de preço, preparação, marketing e negociação para quem vende em Greater Vancouver.'
  }
};

export async function generateMetadata({
  params
}: {
  params: Promise<{locale: string}>;
}): Promise<Metadata> {
  const {locale} = await params;
  const l = locale as Locale;
  return {
    title: META[l].title,
    description: META[l].description,
    alternates: alternatesPara('/selling', l)
  };
}

// Formulário de avaliação (roteiro.md, bloco 4): destacado em Céu, logo depois
// do bloco de preço, que é onde a vontade nasce. Obrigatórios: só nome e um
// contato (o e-mail);
// a validação real de "um de dois contatos" continua pendente do sistema de
// formulário. Envio real desde a rodada 4.2. Os rótulos EN de endereço, tipo e
// prazo não estão no roteiro (compostos, a revisar).
// TODO(copy): `paginaVender.confirmacao` é provisória, emprestada verbatim da
// confirmação do contato. Ver o `_confirmacaoNota` em messages/.
// Nenhuma frase que estime valor, nem aqui nem na confirmação.
/* A ÂNCORA DA SEÇÃO É UMA FONTE SÓ, e serve a três coisas: é o destino dos
   links internos, é o sufixo da `origem` gravada na planilha e é o prefixo dos
   ids dos campos.
   Até 05/09 este formulário aparecia DUAS vezes na página, idêntico, e a
   distinção de âncora existia para saber qual das duas posições convertia.
   Ficou uma só (decisão de direção, ver pendencias-luis-alves.md), então a
   comparação morreu junto e a âncora voltou a ser uma constante. */
const ANCORA = 'market-review';

function FormularioAvaliacao() {
  const t = useTranslations('paginaVender');
  const venda = useTranslations('venda');

  return (
    <section id={ANCORA} data-bloco="vender-formulario" className="bg-ceu py-secao">
      <div className="conteudo">
        <div className="max-w-[46rem] rounded-[12px] border border-lapis bg-white p-7 lg:p-9">
          <h2 className="text-[clamp(1.35rem,2.2vw,1.7rem)]">{venda('cta')}</h2>
          <FormularioEnvio
            tipo="avaliacao"
            origemWhatsApp="sellers"
            sucesso={{modo: 'mensagem', texto: t('confirmacao')}}
            ancora={ANCORA}
            botao={{
              rotulo: venda('cta'),
              className: botaoPrimario,
              // O botão vive numa grade de duas colunas e ocupa a linha
              // inteira, como antes.
              envolucro: 'sm:col-span-2'
            }}
            classeMensagem="mt-7 text-[15px] leading-relaxed"
            className="mt-7 grid gap-5 sm:grid-cols-2"
          >
            <Campo id={`${ANCORA}-nome`} name="name" rotulo={t('campos.nome')} obrigatorio autoComplete="name" />
            <Campo id={`${ANCORA}-email`} name="email" rotulo={t('campos.email')} tipo="email" obrigatorio autoComplete="email" />
            <Campo id={`${ANCORA}-telefone`} name="phone" rotulo={t('campos.telefone')} tipo="tel" autoComplete="tel" />
            <Campo id={`${ANCORA}-endereco`} name="propertyAddress" rotulo={t('campos.endereco')} autoComplete="street-address" />
            <Campo id={`${ANCORA}-tipo`} name="propertyType" rotulo={t('campos.tipo')} />
            <Campo id={`${ANCORA}-prazo`} name="timeline" rotulo={t('campos.prazo')} />
            <CampoArea id={`${ANCORA}-mensagem`} name="message" rotulo={t('campos.mensagem')} className="sm:col-span-2" />
          </FormularioEnvio>
        </div>
      </div>
    </section>
  );
}

function ConteudoVender({locale}: {locale: Locale}) {
  const t = useTranslations('paginaVender');
  const nav = useTranslations('nav');
  const passos = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'] as const;
  const erros = ['e1', 'e2', 'e3', 'e4', 'e5'] as const;

  return (
    <main>
      <section data-bloco="vender-cabecalho" className="relative overflow-hidden py-secao">
        <FantasmaPagina palavra={nav('selling')} />
        <div data-camada="frente" className="conteudo relative">
          <h1 className="max-w-[30ch] text-[clamp(2rem,3.6vw,2.7rem)]">{t('titulo')}</h1>
          <p className="mt-6 max-w-[65ch] text-lg">{t('intro')}</p>
        </div>
      </section>

      {/* Bloco 1: as seis etapas na pilha de rolagem do catálogo (21st.dev,
          ver cards-rolagem.tsx): os cards se empilham na rolagem NORMAL da
          página, sticky puro, nada prende nem acelera. Cards tipográficos:
          número grande Avanço + título verbatim, sem apoio inventado.
          Os seis passos e o título vinham do roteiro em UM idioma só. Traduzido em 05/09/2026 a partir do idioma que o cliente entregou; pende de ratificação do Luís (ver roteiro.md). */}
      <section data-bloco="vender-processo" data-owner="catalogo" className="bg-ceu py-secao">
        <div className="conteudo">
          <h2>{t('b1Titulo')}</h2>
          <div data-camada="meio" className="mt-8">
            <CardsRolagem
              cards={passos.map((passo, i) => {
                const texto = t(`passos.${passo}`);
                return (
                  <CardFicha
                    key={passo}
                    className="flex h-[220px] w-full max-w-[36rem] flex-col justify-center gap-4 sm:h-[240px]"
                  >
                    <span
                      aria-hidden="true"
                      className="text-5xl font-extrabold leading-none text-avanco sm:text-6xl"
                    >
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    {texto.trim() ? (
                      <h3 className="max-w-[22ch] text-xl sm:text-2xl">{texto}</h3>
                    ) : (
                      /* GUARDA, não código morto: os dois idiomas estão
                         preenchidos desde a rodada D, então este ramo não
                         dispara hoje. Se alguém esvaziar a chave amanhã, o
                         card mostra esqueleto em vez de um número grande em
                         cima de nada, que é o modo certo de falhar.
                         NÃO "limpar". */
                      <LinhasEsqueleto linhas={1} className="w-3/5" />
                    )}
                  </CardFicha>
                );
              })}
            />
          </div>
        </div>
      </section>

      {/* Bloco 2. Título PT traduzido em 05/09/2026 (o roteiro só entregava
          EN); pende de ratificação do Luís. */}
      <section data-bloco="vender-preco" className="py-secao">
        <div data-camada="frente" className="conteudo">
          <Calha>
            <h2 className="max-w-[24ch]">{t('b2Titulo')}</h2>
            <p className="mt-5 max-w-[65ch]">{t('b2Texto')}</p>
          </Calha>
        </div>
      </section>

      <FormularioAvaliacao />

      {/* Bloco 3: os cinco erros. Copy da direção, aprovada em 05/09/2026.
          Mesmo tratamento do credo da página SOBRE (linha de 1px Lápis ENTRE
          os itens, nunca traço solto), porque é a mesma espécie de conteúdo:
          princípio curto em linguagem de documento. No lugar do número 01 a
          04 do credo entra a Barra, que o projeto já usa como marcador de
          lista. items-baseline, e não items-center, porque o título pode
          quebrar em duas linhas no mobile e a Barra tem que ficar na PRIMEIRA
          linha, não no meio vertical do bloco. */}
      <section data-bloco="vender-erros" className="py-secao">
        <div data-camada="frente" className="conteudo">
          <Calha>
            <h2>{t('b3Titulo')}</h2>
            <ul className="mt-8 max-w-[46rem] divide-y divide-lapis">
              {erros.map((erro) => (
                <li key={erro} className="py-5 first:pt-0 last:pb-0">
                  <h3 className="flex items-baseline gap-3 text-[17px] font-medium text-tinta">
                    <Barra className="h-[0.8em] w-[2.5px]" />
                    <span>{t(`erros.${erro}.titulo`)}</span>
                  </h3>
                  <p className="ml-[calc(2.5px+0.75rem)] mt-2 max-w-[60ch] text-[15px] leading-relaxed">
                    {t(`erros.${erro}.texto`)}
                  </p>
                </li>
              ))}
            </ul>
          </Calha>
        </div>
      </section>

      {/* Bloco 5: a FAQ ampliada de vendedores. Copy da direção, aprovada em
          05/09/2026. Sem className: esta seção não tem fundo, e é assim que a
          alternância desta página funciona.
          NÃO PONHA PERCENTUAL NA q2 ("o que eu pago para vender"). Comissão em
          BC é NEGOCIADA, não tabelada, e publicar um número dá a entender o
          contrário, além de envelhecer. A resposta diz que é acordada por
          escrito antes de o imóvel ir ao ar, que é a promessa que se sustenta.
          A q4 ("vender e comprar ao mesmo tempo") é eco deliberado do bloco
          "Famílias trocando de imóvel" da página COMPRAR: as duas páginas se
          costuram por esse ponto. Não é repetição a limpar. */}
      {/* O bg-ceu NAO e decoracao: sem ele os blocos erros, faq e cta-final
          eram TRES Papel colados, 1748px de chao continuo e duas fronteiras
          inexistentes. A /comprar ja alternava aqui; a /vender nao, e as duas
          terminam com a mesma sequencia de blocos. Era inconsistencia, nao
          decisao. Medido em 05/09/2026. */}
      <Faq
        no="paginaVender.faq"
        itens={['q1', 'q2', 'q3', 'q4', 'q5']}
        idPrefixo="faq-vender"
        className="bg-ceu"
        fechamento={false}
      />

      {/* O fechamento desta página aponta para o formulário DESTA página: quem
          vende já tem aqui o formulário certo, e /contact seria o errado. */}
      <CtaFinal locale={locale} ancoraMensagem={`#${ANCORA}`} fechamento={false} />
    </main>
  );
}

export default async function PaginaVender({
  params
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  setRequestLocale(locale);
  return <ConteudoVender locale={locale as Locale} />;
}
