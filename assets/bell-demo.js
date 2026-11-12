/* Demo de Bell–CHSH.  Depende de bell-core.js.
 * Esquerda: a correlação E contra a diferença de ângulos, quântica (−cos) e do modelo local
 * (dente de serra), com os quatro pares de ajustes marcados — teoria e, depois de medir, o sorteio.
 * Direita: |S| do singleto e do modelo local, teoria e medido, com as linhas 2 e 2√2. */
(function () {
  "use strict";
  var B = window.BellCore, root = document.getElementById("demo-bell");
  if (!B || !root) return;
  var $ = function (id) { return document.getElementById(id); };
  var sl = { a: $("bl-a"), a2: $("bl-a2"), b: $("bl-b"), b2: $("bl-b2") }, out = { a: $("bl-av"), a2: $("bl-a2v"), b: $("bl-bv"), b2: $("bl-b2v") };
  var bOt = $("bl-otimo"), bRun = $("bl-rodar"), bZ = $("bl-zera"), read = $("bl-readout"), cC = $("bl-corr"), cS = $("bl-S");
  var r = B.rng(1964), med = null, raf = 0, NP = 2000, RAD = Math.PI / 180;

  function ang() { return { a: sl.a.value * RAD, a2: sl.a2.value * RAD, b: sl.b.value * RAD, b2: sl.b2.value * RAD }; }
  function fmt(n, d) { return (Math.abs(n) < 5e-4 ? 0 : n).toFixed(d == null ? 2 : d).replace(".", ",").replace("-", "−"); }
  function css(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }
  function cores() { return { ink: css("--ink"), soft: css("--ink-soft"), rule: css("--rule"), carac: css("--carac"), choque: css("--choque"), aux: css("--aux"), paper: css("--paper") }; }
  function prep(cv) {
    var dpr = window.devicePixelRatio || 1, w = cv.clientWidth, h = cv.clientHeight;
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
    var ctx = cv.getContext("2d"); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h); ctx.font = "12px sans-serif";
    return { ctx: ctx, w: w, h: h };
  }
  var PARES = [["ab", "a", "b", "a,b"], ["ab2", "a", "b2", "a,b′"], ["a2b", "a2", "b", "a′,b"], ["a2b2", "a2", "b2", "a′,b′"]];

  function correl(A, col) {
    var S = prep(cC), ctx = S.ctx, cx = { l: 34, tp: 14, w: S.w - 34 - 12, h: S.h - 14 - 30 };
    var X = function (d) { return cx.l + d / Math.PI * cx.w; }, Y = function (e) { return cx.tp + (1 - (e + 1) / 2) * cx.h; };
    ctx.strokeStyle = col.rule; ctx.lineWidth = 1; ctx.fillStyle = col.soft; ctx.textAlign = "right"; ctx.textBaseline = "middle";
    [-1, 0, 1].forEach(function (v) { var y = Math.round(Y(v)) + .5; ctx.beginPath(); ctx.moveTo(cx.l, y); ctx.lineTo(cx.l + cx.w, y); ctx.stroke(); ctx.fillText(String(v).replace("-", "−"), cx.l - 5, y); });
    ctx.textAlign = "center"; ctx.textBaseline = "top";
    [0, 45, 90, 135, 180].forEach(function (g) { ctx.fillText(g + "°", X(g * RAD), cx.tp + cx.h + 5); });
    var i, N = 180;
    ctx.strokeStyle = col.choque; ctx.lineWidth = 1.6; ctx.setLineDash([5, 4]); ctx.beginPath();
    for (i = 0; i <= N; i++) { var d = Math.PI * i / N; if (i) ctx.lineTo(X(d), Y(B.Elocal(0, d))); else ctx.moveTo(X(d), Y(B.Elocal(0, d))); }
    ctx.stroke(); ctx.setLineDash([]);
    ctx.strokeStyle = col.carac; ctx.lineWidth = 2.2; ctx.beginPath();
    for (i = 0; i <= N; i++) { var d2 = Math.PI * i / N; if (i) ctx.lineTo(X(d2), Y(B.Equant(0, d2))); else ctx.moveTo(X(d2), Y(B.Equant(0, d2))); }
    ctx.stroke();
    // pares com o mesmo ângulo dividem a mesma linha e o mesmo rótulo
    var grupos = {};
    PARES.forEach(function (p) { var d = B.dif(A[p[1]], A[p[2]]), ch = d.toFixed(4); (grupos[ch] = grupos[ch] || { d: d, nomes: [] }).nomes.push(p[3]); });
    Object.keys(grupos).sort(function (u, v) { return grupos[u].d - grupos[v].d; }).forEach(function (ch, j) {
      var gr = grupos[ch];
      ctx.strokeStyle = col.soft; ctx.lineWidth = 1; ctx.setLineDash([2, 3]);
      ctx.beginPath(); ctx.moveTo(X(gr.d), cx.tp); ctx.lineTo(X(gr.d), cx.tp + cx.h); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = col.soft; ctx.textAlign = "center"; ctx.textBaseline = "top"; ctx.fillText(gr.nomes.join("  "), X(gr.d), cx.tp + 2 + (j % 2) * 14);
    });
    PARES.forEach(function (p) {
      var d = B.dif(A[p[1]], A[p[2]]);
      if (med) {
        ctx.fillStyle = col.carac; ctx.beginPath(); ctx.arc(X(d), Y(med.q[p[0]]), 4.5, 0, 2 * Math.PI); ctx.fill();
        ctx.fillStyle = col.choque; ctx.fillRect(X(d) - 4, Y(med.l[p[0]]) - 4, 8, 8);
      }
    });
    ctx.fillStyle = col.ink; ctx.textAlign = "left"; ctx.textBaseline = "top"; ctx.fillText("E", 4, 0);
    ctx.textAlign = "right"; ctx.textBaseline = "bottom"; ctx.fillText("|ângulo entre os ajustes|", S.w - 4, S.h - 2);
  }

  function barras(A, col) {
    var S = prep(cS), ctx = S.ctx, cx = { l: 30, tp: 14, w: S.w - 30 - 10, h: S.h - 14 - 40 }, top = 3.2;
    var Y = function (v) { return cx.tp + (1 - v / top) * cx.h; };
    ctx.strokeStyle = col.rule; ctx.lineWidth = 1; ctx.fillStyle = col.soft; ctx.textAlign = "right"; ctx.textBaseline = "middle";
    [0, 1, 2, 3].forEach(function (v) { var y = Math.round(Y(v)) + .5; ctx.beginPath(); ctx.moveTo(cx.l, y); ctx.lineTo(cx.l + cx.w, y); ctx.stroke(); ctx.fillText(String(v), cx.l - 5, y); });
    var itens = [
      ["singleto\n(teoria)", Math.abs(B.S(B.Equant, A)), col.carac, false],
      ["singleto\n(medido)", med ? Math.abs(med.q.S) : null, col.carac, true],
      ["local\n(teoria)", Math.abs(B.S(B.Elocal, A)), col.choque, false],
      ["local\n(medido)", med ? Math.abs(med.l.S) : null, col.choque, true]
    ];
    var bw = cx.w / itens.length;
    itens.forEach(function (it, k) {
      var x0 = cx.l + k * bw + bw * 0.18, w = bw * 0.64;
      if (it[1] != null) {
        ctx.fillStyle = it[2]; ctx.globalAlpha = it[3] ? 0.55 : 0.9;
        ctx.fillRect(x0, Y(it[1]), w, Y(0) - Y(it[1])); ctx.globalAlpha = 1;
        ctx.fillStyle = col.paper; ctx.textAlign = "center"; ctx.textBaseline = "top"; ctx.font = "bold 12px sans-serif";
        if (Y(0) - Y(it[1]) > 22) ctx.fillText(fmt(it[1]), x0 + w / 2, Y(it[1]) + 4);
        ctx.font = "12px sans-serif";
      }
      ctx.fillStyle = col.soft; ctx.textAlign = "center"; ctx.textBaseline = "top";
      it[0].split("\n").forEach(function (t, j) { ctx.fillText(t, x0 + w / 2, cx.tp + cx.h + 4 + 13 * j); });
    });
    [[2, col.choque, "2 (local)"], [B.TSIRELSON, col.carac, "2√2"]].forEach(function (l) {
      ctx.strokeStyle = l[1]; ctx.lineWidth = 1.4; ctx.setLineDash([5, 4]);
      ctx.beginPath(); ctx.moveTo(cx.l, Y(l[0])); ctx.lineTo(cx.l + cx.w, Y(l[0])); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = l[1]; ctx.textAlign = "right"; ctx.textBaseline = "bottom"; ctx.fillText(l[2], cx.l + cx.w, Y(l[0]) - 1);
    });
    ctx.fillStyle = col.ink; ctx.textAlign = "left"; ctx.textBaseline = "top"; ctx.fillText("|S|", 4, 0);
  }

  function desenha() {
    var A = ang(), col = cores();
    Object.keys(sl).forEach(function (k) { out[k].textContent = sl[k].value + "°"; });
    correl(A, col); barras(A, col);
    var Sq = B.S(B.Equant, A), Sl = B.S(B.Elocal, A);
    var h = "<span>S singleto = <b>" + fmt(Sq, 3) + "</b></span><span>S local = <b>" + fmt(Sl, 3) + "</b></span>";
    if (med) h += "<span>medido (" + NP + " pares por ajuste): singleto <b>" + fmt(med.q.S, 3) + "</b>, local <b>" + fmt(med.l.S, 3) + "</b></span>";
    if (Math.abs(Sq) > 2) h += "<span><b>|S| &gt; 2</b>: nenhum modelo local reproduz isto</span>";
    read.innerHTML = h;
  }
  function agenda() { if (!raf) raf = requestAnimationFrame(function () { raf = 0; desenha(); }); }
  Object.keys(sl).forEach(function (k) { sl[k].addEventListener("input", function () { med = null; agenda(); }); });
  bOt.addEventListener("click", function () { var o = B.OTIMO; sl.a.value = Math.round(o.a / RAD); sl.a2.value = Math.round(o.a2 / RAD); sl.b.value = Math.round(o.b / RAD); sl.b2.value = Math.round(o.b2 / RAD); med = null; desenha(); });
  bRun.addEventListener("click", function () { var A = ang(); med = { q: B.experimento(A, NP, "quant", r), l: B.experimento(A, NP, "local", r) }; desenha(); });
  bZ.addEventListener("click", function () { med = null; desenha(); });
  window.addEventListener("resize", agenda);
  if ("ResizeObserver" in window) new ResizeObserver(agenda).observe(root);
  document.addEventListener("themechange", agenda);
  desenha();
})();
