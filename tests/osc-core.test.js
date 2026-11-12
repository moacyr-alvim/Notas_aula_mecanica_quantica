// Testes do núcleo do oscilador.  Rodar:  node tests/osc-core.test.js
const O = require("../assets/osc-core.js");
let fails = 0;
const check = (n, ok, i) => { console.log(ok ? "ok   " : "FALHA", n, i === undefined ? "" : i); if (!ok) fails++; };
const integra = (f, a = -12, b = 12, M = 6000) => { let s = 0; const h = (b - a) / M; for (let i = 0; i <= M; i++) s += (i === 0 || i === M ? 0.5 : 1) * f(a + i * h); return s * h; };

// 1. ψ_n ortonormais
{
  let pior = 0;
  for (const [a, b] of [[0, 0], [3, 3], [0, 2], [5, 6], [12, 12], [7, 9], [30, 30]])
    pior = Math.max(pior, Math.abs(integra((x) => { const h = O.hermite(Math.max(a, b), x); return h[a] * h[b]; }) - (a === b ? 1 : 0)));
  check("ψ_n ortonormais", pior < 1e-9, pior.toExponential(1));
}
// 2. −ψ''/2 + x²ψ/2 = (n + ½)ψ
{
  let pior = 0; const h = 1e-3;
  for (const n of [0, 1, 4, 10]) for (let x = -4; x <= 4; x += 0.31) {
    const f = (y) => O.hermite(n, y)[n];
    pior = Math.max(pior, Math.abs(-(f(x + h) - 2 * f(x) + f(x - h)) / (2 * h * h) + x * x * f(x) / 2 - (n + 0.5) * f(x)));
  }
  check("equação de autovalores", pior < 1e-5, pior.toExponential(1));
}
// 3. estado coerente: ⟨x⟩ = √2 α cos t, ⟨p⟩ = −√2 α sen t, Δx = Δp = 1/√2
{
  const al = 1.7, c = O.coerente(al); let pior = 0, pd = 0;
  for (let t = 0; t < 7; t += 0.23) {
    const m = O.medias(c, t);
    pior = Math.max(pior, Math.abs(m.x - Math.SQRT2 * al * Math.cos(t)), Math.abs(m.p + Math.SQRT2 * al * Math.sin(t)));
    pd = Math.max(pd, Math.abs(m.dx - Math.SQRT1_2), Math.abs(m.dp - Math.SQRT1_2), Math.abs(m.cov));
  }
  check("coerente: médias seguem a órbita clássica", pior < 1e-10, pior.toExponential(1));
  check("coerente: Δx = Δp = 1/√2 e covariância zero, sempre", pd < 1e-10, pd.toExponential(1));
}
// 4. as médias pelos operadores escada batem com as integrais de ψ(x,t)
{
  let pior = 0;
  for (const c of [O.superposicao(), O.gato(1.5), O.coerente(2.2), O.autoestado(4)]) for (const t of [0, 0.9, 2.5]) {
    const m = O.medias(c, t), rho = (x) => { const z = O.psi(c, x, t); return z.re * z.re + z.im * z.im; };
    const n = integra(rho), x1 = integra((x) => x * rho(x)), x2 = integra((x) => x * x * rho(x));
    pior = Math.max(pior, Math.abs(n - 1), Math.abs(x1 - m.x), Math.abs(Math.sqrt(x2 - x1 * x1) - m.dx));
  }
  check("⟨x⟩ e Δx por escada = por integral", pior < 1e-8, pior.toExponential(1));
}
// 5. autoestado: Δx Δp = n + ½ e nada se mexe
{
  const c = O.autoestado(5), a = O.medias(c, 0), b = O.medias(c, 1.3);
  check("|5⟩: Δx Δp = 5,5", Math.abs(a.dx * a.dp - 5.5) < 1e-10);
  check("|5⟩: estacionário", Math.abs(a.dx - b.dx) < 1e-12 && Math.abs(b.x) < 1e-12);
}
// 6. gato: só n pares; franjas de período π/(√2 α) em t = π/2
{
  const al = 2, c = O.gato(al);
  check("gato: amplitudes ímpares nulas", c.every((z, k) => k % 2 === 0 || Math.abs(z.re) < 1e-15));
  const r = (x) => { const z = O.psi(c, x, Math.PI / 2); return z.re * z.re + z.im * z.im; };
  const zero = Math.PI / (2 * Math.SQRT2 * al);       // primeiro zero de cos(√2 α x)
  check("gato em t = π/2: zero de interferência em π/(2√2 α)", r(zero) < 1e-8 * r(0), `${r(zero).toExponential(1)} contra ${r(0).toFixed(3)}`);
}
console.log(fails ? `\n${fails} falha(s)` : "\ntodos os testes passaram");
process.exit(fails ? 1 : 0);
