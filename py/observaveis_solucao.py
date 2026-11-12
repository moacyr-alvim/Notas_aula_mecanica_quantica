import numpy as np
import matplotlib.pyplot as plt

# Uma máquina de medir. Spin 1, na base |m = +1>, |m = 0>, |m = -1> de S_z (hbar = 1).
rng = np.random.default_rng(2026)
r2 = np.sqrt(2)
Sx = np.array([[0, 1, 0], [1, 0, 1], [0, 1, 0]], dtype=complex) / r2
Sz = np.diag([1.0, 0.0, -1.0]).astype(complex)

psi = np.array([1, 1j, 1], dtype=complex)
psi = psi / np.linalg.norm(psi)

def espectro(A):
    """autovalores distintos de A e o projetor sobre cada autoespaço (vale com degenerescência)"""
    a, V = np.linalg.eigh(A)
    vals, projs = [], []
    for k in range(len(a)):
        if vals and abs(a[k] - vals[-1]) < 1e-9:
            projs[-1] = projs[-1] + np.outer(V[:, k], V[:, k].conj())
        else:
            vals.append(a[k]); projs.append(np.outer(V[:, k], V[:, k].conj()))
    return np.array(vals), projs

def mede(A, psi):
    """devolve (resultado, estado depois da medida, todos os resultados possíveis, probabilidades)"""
    vals, projs = espectro(A)
    # regra de Born: P(a_k) = <psi| Pi_k |psi>
    prob = np.array([np.vdot(psi, Pi @ psi).real for Pi in projs])
    k = rng.choice(len(vals), p=prob / prob.sum())
    # colapso (Lüders): projeta no autoespaço do resultado e renormaliza
    depois = projs[k] @ psi
    depois = depois / np.linalg.norm(depois)
    return vals[k], depois, vals, prob

# --- 1. muitas cópias do mesmo estado, medindo S_x
N = 20000
_, _, vals, prob = mede(Sx, psi)
res = np.array([mede(Sx, psi)[0] for _ in range(N)])
freq = np.array([np.mean(np.isclose(res, v)) for v in vals])
media_exata = np.vdot(psi, Sx @ psi).real
var_exata = np.vdot(psi, Sx @ Sx @ psi).real - media_exata**2
print("resultados possíveis de S_x:", np.round(vals, 6) + 0.0)
print("probabilidades (Born):      ", np.round(prob, 4))
print("frequências em", N, "medidas:", np.round(freq, 4))
print(f"<S_x> = <psi|S_x|psi> = {media_exata:.4f}    média amostral = {res.mean():.4f}")
print(f"(Delta S_x)^2 exato   = {var_exata:.4f}    variância amostral = {res.var():.4f}")

# --- 2. medir S_x e depois S_z na mesma cópia, contra medir S_z direto
direto = np.array([mede(Sz, psi)[0] for _ in range(N)])
seq = []
for _ in range(N):
    sx, depois, _, _ = mede(Sx, psi)
    sz, _, _, _ = mede(Sz, depois)
    seq.append((sx, sz))
seq = np.array(seq)
mz = np.array([1.0, 0.0, -1.0])
p_direto = np.array([np.mean(np.isclose(direto, m)) for m in mz])
p_depois = np.array([np.mean(np.isclose(seq[:, 1], m)) for m in mz])
print("S_z medido direto:          ", np.round(p_direto, 3), "  (Born:", np.round(np.abs(psi)**2, 3), ")")
print("S_z medido depois de S_x:   ", np.round(p_depois, 3))

fig, ax = plt.subplots(1, 2, figsize=(9, 3.2))
ax[0].bar(vals - 0.12, prob, width=0.24, label="Born")
ax[0].bar(vals + 0.12, freq, width=0.24, label="frequência")
ax[0].set_xticks(vals); ax[0].set_title("medindo S_x"); ax[0].legend(fontsize=8)
ax[1].bar(mz - 0.12, p_direto, width=0.24, label="S_z direto")
ax[1].bar(mz + 0.12, p_depois, width=0.24, label="S_z depois de S_x")
ax[1].set_xticks(mz); ax[1].set_title("a medida de S_x perturba S_z"); ax[1].legend(fontsize=8)
plt.tight_layout()
plt.show()
