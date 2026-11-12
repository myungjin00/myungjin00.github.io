GREEN, BLUE, ATOM, LINE, MUTED, INK = "#1E4A39", "#2E5878", "#C2703C", "#D3D8CE", "#6E7873", "#1C2421"
W, H = 680, 300
N = {  # id: (x, y, label, kind)
 'd1': (90, 92,  'metformin', 'drug'),
 'd2': (90, 212, 'drug B',    'drug'),
 'p1': (268, 56, 'AMPK',      'prot'),
 'p2': (268, 158,'PRKAB1',    'prot'),
 'p3': (268, 252,'target C',  'prot'),
 's1': (452, 252,'lactic acidosis', 'side'),
 'x1': (470, 56, 'type 2 diabetes', 'dis'),
 'x2': (470, 158,'PCOS',      'dis'),
}
COL = {'drug': ATOM, 'prot': GREEN, 'dis': BLUE, 'side': MUTED}
E = [('d1','p1','inhibits'), ('d1','p2','binds'), ('p1','x1','associated'),
     ('p2','x2','associated'), ('d2','p2','inhibits'), ('d2','p3','binds'),
     ('p3','x2','associated'), ('d1','s1','causes'), ('d1','x1','indicated_for')]
PRED = ('d1','x2')     # the edge the model is asked about

o = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" role="img" aria-label="A biomedical knowledge graph with one missing drug-disease edge">']
o.append(f'<text x="24" y="24" font-family="ui-monospace,monospace" font-size="11" fill="{MUTED}">a slice of a biomedical knowledge graph</text>')

def box(k):
    x, y, lab, kind = N[k]
    w = max(58, len(lab) * 5.6 + 18)
    return x - w/2, y - 13, w, 26

def edge(a, b, lab, dashed=False, col=None, arc=0):
    (xa, ya, _, _), (xb, yb, _, _) = N[a], N[b]
    wa = box(a)[2]/2; wb = box(b)[2]/2
    x1, x2 = (xa + wa, xb - wb) if xb > xa else (xa - wa, xb + wb)
    c = col or LINE
    dash = ' stroke-dasharray="5 4"' if dashed else ''
    sw = 1.8 if dashed else 1.2
    if arc:
        cxp, cyp = (x1+x2)/2, (ya+yb)/2 + arc
        o.append(f'<path d="M{x1:.0f} {ya} Q{cxp:.0f} {cyp:.0f} {x2:.0f} {yb}" fill="none" stroke="{c}" stroke-width="{sw}"{dash}/>')
        mx, my = cxp, (ya+yb)/2 + arc/2        # on the curve, roughly
    else:
        o.append(f'<line x1="{x1:.0f}" y1="{ya}" x2="{x2:.0f}" y2="{yb}" stroke="{c}" stroke-width="{sw}"{dash}/>')
        mx, my = (x1+x2)/2, (ya+yb)/2
    o.append(f'<text x="{mx:.0f}" y="{my-5:.0f}" text-anchor="middle" font-family="ui-monospace,monospace" '
             f'font-size="8.5" fill="{c if dashed else MUTED}">{lab}</text>')

ARC = {('d1','x1'): -52, ('d1','s1'): 58}
for a, b, lab in E:
    edge(a, b, lab, arc=ARC.get((a, b), 0))
edge(PRED[0], PRED[1], 'indicated_for ?', dashed=True, col=ATOM, arc=34)

for k in N:
    x, y, lab, kind = N[k]
    bx, by, bw, bh = box(k)
    c = COL[kind]
    o.append(f'<rect x="{bx:.0f}" y="{by:.0f}" width="{bw:.0f}" height="{bh:.0f}" rx="13" '
             f'fill="#FFFFFF" stroke="{c}" stroke-width="1.6"/>')
    o.append(f'<text x="{x}" y="{y+3.4}" text-anchor="middle" font-family="ui-monospace,monospace" font-size="9" fill="{INK}">{lab}</text>')

# legend
lx = 24
for kind, lab in [('drug','drug'), ('prot','protein / gene'), ('dis','disease'), ('side','side effect')]:
    o.append(f'<circle cx="{lx+5}" cy="284" r="4.5" fill="#FFFFFF" stroke="{COL[kind]}" stroke-width="1.6"/>')
    o.append(f'<text x="{lx+15}" y="287" font-family="ui-monospace,monospace" font-size="9" fill="{MUTED}">{lab}</text>')
    lx += len(lab) * 5.6 + 34
o.append(f'<line x1="{lx+2}" y1="284" x2="{lx+24}" y2="284" stroke="{ATOM}" stroke-width="1.8" stroke-dasharray="5 4"/>')
o.append(f'<text x="{lx+30}" y="287" font-family="ui-monospace,monospace" font-size="9" fill="{ATOM}">the edge the model is asked to score</text>')
o.append('</svg>')
open("/data1/project/myungjin/site-lab/public/assets/fig/knowledge-graph.svg","w").write("\n".join(o))
print("ok")
