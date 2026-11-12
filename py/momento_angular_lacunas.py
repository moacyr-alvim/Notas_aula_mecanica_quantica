import numpy as np
import matplotlib.pyplot as plt

# Momento angular com hbar = 1, na base |j, m> com m = j, j-1, ..., -j (nessa ordem).
def matrizes(j):
    m = np.arange(j, -j - 1, -1)
    Jz = np.diag(m).astype(complex)
    # J+ |j, m> = sqrt(j(j+1) - m(m+1)) |j, m+1>: a coluna de m tem esse número na linha de m+1 (logo acima)
    ########### complete: J+ (dica: o vetor m[1:] tem os m das colunas 1, 2, ...; np.diag(v, 1) põe v acima da diagonal) ##########
    Jp = np.zeros((len(m), len(m)), dtype=complex)
    Jm = Jp.conj().T
    Jx = (Jp + Jm) / 2
    Jy = (Jp - Jm) / 2j
    return m, Jx, Jy, Jz

print("   j    ||[Jx,Jy] - i Jz||   ||J^2 - j(j+1) I||")
for j in (0.5, 1, 1.5, 2, 3.5):
    m, Jx, Jy, Jz = matrizes(j)
    J2 = Jx @ Jx + Jy @ Jy + Jz @ Jz
    print(f"  {j:3g}       {np.linalg.norm(Jx @ Jy - Jy @ Jx - 1j * Jz):.1e}             {np.linalg.norm(J2 - j * (j + 1) * np.eye(len(m))):.1e}")

def rotacao_y(j, theta):
    """R = exp(-i theta Jy), pelo teorema espectral"""
    m, Jx, Jy, Jz = matrizes(j)
    lam, V = np.linalg.eigh(Jy)
    return m, V @ np.diag(np.exp(-1j * lam * theta)) @ V.conj().T

# --- Stern-Gerlach com spin 1: o estado |1, +1> medido num ímã girado de theta
thetas = np.linspace(0, np.pi, 181)
P = np.array([np.abs(rotacao_y(1, -th)[1][:, 0]) ** 2 for th in thetas])   # |<1,m'| R(-theta) |1,1>|^2
formula = np.stack([np.cos(thetas / 2) ** 4, np.sin(thetas) ** 2 / 2, np.sin(thetas / 2) ** 4], axis=1)
print(f"spin 1: erro máximo contra as fórmulas = {np.max(np.abs(P - formula)):.1e}")

# --- j grande: girar |j, j> de 60 graus e medir Jz.  A "seta clássica" aparece.
j, th = 20, np.pi / 3
m, R = rotacao_y(j, th)
p = np.abs(R[:, 0]) ** 2
media = np.sum(m * p)
desvio = np.sqrt(np.sum(m**2 * p) - media**2)
print(f"j = {j}, girado de 60 graus: <Jz> = {media:.4f} (j cos = {j * np.cos(th):.4f}),  "
      f"Delta Jz = {desvio:.4f} (sqrt(j/2) sen = {np.sqrt(j / 2) * np.sin(th):.4f})")

fig, ax = plt.subplots(1, 2, figsize=(10, 3.3))
for k, nome in enumerate(["m' = +1", "m' = 0", "m' = -1"]):
    ax[0].plot(np.degrees(thetas), P[:, k], label=nome)
ax[0].set_xlabel("ângulo do ímã (graus)"); ax[0].legend(fontsize=8); ax[0].set_title("Stern-Gerlach com spin 1, partindo de m = +1")
ax[1].bar(m, p, width=0.8)
ax[1].axvline(j * np.cos(th), color="k", ls=":")
ax[1].set_xlabel("m'"); ax[1].set_title(f"j = {j} girado de 60 graus: m' perto de j cos 60")
plt.tight_layout()
plt.show()
