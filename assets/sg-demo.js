/* Demo de Stern–Gerlach em série.  Depende de sg-core.js.
 * Um esquema visto de lado: forno → ímã 1 → ímã 2 (opcional) → ímã 3 → dois detectores.
 * Cada átomo é sorteado na hora em que sai do forno (regra de Born etapa por etapa) e
 * anda pelo seu feixe; os contadores sobem quando ele chega.  Acima de cada ímã, um mostrador
 * com o eixo do ímã (cinza) e o estado que segue adiante (violeta). */
(function () {
  "use strict";
  var S = window.SGCore, root = document.getElementById("demo-sg");
  if (!S || !root) return;
  var $ = function (id) { return document.getElementById(id); };
  var pre = $("sg-preset"), t1 = $("sg-t1"), t2 = $("sg-t2"), t3 = $("sg-t3"),
      v1 = $("sg-t1v"), v2 = $("sg-t2v"), v3 = $("sg-t3v"), s1 = $("sg-s1"), s2 = $("sg-s2"),
      usa2 = $("sg-usa2"), bCem = $("sg-cem"), bPlay = $("sg-play"), bZera = $("sg-zera"),
      cv = $("sg-canvas"), read = $("sg-readout");
  var r = S.rng(20261111), atomos = [], fila = 0, cont, tocando = false, ultimo = 0, raf = 0, acum = 0;
  var VEL = 260;   // px/s

  Object.keys(S.PRESETS).forEach(function (k) {
    var o = document.createElement("option"); o.value = k; o.textContent = S.PRESETS[k].label; pre.appendChild(o);
  });
  pre.value = "zxz";

  function cfg() {
    return { t1: +t1.value, s1: +s1.value, usa2: !!usa2.checked, t2: +t2.value, s2: +s2.value, t3: +t3.value };
  }
  /* contadores: os de etapa sobem quando o átomo SAI de cada ímã (é ali que o resultado se decide
     para quem olha); os dos detectores, quando ele chega lá */
  function zera() { atomos = []; fila = 0; cont = { forno: 0, passa1: 0, barra1: 0, passa2: 0, barra2: 0, mais: 0, menos: 0, det: { mais: 0, menos: 0 } }; }
  function aplica(k) {
    var p = S.PRESETS[k];
    t1.value = p.t1; s1.value = String(p.s1); usa2.checked = p.usa2; t2.value = p.t2; s2.value = String(p.s2); t3.value = p.t3;
    zera(); desenha();
  }

  function css(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }
  function cores() { return { ink: css("--ink"), soft: css("--ink-soft"), rule: css("--rule"), carac: css("--carac"), choque: css("--choque"), aux: css("--aux"), paper: css("--paper"), box: css("--box-bg") }; }
  function pct(x) { return (100 * x).toFixed(1).replace(".", ",") + "%"; }
  function graus(v) { return v + "°"; }

  /* geometria do esquema, recalculada a cada quadro (a largura muda no telefone) */
  function geo() {
    var w = cv.clientWidth, h = cv.clientHeight;
    var g = { w: w, h: h, y0: h * 0.62, dy: Math.min(46, h * 0.14), bw: Math.max(34, w * 0.07), bh: Math.min(64, h * 0.2), dr: Math.min(22, w * 0.04) };
    g.forno = w * 0.05; g.m = [w * 0.25, w * 0.5, w * 0.74]; g.det = w * 0.95; g.yd = h * 0.2;
    return g;
  }
  /* o caminho de um átomo: lista de pontos */
  function caminho(g, a, c) {
    var p = [[g.forno + 14, g.y0]], i, sai;
    var ims = c.usa2 ? [0, 1, 2] : [0, 2];
    var sinais = { 0: c.s1, 1: c.s2 };
    for (i = 0; i < ims.length; i++) {
      var k = ims[i], xm = g.m[k];
      p.push([xm - g.bw / 2, g.y0]); p.push([xm + g.bw / 2, g.y0]);
      var ultimo = k === 2, etapaAqui = k === 0 ? 1 : (k === 1 ? 2 : 3);
      if (ultimo) { p.push([g.det - 16, g.y0 - a.sinal * g.dy * 1.5]); return p; }
      if (a.etapa === etapaAqui) {                         // barrado aqui: sai pelo feixe errado e para
        p.push([xm + g.bw / 2 + 0.06 * g.w, g.y0 - a.sinal * g.dy]); return p;
      }
      sai = sinais[k];
      var xn = g.m[ims[i + 1]] - g.bw / 2;
      p.push([xm + g.bw / 2 + 0.05 * g.w, g.y0 - sai * g.dy]);
      p.push([xm + g.bw / 2 + 0.05 * g.w + (xn - xm - g.bw / 2 - 0.05 * g.w) * 0.45, g.y0 - sai * g.dy * 0.3]);
      p.push([xn - 8, g.y0]);
    }
    return p;
  }
  function comprimento(p) { var L = 0; for (var i = 1; i < p.length; i++) L += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); return L; }
  function ponto(p, d) {
    for (var i = 1; i < p.length; i++) {
      var s = Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]);
      if (d <= s) { var u = s ? d / s : 0; return [p[i - 1][0] + u * (p[i][0] - p[i - 1][0]), p[i - 1][1] + u * (p[i][1] - p[i - 1][1])]; }
      d -= s;
    }
    return p[p.length - 1];
  }

  function solta(g, c) {
    var a = S.atomo(c, r);
    var p = caminho(g, a, c);
    atomos.push({ a: a, p: p, L: comprimento(p), d: 0 });
    cont.forno++;
  }
  function chega(at) { if (at.a.etapa === 3) { if (at.a.sinal > 0) cont.det.mais++; else cont.det.menos++; } }
  /* registra as etapas que o átomo já atravessou (pela posição x da sua bolinha) */
  function cruza(at, g, c) {
    var x = ponto(at.p, at.d)[0];
    at.feitas = at.feitas || {};
    if (!at.feitas[1] && x > g.m[0] + g.bw / 2) { at.feitas[1] = true; if (at.a.etapa === 1) cont.barra1++; else cont.passa1++; }
    if (c.usa2 && at.a.etapa !== 1 && !at.feitas[2] && x > g.m[1] + g.bw / 2) { at.feitas[2] = true; if (at.a.etapa === 2) cont.barra2++; else cont.passa2++; }
    if (at.a.etapa === 3 && !at.feitas[3] && x > g.m[2] + g.bw / 2) { at.feitas[3] = true; if (at.a.sinal > 0) cont.mais++; else cont.menos++; }
  }

  function seta(ctx, x0, y0, x1, y1, cor, larg) {
    var ang = Math.atan2(y1 - y0, x1 - x0), h = 6 + larg;
    ctx.strokeStyle = cor; ctx.fillStyle = cor; ctx.lineWidth = larg;
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1 - Math.cos(ang) * h * 0.6, y1 - Math.sin(ang) * h * 0.6); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x1, y1);
    ctx.lineTo(x1 - h * Math.cos(ang - 0.45), y1 - h * Math.sin(ang - 0.45));
    ctx.lineTo(x1 - h * Math.cos(ang + 0.45), y1 - h * Math.sin(ang + 0.45)); ctx.closePath(); ctx.fill();
  }
  /* mostrador: eixo do ímã e, se houver, o estado que segue adiante */
  function mostrador(ctx, g, x, theta, s, col, rot) {
    var R = g.dr, y = g.yd, t = theta * Math.PI / 180, ex = Math.sin(t), ez = Math.cos(t);
    ctx.strokeStyle = col.rule; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(x, y, R, 0, 2 * Math.PI); ctx.stroke();
    ctx.fillStyle = col.soft; ctx.font = "11px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "bottom";
    ctx.fillText("z", x, y - R - 2); ctx.textAlign = "left"; ctx.textBaseline = "middle"; ctx.fillText("x", x + R + 3, y);
    ctx.strokeStyle = col.soft; ctx.lineWidth = 1.5; ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(x - ex * R, y + ez * R); ctx.lineTo(x + ex * R, y - ez * R); ctx.stroke(); ctx.setLineDash([]);
    if (s) seta(ctx, x, y, x + s * ex * R, y - s * ez * R, col.carac, 2.4);
    ctx.fillStyle = col.ink; ctx.textAlign = "center"; ctx.textBaseline = "top"; ctx.font = "12px sans-serif";
    ctx.fillText(rot, x, y + R + 4);
  }

  function desenha() {
    var c = cfg(), col = cores(), g = geo();
    v1.textContent = graus(c.t1); v2.textContent = graus(c.t2); v3.textContent = graus(c.t3);
    t2.disabled = s2.disabled = !c.usa2;
    var dpr = window.devicePixelRatio || 1;
    if (cv.width !== Math.round(g.w * dpr) || cv.height !== Math.round(g.h * dpr)) { cv.width = Math.round(g.w * dpr); cv.height = Math.round(g.h * dpr); }
    var ctx = cv.getContext("2d"); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, g.w, g.h);

    // feixes: os caminhos possíveis, finos; os barrados em vermelho, com o anteparo
    var possiveis = [{ p: caminho(g, { etapa: 1, sinal: -c.s1 }, c), barrado: true }];
    if (c.usa2) possiveis.push({ p: caminho(g, { etapa: 2, sinal: -c.s2 }, c), barrado: true });
    possiveis.push({ p: caminho(g, { etapa: 3, sinal: +1 }, c), barrado: false });
    possiveis.push({ p: caminho(g, { etapa: 3, sinal: -1 }, c), barrado: false });
    possiveis.forEach(function (q) {
      ctx.strokeStyle = q.barrado ? col.choque : col.rule; ctx.lineWidth = q.barrado ? 1.5 : 2; ctx.globalAlpha = q.barrado ? 0.55 : 1;
      ctx.beginPath(); q.p.forEach(function (pt, i) { if (i) ctx.lineTo(pt[0], pt[1]); else ctx.moveTo(pt[0], pt[1]); }); ctx.stroke();
      ctx.globalAlpha = 1;
      if (q.barrado) { var e = q.p[q.p.length - 1]; ctx.fillStyle = col.choque; ctx.fillRect(e[0] - 2, e[1] - 9, 5, 18); }
    });

    // forno
    ctx.fillStyle = col.box; ctx.strokeStyle = col.ink; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.rect(g.forno - 12, g.y0 - 16, 26, 32); ctx.fill(); ctx.stroke();
    ctx.fillStyle = col.soft; ctx.font = "11px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "top";
    ctx.fillText("forno", g.forno + 1, g.y0 + 20);

    // ímãs e mostradores
    var info = [[c.t1, c.s1, "ímã 1"], [c.t2, c.s2, "ímã 2"], [c.t3, 0, "ímã 3"]];
    g.m.forEach(function (xm, k) {
      var on = k !== 1 || c.usa2;
      ctx.globalAlpha = on ? 1 : 0.3;
      ctx.fillStyle = col.box; ctx.strokeStyle = col.ink; ctx.lineWidth = 1.5;
      if (!on) ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.rect(xm - g.bw / 2, g.y0 - g.bh / 2, g.bw, g.bh); ctx.fill(); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = col.ink; ctx.font = "bold 12px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(on ? graus(info[k][0]) : "—", xm, g.y0);
      mostrador(ctx, g, xm, info[k][0], on ? info[k][1] : 0, col, on ? info[k][2] : "(retirado)");
      ctx.globalAlpha = 1;
    });

    // detectores
    [[+1, cont.det.mais], [-1, cont.det.menos]].forEach(function (d) {
      var y = g.y0 - d[0] * g.dy * 1.5;
      ctx.fillStyle = col.box; ctx.strokeStyle = col.ink; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.rect(g.det - 16, y - 13, 26, 26); ctx.fill(); ctx.stroke();
      ctx.fillStyle = col.ink; ctx.font = "bold 12px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(d[0] > 0 ? "+" : "−", g.det - 3, y);
      ctx.font = "11px sans-serif"; ctx.textBaseline = d[0] > 0 ? "bottom" : "top";
      ctx.fillText(String(d[1]), g.det - 3, d[0] > 0 ? y - 15 : y + 15);
    });

    // átomos
    ctx.fillStyle = col.carac;
    atomos.forEach(function (at) { var q = ponto(at.p, at.d); ctx.beginPath(); ctx.arc(q[0], q[1], 2.6, 0, 2 * Math.PI); ctx.fill(); });

    texto(c);
  }

  function texto(c) {
    var T = S.teoria(c), k = cont, h = [], n1 = k.passa1 + k.barra1, n2 = k.passa2 + k.barra2, n3 = k.mais + k.menos;
    h.push("<span>saíram do forno <b>" + k.forno + "</b></span>");
    if (n1) h.push("<span>passaram pelo ímã 1 <b>" + pct(k.passa1 / n1) + "</b> (teoria " + pct(T.passa1) + ")</span>");
    if (c.usa2 && n2) h.push("<span>passaram pelo ímã 2 <b>" + pct(k.passa2 / n2) + "</b> (teoria " + pct(T.passa2) + ")</span>");
    if (n3) h.push("<span>no ímã 3, deram + <b>" + pct(k.mais / n3) + "</b> (teoria " + pct(T.mais) + ")</span>");
    else h.push("<span>teoria no ímã 3: + com chance <b>" + pct(T.mais) + "</b>, − com chance <b>" + pct(T.menos) + "</b></span>");
    read.innerHTML = h.join("");
  }

  function quadro(ts) {
    raf = 0;
    var dt = ultimo ? Math.min(0.05, (ts - ultimo) / 1000) : 0; ultimo = ts;
    var g = geo(), c = cfg();
    if (tocando) { acum += dt * 40; while (acum >= 1) { solta(g, c); acum -= 1; } }
    var n = Math.min(fila, Math.ceil(dt * 70)); for (var i = 0; i < n; i++) solta(g, c); fila -= n;
    atomos.forEach(function (at) { at.d += VEL * dt; cruza(at, g, c); });
    atomos = atomos.filter(function (at) { if (at.d >= at.L) { chega(at); return false; } return true; });
    desenha();
    if (tocando || fila > 0 || atomos.length) raf = requestAnimationFrame(quadro); else ultimo = 0;
  }
  function anima() { if (!raf) { raf = requestAnimationFrame(quadro); } }

  pre.addEventListener("change", function () { aplica(pre.value); });
  [t1, t2, t3].forEach(function (el) { el.addEventListener("input", function () { zera(); desenha(); }); });
  [s1, s2, usa2].forEach(function (el) { el.addEventListener("change", function () { zera(); desenha(); }); });
  bCem.addEventListener("click", function () { fila += 100; anima(); });
  bPlay.addEventListener("click", function () {
    tocando = !tocando; bPlay.textContent = tocando ? "⏸ Pausar" : "▶ Contínuo"; if (tocando) anima();
  });
  bZera.addEventListener("click", function () { zera(); desenha(); });
  window.addEventListener("resize", function () { atomos = []; desenha(); });
  document.addEventListener("themechange", desenha);
  zera(); aplica(pre.value);
})();
