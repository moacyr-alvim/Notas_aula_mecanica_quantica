/* Demo de espalhamento em uma dimensão.  Depende de barreira-core.js.
 * Esquerda: o potencial (preenchido), a energia E (tracejada) e o estado estacionário de
 * espalhamento desenhado em volta da linha de E: Re ψ e o envelope |ψ|.
 * Direita: T(E) e R(E) na faixa toda de energias, a resposta clássica tracejada e o E atual. */
(function () {
  "use strict";
  var B = window.BarreiraCore, root = document.getElementById("demo-bar");
  if (!B || !root) return;
  var $ = function (id) { return document.getElementById(id); };
  var pre = $("br-preset"), sE = $("br-E"), sV = $("br-V0"), sA = $("br-a"), oE = $("br-Ev"), oV = $("br-V0v"), oA = $("br-av"),
      read = $("br-readout"), cP = $("br-psi"), cT = $("br-T"), bRes = $("br-ress");
  var XMIN = -8, XMAX = 14, EMAX = +sE.max, raf = 0, i, cachePicos = {};

  Object.keys(B.PRESETS).forEach(function (k) { var o = document.createElement("option"); o.value = k; o.textContent = B.PRESETS[k].label; pre.appendChild(o); });
  pre.value = "barreira";

  function fmt(n, d) { return (Math.abs(n) < 5e-5 ? 0 : n).toFixed(d == null ? 2 : d).replace(".", ",").replace("-", "−"); }
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
  function classico(k, E, V0) { return k === "poco" ? 1 : (E > V0 ? 1 : 0); }

  function painelPsi(pot, sol, E, V0, col) {
    var S = prep(cP), ctx = S.ctx, cx = { l: 8, tp: 12, w: S.w - 16, h: S.h - 12 - 24 };
    var vmin = Math.min(0, Math.min.apply(null, pot.valores)), vmax = Math.max(E, V0, 0.5) * 1.55;
    var X = function (x) { return cx.l + (x - XMIN) / (XMAX - XMIN) * cx.w; }, Y = function (e) { return cx.tp + (1 - (e - vmin) / (vmax - vmin)) * cx.h; };
    // potencial
    var M = Math.round(cx.w * 1.5), xs = [], vs = [];
    for (i = 0; i <= M; i++) { var x = XMIN + (XMAX - XMIN) * i / M; xs.push(x); vs.push(B.V(pot, x)); }
    ctx.beginPath(); ctx.moveTo(X(XMIN), Y(vmin));
    for (i = 0; i <= M; i++) ctx.lineTo(X(xs[i]), Y(vs[i]));
    ctx.lineTo(X(XMAX), Y(vmin)); ctx.closePath(); ctx.fillStyle = alpha(col.choque, 0.12); ctx.fill();
    ctx.strokeStyle = col.choque; ctx.lineWidth = 1.6; ctx.beginPath();
    for (i = 0; i <= M; i++) { if (i) ctx.lineTo(X(xs[i]), Y(vs[i])); else ctx.moveTo(X(xs[i]), Y(vs[i])); }
    ctx.stroke();
    ctx.strokeStyle = col.rule; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(cx.l, Y(0)); ctx.lineTo(cx.l + cx.w, Y(0)); ctx.stroke();
    // energia
    ctx.strokeStyle = col.soft; ctx.setLineDash([5, 4]); ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(cx.l, Y(E)); ctx.lineTo(cx.l + cx.w, Y(E)); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = col.soft; ctx.textAlign = "left"; ctx.textBaseline = "bottom"; ctx.fillText("E", cx.l + 2, Y(E) - 2);
    // ψ em volta da linha de E
    var re = [], ab = [], mx = 0;
    for (i = 0; i <= M; i++) { var z = B.psi(sol, pot, xs[i]); re.push(z.re); var m = Math.hypot(z.re, z.im); ab.push(m); if (m > mx) mx = m; }
    var esc = 0.3 * (vmax - vmin) / Math.max(mx, 1e-9);
    ctx.strokeStyle = alpha(col.carac, 0.9); ctx.lineWidth = 1.5; ctx.beginPath();
    for (i = 0; i <= M; i++) { var y = Y(E + esc * ab[i]); if (i) ctx.lineTo(X(xs[i]), y); else ctx.moveTo(X(xs[i]), y); }
    ctx.stroke();
    ctx.strokeStyle = col.ink; ctx.lineWidth = 1.6; ctx.beginPath();
    for (i = 0; i <= M; i++) { var y2 = Y(E + esc * re[i]); if (i) ctx.lineTo(X(xs[i]), y2); else ctx.moveTo(X(xs[i]), y2); }
    ctx.stroke();
    ctx.fillStyle = col.soft; ctx.textAlign = "left"; ctx.textBaseline = "top"; ctx.fillText("→ incide", cx.l + 4, cx.tp);
    ctx.textAlign = "right"; ctx.textBaseline = "bottom"; ctx.fillStyle = col.ink; ctx.fillText("x", S.w - 4, S.h - 2);
  }

  function painelT(k, V0, a, E, col) {
    var S = prep(cT), ctx = S.ctx, cx = { l: 34, tp: 16, w: S.w - 34 - 12, h: S.h - 16 - 30 };
    var X = function (e) { return cx.l + e / EMAX * cx.w; }, Y = function (v) { return cx.tp + (1 - v) * cx.h; };
    ctx.strokeStyle = col.rule; ctx.lineWidth = 1; ctx.fillStyle = col.soft; ctx.textAlign = "right"; ctx.textBaseline = "middle";
    [0, 0.5, 1].forEach(function (v) { var y = Math.round(Y(v)) + .5; ctx.beginPath(); ctx.moveTo(cx.l, y); ctx.lineTo(cx.l + cx.w, y); ctx.stroke(); ctx.fillText(fmt(v, 1), cx.l - 5, y); });
    ctx.textAlign = "center"; ctx.textBaseline = "top";
    for (var e = 0; e <= EMAX; e += 1) ctx.fillText(String(e), X(e), cx.tp + cx.h + 5);
    if (k !== "poco") { ctx.strokeStyle = col.choque; ctx.setLineDash([2, 3]); ctx.beginPath(); ctx.moveTo(X(V0), cx.tp); ctx.lineTo(X(V0), cx.tp + cx.h); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = col.choque; ctx.fillText("V₀", X(V0), cx.tp - 14); }
    // grade uniforme mais pontos aglomerados em volta de cada pico: ressonâncias estreitas não somem
    var pot = B.PRESETS[k].pot(V0, a), N = 600, d = EMAX / N, Es = [], Ts = [], Rs = [];
    for (i = 1; i <= N; i++) Es.push(EMAX * i / N);
    picos(k, V0, a).forEach(function (p) { Es.push(p.E); for (var j = 0; j <= 20; j++) { var q = d * Math.pow(2, -j); Es.push(p.E - q, p.E + q); } });
    Es = Es.filter(function (e) { return e > 0 && e <= EMAX; }).sort(function (x, y) { return x - y; });
    Es.forEach(function (e) { var s = B.resolve(pot, e); Ts.push(s.T); Rs.push(s.R); });
    var curva = function (vals) { ctx.beginPath(); Es.forEach(function (e, j) { if (j) ctx.lineTo(X(e), Y(vals[j])); else ctx.moveTo(X(e), Y(vals[j])); }); ctx.stroke(); };
    ctx.strokeStyle = col.aux; ctx.lineWidth = 1.4; ctx.setLineDash([5, 4]); curva(Es.map(function (e) { return classico(k, e, V0); })); ctx.setLineDash([]);
    ctx.strokeStyle = alpha(col.choque, 0.7); ctx.lineWidth = 1.2; curva(Rs);
    ctx.strokeStyle = col.carac; ctx.lineWidth = 2.2; curva(Ts);
    var sa = B.resolve(pot, E);
    ctx.fillStyle = col.carac; ctx.beginPath(); ctx.arc(X(E), Y(sa.T), 4.5, 0, 2 * Math.PI); ctx.fill();
    ctx.fillStyle = col.ink; ctx.textAlign = "left"; ctx.textBaseline = "top"; ctx.fillText("T(E), R(E)", 4, 0);
    ctx.textAlign = "right"; ctx.textBaseline = "bottom"; ctx.fillText("E", S.w - 4, S.h - 2);
  }

  function picos(k, V0, a) {
    var ch = k + "|" + V0 + "|" + a;
    if (!cachePicos[ch]) { cachePicos = {}; cachePicos[ch] = B.picos(B.PRESETS[k].pot(V0, a), EMAX).filter(function (p) { return p.T > 0.5; }); }
    return cachePicos[ch];
  }

  function desenha() {
    var k = pre.value, E = +sE.value, V0 = +sV.value, a = +sA.value, col = cores();
    bRes.disabled = !picos(k, V0, a).length;
    oE.textContent = fmt(E); oV.textContent = fmt(V0); oA.textContent = fmt(a);
    sA.disabled = k === "degrau";
    var pot = B.PRESETS[k].pot(V0, a), sol = B.resolve(pot, E);
    painelPsi(pot, sol, E, V0, col); painelT(k, V0, a, E, col);
    var h = "<span>T = <b>" + fmt(sol.T, 4) + "</b></span><span>R = <b>" + fmt(sol.R, 4) + "</b></span>"
          + "<span>T + R = <b>" + fmt(sol.T + sol.R, 6) + "</b></span>"
          + "<span>clássico: <b>" + (classico(k, E, V0) ? "passa sempre" : "volta sempre") + "</b></span>";
    if ((k === "barreira" || k === "dupla") && E < V0) {
      var kap = Math.sqrt(2 * (V0 - E));
      h += "<span>κa = <b>" + fmt(kap * a) + "</b></span>";
      if (k === "barreira") h += "<span>16(E/V₀)(1 − E/V₀)·exp(−2κa) = <b>" + fmt(16 * E / V0 * (1 - E / V0) * Math.exp(-2 * kap * a), 4) + "</b></span>";
    }
    read.innerHTML = h;
  }
  function agenda() { if (!raf) raf = requestAnimationFrame(function () { raf = 0; desenha(); }); }
  [sE, sV, sA].forEach(function (el) { el.addEventListener("input", agenda); });
  pre.addEventListener("change", agenda);
  /* pula para o próximo pico de T acima do E atual (e volta ao primeiro depois do último) */
  bRes.addEventListener("click", function () {
    var ps = picos(pre.value, +sV.value, +sA.value), E = +sE.value;
    if (!ps.length) return;
    var prox = ps.filter(function (p) { return p.E > E + 1e-7; })[0] || ps[0];
    sE.value = prox.E; desenha();
  });
  window.addEventListener("resize", agenda);
  if ("ResizeObserver" in window) new ResizeObserver(agenda).observe(root);
  document.addEventListener("themechange", agenda);
  desenha();
})();
