import numpy as np
import matplotlib.pyplot as plt

# Spin 1/2, hbar = 1.  No referencial girante:  H = (Delta sigma_z + Omega sigma_x) / 2
sx = np.array([[0, 1], [1, 0]], dtype=complex)
sz = np.array([[1, 0], [0, -1]], dtype=complex)
up = np.array([1, 0], dtype=complex)

def evolui(H, ts, psi0):
    """psi(t) = e^{-iHt} psi0 para todos os t de ts (uma linha por instante).
    Diagonaliza H uma vez só: na base de autovetores, cada coordenada só ganha uma fase."""
    lam, V = np.linalg.eigh(H)              # H = V diag(lam) V^dagger
    c = V.conj().T @ psi0                   # coordenadas de psi0 na base de autovetores
    ########### complete: fases[k, j] = e^{-i lam_k t_j}  (np.outer(lam, ts) dá a matriz lam_k t_j) ##########
    fases = np.ones((len(lam), len(ts)))
    return (V @ (fases * c[:, None])).T

def U(H, t):
    """a matriz e^{-iHt}: as colunas são as evoluções dos vetores da base"""
    return np.array([evolui(H, [t], e)[0] for e in np.eye(len(H), dtype=complex)]).T

def rabi(D, O, t):
    W = np.hypot(D, O)
    return (O / W) ** 2 * np.sin(W * t / 2) ** 2

O = 1.0
t = np.linspace(0, 4 * np.pi, 400)
fig, ax = plt.subplots(1, 3, figsize=(12, 3.3))
pior = 0.0
for D in (0.0, 1.0, 2.0):
    pb = np.abs(evolui((D * sz + O * sx) / 2, t, up)[:, 1]) ** 2      # P(-z) = |<-z|psi(t)>|^2
    pior = max(pior, np.max(np.abs(pb - rabi(D, O, t))))
    ax[0].plot(t, pb, label=f"Delta = {D:g}")
print(f"evolução contra a fórmula de Rabi: erro máximo = {pior:.1e}")
ax[0].set_xlabel("t"); ax[0].set_title("P(-z): numérico"); ax[0].legend(fontsize=8)

# retrato de Heisenberg: <psi(t)|A|psi(t)> = <psi(0)| U^dagger A U |psi(0)>
H = (1.0 * sz + O * sx) / 2
s = 2.7
psi_t = U(H, s) @ up
A_t = U(H, s).conj().T @ sz @ U(H, s)
print("Schrödinger <sz> =", round(np.vdot(psi_t, sz @ psi_t).real, 10),
      "  Heisenberg <sz> =", round(np.vdot(up, A_t @ up).real, 10))

# a curva de ressonância: o máximo de P(-z) contra a dessintonia
Ds = np.linspace(-6, 6, 241)
tt = np.linspace(0, 40, 2001)
maxP = np.array([np.max(np.abs(evolui((d * sz + O * sx) / 2, tt, up)[:, 1]) ** 2) for d in Ds])
ax[1].plot(Ds, maxP, label="máx P(-z), numérico")
ax[1].plot(Ds, O**2 / (O**2 + Ds**2), "--", label="Omega^2/(Omega^2+Delta^2)")
ax[1].set_xlabel("Delta"); ax[1].set_title("ressonância"); ax[1].legend(fontsize=8)
meia = Ds[Ds >= 0][np.argmin(np.abs(maxP[Ds >= 0] - 0.5))]
print(f"largura a meia altura = {2 * meia:.3f}   (esperado 2 Omega = {2 * O:g})")

# sem a aproximação de onda girante: campo oscilante de verdade, no laboratório
#   H(t) = (w0/2) sz + Omega cos(w t) sx, em ressonância (w = w0); passos pequenos com H no meio do passo
w0, dt = 20.0, 0.004
psi = up.copy(); ts = np.arange(0, 4 * np.pi, dt); pl = np.empty(len(ts))
for j, s in enumerate(ts):
    pl[j] = abs(psi[1]) ** 2
    psi = U(w0 / 2 * sz + O * np.cos(w0 * (s + dt / 2)) * sx, dt) @ psi
print(f"laboratório, w0 = {w0:g}: desvio máximo da onda girante = {np.max(np.abs(pl - rabi(0, O, ts))):.3f}")
ax[2].plot(ts, pl, lw=0.8, label="campo oscilante")
ax[2].plot(ts, rabi(0, O, ts), "--", label="onda girante")
ax[2].set_xlabel("t"); ax[2].set_title("laboratório, w0 = 20 Omega"); ax[2].legend(fontsize=8)
plt.tight_layout()
plt.show()
