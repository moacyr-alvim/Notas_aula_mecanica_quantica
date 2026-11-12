/* Demo do pacote gaussiano livre.  Depende de pacote-core.js.
 * Esquerda: Re ψ (e, opcional, Im ψ) dentro do envelope ±|ψ|, com duas marcas: a reta
 * x₀ + v_g t (o centro, velocidade de grupo k₀) e x₀ + v_f t (uma crista de onda plana, k₀/2).
 * Direita: a largura Δx(t), a reta assintótica Δp·t e o ponto do instante atual. */
(function () {
  "use strict";
  var P = window.PacoteCore, root = document.getElementById("demo-pac");
  if (!P || !root) return;
  var $ = function (id) { return document.getElementById(id); };
  var sS = $("pc-sigma"), sK = $("pc-k0"), sT = $("pc-t"), oS = $("pc-sigmav"), oK = $("pc-k0v"), oT = $("pc-tv"),
      cIm = $("pc-im"), bPlay = $("pc-play"), read = $("pc-readout"), cO = $("pc-onda"), cL = $("pc-larg");
  var TMAX = P.TMAX, tocando = false, ultimo = 0, raf = 0, i;

  function par() { return { sigma: +sS.value, k0: +sK.value, x0: P.X0 }; }
  function fmt(n, d) { return (Math.abs(n) < 5e-4 ? 0 : n).toFixed(d == null ? 2 : d).replace(".", ",").replace("-", "−"); }
  function css(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }
  function cores() { return { ink: css("--ink"), soft: css("--ink-soft"), rule: css("--rule"), carac: css("--carac"), choque: css("--choque"), aux: css("--aux") }; }
  function alpha(hex, a) {
    hex = (hex || "").replace("#", ""); if (hex.length === 3) hex = hex.replace(/./g, "$&$&");
    var n = [0, 2, 4].map(function (j) { return parseInt(hex.substr(j, 2), 16); });
    return n.some(isNaN) ? "#" + hex : "rgba(" + n.join(",") + "," + a + ")";
  }
  function prep(cv) {
    var dpr = window.devicePixelRatio || 1, w = cv.clientWidth, h = cv.clientHeight;
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
    var ctx = cv.getContext("2d"); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h); ctx.font = "12px sans-serif";
    return { ctx: ctx, w: w, h: h };
  }
  function linha(ctx, xs, ys, X, Y) { ctx.beginPath(); for (var j = 0; j < xs.length; j++) { if (j) ctx.lineTo(X(xs[j]), Y(ys[j])); else ctx.moveTo(X(xs[j]), Y(ys[j])); } ctx.stroke(); }

  function onda(p, t, col) {
    var S = prep(cO), ctx = S.ctx, cx = { l: 10, tp: 14, w: S.w - 20, h: S.h - 14 - 26 };
    var M = Math.max(400, Math.round(cx.w * 1.5)), xs = [], re = [], im = [], env = [];
    for (i = 0; i <= M; i++) {
      var x = P.XMIN + (P.XMAX - P.XMIN) * i / M, z = P.psi(p, x, t);
      xs.push(x); re.push(z.re); im.push(z.im); env.push(Math.hypot(z.re, z.im));
    }
    var topo = Math.pow(2 * Math.PI * p.sigma * p.sigma, -0.25) * 1.12;
    var X = function (x) { return cx.l + (x - P.XMIN) / (P.XMAX - P.XMIN) * cx.w; }, Y = function (v) { return cx.tp + (1 - (v + topo) / (2 * topo)) * cx.h; };
    ctx.strokeStyle = col.rule; ctx.lineWidth = 1; ctx.fillStyle = col.soft; ctx.textAlign = "center"; ctx.textBaseline = "top";
    for (var g = -10; g <= 30; g += 10) { var gx = Math.round(X(g)) + .5; ctx.beginPath(); ctx.moveTo(gx, cx.tp); ctx.lineTo(gx, cx.tp + cx.h); ctx.stroke(); ctx.fillText(String(g).replace("-", "−"), gx, cx.tp + cx.h + 6); }
    ctx.beginPath(); ctx.moveTo(cx.l, Y(0)); ctx.lineTo(cx.l + cx.w, Y(0)); ctx.stroke();
    // envelope
    ctx.beginPath();
    for (i = 0; i <= M; i++) ctx.lineTo(X(xs[i]), Y(env[i]));
    for (i = M; i >= 0; i--) ctx.lineTo(X(xs[i]), Y(-env[i]));
    ctx.closePath(); ctx.fillStyle = alpha(col.carac, 0.16); ctx.fill();
    ctx.strokeStyle = alpha(col.carac, 0.9); ctx.lineWidth = 1.4;
    linha(ctx, xs, env, X, Y); linha(ctx, xs, env.map(function (v) { return -v; }), X, Y);
    if (cIm.checked) { ctx.strokeStyle = col.aux; ctx.lineWidth = 1.3; linha(ctx, xs, im, X, Y); }
    ctx.strokeStyle = col.ink; ctx.lineWidth = 1.8; linha(ctx, xs, re, X, Y);
    // marcas: grupo (centro) e fase (crista de onda plana)
    var xg = P.centro(p, t), xf = p.x0 + p.k0 * t / 2;
    [[xg, col.carac, "grupo"], [xf, col.choque, "fase"]].forEach(function (m, j) {
      if (m[0] < P.XMIN || m[0] > P.XMAX) return;
      var px = X(m[0]);
      ctx.strokeStyle = m[1]; ctx.lineWidth = 1.4; ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(px, cx.tp); ctx.lineTo(px, cx.tp + cx.h); ctx.stroke(); ctx.setLineDash([]);
      // a fase fica sempre atrás do grupo (k₀ ≥ 0): rótulo do grupo à direita da linha, o da fase à esquerda
      ctx.fillStyle = m[1]; ctx.textBaseline = "top"; ctx.textAlign = j ? "right" : "left";
      ctx.fillText(m[2], px + (j ? -3 : 3), 1);
    });
    ctx.fillStyle = col.ink; ctx.textAlign = "right"; ctx.textBaseline = "bottom"; ctx.fillText("x", S.w - 4, S.h - 2);
  }

  function larguras(p, t, col) {
    var S = prep(cL), ctx = S.ctx, cx = { l: 36, tp: 16, w: S.w - 36 - 12, h: S.h - 16 - 30 };
    var ymax = Math.max(3, P.largura(p, TMAX) * 1.08);
    var X = function (s) { return cx.l + s / TMAX * cx.w; }, Y = function (v) { return cx.tp + (1 - v / ymax) * cx.h; };
    ctx.strokeStyle = col.rule; ctx.lineWidth = 1; ctx.fillStyle = col.soft; ctx.textAlign = "right"; ctx.textBaseline = "middle";
    var passo = ymax > 12 ? 5 : (ymax > 6 ? 2 : 1);
    for (var v = 0; v <= ymax; v += passo) { var y = Math.round(Y(v)) + .5; ctx.beginPath(); ctx.moveTo(cx.l, y); ctx.lineTo(cx.l + cx.w, y); ctx.stroke(); ctx.fillText(String(v), cx.l - 5, y); }
    ctx.textAlign = "center"; ctx.textBaseline = "top";
    for (var s = 0; s <= TMAX; s += 3) ctx.fillText(String(s), X(s), cx.tp + cx.h + 5);
    var ts = [], ws = [], as = [];
    for (i = 0; i <= 200; i++) { var q = TMAX * i / 200; ts.push(q); ws.push(P.largura(p, q)); as.push(Math.min(ymax, P.dp(p) * q)); }
    ctx.save(); ctx.beginPath(); ctx.rect(cx.l, cx.tp, cx.w, cx.h); ctx.clip();
    ctx.strokeStyle = col.aux; ctx.lineWidth = 1.4; ctx.setLineDash([5, 4]); linha(ctx, ts, as, X, Y); ctx.setLineDash([]);
    ctx.strokeStyle = col.carac; ctx.lineWidth = 2.2; linha(ctx, ts, ws, X, Y);
    ctx.restore();
    ctx.fillStyle = col.carac; ctx.beginPath(); ctx.arc(X(t), Y(P.largura(p, t)), 4, 0, 2 * Math.PI); ctx.fill();
    ctx.fillStyle = col.ink; ctx.textAlign = "left"; ctx.textBaseline = "top"; ctx.fillText("Δx(t)", 4, 0);
    ctx.textAlign = "right"; ctx.textBaseline = "bottom"; ctx.fillText("t", S.w - 4, S.h - 2);
  }

  function desenha() {
    var p = par(), t = +sT.value, col = cores();
    oS.textContent = fmt(p.sigma); oK.textContent = fmt(p.k0, 1); oT.textContent = fmt(t);
    onda(p, t, col); larguras(p, t, col);
    var dx = P.largura(p, t), dpv = P.dp(p);
    read.innerHTML = "<span>⟨x⟩ = <b>" + fmt(P.centro(p, t)) + "</b></span>"
      + "<span>Δx = <b>" + fmt(dx) + "</b></span>"
      + "<span>Δp = <b>" + fmt(dpv) + "</b> (fixo)</span>"
      + "<span>Δx·Δp = <b>" + fmt(dx * dpv, 3) + "</b></span>"
      + "<span>v grupo = <b>" + fmt(p.k0) + "</b>, v fase = <b>" + fmt(p.k0 / 2) + "</b></span>"
      + "<span>tempo de espalhar 2σ² = <b>" + fmt(2 * p.sigma * p.sigma) + "</b></span>";
  }
  function agenda() { if (!raf) raf = requestAnimationFrame(function () { raf = 0; desenha(); }); }
  [sS, sK, sT].forEach(function (el) { el.addEventListener("input", agenda); });
  cIm.addEventListener("change", agenda);
  bPlay.addEventListener("click", function () {
    tocando = !tocando; bPlay.textContent = tocando ? "⏸ Pausar" : "▶ Animar";
    if (tocando) { if (+sT.value >= TMAX - 1e-6) sT.value = 0; ultimo = 0; requestAnimationFrame(passo); }
  });
  function passo(ts) {
    if (!tocando) return;
    if (ultimo) {
      var t = +sT.value + (ts - ultimo) / 1000 * 1.2;
      if (t >= TMAX) { t = TMAX; tocando = false; bPlay.textContent = "▶ Animar"; }
      sT.value = t; desenha();
    }
    ultimo = ts; if (tocando) requestAnimationFrame(passo);
  }
  window.addEventListener("resize", agenda);
  if ("ResizeObserver" in window) new ResizeObserver(agenda).observe(root);
  document.addEventListener("themechange", agenda);
  desenha();
})();
