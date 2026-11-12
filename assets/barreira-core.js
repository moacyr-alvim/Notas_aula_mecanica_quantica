/* Núcleo da página de barreiras.  ħ = m = 1.  Potencial constante por pedaços:
 *   pontos de corte x_1 < … < x_n e valores V_0, …, V_n (n + 1 regiões).
 * Em cada região ψ = A e^{ikx} + B e^{−ikx}, com k = √(2(E − V)) (imaginário puro se E < V).
 * Onda incidente pela esquerda: na última região só há a onda transmitida (A = t, B = 0).
 * Casando ψ e ψ' em cada corte, da direita para a esquerda, sai tudo:
 *   r = B_0/A_0,  t = 1/A_0,  R = |r|²,  T = (k_n/k_0)|t|² (zero se k_n for imaginário).
 * Sem DOM: roda no Node (testes).
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.BarreiraCore = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  function C(re, im) { return { re: re, im: im || 0 }; }
  function add(a, b) { return C(a.re + b.re, a.im + b.im); }
  function sub(a, b) { return C(a.re - b.re, a.im - b.im); }
  function mul(a, b) { return C(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re); }
  function div(a, b) { var d = b.re * b.re + b.im * b.im; return C((a.re * b.re + a.im * b.im) / d, (a.im * b.re - a.re * b.im) / d); }
  function sc(a, s) { return C(a.re * s, a.im * s); }
  function cexp(z) { var e = Math.exp(z.re); return C(e * Math.cos(z.im), e * Math.sin(z.im)); }
  function abs2(z) { return z.re * z.re + z.im * z.im; }
  var I = C(0, 1);

  /* k = √(2(E − V)): real se E > V, i·κ se E < V */
  function numeroDeOnda(E, V) {
    var d = 2 * (E - V);
    if (Math.abs(d) < 1e-12) d = d >= 0 ? 1e-12 : -1e-12;   // evita k = 0 (solução afim)
    return d > 0 ? C(Math.sqrt(d), 0) : C(0, Math.sqrt(-d));
  }

  /* pot = { cortes: [x_1..x_n], valores: [V_0..V_n] } */
  function resolve(pot, E) {
    var n = pot.cortes.length, ks = pot.valores.map(function (V) { return numeroDeOnda(E, V); });
    var A = new Array(n + 1), B = new Array(n + 1);
    A[n] = C(1, 0); B[n] = C(0, 0);
    for (var j = n - 1; j >= 0; j--) {
      var x = pot.cortes[j], kR = ks[j + 1], kL = ks[j];
      var eR = cexp(mul(I, sc(kR, x))), eRm = cexp(mul(I, sc(kR, -x)));
      var psi = add(mul(A[j + 1], eR), mul(B[j + 1], eRm));
      var dpsi = mul(mul(I, kR), sub(mul(A[j + 1], eR), mul(B[j + 1], eRm)));
      var q = div(dpsi, mul(I, kL));                         // ψ'/(i k_L)
      A[j] = div(sc(add(psi, q), 0.5), cexp(mul(I, sc(kL, x))));
      B[j] = div(sc(sub(psi, q), 0.5), cexp(mul(I, sc(kL, -x))));
    }
    // normaliza para a onda incidente ter amplitude 1
    var a0 = A[0];
    for (j = 0; j <= n; j++) { A[j] = div(A[j], a0); B[j] = div(B[j], a0); }
    var k0 = ks[0], kn = ks[n];
    var T = kn.re > 0 ? (kn.re / k0.re) * abs2(A[n]) : 0, R = abs2(B[0]);
    return { A: A, B: B, ks: ks, T: T, R: R };
  }

  function regiao(pot, x) { var j = 0; while (j < pot.cortes.length && x >= pot.cortes[j]) j++; return j; }
  function V(pot, x) { return pot.valores[regiao(pot, x)]; }
  function psi(sol, pot, x) {
    var j = regiao(pot, x), k = sol.ks[j];
    return add(mul(sol.A[j], cexp(mul(I, sc(k, x)))), mul(sol.B[j], cexp(mul(I, sc(k, -x)))));
  }

  /* potenciais prontos: V0 = altura, a = largura */
  var PRESETS = {
    barreira: { label: "Barreira retangular", pot: function (V0, a) { return { cortes: [0, a], valores: [0, V0, 0] }; } },
    degrau:   { label: "Degrau", pot: function (V0) { return { cortes: [0], valores: [0, V0] }; } },
    poco:     { label: "Poço (V = −V₀)", pot: function (V0, a) { return { cortes: [0, a], valores: [0, -V0, 0] }; } },
    dupla:    { label: "Barreira dupla", pot: function (V0, a) { return { cortes: [0, a, a + 3, 2 * a + 3], valores: [0, V0, 0, V0, 0] }; } }
  };

  /* fórmulas fechadas, para os testes */
  function Tbarreira(E, V0, a) {
    if (E < V0) { var k = Math.sqrt(2 * (V0 - E)), s = Math.sinh(k * a); return 1 / (1 + V0 * V0 * s * s / (4 * E * (V0 - E))); }
    if (E > V0) { var q = Math.sqrt(2 * (E - V0)), sn = Math.sin(q * a); return 1 / (1 + V0 * V0 * sn * sn / (4 * E * (E - V0))); }
    return 1 / (1 + V0 * a * a / 2);
  }
  function Rdegrau(E, V0) {
    if (E <= V0) return 1;
    var k1 = Math.sqrt(2 * E), k2 = Math.sqrt(2 * (E - V0));
    return Math.pow((k1 - k2) / (k1 + k2), 2);
  }

  /* picos de T(E) em (0, Emax]: máximos locais de uma grade grossa, refinados por razão áurea.
     Ressonâncias estreitas (largura muito menor que o passo da grade) aparecem como máximos
     locais da grade por causa das caudas lorentzianas, e o refinamento acha o topo. */
  function picos(pot, Emax, N) {
    N = N || 1200;
    var h = Emax / N, Ts = [], i, out = [];
    for (i = 1; i <= N; i++) Ts.push(resolve(pot, i * h).T);
    for (i = 1; i < N - 1; i++) {
      if (!(Ts[i] > Ts[i - 1] && Ts[i] >= Ts[i + 1])) continue;
      var a = i * h, b = (i + 2) * h, g = (Math.sqrt(5) - 1) / 2;
      var c = b - g * (b - a), d = a + g * (b - a), fc = resolve(pot, c).T, fd = resolve(pot, d).T;
      for (var k = 0; k < 80 && b - a > 1e-12; k++) {
        if (fc > fd) { b = d; d = c; fd = fc; c = b - g * (b - a); fc = resolve(pot, c).T; }
        else { a = c; c = d; fc = fd; d = a + g * (b - a); fd = resolve(pot, d).T; }
      }
      var E = (a + b) / 2;
      out.push({ E: E, T: resolve(pot, E).T });
    }
    return out;
  }

  return { resolve: resolve, psi: psi, V: V, regiao: regiao, PRESETS: PRESETS, Tbarreira: Tbarreira, Rdegrau: Rdegrau, picos: picos };
});
