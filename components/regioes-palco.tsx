'use client';

import dynamic from 'next/dynamic';
import {useEffect, useRef, useState} from 'react';

// Palco das 12 cidades (bloco 10, parte pós-expansão; decisão 29/08).
// Este arquivo é a CASCA leve: rende o pôster estático da primeira cidade
// (SSR, sem JS, SEO) e só baixa a cena pesada quando a seção se APROXIMA da
// viewport (IntersectionObserver, rootMargin 600px). O corte do dynamic
// import mora aqui (regioes-palco-cena é um chunk próprio, ssr false); o
// three.js é um SEGUNDO corte, importado dentro da cena só quando WebGL vai
// mesmo rodar (reduced-motion nem baixa o three).
const CenaPalco = dynamic(() => import('./regioes-palco-cena'), {ssr: false});

export type CidadePalco = {nome: string; slug: string};
export type RotulosPalco = {pausar: string; retomar: string};

export function fotoDaCidade(slug: string, mobile: boolean) {
  return `/cidades/cidade-${slug}${mobile ? '-mobile' : ''}.webp`;
}

// Véus de tinta para contraste sobre as manhãs claras (sem backdrop-filter:
// vidro sobre foto é proibido). Canto inferior esquerdo até ~55% (pico 0.9)
// e borda direita até ~40% (pico 0.65).
export function VeusDoPalco() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(45deg, color-mix(in srgb, var(--cor-tinta) 90%, transparent), transparent 55%)'
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to left, color-mix(in srgb, var(--cor-tinta) 65%, transparent), transparent 40%)'
        }}
      />
    </div>
  );
}

export function RegioesPalco({
  cidades,
  rotulos,
  rotuloSecao
}: {
  cidades: CidadePalco[];
  rotulos: RotulosPalco;
  rotuloSecao: string;
}) {
  const raizRef = useRef<HTMLDivElement | null>(null);
  const [perto, setPerto] = useState(false);

  useEffect(() => {
    const raiz = raizRef.current;
    if (!raiz) return;
    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (entrada.isIntersecting) {
          setPerto(true);
          observador.disconnect();
        }
      },
      {rootMargin: '600px'}
    );
    observador.observe(raiz);
    return () => observador.disconnect();
  }, []);

  const primeira = cidades[0];

  return (
    <div ref={raizRef} className="relative h-[100svh] w-full overflow-hidden bg-tinta">
      {perto ? (
        <CenaPalco cidades={cidades} rotulos={rotulos} rotuloSecao={rotuloSecao} />
      ) : (
        // Pôster estático da primeira cidade: o que o SSR, o no-JS e o
        // primeiro paint veem antes de a cena chegar.
        <div className="absolute inset-0">
          <picture>
            <source media="(max-width: 767px)" srcSet={fotoDaCidade(primeira.slug, true)} />
            <img
              src={fotoDaCidade(primeira.slug, false)}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
              loading="lazy"
              decoding="async"
            />
          </picture>
          <VeusDoPalco />
          <div className="absolute right-6 top-6 text-sm tabular-nums text-white/90 lg:right-10">
            {`01 / ${String(cidades.length).padStart(2, '0')}`}
          </div>
          <div className="absolute bottom-8 left-6 max-w-[calc(100%-150px)] lg:bottom-12 lg:left-12">
            <div className="text-[clamp(2.125rem,6.5vw,4.5rem)] font-semibold leading-[1.05] tracking-[-0.02em] text-white">
              {primeira.nome}
            </div>
            <span aria-hidden="true" className="mt-4 block h-[3px] w-16 rounded-full bg-avanco" />
          </div>
          <ul className="absolute right-4 top-1/2 -translate-y-1/2 space-y-1 text-right lg:right-10">
            {cidades.map((cidade, i) => (
              <li
                key={cidade.slug}
                className={`text-[12px] font-semibold uppercase tracking-[0.14em] ${
                  i === 0 ? 'text-white' : 'text-white/60'
                }`}
              >
                {cidade.nome}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
