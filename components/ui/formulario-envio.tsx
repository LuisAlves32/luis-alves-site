'use client';

/**
 * O ENVIO DOS CINCO FORMULÁRIOS, NUM LUGAR SÓ.
 *
 * Este componente envolve o `<form>` e concentra TUDO que é comportamento:
 * estado, campo-armadilha, carimbo de tempo, montagem do corpo, envio, erro e
 * confirmação. Os cinco pontos de captura passam a ser marcação mais uma
 * chamada daqui.
 *
 * O MOTIVO é o mesmo do contrato de campos (`lib/formularios.ts`): cinco
 * implementações divergem, e quando divergem é sempre EM SILÊNCIO. Uma que
 * esquecesse o `iniciadoEm` derrubaria todo lead dela no piso de tempo da
 * rota, e ninguém descobriria até alguém abrir a planilha.
 *
 * A CHAMADA É RELATIVA, `fetch('/api/enviar')`, e nunca montada a partir de
 * NEXT_PUBLIC_SITE_URL nem de qualquer base absoluta. Medido em 04/09: um POST
 * que atravessa um redirecionamento 308 PERDE O CORPO em vários clientes, e o
 * pedido some sem erro visível. Caminho relativo nunca atravessa 308, em
 * nenhum ambiente, incluindo os deploys de preview, que têm host diferente do
 * de produção.
 */

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode
} from 'react';
import {useLocale, useTranslations} from 'next-intl';
import {useRouter} from '@/i18n/navigation';
import type {AppPathname, Locale} from '@/i18n/routing';
import {
  CAMPO_ARMADILHA,
  FORMULARIOS,
  type CampoDeFormulario
} from '@/lib/formularios';
import {EVENTOS, marca} from '@/lib/estatistica';
import {
  EMAIL_CONTATO,
  WHATSAPP_DISPLAY,
  linkWhatsApp,
  type OrigemWhatsApp
} from '@/lib/links';

type Estado = 'parado' | 'enviando' | 'sucesso' | 'erro';

/**
 * `campos` é falha DA PESSOA, e dá para consertar ali mesmo na tela.
 * `sistema` é falha NOSSA, e é a única que abre a saída de emergência.
 */
type Falha = {origem: 'campos' | 'sistema'; selo: number};

type Sucesso =
  | {modo: 'redireciona'; para: AppPathname}
  | {modo: 'mensagem'; texto: string};

type Botao = {
  rotulo: string;
  className: string;
  /** Envelope opcional do botão, para o formulário que vive numa grade. */
  envolucro?: string;
};

type Base = {
  sucesso: Sucesso;
  botao: Botao;
  /** Os campos. Continuam onde estão, na marcação de cada página. */
  children: ReactNode;
  /** O que vem DEPOIS do botão (microcopy da landing, caixa da home). */
  rodape?: ReactNode;
  id?: string;
  className?: string;
  classeMensagem?: string;
  origemWhatsApp?: OrigemWhatsApp;
  /**
   * Âncora deste formulário na página, SEM o `#`. Entra no fim da `origem`.
   *
   * Existe porque a `/selling` tem DOIS formulários iguais, um no meio e outro
   * no fim, e sem isto os dois gravavam `/selling`: não dava para saber qual
   * posição converte, que é justamente o que permitiria melhorar a página.
   *
   * Use a âncora que a página JÁ tem (a que os links internos usam), para a
   * `origem` gravada ser um endereço que leva de volta ao formulário exato.
   */
  ancora?: string;
};

/**
 * `consentTexto` é OBRIGATÓRIO no tipo `guia` e proibido nos outros, porque só
 * o guia tem caixa de consentimento. O tipo garante isso em tempo de
 * compilação: esquecer a frase aceita é defeito jurídico, não de interface.
 */
type Props = Base &
  (
    | {tipo: 'guia'; consentTexto: string}
    | {tipo: 'contato' | 'avaliacao'; consentTexto?: never}
  );

export function FormularioEnvio({
  tipo,
  sucesso,
  botao,
  children,
  rodape,
  id,
  className,
  classeMensagem,
  consentTexto,
  origemWhatsApp = 'hero',
  ancora
}: Props) {
  const t = useTranslations('formulario');
  const locale = useLocale() as Locale;
  const router = useRouter();

  const [estado, setEstado] = useState<Estado>('parado');
  const [falha, setFalha] = useState<Falha | null>(null);

  /**
   * O CARIMBO DE ABERTURA, uma vez só, na montagem.
   *
   * `useState(() => Date.now())` e NÃO `Date.now()` solto no corpo do
   * componente: o corpo roda a cada render, e o valor viraria "agora" no
   * clique. Aí o piso de tempo da rota (4 s) passaria a descartar EM SILÊNCIO
   * justamente quem preencheu com calma, que é gente de verdade.
   */
  const [iniciadoEm] = useState(() => Date.now());

  const mensagemRef = useRef<HTMLDivElement | null>(null);

  /**
   * O FREIO DO SEGUNDO CLIQUE mora numa ref, não no estado: `aria-disabled`
   * não impede ativação nenhuma (de propósito, para o botão continuar
   * alcançável por leitor de tela), e dois cliques rápidos, ou um Enter dentro
   * de um campo, chegam aqui antes de qualquer re-render. Envio duplicado vira
   * LINHA DUPLICADA na planilha do cliente.
   */
  const ocupadoRef = useRef(false);

  // Enquanto o navegador ainda não trocou de página, o botão continua ocupado:
  // a rota já gravou, e um segundo envio duplicaria a linha.
  const aguardandoRedirecionamento =
    estado === 'sucesso' && sucesso.modo === 'redireciona';
  const ocupado = estado === 'enviando' || aguardandoRedirecionamento;
  const formularioVisivel = !(
    estado === 'sucesso' && sucesso.modo === 'mensagem'
  );

  /**
   * Foco na mensagem SÓ quando a falha é nossa. Quando falta um campo o foco
   * vai para o campo (ver `marcarInvalidos`): quem esqueceu o e-mail precisa
   * do cursor no e-mail, não de um aviso onde não dá para digitar. Nos dois
   * casos a região viva anuncia, porque ela existe na árvore desde o primeiro
   * render.
   */
  useEffect(() => {
    if (estado === 'erro' && falha?.origem === 'sistema') {
      mensagemRef.current?.focus();
    }
  }, [estado, falha]);

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (ocupadoRef.current) return;

    const form = evento.currentTarget;
    ocupadoRef.current = true;
    setEstado('enviando');
    setFalha(null);
    limparInvalidos(form);

    const dados = new FormData(form);
    const corpo: Record<string, unknown> = {
      formulario: tipo,
      idioma: locale,
      // O CAMINHO ATUAL mais a âncora deste formulário, lidos do navegador.
      // Aqui é só rótulo de origem na planilha, mas a regra da chamada relativa
      // vale para o arquivo inteiro: nada de base absoluta em lugar nenhum.
      origem: window.location.pathname + (ancora ? `#${ancora}` : ''),
      /**
       * A CAMPANHA: a query da página no momento do envio, CRUA, sem o "?".
       *
       * Crua de propósito, e não uma lista de `utm_*` escolhida a dedo: assim
       * ela pega utm_source, utm_medium, utm_campaign, gclid, fbclid e o que a
       * próxima rede de anúncio inventar, sem ninguém ter que adivinhar hoje a
       * lista de amanhã. O teto de 500 e o corte ficam na rota.
       *
       * SEJA HONESTO SOBRE O LIMITE DISTO, e não é pequeno: isto captura a
       * query da PÁGINA DO FORMULÁRIO. Quem chega com UTM na home e navega até
       * /contact PERDE a marcação, porque a query não sobrevive à navegação, e
       * a linha vai para a planilha com a campanha vazia. Atribuição de
       * PRIMEIRO TOQUE, que guarda a origem na chegada ao site e a usa no
       * envio, é o Passe 4 e NÃO está feita. Isto aqui resolve o caso do
       * anúncio que cai direto na landing, que é o mais comum, e só ele.
       */
      campanha: window.location.search.replace(/^\?/, ''),
      iniciadoEm,
      // A armadilha sai do próprio <form>, junto com o resto.
      [CAMPO_ARMADILHA]: textoDoCampo(dados.get(CAMPO_ARMADILHA))
    };

    for (const campo of FORMULARIOS[tipo] as readonly CampoDeFormulario[]) {
      if (campo === 'consent') {
        // Caixa não marcada simplesmente NÃO aparece no FormData.
        corpo.consent = dados.get('consent') !== null;
        continue;
      }
      if (campo === 'consentTexto') {
        // A PROVA DO QUE FOI ACEITO, verbatim da MESMA fonte que desenhou o
        // rótulo na tela (a chave de i18n do idioma ativo), nunca de uma
        // constante paralela que envelhece sozinha.
        // O NBSP volta a ser espaço normal: ele é acabamento tipográfico posto
        // na leitura por `i18n/request.ts`, não faz parte da frase que a
        // pessoa aceitou, e numa célula de planilha vira lixo invisível.
        corpo.consentTexto = (consentTexto ?? '').replace(/\u00A0/g, ' ');
        continue;
      }
      corpo[campo] = textoDoCampo(dados.get(campo));
    }

    try {
      const resposta = await fetch('/api/enviar', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(corpo)
      });

      if (resposta.ok) {
        // O EVENTO DE CONVERSÃO é AQUI, com a rota já confirmando, e NUNCA na
        // página de obrigado (roteiro.md: quem fecha a aba antes do
        // redirecionamento também converteu). `marca` é muda sem o script: o
        // envio nunca depende da estatística.
        marca(EVENTOS.formulario, {
          tipo,
          pagina: window.location.pathname + (ancora ? `#${ancora}` : '')
        });
        if (sucesso.modo === 'redireciona') {
          setEstado('sucesso');
          router.push(sucesso.para);
          return;
        }
        ocupadoRef.current = false;
        setEstado('sucesso');
        return;
      }

      const detalhe = await lerErro(resposta);
      if (resposta.status === 400 && detalhe?.erro === 'campos-obrigatorios') {
        marcarInvalidos(form, detalhe.campos ?? []);
        ocupadoRef.current = false;
        setEstado('erro');
        setFalha({origem: 'campos', selo: Date.now()});
        return;
      }

      ocupadoRef.current = false;
      setEstado('erro');
      setFalha({origem: 'sistema', selo: Date.now()});
    } catch {
      // Rede fora, aba suspensa, bloqueador de conteúdo. A pessoa não tem como
      // saber o que houve, e a saída de emergência existe para exatamente isto.
      ocupadoRef.current = false;
      setEstado('erro');
      setFalha({origem: 'sistema', selo: Date.now()});
    }
  }

  const acao = (
    <>
      <button
        type="submit"
        // NUNCA o `disabled` cru: ele tira o botão da ordem de foco, e quem usa
        // leitor de tela perde de vista o elemento que acabou de acionar. Quem
        // impede o segundo envio é `ocupadoRef`, não o atributo.
        aria-disabled={ocupado || undefined}
        aria-busy={ocupado || undefined}
        className={`${botao.className}${ocupado ? ' cursor-wait' : ''}`}
      >
        {ocupado ? t('enviando') : botao.rotulo}
      </button>
      {rodape}
    </>
  );

  return (
    <>
      {formularioVisivel ? (
        <form id={id} className={className} noValidate onSubmit={enviar}>
          {children}
          <CampoArmadilha />
          {botao.envolucro ? (
            <div className={botao.envolucro}>{acao}</div>
          ) : (
            acao
          )}
        </form>
      ) : null}

      {/* A REGIÃO VIVA existe desde o primeiro render, SEMPRE, mesmo vazia.
          Container criado na hora do erro não é anunciado: o leitor de tela
          precisa já estar observando o nó quando o texto entra nele. */}
      <div
        role="status"
        aria-live="polite"
        className={classeMensagem ?? 'text-[15px] leading-relaxed'}
      >
        {estado === 'sucesso' && sucesso.modo === 'mensagem' ? (
          <p>{sucesso.texto}</p>
        ) : null}

        {estado === 'erro' ? (
          <div
            ref={mensagemRef}
            tabIndex={-1}
            className="mt-4 focus:outline-none"
          >
            <p>{falha?.origem === 'campos' ? t('erroCampos') : t('erroSistema')}</p>

            {/* A SAÍDA DE EMERGÊNCIA. Só quando a falha é NOSSA: mandar para o
                WhatsApp quem apenas esqueceu o e-mail é confundir, não
                socorrer. Quem preencheu um formulário de imóvel tem intenção
                alta, e perder essa pessoa por uma falha nossa de
                infraestrutura é o pior desfecho possível do sistema inteiro. */}
            {falha?.origem === 'sistema' ? (
              <p className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1">
                <a
                  href={linkWhatsApp(origemWhatsApp, locale)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center underline underline-offset-4"
                >
                  {WHATSAPP_DISPLAY}
                </a>
                <a
                  href={`mailto:${EMAIL_CONTATO}`}
                  className="inline-flex min-h-11 items-center break-all underline underline-offset-4"
                >
                  {EMAIL_CONTATO}
                </a>
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </>
  );
}

/**
 * O CAMPO-ARMADILHA (honeypot), com o nome que vem de `lib/formularios.ts`.
 *
 * Escondido POR POSICIONAMENTO, e nunca com `display:none` nem `hidden`:
 * muitos robôs pulam campo com display:none, e aqui o objetivo é o oposto, que
 * ele seja preenchido. Robô preenche tudo que encontra; a rota vê o campo
 * cheio, devolve 200 e não grava nada.
 *
 * As três travas para gente de verdade nunca esbarrar nele:
 *   . `tabIndex={-1}`      fora da ordem de foco do teclado
 *   . `aria-hidden`        fora da árvore de acessibilidade (o envelope todo)
 *   . `autoComplete="off"` o gerenciador de senhas não tenta preencher
 *
 * A caixa é de 1px e fica a 9999px À ESQUERDA: fora da tela sem esticar a
 * página para lado nenhum (área rolável em LTR só cresce para a direita).
 */
function CampoArmadilha() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        left: '-9999px',
        width: '1px',
        height: '1px',
        overflow: 'hidden'
      }}
    >
      <label htmlFor={`armadilha-${CAMPO_ARMADILHA}`} aria-hidden="true">
        Company
      </label>
      <input
        id={`armadilha-${CAMPO_ARMADILHA}`}
        name={CAMPO_ARMADILHA}
        type="text"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        defaultValue=""
      />
    </div>
  );
}

function textoDoCampo(valor: FormDataEntryValue | null): string {
  return typeof valor === 'string' ? valor : '';
}

async function lerErro(
  resposta: Response
): Promise<{erro?: string; campos?: string[]} | null> {
  try {
    return (await resposta.json()) as {erro?: string; campos?: string[]};
  } catch {
    return null;
  }
}

/** `aria-invalid` nos campos que a rota recusou, e o foco no primeiro deles. */
function marcarInvalidos(form: HTMLFormElement, campos: string[]) {
  let primeiro: HTMLElement | null = null;
  for (const campo of campos) {
    const alvo = form.querySelector<HTMLElement>(`[name="${campo}"]`);
    if (!alvo) continue;
    alvo.setAttribute('aria-invalid', 'true');
    primeiro ??= alvo;
  }
  primeiro?.focus();
}

function limparInvalidos(form: HTMLFormElement) {
  for (const alvo of form.querySelectorAll('[aria-invalid]')) {
    alvo.removeAttribute('aria-invalid');
  }
}
