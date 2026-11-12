"""Computed figures: overfitting, clustering, seed variance, ECFP collisions, cliff landscape, over-smoothing."""
import matplotlib; matplotlib.use("Agg")
import matplotlib.pyplot as plt, numpy as np, pandas as pd, pathlib
OUT = pathlib.Path("/data1/project/myungjin/site-lab/public/assets/fig")
G,B,A,L,M = "#1E4A39","#2E5878","#C2703C","#D3D8CE","#6E7873"
plt.rcParams.update({"figure.dpi":100,"savefig.transparent":True,"font.size":8,"axes.labelsize":8,
 "xtick.labelsize":7.5,"ytick.labelsize":7.5,"axes.edgecolor":L,"axes.linewidth":.8,"axes.labelcolor":M,
 "xtick.color":M,"ytick.color":M,"axes.spines.top":False,"axes.spines.right":False,
 "legend.frameon":False,"font.family":["DejaVu Sans"]})
rng = np.random.default_rng(0)

# ---------- 1. underfit / good / overfit + the loss curves ----------
from sklearn.preprocessing import PolynomialFeatures
from sklearn.linear_model import LinearRegression
from sklearn.pipeline import make_pipeline
from sklearn.metrics import mean_squared_error
f = lambda x: np.sin(1.6*x) + .3*x
xtr = np.sort(rng.uniform(-3, 3, 22)); ytr = f(xtr) + rng.normal(0, .28, len(xtr))
xte = np.sort(rng.uniform(-3, 3, 200)); yte = f(xte) + rng.normal(0, .28, len(xte))
xs = np.linspace(-3.05, 3.05, 1500)

# 2x2, not 1x4: four panels in a row shrink to ~180px in a 760px column and the labels
# become unreadable. Fonts are set for the size the figure is actually displayed at.
fig, axs = plt.subplots(2, 2, figsize=(7.2, 5.4))
for ax in axs.flat:
    ax.tick_params(labelsize=9)

PANELS = [(1, "underfitting  ·  degree 1", A, (-2.6, 2.6)),
          (5, "about right  ·  degree 5", G, (-2.6, 2.6)),
          (20, "overfitting  ·  degree 20", A, (-4.4, 4.4))]
for ax, (deg, title, col, ylim) in zip(axs.flat, PANELS):
    m = make_pipeline(PolynomialFeatures(deg), LinearRegression()).fit(xtr[:, None], ytr)
    yh = m.predict(xs[:, None])
    inside = np.abs(yh) <= ylim[1]            # break the line where it leaves the frame
    ax.plot(xs, f(xs), color=L, linewidth=1.3, linestyle="--", zorder=1)
    ax.plot(xs, np.where(inside, yh, np.nan), color=col, linewidth=1.9, zorder=2)
    ax.scatter(xtr, ytr, s=20, color=M, zorder=3, linewidths=0)
    if deg == 20:
        for x0 in xs[1:][inside[:-1] & ~inside[1:]]:
            ax.annotate("", xy=(x0, ylim[1]), xytext=(x0, ylim[1]*.74),
                        arrowprops=dict(arrowstyle="-|>", color=col, lw=1.3, shrinkA=0, shrinkB=0))
        ax.set_xlabel("arrows: the curve shoots off the chart", fontsize=8.5, color=M, labelpad=4)
    ax.set_ylim(*ylim); ax.set_xlim(-3.25, 3.25); ax.set_xticks([]); ax.set_yticks([])
    ax.set_title(title, fontsize=10.5, color=M, pad=7)

degs = range(1, 21); tr_e, te_e = [], []
for d in degs:
    m = make_pipeline(PolynomialFeatures(d), LinearRegression()).fit(xtr[:, None], ytr)
    tr_e.append(mean_squared_error(ytr, m.predict(xtr[:, None]))**.5)
    te_e.append(mean_squared_error(yte, m.predict(xte[:, None]))**.5)
ax = axs.flat[3]
ax.plot(degs, tr_e, "o-", color=G, markersize=4, linewidth=1.7, label="training loss")
ax.plot(degs, te_e, "o-", color=A, markersize=4, linewidth=1.7, label="test loss")
best = int(np.argmin(te_e)) + 1
ax.axvline(best, color=M, linestyle="--", linewidth=1, zorder=0)
ax.set_yscale("log")
ax.set_xlabel("model capacity  ·  polynomial degree", fontsize=10)
ax.set_ylabel("RMSE", fontsize=10)
ax.set_xticks([1, 5, 10, 15, 20])
ax.annotate(f"best fit\ndegree {best}", xy=(best, min(te_e)), xytext=(best + 1.2, max(te_e)*.45),
            fontsize=9, color=M, ha="left", va="top",
            arrowprops=dict(arrowstyle="-", color=L, lw=.9))
ax.legend(fontsize=9.5, labelcolor=M, loc="lower left", borderaxespad=.5)
ax.set_title("training vs test error", fontsize=10.5, color=M, pad=7)

fig.tight_layout(); fig.savefig(OUT/"overfitting.svg", bbox_inches="tight", pad_inches=.06); plt.close(fig)
print("overfit: best degree", best, "| train RMSE at deg20", round(tr_e[-1], 3), "| test", round(te_e[-1], 1))

# ---------- 2. clustering ----------
from sklearn.cluster import KMeans, AgglomerativeClustering, DBSCAN
from sklearn.datasets import make_blobs, make_moons
from sklearn.metrics import silhouette_score
Xb, _ = make_blobs(n_samples=420, centers=4, cluster_std=[.9,1.3,.7,1.1], random_state=7)
Xm, _ = make_moons(n_samples=420, noise=.07, random_state=4)
PAL = [G, B, A, "#7E9C8B", "#8FA8BE", "#D9A977"]
fig, axs = plt.subplots(2, 3, figsize=(7.6, 5.0))
def show(ax, X, lab, title):
    for k in np.unique(lab):
        c = "#C9CFCA" if k == -1 else PAL[k % len(PAL)]
        ax.scatter(*X[lab == k].T, s=6, color=c, alpha=.8, linewidths=0)
    ax.set_xticks([]); ax.set_yticks([]); ax.set_title(title, fontsize=8, color=M, pad=5)
show(axs[0,0], Xb, KMeans(4, n_init=10, random_state=0).fit_predict(Xb), "k-means, k = 4")
show(axs[0,1], Xb, AgglomerativeClustering(4).fit_predict(Xb), "hierarchical, 4 clusters")
show(axs[0,2], Xb, DBSCAN(eps=.9, min_samples=8).fit_predict(Xb), "DBSCAN  (grey = noise)")
show(axs[1,0], Xm, KMeans(2, n_init=10, random_state=0).fit_predict(Xm), "k-means on moons &#8212; fails")
show(axs[1,1], Xm, DBSCAN(eps=.22, min_samples=6).fit_predict(Xm), "DBSCAN on moons &#8212; works")
ax = axs[1,2]
ks = range(2, 11); sil = [silhouette_score(Xb, KMeans(k, n_init=10, random_state=0).fit_predict(Xb)) for k in ks]
ax.plot(list(ks), sil, "o-", color=G, markersize=4)
ax.axvline(list(ks)[int(np.argmax(sil))], color=A, linestyle="--", linewidth=1)
ax.set_xlabel("k"); ax.set_ylabel("silhouette"); ax.set_title("choosing k", fontsize=8, color=M, pad=5)
for a0 in axs[1,:2]: a0.set_title(a0.get_title().replace("&#8212;", "—"), fontsize=8, color=M)
fig.tight_layout(); fig.savefig(OUT/"clustering.svg", bbox_inches="tight", pad_inches=.05); plt.close(fig)
print("clustering: best k by silhouette =", list(ks)[int(np.argmax(sil))], "| sil", [round(v,3) for v in sil])

# ---------- 3. resolution sensitivity ----------
fig, axs = plt.subplots(1, 4, figsize=(9.0, 2.4))
for ax, k in zip(axs, [2, 4, 7, 11]):
    show(ax, Xb, KMeans(k, n_init=10, random_state=0).fit_predict(Xb), f"k = {k}")
fig.tight_layout(); fig.savefig(OUT/"clustering-k.svg", bbox_inches="tight", pad_inches=.05); plt.close(fig)
print("wrote clustering-k")
