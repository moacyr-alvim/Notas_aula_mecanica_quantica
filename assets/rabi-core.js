/* Núcleo da página de evolução no tempo: spin ½ num campo constante B₀ẑ mais um campo
 * girante de frequência ω no plano xy.  No referencial que gira com o campo (aproximação de
 * onda girante), o hamiltoniano é constante:
 *
 *   H = (ħ/2) (Δ σ_z + Ω σ_x),   Δ = ω₀ − ω (dessintonia),  Ω = frequência de Rabi.
 *
 * Um hamiltoniano (ħW/2) n·σ gira o vetor de Bloch em torno de n com velocidade angular W
 * (sentido da mão direita), com W = √(Δ² + Ω²) e n = (Ω, 0, Δ)/W.  No laboratório, soma-se a
 * rotação de ωt em torno de z.  Unidades: ħ = 1, tempo em unidades arbitrárias.  Sem DOM.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.RabiCore = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  /* rotação de v em torno do eixo unitário n pelo ângulo a (Rodrigues) */
  function gira(v, n, a) {
    var c = Math.cos(a), s = Math.sin(a), d = n[0] * v[0] + n[1] * v[1] + n[2] * v[2];
    var x = [n[1] * v[2] - n[2] * v[1], n[2] * v[0] - n[0] * v[2], n[0] * v[1] - n[1] * v[0]];
    return [v[0] * c + x[0] * s + n[0] * d * (1 - c), v[1] * c + x[1] * s + n[1] * d * (1 - c), v[2] * c + x[2] * s + n[2] * d * (1 - c)];
  }
  function eixo(D, O) {
    var W = Math.hypot(D, O);
    return { W: W, n: W > 0 ? [O / W, 0, D / W] : [0, 0, 1] };
  }

  /* vetor de Bloch no instante t.  p = { D, O, w, r0, lab } */
  function bloch(p, t) {
    var e = eixo(p.D, p.O), r = gira(p.r0, e.n, e.W * t);
    return p.lab ? gira(r, [0, 0, 1], p.w * t) : r;
  }
  /* probabilidade de encontrar −z: (1 − r_z)/2.  Não depende do referencial. */
  function pBaixo(p, t) { return (1 - bloch(p, t)[2]) / 2; }
  /* fórmula de Rabi, partindo de +z */
  function rabi(D, O, t) {
    var W2 = D * D + O * O;
    if (W2 === 0) return 0;
    var s = Math.sin(Math.sqrt(W2) * t / 2);
    return O * O / W2 * s * s;
  }

  /* o mesmo, pela função de onda: U(t) = cos(Wt/2) I − i sen(Wt/2) n·σ (referencial girante) */
  function spinor(p, t, psi0) {
    var e = eixo(p.D, p.O), c = Math.cos(e.W * t / 2), s = Math.sin(e.W * t / 2), n = e.n;
    // psi = (a, b) complexos {re, im};  n·σ = [[n_z, n_x − i n_y], [n_x + i n_y, −n_z]]
    var a = psi0[0], b = psi0[1];
    var Na = { re: n[2] * a.re + n[0] * b.re + n[1] * b.im, im: n[2] * a.im + n[0] * b.im - n[1] * b.re };
    var Nb = { re: n[0] * a.re - n[1] * a.im - n[2] * b.re, im: n[0] * a.im + n[1] * a.re - n[2] * b.im };
    // U psi = c psi − i s (n·σ) psi ;  −i (x + iy) = y − i x
    return [{ re: c * a.re + s * Na.im, im: c * a.im - s * Na.re }, { re: c * b.re + s * Nb.im, im: c * b.im - s * Nb.re }];
  }
  /* vetor de Bloch de um spinor: (2 Re(ā b), 2 Im(ā b), |a|² − |b|²) */
  function blochDeSpinor(psi) {
    var a = psi[0], b = psi[1];
    var re = a.re * b.re + a.im * b.im, im = a.re * b.im - a.im * b.re;
    return [2 * re, 2 * im, a.re * a.re + a.im * a.im - b.re * b.re - b.im * b.im];
  }

  var INICIAIS = {
    z: { label: "+z", r0: [0, 0, 1] },
    x: { label: "+x", r0: [1, 0, 0] },
    y: { label: "+y", r0: [0, 1, 0] }
  };

  var PRESETS = {
    larmor: { label: "Precessão livre (Ω = 0), partindo de +x", D: 1, O: 0, ini: "x", lab: false, T: 4 * Math.PI },
    ress:   { label: "Ressonância: Δ = 0", D: 0, O: 1, ini: "z", lab: false, T: 4 * Math.PI },
    fora:   { label: "Fora de ressonância: Δ = 2Ω", D: 2, O: 1, ini: "z", lab: false, T: 4 * Math.PI },
    lab:    { label: "Ressonância vista do laboratório", D: 0, O: 1, ini: "z", lab: true, T: 2 * Math.PI }
  };

  return { gira: gira, eixo: eixo, bloch: bloch, pBaixo: pBaixo, rabi: rabi, spinor: spinor, blochDeSpinor: blochDeSpinor,
           INICIAIS: INICIAIS, PRESETS: PRESETS, W_LAB: 6 };
});
