// Teste de fumaça com um DOM simulado (sem navegador): executa os scripts de tela e o executor de Python
// com Worker/fetch/canvas falsos e confere que nada lança erro e que o fluxo básico funciona.
// Rodar:  node tests/smoke_dom.js
const fs = require("fs"), path = require("path"), vm = require("vm");
const root = path.resolve(__dirname, "..");
let fails = 0;
const check = (n, ok, i) => { console.log(ok ? "ok   " : "FALHA", n, i || ""); if (!ok) fails++; };

/* ---------- DOM mínimo ---------- */
class El {
  constructor(tag) {
    this.tagName = tag; this.children = []; this.dataset = {}; this.style = {}; this.listeners = {}; this.attrs = {};
    this._text = ""; this.className = ""; this.value = ""; this.disabled = false; this.open = false; this.parent = null;
    this.classList = { add: (c) => { this.className += " " + c; }, remove: () => {}, contains: () => false };
    this.clientWidth = 600; this.clientHeight = 280; this.width = 0; this.height = 0; this.scrollTop = 0; this.scrollHeight = 100;
  }
  set textContent(v) { this._text = String(v); if (v === "") this.children = []; }
  get textContent() { return this._text + this.children.map((c) => c.textContent).join(""); }
  set innerHTML(v) { this._html = v; this.children = []; }
  get innerHTML() { return this._html || ""; }
  appendChild(c) { c.parent = this; this.children.push(c); return c; }
  setAttribute(k, v) { this.attrs[k] = v; }
  getAttribute(k) { return this.attrs[k]; }
  addEventListener(t, f) { (this.listeners[t] = this.listeners[t] || []).push(f); }
  fire(t, ev) { (this.listeners[t] || []).forEach((f) => f(ev || { key: "", preventDefault() {} })); }
  click() { this.fire("click"); }
  querySelectorAll() { return []; }
  closest() { return null; }
  remove() {}
  select() {} focus() {}
  getContext() { return ctx; }
  find(pred, out = []) { if (pred(this)) out.push(this); this.children.forEach((c) => c.find(pred, out)); return out; }
}
const calls = {};
const ctx = new Proxy({}, { get: (t, k) => (k === "measureText" ? () => ({ width: 10 }) : (...a) => { calls[k] = (calls[k] || 0) + 1; }), set: () => true });

function makeEnv(ids, pycells) {
  const byId = {}; ids.forEach((i) => (byId[i] = new El(i.endsWith("canvas") ? "canvas" : "div")));
  const doc = {
    readyState: "complete", currentScript: { src: "http://x/assets/pyrunner.js" }, body: new El("body"), documentElement: new El("html"),
    getElementById: (i) => byId[i] || null, querySelectorAll: (s) => (s === ".pycell" ? pycells : []),
    createElement: (t) => new El(t), addEventListener() {}, dispatchEvent() {}, execCommand() {},
  };
  const posted = [];
  class FakeWorker {
    constructor(url) { this.url = url; FakeWorker.last = this; setTimeout(() => this.onmessage({ data: { type: "status", text: "Carregando numpy…" } }), 0); setTimeout(() => this.onmessage({ data: { type: "ready" } }), 5); }
    postMessage(m) {
      posted.push(m);
      setTimeout(() => {
        if (m.code.includes("boom")) this.onmessage({ data: { type: "error", id: m.id, text: "Traceback...\nNameError" } });
        else { this.onmessage({ data: { type: "stdout", id: m.id, text: "olá" } }); this.onmessage({ data: { type: "done", id: m.id, figs: ["QUJD"], ms: 1234 } }); }
      }, 2);
    }
    terminate() { FakeWorker.terminated = true; }
  }
  const files = { "../py/a.py": "print('oi')\n", "../py/b.py": "boom()\n" };
  const win = {
    devicePixelRatio: 1, innerHeight: 800, addEventListener() {}, matchMedia: () => ({ matches: false, addEventListener() {} }),
    requestAnimationFrame: (f) => setTimeout(() => f(Date.now()), 0), localStorage: { getItem() { return null; }, setItem() {} },
  };
  const sandbox = {
    window: win, document: doc, Worker: FakeWorker, URL: Object.assign(URL, { createObjectURL: () => "blob:x", revokeObjectURL() {} }), Blob: class {},
    fetch: (u) => Promise.resolve({ ok: u in files, status: u in files ? 200 : 404, text: () => Promise.resolve(files[u]) }),
    getComputedStyle: () => ({ getPropertyValue: (n) => "#123456", fontFamily: "sans-serif" }),
    requestAnimationFrame: win.requestAnimationFrame, setTimeout, clearTimeout, performance, console, navigator: {},
    Event: class {}, Math, Float64Array, Array, Object, String, JSON, Date, isFinite, parseFloat, Infinity,
  };
  sandbox.self = sandbox; win.window = win; Object.assign(win, sandbox, { window: win }); sandbox.window = win;
  return { sandbox: vm.createContext(sandbox), doc, byId, FakeWorker, posted, win };
}
const run = (env, file) => vm.runInContext(fs.readFileSync(path.join(root, "assets", file), "utf8"), env.sandbox, { filename: file });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const texto = (env, id) => env.byId[id].innerHTML.replace(/<[^>]+>/g, "");
  const carrega = async (ids, core, nome, demo, ms) => {
    const env = makeEnv(ids, []);
    run(env, core); env.sandbox.window[nome] = env.sandbox[nome] || vm.runInContext(nome, env.sandbox);
    let err = null; try { run(env, demo); await wait(ms || 40); } catch (e) { err = e; }
    check(`${demo}: carrega e desenha sem erro`, !err, err && err.stack.split("\n")[0]);
    return env;
  };
  /* ---- Stern–Gerlach ---- */
  {
    const env = await carrega(["demo-sg", "sg-preset", "sg-t1", "sg-t1v", "sg-s1", "sg-usa2", "sg-t2", "sg-t2v", "sg-s2", "sg-t3", "sg-t3v", "sg-cem", "sg-play", "sg-zera", "sg-canvas", "sg-readout"],
                              "sg-core.js", "SGCore", "sg-demo.js");
    const rd = () => texto(env, "sg-readout");
    check("sg-demo: começa em z, x, z com a teoria meio a meio", rd().includes("+ com chance 50,0%"), rd().slice(0, 160));
    env.byId["sg-cem"].fire("click"); await wait(150);
    const n = +(rd().match(/saíram do forno (\d+)/) || [0, 0])[1];
    check("sg-demo: soltar 100 átomos põe átomos em voo", n > 0, rd().slice(0, 120));
    env.byId["sg-preset"].value = "ang"; env.byId["sg-preset"].fire("change"); await wait(20);
    check("sg-demo: a montagem de 60° mostra a teoria de 75%", rd().includes("75,0%"), rd().slice(0, 160));
    check("sg-demo: trocar de montagem zera os contadores", rd().includes("saíram do forno 0"), rd().slice(0, 60));
  }
  /* ---- esfera de Bloch: Rabi ---- */
  {
    const env = makeEnv(["demo-rabi", "rb-preset", "rb-ini", "rb-lab", "rb-D", "rb-Dv", "rb-O", "rb-Ov", "rb-t", "rb-tv", "rb-play", "rb-pi", "rb-esfera", "rb-prob", "rb-readout"], []);
    env.byId["rb-t"].max = "12.566";
    run(env, "rabi-core.js"); env.sandbox.window.RabiCore = env.sandbox.RabiCore || vm.runInContext("RabiCore", env.sandbox);
    let err = null; try { run(env, "rabi-demo.js"); await wait(40); } catch (e) { err = e; }
    check("rabi-demo.js: carrega e desenha sem erro", !err, err && err.stack.split("\n")[0]);
    const rd = () => texto(env, "rb-readout");
    check("rabi-demo: em ressonância a amplitude é 1", rd().includes("amplitude Ω²/W² = 1,000"), rd().slice(0, 200));
    env.byId["rb-pi"].fire("click"); await wait(20);
    check("rabi-demo: o pulso π vira o spin", rd().includes("P(−z) = 1,000"), rd().slice(0, 200));
    env.byId["rb-D"].value = "2"; env.byId["rb-D"].fire("input"); await wait(20);
    check("rabi-demo: com Δ = 2Ω a amplitude é 1/5", rd().includes("0,200"), rd().slice(0, 240));
    env.byId["rb-lab"].checked = true; env.byId["rb-lab"].fire("change"); await wait(20);
    check("rabi-demo: no laboratório desenha sem erro", rd().includes("P(−z)"));
  }
  /* ---- pacote livre ---- */
  {
    const env = await carrega(["demo-pac", "pc-sigma", "pc-sigmav", "pc-k0", "pc-k0v", "pc-t", "pc-tv", "pc-play", "pc-im", "pc-onda", "pc-larg", "pc-readout"],
                              "pacote-core.js", "PacoteCore", "pacote-demo.js");
    env.byId["pc-sigma"].value = "1"; env.byId["pc-k0"].value = "2"; env.byId["pc-t"].value = "0"; env.byId["pc-t"].fire("input"); await wait(20);
    const rd = () => texto(env, "pc-readout");
    check("pacote-demo: em t = 0, Δx·Δp = 0,5", rd().includes("Δx·Δp = 0,500"), rd().slice(0, 200));
    env.byId["pc-t"].value = "4"; env.byId["pc-t"].fire("input"); await wait(20);
    check("pacote-demo: em t = 4, Δx = √5 e o centro andou 8", rd().includes("Δx = 2,24") && rd().includes("⟨x⟩ = 3,00"), rd().slice(0, 200));
    env.byId["pc-im"].checked = true; env.byId["pc-im"].fire("change"); await wait(20);
    check("pacote-demo: mostrar Im ψ sem erro", rd().includes("v grupo = 2,00"));
  }
  /* ---- barreiras ---- */
  {
    const env = makeEnv(["demo-bar", "br-preset", "br-E", "br-Ev", "br-V0", "br-V0v", "br-a", "br-av", "br-ress", "br-psi", "br-T", "br-readout"], []);
    env.byId["br-E"].value = "0.6"; env.byId["br-E"].max = "6"; env.byId["br-V0"].value = "1"; env.byId["br-a"].value = "1.5";
    run(env, "barreira-core.js"); env.sandbox.window.BarreiraCore = env.sandbox.BarreiraCore || vm.runInContext("BarreiraCore", env.sandbox);
    let err = null; try { run(env, "barreira-demo.js"); await wait(40); } catch (e) { err = e; }
    check("barreira-demo.js: carrega e desenha sem erro", !err, err && err.stack.split("\n")[0]);
    const rd = () => texto(env, "br-readout");
    check("barreira-demo: T da barreira em E = 0,6 é 0,2321 (a fórmula fechada)", rd().includes("T = 0,2321") && rd().includes("T + R = 1,000000"), rd().slice(0, 200));
    env.byId["br-ress"].fire("click"); await wait(20);
    check("barreira-demo: próximo pico leva a T = 1", rd().includes("T = 1,0000"), rd().slice(0, 200));
    env.byId["br-preset"].value = "dupla"; env.byId["br-preset"].fire("change"); env.byId["br-E"].value = "0.1"; env.byId["br-E"].fire("input"); await wait(20);
    env.byId["br-ress"].fire("click"); await wait(20);
    check("barreira-demo: barreira dupla, ressonância abaixo de V0 com T = 1", rd().includes("T = 1,0000") && +env.byId["br-E"].value < 1, rd().slice(0, 200) + " E=" + env.byId["br-E"].value);
    env.byId["br-preset"].value = "degrau"; env.byId["br-preset"].fire("change"); env.byId["br-E"].value = "0.5"; env.byId["br-E"].fire("input"); await wait(20);
    check("barreira-demo: degrau abaixo de V0 reflete tudo", rd().includes("R = 1,0000"), rd().slice(0, 200));
  }
  /* ---- oscilador ---- */
  {
    const env = makeEnv(["demo-osc", "os-estado", "os-classica", "os-n", "os-nv", "os-alfa", "os-alfav", "os-t", "os-tv", "os-play", "os-onda", "os-fase", "os-readout"], []);
    env.byId["os-n"].value = "3"; env.byId["os-alfa"].value = "2"; env.byId["os-t"].value = "0"; env.byId["os-t"].max = "6.2832";
    run(env, "osc-core.js"); env.sandbox.window.OscCore = env.sandbox.OscCore || vm.runInContext("OscCore", env.sandbox);
    let err = null; try { run(env, "osc-demo.js"); await wait(40); } catch (e) { err = e; }
    check("osc-demo.js: carrega e desenha sem erro", !err, err && err.stack.split("\n")[0]);
    const rd = () => texto(env, "os-readout");
    check("osc-demo: o coerente tem Δx·Δp = 0,5 e ⟨E⟩ = 4,5", rd().includes("Δx·Δp = 0,500") && rd().includes("⟨E⟩ = 4,50"), rd().slice(0, 200));
    env.byId["os-estado"].value = "auto"; env.byId["os-estado"].fire("change"); await wait(20);
    check("osc-demo: |3⟩ tem Δx·Δp = 3,5", rd().includes("Δx·Δp = 3,500"), rd().slice(0, 200));
    env.byId["os-estado"].value = "gato"; env.byId["os-estado"].fire("change"); env.byId["os-classica"].checked = true; env.byId["os-classica"].fire("change"); await wait(20);
    check("osc-demo: gato com densidade clássica sem erro", rd().includes("⟨E⟩"));
  }
  /* ---- Bell ---- */
  {
    const env = makeEnv(["demo-bell", "bl-a", "bl-av", "bl-a2", "bl-a2v", "bl-b", "bl-bv", "bl-b2", "bl-b2v", "bl-otimo", "bl-rodar", "bl-zera", "bl-corr", "bl-S", "bl-readout"], []);
    Object.assign(env.byId["bl-a"], { value: "0" }); env.byId["bl-a2"].value = "60"; env.byId["bl-b"].value = "30"; env.byId["bl-b2"].value = "120";
    run(env, "bell-core.js"); env.sandbox.window.BellCore = env.sandbox.BellCore || vm.runInContext("BellCore", env.sandbox);
    let err = null; try { run(env, "bell-demo.js"); await wait(40); } catch (e) { err = e; }
    check("bell-demo.js: carrega e desenha sem erro", !err, err && err.stack.split("\n")[0]);
    const rd = () => texto(env, "bl-readout");
    check("bell-demo: ajustes iniciais dão S = −2,732 e local −2", rd().includes("S singleto = −2,732") && rd().includes("S local = −2,000"), rd().slice(0, 200));
    env.byId["bl-otimo"].fire("click"); await wait(20);
    check("bell-demo: ajustes ótimos dão 2√2", rd().includes("−2,828"), rd().slice(0, 200));
    env.byId["bl-rodar"].fire("click"); await wait(20);
    check("bell-demo: medir mostra o sorteio", rd().includes("medido"), rd().slice(0, 260));
  }
  /* ---- mapa ---- */
  {
    const env = makeEnv(["mapa", "chips", "info", "trail-list"], []);
    let err = null; try { run(env, "mapa.js"); vm.runInContext('Mapa.mount({map:"mapa",chips:"chips",info:"info",list:"trail-list"})', env.sandbox); } catch (e) { err = e; }
    check("mapa: monta sem erro", !err, err && err.stack.split("\n")[0]);
    check("mapa: SVG gerado com os 33 nós", (env.byId["mapa"].innerHTML.match(/class="node /g) || []).length === 33);
    check("mapa: botões de trilha criados (Tudo + 7 percursos)", env.byId["chips"].children.length === 8);
  }
  /* ---- executor de Python ---- */
  {
    const mk = (starter, sol) => { const c = new El("div"); c.dataset = { starter, title: "t", ...(sol ? { solution: sol } : {}) }; return c; };
    const c1 = mk("../py/a.py", "../py/a.py"), c2 = mk("../py/b.py");
    const env = makeEnv([], [c1, c2]);
    let err = null; try { run(env, "pyrunner.js"); await wait(20); } catch (e) { err = e; }
    check("pyrunner: inicializa as células", !err, err && err.stack.split("\n")[0]);
    const ta = (c) => c.find((e) => e.tagName === "textarea")[0];
    check("pyrunner: carrega o código inicial por fetch", ta(c1).value === "print('oi')\n", JSON.stringify(ta(c1).value));
    const btn = (c, label) => c.find((e) => e.tagName === "button" && e.textContent === label)[0];
    btn(c1, "Rodar").click(); await wait(40);
    const out = (c) => c.find((e) => e.className === "out")[0];
    check("pyrunner: mostra saída de texto", out(c1).textContent.includes("olá"));
    check("pyrunner: mostra a figura", out(c1).find((e) => e.tagName === "img")[0].src.startsWith("data:image/png;base64,QUJD"));
    check("pyrunner: manda código ao worker", env.posted.length === 1 && env.posted[0].code.includes("print"));
    // erro
    btn(c2, "Rodar").click(); await wait(40);
    check("pyrunner: mostra erro do Python", out(c2).find((e) => e.className === "err").length === 1);
    // parar: encerra o worker
    env.FakeWorker.prototype.postMessage = function () {};   // simula um código que nunca termina
    ta(c1).value = "while True: pass"; btn(c1, "Rodar").click();
    await wait(5);
    btn(c1, "Parar").click();
    check("pyrunner: Parar encerra o worker", env.FakeWorker.terminated === true);
    check("pyrunner: Parar avisa na saída", out(c1).textContent.includes("interrompida"));
  }
  console.log(fails ? `\n${fails} falha(s)` : "\ntodos os testes de fumaça passaram");
  process.exit(fails ? 1 : 0);
})();
