import type {Metadata} from 'next';
import {useTranslations} from 'next-intl';
import {setRequestLocale} from 'next-intl/server';
import {Link} from '@/i18n/navigation';
import type {Locale} from '@/i18n/routing';
import {ASSUNTOS} from '@/lib/formularios';
import {alternatesPara} from '@/lib/seo';
import {
  EMAIL_CONTATO,
  linkWhatsApp,
  TELEFONE_DISPLAY,
  TELEFONE_TEL,
  WHATSAPP_DISPLAY
} from '@/lib/links';
import {botaoPrimario, botaoSecundario, linkNoTexto} from '@/components/ui/botoes';
import {CardFicha} from '@/components/ui/card-ficha';
import {FantasmaPagina} from '@/components/ui/fantasma';
import {Campo, CampoArea, CampoSelect} from '@/components/ui/formulario';
import {FormularioEnvio} from '@/components/ui/formulario-envio';

// Meta EN verbatim da tabela do roteiro.md; PT composto por autorização,
// seguindo a estrutura da tabela.
const META = {
  en: {
    title: 'Contact Luis Alves REALTOR® | Stonehaus Realty Corp.',
    description: 'Talk on WhatsApp, book a conversation or send a message.'
  },
  pt: {
    title: 'Contato Luis Alves REALTOR® | Stonehaus Realty Corp.',
    description: 'Fale no WhatsApp, agende uma conversa ou envie uma mensagem.'
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
    alternates: alternatesPara('/contact', l)
  };
}

// Página funcional curta (design.md): três caminhos, formulário em coluna
// estreita com um botão só, identificação completa. Sem rolagem longa.
function ConteudoContato({locale}: {locale: Locale}) {
  const t = useTranslations('paginaContato');
  const nav = useTranslations('nav');
  const ctaFinal = useTranslations('ctaFinal');
  const rodape = useTranslations('rodape');

  return (
    <main>
      <section data-bloco="contato-cabecalho" className="relative overflow-hidden py-secao">
        <FantasmaPagina palavra={nav('contact')} />
        <div data-camada="frente" className="conteudo relative">
          <h1 className="max-w-[24ch] text-[clamp(2rem,3.6vw,2.7rem)]">{t('titulo')}</h1>
          <p className="mt-6 max-w-[60ch] text-lg">{t('apoio')}</p>
        </div>

        {/* Os três caminhos, lado a lado (roteiro.md). A ESCADA é UM primário
            e DOIS secundários, os três como botão, mesma anatomia. Ela não é
            escolha de gosto: (1) o roteiro ordena "1. WhatsApp, o mais rápido",
            e a ênfase é do cliente; (2) o público é brasileiro em Vancouver e o
            WhatsApp é o canal dele, então promover o formulário a primário
            seria brigar com o público para ganhar um campo de planilha; (3) o
            CtaFinal, que fecha TODAS as páginas, já usa exatamente esta escada,
            e o site precisa dizer a mesma coisa nos dois lugares.
            Corrigido em 05/09/2026: por um dia o telefone ficou primário como o
            WhatsApp (dois gritos lado a lado, sem escada) e o formulário ficou
            como linkAcao, que é controle de OUTRA espécie. Três cards com a
            mesma anatomia e um mais forte leem como decisão; três cards em que
            um tem outro tipo de controle leem como inacabado.
            A GRAMÁTICA dos três é CANAL, VALOR, AÇÃO: o h2 nomeia o canal, a
            linha do meio traz o valor dele e o botão traz a ação. Os três
            nomes de canal vêm da MESMA fonte, o nó `rodape`, que é onde eles
            já viviam para o bloco de identificação no fim desta página; nenhum
            fica cravado no JSX, senão a fonte se parte em duas.
            Corrigido em 05/09/2026: o card 3 usava `ctaFinal.ctaMensagem` nos
            DOIS slots, então dizia "Enviar mensagem" em cima e embaixo, com o
            vão de 32px no meio. Ação nos dois lugares, canal em nenhum. O card
            2 já tinha resolvido isso na rodada D sem ninguém reparar.
            O card 3 segue SEM linha de valor de propósito: pôr o EMAIL_CONTATO
            aqui transforma referência em oferta, e quem escreve direto some da
            planilha e chega sem telefone e sem assunto. O endereço fica no
            bloco de identificação, onde já está. */}
        <div data-camada="meio" className="conteudo mt-12 grid gap-6 md:grid-cols-3">
          <CardFicha className="flex flex-col">
            <h2 className="text-[17px]">{rodape('rotuloWhatsapp')}</h2>
            <p className="mt-2 text-[15px]">{WHATSAPP_DISPLAY}</p>
            <div className="mt-auto pt-6">
              <a
                href={linkWhatsApp('hero', locale)}
                target="_blank"
                rel="noopener noreferrer"
                className={botaoPrimario}
              >
                {nav('whatsapp')}
              </a>
            </div>
          </CardFicha>

          {/* O card do meio era a agenda online, com um <button> sem destino:
              a pessoa lia, clicava e nada acontecia, numa das três portas da
              página cujo único trabalho é converter. Botão morto é pior que
              botão ausente, porque o visitante testa e conclui que o site está
              quebrado. Trocado em 05/09/2026 pelo TELEFONE, que é canal real,
              funciona hoje e é diferente dos outros dois.
              TODO(agenda): quando a ferramenta for escolhida (Cal.com ou
              Calendly, ver pendencias-luis-alves.md), este card volta a ser a
              agenda e o telefone vira a quarta porta ou desce para o bloco de
              identificação. */}
          <CardFicha className="flex flex-col">
            <h2 className="text-[17px]">{rodape('rotuloTelefone')}</h2>
            <p className="mt-2 text-[15px]">{TELEFONE_DISPLAY}</p>
            <div className="mt-auto pt-6">
              <a href={`tel:${TELEFONE_TEL}`} className={botaoSecundario}>
                {t('ctaLigar')}
              </a>
            </div>
          </CardFicha>

          <CardFicha className="flex flex-col">
            <h2 className="text-[17px]">{rodape('rotuloEmail')}</h2>
            <div className="mt-auto pt-6">
              <a href="#send-a-message" className={botaoSecundario}>
                {ctaFinal('ctaMensagem')}
              </a>
            </div>
          </CardFicha>
        </div>
      </section>

      {/* Formulário curto, coluna estreita, um botão só.
          Obrigatórios: só nome e um contato (o e-mail); a validação real de
          "um de dois contatos" continua pendente do sistema de formulário.
          Envio real desde a rodada 4.2. A confirmação é `paginaContato
          .confirmacao`, VERBATIM do roteiro.md: é a única dos cinco que o
          roteiro entrega escrita. */}
      <section id="send-a-message" data-bloco="contato-formulario" className="bg-ceu py-secao">
        <div className="conteudo">
          <FormularioEnvio
            tipo="contato"
            sucesso={{modo: 'mensagem', texto: t('confirmacao')}}
            ancora="send-a-message"
            botao={{rotulo: ctaFinal('ctaMensagem'), className: botaoPrimario}}
            classeMensagem="max-w-[36rem] text-[15px] leading-relaxed"
            className="max-w-[36rem] space-y-5"
          >
            <Campo id="contato-nome" name="name" rotulo={t('campos.nome')} obrigatorio autoComplete="name" />
            <Campo id="contato-email" name="email" rotulo={t('campos.email')} tipo="email" obrigatorio autoComplete="email" />
            <Campo id="contato-telefone" name="phone" rotulo={t('campos.telefone')} tipo="tel" autoComplete="tel" />
            <CampoSelect
              id="contato-ajuda"
              name="topic"
              rotulo={t('campos.ajuda')}
              /* O texto visível continua traduzido; o que VIAJA é o valor
                 estável de `ASSUNTOS` (lib/formularios.ts). Antes daqui saía o
                 próprio rótulo traduzido, então a mesma intenção virava duas
                 strings e a coluna da planilha não agrupava. */
              opcoes={ASSUNTOS.map(({chave, valor}) => ({
                valor,
                rotulo: t(`campos.opcoes.${chave}`)
              }))}
            />
            <CampoArea id="contato-mensagem" name="message" rotulo={t('campos.mensagem')} />
            {/* O aviso de uso de dados que a PIPA exige (roteiro.md: "aviso
                pequeno acima do botão sobre uso dos dados, com link para a
                Política"). Escrito em 05/09/2026, DERIVADO das seções 4 e 5 da
                politica-privacidade.md e conferido contra ela verbatim.
                O QUE ELE NÃO DIZ, e a omissão é o ponto: nada de "não
                compartilhamos com terceiros". A seção 7 da Política lista CINCO
                categorias com quem os dados SÃO compartilhados, a começar pela
                própria Stonehaus. Aviso que promete mais do que a Política
                entrega é pior que aviso nenhum. Fica só o que a seção 4 afirma:
                não vendemos, não alugamos, não trocamos.
                Se a Política mudar, esta frase tem que ser reconferida.
                A voz é a do site (o Luís em primeira pessoa) e a substância é a
                da Política (que fala em "nós", a operação). É intencional. */}
            <p className="text-sm">
              {t.rich('avisoDados', {
                politica: (parte) => (
                  <Link href="/privacy-policy" className={`${linkNoTexto} alvo-44`}>
                    {parte}
                  </Link>
                )
              })}
            </p>
          </FormularioEnvio>
        </div>
      </section>

      {/* Bloco de identificação abaixo do formulário (roteiro.md) */}
      <section data-bloco="contato-identificacao" className="py-secao">
        <div data-camada="frente" className="conteudo text-[15px] leading-relaxed">
          <p className="font-semibold text-tinta">{rodape('nome')}</p>
          <p className="mt-1">{rodape('corretora')}</p>
          <p className="text-grafite/80">{rodape('licenca')}</p>
          <p className="mt-3 text-grafite/80">
            {rodape('endereco1')}, {rodape('endereco2')}
          </p>
          {/* Rótulo e número andam juntos, e número de telefone nunca se parte (revisão
              de palavras soltas, 24/09/2026: "+1 778 / 233 9906" em 320px). */}
          {/* O "·" vai no FIM do grupo de cima, para a linha seguinte nunca abrir com ele;
              o espaço entre os grupos é o único ponto onde a linha quebra. */}
          <p className="mt-3">
            <span className="whitespace-nowrap">
              <span className="text-grafite/70">{rodape('rotuloTelefone')}: </span>
              <a href={`tel:${TELEFONE_TEL}`} className="inline-flex min-h-11 items-center hover:text-tinta">
                {TELEFONE_DISPLAY}
              </a>
              <span className="ml-2 text-lapis" aria-hidden="true">
                ·
              </span>
            </span>{' '}
            <span className="ml-1 whitespace-nowrap">
            <span className="text-grafite/70">{rodape('rotuloWhatsapp')}: </span>
            <a
              href={linkWhatsApp('hero', locale)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center hover:text-tinta"
            >
              {WHATSAPP_DISPLAY}
            </a>
            </span>
          </p>
          <p className="mt-1">
            <span className="text-grafite/70">{rodape('rotuloEmail')}: </span>
            <a href={`mailto:${EMAIL_CONTATO}`} className="inline-flex min-h-11 items-center hover:text-tinta">{EMAIL_CONTATO}</a>
          </p>
          <p className="mt-3">
            <span className="whitespace-nowrap">
              {rodape('instagram')}
              <span className="ml-2 text-lapis" aria-hidden="true">
                ·
              </span>
            </span>{' '}
            <span className="ml-1 whitespace-nowrap">{rodape('tiktok')}</span>
          </p>
        </div>
      </section>
    </main>
  );
}

export default async function PaginaContato({
  params
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  setRequestLocale(locale);
  return <ConteudoContato locale={locale as Locale} />;
}
