"""The same three bonds of 1-propanol, stored densely and as a COO edge list."""
import pathlib, torch
OUT = pathlib.Path("/data1/project/myungjin/site-lab/public/assets/fig")
G, B, A, L, M, I, P = "#1E4A39", "#2E5878", "#C2703C", "#D3D8CE", "#6E7873", "#1C2421", "#F7F7F3"
MONO = "ui-monospace,monospace"

def t(x, y, s, sz=10, fl=M, an="start", w="normal"):
    return f'<text x="{x}" y="{y}" text-anchor="{an}" font-family="{MONO}" font-size="{sz}" fill="{fl}" font-weight="{w}">{s}</text>'

def box(x, y, w, h, st=L, fi="#FFFFFF", r=3, sw=1.1):
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{fi}" stroke="{st}" stroke-width="{sw}"/>'

# 1-propanol, heavy atoms only: C0-C1-C2-O3, each bond stored in both directions
edge_index = torch.tensor([[0, 1, 1, 2, 2, 3],
                           [1, 0, 2, 1, 3, 2]])
n = 4
Adj = torch.zeros(n, n, dtype=torch.long)
Adj[edge_index[0], edge_index[1]] = 1
ones = int(Adj.sum())
dense_n = n * n
coo_n = edge_index.numel()
HL = (1, 2)                                   # the bond highlighted in both panels
hl_cols = [k for k in range(edge_index.shape[1])
           if tuple(sorted(edge_index[:, k].tolist())) == HL]
assert ones == 6 and dense_n == 16 and coo_n == 12 and len(hl_cols) == 2

VW, VH = 720, 392
o = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{VW}" height="{VH}" viewBox="0 0 {VW} {VH}" role="img"'
     ' aria-label="A dense adjacency matrix and a COO edge index for 1-propanol, with the same bond highlighted in both">']
o.append(t(18, 22, "1-propanol, heavy atoms only &#183; 4 nodes, 3 bonds", 11, M))

# ---- the molecule ----
LBL = ["C0", "C1", "C2", "O3"]
XS = [250, 320, 390, 460]
MY = 62
for k in range(3):
    col, sw = (A, 3.0) if (k, k + 1) == HL else (M, 1.6)
    o.append(f'<line x1="{XS[k]}" y1="{MY}" x2="{XS[k+1]}" y2="{MY}" stroke="{col}" stroke-width="{sw}"/>')
for k, lab in enumerate(LBL):
    o.append(f'<circle cx="{XS[k]}" cy="{MY}" r="14" fill="#FFFFFF" stroke="{M}" stroke-width="1.4"/>')
    o.append(t(XS[k], MY + 3.6, lab, 9.5, I, "middle", "500"))
o.append(f'<line x1="18" y1="100" x2="{VW-18}" y2="100" stroke="{L}" stroke-width="1"/>')

# ---- left panel: dense adjacency ----
o.append(t(40, 128, "dense adjacency matrix", 11, I, "start", "500"))
o.append(t(40, 144, f"{n} &#215; {n} = {dense_n} numbers &#183; {ones} ones", 9.5, M))
CS, X0, Y0 = 34, 76, 176
for j in range(n):
    o.append(t(X0 + j * CS + CS / 2, Y0 - 8, LBL[j], 9, M, "middle"))
for i in range(n):
    o.append(t(X0 - 8, Y0 + i * CS + CS / 2 + 3.4, LBL[i], 9, M, "end"))
    for j in range(n):
        v = int(Adj[i, j])
        on = (i, j) in ((HL[0], HL[1]), (HL[1], HL[0]))
        fi = "#F3E3D6" if on else ("#FFFFFF" if v else P)
        st = A if on else L
        o.append(box(X0 + j * CS, Y0 + i * CS, CS, CS, st=st, fi=fi, sw=1.5 if on else 1.0))
        o.append(t(X0 + j * CS + CS / 2, Y0 + i * CS + CS / 2 + 3.8, str(v), 10.5,
                   (A if on else I) if v else "#BFC7C0", "middle", "600" if v else "normal"))

# ---- right panel: COO edge_index ----
RX = 412
o.append(t(RX, 128, "edge_index, COO format", 11, I, "start", "500"))
o.append(t(RX, 144, f"2 &#215; {edge_index.shape[1]} = {coo_n} numbers", 9.5, M))
CW, CH, EX, EY = 38, 34, RX + 62, 176
for k in range(edge_index.shape[1]):
    o.append(t(EX + k * CW + CW / 2, EY - 8, str(k), 9, M, "middle"))
for r in range(2):
    o.append(t(EX - 8, EY + r * CH + CH / 2 + 3.4, ["source", "target"][r], 9, M, "end"))
    for k in range(edge_index.shape[1]):
        on = k in hl_cols
        o.append(box(EX + k * CW, EY + r * CH, CW, CH, st=A if on else L,
                     fi="#F3E3D6" if on else "#FFFFFF", sw=1.5 if on else 1.0))
        o.append(t(EX + k * CW + CW / 2, EY + r * CH + CH / 2 + 3.8, str(int(edge_index[r, k])),
                   10.5, A if on else I, "middle", "600"))
o.append(t(EX, EY + 2 * CH + 22, "one column = one directed edge", 9, M))
o.append(t(EX, EY + 2 * CH + 38, "each bond appears twice, once per direction", 9, M))

# ---- legend ----
LY = 340
o.append(box(40, LY - 10, 14, 14, st=A, fi="#F3E3D6", r=2, sw=1.5))
o.append(t(62, LY + 1, "the C1&#8211;C2 bond", 9.5, M))
o.append(box(190, LY - 10, 14, 14, st=L, fi="#FFFFFF", r=2))
o.append(t(212, LY + 1, "a bond", 9.5, M))
o.append(box(290, LY - 10, 14, 14, st=L, fi=P, r=2))
o.append(t(312, LY + 1, "a zero, which the edge list never stores", 9.5, M))
o.append("</svg>")
(OUT / "edge-index.svg").write_text("\n".join(o) + "\n")
print(f"dense {dense_n} numbers, {ones} ones | coo {coo_n} numbers | highlighted columns {hl_cols}")
print("wrote edge-index.svg")
