'use client';

import {useEffect, useState} from 'react';
import {useTranslations} from 'next-intl';
import type {Locale} from '@/i18n/routing';
import {linkWhatsApp} from '@/lib/links';

// Glifo oficial do WhatsApp (Simple Icons). A FORMA é a oficial e continua
// intocada: é ela que faz a pessoa reconhecer o canal a um relance. A COR não
// é mais a da plataforma. O verde saiu do site em 03/09 por decisão de direção,
// porque era a única cor aqui que não vinha da marca e destoava da paleta
// inteira; o glifo herda a cor do botão por currentColor. O valor exato que foi
// aposentado está registrado na tabela de primitivos do design.md, e não é
// repetido aqui de propósito: assim uma busca pelo hex no build continua
// valendo como prova de que nenhum verde ficou.
function GlifoWhatsApp({className = ''}: {className?: string}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

// Botão flutuante de WhatsApp: todas as páginas, canto inferior direito,
// safe-area no mobile.
//
// A REGRA (movimento.md: "aparece após a primeira dobra"; decisão do Gabriel em
// 30/08: na home ele não pode existir enquanto a pessoa está na hero):
// o botão fica fora enquanto uma ABERTURA DE TELA CHEIA estiver no ar, e entra
// quando ela passa. Onde a abertura não ocupa a tela inteira (páginas internas,
// 404) não há dobra a proteger e ele está lá desde o começo, como antes.
// Enquanto escondido ele é inerte de verdade (sem clique, sem tab, sem leitor
// de tela), não só invisível.
//
// Bônus medido: no celular o bloco do ato 2 da hero é ancorado no rodapé, e o
// botão cobria 47px da linha de cidades (390x844). Com esta regra ele não
// divide mais a tela com a hero.
export function WhatsappFlutuante({locale}: {locale: Locale}) {
  const t = useTranslations('flutuante');
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    const alvo =
      document.querySelector('main > *') ?? document.querySelector('main') ?? document.body;

    // Uma observação só, sem ouvir rolagem: o observador acorda no cruzamento
    // e dorme no resto.
    const observador = new IntersectionObserver(
      ([entrada]) => {
        // a seção saiu por cima da tela: passamos dela
        const passou = !entrada.isIntersecting && entrada.boundingClientRect.top < 0;
        // abertura que não ocupa a tela inteira (páginas internas, 404): não há
        // dobra a proteger, então o botão fica desde o começo
        const semDobra = entrada.boundingClientRect.height < window.innerHeight;
        setVisivel(passou || semDobra);
      },
      {threshold: 0}
    );
    observador.observe(alvo);
    return () => observador.disconnect();
  }, []);

  return (
    <a
      href={linkWhatsApp('hero', locale)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t('rotulo')}
      aria-hidden={visivel ? undefined : true}
      tabIndex={visivel ? undefined : -1}
      // O visual mora na .flutuante-zap do globals.css: raio 16, sombra da
      // variante mídia, a cota em Avanço na aresta de baixo e o anel de foco
      // em Tinta (que substitui o foco padrão do projeto de propósito, ver o
      // comentário na classe). Aqui ficam só posição, tamanho e transição.
      // overflow-hidden é o que faz o raio recortar as pontas da cota.
      className={`flutuante-zap fixed right-4 bottom-[calc(16px+env(safe-area-inset-bottom))] z-40 flex size-14 items-center justify-center overflow-hidden bg-papel text-tinta transition-[opacity,transform] duration-300 ease-out hover:scale-105 active:scale-[0.98] sm:right-6 sm:bottom-6 ${
        visivel
          ? 'translate-y-0 opacity-100'
          : 'pointer-events-none translate-y-3 opacity-0'
      }`}
    >
      <GlifoWhatsApp className="size-7" />
    </a>
  );
}
