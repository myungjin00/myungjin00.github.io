import pathlib
OUT = pathlib.Path("/data1/project/myungjin/site-lab/public/assets/fig")
G, B, A, L, M, I, P = "#1E4A39", "#2E5878", "#C2703C", "#D3D8CE", "#6E7873", "#1C2421", "#F7F7F3"
MONO = "ui-monospace,monospace"
def svg(name, w, h, body):
    (OUT/f"{name}.svg").write_text(
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" role="img" aria-label="{name}">\n'
        + "\n".join(body) + "\n</svg>\n")
    print("wrote", name)
def t(x, y, s, size=10, fill=M, anchor="start", weight="normal"):
    return (f'<text x="{x}" y="{y}" text-anchor="{anchor}" font-family="{MONO}" font-size="{size}" '
            f'fill="{fill}" font-weight="{weight}">{s}</text>')
def box(x, y, w, h, stroke=L, fill="#FFFFFF", r=5, sw=1.4, dash=None):
    d = f' stroke-dasharray="{dash}"' if dash else ""
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"{d}/>'
def line(x1, y1, x2, y2, c=L, sw=1.2, dash=None, arrow=None):
    d = f' stroke-dasharray="{dash}"' if dash else ""
    m = f' marker-end="url(#{arrow})"' if arrow else ""
    return f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{c}" stroke-width="{sw}"{d}{m}/>'
def defs(*cols):
    out = ['<defs>']
    for i, c in enumerate(cols):
        out.append(f'<marker id="ar{i}" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto">'
                   f'<path d="M0 0 L6 3 L0 6 z" fill="{c}"/></marker>')
    out.append('</defs>'); return out

# ---------------- 1. filesystem tree ----------------
b = defs(L, A)
b += [t(18, 22, "one tree, one root &#8212; no C: drive", 11, M)]
NODES = [("/", 300, 52, G), ("home/", 150, 100, L), ("data/", 300, 100, L), ("usr/", 450, 100, L),
         ("you/", 150, 148, L), ("project/", 300, 148, L), ("bin/", 450, 148, L),
         ("notes.md", 150, 196, L), ("raw/", 258, 196, L), ("results/", 372, 196, L),
         ("python", 450, 196, L), ("train.csv", 258, 244, A)]
EDGES = [(0,1),(0,2),(0,3),(1,4),(2,5),(3,6),(4,7),(5,8),(5,9),(6,10),(8,11)]
for i, j in EDGES:
    _, x1, y1, _ = NODES[i]; _, x2, y2, _ = NODES[j]
    b.append(f'<path d="M{x1} {y1+13} V{(y1+y2)/2} H{x2} V{y2-13}" fill="none" stroke="{L}" stroke-width="1.1"/>')
for lab, x, y, c in NODES:
    w = len(lab)*6.4 + 20
    b += [box(x-w/2, y-13, w, 26, stroke=c), t(x, y+3.6, lab, 10, I, "middle")]
b += [
      t(18, 290, 'absolute &#8212; from the root:  /data/project/raw/train.csv', 10, M),
      t(18, 306, 'relative &#8212; from where you are standing in project/:  raw/train.csv', 10, A),
      t(18, 328, '.  = here        ..  = one level up        ~  = your home', 10, M)]
svg("linux-tree", 620, 344, b)

# ---------------- 2. permission bits ----------------
b = defs(L)
b += [t(18, 22, "ls -l   &#8594;   -rwxr-xr--  1  you  group  4.2K  train.sh", 11, M)]
CH = list("-rwxr-xr--")
x0, cw = 70, 40
for i, ch in enumerate(CH):
    col = G if i == 0 else (A if i <= 3 else (B if i <= 6 else M))
    b += [box(x0+i*cw, 48, cw-5, 34, stroke=col),
          t(x0+i*cw+(cw-5)/2, 71, ch if ch != "-" else "&#8211;", 15, I, "middle", "500")]
SPANS = [(0, 1, "type", G, "&#8211; = file"),
         (1, 4, "user (you)", A, "rwx = 7"),
         (4, 7, "group", B, "r&#8211;x = 5"),
         (7, 10, "everyone else", M, "r&#8211;&#8211; = 4")]
for s, e, lab, col, note in SPANS:
    xa, xb = x0+s*cw, x0+e*cw-5
    b += [line(xa, 92, xb, 92, col, 1.4),
          line(xa, 88, xa, 96, col, 1.4), line(xb, 88, xb, 96, col, 1.4),
          t((xa+xb)/2, 110, lab, 10, col, "middle"),
          t((xa+xb)/2, 126, note, 9.5, M, "middle")]
b += [t(18, 162, "read 4  +  write 2  +  execute 1", 11, M),
      box(70, 176, 300, 40, stroke=L, fill=P),
      t(88, 201, "chmod 754 train.sh   &#8801;   rwx  r-x  r--", 11, I),
      t(392, 194, "7 = 4+2+1   you can read, write, run it", 9.5, A),
      t(392, 210, "5 = 4+0+1   the group can read and run", 9.5, B),
      t(18, 244, "On a directory, x means &#8220;can enter&#8221;, and w on the directory &#8212; not the file &#8212; is what lets you delete.", 10, M)]
svg("linux-permissions", 680, 262, b)

# ---------------- 3. streams and pipes ----------------
b = defs(L, G, A, B)
b += [t(18, 22, "every command has one way in and two ways out", 11, M)]
b += [box(250, 56, 140, 46, stroke=G), t(320, 84, "command", 12, I, "middle", "500")]
b += [line(110, 79, 244, 79, L, 1.4, None, "ar0"), t(112, 70, "stdin  (0)", 10, M),
      line(396, 68, 530, 68, G, 1.4, None, "ar1"), t(400, 59, "stdout (1)", 10, G),
      line(396, 94, 530, 94, A, 1.4, None, "ar2"), t(400, 112, "stderr (2)", 10, A),
      t(536, 72, "the result", 10, M), t(536, 98, "the complaints", 10, M)]
b += [t(18, 146, "they are separate, which is why this still prints errors to the screen:", 10, M),
      box(40, 158, 280, 30, stroke=L, fill=P), t(56, 178, "python train.py &gt; train.log", 11, I),
      t(336, 178, "&#8594;  stdout to the file, stderr still on screen", 10, M),
      box(40, 198, 280, 30, stroke=L, fill=P), t(56, 218, "python train.py &gt; train.log 2&gt;&amp;1", 11, I),
      t(336, 218, "&#8594;  both to the file  (order matters)", 10, A)]
b += [t(18, 268, "a pipe wires one command&#8217;s stdout into the next one&#8217;s stdin", 10, M)]
CH2 = [("ls -l", 70), ("sort -k5 -n", 210), ("tail -5", 370)]
for lab, x in CH2:
    w = len(lab)*6.8 + 26
    b += [box(x-w/2, 286, w, 32, stroke=B), t(x, 307, lab, 10.5, I, "middle")]
b += [line(70+30, 302, 210-48, 302, B, 1.4, None, "ar3"), t(140, 295, "|", 12, B, "middle"),
      line(210+48, 302, 370-32, 302, B, 1.4, None, "ar3"), t(300, 295, "|", 12, B, "middle"),
      t(448, 306, "read it as a sentence", 10, M)]
svg("linux-streams", 660, 336, b)

# ---------------- 4. environments ----------------
b = defs(L)
b += [t(18, 22, "one interpreter and one set of packages per project", 11, M)]
ENVS = [("base", 30, "conda itself &#8212; keep it empty", L, ["python 3.12"]),
        ("mol  (GPU work)", 240, "", G, ["python 3.12", "torch 2.8 + cu128", "rdkit 2025.09", "PyG 2.7"]),
        ("omics", 450, "", B, ["python 3.11", "scanpy 1.11", "anndata 0.13", "pydeseq2 0.5"])]
for name, x, note, col, pkgs in ENVS:
    h = 44 + len(pkgs)*20
    b += [box(x, 46, 190, h, stroke=col, fill=P),
          t(x+14, 68, name, 11, col, "start", "500")]
    for i, p in enumerate(pkgs):
        b.append(t(x+14, 92+i*20, p, 10, I))
    if note: b.append(t(x+14, 92, note, 9.5, M))
b += [box(30, 200, 610, 36, stroke=L),
      t(44, 223, "the machine: one NVIDIA driver, one filesystem, many environments", 10.5, M)]
b += [line(125, 180, 125, 198, L, 1.2), line(335, 174, 335, 198, L, 1.2), line(545, 174, 545, 198, L, 1.2)]
b += [t(18, 266, "numpy 1.26 and numpy 2.1 can both exist, because neither of them is installed globally.", 10, M),
      t(18, 284, "conda can also install the non-Python half &#8212; CUDA, compilers, samtools, R. venv and uv cannot.", 10, A)]
svg("conda-environments", 660, 300, b)

# ---------------- 5. Seurat vs AnnData ----------------
b = defs(L)
b += [t(18, 22, "the same single-cell experiment, in two objects", 11, M)]
b += [t(40, 50, "Seurat   (R)", 11, G, "start", "500"), t(380, 50, "AnnData   (Python)", 11, B, "start", "500")]
ROWS = [("pbmc[[\"RNA\"]]$counts", "genes &#215; cells", ".layers[\"counts\"]", "cells &#215; genes"),
        ("pbmc[[\"RNA\"]]$data", "normalised", ".X", "normalised"),
        ("pbmc@meta.data", "per cell", ".obs", "per cell"),
        ("rownames(pbmc)", "per gene", ".var", "per gene"),
        ("Embeddings(pbmc, \"pca\")", "cell &#215; 50", ".obsm[\"X_pca\"]", "cell &#215; 50"),
        ("Idents(pbmc)", "cluster label", ".obs[\"leiden\"]", "cluster label"),
        ("pbmc@misc", "everything else", ".uns", "everything else")]
y0 = 66
for i, (lr, nr, lp, np_) in enumerate(ROWS):
    y = y0 + i*34
    b += [box(30, y, 250, 28, stroke=G if i < 2 else L, fill=P if i < 2 else "#FFFFFF"),
          t(42, y+18, lr, 9.5, I), t(272, y+18, nr, 8.5, M, "end"),
          box(370, y, 250, 28, stroke=B if i < 2 else L, fill=P if i < 2 else "#FFFFFF"),
          t(382, y+18, lp, 9.5, I), t(612, y+18, np_, 8.5, M, "end"),
          line(286, y+14, 364, y+14, L, 1.1)]
b += [t(18, y0+len(ROWS)*34+22,
        "The one that bites: Seurat stores genes &#215; cells, AnnData stores cells &#215; genes. Print dim() before you trust a matrix.",
        10, A)]
svg("seurat-anndata", 660, y0+len(ROWS)*34+40, b)
