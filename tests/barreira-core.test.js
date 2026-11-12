// Testes do núcleo das barreiras.  Rodar:  node tests/barreira-core.test.js
const B = require("../assets/barreira-core.js");
let fails = 0;
const check = (n, ok, i) => { console.log(ok ? "ok   " : "FALHA", n, i === undefined ? "" : i); if (!ok) fails++; };

// 1. T + R = 1 em todo potencial e toda energia
{
  let pior = 0;
  for (const k of Object.keys(B.PRESETS)) for (const V0 of [0.5, 1, 3]) for (const a of [0.3, 1, 2.5]) for (let E = 0.03; E < 6; E += 0.137) {
    const s = B.resolve(B.PRESETS[k].pot(V0, a), E); pior = Math.max(pior, Math.abs(s.T + s.R - 1));
  }
  check("T + R = 1", pior < 1e-9, pior.toExponential(1));
}
// 2. barreira contra a fórmula fechada, abaixo e acima de V0
{
  let pior = 0;
  for (const V0 of [0.5, 1, 3]) for (const a of [0.3, 1, 2.5]) for (let E = 0.05; E < 6; E += 0.111) {
    if (Math.abs(E - V0) < 1e-3) continue;
    pior = Math.max(pior, Math.abs(B.resolve(B.PRESETS.barreira.pot(V0, a), E).T - B.Tbarreira(E, V0, a)));
  }
  check("barreira: T bate com a fórmula", pior < 1e-9, pior.toExponential(1));
}
// 3. degrau: R = ((k1 − k2)/(k1 + k2))² acima, R = 1 abaixo
{
  let pior = 0;
  for (const V0 of [0.5, 2]) for (let E = 0.05; E < 6; E += 0.17) pior = Math.max(pior, Math.abs(B.resolve(B.PRESETS.degrau.pot(V0), E).R - B.Rdegrau(E, V0)));
  check("degrau: R bate com a fórmula", pior < 1e-9, pior.toExponential(1));
}
// 4. transparência: T = 1 quando q a = nπ (barreira acima de V0 e poço)
{
  const V0 = 1, a = 1.5, E1 = V0 + Math.pow(Math.PI / a, 2) / 2;
  check("barreira transparente em qa = π", Math.abs(B.resolve(B.PRESETS.barreira.pot(V0, a), E1).T - 1) < 1e-9);
  const Vp = 2, ap = 3, E2 = Math.pow(2 * Math.PI / ap, 2) / 2 - Vp;
  check("poço transparente em qa = 2π", Math.abs(B.resolve(B.PRESETS.poco.pot(Vp, ap), E2).T - 1) < 1e-9, E2.toFixed(4));
}
// 5. tunelamento ressonante: a barreira dupla chega a T ≈ 1 abaixo de V0, com cada barreira deixando passar pouco
{
  let mx = 0, Em = 0;
  // V0 = 1 e a = 1,5 (os valores iniciais da demo): a ressonância mais baixa é estreita, perto de E = 0,24
  for (let E = 0.01; E < 0.6; E += 1e-5) { const T = B.resolve(B.PRESETS.dupla.pot(1, 1.5), E).T; if (T > mx) { mx = T; Em = E; } }
  const sozinha = B.resolve(B.PRESETS.barreira.pot(1, 1.5), Em).T;
  check("barreira dupla: T > 0,999 numa ressonância abaixo de V0", mx > 0.999, `T = ${mx.toFixed(5)} em E = ${Em.toFixed(4)}`);
  check("… onde uma barreira só deixa passar menos de 10%", sozinha < 0.1, sozinha.toFixed(3));
}
// 6. ψ e ψ' contínuas nos cortes
{
  let pior = 0; const e = 1e-7;
  for (const k of Object.keys(B.PRESETS)) {
    const pot = B.PRESETS[k].pot(1.3, 1.2), s = B.resolve(pot, 0.77);
    for (const x of pot.cortes) {
      const f = (y) => B.psi(s, pot, y), a = f(x - e), b = f(x + e);
      const da = { re: (f(x - e).re - f(x - 3 * e).re) / (2 * e), im: (f(x - e).im - f(x - 3 * e).im) / (2 * e) };
      const db = { re: (f(x + 3 * e).re - f(x + e).re) / (2 * e), im: (f(x + 3 * e).im - f(x + e).im) / (2 * e) };
      pior = Math.max(pior, Math.hypot(a.re - b.re, a.im - b.im), Math.hypot(da.re - db.re, da.im - db.im) * 1e-2);
    }
  }
  check("ψ e ψ' contínuas", pior < 1e-4, pior.toExponential(1));
}
console.log(fails ? `\n${fails} falha(s)` : "\ntodos os testes passaram");
process.exit(fails ? 1 : 0);
