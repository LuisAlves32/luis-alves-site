'use client';

import {useEffect, useRef, useState} from 'react';
import {useTranslations} from 'next-intl';
import {PortasDosCaminhos} from '@/components/portas-dos-caminhos';

// Bloco 2 do roteiro.md, sobre Céu. Passe 2 (31/08): saíram os três cards
// brancos com ícone linear (chave, placa, casa) e entrou a GRADE DE PORTAS
// fotográficas do Fluid Expanding Grid (21st.dev 10467). Decisão de direção
// registrada em pendencias-luis-alves.md: a fotografia vira o próprio signo,
// no lugar de metáfora de biblioteca de ícones.
//
// Camadas do movimento.md: fundo = cor da seção (a respiração global cuida
// disso no Passe 3), meio = as portas, frente = título.
//
// A margem negativa de topo é FRONTEIRA POR POSSE (design.md): a seção
// transborda sobre a borda final da hero, nunca emenda com ela.
export function TresCaminhos() {
  const t = useTranslations('caminhos');
  const secao = useRef<HTMLElement>(null);
  const [visivel, setVisivel] = useState(false);

  // Entrada da seção, uma vez só. IntersectionObserver, nunca listener de
  // rolagem. Sob prefers-reduced-motion o CSS já força o estado FINAL, então
  // não faz diferença o observer chegar ou não.
  useEffect(() => {
    const alvo = secao.current;
    if (!alvo) return;
    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (entrada.isIntersecting) {
          setVisivel(true);
          observador.disconnect();
        }
      },
      {threshold: 0.18}
    );
    observador.observe(alvo);
    return () => observador.disconnect();
  }, []);

  return (
    <section
      ref={secao}
      data-bloco="tres-caminhos"
      // Esta seção pinta Céu pelo CSS (.portas-secao no globals.css), e não por
      // classe do Tailwind, e foi por isso que ela escapou da varredura por
      // `bg-` na hora de listar quem participa da respiração. Participa como as
      // outras; o background do .portas-secao é o estado sem JS.
      data-fundo="ceu"
      className={`portas-secao ${visivel ? 'esta-visivel' : ''}`}
    >
      <div className="portas-wrap">
        <div data-camada="frente" className="portas-cabecalho">
          <h2 className="portas-titulo">
            {t('titulo')
              .split('|')
              .map((parte, i) =>
                i % 2 === 1 ? (
                  <em key={i} className="ancora">
                    {parte}
                  </em>
                ) : (
                  <span key={i}>{parte}</span>
                )
              )}
          </h2>
          {/* Só no celular: no desktop o hover já ensina */}
          <p className="portas-dica">{t('dica')}</p>
        </div>

        {/* A cota que se traça (caligrafia 1 do movimento.md), aqui na
            versão silenciosa: a linha de 1px que organiza o documento. */}
        <div className="portas-regua" data-cota aria-hidden="true" />

        <div data-camada="meio" className="portas-palco">
          <PortasDosCaminhos />
        </div>
      </div>
    </section>
  );
}
