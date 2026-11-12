/* Núcleo da página do oscilador harmônico.  ħ = m = ω = 1:  H = (p² + x²)/2 = a†a + ½.
 *
 *   ψ_n(x) pelas funções de Hermite normalizadas (recorrência estável):
 *     ψ_0 = π^(−1/4) e^(−x²/2),  ψ_{n+1} = √(2/(n+1)) x ψ_n − √(n/(n+1)) ψ_{n−1}
 *   ψ(x,t) = Σ c_n ψ_n(x) e^{−i(n+½)t}
 *   médias pelos operadores escada: ⟨a⟩ = Σ √(n+1) c̄_n c_{n+1},  x = (a + a†)/√2,  p = i(a† − a)/√2.
 * Sem DOM: roda no Node (testes).
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.OscCore = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  var NMAX = 70;

  /* [ψ_0(x), …, ψ_n(x)] */
  function hermite(n, x) {
    var out = [Math.pow(Math.PI, -0.25) * Math.exp(-x * x / 2)];
    if (n >= 1) out.push(Math.SQRT2 * x * out[0]);
    for (var k = 1; k < n; k++) out.push(Math.sqrt(2 / (k + 1)) * x * out[k] - Math.sqrt(k / (k + 1)) * out[k - 1]);
    return out;
  }

  /* coeficientes: lista de {re, im}, normalizada */
  function normaliza(c) {
    var s = 0; c.forEach(function (z) { s += z.re * z.re + z.im * z.im; }); s = Math.sqrt(s);
    return c.map(function (z) { return { re: z.re / s, im: z.im / s }; });
  }
  function vazio() { var c = []; for (var k = 0; k <= NMAX; k++) c.push({ re: 0, im: 0 }); return c; }
  function autoestado(n) { var c = vazio(); c[n].re = 1; return c; }
  function superposicao() { var c = vazio(); c[0].re = c[1].re = Math.SQRT1_2; return c; }
  /* estado coerente |α⟩, α real: c_n = e^{−α²/2} α^n / √(n!) */
  function coerente(alpha) {
    var c = vazio(), t = Math.exp(-alpha * alpha / 2);
    for (var k = 0; k <= NMAX; k++) { c[k].re = t; t *= alpha / Math.sqrt(k + 1); }
    return normaliza(c);
  }
  /* "gato": |α⟩ + |−α⟩ (só os n pares sobrevivem) */
  function gato(alpha) {
    var a = coerente(alpha), b = coerente(-alpha);
    return normaliza(a.map(function (z, k) { return { re: z.re + b[k].re, im: 0 }; }));
  }

  function evolui(c, t) {
    return c.map(function (z, k) {
      var f = -(k + 0.5) * t, co = Math.cos(f), si = Math.sin(f);
      return { re: z.re * co - z.im * si, im: z.re * si + z.im * co };
    });
  }
  function ultimo(c) { var m = 0; c.forEach(function (z, k) { if (z.re * z.re + z.im * z.im > 1e-14) m = k; }); return m; }
  function psi(c, x, t) {
    var ct = evolui(c, t), n = ultimo(c), h = hermite(n, x), re = 0, im = 0;
    for (var k = 0; k <= n; k++) { re += ct[k].re * h[k]; im += ct[k].im * h[k]; }
    return { re: re, im: im };
  }

  /* ⟨a⟩, ⟨a²⟩, ⟨N⟩ no instante t */
  function escada(c, t) {
    var ct = evolui(c, t), a = { re: 0, im: 0 }, a2 = { re: 0, im: 0 }, N = 0;
    for (var k = 0; k < ct.length; k++) {
      var z = ct[k]; N += k * (z.re * z.re + z.im * z.im);
      if (k + 1 < ct.length) { var w = ct[k + 1], s = Math.sqrt(k + 1); a.re += s * (z.re * w.re + z.im * w.im); a.im += s * (z.re * w.im - z.im * w.re); }
      if (k + 2 < ct.length) { var u = ct[k + 2], s2 = Math.sqrt((k + 1) * (k + 2)); a2.re += s2 * (z.re * u.re + z.im * u.im); a2.im += s2 * (z.re * u.im - z.im * u.re); }
    }
    return { a: a, a2: a2, N: N };
  }
  function medias(c, t) {
    var e = escada(c, t), x = Math.SQRT2 * e.a.re, p = Math.SQRT2 * e.a.im;
    var x2 = e.a2.re + e.N + 0.5, p2 = -e.a2.re + e.N + 0.5, xp = e.a2.im;   // xp = ⟨(xp + px)/2⟩
    return { x: x, p: p, dx: Math.sqrt(Math.max(0, x2 - x * x)), dp: Math.sqrt(Math.max(0, p2 - p * p)), cov: xp - x * p, E: e.N + 0.5 };
  }
  /* densidade clássica de posição, energia E: 1/(π√(2E − x²)) */
  function classica(E, x) { var d = 2 * E - x * x; return d > 0 ? 1 / (Math.PI * Math.sqrt(d)) : 0; }

  var ESTADOS = {
    auto: { label: "Autoestado |n⟩" },
    sup:  { label: "Superposição de |0⟩ e |1⟩" },
    coer: { label: "Estado coerente |α⟩" },
    gato: { label: "Gato: |α⟩ + |−α⟩" }
  };
  function estado(tipo, n, alpha) {
    if (tipo === "auto") return autoestado(n);
    if (tipo === "sup") return superposicao();
    if (tipo === "coer") return coerente(alpha);
    return gato(Math.max(alpha, 0.05));
  }

  return { NMAX: NMAX, hermite: hermite, autoestado: autoestado, superposicao: superposicao, coerente: coerente, gato: gato,
           evolui: evolui, psi: psi, medias: medias, classica: classica, ESTADOS: ESTADOS, estado: estado };
});
