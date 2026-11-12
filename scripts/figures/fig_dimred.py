"""PCA vs t-SNE vs UMAP on the digits dataset: who keeps distances, who keeps neighbourhoods."""
import matplotlib; matplotlib.use("Agg")
import matplotlib.pyplot as plt, numpy as np, pathlib
from scipy.spatial.distance import pdist
from scipy.stats import spearmanr
from sklearn.datasets import load_digits
from sklearn.decomposition import PCA
from sklearn.manifold import TSNE, trustworthiness
from sklearn.neighbors import KNeighborsClassifier
from sklearn.model_selection import cross_val_score
import umap

OUT = pathlib.Path("/data1/project/myungjin/site-lab/public/assets/fig")
G, B, A, L, M, S = "#1E4A39", "#2E5878", "#C2703C", "#D3D8CE", "#6E7873", "#7E9C8B"
plt.rcParams.update({"figure.dpi":100,"savefig.transparent":True,"font.size":10,"axes.labelsize":10,
 "xtick.labelsize":9.5,"ytick.labelsize":9.5,"axes.edgecolor":L,"axes.linewidth":.8,"axes.labelcolor":M,
 "xtick.color":M,"ytick.color":M,"axes.spines.top":False,"axes.spines.right":False,
 "legend.frameon":False,"font.family":["DejaVu Sans"]})
SEED = 0

X, y = load_digits(return_X_y=True)            # 1,797 handwritten digits, 64 pixels each
emb = {"PCA": PCA(2, random_state=SEED).fit_transform(X),
       "t-SNE": TSNE(2, perplexity=30, init="pca", random_state=SEED).fit_transform(X),
       "UMAP": umap.UMAP(n_neighbors=15, min_dist=0.5, random_state=SEED).fit_transform(X)}

# three things the same embedding can be scored on, against the 64-D original:
#   global  — do all 1.6M pairwise distances keep their order (Spearman)
#   local   — trustworthiness, how much of each 12-neighbourhood survives
#   label   — can a 10-NN classifier read the digit off the two coordinates
d64 = pdist(X)
stat = {}
for k, Z in emb.items():
    stat[k] = (spearmanr(d64, pdist(Z)).statistic,
               trustworthiness(X, Z, n_neighbors=12),
               cross_val_score(KNeighborsClassifier(10), Z, y, cv=5).mean())
    print(f"{k:6s} pairwise-distance rho {stat[k][0]:.3f} | trustworthiness {stat[k][1]:.3f} | "
          f"10-NN accuracy {stat[k][2]:.3f}")
print("64-D baseline 10-NN accuracy",
      round(cross_val_score(KNeighborsClassifier(10), X, y, cv=5).mean(), 3))

fig, axs = plt.subplots(2, 2, figsize=(7.2, 6.3))
for ax, (k, Z) in zip(axs.flat, emb.items()):
    ax.scatter(*Z.T, c=y, cmap=plt.get_cmap("tab10"), s=5, alpha=.85, linewidths=0)
    for c in range(10):                        # label each digit group where it actually sits
        cx, cy = Z[y == c].mean(0)
        ax.text(cx, cy, str(c), fontsize=9.5, color="black", ha="center", va="center",
                bbox=dict(boxstyle="circle,pad=.1", fc="white", ec="none", alpha=.75))
    lo, hi = np.percentile(Z, [.4, 99.6], axis=0)      # crop a handful of stragglers
    pad = (hi - lo) * .07
    ax.set_xlim(lo[0] - pad[0], hi[0] + pad[0]); ax.set_ylim(lo[1] - pad[1], hi[1] + pad[1])
    ax.set_xticks([]); ax.set_yticks([])
    ax.set_title(k, fontsize=10.5, color=M, pad=7)

ax = axs.flat[3]
names, w = list(emb), .26
xs = np.arange(len(names))
BARS = [(0, "global  ·  pairwise-distance " + r"$\rho$", A),
        (1, "local  ·  trustworthiness", G),
        (2, "digit readable  ·  10-NN", S)]
for j, label, col in BARS:
    v = [stat[k][j] for k in names]
    ax.bar(xs + (j - 1) * w, v, w, color=col, label=label)
    for i, vi in enumerate(v):
        ax.text(i + (j - 1) * w, vi + .02, f"{vi:.2f}", ha="center", fontsize=8.6, color=M)
ax.set_xticks(xs); ax.set_xticklabels(names); ax.set_ylim(0, 1.12)
ax.set_ylabel("score vs the 64-D original")
ax.legend(fontsize=8.6, labelcolor=M, loc="upper center", bbox_to_anchor=(.5, -.09),
          ncol=1, handlelength=1.4, borderaxespad=0)
ax.set_title("what each one preserves", fontsize=10.5, color=M, pad=7)

fig.tight_layout(); fig.savefig(OUT/"dimred-digits.svg", bbox_inches="tight", pad_inches=.06)
plt.close(fig)
# the two claims the caption makes, checked rather than asserted
assert stat["PCA"][0] == max(s[0] for s in stat.values())          # only PCA keeps distance
assert min(stat["t-SNE"][1], stat["UMAP"][1]) > stat["PCA"][1]     # they win locally
print("wrote dimred-digits.svg")
