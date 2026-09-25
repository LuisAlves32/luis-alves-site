/* =============================================================================
   ENERGIA BAIXA NO TOQUE (25/09/2026)
   -----------------------------------------------------------------------------
   O Modo de Pouca Energia do iPhone limita o requestAnimationFrame a ~30
   quadros por segundo. Tudo que o JavaScript escreve em função da rolagem passa
   a andar aos degraus contra a página (visto no aparelho do Gabriel, 25/09). O
   navegador não conta que o modo está ligado, então ele se MEDE: depois do load,
   só em aparelho de toque, o intervalo mediano de 45 quadros. Mediana, e não
   média, para uma tarefa longa do carregamento não disparar o alarme.

   Quem ouve decide o que aliviar. A regra do método vale aqui também: corta-se
   o que anda aos degraus, nunca a vida inteira da página.
   ========================================================================== */

type Ouvinte = (baixa: boolean) => void;

// 30 quadros por segundo são 33ms; 60 são 16,7ms. A régua fica no meio.
const INTERVALO_DE_ENERGIA_BAIXA = 25;
const QUADROS_MEDIDOS = 45;
// Folga depois do load, para a medida não pegar a hidratação e o vídeo.
const ESPERA_DEPOIS_DO_LOAD = 600;

let resultado: boolean | null = null;
let iniciado = false;
const ouvintes = new Set<Ouvinte>();

function concluir(baixa: boolean) {
  resultado = baixa;
  if (baixa) document.documentElement.dataset.energia = 'baixa';
  for (const ouvinte of ouvintes) ouvinte(baixa);
  ouvintes.clear();
}

function medir() {
  // Aba escondida não tem quadro: espera ela voltar.
  if (document.hidden) {
    document.addEventListener('visibilitychange', medir, {once: true});
    return;
  }
  const intervalos: number[] = [];
  let anterior = 0;
  const passo = (agora: number) => {
    if (anterior) intervalos.push(agora - anterior);
    anterior = agora;
    if (intervalos.length < QUADROS_MEDIDOS) {
      requestAnimationFrame(passo);
      return;
    }
    intervalos.sort((a, b) => a - b);
    concluir(intervalos[Math.floor(intervalos.length / 2)] > INTERVALO_DE_ENERGIA_BAIXA);
  };
  requestAnimationFrame(passo);
}

function iniciar() {
  if (iniciado) return;
  iniciado = true;
  // No computador o problema não existe: nem mede.
  if (!window.matchMedia('(hover: none) and (pointer: coarse)').matches) {
    concluir(false);
    return;
  }
  const depoisDoLoad = () => window.setTimeout(medir, ESPERA_DEPOIS_DO_LOAD);
  if (document.readyState === 'complete') depoisDoLoad();
  else window.addEventListener('load', depoisDoLoad, {once: true});
}

/**
 * Chama o ouvinte UMA vez, com true quando o aparelho está entregando ~30
 * quadros por segundo. Se a medida já existe, responde na hora. Devolve a
 * função que desiste de ouvir (para o desmonte).
 */
export function aoMedirEnergia(ouvinte: Ouvinte): () => void {
  if (typeof window === 'undefined') return () => {};
  if (resultado !== null) {
    ouvinte(resultado);
    return () => {};
  }
  ouvintes.add(ouvinte);
  iniciar();
  return () => {
    ouvintes.delete(ouvinte);
  };
}
