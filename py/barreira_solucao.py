import numpy as np
import matplotlib.pyplot as plt

# Um pacote contra uma barreira, hbar = m = 1, pelo método split-step:
#   meio passo de potencial, um passo cinético exato (FFT), meio passo de potencial.
L, N = 256.0, 2048                                     # dx = 1/8: a barreira cabe num número inteiro de pontos
DT = 0.02                                              # passo de tempo
x = np.linspace(-L / 2, L / 2, N, endpoint=False)
dx = x[1] - x[0]
k = 2 * np.pi * np.fft.fftfreq(N, d=dx)

V0, a = 1.0, 1.0
V = np.where((x >= 0) & (x < a), V0, 0.0)              # barreira retangular em [0, a]
sigma, x0 = 8.0, -40.0                                 # pacote largo: momento bem definido (Delta k = 1/16)

def pacote(k0):
    psi = np.exp(-(x - x0) ** 2 / (4 * sigma**2) + 1j * k0 * x)
    return psi / np.sqrt(np.sum(np.abs(psi) ** 2) * dx)

def T_exato(E):
    E = np.asarray(E, dtype=float)
    d = np.where(np.abs(E - V0) < 1e-9, 1e-9, E - V0)      # em E = V0 vale o limite 1/(1 + V0 a^2/2)
    q = np.sqrt(np.abs(2 * d))
    s2 = np.where(d < 0, np.sinh(q * a) ** 2, np.sin(q * a) ** 2)
    return 1 / (1 + V0**2 * s2 / (4 * E * np.abs(d)))

def evolui(psi, t_final, dt=DT, fotos=()):
    meio = np.exp(-0.5j * V * dt)                          # meio passo de potencial: e^{-i V dt/2}
    cin = np.exp(-0.5j * k**2 * dt)                        # passo cinético: e^{-i k^2 dt/2}
    guardadas = {}
    passos = int(round(t_final / dt))
    for n in range(passos + 1):
        if n in fotos:
            guardadas[n * dt] = np.abs(psi) ** 2
        if n == passos:
            break
        psi = meio * np.fft.ifft(cin * np.fft.fft(meio * psi))
    return psi, guardadas

fig, ax = plt.subplots(1, 2, figsize=(11, 3.4))
E0s = [0.3, 0.6, 0.8, 1.0, 1.3, 2.0]
print("   E0     T medido (pacote)   T médio previsto   T(E0) onda plana")
medidos = []
for E0 in E0s:
    k0 = np.sqrt(2 * E0)
    t_final = 90 / k0
    fotos = (0, int(round(0.5 * t_final / DT)), int(round(t_final / DT))) if E0 == 0.8 else ()
    psi, guard = evolui(pacote(k0), t_final, fotos=fotos)
    T_med = np.sum(np.abs(psi[x > a]) ** 2) * dx
    # previsão: média de T(E) sobre a distribuição de momento |phi(k)|^2, gaussiana em k0 com Delta k = 1/(2 sigma)
    ks = np.linspace(k0 - 6 / (2 * sigma), k0 + 6 / (2 * sigma), 2001)
    peso = np.exp(-(ks - k0) ** 2 * 2 * sigma**2)
    T_prev = np.sum(peso * T_exato(ks**2 / 2)) / np.sum(peso)
    medidos.append(T_med)
    print(f"  {E0:4.2f}       {T_med:.4f}              {T_prev:.4f}            {T_exato(E0):.4f}")
    for t, d in guard.items():
        ax[0].plot(x, d, label=f"t = {t:.0f}")
ax[0].fill_between(x, 0, V / V0 * 0.06, color="0.85", label="barreira")
ax[0].set_xlim(-70, 70); ax[0].set_xlabel("x"); ax[0].legend(fontsize=8); ax[0].set_title("E0 = 0,8 V0: parte passa, parte volta")
Es = np.linspace(0.05, 3, 400)
ax[1].plot(Es, T_exato(Es), label="T(E), onda plana")
ax[1].plot(E0s, medidos, "o", label="pacotes (split-step)")
ax[1].axvline(V0, color="gray", ls=":")
ax[1].set_xlabel("E"); ax[1].legend(fontsize=8); ax[1].set_title("transmissão")
plt.tight_layout()
plt.show()
