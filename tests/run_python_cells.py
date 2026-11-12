"""Roda todos os arquivos de py/ do livro de MQ do jeito que o worker faz (mesmo PRELUDE do pyworker.js).

Uso:  python3 tests/run_python_cells.py
Verifica: cada arquivo executa sem erro, gera figuras PNG válidas e (nas soluções) os números esperados.
"""
import base64, contextlib, io, pathlib, re, sys

import numpy as np

root = pathlib.Path(__file__).resolve().parent.parent
js = (root / "assets" / "pyworker.js").read_text(encoding="utf-8")
prelude = re.search(r"const PRELUDE = `(.*?)`;", js, re.S).group(1)

pre_ns = {}
exec(prelude, pre_ns)                      # igual ao pyodide.runPython(PRELUDE)

fails = 0
def check(name, ok, info=""):
    global fails
    print(("ok   " if ok else "FALHA"), name, info)
    fails += (not ok)

def rodar(nome):
    code = (root / "py" / nome).read_text(encoding="utf-8")
    ns = {"__name__": "__main__"}          # espaço de nomes limpo a cada execução
    buf = io.StringIO()
    with contextlib.redirect_stdout(buf):
        exec(compile(code, "<exec>", "exec"), ns)
    figs = pre_ns["_take_figs"]()
    return buf.getvalue(), figs

def numeros(saida, rotulo):
    m = re.search(rotulo + r".*?max\|?u?\|? = ([-+0-9.eE]+)", saida)
    return float(m.group(1)) if m else None

for nome in sorted(p.name for p in (root / "py").glob("*.py")):
    saida, figs = rodar(nome)
    png_ok = bool(figs) and all(base64.b64decode(f)[:8] == b"\x89PNG\r\n\x1a\n" for f in figs)
    check(f"{nome}: executa e gera figura PNG", png_ok, f"({len(figs)} fig)")

# valores esperados das soluções
def num(saida, padrao, grupo=1):
    m = re.search(padrao, saida)
    return float(m.group(grupo)) if m else float("nan")

s, _ = rodar("dirac_solucao.py")
check("Dirac: P é hermitiana", "P é hermitiana?           True" in s)
check("Dirac: <p> pela base |p> = 2", abs(num(s, r"<p> pela função phi\(p\)\s*= ([-0-9.]+)") - 2) < 1e-3)
check("Dirac: [X,P] psi ≈ i psi no pacote suave", num(s, r"i hbar psi\|\| = ([0-9.eE+-]+)") < 0.05)
check("Dirac: no vetor alternado o erro é ≈ 2", abs(num(s, r"i hbar v\|\|\s*= ([0-9.]+)") - 2) < 0.01)
check("Dirac: traço do comutador = 0", num(s, r"traço de \[X,P\]\s*= ([0-9.eE+-]+)") < 1e-9)

s, _ = rodar("observaveis_solucao.py")
check("observáveis: probabilidades de Born (1/2, 0, 1/2)", "probabilidades (Born):       [0.5 0.  0.5]" in s, re.search(r"probabilidades \(Born\):.*", s).group(0))
check("observáveis: média amostral perto de <S_x> = 0", abs(num(s, r"média amostral = ([-0-9.]+)")) < 0.03)
d = re.search(r"S_z medido depois de S_x:\s*\[([0-9. ]+)\]", s).group(1).split()
check("observáveis: depois de S_x, S_z sai (1/4, 1/2, 1/4)", abs(float(d[0]) - 0.25) < 0.02 and abs(float(d[1]) - 0.5) < 0.02, str(d))

s, _ = rodar("evolucao_solucao.py")
check("evolução: espectral = fórmula de Rabi", num(s, r"erro máximo = ([0-9.eE+-]+)") < 1e-12)
check("evolução: Schrödinger = Heisenberg", num(s, r"Schrödinger <sz> = ([-0-9.]+)") == num(s, r"Heisenberg <sz> = ([-0-9.]+)"))
check("evolução: largura da ressonância = 2 Omega", abs(num(s, r"largura a meia altura = ([0-9.]+)") - 2) < 0.06)
check("evolução: campo oscilante ≈ onda girante (desvio < 3%)", num(s, r"desvio máximo da onda girante = ([0-9.]+)") < 0.03)

s, _ = rodar("funcao_onda_solucao.py")
check("Crank-Nicolson conserva a norma", num(s, r"\|norma - 1\| máximo = ([0-9.eE+-]+)") < 1e-10)
check("Ehrenfest: <x>(t) ≈ x0 cos t", num(s, r"x0 cos t\| = ([0-9.]+)") < 0.03)
check("Euler explícito explode", num(s, r"depois de 39 = ([0-9.eE+-]+)") > 1e10)

s, _ = rodar("particula_livre_solucao.py")
erros = [float(e) for e in re.findall(r"^\s+\d+\s+([0-9.eE+-]+)\s", s, re.M)]
check("partícula livre: FFT = fórmula fechada", erros and max(erros) < 1e-12, str(erros))
check("partícula livre: número de onda local = fórmula", num(s, r"erro máx = ([0-9.eE+-]+)") < 1e-8)

s, _ = rodar("barreira_solucao.py")
linhas = re.findall(r"^\s+([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)\s*$", s, re.M)
check("barreira: seis energias simuladas", len(linhas) == 6, str(len(linhas)))
check("barreira: T do pacote = média de T(E) (erro < 0,005)", all(abs(float(l[1]) - float(l[2])) < 0.005 for l in linhas), str([(l[1], l[2]) for l in linhas]))

s, _ = rodar("oscilador_solucao.py")
check("oscilador: [a,a†] = I menos o último elemento, -(N-1)", "[  1.   1. -39.]" in s)
check("oscilador: o último nível truncado sai 19,5", "saiu 19.5" in s)
E0 = num(s, r"E0 com base de 160 estados = ([0-9.]+)")
check("oscilador anarmônico: E0 = 0,5591463", abs(E0 - 0.559146327) < 1e-8, E0)

s, _ = rodar("momento_angular_solucao.py")
vals = [float(x) for l in re.findall(r"^\s+[0-9.]+\s+([0-9.eE+-]+)\s+([0-9.eE+-]+)\s*$", s, re.M) for x in l]
check("momento angular: álgebra exata para j = 1/2 ... 7/2", vals and max(vals) < 1e-12, str(vals))
check("momento angular: Stern-Gerlach com spin 1", num(s, r"erro máximo contra as fórmulas = ([0-9.eE+-]+)") < 1e-12)
check("momento angular: j = 20 girado tem <Jz> = 10", abs(num(s, r"<Jz> = ([0-9.]+)") - 10) < 1e-6)

s, _ = rodar("emaranhamento_solucao.py")
check("emaranhamento: E = -cos(a-b)", num(s, r"max \|E\(a,b\) \+ cos\(a-b\)\| = ([0-9.eE+-]+)") < 1e-12)
check("emaranhamento: a busca acha |S| = 2 sqrt 2", abs(num(s, r"maior \|S\| na busca = ([0-9.]+)") - 2.8284) < 1e-4)
check("emaranhamento: singleto tem 1 bit de emaranhamento", re.search(r"singleto\s+\[0.7071 0.7071\]\s+1.0000", s) is not None)

# versões com lacunas: devem rodar (sem explodir erro) mesmo incompletas
for nome in sorted(p.name for p in (root / "py").glob("*_lacunas.py")):
    try:
        rodar(nome); ok = True
    except Exception as e:
        ok = False
    check(f"{nome} roda com o código incompleto", ok)

print("\nfalhas:", fails)
sys.exit(1 if fails else 0)
