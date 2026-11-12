import numpy as np
import matplotlib.pyplot as plt

# O oscilador com hbar = m = omega = 1, na base |0>, |1>, ..., |N-1> (truncada).
N = 40
# a|n> = sqrt(n) |n-1>: a coluna n tem sqrt(n) na linha n-1 (acima da diagonal)
########### complete: a matriz de a (dica: np.diag(v, 1) põe o vetor v logo acima da diagonal) ##########
a = np.zeros((N, N))
ad = a.conj().T

C = a @ ad - ad @ a
print("diagonal de [a, a†] (primeiros e últimos):", np.round(np.diag(C)[:3], 6), "...", np.round(np.diag(C)[-3:], 6))

X = (a + ad) / np.sqrt(2)
P = 1j * (ad - a) / np.sqrt(2)
H = (P @ P + X @ X).real / 2
E = np.linalg.eigvalsh(H)
print("autovalores de (P² + X²)/2 truncado: ", np.round(E[:5], 10), "...")
print("  o último deveria ser N - 1/2 =", N - 0.5, "e saiu", round(float(H[-1, -1]), 6), " (o resto é exato)")

# --- o mesmo problema numa grade, por diferenças finitas, e com um termo anarmônico lam x^4
M, Lx = 1200, 16.0
x = np.linspace(-Lx / 2, Lx / 2, M + 2)[1:-1]
h = x[1] - x[0]
T = (np.diag(np.full(M, 1.0)) - 0.5 * np.diag(np.ones(M - 1), 1) - 0.5 * np.diag(np.ones(M - 1), -1)) / h**2

def grade(lam):
    return np.linalg.eigh(T + np.diag(x**2 / 2 + lam * x**4))

def matriz(lam, n):
    a_ = np.diag(np.sqrt(np.arange(1, n)), 1)
    X_ = (a_ + a_.T) / np.sqrt(2)
    P2 = -((a_.T - a_) @ (a_.T - a_)) / 2            # P² = -(a† - a)²/2, real
    return np.linalg.eigvalsh(P2 / 2 + X_ @ X_ / 2 + lam * np.linalg.matrix_power(X_, 4))

Eg, Vg = grade(0.0)
print("grade, harmônico:                     ", np.round(Eg[:5], 5))
lam = 0.1
Ega, _ = grade(lam)
Ema = matriz(lam, 80)
print(f"anarmônico (lam = {lam}), grade:        ", np.round(Ega[:5], 6))
print(f"anarmônico (lam = {lam}), base truncada:", np.round(Ema[:5], 6))
print(f"E0 com base de 160 estados = {matriz(lam, 160)[0]:.9f}")

fig, ax = plt.subplots(1, 3, figsize=(12, 3.3))
ax[0].plot(np.diag(C), "o", ms=3); ax[0].set_title("diagonal de [a, a†] truncado"); ax[0].set_xlabel("n")
for n in range(4):
    v = Vg[:, n] / np.sqrt(h)
    herm = np.polynomial.hermite.hermval(x, [0] * n + [1]) * np.exp(-x**2 / 2)
    herm /= np.sqrt(np.sum(herm**2) * h)
    s = np.sign(np.sum(v * herm))
    ax[1].plot(x, s * v + n, lw=1.6)
    ax[1].plot(x, herm + n, "k:", lw=1)
ax[1].set_xlim(-5, 5); ax[1].set_title("autofunções: grade (cor) e Hermite (pontilhado)")
ns = np.arange(4, 41, 2)
ref = matriz(lam, 160)[0]
ax[2].semilogy(ns, [abs(matriz(lam, n)[0] - ref) + 1e-16 for n in ns], "o-", ms=3, label="base truncada")
ax[2].axhline(abs(Ega[0] - ref), color="C1", ls="--", label="grade de 1200 pontos")
ax[2].legend(fontsize=8)
ax[2].set_xlabel("tamanho da base"); ax[2].set_title("anarmônico: erro de E0 contra a base")
plt.tight_layout()
plt.show()
