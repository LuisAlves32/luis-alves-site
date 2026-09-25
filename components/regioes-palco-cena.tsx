// Página original (21st.dev): https://21st.dev/@hardikkashiyani123456788/components/lumina-interactive-list
// Licença: sem licença declarada pelo autor; usado com crédito, conforme os termos do 21st.dev. Créditos completos em CREDITOS.md.
'use client';

import {useEffect, useRef, useState} from 'react';
import {gsap} from 'gsap';
import type {
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  Texture,
  WebGLRenderer
} from 'three';
import {
  fotoDaCidade,
  VeusDoPalco,
  type CidadePalco,
  type RotulosPalco
} from './regioes-palco';

// Origem: 21st.dev, "lumina-interactive-list" (demo 9952), reescrita FIEL de
// produção aprovada pelo diretor (29/08) para o palco das 12 cidades.
// O original é demo: GSAP e Three por <script> de CDN, canvas do tamanho da
// janela, getElementById com ids globais e 6 slides fixos. Esta reescrita
// preserva o COMPORTAMENTO: shaders e uniforms copiados inteiros (efeito
// glass, preset Default), transição de 2.5s em power2.inOut, autoplay de 5s
// com a barra de progresso enchendo, bloqueio isTransitioning, contador
// 01/NN, entrada do nome POR LETRA com as 6 variações ciclando (idx % 6) e
// pausa com a aba oculta. Posse do movimento: GSAP daqui de dentro
// (data-owner="catalogo" na seção; o Passe 3 não toca nos elementos).
//
// O AUTOPLAY é a ÚNICA exceção de autoplay do site (ressalva de 29/08 nos
// .md), com as travas do aceite: só roda com a seção >=50% visível E a aba
// visível; interação troca na hora e reinicia o ciclo; botão pausar/retomar
// (WCAG 2.2.2); com prefers-reduced-motion não há autoplay nem canvas: a
// foto ativa troca por corte seco e a navegação manual fica completa.
// Nenhum handler de wheel: a rolagem da página nunca é presa.
// Produção: three.js importado dinamicamente SÓ aqui (reduced-motion nem
// baixa o three); canvas dimensionado pelo CONTAINER via ResizeObserver;
// pixelRatio <=2 desktop e <=1.5 mobile; habilita com 2 texturas e carrega o
// resto em fundo; rAF pausado fora da viewport; dispose completo no unmount.

const DURACAO_TRANSICAO = 2.5;
const DURACAO_SLIDE_MS = 5000;
const PASSO_PROGRESSO_MS = 50;

// Shaders do original, inteiros (o glass é o efeito real; os demais são os
// stubs do próprio original, mantidos junto com todos os uniforms).
const VERTEX_SHADER = `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const FRAGMENT_SHADER = `
    uniform sampler2D uTexture1, uTexture2;
    uniform float uProgress;
    uniform vec2 uResolution, uTexture1Size, uTexture2Size;
    uniform int uEffectType;
    uniform float uGlobalIntensity, uSpeedMultiplier, uDistortionStrength, uColorEnhancement;
    uniform float uGlassRefractionStrength, uGlassChromaticAberration, uGlassBubbleClarity, uGlassEdgeGlow, uGlassLiquidFlow;
    uniform float uFrostIntensity, uFrostCrystalSize, uFrostIceCoverage, uFrostTemperature, uFrostTexture;
    uniform float uRippleFrequency, uRippleAmplitude, uRippleWaveSpeed, uRippleRippleCount, uRippleDecay;
    uniform float uPlasmaIntensity, uPlasmaSpeed, uPlasmaEnergyIntensity, uPlasmaContrastBoost, uPlasmaTurbulence;
    uniform float uTimeshiftDistortion, uTimeshiftBlur, uTimeshiftFlow, uTimeshiftChromatic, uTimeshiftTurbulence;
    varying vec2 vUv;

    vec2 getCoverUV(vec2 uv, vec2 textureSize) {
        vec2 s = uResolution / textureSize;
        float scale = max(s.x, s.y);
        vec2 scaledSize = textureSize * scale;
        vec2 offset = (uResolution - scaledSize) * 0.5;
        return (uv * uResolution - offset) / scaledSize;
    }
    float noise(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

    vec4 glassEffect(vec2 uv, float progress) {
        float time = progress * 5.0 * uSpeedMultiplier;
        vec2 uv1 = getCoverUV(uv, uTexture1Size); vec2 uv2 = getCoverUV(uv, uTexture2Size);
        float maxR = length(uResolution) * 0.85; float br = progress * maxR;
        vec2 p = uv * uResolution; vec2 c = uResolution * 0.5;
        float d = length(p - c); float nd = d / max(br, 0.001);
        float param = smoothstep(br + 3.0, br - 3.0, d); // Inside circle
        vec4 img;
        if (param > 0.0) {
             float ro = 0.08 * uGlassRefractionStrength * uDistortionStrength * uGlobalIntensity * pow(smoothstep(0.3 * uGlassBubbleClarity, 1.0, nd), 1.5);
             vec2 dir = (d > 0.0) ? (p - c) / d : vec2(0.0);
             vec2 distUV = uv2 - dir * ro;
             distUV += vec2(sin(time + nd * 10.0), cos(time * 0.8 + nd * 8.0)) * 0.015 * uGlassLiquidFlow * uSpeedMultiplier * nd * param;
             float ca = 0.02 * uGlassChromaticAberration * uGlobalIntensity * pow(smoothstep(0.3, 1.0, nd), 1.2);
             img = vec4(texture2D(uTexture2, distUV + dir * ca * 1.2).r, texture2D(uTexture2, distUV + dir * ca * 0.2).g, texture2D(uTexture2, distUV - dir * ca * 0.8).b, 1.0);
             if (uGlassEdgeGlow > 0.0) {
                float rim = smoothstep(0.95, 1.0, nd) * (1.0 - smoothstep(1.0, 1.01, nd));
                img.rgb += rim * 0.08 * uGlassEdgeGlow * uGlobalIntensity;
             }
        } else { img = texture2D(uTexture2, uv2); }
        vec4 oldImg = texture2D(uTexture1, uv1);
        if (progress > 0.95) img = mix(img, texture2D(uTexture2, uv2), (progress - 0.95) / 0.05);
        return mix(oldImg, img, param);
    }
    vec4 frostEffect(vec2 uv, float progress) { return mix(texture2D(uTexture1, getCoverUV(uv, uTexture1Size)), texture2D(uTexture2, getCoverUV(uv, uTexture2Size)), progress); }
    vec4 rippleEffect(vec2 uv, float progress) { return mix(texture2D(uTexture1, getCoverUV(uv, uTexture1Size)), texture2D(uTexture2, getCoverUV(uv, uTexture2Size)), progress); }
    vec4 plasmaEffect(vec2 uv, float progress) { return mix(texture2D(uTexture1, getCoverUV(uv, uTexture1Size)), texture2D(uTexture2, getCoverUV(uv, uTexture2Size)), progress); }
    vec4 timeshiftEffect(vec2 uv, float progress) { return mix(texture2D(uTexture1, getCoverUV(uv, uTexture1Size)), texture2D(uTexture2, getCoverUV(uv, uTexture2Size)), progress); }

    void main() {
        if (uEffectType == 0) gl_FragColor = glassEffect(vUv, uProgress);
        else if (uEffectType == 1) gl_FragColor = frostEffect(vUv, uProgress);
        else if (uEffectType == 2) gl_FragColor = rippleEffect(vUv, uProgress);
        else if (uEffectType == 3) gl_FragColor = plasmaEffect(vUv, uProgress);
        else gl_FragColor = timeshiftEffect(vUv, uProgress);
    }
`;

// Quebra por letra do original (espaço vira NBSP para não colapsar)
function dividirLetras(texto: string) {
  return texto
    .split('')
    .map(
      (letra) =>
        `<span style="display:inline-block;opacity:0">${letra === ' ' ? '&nbsp;' : letra}</span>`
    )
    .join('');
}

function IconePausaRetoma({pausado}: {pausado: boolean}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-5"
    >
      {pausado ? (
        <path d="M8 5.5v13l10-6.5z" />
      ) : (
        <>
          <path d="M9 5.5v13" />
          <path d="M15 5.5v13" />
        </>
      )}
    </svg>
  );
}

type Modo = 'carregando' | 'webgl' | 'img';

export default function CenaPalco({
  cidades,
  rotulos,
  rotuloSecao
}: {
  cidades: CidadePalco[];
  rotulos: RotulosPalco;
  rotuloSecao: string;
}) {
  const total = cidades.length;

  // A cena só existe no cliente (dynamic ssr:false): inicial lazy pode ler
  // matchMedia direto, sem setState dentro de effect.
  const [reduzido] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  const [mobile] = useState(() => window.matchMedia('(max-width: 767px)').matches);
  const [modo, setModo] = useState<Modo>(() => (reduzido ? 'img' : 'carregando'));
  const [indice, setIndice] = useState(0);
  const [pausado, setPausado] = useState(false);

  const raizRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const nomeRef = useRef<HTMLDivElement | null>(null);
  const cotaRef = useRef<HTMLSpanElement | null>(null);
  const barrasRef = useRef<(HTMLSpanElement | null)[]>([]);
  const modoRef = useRef<Modo>(reduzido ? 'img' : 'carregando');
  const ponteRef = useRef<{navegar: (destino: number) => void; gerirAutoplay: () => void} | null>(
    null
  );
  const ponteiro = useRef<{x: number; y: number; consumido: boolean} | null>(null);

  // Estado mutável fora do ciclo do React (o motor do slider, como o estado
  // global do original)
  const motor = useRef({
    indice: 0,
    transicionando: false,
    habilitado: false,
    pausado: false,
    ratio: 0,
    entrou: false,
    progresso: 0,
    timer: 0 as ReturnType<typeof setInterval> | 0,
    atraso: 0 as ReturnType<typeof setTimeout> | 0,
    troca: 0 as ReturnType<typeof setTimeout> | 0,
    raf: 0,
    texturas: [] as (Texture | null)[],
    renderer: null as WebGLRenderer | null,
    cena: null as Scene | null,
    camera: null as OrthographicCamera | null,
    material: null as ShaderMaterial | null,
    geometria: null as PlaneGeometry | null
  });

  useEffect(() => {
    const m = motor.current;
    const raiz = raizRef.current;
    const canvas = canvasRef.current;
    const nomeEl = nomeRef.current;
    if (!raiz) return;
    let vivo = true;

    // ---------------- barras de progresso (DOM direto, como o original)
    const barra = (i: number) => barrasRef.current[i];
    const pintarProgresso = (i: number, pct: number) => {
      const fill = barra(i);
      if (fill) {
        fill.style.width = `${Math.min(pct, 100)}%`;
        fill.style.opacity = '1';
      }
    };
    const desvanecerProgresso = (i: number) => {
      const fill = barra(i);
      if (fill) {
        fill.style.opacity = '0';
        window.setTimeout(() => {
          fill.style.width = '0%';
        }, 300);
      }
    };
    const zerarProgresso = (i: number) => {
      const fill = barra(i);
      if (fill) {
        fill.style.transition = 'width 0.2s ease-out';
        fill.style.width = '0%';
        window.setTimeout(() => {
          fill.style.transition = 'width 0.1s ease, opacity 0.3s ease';
        }, 200);
      }
    };

    // ---------------- autoplay com os portões do aceite
    const pararTimer = () => {
      if (m.timer) clearInterval(m.timer);
      if (m.atraso) clearTimeout(m.atraso);
      m.timer = 0;
      m.atraso = 0;
    };
    const podeRodar = () =>
      m.habilitado && !reduzido && !m.pausado && m.ratio >= 0.5 && !document.hidden;
    const iniciarTimer = () => {
      pararTimer();
      if (!podeRodar()) return;
      m.progresso = 0;
      const incremento = (100 / DURACAO_SLIDE_MS) * PASSO_PROGRESSO_MS;
      m.timer = setInterval(() => {
        if (!podeRodar()) {
          pararTimer();
          zerarProgresso(m.indice);
          return;
        }
        m.progresso += incremento;
        pintarProgresso(m.indice, m.progresso);
        if (m.progresso >= 100) {
          pararTimer();
          desvanecerProgresso(m.indice);
          if (!m.transicionando) avancar();
        }
      }, PASSO_PROGRESSO_MS);
    };
    const agendarTimer = (espera = 0) => {
      pararTimer();
      if (espera > 0) {
        m.atraso = setTimeout(iniciarTimer, espera);
      } else {
        iniciarTimer();
      }
    };
    const gerirAutoplay = () => {
      if (podeRodar()) {
        if (!m.timer && !m.atraso && !m.transicionando) agendarTimer();
      } else {
        pararTimer();
        zerarProgresso(m.indice);
      }
    };

    // ---------------- nome por letra (as 6 variações do original) + cota
    const entradaDoNome = (alvo: number) => {
      const el = nomeRef.current;
      const cota = cotaRef.current;
      if (!el || reduzido) return;
      const letras = el.children;
      gsap.set(letras, {opacity: 0});
      switch (alvo % 6) {
        case 0:
          gsap.set(letras, {y: 20});
          gsap.to(letras, {y: 0, opacity: 1, duration: 0.8, stagger: 0.03, ease: 'power3.out'});
          break;
        case 1:
          gsap.set(letras, {y: -20});
          gsap.to(letras, {y: 0, opacity: 1, duration: 0.8, stagger: 0.03, ease: 'back.out(1.7)'});
          break;
        case 2:
          gsap.set(letras, {filter: 'blur(10px)', scale: 1.5, y: 0});
          gsap.to(letras, {
            filter: 'blur(0px)',
            scale: 1,
            opacity: 1,
            duration: 1,
            stagger: {amount: 0.5, from: 'random'},
            ease: 'power2.out'
          });
          break;
        case 3:
          gsap.set(letras, {scale: 0, y: 0});
          gsap.to(letras, {scale: 1, opacity: 1, duration: 0.6, stagger: 0.05, ease: 'back.out(1.5)'});
          break;
        case 4:
          gsap.set(letras, {rotationX: 90, y: 0, transformOrigin: '50% 50%'});
          gsap.to(letras, {rotationX: 0, opacity: 1, duration: 0.8, stagger: 0.04, ease: 'power2.out'});
          break;
        default:
          gsap.set(letras, {x: 30, y: 0});
          gsap.to(letras, {x: 0, opacity: 1, duration: 0.8, stagger: 0.03, ease: 'power3.out'});
      }
      // A cota de 64px se traça sob o nome a cada troca (assinatura da casa)
      if (cota) {
        gsap.fromTo(cota, {scaleX: 0}, {scaleX: 1, duration: 0.8, delay: 0.25, ease: 'power3.out'});
      }
    };
    const trocarConteudo = (alvo: number) => {
      const el = nomeRef.current;
      const cota = cotaRef.current;
      if (!el || reduzido) return;
      gsap.to(el.children, {y: -20, opacity: 0, duration: 0.5, stagger: 0.02, ease: 'power2.in'});
      if (cota) gsap.to(cota, {scaleX: 0, duration: 0.3, ease: 'power2.in'});
      if (m.troca) clearTimeout(m.troca);
      m.troca = setTimeout(() => {
        if (!vivo) return;
        el.innerHTML = dividirLetras(cidades[alvo].nome);
        entradaDoNome(alvo);
      }, 500);
    };

    // ---------------- navegação (bloqueio isTransitioning do original)
    const navegar = (destino: number) => {
      const alvo = ((destino % total) + total) % total;
      if (m.transicionando || alvo === m.indice) return;
      if (modoRef.current === 'webgl' && !m.texturas[alvo]) return;
      pararTimer();
      zerarProgresso(m.indice);
      trocarConteudo(alvo);
      const anterior = m.indice;
      m.indice = alvo;
      setIndice(alvo);

      if (modoRef.current === 'webgl' && m.material) {
        const de = m.texturas[anterior];
        const para = m.texturas[alvo];
        if (!de || !para) return;
        const u = m.material.uniforms;
        m.transicionando = true;
        u.uTexture1.value = de;
        u.uTexture2.value = para;
        u.uTexture1Size.value = de.userData.size;
        u.uTexture2Size.value = para.userData.size;
        gsap.fromTo(u.uProgress, {value: 0}, {
          value: 1,
          duration: DURACAO_TRANSICAO,
          ease: 'power2.inOut',
          onComplete: () => {
            u.uProgress.value = 0;
            u.uTexture1.value = para;
            u.uTexture1Size.value = para.userData.size;
            m.transicionando = false;
            agendarTimer(100);
          }
        });
      } else {
        // Modo imagem: corte seco no reduced-motion; crossfade CSS sem WebGL
        agendarTimer(400);
      }
    };
    const avancar = () => {
      const alvo = (m.indice + 1) % total;
      if (modoRef.current === 'webgl' && !m.texturas[alvo]) {
        agendarTimer(600);
        return;
      }
      navegar(alvo);
    };

    // ---------------- three.js (dinâmico: reduced-motion nem baixa)
    const iniciarWebgl = async () => {
      try {
        const three = await import('three');
        if (!vivo || !canvas) return;

        const largura = raiz.clientWidth;
        const altura = raiz.clientHeight;
        const renderer = new three.WebGLRenderer({canvas, antialias: false, alpha: false});
        renderer.setSize(largura, altura, false);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobile ? 1.5 : 2));

        const cena = new three.Scene();
        const camera = new three.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        const material = new three.ShaderMaterial({
          uniforms: {
            uTexture1: {value: null},
            uTexture2: {value: null},
            uProgress: {value: 0},
            uResolution: {value: new three.Vector2(largura, altura)},
            uTexture1Size: {value: new three.Vector2(1, 1)},
            uTexture2Size: {value: new three.Vector2(1, 1)},
            uEffectType: {value: 0},
            uGlobalIntensity: {value: 1.0},
            uSpeedMultiplier: {value: 1.0},
            uDistortionStrength: {value: 1.0},
            uColorEnhancement: {value: 1.0},
            uGlassRefractionStrength: {value: 1.0},
            uGlassChromaticAberration: {value: 1.0},
            uGlassBubbleClarity: {value: 1.0},
            uGlassEdgeGlow: {value: 1.0},
            uGlassLiquidFlow: {value: 1.0},
            uFrostIntensity: {value: 1.0},
            uFrostCrystalSize: {value: 1.0},
            uFrostIceCoverage: {value: 1.0},
            uFrostTemperature: {value: 1.0},
            uFrostTexture: {value: 1.0},
            uRippleFrequency: {value: 25.0},
            uRippleAmplitude: {value: 0.08},
            uRippleWaveSpeed: {value: 1.0},
            uRippleRippleCount: {value: 1.0},
            uRippleDecay: {value: 1.0},
            uPlasmaIntensity: {value: 1.2},
            uPlasmaSpeed: {value: 0.8},
            uPlasmaEnergyIntensity: {value: 0.4},
            uPlasmaContrastBoost: {value: 0.3},
            uPlasmaTurbulence: {value: 1.0},
            uTimeshiftDistortion: {value: 1.6},
            uTimeshiftBlur: {value: 1.5},
            uTimeshiftFlow: {value: 1.4},
            uTimeshiftChromatic: {value: 1.5},
            uTimeshiftTurbulence: {value: 1.4}
          },
          vertexShader: VERTEX_SHADER,
          fragmentShader: FRAGMENT_SHADER
        });
        const geometria = new three.PlaneGeometry(2, 2);
        cena.add(new three.Mesh(geometria, material));

        m.renderer = renderer;
        m.cena = cena;
        m.camera = camera;
        m.material = material;
        m.geometria = geometria;

        const carregarTextura = (slug: string) =>
          new Promise<Texture>((resolver, rejeitar) => {
            new three.TextureLoader().load(
              fotoDaCidade(slug, mobile),
              (t) => {
                t.colorSpace = three.SRGBColorSpace;
                t.minFilter = three.LinearFilter;
                t.magFilter = three.LinearFilter;
                t.userData = {size: new three.Vector2(t.image.width, t.image.height)};
                resolver(t);
              },
              undefined,
              rejeitar
            );
          });

        // Habilita com as 2 primeiras texturas; o resto carrega em fundo
        const [t0, t1] = await Promise.all([
          carregarTextura(cidades[0].slug),
          carregarTextura(cidades[1].slug)
        ]);
        if (!vivo) {
          t0.dispose();
          t1.dispose();
          return;
        }
        m.texturas[0] = t0;
        m.texturas[1] = t1;
        material.uniforms.uTexture1.value = t0;
        material.uniforms.uTexture2.value = t1;
        material.uniforms.uTexture1Size.value = t0.userData.size;
        material.uniforms.uTexture2Size.value = t1.userData.size;
        m.habilitado = true;
        modoRef.current = 'webgl';
        setModo('webgl');
        gerirRaf();
        if (m.entrou) entradaDoNome(m.indice);
        agendarTimer(500);

        for (let i = 2; i < total; i++) {
          carregarTextura(cidades[i].slug)
            .then((t) => {
              if (!vivo) {
                t.dispose();
                return;
              }
              m.texturas[i] = t;
            })
            .catch(() => {});
        }
      } catch {
        // Sem WebGL: as fotos entram por <img> com crossfade CSS simples
        if (!vivo) return;
        m.habilitado = true;
        modoRef.current = 'img';
        setModo('img');
        if (m.entrou) entradaDoNome(m.indice);
        agendarTimer(500);
      }
    };

    // ---------------- rAF pausado fora da viewport
    const quadro = () => {
      m.raf = requestAnimationFrame(quadro);
      if (m.renderer && m.cena && m.camera) m.renderer.render(m.cena, m.camera);
    };
    const gerirRaf = () => {
      if (m.ratio > 0 && m.renderer && !m.raf) {
        m.raf = requestAnimationFrame(quadro);
      } else if ((m.ratio <= 0 || !m.renderer) && m.raf) {
        cancelAnimationFrame(m.raf);
        m.raf = 0;
      }
    };

    // ---------------- observadores e portões
    const io = new IntersectionObserver(
      ([entrada]) => {
        m.ratio = entrada.intersectionRatio;
        if (m.ratio >= 0.5 && !m.entrou) {
          m.entrou = true;
          if (m.habilitado) entradaDoNome(m.indice);
        }
        gerirRaf();
        gerirAutoplay();
      },
      {threshold: [0, 0.5, 1]}
    );
    io.observe(raiz);

    const aoMudarVisibilidade = () => gerirAutoplay();
    document.addEventListener('visibilitychange', aoMudarVisibilidade);

    const ro = new ResizeObserver(() => {
      if (!m.renderer || !m.material) return;
      const w = raiz.clientWidth;
      const h = raiz.clientHeight;
      m.renderer.setSize(w, h, false);
      m.material.uniforms.uResolution.value.set(w, h);
    });
    ro.observe(raiz);

    ponteRef.current = {navegar, gerirAutoplay};

    if (reduzido) {
      // Reduced-motion: modo imagem com corte seco, sem autoplay, sem three
      m.habilitado = true;
    } else {
      iniciarWebgl();
    }

    return () => {
      vivo = false;
      pararTimer();
      if (m.troca) clearTimeout(m.troca);
      if (m.raf) cancelAnimationFrame(m.raf);
      m.raf = 0;
      io.disconnect();
      ro.disconnect();
      document.removeEventListener('visibilitychange', aoMudarVisibilidade);
      if (m.material) gsap.killTweensOf(m.material.uniforms.uProgress);
      if (nomeEl) gsap.killTweensOf(nomeEl.children);
      m.texturas.forEach((t) => t?.dispose());
      m.texturas = [];
      m.geometria?.dispose();
      m.material?.dispose();
      m.renderer?.dispose();
      m.renderer = null;
      m.material = null;
      m.cena = null;
      m.camera = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // O botão de pausa compartilha o mesmo portão do autoplay
  useEffect(() => {
    motor.current.pausado = pausado;
    ponteRef.current?.gerirAutoplay();
  }, [pausado]);

  const nomeInicial = {__html: dividirLetras(cidades[0].nome)};

  return (
    <div
      ref={raizRef}
      role="group"
      aria-label={rotuloSecao}
      tabIndex={0}
      className="absolute inset-0 select-none"
      style={{touchAction: 'pan-y'}}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          ponteRef.current?.navegar(indice - 1);
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          ponteRef.current?.navegar(indice + 1);
        }
      }}
      onPointerDown={(e) => {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        ponteiro.current = {x: e.clientX, y: e.clientY, consumido: false};
      }}
      onPointerMove={(e) => {
        const p = ponteiro.current;
        if (!p || p.consumido) return;
        const dx = e.clientX - p.x;
        const dy = e.clientY - p.y;
        if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy)) {
          p.consumido = true;
          ponteRef.current?.navegar(indice + (dx < 0 ? 1 : -1));
        }
      }}
      onPointerUp={() => {
        ponteiro.current = null;
      }}
      onPointerCancel={() => {
        ponteiro.current = null;
      }}
      onPointerLeave={() => {
        ponteiro.current = null;
      }}
    >
      {/* Pôster e fallback: a primeira cidade por <img> debaixo do canvas.
          No modo imagem (reduced-motion ou sem WebGL) todas as fotos entram
          como <img> e a ativa troca por opacidade (corte seco no RM).
          <img> deliberado: as variantes desktop/mobile já vêm prontas da
          curadoria e servem também de textura, fora do otimizador. */}
      {modo === 'img' ? (
        cidades.map((cidade, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={cidade.slug}
            src={fotoDaCidade(cidade.slug, mobile)}
            alt=""
            loading={i === 0 ? 'eager' : 'lazy'}
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover"
            style={{
              opacity: i === indice ? 1 : 0,
              transition: reduzido ? 'none' : 'opacity 0.6s ease'
            }}
          />
        ))
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={fotoDaCidade(cidades[0].slug, mobile)}
          alt=""
          loading="eager"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}

      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className={`absolute inset-0 h-full w-full transition-opacity duration-500 ${
          modo === 'webgl' ? 'opacity-100' : 'opacity-0'
        }`}
      />

      <VeusDoPalco />

      {/* Contador e pausa (WCAG 2.2.2: conteúdo que avança sozinho tem
          controle de pausa) */}
      <div className="absolute right-6 top-6 z-[1] flex items-center gap-2 lg:right-10 lg:top-8">
        <span className="text-sm tabular-nums text-white/90">
          {`${String(indice + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`}
        </span>
        {!reduzido && (
          <button
            type="button"
            aria-label={pausado ? rotulos.retomar : rotulos.pausar}
            aria-pressed={pausado}
            onClick={() => setPausado((p) => !p)}
            className="flex size-11 items-center justify-center text-white/80 transition-colors duration-200 hover:text-white"
          >
            <IconePausaRetoma pausado={pausado} />
          </button>
        )}
      </div>

      {/* Nome da cidade + cota que se traça. Com reduced-motion o nome é
          texto do React (corte seco); fora dele, o GSAP é dono das letras. */}
      <div className="pointer-events-none absolute bottom-8 left-6 z-[1] max-w-[calc(100%-150px)] lg:bottom-12 lg:left-12">
        {reduzido ? (
          <div className="text-[clamp(2.125rem,6.5vw,4.5rem)] font-semibold leading-[1.05] tracking-[-0.02em] text-white">
            {cidades[indice].nome}
          </div>
        ) : (
          <div
            ref={nomeRef}
            className="text-[clamp(2.125rem,6.5vw,4.5rem)] font-semibold leading-[1.05] tracking-[-0.02em] text-white"
            dangerouslySetInnerHTML={nomeInicial}
          />
        )}
        <span
          ref={cotaRef}
          aria-hidden="true"
          className="mt-4 block h-[3px] w-16 origin-left rounded-full bg-avanco"
        />
      </div>

      <div aria-live="polite" className="sr-only">
        {cidades[indice].nome}
      </div>

      {/* Navegação das 12 cidades com a linha de progresso do original
          (alvo de toque >=32px por item no mobile) */}
      <div className="absolute right-4 top-1/2 z-[1] flex -translate-y-1/2 flex-col items-end lg:right-10">
        {cidades.map((cidade, i) => (
          <button
            key={cidade.slug}
            type="button"
            aria-label={cidade.nome}
            aria-current={i === indice}
            onClick={() => ponteRef.current?.navegar(i)}
            onPointerEnter={(e) => {
              if (e.pointerType === 'mouse') ponteRef.current?.navegar(i);
            }}
            className="group flex min-h-8 items-center justify-end gap-2 py-0.5 lg:gap-2.5 lg:py-1"
          >
            <span className="relative h-px w-5 overflow-hidden bg-white/25 lg:w-8">
              <span
                ref={(el) => {
                  barrasRef.current[i] = el;
                }}
                className="absolute inset-y-0 left-0 w-0 bg-white"
                style={{transition: 'width 0.1s ease, opacity 0.3s ease'}}
              />
            </span>
            <span
              className={`text-[12px] font-semibold uppercase tracking-[0.14em] transition-colors duration-200 ${
                i === indice ? 'text-white' : 'text-white/60 group-hover:text-white/85'
              }`}
            >
              {cidade.nome}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
