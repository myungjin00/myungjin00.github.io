"""Square SVG thumbnails for the plot catalogue. Site palette, no titles, no chrome."""
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt, numpy as np, pathlib
import seaborn as sns

OUT = pathlib.Path("/data1/project/myungjin/site-lab/public/assets/plots")
GREEN, BLUE, ATOM, LINE, MUTED = "#1E4A39", "#2E5878", "#C2703C", "#D3D8CE", "#6E7873"
PAL = [GREEN, BLUE, ATOM, "#7E9C8B", "#8FA8BE"]
rng = np.random.default_rng(7)

plt.rcParams.update({
    "figure.figsize": (2.4, 2.4), "figure.dpi": 100, "savefig.transparent": True,
    "font.size": 6, "axes.labelsize": 6, "xtick.labelsize": 5.5, "ytick.labelsize": 5.5,
    "axes.edgecolor": LINE, "axes.linewidth": .7, "axes.labelcolor": MUTED,
    "xtick.color": MUTED, "ytick.color": MUTED, "xtick.major.size": 2, "ytick.major.size": 2,
    "axes.spines.top": False, "axes.spines.right": False, "axes.grid": False,
    "lines.linewidth": 1.3, "patch.linewidth": .6, "legend.frameon": False,
})

def save(name, fig=None):
    (fig or plt.gcf()).savefig(OUT / f"{name}.svg", bbox_inches="tight", pad_inches=0.04)
    plt.close("all")

def ax():
    f, a = plt.subplots(); return f, a

# --- distribution ---
x = rng.normal(0, 1, 400)
f, a = ax(); a.hist(x, bins=18, color=GREEN, alpha=.75, edgecolor="white"); a.set_xticks([]); a.set_yticks([]); save("histogram")
f, a = ax(); sns.kdeplot(x=x, ax=a, color=GREEN, fill=True, alpha=.25); sns.kdeplot(x=rng.normal(1.2,.8,400), ax=a, color=ATOM, fill=True, alpha=.25); a.set_xticks([]); a.set_yticks([]); a.set_xlabel(""); a.set_ylabel(""); save("kde")
d = [rng.normal(m, s, 120) for m, s in [(0,1),(.8,.6),(-.4,1.3)]]
f, a = ax(); bp = a.boxplot(d, patch_artist=True, widths=.55, medianprops=dict(color="white"), flierprops=dict(markersize=2, markeredgecolor=MUTED))
for p, c in zip(bp["boxes"], PAL): p.set_facecolor(c); p.set_alpha(.8); p.set_edgecolor("none")
a.set_xticks([]); a.set_yticks([]); save("boxplot")
f, a = ax(); parts = a.violinplot(d, widths=.8, showextrema=False, showmedians=True)
for p, c in zip(parts["bodies"], PAL): p.set_facecolor(c); p.set_alpha(.7); p.set_edgecolor("none")
parts["cmedians"].set_color("white"); a.set_xticks([]); a.set_yticks([]); save("violin")
f, a = ax()
for i,(dd,c) in enumerate(zip(d, PAL)):
    a.scatter(np.full(len(dd), i) + rng.normal(0,.07,len(dd)), dd, s=3, color=c, alpha=.6, linewidths=0)
a.set_xticks([]); a.set_yticks([]); save("strip")
f, a = ax(); a.ecdf(x, color=GREEN); a.ecdf(rng.normal(1.2,.8,400), color=ATOM); a.set_xticks([]); a.set_yticks([]); save("ecdf")

# --- relationship ---
xx = rng.normal(0,1,160); yy = .7*xx + rng.normal(0,.6,160)
f, a = ax(); a.scatter(xx, yy, s=7, color=BLUE, alpha=.65, linewidths=0); a.set_xticks([]); a.set_yticks([]); save("scatter")
f, a = ax(); a.scatter(xx, yy, s=7, color=BLUE, alpha=.5, linewidths=0)
k = np.polyfit(xx, yy, 1); xs = np.linspace(xx.min(), xx.max(), 50)
a.plot(xs, np.polyval(k, xs), color=ATOM); a.set_xticks([]); a.set_yticks([]); save("regression")
f, a = ax(); a.hexbin(rng.normal(0,1,6000), rng.normal(0,1,6000), gridsize=14, cmap="YlGnBu", linewidths=.2); a.set_xticks([]); a.set_yticks([]); save("hexbin")
t = np.linspace(0, 4*np.pi, 120)
f, a = ax(); a.plot(t, np.sin(t), color=GREEN); a.plot(t, np.sin(t+.8)*.7, color=BLUE); a.fill_between(t, np.sin(t)-.18, np.sin(t)+.18, color=GREEN, alpha=.15, linewidth=0); a.set_xticks([]); a.set_yticks([]); save("line")

# --- comparison ---
f, a = ax(); a.bar(range(5), [4,7,3,6,5], color=PAL, alpha=.85, width=.65); a.set_xticks([]); a.set_yticks([]); save("bar")
f, a = ax(); v=np.array([[3,4,2],[5,2,4],[2,5,3],[4,3,5]])
bot=np.zeros(4)
for j,c in enumerate(PAL[:3]): a.bar(range(4), v[:,j], bottom=bot, color=c, alpha=.85, width=.6); bot+=v[:,j]
a.set_xticks([]); a.set_yticks([]); save("stacked-bar")
f, a = ax(); y=np.arange(6); w=[7,5.5,4.8,3.9,2.6,1.8]
a.barh(y, w, color=GREEN, alpha=.8, height=.6); a.invert_yaxis(); a.set_xticks([]); a.set_yticks([]); save("barh")
f, a = ax(); m=[5.2,4.1,6.0]; e=[.6,.45,.8]
a.errorbar(range(3), m, yerr=e, fmt="o", color=GREEN, ecolor=MUTED, capsize=3, markersize=4)
a.set_xlim(-.6,2.6); a.set_xticks([]); a.set_yticks([]); save("pointrange")

# --- matrix ---
f, a = ax(); a.imshow(rng.random((12,12)), cmap="YlGnBu", aspect="equal"); a.set_xticks([]); a.set_yticks([]); save("heatmap")
g = sns.clustermap(rng.random((14,10)), cmap="YlGnBu", figsize=(2.4,2.4), cbar_pos=None,
                   dendrogram_ratio=.18, xticklabels=False, yticklabels=False, linewidths=0)
g.ax_heatmap.set_xlabel(""); g.ax_heatmap.set_ylabel("")
g.savefig(OUT/"clustermap.svg", bbox_inches="tight", pad_inches=0.04, transparent=True); plt.close("all")
c = np.corrcoef(rng.normal(0,1,(8,60)))
f, a = ax(); a.imshow(c, cmap="RdBu_r", vmin=-1, vmax=1); a.set_xticks([]); a.set_yticks([]); save("corr")

# --- domain ---
lfc = rng.normal(0,1.1,1400); p = -np.log10(np.clip(rng.random(1400)**3, 1e-12, 1))
sig = (np.abs(lfc)>1) & (p>1.3)
f, a = ax(); a.scatter(lfc[~sig], p[~sig], s=3, color="#C9CFCA", linewidths=0)
a.scatter(lfc[sig], p[sig], s=4, color=ATOM, alpha=.8, linewidths=0)
a.set_xlabel("log2FC"); a.set_ylabel("-log10 p"); a.set_xticks([]); a.set_yticks([]); save("volcano")
cen = rng.normal(0,3,(4,2))
pts = np.vstack([c0 + rng.normal(0,.8,(90,2)) for c0 in cen])
lab = np.repeat(range(4), 90)
f, a = ax()
for i,c0 in enumerate(PAL[:4]): a.scatter(*pts[lab==i].T, s=4, color=c0, alpha=.75, linewidths=0)
a.set_xlabel("UMAP1"); a.set_ylabel("UMAP2"); a.set_xticks([]); a.set_yticks([]); save("umap")
f, a = ax()
sizes = rng.random((5,6))*90; col = rng.random((5,6))
for i in range(5):
    a.scatter(range(6), [i]*6, s=sizes[i], c=col[i], cmap="YlGnBu", vmin=0, vmax=1, linewidths=.3, edgecolors="white")
a.set_xticks([]); a.set_yticks([]); a.set_xlim(-.7,5.7); a.set_ylim(-.7,4.7); save("dotplot")
fpr = np.linspace(0,1,100)
f, a = ax(); a.plot(fpr, fpr**.35, color=GREEN); a.plot(fpr, fpr**.6, color=BLUE)
a.plot([0,1],[0,1], color=LINE, linestyle="--", linewidth=.8)
a.set_xlabel("FPR"); a.set_ylabel("TPR"); a.set_xticks([]); a.set_yticks([]); save("roc")
f, a = ax(); cm = np.array([[48,7],[9,36]])
a.imshow(cm, cmap="YlGnBu"); 
for i in range(2):
    for j in range(2): a.text(j,i,cm[i,j],ha="center",va="center",color="white" if cm[i,j]>30 else MUTED, fontsize=7)
a.set_xticks([]); a.set_yticks([]); save("confusion")
f, a = ax(); yt = rng.normal(0,1,120); yp = yt + rng.normal(0,.45,120)
a.scatter(yt, yp, s=6, color=BLUE, alpha=.6, linewidths=0)
lim=[min(yt.min(),yp.min()), max(yt.max(),yp.max())]
a.plot(lim, lim, color=LINE, linestyle="--", linewidth=.8)
a.set_xlabel("true"); a.set_ylabel("pred"); a.set_xticks([]); a.set_yticks([]); a.set_aspect("equal"); save("parity")
print("wrote", len(list(OUT.glob('*.svg'))), "svg")
