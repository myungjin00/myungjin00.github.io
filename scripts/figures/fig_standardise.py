"""One salt through Cleanup, FragmentParent and Uncharger, in that order."""
import pathlib
from rdkit import Chem, RDLogger
from rdkit.Chem import AllChem, Descriptors
from rdkit.Chem.Draw import rdMolDraw2D
from rdkit.Chem.MolStandardize import rdMolStandardize
RDLogger.DisableLog("rdApp.*")
OUT = pathlib.Path("/data1/project/myungjin/site-lab/public/assets/fig")
G, B, A, L, M, I, P = "#1E4A39", "#2E5878", "#C2703C", "#D3D8CE", "#6E7873", "#1C2421", "#F7F7F3"
MONO = "ui-monospace,monospace"

# diclofenac sodium, drawn with a covalent Na-O bond, as vendor files often do
SM = "[Na]OC(=O)Cc1ccccc1Nc1c(Cl)cccc1Cl"
m0 = Chem.MolFromSmiles(SM)
m1 = rdMolStandardize.Cleanup(m0)
m2 = rdMolStandardize.FragmentParent(m1)
m3 = rdMolStandardize.Uncharger().uncharge(m2)
STEPS = [("as written in the file", m0, M),
         ("1.  Cleanup", m1, G),
         ("2.  FragmentParent", m2, G),
         ("3.  Uncharger", m3, G)]

def stats(mol):
    f = len(Chem.GetMolFrags(mol))
    q = Chem.GetFormalCharge(mol)
    return (f"{f} fragment{'s' if f > 1 else ''} &#183; net charge "
            f"{'-' if q < 0 else '+' if q > 0 else ''}{abs(q)} &#183; "
            f"MW {Descriptors.MolWt(mol):.1f}")

def draw(mol, w, h):
    mol = Chem.Mol(mol); AllChem.Compute2DCoords(mol)
    d = rdMolDraw2D.MolDraw2DSVG(w, h)
    d.drawOptions().bondLineWidth = 1.3
    d.drawOptions().addStereoAnnotation = False
    rdMolDraw2D.PrepareAndDrawMolecule(d, mol)
    d.FinishDrawing(); s = d.GetDrawingText()
    return s[s.index(">", s.index("<svg")) + 1: s.rindex("</svg>")]

def t(x, y, s, sz=10, fl=M, an="start", w="normal"):
    return f'<text x="{x}" y="{y}" text-anchor="{an}" font-family="{MONO}" font-size="{sz}" fill="{fl}" font-weight="{w}">{s}</text>'

VW, VH, PW, PH = 720, 478, 330, 196
o = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{VW}" height="{VH}" viewBox="0 0 {VW} {VH}" role="img"'
     ' aria-label="Diclofenac sodium after each of the three standardisation calls, in order">',
     '<defs><marker id="ar0" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto">'
     f'<path d="M0 0 L6 3 L0 6 z" fill="{L}"/></marker></defs>']
o.append(t(18, 22, "diclofenac sodium &#183; Cleanup, then FragmentParent, then Uncharger", 11, M))

for k, (lab, mol, col) in enumerate(STEPS):
    px = 18 + (k % 2) * (PW + 24)
    py = 42 + (k // 2) * (PH + 28)
    o.append(f'<rect x="{px}" y="{py}" width="{PW}" height="{PH}" rx="6" fill="#FFFFFF" stroke="{L}" stroke-width="1.2"/>')
    o.append(t(px + 14, py + 22, lab, 11, col, "start", "500"))
    o.append(t(px + 14, py + 38, stats(mol), 9.5, M))
    o.append(f'<g transform="translate({px + 10},{py + 44})">{draw(mol, PW - 20, PH - 54)}</g>')

for k in (0, 1):                                   # left to right inside a row
    y = 42 + k * (PH + 28) + PH / 2
    o.append(f'<line x1="{18 + PW + 2}" y1="{y}" x2="{18 + PW + 20}" y2="{y}" stroke="{L}" stroke-width="1.4" marker-end="url(#ar0)"/>')
XR, YT, YB = 18 + PW + 24 + PW / 2, 42 + PH, 42 + PH + 28   # and round to the next row
o.append(f'<path d="M{XR} {YT} L{XR} {YT + 14} L34 {YT + 14} L34 {YB - 2}" fill="none" stroke="{L}" stroke-width="1.4" marker-end="url(#ar0)"/>')
o.append("</svg>")
(OUT / "standardisation-steps.svg").write_text("\n".join(o) + "\n")
for lab, mol, _ in STEPS:
    print(f"{lab:24s} {Chem.MolToSmiles(mol):50s} frags {len(Chem.GetMolFrags(mol))} "
          f"charge {Chem.GetFormalCharge(mol):+d} MW {Descriptors.MolWt(mol):.1f}")
assert Chem.GetFormalCharge(m2) == -1 and Chem.GetFormalCharge(m3) == 0
assert len(Chem.GetMolFrags(m1)) == 2 and len(Chem.GetMolFrags(m2)) == 1
print("wrote standardisation-steps.svg")
