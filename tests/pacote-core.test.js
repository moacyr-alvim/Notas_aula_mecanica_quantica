// Testes do núcleo da partícula livre.  Rodar:  node tests/pacote-core.test.js
const P = require("../assets/pacote-core.js");
let fails = 0;
const check = (n, ok, i) => { console.log(ok ? "ok   " : "FALHA", n, i === undefined ? "" : i); if (!ok) fails++; };
const par = { sigma: 0.8, k0: 2, x0: -3 };
const mom = (p, t) => {
  let m0 = 0, m1 = 0, m2 = 0; const a = -60, b = 80, M = 28000, h = (b - a) / M;
  for (let i = 0; i <= M; i++) { const x = a + i * h, z = P.psi(p, x, t), d = (z.re * z.re + z.im * z.im) * h; m0 += d; m1 += x * d; m2 += x * x * d; }
  return { n: m0, c: m1 / m0, w: Math.sqrt(m2 / m0 - (m1 / m0) ** 2) };
};
// 1. norma, centro e largura
for (const t of [0, 1, 4, 9]) {
  const m = mom(par, t);
  check(`t = ${t}: ∫|ψ|² = 1`, Math.abs(m.n - 1) < 1e-6, m.n.toFixed(8));
  check(`t = ${t}: centro em x₀ + k₀t`, Math.abs(m.c - P.centro(par, t)) < 1e-5, m.c.toFixed(6));
  check(`t = ${t}: largura σ√(1 + (t/2σ²)²)`, Math.abs(m.w - P.largura(par, t)) < 1e-5, m.w.toFixed(6));
}
// 2. a fórmula fechada é a integral de Fourier
{
  let pior = 0;
  for (const t of [0, 0.7, 3.1]) for (let x = -8; x <= 12; x += 0.53) {
    const a = P.psi(par, x, t), b = P.psiQuadratura(par, x, t);
    pior = Math.max(pior, Math.hypot(a.re - b.re, a.im - b.im));
  }
  check("fórmula fechada = ∫ φ(k) e^{i(kx − k²t/2)} dk", pior < 1e-9, pior.toExponential(1));
}
// 3. resolve i ψ_t = −ψ_xx/2 (diferenças finitas)
{
  let pior = 0; const h = 1e-3, dt = 1e-4;
  for (const t of [0.5, 2]) for (let x = -6; x <= 8; x += 0.7) {
    const p = (s, y) => P.psi(par, y, s);
    const pt = { re: (p(t + dt, x).re - p(t - dt, x).re) / (2 * dt), im: (p(t + dt, x).im - p(t - dt, x).im) / (2 * dt) };
    const pxx = { re: (p(t, x + h).re - 2 * p(t, x).re + p(t, x - h).re) / (h * h), im: (p(t, x + h).im - 2 * p(t, x).im + p(t, x - h).im) / (h * h) };
    // i ψ_t = (−ψ_t.im, ψ_t.re);  −ψ_xx/2
    pior = Math.max(pior, Math.hypot(-pt.im + pxx.re / 2, pt.re + pxx.im / 2));
  }
  check("a equação de Schrödinger livre", pior < 1e-4, pior.toExponential(1));
}
// 4. a distribuição de momento é normalizada e tem Δk = 1/(2σ)
{
  let m0 = 0, m2 = 0; const h = 1e-3;
  for (let k = par.k0 - 8; k <= par.k0 + 8; k += h) { const d = P.densK(par, k) * h; m0 += d; m2 += (k - par.k0) ** 2 * d; }
  check("∫|φ(k)|² = 1 e Δk = 1/(2σ)", Math.abs(m0 - 1) < 1e-6 && Math.abs(Math.sqrt(m2) - P.dp(par)) < 1e-6, `${m0.toFixed(7)} ${Math.sqrt(m2).toFixed(6)}`);
}
console.log(fails ? `\n${fails} falha(s)` : "\ntodos os testes passaram");
process.exit(fails ? 1 : 0);
