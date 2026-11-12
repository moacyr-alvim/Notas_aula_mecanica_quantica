"""Checagens estáticas do site de mecânica quântica (sem navegador).

Uso:  python3 tests/check_site.py
Confere: arquivos referenciados existem, âncoras do mapa existem, ids usados pelos scripts estão no HTML,
tags HTML balanceadas, e delimitadores de fórmula ($) em número par em cada página.
"""
import json, pathlib, re, subprocess, sys
from html.parser import HTMLParser

root = pathlib.Path(__file__).resolve().parent.parent

# O KaTeX mora DENTRO do repositório, em vendor/katex/. Antes vinha de um CDN, e a versão
# pedida lá (0.16.11) não era a instalada aqui (0.16.47): conferir fórmula localmente não valia
# como conferência, e foi assim que um apóstrofo sem base (\widehat g\,') passou batido —
# renderizava aqui e falhava no ar. Agora é um arquivo só, o mesmo nos dois lados.
KATEX = "0.16.47"
KATEX_ARQUIVOS = ("katex.min.css", "katex.min.js", "auto-render.min.js")

fails = 0
def check(name, ok, info=""):
    global fails
    print(("ok   " if ok else "FALHA"), name, info)
    fails += (not ok)

VOID = {"meta", "link", "br", "img", "input", "hr", "source", "area", "base", "col", "embed", "param", "track", "wbr"}

class P(HTMLParser):
    def __init__(self):
        super().__init__(); self.stack = []; self.errors = []; self.ids = set(); self.refs = []; self.pycells = []
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if "id" in a: self.ids.add(a["id"])
        for k in ("src", "href"):
            if k in a: self.refs.append(a[k])
        if "data-starter" in a: self.pycells.append(a["data-starter"])
        if "data-solution" in a: self.pycells.append(a["data-solution"])
        if tag not in VOID: self.stack.append(tag)
    def handle_endtag(self, tag):
        if tag in VOID: return
        if not self.stack or self.stack[-1] != tag:
            self.errors.append(f"</{tag}> inesperado (aberta: {self.stack[-1] if self.stack else None}) em {self.getpos()}")
            if tag in self.stack:
                while self.stack and self.stack.pop() != tag: pass
        else:
            self.stack.pop()

pages = sorted(root.glob("*.html")) + sorted((root / "paginas").glob("*.html"))
parsed = {}
for p in pages:
    html = p.read_text(encoding="utf-8")
    ps = P(); ps.feed(html); parsed[p] = ps
    rel = p.relative_to(root)
    check(f"{rel}: tags balanceadas", not ps.errors and not ps.stack, "; ".join(ps.errors[:2]) or (f"abertas: {ps.stack}" if ps.stack else ""))
    # fórmulas: remove blocos $$...$$ e confere se sobram $ em número par (ignora <code>/<script>)
    body = re.sub(r"<(script|style)\b.*?</\1>", "", html, flags=re.S)
    body = re.sub(r"<code>.*?</code>", "", body, flags=re.S)
    n = len(re.findall(r"(?<!\\)\$\$", body)); body2 = re.sub(r"(?<!\\)\$\$", "", body)
    m = len(re.findall(r"(?<!\\)\$", body2))
    check(f"{rel}: delimitadores $$ e $ pareados", n % 2 == 0 and m % 2 == 0, f"($$:{n}, $:{m})")
    for ref in ps.refs:
        if re.match(r"(https?:|mailto:|#|data:)", ref): continue
        path = (p.parent / ref.split("#")[0]).resolve()
        check(f"{rel}: referência {ref}", path.exists())
        if "#" in ref and ref.endswith(tuple("abcdefghijklmnopqrstuvwxyz0123456789-")) and ref.split("#")[0].endswith(".html"):
            tgt = parsed.get(path) or (lambda q: (q.feed(path.read_text(encoding="utf-8")), q)[1])(P())
            check(f"{rel}: âncora {ref}", ref.split('#')[1] in tgt.ids)
    for c in ps.pycells:
        check(f"{rel}: célula Python {c}", (p.parent / c).resolve().exists())

# ids exigidos pelos scripts
need = {
    "paginas/stern-gerlach.html": ["demo-sg", "sg-preset", "sg-t1", "sg-t1v", "sg-s1", "sg-usa2", "sg-t2", "sg-t2v", "sg-s2", "sg-t3", "sg-t3v", "sg-cem", "sg-play", "sg-zera", "sg-canvas", "sg-readout", "tema", "toc"],
    "paginas/dirac.html": ["tema", "toc"],
    "paginas/observaveis.html": ["tema", "toc"],
    "paginas/incerteza.html": ["tema", "toc"],
    "paginas/evolucao-spin.html": ["demo-rabi", "rb-preset", "rb-ini", "rb-lab", "rb-D", "rb-Dv", "rb-O", "rb-Ov", "rb-t", "rb-tv", "rb-play", "rb-pi", "rb-esfera", "rb-prob", "rb-readout", "tema", "toc"],
    "paginas/funcao-de-onda.html": ["tema", "toc"],
    "paginas/particula-livre.html": ["demo-pac", "pc-sigma", "pc-sigmav", "pc-k0", "pc-k0v", "pc-t", "pc-tv", "pc-play", "pc-im", "pc-onda", "pc-larg", "pc-readout", "tema", "toc"],
    "paginas/barreira.html": ["demo-bar", "br-preset", "br-E", "br-Ev", "br-V0", "br-V0v", "br-a", "br-av", "br-ress", "br-psi", "br-T", "br-readout", "tema", "toc"],
    "paginas/oscilador.html": ["demo-osc", "os-estado", "os-classica", "os-n", "os-nv", "os-alfa", "os-alfav", "os-t", "os-tv", "os-play", "os-onda", "os-fase", "os-readout", "tema", "toc"],
    "paginas/momento-angular.html": ["tema", "toc"],
    "paginas/emaranhamento.html": ["demo-bell", "bl-a", "bl-av", "bl-a2", "bl-a2v", "bl-b", "bl-bv", "bl-b2", "bl-b2v", "bl-otimo", "bl-rodar", "bl-zera", "bl-corr", "bl-S", "bl-readout", "tema", "toc"],
    "index.html": ["mapa", "chips", "info", "trail-list", "tema"],
}
# toda página precisa estar na lista acima (assim uma página nova não escapa da conferência)
for f in sorted((root / "paginas").glob("*.html")):
    check(f"{f.relative_to(root)}: está na lista de ids conferidos", str(f.relative_to(root)) in need)
for f in sorted(root.rglob("*.html")):
    if ".git" in f.parts or "rascunhos" in f.parts: continue
    check(f"{f.relative_to(root)}: começa com <!doctype html> (senão o KaTeX não funciona)", f.read_text(encoding="utf-8").lstrip().lower().startswith("<!doctype html>"))
for f, ids in need.items():
    miss = [i for i in ids if i not in parsed[root / f].ids]
    check(f"{f}: ids exigidos pelos scripts", not miss, f"faltam {miss}" if miss else "")

# links do mapa
out = subprocess.run(["node", "-e", "const M=require('./assets/mapa.js');console.log(JSON.stringify(M.NODES.map(n=>n.href).filter(Boolean)))"],
                     cwd=root, capture_output=True, text=True).stdout
for href in json.loads(out):
    if re.match(r"https?:", href):
        # nó que leva ao livro de EDP: confere que é uma página do livro irmão, não um link solto
        check(f"mapa: link externo {href}", href.startswith("https://moacyr-alvim.github.io/notas_aula_edp/paginas/") and href.endswith(".html"))
        continue
    path = root / href.split("#")[0]
    ok = path.exists() and (("#" not in href) or href.split("#")[1] in parsed[path].ids)
    check(f"mapa: link {href}", ok)

# o cifrão do real abre matemática no KaTeX e engole a frase: não usar "R$", e conferir
# que o número de cifrões é par (um ímpar denuncia um delimitador solto)
for path in sorted(parsed):
    txt = path.read_text(encoding="utf-8")
    corpo = txt[txt.find("<main"):txt.find("</main>")] if "<main" in txt else txt
    moeda = re.search(r"R\$\s*[0-9]", corpo)   # \mathbb R$ seguido de espaço é outra coisa
    check(f"{path.relative_to(root)}: sem cifrão de moeda (usar 'reais')", not moeda, moeda.group(0) if moeda else "")
    check(f"{path.relative_to(root)}: número par de cifrões", corpo.count("$") % 2 == 0, f"{corpo.count('$')} cifrões")

# KaTeX: a cópia no repositório é a versão declarada, tem as fontes que o CSS pede, e
# nenhuma página volta a buscar KaTeX em CDN (senão a versão conferida aqui não é a do ar)
vend = root / "vendor" / "katex"
check("vendor/katex: versão bate com a declarada",
      (vend / "VERSAO.txt").read_text(encoding="utf-8").strip() == KATEX,
      (vend / "VERSAO.txt").read_text(encoding="utf-8").strip())
for nome in KATEX_ARQUIVOS:
    check(f"vendor/katex/{nome} existe", (vend / nome).exists())
css = (vend / "katex.min.css").read_text(encoding="utf-8")
faltam = [f for f in sorted(set(re.findall(r"fonts/[A-Za-z_-]+\.woff2", css))) if not (vend / f).exists()]
check("vendor/katex: todas as fontes woff2 do CSS estão no repositório", not faltam, str(faltam))
for path in sorted(parsed):
    txt = path.read_text(encoding="utf-8")
    pre = "../" if path.parent.name == "paginas" else ""
    usa = [n for n in KATEX_ARQUIVOS if f'"{pre}vendor/katex/{n}"' in txt]
    check(f"{path.relative_to(root)}: usa o KaTeX do repositório", len(usa) == len(KATEX_ARQUIVOS),
          f"só achei {usa}")
    check(f"{path.relative_to(root)}: sem KaTeX de CDN", "jsdelivr" not in txt and "cdnjs" not in txt)

print("\nfalhas:", fails)
sys.exit(1 if fails else 0)
