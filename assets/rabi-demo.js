/* Demo da esfera de Bloch: precessão e oscilação de Rabi.  Depende de rabi-core.js.
 * Esquerda: a esfera (arraste para girar a vista), o eixo de rotação n no referencial girante,
 * o rastro do vetor de Bloch de 0 até t e o vetor no instante t.
 * Direita: P(−z) contra o tempo, com a amplitude Ω²/(Ω² + Δ²) tracejada. */
(function () {
  "use strict";
  var R = window.RabiCore, root = document.getElementById("demo-rabi");
  if (!R || !root) return;
  var $ = function (id) { return document.getElementById(id); };
  var pre = $("rb-preset"), ini = $("rb-ini"), sD = $("rb-D"), sO = $("rb-O"), sT = $("rb-t"),
      oD = $("rb-Dv"), oO = $("rb-Ov"), oT = $("rb-tv"), cLab = $("rb-lab"), bPlay = $("rb-play"), bPi = $("rb-pi"),
      read = $("rb-readout"), cE = $("rb-esfera"), cP = $("rb-prob");
  var TMAX = +sT.max, az = 0.55, el = 0.32, tocando = false, ultimo = 0, raf = 0;

  Object.keys(R.PRESETS).forEach(function (k) { var o = document.createElement("option"); o.value = k; o.textContent = R.PRESETS[k].label; pre.appendChild(o); });
  Object.keys(R.INICIAIS).forEach(function (k) { var o = document.createElement("option"); o.value = k; o.textContent = R.INICIAIS[k].label; ini.appendChild(o); });

  function par() { return { D: +sD.value, O: +sO.value, w: R.W_LAB, r0: R.INICIAIS[ini.value].r0, lab: !!cLab.checked }; }
  function aplica(k) { var p = R.PRESETS[k]; sD.value = p.D; sO.value = p.O; ini.value = p.ini; cLab.checked = p.lab; sT.value = 0; desenha(); }

  function fmt(n, d) { return (Math.abs(n) < 5e-4 ? 0 : n).toFixed(d == null ? 2 : d).replace(".", ",").replace("-", "−"); }
  function css(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }
  function cores() { return { ink: css("--ink"), soft: css("--ink-soft"), rule: css("--rule"), carac: css("--carac"), choque: css("--choque"), aux: css("--aux") }; }
  function prep(cv) {
    var dpr = window.devicePixelRatio || 1, w = cv.clientWidth, h = cv.clientHeight;
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
    var ctx = cv.getContext("2d"); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h); ctx.font = "12px sans-serif";
    return { ctx: ctx, w: w, h: h };
  }

  /* projeção: observador na direção (cos el cos az, cos el sen az, sen el) */
  function proj(v, S) {
    var ca = Math.cos(az), sa = Math.sin(az), ce = Math.cos(el), se = Math.sin(el);
    var X = -sa * v[0] + ca * v[1], Y = -se * ca * v[0] - se * sa * v[1] + ce * v[2], prof = ce * ca * v[0] + ce * sa * v[1] + se * v[2];
    return { x: S.cx + S.r * X, y: S.cy - S.r * Y, prof: prof };
  }
  function seta(ctx, a, b, cor, larg) {
    var ang = Math.atan2(b.y - a.y, b.x - a.x), h = 7 + larg, L = Math.hypot(b.x - a.x, b.y - a.y);
    ctx.strokeStyle = cor; ctx.fillStyle = cor; ctx.lineWidth = larg;
    if (L < 3) return;
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x - Math.cos(ang) * h * 0.6, b.y - Math.sin(ang) * h * 0.6); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(b.x, b.y);
    ctx.lineTo(b.x - h * Math.cos(ang - 0.42), b.y - h * Math.sin(ang - 0.42));
    ctx.lineTo(b.x - h * Math.cos(ang + 0.42), b.y - h * Math.sin(ang + 0.42)); ctx.closePath(); ctx.fill();
  }
  /* curva 3D com a parte de trás tracejada e clara */
  function curva(ctx, pts, S, cor, larg) {
    for (var i = 1; i < pts.length; i++) {
      var a = proj(pts[i - 1], S), b = proj(pts[i], S), atras = a.prof + b.prof < 0;
      ctx.strokeStyle = cor; ctx.lineWidth = larg; ctx.globalAlpha = atras ? 0.35 : 1;
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  function esfera(p, t, col) {
    var C = prep(cE), ctx = C.ctx, S = { cx: C.w / 2, cy: C.h / 2 + 4, r: Math.min(C.w, C.h) * 0.36 };
    ctx.strokeStyle = col.rule; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(S.cx, S.cy, S.r, 0, 2 * Math.PI); ctx.stroke();
    var eq = [], mer = [], k;
    for (k = 0; k <= 96; k++) { var a = 2 * Math.PI * k / 96; eq.push([Math.cos(a), Math.sin(a), 0]); mer.push([Math.sin(a), 0, Math.cos(a)]); }
    curva(ctx, eq, S, col.rule, 1); curva(ctx, mer, S, col.rule, 0.8);
    var o = proj([0, 0, 0], S);
    [[[1.25, 0, 0], "x"], [[0, 1.25, 0], "y"], [[0, 0, 1.25], "z"]].forEach(function (e) {
      var q = proj(e[0], S); ctx.strokeStyle = col.soft; ctx.lineWidth = 1; ctx.setLineDash([2, 3]);
      ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(q.x, q.y); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = col.soft; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(e[1], q.x + (q.x - o.x) * 0.08, q.y + (q.y - o.y) * 0.08);
    });
    // eixo de rotação n (só faz sentido no referencial girante; no laboratório ele próprio gira)
    var e = R.eixo(p.D, p.O);
    if (!p.lab && e.W > 0) {
      var n1 = proj(e.n.map(function (v) { return 1.15 * v; }), S), n2 = proj(e.n.map(function (v) { return -1.15 * v; }), S);
      ctx.strokeStyle = col.aux; ctx.lineWidth = 1.6; ctx.setLineDash([6, 4]);
      ctx.beginPath(); ctx.moveTo(n2.x, n2.y); ctx.lineTo(n1.x, n1.y); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = col.aux; ctx.textAlign = "left"; ctx.textBaseline = "bottom"; ctx.fillText("n", n1.x + 4, n1.y);
    }
    // rastro e vetor
    var pts = [], N = Math.max(2, Math.ceil(t / TMAX * (p.lab ? 900 : 300)) + 1);
    for (k = 0; k < N; k++) pts.push(R.bloch(p, t * k / (N - 1)));
    curva(ctx, pts, S, col.carac, 1.6);
    var r = R.bloch(p, t), q = proj(r, S);
    ctx.globalAlpha = q.prof < 0 ? 0.55 : 1; seta(ctx, o, q, col.carac, 3); ctx.globalAlpha = 1;
    ctx.fillStyle = col.ink; ctx.textAlign = "left"; ctx.textBaseline = "top";
    ctx.fillText(p.lab ? "laboratório" : "referencial girante", 6, 4);
  }

  function grafico(p, t, col) {
    var C = prep(cP), ctx = C.ctx, cx = { l: 34, tp: 16, w: C.w - 34 - 12, h: C.h - 16 - 30 };
    var Xf = function (s) { return cx.l + s / TMAX * cx.w; }, Yf = function (v) { return cx.tp + (1 - v) * cx.h; };
    ctx.strokeStyle = col.rule; ctx.lineWidth = 1; ctx.fillStyle = col.soft; ctx.textAlign = "right"; ctx.textBaseline = "middle";
    [0, 0.5, 1].forEach(function (v) { var y = Math.round(Yf(v)) + .5; ctx.beginPath(); ctx.moveTo(cx.l, y); ctx.lineTo(cx.l + cx.w, y); ctx.stroke(); ctx.fillText(fmt(v, 1), cx.l - 5, y); });
    ctx.textAlign = "center"; ctx.textBaseline = "top";
    for (var m = 0; m <= 4; m++) { var x = Xf(m * Math.PI); if (x > cx.l + cx.w + 1) break; ctx.fillText(m === 0 ? "0" : (m === 1 ? "π" : m + "π"), x, cx.tp + cx.h + 5); }
    var W2 = p.D * p.D + p.O * p.O, amp = W2 ? p.O * p.O / W2 : 0;
    if (p.r0[2] === 1) {
      ctx.strokeStyle = col.aux; ctx.setLineDash([5, 4]); ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(cx.l, Yf(amp)); ctx.lineTo(cx.l + cx.w, Yf(amp)); ctx.stroke(); ctx.setLineDash([]);
    }
    ctx.strokeStyle = col.rule; ctx.lineWidth = 1.6; ctx.beginPath();
    for (var i = 0; i <= 400; i++) { var s = TMAX * i / 400, y2 = Yf(R.pBaixo(p, s)); if (i) ctx.lineTo(Xf(s), y2); else ctx.moveTo(Xf(s), y2); }
    ctx.stroke();
    ctx.strokeStyle = col.carac; ctx.lineWidth = 2.4; ctx.beginPath();
    for (i = 0; i <= 400; i++) { var s2 = t * i / 400, y3 = Yf(R.pBaixo(p, s2)); if (i) ctx.lineTo(Xf(s2), y3); else ctx.moveTo(Xf(s2), y3); }
    ctx.stroke();
    ctx.fillStyle = col.carac; ctx.beginPath(); ctx.arc(Xf(t), Yf(R.pBaixo(p, t)), 4, 0, 2 * Math.PI); ctx.fill();
    ctx.fillStyle = col.ink; ctx.textAlign = "left"; ctx.textBaseline = "top"; ctx.fillText("P(−z)", 4, 0);
    ctx.textAlign = "right"; ctx.textBaseline = "bottom"; ctx.fillText("t", C.w - 4, C.h - 2);
  }

  function desenha() {
    var p = par(), t = +sT.value, col = cores();
    oD.textContent = fmt(p.D); oO.textContent = fmt(p.O); oT.textContent = fmt(t);
    bPi.disabled = !(p.O > 0);
    esfera(p, t, col); grafico(p, t, col);
    var r = R.bloch(p, t), W = Math.hypot(p.D, p.O);
    var h = "<span>⟨σ⟩ = (<b>" + fmt(r[0]) + "</b>, <b>" + fmt(r[1]) + "</b>, <b>" + fmt(r[2]) + "</b>)</span>"
          + "<span>P(−z) = <b>" + fmt(R.pBaixo(p, t), 3) + "</b></span>"
          + "<span>W = √(Δ² + Ω²) = <b>" + fmt(W) + "</b></span>";
    if (W > 0) h += "<span>período 2π/W = <b>" + fmt(2 * Math.PI / W) + "</b></span>";
    if (p.r0[2] === 1 && W > 0) h += "<span>amplitude Ω²/W² = <b>" + fmt(p.O * p.O / (W * W), 3) + "</b></span>";
    read.innerHTML = h;
  }
  function agenda() { if (!raf) raf = requestAnimationFrame(function () { raf = 0; desenha(); }); }

  pre.addEventListener("change", function () { aplica(pre.value); });
  [sD, sO, sT].forEach(function (el) { el.addEventListener("input", agenda); });
  [ini, cLab].forEach(function (el) { el.addEventListener("change", agenda); });
  bPi.addEventListener("click", function () { var O = +sO.value; if (O > 0) { sT.value = Math.min(TMAX, Math.PI / O); desenha(); } });
  bPlay.addEventListener("click", function () {
    tocando = !tocando; bPlay.textContent = tocando ? "⏸ Pausar" : "▶ Animar";
    if (tocando) { if (+sT.value >= TMAX - 1e-6) sT.value = 0; ultimo = 0; requestAnimationFrame(passo); }
  });
  function passo(ts) {
    if (!tocando) return;
    if (ultimo) {
      var t = +sT.value + (ts - ultimo) / 1000 * (cLab.checked ? 0.6 : 1.4);
      if (t >= TMAX) { t = TMAX; tocando = false; bPlay.textContent = "▶ Animar"; }
      sT.value = t; desenha();
    }
    ultimo = ts; if (tocando) requestAnimationFrame(passo);
  }

  // arrastar para girar a vista (na horizontal; na vertical, o telefone continua rolando a página)
  var arr = null;
  cE.style.touchAction = "pan-y";
  cE.addEventListener("pointerdown", function (e) { arr = { x: e.clientX, y: e.clientY, az: az, el: el }; if (cE.setPointerCapture) cE.setPointerCapture(e.pointerId); });
  cE.addEventListener("pointermove", function (e) {
    if (!arr) return;
    az = arr.az - (e.clientX - arr.x) * 0.01;
    el = Math.max(-1.3, Math.min(1.3, arr.el + (e.clientY - arr.y) * 0.01));
    agenda();
  });
  ["pointerup", "pointercancel"].forEach(function (ev) { cE.addEventListener(ev, function () { arr = null; }); });

  window.addEventListener("resize", agenda);
  if ("ResizeObserver" in window) new ResizeObserver(agenda).observe(root);
  document.addEventListener("themechange", agenda);
  pre.value = "ress"; aplica("ress");
})();
