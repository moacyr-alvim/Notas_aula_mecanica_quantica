// Testes do núcleo da evolução (precessão e Rabi).  Rodar:  node tests/rabi-core.test.js
const R = require("../assets/rabi-core.js");
let fails = 0;
const check = (n, ok, i) => { console.log(ok ? "ok   " : "FALHA", n, i === undefined ? "" : i); if (!ok) fails++; };
const norma = (v) => Math.hypot(v[0], v[1], v[2]);
const up = [{ re: 1, im: 0 }, { re: 0, im: 0 }];

// 1. o vetor de Bloch continua unitário
{
  let pior = 0;
  for (const D of [0, 0.7, -2]) for (const O of [0, 1, 2.5]) for (const lab of [false, true]) for (let t = 0; t < 12; t += 0.37)
    pior = Math.max(pior, Math.abs(norma(R.bloch({ D, O, w: R.W_LAB, r0: [0, 0, 1], lab }, t)) - 1));
  check("|r(t)| = 1", pior < 1e-12, pior.toExponential(1));
}
// 2. a rotação de Bloch é a mesma coisa que U(t) aplicado ao spinor
{
  let pior = 0;
  for (const D of [0, 0.7, -2]) for (const O of [0, 1, 2.5]) for (let t = 0; t < 12; t += 0.41) {
    const a = R.bloch({ D, O, w: 0, r0: [0, 0, 1], lab: false }, t), b = R.blochDeSpinor(R.spinor({ D, O }, t, up));
    pior = Math.max(pior, Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]));
  }
  check("Rodrigues = e^{−iHt} no spinor", pior < 1e-12, pior.toExponential(1));
}
// 3. a fórmula de Rabi
{
  let pior = 0;
  for (const D of [0, 0.5, 2]) for (const O of [0.3, 1, 2]) for (let t = 0; t < 12; t += 0.29)
    pior = Math.max(pior, Math.abs(R.pBaixo({ D, O, w: 0, r0: [0, 0, 1], lab: false }, t) - R.rabi(D, O, t)));
  check("P(−z) = Ω²/W² sen²(Wt/2)", pior < 1e-12, pior.toExponential(1));
}
// 4. pulso π em ressonância vira o spin; fora de ressonância nunca vira por inteiro
{
  const p = R.pBaixo({ D: 0, O: 1.3, w: 0, r0: [0, 0, 1], lab: false }, Math.PI / 1.3);
  check("pulso π: P(−z) = 1", Math.abs(p - 1) < 1e-12, p);
  let mx = 0; for (let t = 0; t < 20; t += 0.001) mx = Math.max(mx, R.pBaixo({ D: 2, O: 1, w: 0, r0: [0, 0, 1], lab: false }, t));
  check("Δ = 2Ω: máximo de P(−z) = 1/5", Math.abs(mx - 0.2) < 1e-6, mx.toFixed(7));
}
// 5. no laboratório, sem campo girante, a precessão é em ω₀ = Δ + ω
{
  const w = R.W_LAB, D = 0.8, t = 1.234, r = R.bloch({ D, O: 0, w, r0: [1, 0, 0], lab: true }, t);
  const ang = Math.atan2(r[1], r[0]), esperado = ((D + w) * t) % (2 * Math.PI);
  const d = Math.abs(((ang - esperado + 3 * Math.PI) % (2 * Math.PI)) - Math.PI);
  check("precessão de Larmor no laboratório a ω₀", d < 1e-12, d.toExponential(1));
  const ok = [0, 0.5, 2.2, 5].every((s) => Math.abs(R.pBaixo({ D: 0.3, O: 1, w, r0: [0, 0, 1], lab: true }, s) - R.pBaixo({ D: 0.3, O: 1, w, r0: [0, 0, 1], lab: false }, s)) < 1e-12);
  check("P(−z) não depende do referencial", ok);
}
// 6. o eixo n e o sentido da rotação: H = (W/2) n·σ gira r em torno de n no sentido da mão direita
{
  const r = R.bloch({ D: 1, O: 0, w: 0, r0: [1, 0, 0], lab: false }, 0.01);
  check("com H = (Δ/2)σ_z e Δ > 0, +x anda para +y", r[1] > 0, r[1].toFixed(5));
}
console.log(fails ? `\n${fails} falha(s)` : "\ntodos os testes passaram");
process.exit(fails ? 1 : 0);
