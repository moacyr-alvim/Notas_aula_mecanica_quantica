/* Núcleo da página de emaranhamento: o par no singleto, medido em direções de um plano.
 *
 *   quântico:  P(resultados iguais) = sen²((a−b)/2),  E(a, b) = −cos(a − b)
 *   modelo local (variável oculta λ uniforme no círculo):
 *              A = sinal(cos(a − λ)),  B = −sinal(cos(b − λ)),  E = −(1 − 2|a − b|/π), com |a − b| em [0, π]
 *   CHSH:      S = E(a,b) − E(a,b') + E(a',b) + E(a',b');  |S| ≤ 2 em qualquer modelo local.
 * Ângulos em radianos.  Sem DOM: roda no Node (testes).
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.BellCore = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  var PI = Math.PI;

  function dif(a, b) { var d = Math.abs(a - b) % (2 * PI); return d > PI ? 2 * PI - d : d; }   // em [0, π]
  function Equant(a, b) { return -Math.cos(a - b); }
  function Elocal(a, b) { return -(1 - 2 * dif(a, b) / PI); }
  function S(E, ang) { return E(ang.a, ang.b) - E(ang.a, ang.b2) + E(ang.a2, ang.b) + E(ang.a2, ang.b2); }

  function rng(seed) {
    var s = seed >>> 0;
    return function () {
      s = (s + 0x6D2B79F5) >>> 0; var t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function sinal(v) { return v >= 0 ? 1 : -1; }

  /* um par medido nos ângulos (a, b): devolve [A, B] em ±1 */
  function parQuantico(a, b, r) {
    var A = r() < 0.5 ? 1 : -1, s = Math.sin((a - b) / 2);
    var B = r() < s * s ? A : -A;
    return [A, B];
  }
  function parLocal(a, b, r) {
    var lam = 2 * PI * r();
    return [sinal(Math.cos(a - lam)), -sinal(Math.cos(b - lam))];
  }

  /* N pares para cada um dos quatro pares de ajustes; devolve as correlações estimadas e S */
  function experimento(ang, N, modelo, r) {
    var gera = modelo === "local" ? parLocal : parQuantico, E = {}, chaves = [["ab", ang.a, ang.b], ["ab2", ang.a, ang.b2], ["a2b", ang.a2, ang.b], ["a2b2", ang.a2, ang.b2]];
    chaves.forEach(function (c) { var s = 0; for (var i = 0; i < N; i++) { var p = gera(c[1], c[2], r); s += p[0] * p[1]; } E[c[0]] = s / N; });
    E.S = E.ab - E.ab2 + E.a2b + E.a2b2;
    return E;
  }

  /* o mesmo pelo formalismo: ⟨ψ|σ_a ⊗ σ_b|ψ⟩ com matrizes 4×4 (só nos testes).
     σ_θ = cos θ σ_z + sen θ σ_x (direção no plano x–z); singleto (|↑↓⟩ − |↓↑⟩)/√2 */
  function Ematriz(a, b) {
    var sa = [[Math.cos(a), Math.sin(a)], [Math.sin(a), -Math.cos(a)]], sb = [[Math.cos(b), Math.sin(b)], [Math.sin(b), -Math.cos(b)]];
    var psi = [0, Math.SQRT1_2, -Math.SQRT1_2, 0], v = [0, 0, 0, 0], i, j, k, l;
    for (i = 0; i < 2; i++) for (k = 0; k < 2; k++) for (j = 0; j < 2; j++) for (l = 0; l < 2; l++) v[2 * i + k] += sa[i][j] * sb[k][l] * psi[2 * j + l];
    return psi[0] * v[0] + psi[1] * v[1] + psi[2] * v[2] + psi[3] * v[3];
  }

  var OTIMO = { a: 0, a2: PI / 2, b: PI / 4, b2: 3 * PI / 4 };

  return { Equant: Equant, Elocal: Elocal, S: S, rng: rng, parQuantico: parQuantico, parLocal: parLocal, experimento: experimento,
           Ematriz: Ematriz, dif: dif, OTIMO: OTIMO, TSIRELSON: 2 * Math.SQRT2 };
});
