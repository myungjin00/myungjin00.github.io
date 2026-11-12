import matplotlib; matplotlib.use("Agg")
import matplotlib.pyplot as plt, numpy as np, pathlib, seaborn as sns
import networkx as nx
from matplotlib_venn import venn3

OUT = pathlib.Path("/data1/project/myungjin/site-lab/public/assets/plots")
GREEN, BLUE, ATOM, LINE, MUTED = "#1E4A39", "#2E5878", "#C2703C", "#D3D8CE", "#6E7873"
PAL = [GREEN, BLUE, ATOM, "#7E9C8B", "#8FA8BE", "#D9A977"]
rng = np.random.default_rng(11)
plt.rcParams.update({
    "figure.figsize": (2.4, 2.4), "figure.dpi": 100, "savefig.transparent": True,
    "font.size": 6, "axes.labelsize": 6, "xtick.labelsize": 5.5, "ytick.labelsize": 5.5,
    "axes.edgecolor": LINE, "axes.linewidth": .7, "axes.labelcolor": MUTED,
    "xtick.color": MUTED, "ytick.color": MUTED, "xtick.major.size": 2, "ytick.major.size": 2,
    "axes.spines.top": False, "axes.spines.right": False, "axes.grid": False,
    "lines.linewidth": 1.3, "patch.linewidth": .6, "legend.frameon": False})
def save(n, fig=None):
    (fig or plt.gcf()).savefig(OUT/f"{n}.svg", bbox_inches="tight", pad_inches=.04); plt.close("all")
def ax(): return plt.subplots()

# --- one variable ---
f,a=ax()
for i,(m,c) in enumerate(zip([0,.9,1.8,2.6],PAL)):
    d=rng.normal(m,.55,500); xs=np.linspace(-2,5,200)
    from scipy.stats import gaussian_kde
    y=gaussian_kde(d)(xs); a.fill_between(xs, -i*.9, y*1.1-i*.9, color=c, alpha=.75, linewidth=.6, edgecolor="white")
a.set_xticks([]); a.set_yticks([]); a.spines['left'].set_visible(False); save("ridgeline")
f,a=ax()
from scipy import stats
q=rng.normal(0,1,200); stats.probplot(q, dist="norm", plot=a)
a.get_lines()[0].set(marker='o', markersize=2.4, color=BLUE, linestyle='none')
a.get_lines()[1].set(color=ATOM, linewidth=1)
a.set_title(""); a.set_xlabel("theoretical"); a.set_ylabel("sample"); a.set_xticks([]); a.set_yticks([]); save("qq")

# --- two variables ---
x=rng.normal(0,1,300); y=.6*x+rng.normal(0,.7,300)
g=sns.jointplot(x=x,y=y,height=2.4,ratio=4,space=.1,color=BLUE,marginal_kws=dict(bins=20))
g.ax_joint.set_xticks([]); g.ax_joint.set_yticks([]); g.ax_joint.set_xlabel(""); g.ax_joint.set_ylabel("")
g.savefig(OUT/"jointplot.svg", bbox_inches="tight", pad_inches=.04, transparent=True); plt.close("all")
import pandas as pd
df=pd.DataFrame(rng.normal(0,1,(120,3))@np.array([[1,.6,.2],[0,.8,.5],[0,0,.9]]), columns=list("abc"))
g=sns.pairplot(df, height=.8, plot_kws=dict(s=4, color=BLUE, linewidth=0, alpha=.6), diag_kws=dict(color=GREEN))
for a0 in g.axes.flat: a0.set_xticks([]); a0.set_yticks([]); a0.set_xlabel(""); a0.set_ylabel("")
g.savefig(OUT/"pairplot.svg", bbox_inches="tight", pad_inches=.04, transparent=True); plt.close("all")
f,a=ax()
xs,ys=np.mgrid[-3:3:60j,-3:3:60j]
z=np.exp(-(xs**2+ys**2)/2)+.6*np.exp(-((xs-1.5)**2+(ys+1)**2)/.6)
a.contourf(xs,ys,z,levels=7,cmap="YlGnBu"); a.contour(xs,ys,z,levels=7,colors="white",linewidths=.4)
a.set_xticks([]); a.set_yticks([]); save("contour")
f,a=ax()
a.scatter(rng.normal(0,1,60), rng.normal(0,1,60), s=rng.random(60)*160+8, c=PAL[1], alpha=.45, linewidths=.5, edgecolors="white")
a.set_xticks([]); a.set_yticks([]); save("bubble")
f,a=ax(); yp=.7*x+rng.normal(0,.6,300)
a.scatter(yp, y-yp, s=5, color=BLUE, alpha=.55, linewidths=0); a.axhline(0, color=ATOM, linewidth=1)
a.set_xlabel("fitted"); a.set_ylabel("residual"); a.set_xticks([]); a.set_yticks([]); save("residual")

# --- comparison ---
f,a=ax(); a.pie([38,27,18,17], colors=PAL[:4], wedgeprops=dict(edgecolor="white", linewidth=1.2)); save("pie")
f,a=ax(); a.pie([38,27,18,17], colors=PAL[:4], wedgeprops=dict(width=.42, edgecolor="white", linewidth=1.2)); save("donut")
f,a=ax(); v=[7,5.6,4.4,3.5,2.3]
a.hlines(range(5), 0, v, color=LINE, linewidth=1.2); a.plot(v, range(5), "o", color=GREEN, markersize=5)
a.invert_yaxis(); a.set_xticks([]); a.set_yticks([]); save("lollipop")
f,a=ax()
for i,c in enumerate(PAL[:4]): a.plot([0,1],[rng.random()*4+1, rng.random()*4+1], "-o", color=c, markersize=4)
a.set_xlim(-.25,1.25); a.set_xticks([0,1]); a.set_xticklabels(["before","after"]); a.set_yticks([]); save("slope")
f,a=ax(); idx=np.arange(4); w=.26
for j,c in enumerate(PAL[:3]): a.bar(idx+j*w, rng.random(4)*5+2, width=w, color=c, alpha=.85)
a.set_xticks([]); a.set_yticks([]); save("grouped-bar")
f,a=ax(); t=np.arange(20); base=np.zeros(20)
for c in PAL[:3]:
    vals=np.abs(rng.normal(2,.5,20)).cumsum()/6
    a.fill_between(t, base, base+vals, color=c, alpha=.8, linewidth=0); base=base+vals
a.set_xticks([]); a.set_yticks([]); save("area")
f,a=ax(); m=[4.2,3.1,2.4,1.9,1.2]; lo=[.5,.4,.6,.3,.35]
a.hlines(range(5), np.array(m)-lo, np.array(m)+lo, color=MUTED, linewidth=1)
a.plot(m, range(5), "s", color=GREEN, markersize=4); a.axvline(1, color=LINE, linestyle="--", linewidth=.8)
a.invert_yaxis(); a.set_xticks([]); a.set_yticks([]); save("forest")
f,a=ax(); venn3(subsets=(28,22,9,19,7,6,4), set_colors=(GREEN,BLUE,ATOM), alpha=.45, ax=a)
for t0 in a.texts: t0.set_fontsize(5.5); t0.set_color(MUTED)
a.set_xticks([]); a.set_yticks([]); a.axis("off"); save("venn")

# --- matrix ---
f,a=ax(); M=rng.random((6,6))
im=a.imshow(M, cmap="YlGnBu")
for i in range(6):
    for j in range(6): a.text(j,i,f"{M[i,j]:.1f}",ha="center",va="center",fontsize=4.2,color="white" if M[i,j]>.55 else MUTED)
a.set_xticks([]); a.set_yticks([]); save("annotated-heatmap")
f,a=ax(); a.hist2d(rng.normal(0,1,8000), rng.normal(0,1,8000), bins=18, cmap="YlGnBu"); a.set_xticks([]); a.set_yticks([]); save("hist2d")

# --- domain ---
f,a=ax(); base=rng.lognormal(4,1.3,1200); lfc=rng.normal(0,.9,1200)
sig=np.abs(lfc)>1.6
a.scatter(np.log10(base[~sig]), lfc[~sig], s=3, color="#C9CFCA", linewidths=0)
a.scatter(np.log10(base[sig]), lfc[sig], s=4, color=ATOM, alpha=.8, linewidths=0)
a.axhline(0, color=LINE, linewidth=.8); a.set_xlabel("log mean"); a.set_ylabel("log2FC"); a.set_xticks([]); a.set_yticks([]); save("ma")
f,a=ax(); chrom=np.repeat(np.arange(10), 160); p=-np.log10(rng.random(1600))
hit=rng.choice(1600, 14, replace=False); p[hit]+=rng.random(14)*5+3
for c in range(10):
    m0=chrom==c; a.scatter(np.where(m0)[0], p[m0], s=2.2, color=GREEN if c%2 else BLUE, linewidths=0, alpha=.75)
a.axhline(7.3, color=ATOM, linestyle="--", linewidth=.8); a.set_ylabel("-log10 p"); a.set_xticks([]); a.set_yticks([]); save("manhattan")
f,a=ax(); t=np.linspace(0,60,120)
for c,r in zip([GREEN,ATOM],[.025,.045]):
    s=np.exp(-r*t); a.step(t,s,color=c,where="post"); a.fill_between(t,s-.05,s+.05,step="post",color=c,alpha=.12,linewidth=0)
a.set_xlabel("months"); a.set_ylabel("survival"); a.set_xticks([]); a.set_yticks([]); save("km")
f,a=ax(); n=np.arange(50,1000,50); tr=1-.4*np.exp(-n/300); va=1-.75*np.exp(-n/300)
a.plot(n,tr,color=GREEN); a.plot(n,va,color=ATOM)
a.fill_between(n,tr-.03,tr+.03,color=GREEN,alpha=.15,linewidth=0); a.fill_between(n,va-.05,va+.05,color=ATOM,alpha=.15,linewidth=0)
a.set_xlabel("training size"); a.set_ylabel("score"); a.set_xticks([]); a.set_yticks([]); save("learning-curve")
f,a=ax(); pb=np.linspace(.02,.98,12)
a.plot([0,1],[0,1],color=LINE,linestyle="--",linewidth=.8)
a.plot(pb, pb**1.5, "o-", color=GREEN, markersize=3); a.plot(pb, pb**.7, "o-", color=BLUE, markersize=3)
a.set_xlabel("predicted"); a.set_ylabel("observed"); a.set_xticks([]); a.set_yticks([]); a.set_aspect("equal"); save("calibration")
f,a=ax(); ev=np.sort(rng.random(10))[::-1]*40; ev=ev/ev.sum()*100
a.bar(range(10), ev, color=GREEN, alpha=.8, width=.6); a.plot(range(10), np.cumsum(ev), "o-", color=ATOM, markersize=3)
a.set_xlabel("component"); a.set_ylabel("% variance"); a.set_xticks([]); a.set_yticks([]); save("scree")
f,a=ax(); terms=6; es=np.sort(rng.random(terms))*4+1; sz=rng.random(terms)*110+25
sc=a.scatter(es, range(terms), s=sz, c=rng.random(terms), cmap="YlGnBu", linewidths=.4, edgecolors="white")
a.invert_yaxis(); a.set_xlabel("fold enrichment"); a.set_xticks([]); a.set_yticks([]); save("enrichment-dot")
f,a=ax(); G=nx.random_geometric_graph(42, .32, seed=4)
pos=nx.spring_layout(G, seed=3)
nx.draw_networkx_edges(G,pos,ax=a,edge_color=LINE,width=.7)
deg=np.array([d for _,d in G.degree()])
nx.draw_networkx_nodes(G,pos,ax=a,node_size=deg*7+8,node_color=deg,cmap="YlGnBu",linewidths=.4,edgecolors="white")
a.set_xticks([]); a.set_yticks([]); a.axis("off"); save("network")
print("total", len(list(OUT.glob('*.svg'))))
