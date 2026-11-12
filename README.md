# Mecânica quântica — notas de aula em forma de site

O terceiro "livro como site", irmão de [`notas_aula_edp`](https://github.com/moacyr-alvim/notas_aula_edp):
um mapa de conceitos na página inicial, páginas curtas que não precisam ser lidas em ordem, demos
interativas, exercícios com solução recolhível e células de Python que rodam **no navegador** (Pyodide),
sem servidor.

O conteúdo mistura três livros, cada um uma porta de entrada no mapa:

- **Freericks**, *Quantum Mechanics Done Right* (Springer, 2026, acesso aberto): spin e Stern–Gerlach
  primeiro, métodos de operadores sem escolher representação;
- **Griffiths**, *Introduction to Quantum Mechanics*: a função de onda e a equação de Schrödinger primeiro;
- **Shankar**, *Principles of Quantum Mechanics*: os postulados primeiro.

Cada página diz, logo abaixo do título, onde o mesmo assunto está nos três. Álgebra linear e cálculo são
pré-requisitos; algumas páginas apontam para o livro de EDP (o poço infinito, por exemplo, já está lá, e
aparece no mapa com borda verde).

## Páginas

| Página | Demo | Python |
|---|---|---|
| Stern–Gerlach e o qubit | ímãs em série, átomo por átomo | |
| Notação de Dirac e bases contínuas | | X, P e o comutador numa grade |
| Observáveis e medição | | uma máquina de medir (Born e colapso) |
| Comutadores e incerteza | | |
| Evolução no tempo: precessão e Rabi | esfera de Bloch | Rabi pela receita espectral, sem e com onda girante |
| A função de onda e a equação de Schrödinger | | Crank–Nicolson contra Euler, Ehrenfest |
| Partícula livre e pacotes de onda | pacote gaussiano, grupo e fase | evolução pela FFT |
| Degraus, barreiras e tunelamento | T(E) e o estado de espalhamento | split-step: pacote contra barreira |
| Oscilador harmônico: operadores escada | densidade e plano de fase | a e a† como matrizes, oscilador anarmônico |
| Momento angular: a álgebra | | matrizes de qualquer spin e rotações |
| Emaranhamento e Bell | CHSH: singleto contra modelo local | np.kron, CHSH e Schmidt |

O mapa (`assets/mapa.js`) tem mais 20 nós "em breve": polarização, matriz densidade, simetrias, poço
finito, delta, Schrödinger numérico, estados coerentes, fatorização, segunda quantização, harmônicos
esféricos, soma de momentos angulares, hidrogênio, partículas idênticas, modelos de spin, variacional,
perturbação (estacionária e no tempo), WKB, Ehrenfest e integral de caminho.

## Ver no seu computador

O Python no navegador usa um Web Worker, que não funciona abrindo o arquivo direto do disco:

```bash
python3 -m http.server 8000
# abra http://localhost:8000
```

## Publicar no GitHub Pages

No GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**. O
`.github/workflows/pages.yml` roda os testes e publica a cada `push` na `main`. O endereço fica
`https://moacyr-alvim.github.io/Notas_aula_mecanica_quantica/`.

O site é 100% estático. O Pyodide vem do CDN jsDelivr na primeira execução de Python; o KaTeX mora no
repositório (`vendor/katex/`, versão em `VERSAO.txt`), pelo mesmo motivo explicado no README do livro de EDP:
a versão conferida nos testes tem que ser a do ar.

## Estrutura

```
index.html            mapa de conceitos
paginas/              uma página por tópico (HTML escrito à mão)
py/                   códigos das células: *_lacunas.py (o aluno completa) e *_solucao.py
assets/
  style.css           visual do livro de EDP, com destaque violeta (--carac) e uma cor extra (--aux)
  site.js             tema, índice lateral, fórmulas (igual ao do livro de EDP)
  mapa.js             nós, raias, percursos; href começando com http leva ao livro de EDP
  pyrunner.js         células de Python editáveis; pyworker.js roda o Pyodide (igual ao do livro de EDP)
  sg-core.js          Stern–Gerlach: spinores no plano x–z, probabilidades e sorteio (testável em Node)
  sg-demo.js          demo dos ímãs em série
  rabi-core.js        spin num campo: rotação de Bloch, fórmula de Rabi, referencial girante e laboratório
  rabi-demo.js        demo da esfera de Bloch (arraste para girar a vista)
  pacote-core.js      pacote gaussiano livre, exato, e a conferência por quadratura de Fourier
  pacote-demo.js      demo do pacote: envelope, grupo, fase e largura
  barreira-core.js    espalhamento por potenciais constantes por pedaços (casamento de ψ e ψ'), picos de T(E)
  barreira-demo.js    demo do estado de espalhamento e de T(E), R(E)
  osc-core.js         funções de Hermite, coerente, gato, médias pelos operadores escada
  osc-demo.js         demo da densidade e do plano de fase com a elipse de incerteza
  bell-core.js        singleto contra modelo local, CHSH e o cálculo com matrizes 4×4
  bell-demo.js        demo das correlações e de |S|
vendor/katex/         KaTeX servido pelo próprio site
tests/                testes (abaixo)
```

## Como acrescentar

**Uma página nova**: copie uma página de `paginas/`, escreva, troque `href: null` do nó em
`assets/mapa.js` pelo caminho, e ponha a página em `need` de `tests/check_site.py` (o teste falha se
esquecer). O índice lateral é gerado dos `<h2 id="...">`. Fórmulas: `$...$` e `$$...$$`, com `&lt;` no
lugar de `<`.

**Uma célula de Python**:

```html
<div class="pycell" data-title="Título" data-starter="../py/x_lacunas.py" data-solution="../py/x_solucao.py"></div>
<script src="../assets/pyrunner.js"></script>
```

Só `numpy` e `matplotlib` são carregados no navegador (dá para acrescentar em `assets/pyworker.js`).
As células são curtas de propósito: o Pyodide é algumas vezes mais lento que o Python nativo.

## Testes

```bash
node tests/sg-core.test.js          # Stern–Gerlach: ortonormalidade, (1 + m·n)/2, 720°, montagens, sorteio
node tests/rabi-core.test.js        # Rabi: Rodrigues = e^{-iHt}, fórmula, pulso π, laboratório
node tests/pacote-core.test.js      # pacote livre: norma, centro, largura, Fourier, a própria EDP
node tests/barreira-core.test.js    # T + R = 1, fórmulas fechadas, transparência, tunelamento ressonante
node tests/osc-core.test.js         # Hermite, coerente, médias por escada = por integral, franjas do gato
node tests/bell-core.test.js        # −cos pelo formalismo 4×4, |S| ≤ 2 local, ≤ 2√2 quântico, sorteios
python3 tests/run_python_cells.py   # roda todos os py/*.py como o worker faz e confere os números
node tests/smoke_dom.js             # demos e executor de Python num DOM simulado
python3 tests/check_site.py         # links, âncoras, ids, tags, fórmulas e o KaTeX do repositório
```

E, antes de publicar, o que precisa de navegador (não roda no GitHub Actions):

```bash
npm i -D playwright && npx playwright install chromium   # uma vez
node tests/render_navegador.js       # todas as páginas a 1100 px e a 400 px
```
