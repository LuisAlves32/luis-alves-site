import {useTranslations} from 'next-intl';
import {Link} from '@/i18n/navigation';
import type {Locale} from '@/i18n/routing';
import {linkWhatsApp} from '@/lib/links';
import {botaoPrimario, botaoSecundario, Seta} from '@/components/ui/botoes';

const NBSP = ' ';

/**
 * Cola as duas primeiras palavras da ÚLTIMA frase com espaço inflexível.
 * Sem isso a palavra que ABRE o fecho ("Sem", "No") fica sozinha no fim da
 * linha de cima e a frase de fechamento aparece partida em duas.
 * MEDIDO: acontece entre 343px e 367px de medida de texto, que é a faixa de
 * um celular grande. `text-wrap: balance` conserta essa faixa mas estraga a
 * de 257 e 297px, então não serve; a ligação funciona nas duas pontas.
 * A copy em messages/ continua LIMPA: a transformação é de leitura, o mesmo
 * princípio do acabamento de órfãs do i18n/request.ts.
 */
function colarAberturaDoFecho(texto: string) {
  const corte = texto.lastIndexOf('. ');
  if (corte === -1) return texto;
  const palavras = texto.slice(corte + 2).split(' ');
  if (palavras.length < 3) return texto; // fecho curto demais, nada a colar
  return `${texto.slice(0, corte + 2)}${palavras[0]}${NBSP}${palavras.slice(1).join(' ')}`;
}

// Bloco 12 do roteiro.md: fechamento respirado, o único ponto da home com
// três CTAs juntos (decisão do cliente). WhatsApp primeiro.
// SEM MÍDIA (decisão do Gabriel, 01/09): a foto do Luís em plano aberto saiu.
// O fechamento é só palavra e ação, e o ar em volta é a composição. Por isso
// a seção é de UMA coluna: as medidas de 22ch e 60ch já seguram o texto na
// esquerda, e a direita fica vazia de propósito.
// Camadas: frente = headline, apoio e botões. A seção não tem mais fundo nem
// meio, então nenhum data-camada sobrou aqui.
export function CtaFinal({
  locale,
  ancoraMensagem,
  fechamento = true
}: {
  locale: Locale;
  /**
   * Âncora de um formulário NA PRÓPRIA PÁGINA (com o `#`), para onde o botão
   * "Enviar mensagem" passa a apontar em vez de ir para /contact. Serve à
   * página que já tem o formulário certo para aquele visitante: em /vender,
   * mandar quem vende para o formulário de contato é mandar para o formulário
   * errado. Sem o parâmetro, o fechamento continua o mesmo de sempre.
   */
  ancoraMensagem?: string;
  /** O EIXO da seção.
   *  true (padrão, e é a home): contêiner ESTREITO centrado (52rem). A FAQ e o
   *  CTA final fecham a home juntos num eixo óptico próprio, e ali estreitar
   *  funciona porque a home é longa e variada e o recuo marca o fecho.
   *  false: a seção mantém o eixo da PÁGINA (a `.conteudo` inteira, 1200px).
   *  MEDIDO em 05/09/2026 e é o motivo de o parâmetro existir: nas páginas
   *  internas, depois de seis blocos com o título em x=180, os dois últimos
   *  saltavam para x=364. O mesmo recuo que na home lê como fecho, ali lê como
   *  gabarito trocado no fim da página. */
  fechamento?: boolean;
}) {
  const t = useTranslations('ctaFinal');

  return (
    <section data-bloco="cta-final" className="py-secao">
      {/* DOIS MODOS, e nos dois este contêiner continua sendo o MESMO do FAQ
          logo acima, porque os dois trocam juntos: quem passa
          `fechamento={false}` numa página passa nos dois, e o par nunca se
          separa.
          fechamento=true (a home): 52rem. A `.conteudo` já centraliza por
          margin-inline, então estreitar põe o fechamento no mesmo eixo óptico
          da FAQ, e numa página longa e variada o recuo marca o fim.
          fechamento=false (as internas): o eixo da PÁGINA, 1200px. Ali o mesmo
          recuo se inverte: depois de seis blocos com o título em x=180, saltar
          para x=364 não lê como fecho, lê como gabarito trocado no fim.
          O QUE NÃO MUDA NOS DOIS MODOS: a MEDIDA do texto. As travas de 22ch no
          título e 60ch no apoio estão logo abaixo e são elas que seguram a
          linha confortável. O contêiner mexe no EIXO, nunca no comprimento da
          linha. O texto continua alinhado à esquerda, como no resto do site; o
          que centraliza é o bloco, não a linha. */}
      <div className={`conteudo${fechamento ? ' max-w-[52rem]' : ''}`}>
        <h2 className="max-w-[22ch]">{t('titulo')}</h2>
        <p className="mt-5 max-w-[60ch]">{colarAberturaDoFecho(t('apoio'))}</p>
        {/* "Os três botões em linha no desktop, empilhados no mobile"
            (roteiro.md, nota visual do bloco 12). A linha começa em sm, que é
            onde o botão deixa de ser de largura total; sem a coluna da foto
            sobra largura de sobra e não faz mais sentido esperar o xl.
            flex-wrap para o terceiro descer sozinho onde os três não couberem,
            em vez de espremer os rótulos. */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <a
            href={linkWhatsApp('hero', locale)}
            target="_blank"
            rel="noopener noreferrer"
            className={botaoPrimario}
          >
            {t('ctaWhatsapp')}
            <Seta className="group-hover:translate-x-[3px]" />
          </a>
          {/* TODO(agenda): o rótulo promete uma agenda online que o site NÃO
              tem em lugar nenhum. A ferramenta (Cal.com ou Calendly) pende de
              escolha do cliente; até lá o botão abre a página de contato, que é
              o caminho mais próximo que existe. Quando a agenda chegar, é este
              botão que ganha o destino real. Ver pendencias-luis-alves.md. */}
          <Link href="/contact" className={botaoSecundario}>
            {t('ctaAgenda')}
          </Link>
          {/* A forma de objeto {pathname, hash} é obrigatória aqui: com href em
              string o next-intl não encontra "/contact" no mapa de pathnames e
              a rota PT sairia /contact#... em vez de /contato#... */}
          {ancoraMensagem ? (
            <a href={ancoraMensagem} className={botaoSecundario}>
              {t('ctaMensagem')}
            </a>
          ) : (
            <Link
              href={{pathname: '/contact', hash: 'send-a-message'}}
              className={botaoSecundario}
            >
              {t('ctaMensagem')}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
