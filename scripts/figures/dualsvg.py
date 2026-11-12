import sys
sys.path.insert(0, "/data1/project/myungjin/SJoINT/preprocess")
from rdkit import Chem
from rdkit.Chem import AllChem
from core.features import tree_decomp

GREEN, ATOM, LINE, MUTED, INK = "#1E4A39", "#C2703C", "#D3D8CE", "#6E7873", "#1C2421"
SM = "CC(=O)Nc1ccc(O)cc1"                      # paracetamol
mol = Chem.MolFromSmiles(SM); AllChem.Compute2DCoords(mol)
conf = mol.GetConformer()
P = [(conf.GetAtomPosition(i).x, conf.GetAtomPosition(i).y) for i in range(mol.GetNumAtoms())]
cliques, jt_edges = tree_decomp(mol)

# map molecule coords into the left panel
xs, ys = [p[0] for p in P], [p[1] for p in P]
PX0, PX1, PY0, PY1 = 36, 286, 68, 210
sc = min((PX1-PX0)/(max(xs)-min(xs)), (PY1-PY0)/(max(ys)-min(ys)))
cx, cy = (max(xs)+min(xs))/2, (max(ys)+min(ys))/2
mx, my = (PX0+PX1)/2, (PY0+PY1)/2
def xy(i):
    x, y = P[i]
    return (mx + (x-cx)*sc, my - (y-cy)*sc)

o = ['<svg viewBox="0 0 660 300" role="img" aria-label="Atom graph and junction tree of the same molecule">']
o.append(f'<text x="36" y="26" font-family="ui-monospace,monospace" font-size="12" fill="{ATOM}">atom-level graph</text>')
o.append(f'<text x="36" y="44" font-family="ui-monospace,monospace" font-size="10" fill="{MUTED}">11 nodes &#183; 11 edges &#183; node = atom, edge = bond</text>')
o.append(f'<text x="366" y="26" font-family="ui-monospace,monospace" font-size="12" fill="{GREEN}">junction tree</text>')
o.append(f'<text x="366" y="44" font-family="ui-monospace,monospace" font-size="10" fill="{MUTED}">7 nodes &#183; 6 edges &#183; node = ring or bond</text>')
o.append(f'<line x1="326" y1="60" x2="326" y2="268" stroke="{LINE}" stroke-width="1"/>')

# ---- left: bonds then atoms
for b in mol.GetBonds():
    i, j = b.GetBeginAtomIdx(), b.GetEndAtomIdx()
    (x1,y1),(x2,y2) = xy(i), xy(j)
    o.append(f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" stroke="{ATOM}" stroke-width="1.6" opacity=".55"/>')
    if str(b.GetBondType()) == 'DOUBLE':      # one offset line, drawn only for the C=O
        dx, dy = x2-x1, y2-y1; L=(dx*dx+dy*dy)**.5; ox, oy = -dy/L*2.6, dx/L*2.6
        o.append(f'<line x1="{x1+ox:.1f}" y1="{y1+oy:.1f}" x2="{x2+ox:.1f}" y2="{y2+oy:.1f}" stroke="{ATOM}" stroke-width="1.6" opacity=".55"/>')
for i, a in enumerate(mol.GetAtoms()):
    x, y = xy(i); s = a.GetSymbol()
    fill = {'C': "#FFFFFF", 'N': "#FFFFFF", 'O': "#FFFFFF"}[s]
    o.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="7.5" fill="{fill}" stroke="{ATOM}" stroke-width="1.6"/>')
    o.append(f'<text x="{x:.1f}" y="{y+3.2:.1f}" text-anchor="middle" font-family="ui-monospace,monospace" font-size="9" fill="{INK}">{s}</text>')

# ---- right: junction tree, hand-placed to read left to right
LAB = {0:"C–C", 1:"C=O", 2:"C–N", 3:"N–C", 4:"C–O", 5:"ring", 6:"C"}
POS = {0:(392,96), 1:(392,196), 6:(452,146), 2:(516,146), 3:(574,146), 5:(624,146), 4:(624,86)}
R   = {k: (15 if k == 5 else 11) for k in LAB}
for i, j in jt_edges:
    (x1,y1),(x2,y2) = POS[i], POS[j]
    o.append(f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{GREEN}" stroke-width="1.4" opacity=".5"/>')
for k,(x,y) in POS.items():
    o.append(f'<circle cx="{x}" cy="{y}" r="{R[k]}" fill="#FFFFFF" stroke="{GREEN}" stroke-width="1.8"/>')
    o.append(f'<text x="{x}" y="{y+3.2}" text-anchor="middle" font-family="ui-monospace,monospace" font-size="{8 if len(LAB[k])>2 else 9}" fill="{INK}">{LAB[k]}</text>')
o.append(f'<text x="366" y="258" font-family="ui-monospace,monospace" font-size="10" fill="{MUTED}">the six-membered ring collapses to one node</text>')
o.append(f'<text x="36" y="258" font-family="ui-monospace,monospace" font-size="10" fill="{MUTED}">paracetamol &#183; CC(=O)Nc1ccc(O)cc1</text>')
o.append('</svg>')
open("/data1/project/myungjin/site-lab/public/assets/fig/dual-view-paracetamol.svg","w").write("\n".join(o))
print("ok", len(cliques), len(jt_edges))
