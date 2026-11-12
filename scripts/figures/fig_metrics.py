"""Metrics figures, all computed: ROC vs PR under imbalance, and RMSE/MAE/Pearson/Spearman."""
import matplotlib; matplotlib.use("Agg")
import matplotlib.pyplot as plt, numpy as np, pathlib
from sklearn.metrics import roc_curve, precision_recall_curve, roc_auc_score, average_precision_score
from scipy import stats
OUT = pathlib.Path("/data1/project/myungjin/site-lab/public/assets/fig")
G,B,A,L,M = "#1E4A39","#2E5878","#C2703C","#D3D8CE","#6E7873"
plt.rcParams.update({"figure.dpi":100,"savefig.transparent":True,"font.size":8,"axes.labelsize":8,
 "xtick.labelsize":7.5,"ytick.labelsize":7.5,"axes.edgecolor":L,"axes.linewidth":.8,"axes.labelcolor":M,
 "xtick.color":M,"ytick.color":M,"axes.spines.top":False,"axes.spines.right":False,
 "legend.frameon":False,"font.family":["DejaVu Sans"]})
rng = np.random.default_rng(1)

# one classifier of fixed quality; only the positive rate changes
def make(n_neg, n_pos, sep=1.35):
    s_neg = rng.normal(0, 1, n_neg); s_pos = rng.normal(sep, 1, n_pos)
    y = np.r_[np.zeros(n_neg), np.ones(n_pos)]; s = np.r_[s_neg, s_pos]
    return y, s

RATES = [(5000, 5000, "50%"), (5000, 500, "9%"), (5000, 50, "1%")]
COLS = [G, B, A]
fig, (a1, a2, a3) = plt.subplots(1, 3, figsize=(9.2, 2.9))
rows = []
for (nn, np_, lab), c in zip(RATES, COLS):
    y, s = make(nn, np_)
    fpr, tpr, _ = roc_curve(y, s); pr, rc, _ = precision_recall_curve(y, s)
    auc, ap = roc_auc_score(y, s), average_precision_score(y, s)
    acc = ((s > 0.675).astype(int) == y).mean()
    maj = 1 - y.mean()
    a1.plot(fpr, tpr, color=c, linewidth=1.5, label=f"{lab} positive · AUC {auc:.3f}")
    a2.plot(rc, pr, color=c, linewidth=1.5, label=f"{lab} positive · AP {ap:.3f}")
    a2.axhline(y.mean(), color=c, linestyle=":", linewidth=.9)
    rows.append((lab, auc, ap, acc, maj))
a1.plot([0,1],[0,1], color=L, linestyle="--", linewidth=.8)
a1.set_xlabel("false positive rate"); a1.set_ylabel("true positive rate")
a1.set_title("A.  ROC barely moves", fontsize=8, color=M, loc="left", pad=8)
a1.legend(fontsize=6.8, labelcolor=M, loc="lower right")
a2.set_xlabel("recall"); a2.set_ylabel("precision"); a2.set_ylim(-.03, 1.03)
a2.set_title("B.  precision–recall collapses", fontsize=8, color=M, loc="left", pad=8)
a2.legend(fontsize=6.8, labelcolor=M, loc="upper right")
x = np.arange(3); w = .27
a3.bar(x-w, [r[1] for r in rows], w, color=G, alpha=.85, label="ROC-AUC")
a3.bar(x,    [r[2] for r in rows], w, color=A, alpha=.85, label="average precision")
a3.bar(x+w,  [r[4] for r in rows], w, color="#C9CFCA", label="always-predict-negative accuracy")
a3.set_xticks(x); a3.set_xticklabels([r[0] for r in rows]); a3.set_xlabel("positive rate")
a3.set_ylim(0, 1.05); a3.set_title("C.  the three numbers side by side", fontsize=8, color=M, loc="left", pad=8)
a3.legend(fontsize=6.8, labelcolor=M, loc="lower left")
fig.tight_layout(); fig.savefig(OUT/"metrics-imbalance.svg", bbox_inches="tight", pad_inches=.05); plt.close(fig)
for lab, auc, ap, acc, maj in rows:
    print(f"{lab:>4} positive | ROC-AUC {auc:.3f} | AP {ap:.3f} | always-negative accuracy {maj:.3f}")

# regression metrics
fig, (b1, b2) = plt.subplots(1, 2, figsize=(7.0, 2.9))
n = 120
xt = rng.normal(0, 1, n); yp = xt + rng.normal(0, .35, n)
yp2 = yp.copy(); yp2[0] += 6                      # one bad prediction
def rmse(a,b): return float(np.sqrt(((a-b)**2).mean()))
def mae(a,b):  return float(np.abs(a-b).mean())
b1.scatter(xt, yp, s=8, color=B, alpha=.6, linewidths=0)
b1.scatter(xt[0], yp2[0], s=34, color=A, zorder=4, linewidths=0)
lim = [min(xt.min(), yp.min())-.4, max(xt.max(), yp2.max())+.4]
b1.plot(lim, lim, color=L, linestyle="--", linewidth=.8)
b1.set_xlabel("true"); b1.set_ylabel("predicted"); b1.set_aspect("equal")
b1.set_title("A.  one outlier, two metrics", fontsize=8, color=M, loc="left", pad=8)
b1.text(.04, .96, f"without it   RMSE {rmse(xt,yp):.2f}   MAE {mae(xt,yp):.2f}\n"
                  f"with it      RMSE {rmse(xt,yp2):.2f}   MAE {mae(xt,yp2):.2f}",
        transform=b1.transAxes, va="top", fontsize=6.8, color=M, family="monospace")
xs = rng.uniform(0, 1, 160); ys = xs**4 + rng.normal(0, .02, 160)
b2.scatter(xs, ys, s=8, color=G, alpha=.65, linewidths=0)
pr_, sp_ = stats.pearsonr(xs, ys)[0], stats.spearmanr(xs, ys)[0]
b2.set_xlabel("true"); b2.set_ylabel("predicted")
b2.set_title("B.  monotone but not linear", fontsize=8, color=M, loc="left", pad=8)
b2.text(.04, .96, f"Pearson  {pr_:.2f}\nSpearman {sp_:.2f}", transform=b2.transAxes,
        va="top", fontsize=7.2, color=M, family="monospace")
fig.tight_layout(); fig.savefig(OUT/"metrics-regression.svg", bbox_inches="tight", pad_inches=.05); plt.close(fig)
print(f"outlier: RMSE {rmse(xt,yp):.2f} -> {rmse(xt,yp2):.2f} | MAE {mae(xt,yp):.2f} -> {mae(xt,yp2):.2f}")
print(f"monotone nonlinear: Pearson {pr_:.2f} Spearman {sp_:.2f}")
