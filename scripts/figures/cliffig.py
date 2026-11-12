"""A real activity cliff from the MoleculeACE CHEMBL234 (dopamine D3, Ki) set."""
from rdkit import Chem, DataStructs
from rdkit.Chem import Draw, rdFingerprintGenerator, rdFMCS
from rdkit.Chem.Draw import rdMolDraw2D

A = "CC(C)(C)c1nc(N2CCN(CCCCN3C(=O)CCc4ccccc43)CC2)cc(C(F)(F)F)n1"   # pKi 8.47
B = "CC(C)(C)c1nc(N2CCN(CCCCCN3C(=O)CCc4ccccc43)CC2)cc(C(F)(F)F)n1"  # pKi 5.39
pA, pB = 8.47, 5.39
ma, mb = Chem.MolFromSmiles(A), Chem.MolFromSmiles(B)
gen = rdFingerprintGenerator.GetMorganGenerator(radius=2, fpSize=2048)
sim = DataStructs.TanimotoSimilarity(gen.GetFingerprint(ma), gen.GetFingerprint(mb))

# the only thing that changes is the length of the alkyl linker between the two nitrogens
LINK_A = Chem.MolFromSmarts("[#7]-[CH2]-[CH2]-[CH2]-[CH2]-[#7]")
LINK_B = Chem.MolFromSmarts("[#7]-[CH2]-[CH2]-[CH2]-[CH2]-[CH2]-[#7]")
hl = {"a": list(ma.GetSubstructMatch(LINK_A)), "b": list(mb.GetSubstructMatch(LINK_B))}
assert hl["a"] and hl["b"], hl
print("linker A:", len(hl["a"]), "atoms | linker B:", len(hl["b"]), "atoms")

ATOM, GREEN, MUTED, INK, LINE = "#C2703C", "#1E4A39", "#6E7873", "#1C2421", "#D3D8CE"
def rgb(h, a=.35):
    h = h.lstrip("#"); return tuple(int(h[i:i+2], 16)/255 for i in (0, 2, 4)) + (a,)

W, H = 330, 230
def draw(m, atoms):
    d = rdMolDraw2D.MolDraw2DSVG(W, H)
    o = d.drawOptions()
    o.addStereoAnnotation = False
    o.bondLineWidth = 1.4
    o.setHighlightColour(rgb(ATOM))
    o.highlightRadius = .38
    rdMolDraw2D.PrepareAndDrawMolecule(d, m, highlightAtoms=atoms)
    d.FinishDrawing()
    s = d.GetDrawingText()
    return s[s.index(">", s.index("<svg")) + 1: s.rindex("</svg>")]

VW, VH = 700, 300
o = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {VW} {VH}" role="img" '
     f'aria-label="Two near-identical molecules with a 1200-fold difference in binding affinity">']
o.append(f'<text x="18" y="22" font-family="ui-monospace,monospace" font-size="11" fill="{MUTED}">'
         f'CHEMBL234 &#183; dopamine D3, Ki &#183; Tanimoto {sim:.2f}</text>')
for i, (m, atoms, p, lab) in enumerate([(ma, hl["a"], pA, "A"), (mb, hl["b"], pB, "B")]):
    x = 18 + i * 356
    o.append(f'<g transform="translate({x},40)">' + draw(m, atoms) + '</g>')
    col = GREEN if p > 7 else MUTED
    o.append(f'<text x="{x+14}" y="292" font-family="ui-monospace,monospace" font-size="12" fill="{col}">'
             f'pKi {p:.2f}</text>')
    o.append(f'<text x="{x+92}" y="292" font-family="ui-monospace,monospace" font-size="10" fill="{MUTED}">'
             f'{"nanomolar" if p > 7 else "micromolar"}</text>')
o.append(f'<line x1="348" y1="56" x2="348" y2="276" stroke="{LINE}" stroke-width="1"/>')
o.append(f'<text x="{VW-18}" y="22" text-anchor="end" font-family="ui-monospace,monospace" font-size="11" fill="{ATOM}">'
         f'one extra CH2 &#8594; &#916;pKi {pA-pB:.2f} (&#8776;1,200-fold)</text>')
o.append('</svg>')
open("/data1/project/myungjin/site-lab/public/assets/fig/activity-cliff-pair.svg", "w").write("\n".join(o))
print("ok  sim", round(sim, 3), " dpKi", round(pA - pB, 2))
