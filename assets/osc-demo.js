/* Demo do oscilador harmônico.  Depende de osc-core.js.
 * Esquerda: o potencial x²/2, os níveis n + ½ e a densidade |ψ(x,t)|² desenhada sobre a linha
 * da energia média (e, opcional, a densidade clássica com a mesma energia).
 * Direita: o plano de fase (x, p) — a trajetória de (⟨x⟩, ⟨p⟩) num período e a elipse de
 * incerteza no instante t (desvios e covariância). */
(function () {
  "use strict";
  var O = window.OscCore, root = document.getElementById("demo-osc");
  if (!O || !root) return;
  var $ = function (id) { return document.getElementById(id); };
  var sel = $("os-estado"), sN = $("os-n"), sA = $("os-alfa"), sT = $("os-t"), oN = $("os-nv"), oA = $("os-alfav"), oT = $("os-tv"),
      cCl = $("os-classica"), bPlay = $("os-play"), read = $("os-readout"), cO = $("os-onda"), cF = $("os-fase");
  var TMAX = +sT.max, tocando = false, ultimo = 0, raf = 0, cache = {}, i;
  var XL = 7;

  Object.keys(O.ESTADOS).forEach(function (k) { var o = document.createElement("option"); o.value = k; o.textContent = O.ESTADOS[k].label; sel.appendChild(o); });
  sel.value = "coer";

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

  function chave() { return sel.value + "|" + sN.value + "|" + sA.value; }
  function dados() {
    var k = chave();
    if (!cache[k]) {
      var c = O.estado(sel.value, +sN.value, +sA.value), E = O.medias(c, 0).E, mx = 0, xs = [];
      for (i = 0; i <= 280; i++) xs.push(-XL + 2 * XL * i / 280);
      [0, Math.PI / 4, Math.PI / 2, 3 * Math.PI / 4].forEach(function (t) {
        xs.forEach(function (x) { var z = O.psi(c, x, t); mx = Math.max(mx, z.re * z.re + z.im * z.im); });
      });
      cache = {}; cache[k] = { c: c, E: E, mx: mx };
    }
    return cache[k];
  }

  function onda(D, t, col) {
    var S = prep(cO), ctx = S.ctx, cx = { l: 8, tp: 10, w: S.w - 16, h: S.h - 10 - 24 };
    var Etop = Math.max(6, D.E * 1.45 + 1.5);
    var X = function (x) { return cx.l + (x + XL) / (2 * XL) * cx.w; }, Y = function (e) { return cx.tp + (1 - e / Etop) * cx.h; };
    ctx.strokeStyle = col.rule; ctx.lineWidth = 1;
    for (var n = 0; n + 0.5 < Etop; n++) {
      var xe = Math.sqrt(2 * (n + 0.5));
      ctx.beginPath(); ctx.moveTo(X(-xe), Y(n + 0.5)); ctx.lineTo(X(xe), Y(n + 0.5)); ctx.stroke();
    }
    ctx.strokeStyle = col.choque; ctx.lineWidth = 1.6; ctx.beginPath();
    for (i = 0; i <= 200; i++) { var x = -XL + 2 * XL * i / 200, v = x * x / 2; if (v > Etop) { ctx.moveTo(X(x), Y(Etop)); continue; } if (i) ctx.lineTo(X(x), Y(v)); else ctx.moveTo(X(x), Y(v)); }
    ctx.stroke();
    var base = D.E, esc = 0.42 * Math.min(Etop - base, base + 2) / Math.max(D.mx, 1e-9), M = Math.round(cx.w);
    if (cCl.checked) {
      ctx.strokeStyle = col.aux; ctx.lineWidth = 1.4; ctx.setLineDash([4, 3]); ctx.beginPath();
      var em = Math.sqrt(2 * D.E), comeca = true;
      for (i = 1; i < M; i++) { var xc = -em + 2 * em * i / M, d = Math.min(O.classica(D.E, xc), 3 * D.mx), yc = Y(base + esc * d); if (comeca) { ctx.moveTo(X(xc), yc); comeca = false; } else ctx.lineTo(X(xc), yc); }
      ctx.stroke(); ctx.setLineDash([]);
    }
    var pts = [];
    for (i = 0; i <= M; i++) { var xx = -XL + 2 * XL * i / M, z = O.psi(D.c, xx, t); pts.push([X(xx), Y(base + esc * (z.re * z.re + z.im * z.im))]); }
    ctx.beginPath(); ctx.moveTo(pts[0][0], Y(base)); pts.forEach(function (p) { ctx.lineTo(p[0], p[1]); }); ctx.lineTo(pts[M][0], Y(base)); ctx.closePath();
    ctx.fillStyle = alpha(col.carac, 0.22); ctx.fill();
    ctx.strokeStyle = col.carac; ctx.lineWidth = 2; ctx.beginPath(); pts.forEach(function (p, j) { if (j) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); }); ctx.stroke();
    ctx.strokeStyle = col.soft; ctx.lineWidth = 1; ctx.setLineDash([2, 3]); ctx.beginPath(); ctx.moveTo(cx.l, Y(base)); ctx.lineTo(cx.l + cx.w, Y(base)); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = col.soft; ctx.textAlign = "left"; ctx.textBaseline = "bottom"; ctx.fillText("⟨E⟩", cx.l + 2, Y(base) - 2);
    ctx.textAlign = "center"; ctx.textBaseline = "top";
    for (var g = -6; g <= 6; g += 2) ctx.fillText(String(g).replace("-", "−"), X(g), cx.tp + cx.h + 5);
    ctx.fillStyle = col.ink; ctx.textAlign = "right"; ctx.textBaseline = "bottom"; ctx.fillText("x", S.w - 4, S.h - 2);
  }

  function fase(D, t, col) {
    var S = prep(cF), ctx = S.ctx, R = Math.max(3, Math.sqrt(2 * D.E) + 1.2);
    var lado = Math.min(S.w - 30, S.h - 30), cxp = S.w / 2, cyp = S.h / 2 - 2, k = lado / (2 * R);
    var X = function (x) { return cxp + x * k; }, Y = function (p) { return cyp - p * k; };
    ctx.strokeStyle = col.rule; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(X(-R), Y(0)); ctx.lineTo(X(R), Y(0)); ctx.moveTo(X(0), Y(-R)); ctx.lineTo(X(0), Y(R)); ctx.stroke();
    ctx.fillStyle = col.soft; ctx.textAlign = "left"; ctx.textBaseline = "bottom"; ctx.fillText("x", X(R) + 3, Y(0)); ctx.textBaseline = "top"; ctx.fillText("p", X(0) + 4, Y(R));
    // órbita clássica de mesma energia
    ctx.strokeStyle = col.aux; ctx.setLineDash([4, 4]); ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(X(0), Y(0), Math.sqrt(2 * D.E) * k, 0, 2 * Math.PI); ctx.stroke(); ctx.setLineDash([]);
    // trajetória das médias
    ctx.strokeStyle = alpha(col.carac, 0.5); ctx.lineWidth = 1.4; ctx.beginPath();
    for (i = 0; i <= 120; i++) { var m = O.medias(D.c, 2 * Math.PI * i / 120); if (i) ctx.lineTo(X(m.x), Y(m.p)); else ctx.moveTo(X(m.x), Y(m.p)); }
    ctx.stroke();
    // elipse de incerteza: autovetores da matriz de covariância [[Δx², c], [c, Δp²]]
    var M = O.medias(D.c, t), a = M.dx * M.dx, b = M.dp * M.dp, c = M.cov;
    var tr = (a + b) / 2, det = Math.sqrt(Math.max(0, (a - b) * (a - b) / 4 + c * c)), l1 = tr + det, l2 = Math.max(0, tr - det);
    var ang = 0.5 * Math.atan2(2 * c, a - b);
    ctx.save(); ctx.translate(X(M.x), Y(M.p)); ctx.rotate(-ang);
    ctx.beginPath(); ctx.ellipse(0, 0, Math.sqrt(l1) * k, Math.sqrt(l2) * k, 0, 0, 2 * Math.PI);
    ctx.fillStyle = alpha(col.carac, 0.18); ctx.fill(); ctx.strokeStyle = col.carac; ctx.lineWidth = 1.8; ctx.stroke(); ctx.restore();
    ctx.fillStyle = col.carac; ctx.beginPath(); ctx.arc(X(M.x), Y(M.p), 3.5, 0, 2 * Math.PI); ctx.fill();
    ctx.fillStyle = col.ink; ctx.textAlign = "left"; ctx.textBaseline = "top"; ctx.fillText("plano de fase", 4, 2);
  }

  function desenha() {
    var t = +sT.value, col = cores(), D = dados(), tipo = sel.value;
    oN.textContent = sN.value; oA.textContent = fmt(+sA.value, 1); oT.textContent = fmt(t);
    sN.disabled = tipo !== "auto"; sA.disabled = !(tipo === "coer" || tipo === "gato");
    onda(D, t, col); fase(D, t, col);
    var M = O.medias(D.c, t);
    read.innerHTML = "<span>⟨E⟩ = <b>" + fmt(M.E) + "</b></span>"
      + "<span>⟨x⟩ = <b>" + fmt(M.x) + "</b>, ⟨p⟩ = <b>" + fmt(M.p) + "</b></span>"
      + "<span>Δx = <b>" + fmt(M.dx, 3) + "</b>, Δp = <b>" + fmt(M.dp, 3) + "</b></span>"
      + "<span>Δx·Δp = <b>" + fmt(M.dx * M.dp, 3) + "</b> (mínimo 0,5)</span>";
  }
  function agenda() { if (!raf) raf = requestAnimationFrame(function () { raf = 0; desenha(); }); }
  [sN, sA, sT].forEach(function (el) { el.addEventListener("input", agenda); });
  [sel, cCl].forEach(function (el) { el.addEventListener("change", agenda); });
  bPlay.addEventListener("click", function () {
    tocando = !tocando; bPlay.textContent = tocando ? "⏸ Pausar" : "▶ Animar";
    if (tocando) { ultimo = 0; requestAnimationFrame(passo); }
  });
  function passo(ts) {
    if (!tocando) return;
    if (ultimo) { var t = +sT.value + (ts - ultimo) / 1000 * 0.9; sT.value = t >= TMAX ? t - TMAX : t; desenha(); }
    ultimo = ts; requestAnimationFrame(passo);
  }
  window.addEventListener("resize", agenda);
  if ("ResizeObserver" in window) new ResizeObserver(agenda).observe(root);
  document.addEventListener("themechange", agenda);
  desenha();
})();
