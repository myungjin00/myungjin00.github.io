"""The products of four decomposition schemes, drawn as what each one actually returns."""
import sys; sys.path.insert(0, "/data1/project/myungjin/SJoINT/preprocess")
from rdkit import Chem, RDLogger
from rdkit.Chem import BRICS, AllChem
from rdkit.Chem.Draw import rdMolDraw2D
from rdkit.Chem.Scaffolds import MurckoScaffold
from core.features import tree_decomp
RDLogger.DisableLog("rdApp.*")

SM = "Cc1ccc(cc1)S(=O)(=O)Nc1ccc(cc1)C(=O)NCCc1ccccc1"
m = Chem.MolFromSmiles(SM); AllChem.Compute2DCoords(m)
G, B, A, L, M, I = "#1E4A39", "#2E5878", "#C2703C", "#D3D8CE", "#6E7873", "#1C2421"
MONO = "ui-monospace,monospace"

def draw(mol, w, h, hl=None, col=None):
    AllChem.Compute2DCoords(mol)
    d = rdMolDraw2D.MolDraw2DSVG(w, h); o = d.drawOptions()
    o.bondLineWidth = 1.3; o.addStereoAnnotation = False
    if hl:
        def rgb(x, a=.3):
            x = x.lstrip("#"); return tuple(int(x[i:i+2],16)/255 for i in (0,2,4)) + (a,)
        rdMolDraw2D.PrepareAndDrawMolecule(d, mol, highlightAtoms=list(hl),
            highlightAtomColors={i: rgb(col or A) for i in hl})
    else:
        rdMolDraw2D.PrepareAndDrawMolecule(d, mol)
    d.FinishDrawing(); s = d.GetDrawingText()
    return s[s.index(">", s.index("<svg"))+1 : s.rindex("</svg>")]

def t(x, y, s, sz=10, fl=M, an="start", w="normal"):
    return f'<text x="{x}" y="{y}" text-anchor="{an}" font-family="{MONO}" font-size="{sz}" fill="{fl}" font-weight="{w}">{s}</text>'

scaf = MurckoScaffold.GetScaffoldForMol(m)
frags = [Chem.MolFromSmiles(s) for s in sorted(BRICS.BRICSDecompose(m))]
frags = [f for f in frags if f]
cliques, jt_edges = tree_decomp(m)

VW, VH = 720, 620
o = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {VW} {VH}" role="img" aria-label="What four decomposition schemes return for one molecule">']
o.append(t(18, 20, "the same molecule, and what each scheme hands back", 11, M))

# row 0: the input
o.append(t(18, 46, "input", 11, I, "start", "500"))
o.append(t(18, 62, f"{m.GetNumAtoms()} atoms &#183; {m.GetNumBonds()} bonds &#183; 3 rings", 9.5, M))
o.append(f'<g transform="translate(150,34)">{draw(m, 420, 110)}</g>')
o.append(f'<line x1="18" y1="156" x2="{VW-18}" y2="156" stroke="{L}" stroke-width="1"/>')

# row 1: Murcko
o.append(t(18, 182, "Murcko scaffold", 11, G, "start", "500"))
o.append(t(18, 198, f"1 piece &#183; {scaf.GetNumAtoms()} atoms", 9.5, M))
o.append(t(18, 214, "side chains off,", 9, M)); o.append(t(18, 228, "rings + linkers kept", 9, M))
o.append(f'<g transform="translate(150,166)">{draw(scaf, 420, 100)}</g>')
o.append(f'<line x1="18" y1="276" x2="{VW-18}" y2="276" stroke="{L}" stroke-width="1"/>')

# row 2: BRICS fragments
o.append(t(18, 302, "BRICS", 11, A, "start", "500"))
o.append(t(18, 318, f"{len(frags)} fragments", 9.5, M))
o.append(t(18, 334, "cut only at bonds a", 9, M)); o.append(t(18, 348, "chemist could re-form", 9, M))
for k, fr in enumerate(frags[:6]):
    x = 150 + (k % 3) * 142; y = 286 + (k // 3) * 78
    o.append(f'<g transform="translate({x},{y})">{draw(fr, 138, 74)}</g>')
o.append(f'<line x1="18" y1="444" x2="{VW-18}" y2="444" stroke="{L}" stroke-width="1"/>')

# row 3: junction tree
o.append(t(18, 470, "junction tree", 11, B, "start", "500"))
o.append(t(18, 486, f"{len(cliques)} nodes &#183; {len(jt_edges)} edges", 9.5, M))
o.append(t(18, 502, "nothing is removed &#8212;", 9, M)); o.append(t(18, 516, "the molecule is rewritten", 9, M))
# lay the tree out by BFS depth
import collections
adj = collections.defaultdict(list)
for a_, b_ in jt_edges: adj[a_].append(b_); adj[b_].append(a_)
depth, order, seen = {0: 0}, [0], {0}
q = collections.deque([0])
while q:
    u = q.popleft()
    for v in adj[u]:
        if v not in seen:
            seen.add(v); depth[v] = depth[u] + 1; order.append(v); q.append(v)
cols = collections.defaultdict(list)
for n_ in order: cols[depth[n_]].append(n_)
POS = {}
X0, Y0, DY = 168, 470, 26
DX = min(46, (VW - 40 - X0) / max(1, max(cols)))
for d_, ns in cols.items():
    for i, n_ in enumerate(ns):
        POS[n_] = (X0 + d_ * DX, Y0 + (i - (len(ns) - 1) / 2) * DY)
for a_, b_ in jt_edges:
    if a_ in POS and b_ in POS:
        (x1, y1), (x2, y2) = POS[a_], POS[b_]
        o.append(f'<line x1="{x1:.0f}" y1="{y1:.0f}" x2="{x2:.0f}" y2="{y2:.0f}" stroke="{B}" stroke-width="1" opacity=".45"/>')
for n_, (x, y) in POS.items():
    sz = len(cliques[n_])
    r = 9 if sz > 2 else 6
    fill = "#E8EEF3" if sz > 2 else "#FFFFFF"
    o.append(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{r}" fill="{fill}" stroke="{B}" stroke-width="1.6"/>')
    if sz > 2: o.append(t(x, y + 3.2, "R", 8, B, "middle", "600"))
o.append(t(VW - 18, 588, "R = a ring collapsed to one node", 9, M, "end"))
o.append("</svg>")
open("/data1/project/myungjin/site-lab/public/assets/fig/fragmentation.svg", "w").write("\n".join(o))
print("ok | murcko", scaf.GetNumAtoms(), "| brics", len(frags), "| jt", len(cliques), len(jt_edges))
