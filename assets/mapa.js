/* Mapa de conceitos (estilo "mapa de metrô"): raias = temas, setas = "ajuda a ler antes".
 * Para acrescentar uma página: troque `href: null` do nó correspondente pelo caminho da página.
 * Um href que começa com http leva ao livro de EDP (nó com borda verde-azulada).
 * A função renderSVG é pura (devolve texto) — roda também no Node, para testes.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.Mapa = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var EDP = "https://moacyr-alvim.github.io/notas_aula_edp/paginas/";

  var LANES = [
    { id: "spin",   label: "Spin e\namplitudes" },
    { id: "form",   label: "Formalismo" },
    { id: "ondas",  label: "Ondas em\numa dimensão" },
    { id: "oper",   label: "Métodos de\noperadores" },
    { id: "ang",    label: "Momento angular\ne três dimensões" },
    { id: "muitas", label: "Mais de uma\npartícula" },
    { id: "aprox",  label: "Aproximações" },
    { id: "class",  label: "Ponte com o\nclássico" }
  ];

  /* três portas de entrada, uma por livro, e quatro percursos temáticos */
  var TRAILS = [
    { id: "spin",    label: "Porta do spin (Freericks)" },
    { id: "ondas",   label: "Porta das ondas (Griffiths)" },
    { id: "postul", label: "Porta dos postulados (Shankar)" },
    { id: "oper",    label: "Só operadores" },
    { id: "info",    label: "Informação quântica" },
    { id: "aprox",   label: "Aproximações" },
    { id: "atomo",   label: "Rumo ao átomo" }
  ];

  // href: null  =>  "em breve"
  var NODES = [
    /* ---- spin e amplitudes ---- */
    { id: "sg", lane: "spin", col: 0, label: "Stern–Gerlach\ne o qubit", href: "paginas/stern-gerlach.html", trails: ["spin", "oper", "info"],
      desc: "Ímãs em sequência que apagam a memória do átomo: amplitudes, probabilidades como quadrados, o estado como vetor em ℂ² e a esfera de Bloch. Com demo de ímãs em série." },
    { id: "polar", lane: "spin", col: 1, row: 1, label: "Polarização\nda luz", href: null, trails: ["spin", "info"],
      desc: "O mesmo qubit num fóton: polarizadores, a lei de Malus como regra de Born e o paradoxo dos três polarizadores." },
    { id: "evol", lane: "spin", col: 3, label: "Evolução no tempo:\nprecessão e Rabi", href: "paginas/evolucao-spin.html", trails: ["spin", "postul", "oper", "info", "aprox"],
      desc: "U(t) = e^{−iHt/ħ}, estados estacionários, o retrato de Heisenberg, o spin girando num campo magnético e a ressonância de Rabi. Com a esfera de Bloch animada." },

    /* ---- formalismo ---- */
    { id: "dirac", lane: "form", col: 1, label: "Notação de Dirac\ne bases contínuas", href: "paginas/dirac.html", trails: ["spin", "ondas", "postul", "oper", "info"],
      desc: "A álgebra linear que você já sabe, escrita como os físicos escrevem — e o que é novo: as bases |x⟩ e |p⟩, a normalização com delta e a função de onda como ⟨x|ψ⟩. Com Python." },
    { id: "post", lane: "form", col: 2, label: "Observáveis\ne medição", href: "paginas/observaveis.html", trails: ["spin", "ondas", "postul", "info"],
      desc: "Os postulados: operador hermitiano, autovalores como resultados possíveis, regra de Born, colapso, valor esperado e o teorema espectral. Com simulação de medições." },
    { id: "incert", lane: "form", col: 3, label: "Comutadores\ne incerteza", href: "paginas/incerteza.html", trails: ["spin", "ondas", "postul", "oper"],
      desc: "[x, p] = iħ, a desigualdade de Robertson por Cauchy–Schwarz, observáveis compatíveis e por que a gaussiana é o pacote mais apertado." },
    { id: "simet", lane: "form", col: 3, row: 1, label: "Simetrias e\ngeradores", href: null, trails: ["postul"],
      desc: "Translação gerada pelo momento, rotação pelo momento angular, tempo pelo hamiltoniano: simetria vira lei de conservação." },
    { id: "dens", lane: "form", col: 5, label: "Matriz\ndensidade", href: null, trails: ["info"],
      desc: "Estados mistos, traço parcial, pureza e por que uma metade de um par emaranhado não tem estado próprio." },

    /* ---- ondas ---- */
    { id: "onda", lane: "ondas", col: 1, label: "A função de onda\ne Schrödinger", href: "paginas/funcao-de-onda.html", trails: ["ondas", "postul", "aprox", "atomo"],
      desc: "|ψ|² como densidade de probabilidade, a corrente de probabilidade, por que a norma se conserva, o operador momento e o teorema de Ehrenfest." },
    { id: "livre", lane: "ondas", col: 2, label: "Partícula livre e\npacotes de onda", href: "paginas/particula-livre.html", trails: ["ondas", "postul"],
      desc: "Ondas planas que não são estados, o pacote gaussiano que se espalha, velocidade de grupo contra velocidade de fase. Demo e Python (split-step)." },
    { id: "poco", lane: "ondas", col: 2, row: 1, label: "Poço infinito\n(livro de EDP) ↗", href: EDP + "poco-infinito.html", trails: ["ondas"],
      desc: "No livro de EDP: os níveis de energia como harmônicos de uma corda, ocupações que não mudam e o ressurgimento quântico em t = 2π." },
    { id: "barr", lane: "ondas", col: 3, label: "Degraus, barreiras\ne tunelamento", href: "paginas/barreira.html", trails: ["ondas", "aprox"],
      desc: "Espalhamento em uma dimensão: reflexão onde a física clássica passaria, transmissão onde ela bateria, T(E) com ressonâncias. Demo." },
    { id: "pfin", lane: "ondas", col: 4, label: "Poço finito e\nestados ligados", href: null, trails: ["ondas", "atomo"],
      desc: "Quantos níveis cabem num poço de profundidade finita, a equação transcendental e a cauda que vaza para a região proibida." },
    { id: "num", lane: "ondas", col: 4, row: 1, label: "Schrödinger\nno computador", href: null, trails: ["ondas"],
      desc: "Crank–Nicolson, split-step e diagonalização em grade: três jeitos de resolver, e o que cada um conserva." },
    { id: "delta", lane: "ondas", col: 5, label: "O potencial\ndelta", href: null, trails: ["ondas"],
      desc: "Um estado ligado só, e o salto da derivada como condição de contorno." },

    /* ---- operadores ---- */
    { id: "osc", lane: "oper", col: 4, label: "Oscilador harmônico:\noperadores escada", href: "paginas/oscilador.html", trails: ["ondas", "postul", "oper", "atomo"],
      desc: "a e a†, o estado fundamental de aψ₀ = 0, a escada de energias ħω(n + ½), as funções de Hermite e o estado coerente que oscila como um pêndulo. Demo e Python." },
    { id: "coer", lane: "oper", col: 5, label: "Estados\ncoerentes", href: null, trails: ["oper"],
      desc: "Autovetores de a, o mínimo de incerteza que não se espalha, e o laser." },
    { id: "fator", lane: "oper", col: 5, row: 1, label: "O método da\nfatorização", href: null, trails: ["oper", "atomo"],
      desc: "A ideia de Schrödinger que o Freericks leva longe: escrever H = A†A + E e descer a escada de hamiltonianos parceiros." },
    { id: "segq", lane: "oper", col: 6, label: "Segunda\nquantização", href: null, trails: ["oper"],
      desc: "Criar e destruir partículas: o espaço de Fock e os operadores de bósons e férmions." },

    /* ---- momento angular ---- */
    { id: "momang", lane: "ang", col: 4, label: "Momento angular:\na álgebra", href: "paginas/momento-angular.html", trails: ["spin", "ondas", "postul", "oper", "atomo"],
      desc: "Só a partir de [Jx, Jy] = iħJz: j(j+1), os degraus J±, por que j é inteiro ou meio-inteiro, e as matrizes para qualquer spin. Com Python." },
    { id: "harm", lane: "ang", col: 5, label: "Harmônicos\nesféricos", href: null, trails: ["ondas", "atomo"],
      desc: "O momento angular orbital em coordenadas: Yₗₘ, paridade e a parte angular de qualquer potencial central." },
    { id: "soma", lane: "ang", col: 5, row: 1, label: "Soma de\nmomentos angulares", href: null, trails: ["spin"],
      desc: "Dois spins ½ dão um tripleto e um singleto; Clebsch–Gordan sem tabela." },
    { id: "hidro", lane: "ang", col: 6, label: "Átomo de\nhidrogênio", href: null, trails: ["ondas", "oper", "atomo"],
      desc: "Os níveis −13,6 eV/n², a degenerescência acidental e o vetor de Runge–Lenz." },

    /* ---- várias partículas ---- */
    { id: "bell", lane: "muitas", col: 4, label: "Emaranhamento\ne Bell", href: "paginas/emaranhamento.html", trails: ["spin", "info"],
      desc: "O produto tensorial, estados que não se fatoram, o singleto, e a desigualdade CHSH que nenhuma teoria local de variáveis ocultas passa de 2. Demo." },
    { id: "ident", lane: "muitas", col: 5, label: "Partículas\nidênticas", href: null, trails: ["info"],
      desc: "Bósons, férmions, o princípio de exclusão e a troca." },
    { id: "heis", lane: "muitas", col: 6, label: "Modelos de spin:\nIsing e Heisenberg", href: null, trails: ["spin"],
      desc: "Spins vizinhos que interagem: o modelo de Heisenberg como origem do magnetismo, e uma cadeia pequena diagonalizada." },

    /* ---- aproximações ---- */
    { id: "var", lane: "aprox", col: 4, label: "Princípio\nvariacional", href: null, trails: ["aprox"],
      desc: "Qualquer estado de teste dá uma cota superior para a energia fundamental." },
    { id: "pert", lane: "aprox", col: 5, label: "Perturbação\nestacionária", href: null, trails: ["aprox", "atomo"],
      desc: "Correções de energia em primeira e segunda ordem, e o caso degenerado." },
    { id: "wkb", lane: "aprox", col: 5, row: 1, label: "WKB", href: null, trails: ["aprox"],
      desc: "A fase que se acumula devagar, a regra de quantização de Bohr–Sommerfeld e o tunelamento exponencial." },
    { id: "ouro", lane: "aprox", col: 6, label: "Perturbação no\ntempo e regra de ouro", href: null, trails: ["aprox", "info"],
      desc: "Transições induzidas, a regra de ouro de Fermi e o limite fraco de Rabi." },

    /* ---- ponte com o clássico ---- */
    { id: "lagr", lane: "class", col: 0, label: "Lagrange e Hamilton\n(livro de EDP) ↗", href: EDP + "euler-lagrange.html", trails: ["postul"],
      desc: "No livro de EDP: a ação mínima, Euler–Lagrange e a transformada de Legendre entre lagrangiano e hamiltoniano — o ponto de partida da quantização." },
    { id: "ehr", lane: "class", col: 3, label: "Ehrenfest e o\nlimite clássico", href: null, trails: ["postul"],
      desc: "Os valores esperados obedecem a Newton — quase. Quando o quase importa." },
    { id: "cam", lane: "class", col: 6, label: "Integral de\ncaminho", href: null, trails: ["postul"],
      desc: "A amplitude como soma sobre todos os caminhos, com o peso e^{iS/ħ}: Feynman, via Shankar." }
  ];

  var EDGES = [
    ["sg", "dirac"], ["sg", "post"], ["sg", "polar"], ["sg", "evol"],
    ["dirac", "post"], ["post", "incert"], ["post", "evol"], ["dirac", "simet"],
    ["dirac", "bell"], ["post", "bell"], ["polar", "bell"], ["bell", "dens"], ["post", "dens"],
    ["onda", "livre"], ["onda", "poco"], ["onda", "post"], ["livre", "barr"], ["livre", "incert"],
    ["poco", "pfin"], ["barr", "pfin"], ["pfin", "delta"], ["livre", "num"], ["barr", "num"],
    ["incert", "osc"], ["osc", "coer"], ["osc", "fator"], ["osc", "segq"], ["fator", "hidro"],
    ["incert", "momang"], ["simet", "momang"], ["momang", "harm"], ["momang", "soma"], ["harm", "hidro"],
    ["bell", "ident"], ["ident", "segq"], ["soma", "heis"], ["bell", "heis"],
    ["onda", "var"], ["var", "pert"], ["pert", "ouro"], ["evol", "ouro"], ["barr", "wkb"],
    ["lagr", "ehr"], ["onda", "ehr"], ["ehr", "cam"]
  ];

  // geometria
  var G = { nodeW: 168, nodeH: 44, colStep: 212, laneH: 84, rowStep: 54, padLeft: 150, padTop: 14, padRight: 14, padBottom: 14 };

  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function externo(n) { return !!n.href && /^https?:/.test(n.href); }

  function layout() {
    var y = G.padTop, lanes = {}, cols = 0;
    LANES.forEach(function (l) {
      var rows = 1;
      NODES.forEach(function (n) { if (n.lane === l.id) rows = Math.max(rows, (n.row || 0) + 1); });
      var h = G.laneH + (rows - 1) * G.rowStep;
      lanes[l.id] = { y: y, h: h, rows: rows, label: l.label };
      y += h;
    });
    NODES.forEach(function (n) { cols = Math.max(cols, n.col + 1); });
    var pos = {};
    NODES.forEach(function (n) {
      var L = lanes[n.lane];
      var cy = L.y + G.laneH / 2 + (n.row || 0) * G.rowStep;
      pos[n.id] = { x: G.padLeft + n.col * G.colStep, y: cy - G.nodeH / 2, cy: cy };
    });
    return { lanes: lanes, pos: pos, width: G.padLeft + (cols - 1) * G.colStep + G.nodeW + G.padRight, height: y + G.padBottom };
  }

  function byId(id) { for (var i = 0; i < NODES.length; i++) if (NODES[i].id === id) return NODES[i]; return null; }

  /* trilha: "all" ou id; devolve SVG como texto */
  function renderSVG(trail) {
    var L = layout(), out = [];
    var inTrail = function (n) { return trail === "all" || n.trails.indexOf(trail) >= 0; };
    out.push('<svg class="map" viewBox="0 0 ' + L.width + " " + L.height + '" width="' + L.width + '" height="' + L.height + '" xmlns="http://www.w3.org/2000/svg" role="group" aria-label="Mapa de conceitos">');
    out.push('<defs><marker id="seta" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,1 L9,5 L0,9 z" class="seta"/></marker></defs>');

    LANES.forEach(function (l, i) {
      var a = L.lanes[l.id];
      out.push('<rect class="lane' + (i % 2 ? " alt" : "") + '" x="0" y="' + a.y + '" width="' + L.width + '" height="' + a.h + '"/>');
      var lines = l.label.split("\n");
      lines.forEach(function (t, k) {
        out.push('<text class="lane-label" x="14" y="' + (a.y + G.laneH / 2 + (k - (lines.length - 1) / 2) * 17 + 5) + '">' + esc(t) + "</text>");
      });
    });

    EDGES.forEach(function (e) {
      var A = L.pos[e[0]], B = L.pos[e[1]], na = byId(e[0]), nb = byId(e[1]);
      var x1 = A.x + G.nodeW, y1 = A.cy, x2 = B.x - 2, y2 = B.cy, dx = (x2 - x1) / 2;
      var on = inTrail(na) && inTrail(nb);
      out.push('<path class="edge' + (on ? "" : " dim") + '" d="M' + x1 + "," + y1 + " C" + (x1 + dx) + "," + y1 + " " + (x2 - dx) + "," + y2 + " " + x2 + "," + y2 + '" marker-end="url(#seta)"/>');
    });

    NODES.forEach(function (n) {
      var p = L.pos[n.id], ok = !!n.href, lines = n.label.split("\n");
      var cls = "node " + (ok ? "ok" : "soon") + (externo(n) ? " ext" : "") + (inTrail(n) ? "" : " dim");
      var inner = '<rect x="' + p.x + '" y="' + p.y + '" width="' + G.nodeW + '" height="' + G.nodeH + '" rx="6"/>';
      lines.forEach(function (t, k) {
        inner += '<text x="' + (p.x + G.nodeW / 2) + '" y="' + (p.cy + (k - (lines.length - 1) / 2) * 16 + 5) + '" text-anchor="middle">' + esc(t) + "</text>";
      });
      var label = lines.join(" ").replace(" ↗", "") + (ok ? (externo(n) ? " (abre o livro de EDP)" : "") : " (em breve)");
      if (ok) out.push('<a class="' + cls + '" href="' + esc(n.href) + '" data-id="' + n.id + '" aria-label="' + esc(label) + '">' + inner + "</a>");
      else out.push('<g class="' + cls + '" data-id="' + n.id + '" tabindex="0" role="img" aria-label="' + esc(label) + '">' + inner + "</g>");
    });
    out.push("</svg>");
    return out.join("");
  }

  /* ---------- parte que mexe na página (só no navegador) ---------- */
  function mount(opts) {
    var host = document.getElementById(opts.map), chips = document.getElementById(opts.chips),
        info = document.getElementById(opts.info), list = document.getElementById(opts.list);
    var trail = "all";

    function nodesOfTrail(t) {
      return NODES.filter(function (n) { return t === "all" || n.trails.indexOf(t) >= 0; });
    }

    function draw() {
      host.innerHTML = renderSVG(trail);
      chips.querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.trail === trail)); });
      list.textContent = "";
      var t = TRAILS.filter(function (x) { return x.id === trail; })[0];
      if (t) {
        var h = document.createElement("p"); h.className = "trail-title"; h.textContent = "Percurso: " + t.label; list.appendChild(h);
        var ol = document.createElement("ol");
        nodesOfTrail(trail).slice().sort(function (a, b) { return a.col - b.col; }).forEach(function (n) {
          var li = document.createElement("li"), name = n.label.replace(/\n/g, " ");
          if (n.href) { var a = document.createElement("a"); a.href = n.href; a.textContent = name; li.appendChild(a); }
          else { li.textContent = name + " "; var s = document.createElement("span"); s.className = "soon"; s.textContent = "(em breve)"; li.appendChild(s); }
          ol.appendChild(li);
        });
        list.appendChild(ol);
      }
    }

    function describe(el) {
      var g = el && el.closest && el.closest("[data-id]");
      if (!g) return;
      var n = byId(g.getAttribute("data-id"));
      info.textContent = n.label.replace(/\n/g, " ").replace(" ↗", "") + " — " + n.desc + (n.href ? "" : " (página em breve)");
    }
    host.addEventListener("mouseover", function (e) { describe(e.target); });
    host.addEventListener("focusin", function (e) { describe(e.target); });

    var bAll = document.createElement("button");
    bAll.type = "button"; bAll.dataset.trail = "all"; bAll.textContent = "Tudo";
    chips.appendChild(bAll);
    TRAILS.forEach(function (t) {
      var b = document.createElement("button"); b.type = "button"; b.dataset.trail = t.id; b.textContent = t.label; chips.appendChild(b);
    });
    chips.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      trail = b.dataset.trail; draw();
    });
    draw();
  }

  return { LANES: LANES, TRAILS: TRAILS, NODES: NODES, EDGES: EDGES, G: G, layout: layout, renderSVG: renderSVG, mount: mount };
});
