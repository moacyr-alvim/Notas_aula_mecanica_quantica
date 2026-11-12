import numpy as np
import matplotlib.pyplot as plt

# Schrödinger em uma dimensão, hbar = m = 1:   i psi_t = -psi_xx / 2 + V(x) psi
# Oscilador harmônico V = x^2/2 e um pacote gaussiano deslocado para x0 = 2.
L, N = 20.0, 400
x = np.linspace(-L / 2, L / 2, N + 2)[1:-1]         # pontos internos; psi = 0 nas paredes
dx = x[1] - x[0]
V = x**2 / 2
T2 = (np.diag(np.full(N, 1.0)) - 0.5 * np.diag(np.ones(N - 1), 1) - 0.5 * np.diag(np.ones(N - 1), -1)) / dx**2
H = T2 + np.diag(V)                                   # -1/2 d^2/dx^2 + V por diferenças finitas

x0 = 2.0
psi0 = np.exp(-(x - x0) ** 2 / 2).astype(complex)
psi0 /= np.sqrt(np.sum(np.abs(psi0) ** 2) * dx)       # integral |psi|^2 dx = 1

dt, passos = 0.01, 628                                # até t = 6,28 (um período)
I = np.eye(N)

# Crank–Nicolson:  (I + i dt H/2) psi_novo = (I - i dt H/2) psi
########### complete: M_cn = (I + i dt H/2)^{-1} (I - i dt H/2)   (np.linalg.solve(A, B) calcula A^{-1} B) ##########
M_cn = I.astype(complex)
# Euler explícito:  psi_novo = (I - i dt H) psi
M_eu = I - 1j * dt * H

def media(psi, A):
    return float(np.real(np.sum(np.conj(psi) * A) * dx))

def derivada(psi):
    return np.gradient(psi, dx)

psi = psi0.copy()
ts, xs, ps, normas = [], [], [], []
fotos = {}
for n in range(passos + 1):
    t = n * dt
    ts.append(t)
    normas.append(np.sum(np.abs(psi) ** 2) * dx)
    xs.append(media(psi, x * psi))
    ps.append(media(psi, -1j * derivada(psi)))
    if n in (0, 157, 314, 471):
        fotos[t] = np.abs(psi) ** 2
    psi = M_cn @ psi
ts, xs, ps, normas = map(np.array, (ts, xs, ps, normas))

print(f"Crank-Nicolson: |norma - 1| máximo = {np.max(np.abs(normas - 1)):.1e}")
print(f"Ehrenfest: max |<x>(t) - x0 cos t| = {np.max(np.abs(xs - x0 * np.cos(ts))):.4f}")
print(f"Ehrenfest: max |d<x>/dt - <p>|     = {np.max(np.abs(np.gradient(xs, dt) - ps)[2:-2]):.4f}")

psi_e, norm_e = psi0.copy(), []
for n in range(40):
    norm_e.append(np.sum(np.abs(psi_e) ** 2) * dx)
    psi_e = M_eu @ psi_e
print(f"Euler explícito: norma depois de 10 passos = {norm_e[10]:.3e}, depois de 39 = {norm_e[39]:.3e}")

fig, ax = plt.subplots(1, 3, figsize=(12, 3.3))
for t, d in fotos.items():
    ax[0].plot(x, d, label=f"t = {t:.2f}")
ax[0].plot(x, V / 10, "k:", lw=0.8, label="V/10")
ax[0].set_xlim(-6, 6); ax[0].set_ylim(0, 0.7); ax[0].legend(fontsize=7); ax[0].set_title("|psi|^2 (Crank-Nicolson)")
ax[1].plot(ts, xs, label="<x>"); ax[1].plot(ts, ps, label="<p>")
ax[1].plot(ts, x0 * np.cos(ts), "k:", lw=0.8, label="x0 cos t")
ax[1].set_xlabel("t"); ax[1].legend(fontsize=8); ax[1].set_title("Ehrenfest")
ax[2].semilogy(range(40), norm_e, "o-", ms=3, label="Euler explícito")
ax[2].semilogy(range(40), normas[:40], label="Crank-Nicolson")
ax[2].set_xlabel("passo"); ax[2].legend(fontsize=8); ax[2].set_title("a norma")
plt.tight_layout()
plt.show()
