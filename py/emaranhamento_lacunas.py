import numpy as np
import matplotlib.pyplot as plt

# Dois qubits: o espaço é C^2 ⊗ C^2, base |00>, |01>, |10>, |11>  (0 = para cima em z, 1 = para baixo)
sx = np.array([[0, 1], [1, 0]], dtype=complex)
sz = np.array([[1, 0], [0, -1]], dtype=complex)
cima = np.array([1, 0], dtype=complex)
baixo = np.array([0, 1], dtype=complex)

singleto = (np.kron(cima, baixo) - np.kron(baixo, cima)) / np.sqrt(2)

def sigma(theta):
    """spin medido na direção de ângulo theta no plano x-z"""
    return np.cos(theta) * sz + np.sin(theta) * sx

def E(psi, a, b):
    """correlação <psi| sigma_a ⊗ sigma_b |psi>: Alice mede em a, Bob em b"""
    ########### complete: o operador sigma_a ⊗ sigma_b, uma matriz 4x4 (np.kron faz o produto tensorial) ##########
    op = np.eye(4)
    return np.vdot(psi, op @ psi).real

rng = np.random.default_rng(7)
pares = rng.uniform(0, 2 * np.pi, size=(200, 2))
print(f"singleto: max |E(a,b) + cos(a-b)| = {max(abs(E(singleto, a, b) + np.cos(a - b)) for a, b in pares):.1e}")

def S(psi, a, a2, b, b2):
    return E(psi, a, b) - E(psi, a, b2) + E(psi, a2, b) + E(psi, a2, b2)

# busca pelo maior |S| (com a = 0: o singleto é invariante por rotação)
g = np.linspace(0, np.pi, 13)                        # de 15 em 15 graus
melhor = max((abs(S(singleto, 0, a2, b, b2)), a2, b, b2) for a2 in g for b in g for b2 in g)
print(f"CHSH: maior |S| na busca = {melhor[0]:.4f}  (2 sqrt 2 = {2 * np.sqrt(2):.4f}), em a'={np.degrees(melhor[1]):.0f}, b={np.degrees(melhor[2]):.0f}, b'={np.degrees(melhor[3]):.0f} graus")
produto = np.kron(np.array([np.cos(0.4), np.sin(0.4)]), np.array([np.cos(1.1), np.sin(1.1)])).astype(complex)
print(f"um estado produto nos mesmos ângulos: |S| = {abs(S(produto, 0, *melhor[1:])):.4f}")

# Schmidt: os coeficientes c_ab formam uma matriz 2x2; o estado é produto <=> ela tem posto 1
print("\n  estado                     coef. de Schmidt     entropia de emaranhamento (bits)")
for nome, psi in [("produto", produto), ("singleto", singleto),
                  ("cos(0.3)|00> + sen(0.3)|11>", np.cos(0.3) * np.kron(cima, cima) + np.sin(0.3) * np.kron(baixo, baixo))]:
    s = np.linalg.svd(psi.reshape(2, 2), compute_uv=False)
    p = s[s > 1e-12] ** 2
    print(f"  {nome:27s}  {np.round(s, 4)}        {abs(np.sum(p * np.log2(p))):.4f}")

# o estado de uma metade do singleto: traço parcial sobre Bob
rho = np.outer(singleto, singleto.conj()).reshape(2, 2, 2, 2)
rhoA = np.einsum("ijkj->ik", rho)
print("\nmatriz densidade de Alice no singleto:\n", np.round(rhoA.real, 4))

phi = np.linspace(0, np.pi / 2, 200)
Sphi = [abs(S(singleto, 0, 2 * f, f, 3 * f)) for f in phi]
fig, ax = plt.subplots(1, 2, figsize=(10, 3.3))
d = np.linspace(0, np.pi, 200)
ax[0].plot(np.degrees(d), [E(singleto, 0, x) for x in d], label="singleto")
ax[0].plot(np.degrees(d), -(1 - 2 * d / np.pi), "--", label="modelo local")
ax[0].set_xlabel("a - b (graus)"); ax[0].set_ylabel("E"); ax[0].legend(fontsize=8); ax[0].set_title("correlações")
ax[1].plot(np.degrees(phi), Sphi)
ax[1].axhline(2, color="C3", ls="--", label="limite local")
ax[1].axhline(2 * np.sqrt(2), color="gray", ls=":", label="2 sqrt 2")
ax[1].set_xlabel("phi (a=0, b=phi, a'=2phi, b'=3phi)"); ax[1].legend(fontsize=8); ax[1].set_title("|S| do singleto")
plt.tight_layout()
plt.show()
