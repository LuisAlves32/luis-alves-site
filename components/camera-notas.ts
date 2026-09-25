import gsap from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';

/* =============================================================================
   A CÂMERA DO BLOG  ·  Second Opinion  ·  Passe 3 (blog/movimento-blog.md)
   -----------------------------------------------------------------------------
   Não é um segundo ponto de movimento: é um MÓDULO da câmera (`camera.tsx`), chamado
   de dentro do mesmo `gsap.matchMedia`. Tudo o que nasce aqui é revertido junto com o
   resto da câmera (troca de rota, troca de faixa de janela, movimento reduzido ligado
   ao vivo). Com `prefers-reduced-motion` esta função nem roda, e o blog fica no
   ESTADO FINAL que o HTML já tem: capa medida, número no lugar, frase sublinhada,
   conta somada. Nada aqui esconde conteúdo que o HTML não mostre sozinho.

   O VERBO É UM SÓ: a medida acontece na frente do leitor. Tudo o que se move é uma
   cota sendo tirada.

   PICO 1, A LISTAGEM
     ato 1 (gatilho)  a capa grande se MEDE e o número ASSENTA como a leitura de um
                      instrumento: os dígitos giram e travam da esquerda para a direita.
     ato 2 (trilho)   o número ARQUIVA por revezamento: desce e se apaga na capa, e o
                      valor da linha dele assenta no índice (ver `arquivar`).
     respostas        o ponteiro dá profundidade à capa (as linhas andam, o número é a
                      régua parada) e, no índice, a capa da linha acende (Framer, já lá).
   PICO 2, A NOTA
     ato 1 (gatilho)  a capa do cabeçalho se mede.
     ato 2 (trilho)   a cota da capa se apaga quando a leitura começa, e a régua da
                      margem (Framer, `progresso-da-leitura.tsx`) assume a medida.
     trilhos curtos   a frase marcada se sublinha na proporção real de cada linha, e
                      "A conta" se FAZ: cada linha se traça e o total soma de verdade.
     fecho            o L/ do fim assina, uma vez.

   POSSE: as capas têm `data-owner="notas"`, então a câmera genérica passa por cima
   delas e ESTE módulo é o único que escreve nelas. Um canal, um dono: o gatilho da
   capa só usa escala e texto; o trilho só usa opacidade e a posição do número. É a
   regra que a lição "entrada e rolagem no mesmo elemento" pagou para aprender.
   ========================================================================== */

gsap.registerPlugin(ScrollTrigger);

type Contexto = {desktop: boolean};

const ESCALA_GATILHO = {ease: 'power2.out'} as const;

/* ---------------------------------------------------------------------------
   O NÚMERO QUE ASSENTA
   Só os dígitos giram; cifrão, vírgula, ponto e espaço ficam onde estão, e o número
   usa algarismos tabulares: a largura não treme, então a linha que o mede também não.
--------------------------------------------------------------------------- */
function assentarNumero(el: HTMLElement, duracao: number) {
  const final = el.textContent ?? '';
  if (!/\d/.test(final)) return null;
  const alvo = {p: 0};
  const casas = [...final];
  const digitos = casas.filter((c) => /\d/.test(c)).length;
  const escrever = () => {
    let visto = 0;
    el.textContent = casas
      .map((c) => {
        if (!/\d/.test(c)) return c;
        // Cada dígito trava quando o progresso passa da posição dele.
        const trava = (visto++ + 1) / digitos;
        return alvo.p >= trava ? c : String(Math.floor(Math.random() * 10));
      })
      .join('');
  };
  const tween = gsap.to(alvo, {
    p: 1,
    duration: duracao,
    ease: 'power1.inOut',
    onUpdate: escrever,
    onComplete: () => {
      el.textContent = final;
    }
  });
  return {tween, restaurar: () => (el.textContent = final)};
}

/* ---------------------------------------------------------------------------
   AS PEÇAS DA COTA POR FORMA (capa-cota.tsx). O eixo de cada peça muda com a forma:
   na cota vertical a chamada é horizontal e a linha é vertical.
--------------------------------------------------------------------------- */
function pecas(capa: HTMLElement) {
  const forma = capa.dataset.forma;
  const q = (s: string) => [...capa.querySelectorAll<HTMLElement>(s)];
  return {
    forma,
    chamadas: q('[data-cota-peca="chamada"]'),
    linha: q('[data-cota-peca="linha"]'),
    tiques: q('[data-cota-peca="tique"]'),
    numero: capa.querySelector<HTMLElement>('.capa-numero'),
    rotulo: capa.querySelector<HTMLElement>('.capa-rotulo'),
    kicker: capa.querySelector<HTMLElement>('.capa-kicker'),
    rodape: capa.querySelector<HTMLElement>('.capa-rodape'),
    titulo: capa.querySelector<HTMLElement>('.capa-titulo'),
    cota: capa.querySelector<HTMLElement>('.cota-linha, .cota-vertical, .cota-nivel')
  };
}

/** Ato 1: a medida acontece. Só ESCALA nas linhas e TEXTO no número. */
function medir(capa: HTMLElement, restauros: (() => void)[]) {
  const p = pecas(capa);
  const vertical = p.forma === 'vertical';
  const nivel = p.forma === 'nivel';
  const tl = gsap.timeline({defaults: ESCALA_GATILHO, paused: true});

  if (p.chamadas.length) {
    tl.from(
      p.chamadas,
      vertical
        ? {scaleX: 0, transformOrigin: '0% 50%', duration: 0.35, stagger: 0.06}
        : {scaleY: 0, transformOrigin: '50% 100%', duration: 0.35, stagger: 0.06}
    );
  }
  if (p.linha.length) {
    tl.from(
      p.linha,
      vertical
        ? {scaleY: 0, transformOrigin: '50% 50%', duration: 0.55, ease: 'power2.inOut'}
        : {scaleX: 0, transformOrigin: nivel ? '0% 50%' : '50% 50%', duration: 0.55, ease: 'power2.inOut'},
      p.chamadas.length ? '-=0.12' : 0
    );
  }
  if (p.tiques.length) {
    // Os traços têm `skewX` no CSS: a escala entra por cima dele sem desfazê-lo.
    tl.from(p.tiques, {scaleY: 0, transformOrigin: '50% 50%', duration: 0.28, stagger: 0.06}, '-=0.2');
  }
  if (p.numero) {
    const assento = assentarNumero(p.numero, 0.75);
    if (assento) {
      // `add` tira o tween do relógio global e o põe na timeline (que nasce pausada).
      tl.add(assento.tween, 0.1);
      restauros.push(assento.restaurar);
    }
  }
  return tl;
}

/* ---------------------------------------------------------------------------
   A RESPOSTA DO PONTEIRO NA CAPA: profundidade, contida.
   As linhas da cota são o fundo e andam contra o ponteiro; o kicker e o rodapé são
   a frente e andam um tico a favor; o NÚMERO fica parado, é a régua contra a qual o
   resto anda (a mesma regra das camadas de manhã do site). Só com mouse de verdade.
--------------------------------------------------------------------------- */
function profundidade(capa: HTMLElement, amplitude: number, limpezas: (() => void)[]) {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const p = pecas(capa);
  const camadas = [
    {el: p.cota, x: -14, y: -10},
    {el: p.rotulo, x: -6, y: -4},
    {el: p.kicker, x: 5, y: 3},
    {el: p.rodape, x: 5, y: 3},
    {el: p.titulo, x: -4, y: -3}
  ].filter((c): c is {el: HTMLElement; x: number; y: number} => c.el !== null);
  if (!camadas.length) return;

  const movedores = camadas.map((c) => ({
    ...c,
    mx: gsap.quickTo(c.el, 'x', {duration: 0.6, ease: 'power3'}),
    my: gsap.quickTo(c.el, 'y', {duration: 0.6, ease: 'power3'})
  }));

  const mover = (e: PointerEvent) => {
    const r = capa.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width - 0.5;
    const ny = (e.clientY - r.top) / r.height - 0.5;
    for (const m of movedores) {
      m.mx(nx * m.x * 2 * amplitude);
      m.my(ny * m.y * 2 * amplitude);
    }
  };
  const soltar = () => movedores.forEach((m) => (m.mx(0), m.my(0)));
  capa.addEventListener('pointermove', mover);
  capa.addEventListener('pointerleave', soltar);
  limpezas.push(() => {
    capa.removeEventListener('pointermove', mover);
    capa.removeEventListener('pointerleave', soltar);
  });
}

/* ---------------------------------------------------------------------------
   PICO 1, ATO 2: o número ARQUIVA, por revezamento.
   O protótipo fazia o número VOAR da capa até a linha do índice (`Flip.fit`). Na página
   real, entre as duas estão o nome do blog, o texto de apoio e a faixa de inscrição, e o
   voo atravessava esses textos (medido em 24/09/2026: cobria "Read the note" a 1440 e o
   título da faixa a 390). Número por cima de texto lê como defeito, não como gesto.
   Então o gesto virou revezamento, com o mesmo sentido:
     na capa (trilho)    o número desce e encolhe NA DIREÇÃO do índice enquanto se apaga;
     no índice (gatilho) o valor da linha dele ASSENTA (os mesmos dígitos girando) e
                         ganha a cota de 3px por um instante: o arquivo recebendo.
   Canais separados: a capa usa y, escala e opacidade do número dela; o índice usa o
   texto e um atributo do valor, que é outro elemento.
--------------------------------------------------------------------------- */
function arquivar(capa: HTMLElement, limpezas: (() => void)[]) {
  const p = pecas(capa);
  const numero = p.numero;
  if (!numero) return;

  const sai = [...p.chamadas, ...p.linha, ...p.tiques, p.rotulo, p.kicker, p.rodape].filter(
    (el): el is HTMLElement => el !== null
  );
  gsap
    .timeline({
      scrollTrigger: {trigger: capa, start: 'top top+=24', end: 'bottom 30%', scrub: 0.6}
    })
    // A ordem importa, e foi medida (auditor de travessia, 24/09/2026): o rótulo e as linhas
    // saem PRIMEIRO; só depois o número desce, senão ele cai por cima do próprio rótulo.
    .to(sai, {opacity: 0, ease: 'none', duration: 0.28}, 0)
    .to(numero, {y: 72, scale: 0.42, transformOrigin: '100% 100%', ease: 'power2.in', duration: 0.8}, 0.2)
    .to(numero, {opacity: 0, ease: 'none', duration: 0.4}, 0.6);

  const alvo = document.querySelector<HTMLElement>('[data-indice-valor="primeiro"]');
  if (alvo) {
    let desliga = 0;
    ScrollTrigger.create({
      trigger: alvo,
      start: 'top 82%',
      once: true,
      onEnter: () => {
        assentarNumero(alvo, 0.6);
        alvo.setAttribute('data-recebendo', '');
        desliga = window.setTimeout(() => alvo.removeAttribute('data-recebendo'), 1300);
      }
    });
    limpezas.push(() => {
      window.clearTimeout(desliga);
      alvo.removeAttribute('data-recebendo');
    });
  }

  // O filtro do índice muda a altura da lista (animação de layout do Framer). Quando ela
  // assenta, os gatilhos abaixo dela precisam medir de novo.
  let espera = 0;
  const refazer = () => {
    window.clearTimeout(espera);
    espera = window.setTimeout(() => ScrollTrigger.refresh(), 520);
  };
  window.addEventListener('notas:indice', refazer);
  limpezas.push(() => {
    window.clearTimeout(espera);
    window.removeEventListener('notas:indice', refazer);
  });
}

/* ---------------------------------------------------------------------------
   PICO 2, ATO 2: a cota do cabeçalho se apaga quando a leitura começa. Opacidade só:
   a escala é do gatilho (ato 1).
--------------------------------------------------------------------------- */
function passarAMedida(capa: HTMLElement) {
  const p = pecas(capa);
  const cota = [...p.chamadas, ...p.linha, ...p.tiques];
  if (!cota.length) return;
  gsap.to(cota, {
    opacity: 0,
    ease: 'none',
    scrollTrigger: {trigger: capa, start: 'bottom 60%', end: 'bottom 10%', scrub: true}
  });
}

/* ---------------------------------------------------------------------------
   A FRASE MARCADA: a cota de 3px se traça na proporção real de cada linha.
   Um número só (o progresso) governa todas as barras: a barra de cada linha recebe a
   parte dela, pelo comprimento. Então o traço ATRAVESSA a quebra de linha como uma
   caneta, e não "enche" linha por linha em tempos iguais. As barras moram numa camada
   própria do corpo, posicionadas no refresh (nunca por quadro); o sublinhado estático
   do CSS sai só enquanto a camada existe.
--------------------------------------------------------------------------- */
function fraseMarcada(limpezas: (() => void)[]) {
  const corpo = document.querySelector<HTMLElement>('.corpo-nota');
  const frases = [...document.querySelectorAll<HTMLElement>('.corpo-nota .marcada')];
  if (!corpo || !frases.length) return;

  const camada = document.createElement('div');
  camada.className = 'camada-cotas';
  camada.setAttribute('aria-hidden', 'true');
  corpo.appendChild(camada);
  limpezas.push(() => camada.remove());

  for (const frase of frases) {
    const barras: HTMLSpanElement[] = [];
    let partes: number[] = [];
    const escrever: ((v: number) => void)[] = [];
    const posicionar = () => {
      const base = camada.getBoundingClientRect();
      const linhas = [...frase.getClientRects()].filter((r) => r.width > 1);
      while (barras.length < linhas.length) {
        const b = document.createElement('span');
        b.className = 'cota-da-frase';
        camada.appendChild(b);
        barras.push(b);
        escrever.push(gsap.quickSetter(b, 'scaleX') as (v: number) => void);
      }
      const total = linhas.reduce((s, r) => s + r.width, 0) || 1;
      partes = linhas.map((r) => r.width / total);
      barras.forEach((b, i) => {
        const r = linhas[i];
        b.style.display = r ? 'block' : 'none';
        if (!r) return;
        b.style.left = `${r.left - base.left}px`;
        b.style.top = `${r.bottom - base.top - 3}px`;
        b.style.width = `${r.width}px`;
      });
    };
    const pintar = (p: number) => {
      let feito = 0;
      partes.forEach((parte, i) => {
        escrever[i]?.(gsap.utils.clamp(0, 1, (p - feito) / parte));
        feito += parte;
      });
    };
    frase.setAttribute('data-cota-viva', '');
    limpezas.push(() => frase.removeAttribute('data-cota-viva'));
    ScrollTrigger.create({
      trigger: frase,
      start: 'top 82%',
      end: () => '+=' + window.innerHeight * 0.28,
      onRefresh: (self) => {
        posicionar();
        pintar(self.progress);
      },
      onUpdate: (self) => pintar(self.progress)
    });
  }
}

/* ---------------------------------------------------------------------------
   "A CONTA" SE FAZ (o livro-razão da nota). Cada linha se traça (o pontilhado corre
   até o valor e o valor acende) e o total SOMA DE VERDADE a cada linha fechada. Só
   soma se a conta bater com o total que o Luís escreveu; se não bater (ou se algum
   valor não for número), o total apenas assenta no fim. Nunca se mostra uma soma que
   não existe.
--------------------------------------------------------------------------- */
function numeroDe(texto: string): number | null {
  const digitos = texto.replace(/[^\d]/g, '');
  if (!digitos) return null;
  const negativo = /^\s*[-−–]|(^|\s)(less|menos|minus)(\s|$)/i.test(texto);
  return (negativo ? -1 : 1) * Number(digitos);
}

function formatarComo(modelo: string, n: number): string {
  const separador = modelo.match(/\d([.,])\d{3}/)?.[1] ?? ',';
  const corpo = Math.abs(Math.round(n))
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, separador);
  const texto = modelo.replace(/\d[\d.,]*\d|\d/, corpo);
  return n < 0 ? `−${texto}` : texto;
}

function conta(limpezas: (() => void)[]) {
  for (const livro of document.querySelectorAll<HTMLElement>('.a-conta')) {
    const linhas = [...livro.querySelectorAll<HTMLElement>('li')];
    const totalEl = livro.querySelector<HTMLElement>('.total strong');
    if (!linhas.length) continue;
    const totalTexto = totalEl?.textContent ?? '';
    const valores = linhas.map((li) => numeroDe(li.querySelector('.valor')?.textContent ?? ''));
    const total = numeroDe(totalTexto);
    const soma = valores.every((v) => v !== null) && total !== null && valores.reduce<number>((s, v) => s + (v ?? 0), 0) === total;
    const parciais = valores.reduce<number[]>((acc, v) => [...acc, (acc.at(-1) ?? 0) + (v ?? 0)], []);

    const pontilhados = linhas.map((li) => li.querySelector<HTMLElement>('.pontilhado'));
    const valoresEl = linhas.map((li) => li.querySelector<HTMLElement>('.valor'));
    const setPont = pontilhados.map((el) => (el ? (gsap.quickSetter(el, 'scaleX') as (v: number) => void) : null));
    const setVal = valoresEl.map((el) => (el ? (gsap.quickSetter(el, 'opacity') as (v: number) => void) : null));
    pontilhados.forEach((el) => el && gsap.set(el, {transformOrigin: '0% 50%'}));
    limpezas.push(() => {
      if (totalEl) totalEl.textContent = totalTexto;
    });

    let ultimo = -2;
    const pintar = (p: number) => {
      const k = linhas.length;
      let fechadas = 0;
      for (let i = 0; i < k; i++) {
        const local = gsap.utils.clamp(0, 1, p * k - i);
        setPont[i]?.(gsap.utils.clamp(0, 1, local / 0.75));
        setVal[i]?.(local >= 0.75 ? 1 : 0.18);
        if (local >= 0.75) fechadas = i + 1;
      }
      if (!totalEl || fechadas === ultimo) return;
      ultimo = fechadas;
      if (soma) {
        totalEl.textContent = fechadas ? formatarComo(totalTexto, parciais[fechadas - 1]) : formatarComo(totalTexto, 0);
      }
    };

    const livroST = ScrollTrigger.create({
      trigger: livro,
      start: 'top 78%',
      end: 'bottom 60%',
      onRefresh: (self) => pintar(self.progress),
      onUpdate: (self) => pintar(self.progress)
    });

    // Sem soma possível, o total assenta quando a conta fecha (gatilho, uma vez).
    if (!soma && totalEl) {
      ScrollTrigger.create({
        trigger: livro,
        start: 'bottom 62%',
        once: true,
        onEnter: () => assentarNumero(totalEl, 0.6)
      });
    }
    limpezas.push(() => livroST.kill());
  }
}

/* ---------------------------------------------------------------------------
   O FECHO: o L/ do fim da nota assina, uma vez, fora do laço da rolagem.
--------------------------------------------------------------------------- */
function assinatura() {
  const sinal = document.querySelector<SVGSVGElement>('svg[data-fim-da-nota]');
  if (!sinal) return;
  const [ele, barra] = [...sinal.querySelectorAll('polygon')];
  if (!ele || !barra) return;
  gsap
    .timeline({scrollTrigger: {trigger: sinal, start: 'top 88%', once: true}})
    .from(ele, {scaleY: 0, transformOrigin: '50% 100%', duration: 0.42, ease: 'power2.out'})
    .from(barra, {scaleY: 0, transformOrigin: '50% 100%', duration: 0.36, ease: 'power2.out'}, '-=0.12');
}

/**
 * Monta o movimento do blog na página atual. Devolve a limpeza do que o `gsap.matchMedia`
 * não reverte sozinho (ouvintes, camadas criadas, texto reescrito).
 */
export function moverNotas(contexto: Contexto): () => void {
  // Abaixo de 820px (tablet com mouse) a profundidade anda 60%: amplitude menor, nunca desligada.
  const amplitude = contexto.desktop ? 1 : 0.6;
  const limpezas: (() => void)[] = [];
  const capas = [...document.querySelectorAll<HTMLElement>('.capa-cota[data-owner="notas"]')];

  for (const capa of capas) {
    const grande = capa.dataset.tamanho === 'grande';
    const tl = medir(capa, limpezas);
    // A capa grande está acima da dobra: mede na chegada. A do cabeçalho mede quando entra.
    if (grande) tl.delay(0.25).play();
    else ScrollTrigger.create({trigger: capa, start: 'top 85%', once: true, onEnter: () => tl.play()});
    profundidade(capa, amplitude, limpezas);
    if (grande) arquivar(capa, limpezas);
    else passarAMedida(capa);
  }

  fraseMarcada(limpezas);
  conta(limpezas);
  assinatura();

  // Os estados iniciais já estão escritos (os `from` renderizam na hora): a espera do
  // layout (app/[locale]/(site)/layout.tsx) pode sair sem piscar.
  document.documentElement.removeAttribute('data-camera');

  return () => limpezas.splice(0).forEach((f) => f());
}
