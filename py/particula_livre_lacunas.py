import numpy as np
import matplotlib.pyplot as plt

# Partícula livre, hbar = m = 1, numa caixa periódica grande (o pacote não chega às bordas).
L, N = 200.0, 4096
x = np.linspace(-L / 2, L / 2, N, endpoint=False)
dx = x[1] - x[0]
k = 2 * np.pi * np.fft.fftfreq(N, d=dx)          # os números de onda da FFT, na mesma ordem dela

sigma, k0, x0 = 1.0, 3.0, -20.0

def exato(x, t):
    s = sigma**2 + 0.5j * t
    y = x - x0 - k0 * t
    return (2 * np.pi * sigma**2) ** -0.25 * np.sqrt(sigma**2 / s) * np.exp(-y**2 / (4 * s) + 1j * k0 * (x - x0) - 0.5j * k0**2 * t)

def evolui(psi0, t):
    """evolução livre: na base de momentos o hamiltoniano é diagonal, k^2/2"""
    ########### complete: cada modo e^{ikx} ganha a fase e^{-i k^2 t / 2} (k é o vetor de números de onda) ##########
    multiplicador = np.ones_like(k)
    return np.fft.ifft(multiplicador * np.fft.fft(psi0))

psi0 = exato(x, 0)
print("  t    erro máx contra a fórmula    Δx numérico   Δx da fórmula   Δp numérico")
fig, ax = plt.subplots(1, 3, figsize=(12, 3.3))
for t in (0, 2, 5, 10):
    psi = evolui(psi0, t)
    rho = np.abs(psi) ** 2
    m1 = np.sum(x * rho) * dx
    dxn = np.sqrt(np.sum((x - m1) ** 2 * rho) * dx)
    phik = np.abs(np.fft.fft(psi)) ** 2
    phik /= phik.sum()
    dpn = np.sqrt(np.sum(k**2 * phik) - np.sum(k * phik) ** 2)
    print(f"{t:4.0f}    {np.max(np.abs(psi - exato(x, t))):.1e}                   {dxn:.4f}        {sigma * np.sqrt(1 + (t / (2 * sigma**2))**2):.4f}         {dpn:.4f}")
    ax[0].plot(x, rho, label=f"t = {t}")
ax[0].set_xlim(-30, 30); ax[0].set_xlabel("x"); ax[0].legend(fontsize=8); ax[0].set_title("|psi|^2: anda a k0 e alarga")

t = 10.0
psi = evolui(psi0, t)
ax[1].plot(x, psi.real, lw=0.8, label="Re psi")
ax[1].plot(x, np.abs(psi), "k", lw=1, label="|psi|")
ax[1].set_xlim(-5, 25); ax[1].set_xlabel("x"); ax[1].legend(fontsize=8); ax[1].set_title("t = 10: as cristas se apertam na frente")

# número de onda local: a derivada da fase.  Para t grande, k_local ~ (x - x0)/t
janela = np.abs(psi) > 0.02 * np.abs(psi).max()
fase = np.unwrap(np.angle(psi))
k_local = np.gradient(fase, dx)
k_teoria = k0 + (x - x0 - k0 * t) * t / (4 * sigma**4 + t**2)
print(f"k local contra a fórmula (onde o pacote está): erro máx = {np.max(np.abs(k_local - k_teoria)[janela]):.1e}")
ax[2].plot(x[janela], k_local[janela], label="d(fase)/dx")
ax[2].plot(x[janela], (x[janela] - x0) / t, "--", label="(x - x0)/t")
ax[2].set_xlabel("x"); ax[2].legend(fontsize=8); ax[2].set_title("o pacote vira um mapa de velocidades")
plt.tight_layout()
plt.show()
