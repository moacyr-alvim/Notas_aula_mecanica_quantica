/* Núcleo da página de Stern–Gerlach.  Spin ½, ímãs com eixo no plano x–z:
 *
 *   eixo do ímã  n(θ) = (sen θ, 0, cos θ)       (θ = 0 é z; θ = 90° é x)
 *   |+n⟩ = ( cos θ/2,  sen θ/2 ),   |−n⟩ = ( −sen θ/2, cos θ/2 )     na base { |+z⟩, |−z⟩ }
 *
 * No plano x–z as amplitudes são reais; a direção y (que pede amplitudes complexas) fica
 * para o texto.  O aparelho: forno → ímã 1 (deixa passar um feixe) → ímã 2 (opcional, deixa
 * passar um feixe) → ímã 3 (os dois feixes vão para detectores).  Sem DOM: roda no Node.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.SGCore = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var RAD = Math.PI / 180;

  /* o ket |s n(θ)⟩, com s = +1 ou −1, θ em graus */
  function spinor(theta, s) {
    var h = theta * RAD / 2;
    return s > 0 ? [Math.cos(h), Math.sin(h)] : [-Math.sin(h), Math.cos(h)];
  }
  /* ⟨b|a⟩ — tudo real no plano x–z */
  function amp(thA, sA, thB, sB) {
    var a = spinor(thA, sA), b = spinor(thB, sB);
    return a[0] * b[0] + a[1] * b[1];
  }
  function prob(thA, sA, thB, sB) { var c = amp(thA, sA, thB, sB); return c * c; }

  /* vetor de Bloch do estado |s n(θ)⟩ — só para desenhar */
  function bloch(theta, s) { var t = theta * RAD; return { x: s * Math.sin(t), z: s * Math.cos(t) }; }

  /* probabilidades de cada etapa, para um átomo que sai do forno sem polarização.
     cfg = { t1, s1, usa2, t2, s2, t3 } (ângulos em graus, s = ±1) */
  function teoria(cfg) {
    var p1 = 0.5;                                            // forno: metade para cada lado, em qualquer eixo
    var thAnt = cfg.t1, sAnt = cfg.s1, p2 = 1;
    if (cfg.usa2) { p2 = prob(cfg.t1, cfg.s1, cfg.t2, cfg.s2); thAnt = cfg.t2; sAnt = cfg.s2; }
    var mais = prob(thAnt, sAnt, cfg.t3, +1), menos = prob(thAnt, sAnt, cfg.t3, -1);
    return {
      passa1: p1, passa2: p2,                                // condicionais: de quem chegou àquele ímã
      mais: mais, menos: menos,                               // condicionais: de quem chegou ao ímã 3
      maisTotal: p1 * p2 * mais, menosTotal: p1 * p2 * menos  // frações de tudo que saiu do forno
    };
  }

  /* gerador de números pseudoaleatórios com semente (mulberry32) */
  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* destino de um átomo: em que etapa ele parou e com que resultado.
     etapa 1 ou 2 = barrado naquele ímã; 3 = chegou ao detector, com sinal = ±1 */
  function atomo(cfg, r) {
    var T = teoria(cfg);
    // o forno manda um estado ao acaso; o resultado no ímã 1 é ±1 com chance ½ cada
    var s1 = r() < 0.5 ? +1 : -1;
    if (s1 !== cfg.s1) return { etapa: 1, sinal: s1 };
    if (cfg.usa2) {
      var s2 = r() < T.passa2 ? cfg.s2 : -cfg.s2;
      if (s2 !== cfg.s2) return { etapa: 2, sinal: s2 };
    }
    return { etapa: 3, sinal: r() < T.mais ? +1 : -1 };
  }

  function simula(cfg, N, r) {
    var c = { forno: N, barra1: 0, barra2: 0, mais: 0, menos: 0 };
    for (var i = 0; i < N; i++) {
      var a = atomo(cfg, r);
      if (a.etapa === 1) c.barra1++;
      else if (a.etapa === 2) c.barra2++;
      else if (a.sinal > 0) c.mais++; else c.menos++;
    }
    return c;
  }

  var PRESETS = {
    zz:   { label: "z, depois z", t1: 0, s1: 1, usa2: false, t2: 90, s2: 1, t3: 0 },
    zx:   { label: "z, depois x", t1: 0, s1: 1, usa2: false, t2: 90, s2: 1, t3: 90 },
    zxz:  { label: "z, x, z: a memória apagada", t1: 0, s1: 1, usa2: true, t2: 90, s2: 1, t3: 0 },
    zmz:  { label: "z (passa −), depois z", t1: 0, s1: -1, usa2: false, t2: 90, s2: 1, t3: 0 },
    ang:  { label: "z, depois um ângulo de 60°", t1: 0, s1: 1, usa2: false, t2: 90, s2: 1, t3: 60 },
    meio: { label: "z, 45°, 90°: girar aos poucos", t1: 0, s1: 1, usa2: true, t2: 45, s2: 1, t3: 90 }
  };

  return { spinor: spinor, amp: amp, prob: prob, bloch: bloch, teoria: teoria, atomo: atomo, simula: simula, rng: rng, PRESETS: PRESETS };
});
