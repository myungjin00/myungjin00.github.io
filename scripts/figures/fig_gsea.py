"""GSEA running score, ORA vs GSEA on the same ranking, and what a threshold throws away."""
import matplotlib; matplotlib.use("Agg")
import matplotlib.pyplot as plt, numpy as np, pathlib
from scipy import stats
OUT = pathlib.Path("/data1/project/myungjin/site-lab/public/assets/fig")
G,B,A,L,M = "#1E4A39","#2E5878","#C2703C","#D3D8CE","#6E7873"
plt.rcParams.update({"figure.dpi":100,"savefig.transparent":True,"font.size":8,"axes.labelsize":8,
 "xtick.labelsize":7.5,"ytick.labelsize":7.5,"axes.edgecolor":L,"axes.linewidth":.8,"axes.labelcolor":M,
 "xtick.color":M,"ytick.color":M,"axes.spines.top":False,"axes.spines.right":False,
 "legend.frameon":False,"font.family":["DejaVu Sans"]})
rng = np.random.default_rng(4)

N = 3000
stat = np.sort(rng.normal(0, 1, N))[::-1]          # ranked list, high to low
# a set whose members sit preferentially near the top but are not all significant
idx = np.sort(rng.choice(N, 60, replace=False, p=(np.linspace(3, .2, N)/np.linspace(3, .2, N).sum())))
inset = np.zeros(N, bool); inset[idx] = True

def running_es(stat, inset, p=1.0):
    w = np.abs(stat)**p
    nr = w[inset].sum()
    hit = np.where(inset, w/nr, 0.0)
    miss = np.where(inset, 0.0, 1.0/(len(stat)-inset.sum()))
    return np.cumsum(hit - miss)

run = running_es(stat, inset)
es = run[np.argmax(np.abs(run))]
fig, (a1, a2) = plt.subplots(2, 1, figsize=(6.6, 3.4), sharex=True,
                             gridspec_kw=dict(height_ratios=[3, 1], hspace=.08))
a1.plot(run, color=G, linewidth=1.5)
a1.axhline(0, color=L, linewidth=.8)
k = int(np.argmax(np.abs(run)))
a1.plot([k], [es], "o", color=A, markersize=5)
a1.annotate(f"ES = {es:.2f}", (k, es), textcoords="offset points", xytext=(10, -2), fontsize=7.5, color=A)
a1.set_ylabel("running enrichment score")
a1.set_title("walk down the ranked list: +weight on a set member, −step otherwise",
             fontsize=8, color=M, loc="left", pad=8)
a2.vlines(np.where(inset)[0], 0, 1, color=G, linewidth=.8)
a2.set_yticks([]); a2.set_xlabel("genes, ranked by the statistic (high → low)")
a2.set_ylabel("set", rotation=0, labelpad=16, va="center")
for s in ("left","bottom"): a2.spines[s].set_visible(s=="bottom")
fig.savefig(OUT/"gsea-running.svg", bbox_inches="tight", pad_inches=.05); plt.close(fig)
print("ES =", round(float(es),3), "| set size", inset.sum())

# ---- ORA vs GSEA: what the threshold discards ----
fig, (b1, b2) = plt.subplots(1, 2, figsize=(7.4, 2.9))
cut = 1.8
b1.plot(stat, color=M, linewidth=1)
b1.axhline(cut, color=A, linestyle="--", linewidth=1)
b1.axhline(-cut, color=A, linestyle="--", linewidth=1)
sel = np.abs(stat) > cut
b1.fill_between(range(N), -4, 4, where=sel, color=A, alpha=.12, linewidth=0)
b1.scatter(np.where(inset)[0], stat[inset], s=7, color=G, zorder=3, linewidths=0)
b1.set_xlabel("rank"); b1.set_ylabel("statistic")
b1.set_title(f"A.  ORA keeps {sel.sum()} of {N} genes", fontsize=8, color=M, loc="left", pad=8)
b1.text(N*.42, 2.6, "everything between the lines is discarded", fontsize=7.2, color=A)
inboth = (inset & sel).sum()
b2.bar([0,1], [inset.sum(), inboth], width=.5, color=[G, A], alpha=.85)
b2.set_xticks([0,1]); b2.set_xticklabels(["set members\nin the ranking", "...that survive\nthe threshold"])
for i,v in enumerate([inset.sum(), inboth]):
    b2.text(i, v+1, str(v), ha="center", fontsize=8, color=M)
b2.set_ylabel("genes")
b2.set_title("B.  the set is mostly below the cut", fontsize=8, color=M, loc="left", pad=8)
fig.tight_layout(); fig.savefig(OUT/"ora-vs-gsea.svg", bbox_inches="tight", pad_inches=.05); plt.close(fig)
print("ORA keeps", int(sel.sum()), "genes;", int(inboth), "of", int(inset.sum()), "set members survive")
