/* Núcleo da página da partícula livre.  ħ = m = 1.  Pacote gaussiano:
 *
 *   ψ(x,0) = (2πσ²)^(−1/4) exp(−(x−x₀)²/(4σ²) + i k₀ (x − x₀)),
 *   ψ(x,t) = (2πσ²)^(−1/4) √(σ²/s) exp(−(x − x₀ − k₀t)²/(4s) + i k₀ (x − x₀) − i k₀² t/2),
 *   s = σ² + i t/2.
 *
 * |ψ|² é uma gaussiana com centro x₀ + k₀t e desvio σ(t) = σ √(1 + (t/2σ²)²).  Sem DOM.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.PacoteCore = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  /* aritmética complexa mínima */
  function C(re, im) { return { re: re, im: im || 0 }; }
  function mul(a, b) { return C(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re); }
  function div(a, b) { var d = b.re * b.re + b.im * b.im; return C((a.re * b.re + a.im * b.im) / d, (a.im * b.re - a.re * b.im) / d); }
  function cexp(z) { var e = Math.exp(z.re); return C(e * Math.cos(z.im), e * Math.sin(z.im)); }
  function csqrt(z) { var r = Math.hypot(z.re, z.im), a = Math.atan2(z.im, z.re) / 2, q = Math.sqrt(r); return C(q * Math.cos(a), q * Math.sin(a)); }

  /* p = { sigma, k0, x0 } */
  function psi(p, x, t) {
    var s2 = p.sigma * p.sigma, s = C(s2, t / 2), y = x - p.x0 - p.k0 * t;
    var N = Math.pow(2 * Math.PI * s2, -0.25);
    var pref = mul(C(N, 0), csqrt(div(C(s2, 0), s)));
    var expo = div(C(-y * y, 0), mul(C(4, 0), s));                // −y²/(4s)
    expo.im += p.k0 * (x - p.x0) - p.k0 * p.k0 * t / 2;
    return mul(pref, cexp(expo));
  }
  function largura(p, t) { var s2 = p.sigma * p.sigma; return p.sigma * Math.sqrt(1 + Math.pow(t / (2 * s2), 2)); }
  function centro(p, t) { return p.x0 + p.k0 * t; }
  /* Δp = 1/(2σ), constante: o momento de uma partícula livre se conserva */
  function dp(p) { return 1 / (2 * p.sigma); }
  /* densidade de momento |φ(k)|² */
  function densK(p, k) { var s2 = p.sigma * p.sigma; return Math.sqrt(2 * s2 / Math.PI) * Math.exp(-2 * s2 * (k - p.k0) * (k - p.k0)); }

  /* conferência: ψ(x,t) = (2π)^(−1/2) ∫ φ(k) e^{i(kx − k²t/2)} dk, por quadratura (só nos testes) */
  function psiQuadratura(p, x, t, M) {
    M = M || 4000;
    var s2 = p.sigma * p.sigma, dk0 = 1 / (2 * p.sigma), a = p.k0 - 10 * dk0, b = p.k0 + 10 * dk0, h = (b - a) / M;
    var amp = Math.pow(2 * s2 / Math.PI, 0.25), re = 0, im = 0;
    for (var i = 0; i <= M; i++) {
      var k = a + i * h, w = (i === 0 || i === M) ? 0.5 : 1;
      // φ(k) = amp · exp(−σ²(k−k₀)² − i k x₀) · e^{i k₀ x₀}  (a fase e^{−i k₀ x₀} de ψ(x,0) fica fora)
      var mod = amp * Math.exp(-s2 * (k - p.k0) * (k - p.k0));
      var fase = k * (x - p.x0) - k * k * t / 2;
      re += w * mod * Math.cos(fase); im += w * mod * Math.sin(fase);
    }
    var f = h / Math.sqrt(2 * Math.PI);
    return C(re * f, im * f);
  }

  return { psi: psi, largura: largura, centro: centro, dp: dp, densK: densK, psiQuadratura: psiQuadratura,
           X0: -5, XMIN: -12, XMAX: 40, TMAX: 12 };
});
