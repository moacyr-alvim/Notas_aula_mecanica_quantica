import numpy as np
import matplotlib.pyplot as plt

# A reta discretizada: N pontos x_j em [-L/2, L/2); fora da grade, psi = 0.
# O ket |psi> vira o vetor de componentes <x_j|psi> = sqrt(dx) psi(x_j), para que <psi|psi> = soma |.|^2.
hbar = 1.0
N, L = 400, 40.0
x = np.linspace(-L / 2, L / 2, N, endpoint=False)
dx = x[1] - x[0]

p0 = 2.0                                                # momento médio do pacote
psi = np.exp(-x**2 / 2 + 1j * p0 * x / hbar)            # gaussiana de largura 1 andando para a direita
psi = psi / np.linalg.norm(psi)                         # agora sum |psi_j|^2 = 1

# --- os operadores X e P na base |x_j>
X = np.diag(x)
# derivada por diferença central: (D psi)_j = (psi_{j+1} - psi_{j-1}) / (2 dx), com psi = 0 fora da grade
D = (np.eye(N, k=1) - np.eye(N, k=-1)) / (2 * dx)
P = -1j * hbar * D

print("P é hermitiana?          ", np.allclose(P, P.conj().T))
print("<psi|psi>                 =", round(float(np.vdot(psi, psi).real), 6))
print("<x>                       =", round(float(np.vdot(psi, X @ psi).real), 4))
print("<p> pela matriz P         =", round(float(np.vdot(psi, P @ psi).real), 4))

# --- a mesma informação na base |p>:  <p|psi> = soma_j <p|x_j> <x_j|psi>   (uma identidade inserida)
p = np.linspace(-8, 8, 801)
dp = p[1] - p[0]
p_x = np.exp(-1j * np.outer(p, x) / hbar) / np.sqrt(2 * np.pi * hbar) * np.sqrt(dx)   # <p|x_j>, com o sqrt(dx) da normalização
phi = p_x @ psi                                          # phi(p) = <p|psi>, como função contínua de p
print("integral |phi(p)|^2 dp    =", round(float(np.sum(np.abs(phi)**2) * dp), 6))
print("<p> pela função phi(p)    =", round(float(np.sum(p * np.abs(phi)**2) * dp), 4))

# --- o comutador [X, P] numa grade finita
C = X @ P - P @ X
erro_suave = np.linalg.norm(C @ psi - 1j * hbar * psi)
alt = (-1.0) ** np.arange(N) / np.sqrt(N)               # o vetor que mais oscila na grade
erro_alt = np.linalg.norm(C @ alt - 1j * hbar * alt)
print("||[X,P]psi - i hbar psi|| =", f"{erro_suave:.2e}   (pacote suave)")
print("||[X,P]v - i hbar v||     =", f"{erro_alt:.3f}      (vetor alternado)")
print("traço de [X,P]            =", f"{abs(np.trace(C)):.1e}   (traço de i hbar I seria {N} i)")
K = (C / (1j * hbar)).real                              # C = i hbar K, com K simétrica real
autov = np.linalg.eigvalsh((K + K.T) / 2)
print("autovalores de [X,P]/(i hbar): de", f"{autov.min():.4f}", "a", f"{autov.max():.4f}", " soma =", f"{autov.sum():.1e}")

fig, ax = plt.subplots(1, 3, figsize=(11, 3.2))
ax[0].plot(x, np.abs(psi)**2 / dx, label="|psi(x)|^2")
ax[0].plot(x, (psi.real) / np.sqrt(dx) * 0.4, lw=0.8, label="Re psi (escala)")
ax[0].set_xlim(-6, 6); ax[0].set_xlabel("x"); ax[0].legend(fontsize=8); ax[0].set_title("base |x>")
ax[1].plot(p, np.abs(phi)**2, color="C1")
ax[1].axvline(p0, color="gray", ls=":"); ax[1].set_xlabel("p"); ax[1].set_title("base |p>: |phi(p)|^2")
ax[2].hist(autov, bins=40, color="C2"); ax[2].set_title("espectro de [X,P]/(i hbar)")
ax[2].set_xlabel("autovalor")
plt.tight_layout()
plt.show()
