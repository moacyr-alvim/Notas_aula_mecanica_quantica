// Testes do núcleo de Stern–Gerlach.  Rodar:  node tests/sg-core.test.js
const S = require("../assets/sg-core.js");
let fails = 0;
const check = (n, ok, i) => { console.log(ok ? "ok   " : "FALHA", n, i === undefined ? "" : i); if (!ok) fails++; };

// 1. |±n⟩ é base ortonormal, e P(+) + P(−) = 1 para quaisquer ângulos
{
  let pior = 0;
  for (let a = 0; a < 360; a += 17) for (let b = 0; b < 360; b += 23) {
    pior = Math.max(pior, Math.abs(S.prob(a, 1, b, 1) + S.prob(a, 1, b, -1) - 1), Math.abs(S.amp(a, 1, a, -1)));
  }
  check("estados ortonormais e probabilidades somando 1", pior < 1e-12, pior.toExponential(1));
}
// 2. P = cos²(γ/2) = (1 + m·n)/2
{
  let pior = 0;
  for (let a = 0; a < 360; a += 13) for (let b = 0; b < 360; b += 29) {
    const m = S.bloch(a, 1), n = S.bloch(b, 1);
    pior = Math.max(pior, Math.abs(S.prob(a, 1, b, 1) - (1 + m.x * n.x + m.z * n.z) / 2));
  }
  check("P(+n | +m) = (1 + m·n)/2", pior < 1e-12, pior.toExponential(1));
}
// 3. girar o ímã de 360° troca o sinal do ket; 720° não
{
  const a = S.spinor(37, 1), b = S.spinor(397, 1), c = S.spinor(757, 1);
  check("rotação de 360° dá −|ψ⟩", Math.abs(a[0] + b[0]) < 1e-12 && Math.abs(a[1] + b[1]) < 1e-12);
  check("rotação de 720° dá |ψ⟩", Math.abs(a[0] - c[0]) < 1e-12 && Math.abs(a[1] - c[1]) < 1e-12);
}
// 4. as montagens clássicas
{
  const T = (p) => S.teoria(S.PRESETS[p]);
  check("z, depois z: 100% de +", Math.abs(T("zz").mais - 1) < 1e-12);
  check("z, depois x: meio a meio", Math.abs(T("zx").mais - 0.5) < 1e-12);
  check("z, x, z: meio a meio no fim e 1/8 do forno em cada detector", Math.abs(T("zxz").mais - 0.5) < 1e-12 && Math.abs(T("zxz").maisTotal - 0.125) < 1e-12);
  check("z passando −, depois z: 0% de +", Math.abs(T("zmz").mais) < 1e-12);
  check("z, depois 60°: cos² 30° = 75%", Math.abs(T("ang").mais - 0.75) < 1e-12);
  check("z, 45°, 90°: cos⁴ 22,5° do feixe +z chega ao fim como +", Math.abs(T("meio").passa2 * T("meio").mais - Math.pow(Math.cos(Math.PI / 8), 4)) < 1e-12);
}
// 5. o sorteio bate com a teoria (semente fixa)
{
  const r = S.rng(42), N = 200000;
  for (const p of ["zxz", "ang", "meio"]) {
    const c = S.simula(S.PRESETS[p], N, r), T = S.teoria(S.PRESETS[p]);
    const f = c.mais / (c.mais + c.menos), sigma = Math.sqrt(T.mais * (1 - T.mais) / (c.mais + c.menos));
    check(`${p}: frequência de + no fim dentro de 4σ da teoria`, Math.abs(f - T.mais) < 4 * sigma + 1e-12, `${f.toFixed(4)} contra ${T.mais.toFixed(4)}`);
    check(`${p}: metade barrada no ímã 1`, Math.abs(c.barra1 / N - 0.5) < 0.005, (c.barra1 / N).toFixed(4));
  }
}
console.log(fails ? `\n${fails} falha(s)` : "\ntodos os testes passaram");
process.exit(fails ? 1 : 0);
