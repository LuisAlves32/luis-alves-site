import {useTranslations} from 'next-intl';
import {AssinaturaTaOnline} from '@/components/ui/AssinaturaTaOnline';
import {Link} from '@/i18n/navigation';
import type {Locale} from '@/i18n/routing';
import {
  EMAIL_CONTATO,
  INSTAGRAM_URL,
  linkWhatsApp,
  TELEFONE_DISPLAY,
  TELEFONE_TEL,
  TIKTOK_URL,
  WHATSAPP_DISPLAY
} from '@/lib/links';

const NAVEGACAO = [
  {href: '/buying', chave: 'buying'},
  {href: '/selling', chave: 'selling'},
  {href: '/presales', chave: 'presales'},
  {href: '/about', chave: 'about'},
  {href: '/contact', chave: 'contact'}
] as const;

// Bloco 13 do roteiro.md: rodapé em Tinta, quatro colunas, compliance fixo
// (Stonehaus Realty Corp. legível, Licence #190001, Privacy Policy).
// Termina limpo na linha legal (aceite do Passe 1, design.md: o wordmark
// gigante de encerramento foi cortado e não volta).
export function Footer({locale}: {locale: Locale}) {
  const t = useTranslations('rodape');
  const nav = useTranslations('nav');
  const notas = useTranslations('notas');

  const linkClaro =
    'transition-colors duration-200 hover:text-white focus-visible:shadow-[0_3px_0_0_var(--cor-papel)]';
  // Links de LISTA (contato, navegação, redes): 44px de altura, o alvo de toque mínimo. As
  // listas perderam o espaço entre itens, então o ritmo sobe só de 34 para 44px por linha
  // (portão de 24/09/2026), e o `-my-2.5` das listas devolve o alinhamento pelo topo com a
  // primeira coluna. O link dentro de frase (Privacy Policy) fica com o de cima.
  const linkDeLista = `${linkClaro} inline-flex min-h-11 min-w-11 items-center whitespace-nowrap`;

  return (
    <footer data-bloco="rodape" className="bg-tinta text-papel">
      {/* Abaixo de 768px, a folga inferior reserva a faixa do botão flutuante
          (56px + offset + safe-area): a última linha do rodapé nunca fica
          embaixo do botão (design.md). A partir de 768px a folga é de 96px:
          com a assinatura da agência na última linha, os contatos dela ficam
          na ponta direita, onde o botão pousa (56px a 24px da borda), e com
          os 40px de antes o botão cobria os dois links até uns 1360px de tela
          (medido em 17/09/2026). */}
      <div
        data-camada="frente"
        className="conteudo pb-[calc(env(safe-area-inset-bottom)+7rem)] pt-16 md:pb-24 lg:pt-20"
      >
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="text-[15px] leading-relaxed">
            <p className="font-semibold text-white">{t('nome')}</p>
            {/* Compliance: Stonehaus Realty Corp. legível, nunca em corpo minúsculo */}
            <p className="mt-1 text-[15px]">{t('corretora')}</p>
            <p className="mt-1 text-papel/75">{t('licenca')}</p>
            <p className="mt-4 text-papel/75">
              {t('endereco1')}
              <br />
              {t('endereco2')}
            </p>
            {/* TODO: logo oficial da Stonehaus, arquivos PEDIDOS ao cliente
                (ver pendencias-luis-alves.md). O uso é obrigatoriamente SEM
                alteração de cor, proporção ou recorte.

                A CAIXA DE PLACEHOLDER QUE MORAVA AQUI SAIU EM 05/09/2026, e o
                motivo é de direção: ela estava NO AR e foi o que o cliente
                fotografou e apontou. Caixa vazia rotulada é pior que ausência.
                Ausência ninguém percebe; caixa vazia anuncia que faltou alguém
                terminar. Quando a logo chegar, ela entra aqui, e não volta
                placeholder nenhum enquanto isso.

                NÃO É BLOQUEIO LEGAL, e vale estar escrito para ninguém tratar
                como urgência de compliance: o que a BCFSA exige é o NOME da
                corretora legível, e esta coluna já traz "Stonehaus Realty Corp."
                em corpo legível mais o número da licença. O site está em
                conformidade hoje. A logo é política de marca da corretora. */}
          </div>

          <ul className="-my-2.5 text-[15px]">
            <li>
              <span className="text-papel/60">{t('rotuloTelefone')}: </span>
              <a href={`tel:${TELEFONE_TEL}`} className={linkDeLista}>
                {TELEFONE_DISPLAY}
              </a>
            </li>
            <li>
              <span className="text-papel/60">{t('rotuloWhatsapp')}: </span>
              <a
                href={linkWhatsApp('hero', locale)}
                target="_blank"
                rel="noopener noreferrer"
                className={linkDeLista}
              >
                {WHATSAPP_DISPLAY}
              </a>
            </li>
            <li>
              <span className="text-papel/60">{t('rotuloEmail')}: </span>
              <a href={`mailto:${EMAIL_CONTATO}`} className={linkDeLista}>
                {EMAIL_CONTATO}
              </a>
            </li>
          </ul>

          <nav aria-label={nav('menu')}>
            <ul className="-my-2.5 text-[15px]">
              {NAVEGACAO.map((item) => (
                <li key={item.chave}>
                  <Link href={item.href} className={linkDeLista}>
                    {nav(item.chave)}
                  </Link>
                </li>
              ))}
              {/* O blog (Second Opinion, 24/09/2026). No rodapé por enquanto: entrar no
                  menu de cima muda o "Menu fixo" do design.md e espera o OK do Gabriel. */}
              <li>
                <Link href="/notes" className={linkDeLista}>
                  {notas('rodapeLink')}
                </Link>
              </li>
            </ul>
          </nav>

          <ul className="-my-2.5 text-[15px]">
            <li>
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={linkDeLista}
              >
                {t('instagram')}
              </a>
            </li>
            <li>
              <a
                href={TIKTOK_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={linkDeLista}
              >
                {t('tiktok')}
              </a>
            </li>
          </ul>
        </div>

        <div className="mt-14 border-t border-papel/15 pt-6 text-sm leading-relaxed text-papel/60">
          {/* Quebra controlada, copy verbatim: "Privacy Policy ·" e o
              copyright são unidades inquebráveis; a linha só quebra entre
              elas, nunca em órfã. */}
          <p className="max-w-[90ch]">
            {t('legal')}{' '}
            <span aria-hidden="true">·</span>{' '}
            <span className="whitespace-nowrap">
              <Link
                href="/privacy-policy"
                className={`${linkClaro} underline decoration-papel/30 underline-offset-4`}
              >
                {t('privacidade')}
              </Link>{' '}
              <span aria-hidden="true">·</span>
            </span>{' '}
            <span className="whitespace-nowrap">{t('copyright')}</span>
          </p>
        </div>

        {/* A ASSINATURA DA TÁ ONLINE (skill assinatura-ta-online, versão 2
            aprovada; pedido do Gabriel em 17/09/2026), cópia exata do acervo em
            components/ui/AssinaturaTaOnline.tsx. É a última linha do rodapé,
            depois de tudo que é do Luis, e não tem fundo próprio: herda o Papel
            a 75%, o tom da licença e do endereço, que dá 8:1 no Tinta sem
            competir com o conteúdo do corretor. O movimento é dela (acende uma
            vez ao entrar na tela): o `data-entrada` deixa a câmera de fora, como
            no bloco 7. */}
        <div
          data-entrada="assinatura"
          className="mt-8 border-t border-papel/10 pt-4 text-papel/75"
        >
          <AssinaturaTaOnline idioma={locale} />
        </div>
      </div>
    </footer>
  );
}
