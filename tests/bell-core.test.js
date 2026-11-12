// Testes do núcleo de Bell–CHSH.  Rodar:  node tests/bell-core.test.js
const B = require("../assets/bell-core.js");
let fails = 0;
const check = (n, ok, i) => { console.log(ok ? "ok   " : "FALHA", n, i === undefined ? "" : i); if (!ok) fails++; };

// 1. E(a,b) = −cos(a − b) sai do formalismo (4×4)
{
  let pior = 0;
  for (let a = 0; a < 6.3; a += 0.37) for (let b = 0; b < 6.3; b += 0.41) pior = Math.max(pior, Math.abs(B.Ematriz(a, b) - B.Equant(a, b)));
  check("⟨ψ⁻|σ_a ⊗ σ_b|ψ⁻⟩ = −cos(a − b)", pior < 1e-12, pior.toExponential(1));
}
// 2. ângulos ótimos: |S| = 2√2 para o singleto, 2 para o modelo local
{
  check("singleto: |S| = 2√2", Math.abs(Math.abs(B.S(B.Equant, B.OTIMO)) - B.TSIRELSON) < 1e-12);
  check("modelo local: |S| = 2", Math.abs(Math.abs(B.S(B.Elocal, B.OTIMO)) - 2) < 1e-12);
}
// 3. o modelo local nunca passa de 2, o singleto nunca passa de 2√2 (ângulos ao acaso)
{
  const r = B.rng(5); let ml = 0, mq = 0;
  for (let i = 0; i < 20000; i++) {
    const A = { a: 7 * r(), a2: 7 * r(), b: 7 * r(), b2: 7 * r() };
    ml = Math.max(ml, Math.abs(B.S(B.Elocal, A))); mq = Math.max(mq, Math.abs(B.S(B.Equant, A)));
  }
  check("local: max |S| ≤ 2", ml <= 2 + 1e-12, ml.toFixed(6));
  check("singleto: max |S| ≤ 2√2", mq <= B.TSIRELSON + 1e-12, mq.toFixed(6));
}
// 4. o dente de serra é a média do modelo local
{
  const r = B.rng(9), N = 200000; let pior = 0;
  for (const [a, b] of [[0, 0.4], [0.3, 2.1], [1, 4]]) { let s = 0; for (let i = 0; i < N; i++) { const p = B.parLocal(a, b, r); s += p[0] * p[1]; } pior = Math.max(pior, Math.abs(s / N - B.Elocal(a, b))); }
  check("modelo local: sorteio bate com −(1 − 2θ/π)", pior < 0.01, pior.toFixed(4));
}
// 5. sorteio quântico: correlações certas e marginais meio a meio (nada de sinal)
{
  const r = B.rng(11), N = 200000; let pior = 0, marg = 0;
  for (const [a, b] of [[0, 0.4], [0.3, 2.1], [1, 4]]) {
    let s = 0, m = 0; for (let i = 0; i < N; i++) { const p = B.parQuantico(a, b, r); s += p[0] * p[1]; m += p[0]; }
    pior = Math.max(pior, Math.abs(s / N - B.Equant(a, b))); marg = Math.max(marg, Math.abs(m / N));
  }
  check("singleto: sorteio bate com −cos", pior < 0.01, pior.toFixed(4));
  check("singleto: Alice vê meio a meio", marg < 0.01, marg.toFixed(4));
  const E = B.experimento(B.OTIMO, 50000, "quant", r);
  check("experimento nos ângulos ótimos passa de 2", Math.abs(E.S) > 2.7, E.S.toFixed(3));
}
console.log(fails ? `\n${fails} falha(s)` : "\ntodos os testes passaram");
process.exit(fails ? 1 : 0);
