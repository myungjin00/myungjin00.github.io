"""A real scaled-dot-product attention matrix, and the two block diagrams."""
import matplotlib; matplotlib.use("Agg")
import matplotlib.pyplot as plt, numpy as np, torch, torch.nn.functional as F, pathlib
OUT = pathlib.Path("/data1/project/myungjin/site-lab/public/assets/fig")
G,B,A,L,M,I,P = "#1E4A39","#2E5878","#C2703C","#D3D8CE","#6E7873","#1C2421","#F7F7F3"
plt.rcParams.update({"figure.dpi":100,"savefig.transparent":True,"font.size":8,"axes.labelsize":8,
 "xtick.labelsize":7.5,"ytick.labelsize":7.5,"axes.edgecolor":L,"axes.linewidth":.8,"axes.labelcolor":M,
 "xtick.color":M,"ytick.color":M,"axes.spines.top":False,"axes.spines.right":False,
 "legend.frameon":False,"font.family":["DejaVu Sans"]})
torch.manual_seed(5)

# a tiny toy "molecule" read as a set of atoms; the query is each atom in turn
ATOMS = ["C1","C2","O","N","C3","C4","F","C5"]
n, d = len(ATOMS), 16
x = torch.randn(n, d)
# make two atoms genuinely related so the pattern is not pure noise
x[2] = x[3]*0.8 + torch.randn(d)*0.2         # O resembles N
x[6] = x[2]*0.7 + torch.randn(d)*0.3         # F resembles O
Wq, Wk, Wv = (torch.randn(d, d)/d**.5 for _ in range(3))
Q, K, V = x@Wq, x@Wk, x@Wv
scores = Q@K.T / d**.5
Aw = F.softmax(scores, dim=-1)
print("row sums (softmax):", [round(v,3) for v in Aw.sum(-1).tolist()])

fig, (a1, a2) = plt.subplots(1, 2, figsize=(7.6, 3.2), gridspec_kw=dict(width_ratios=[1, 1]))
im = a1.imshow(scores.detach().numpy(), cmap="RdBu_r",
               vmin=-abs(scores).max(), vmax=abs(scores).max())
a1.set_xticks(range(n), ATOMS); a1.set_yticks(range(n), ATOMS)
a1.set_xlabel("key  (what each position offers)"); a1.set_ylabel("query  (who is asking)")
a1.set_title("A.  raw scores  QK&#7444;/&#8730;d", fontsize=8, color=M, loc="left", pad=8)
plt.colorbar(im, ax=a1, fraction=.046, pad=.03).ax.tick_params(labelsize=6, color=M)
im2 = a2.imshow(Aw.detach().numpy(), cmap="YlGnBu", vmin=0)
a2.set_xticks(range(n), ATOMS); a2.set_yticks(range(n), ATOMS)
a2.set_xlabel("key"); a2.set_title("B.  after softmax &#8212; each row sums to 1", fontsize=8, color=M, loc="left", pad=8)
plt.colorbar(im2, ax=a2, fraction=.046, pad=.03).ax.tick_params(labelsize=6, color=M)
for a0 in (a1, a2):
    a0.set_title(a0.get_title().replace("&#7444;","ᵀ").replace("&#8730;","√").replace("&#8212;","—"),
                 fontsize=8, color=M, loc="left", pad=8)
fig.tight_layout(); fig.savefig(OUT/"attention-matrix.svg", bbox_inches="tight", pad_inches=.05); plt.close(fig)

# --- SVG: self vs cross attention, and the transformer block ---
MONO="ui-monospace,monospace"
def t(x,y,s,sz=10,fl=M,an="start",w="normal"):
    return f'<text x="{x}" y="{y}" text-anchor="{an}" font-family="{MONO}" font-size="{sz}" fill="{fl}" font-weight="{w}">{s}</text>'
def box(x,y,w,h,st=L,fi="#FFFFFF",r=5,sw=1.4,dash=None):
    d=f' stroke-dasharray="{dash}"' if dash else ""
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{fi}" stroke="{st}" stroke-width="{sw}"{d}/>'
def arr(x1,y1,x2,y2,c=L,sw=1.3,m="ar0"):
    return f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{c}" stroke-width="{sw}" marker-end="url(#{m})"/>'
def defs(*cols):
    o=['<defs>']
    for i,c in enumerate(cols):
        o.append(f'<marker id="ar{i}" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6 z" fill="{c}"/></marker>')
    o.append('</defs>'); return o
def svg(name,w,h,body):
    (OUT/f"{name}.svg").write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" role="img" aria-label="{name}">\n'+"\n".join(body)+"\n</svg>\n")
    print("wrote",name)

# self vs cross
b = defs(L,G,A,B)
b += [t(18,22,"self-attention &#8212; one set looks at itself",11,G),
      t(360,22,"cross-attention &#8212; one view queries another",11,A)]
for k,(lab,x0,col) in enumerate([("atom view",40,G)]):
    pass
# left: one row of tokens, arrows among them
XS=[60,118,176,234]
for x in XS:
    b += [box(x-22,56,44,30,st=G), t(x,76,"atom",9,I,"middle")]
for i,x in enumerate(XS):
    for j,y in enumerate(XS):
        if i==j: continue
        b.append(f'<path d="M{x} {56} C{x} {26} {y} {26} {y} {56}" fill="none" stroke="{G}" stroke-width="1" opacity=".35"/>')
b += [t(60,112,"Q, K, V all come from the same set",10,M)]
# right: two rows, arrows between
for x in XS:
    b += [box(x+330,46,44,28,st=A), t(x+352,65,"atom",9,I,"middle")]
for x in XS[:3]:
    b += [box(x+345,104,52,28,st=B), t(x+371,123,"JT node",8,I,"middle")]
for x in XS:
    for y in XS[:3]:
        b.append(f'<line x1="{x+352}" y1="{74}" x2="{y+371}" y2="{104}" stroke="{A}" stroke-width=".9" opacity=".3"/>')
b += [t(360,152,"Q from one view, K and V from the other",10,M),
      t(360,170,"this is the operation SJoINT is built on",10,A)]
svg("attention-self-cross",660,186,b)

# transformer block with FFN
b = defs(L,G,A,B)
b += [t(18,22,"one transformer block &#8212; attention is only half of it",11,M)]
Y=[52,108,164,220]
LBL=[("multi-head attention",G,"each head learns a different relation"),
     ("add &amp; norm",L,"residual + layer norm"),
     ("feed-forward network (FFN)",A,"per position: Linear &#8594; GELU &#8594; Linear, usually 4&#215; wider"),
     ("add &amp; norm",L,"residual + layer norm")]
for y,(lab,col,note) in zip(Y,LBL):
    b += [box(60,y,260,38,st=col,fi=P if col!=L else "#FFFFFF"),
          t(190,y+23,lab,10.5,I,"middle","500"),
          t(336,y+23,note,9.5,M)]
for a_,b_ in zip(Y[:-1],Y[1:]):
    b.append(arr(190,a_+38,190,b_-2,L))
b += [arr(190,274,190,240+4,L)] if False else []
b += [t(60,284,"in:  one vector per position",10,M),
      arr(190,38,190,50,L), t(190,34,"",9,M),
      t(60,302,"out: one vector per position, same shape &#8212; so you can stack it",10,M)]
b += [t(400,100,"attention mixes across positions",10,G),
      t(400,118,"the FFN transforms each position on its own",10,A),
      t(400,136,"one does the talking, the other does the thinking",10,M)]
svg("transformer-block",660,318,b)
