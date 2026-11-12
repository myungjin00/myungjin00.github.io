"""The five fragmentation schemes, each drawn on the real molecule.

Every panel is a genuine RDKit result, not a sketch: the Murcko scaffold, the BRICS and RECAP
fragments, the functional groups found by SMARTS, and a junction-tree decomposition computed
the way JT-VAE does it. Output is one stitched SVG, so it stays vector at any size.
"""
import pathlib
from rdkit import Chem
from rdkit.Chem import BRICS, Recap, rdDepictor
from rdkit.Chem.Draw import rdMolDraw2D
from rdkit.Chem.Scaffolds import MurckoScaffold

OUT = pathlib.Path("/data1/project/myungjin/site-lab/public/assets/fig")
SM = "Cc1ccc(cc1)S(=O)(=O)Nc1ccc(cc1)C(=O)NCCc1ccccc1"
GREEN, BLUE, ORANGE, MUTED, LINE = "#1E4A39", "#2E5878", "#C2703C", "#6E7873", "#D3D8CE"
FONT = "ui-sans-serif, -apple-system, 'IBM Plex Sans', sans-serif"


def draw(mol, w, h, highlights=None, colours=None):
    """One molecule as an SVG fragment, with the <?xml?> and outer <svg> stripped."""
    rdDepictor.Compute2DCoords(mol)
    d = rdMolDraw2D.MolDraw2DSVG(w, h)
    o = d.drawOptions()
    o.clearBackground = False
    o.bondLineWidth = 1.6
    o.minFontSize = 11
    o.maxFontSize = 15
    o.padding = 0.08
    if highlights:
        rdMolDraw2D.PrepareAndDrawMolecule(
            d, mol, highlightAtoms=highlights,
            highlightAtomColors={a: colours[a] for a in highlights})
    else:
        rdMolDraw2D.PrepareAndDrawMolecule(d, mol)
    d.FinishDrawing()
    svg = d.GetDrawingText()
    return svg[svg.index(">", svg.index("<svg")) + 1: svg.rindex("</svg>")]


def hexrgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))


def junction_tree(mol):
    """The JT-VAE tree decomposition (Jin et al. 2018), not a simplification.

    Cliques are rings and non-ring bonds; rings sharing more than two atoms are merged; an atom
    that sits in three or more cliques (or in two rings) gets its own intersection node. The
    clique graph still has cycles at that point, so the tree is its maximum spanning tree —
    which is the step a naive version skips, and the reason it ends up with more edges than a
    tree can have.
    """
    import networkx as nx
    n = mol.GetNumAtoms()
    cliques = [[b.GetBeginAtomIdx(), b.GetEndAtomIdx()]
               for b in mol.GetBonds() if not b.IsInRing()]
    cliques += [list(r) for r in Chem.GetSymmSSSR(mol)]
    nei = [[] for _ in range(n)]
    for i, c in enumerate(cliques):
        for a in c:
            nei[a].append(i)

    # merge rings that share more than two atoms
    for a in range(n):
        rings = [c for c in nei[a] if len(cliques[c]) > 2]
        for x in range(len(rings)):
            for yy in range(x + 1, len(rings)):
                i, j = rings[x], rings[yy]
                if len(set(cliques[i]) & set(cliques[j])) > 2:
                    cliques[i] = list(set(cliques[i]) | set(cliques[j]))
                    cliques[j] = []
    cliques = [c for c in cliques if c]
    nei = [[] for _ in range(n)]
    for i, c in enumerate(cliques):
        for a in c:
            nei[a].append(i)

    g = nx.Graph()
    g.add_nodes_from(range(len(cliques)))
    extra = []
    for a in range(n):
        cs = nei[a]
        rings = [c for c in cs if len(cliques[c]) > 2]
        if len(cs) <= 1:
            continue
        if len(cs) > 2 or len(rings) > 2:
            cliques.append([a]); k = len(cliques) - 1; extra.append(k)
            g.add_node(k)
            for c in cs:
                g.add_edge(c, k, weight=100)          # intersection edges always survive
        else:
            for x in range(len(cs)):
                for yy in range(x + 1, len(cs)):
                    inter = set(cliques[cs[x]]) & set(cliques[cs[yy]])
                    w = g.get_edge_data(cs[x], cs[yy], {}).get('weight', 0)
                    g.add_edge(cs[x], cs[yy], weight=max(w, len(inter)))
    tree = nx.maximum_spanning_tree(g)
    return cliques, sorted(tuple(sorted(e)) for e in tree.edges()), set(extra)


mol = Chem.MolFromSmiles(SM)
scaffold = MurckoScaffold.GetScaffoldForMol(mol)
brics = [Chem.MolFromSmiles(s) for s in sorted(BRICS.BRICSDecompose(mol))]
recap = [Chem.MolFromSmiles(s) for s in sorted(Recap.RecapDecompose(mol).GetLeaves())]

FG = [("amide", "C(=O)N", GREEN), ("sulfonamide", "S(=O)(=O)N", BLUE), ("benzene", "c1ccccc1", ORANGE)]
hl, col, fg_counts = [], {}, {}
for name, smarts, c in FG:
    hits = mol.GetSubstructMatches(Chem.MolFromSmarts(smarts))
    fg_counts[name] = len(hits)
    for h in hits:
        for a in h:
            if a not in col:
                hl.append(a); col[a] = hexrgb(c)

cliques, jt_edges, inter_nodes = junction_tree(mol)

# ---- layout ----
W, PAD = 940, 26
rows, y = [], PAD


def band(label, detail, height, body):
    global y
    rows.append(
        f'<text x="{PAD}" y="{y + 13}" font-family="{FONT}" font-size="13.5" font-weight="600" '
        f'fill="{GREEN}">{label}</text>'
        f'<text x="{PAD}" y="{y + 31}" font-family="{FONT}" font-size="12" fill="{MUTED}">{detail}</text>')
    rows.append(f'<g transform="translate({PAD},{y + 40})">{body}</g>')
    y += 40 + height + 26
    rows.append(f'<line x1="{PAD}" y1="{y - 14}" x2="{W - PAD}" y2="{y - 14}" stroke="{LINE}" stroke-width="1"/>')


band("the molecule", f"{mol.GetNumAtoms()} heavy atoms · three rings · one amide · one sulfonamide",
     190, draw(mol, W - 2 * PAD, 190))

band("Murcko scaffold", f"1 piece · {scaffold.GetNumAtoms()} of {mol.GetNumAtoms()} atoms — side chains stripped, rings and linkers kept",
     170, draw(scaffold, W - 2 * PAD, 170))

cw = (W - 2 * PAD) // len(brics)
band("BRICS", f"{len(brics)} fragments — cut only at bonds a chemist could re-form; the numbered * records what each cut was",
     150, "".join(f'<g transform="translate({i*cw},0)">{draw(f, cw, 150)}</g>' for i, f in enumerate(brics)))

cw = (W - 2 * PAD) // len(recap)
band("RECAP", f"{len(recap)} fragments — the same instinct, 11 simpler rules, so it cuts less",
     150, "".join(f'<g transform="translate({i*cw},0)">{draw(f, cw, 150)}</g>' for i, f in enumerate(recap)))

band("functional groups",
     " · ".join(f"{k} ×{v}" for k, v in fg_counts.items()) + " — the units a chemist would name",
     185, draw(mol, W - 2 * PAD, 185, hl, col))

# junction tree: nodes laid out around the molecule's own 2D coordinates
rdDepictor.Compute2DCoords(mol)
conf = mol.GetConformer()
pts = [conf.GetAtomPosition(i) for i in range(mol.GetNumAtoms())]
cx = [sum(pts[a].x for a in c) / len(c) for c in cliques]
cy = [sum(pts[a].y for a in c) / len(c) for c in cliques]
mnx, mxx, mny, mxy = min(cx), max(cx), min(cy), max(cy)
TW, TH = W - 2 * PAD, 215
sx = lambda v: 30 + (v - mnx) / (mxx - mnx) * (TW - 60)
sy = lambda v: TH - 28 - (v - mny) / (mxy - mny) * (TH - 56)
g = [f'<line x1="{sx(cx[i]):.1f}" y1="{sy(cy[i]):.1f}" x2="{sx(cx[j]):.1f}" y2="{sy(cy[j]):.1f}" '
     f'stroke="{LINE}" stroke-width="1.6"/>' for i, j in jt_edges]
for i, c in enumerate(cliques):
    ring = len(c) > 2
    joint = i in inter_nodes
    g.append(f'<circle cx="{sx(cx[i]):.1f}" cy="{sy(cy[i]):.1f}" r="{11 if ring else 7}" '
             f'fill="{ORANGE if ring else ("#FFFFFF" if not joint else GREEN)}" stroke="{ORANGE if ring else (MUTED if not joint else GREEN)}" stroke-width="1.6"/>')
# drawn as real circles: a text bullet depends on the viewer having the glyph
LEG = [(ORANGE, ORANGE, 7, "a ring becomes one node"),
       ("#FFFFFF", MUTED, 5, "each non-ring bond becomes one node"),
       (GREEN, GREEN, 5, "an atom shared by three or more of them")]
lx = 30
for _fill, _stroke, _r, _lab in LEG:
    g.append(f'<circle cx="{lx}" cy="{TH-10}" r="{_r}" fill="{_fill}" stroke="{_stroke}" stroke-width="1.6"/>')
    g.append(f'<text x="{lx+_r+7}" y="{TH-6}" font-family="{FONT}" font-size="11.5" fill="{MUTED}">{_lab}</text>')
    lx += _r + 16 + len(_lab) * 6.1
band("junction tree",
     f"{len(cliques)} nodes · {len(jt_edges)} edges — nothing is cut; the molecule is rewritten as a tree",
     TH, "".join(g))

svg = (f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{y}" viewBox="0 0 {W} {y}">'
       + "".join(rows) + "</svg>")
(OUT / "fragmentation.svg").write_text(svg)

print(f"molecule {mol.GetNumAtoms()} atoms | Murcko {scaffold.GetNumAtoms()} | BRICS {len(brics)} | "
      f"RECAP {len(recap)} | FG {fg_counts} | JT {len(cliques)} nodes {len(jt_edges)} edges")
print("wrote", OUT / "fragmentation.svg", f"({W}x{y})")
