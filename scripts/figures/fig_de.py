"""Mean-variance and dispersion shrinkage, simulated the way RNA-seq counts actually behave."""
import matplotlib; matplotlib.use("Agg")
import matplotlib.pyplot as plt, numpy as np, pathlib
OUT = pathlib.Path("/data1/project/myungjin/site-lab/public/assets/fig")
GREEN, BLUE, ATOM, LINE, MUTED = "#1E4A39", "#2E5878", "#C2703C", "#D3D8CE", "#6E7873"
plt.rcParams.update({"figure.dpi":100,"savefig.transparent":True,"font.size":8,"axes.labelsize":8,
    "xtick.labelsize":7.5,"ytick.labelsize":7.5,"axes.edgecolor":LINE,"axes.linewidth":.8,
    "axes.labelcolor":MUTED,"xtick.color":MUTED,"ytick.color":MUTED,"axes.spines.top":False,
    "axes.spines.right":False,"legend.frameon":False,"font.family":["DejaVu Sans"]})
rng = np.random.default_rng(3)

G, R = 4000, 3                       # genes, replicates per condition
mu = 10**rng.uniform(0, 3.6, G)      # a realistic spread of expression levels
alpha_true = 0.02 + 8/mu             # dispersion falls with expression, as DESeq2 models it
# negative binomial: var = mu + alpha*mu^2
p = 1/(1 + alpha_true*mu); r = 1/alpha_true
nb = rng.negative_binomial(r[:, None], p[:, None], size=(G, R))
po = rng.poisson(mu[:, None], size=(G, R))

fig, (a1, a2) = plt.subplots(1, 2, figsize=(7.4, 3.1))

# --- panel A: mean vs variance ---
for data, col, lab in [(po, BLUE, "Poisson — counting noise only"),
                       (nb, ATOM, "observed RNA-seq (negative binomial)")]:
    m = data.mean(1); v = data.var(1, ddof=1)
    ok = (m > 0) & (v > 0)
    a1.scatter(m[ok], v[ok], s=2.5, color=col, alpha=.3, linewidths=0, label=lab)
xs = np.logspace(0, 3.6, 50)
a1.plot(xs, xs, color=MUTED, linestyle="--", linewidth=1)
a1.text(60, 42, "variance = mean", fontsize=7.5, color=MUTED, rotation=31)
a1.set_xscale("log"); a1.set_yscale("log")
a1.set_xlabel("mean count"); a1.set_ylabel("variance across replicates")
a1.legend(fontsize=7, labelcolor=MUTED, loc="upper left")
a1.set_title("A.  variance grows faster than the mean", fontsize=8, color=MUTED, loc="left", pad=8)

# --- panel B: dispersion shrinkage ---
m = nb.mean(1); v = nb.var(1, ddof=1)
ok = m > 2
a_hat = np.clip((v[ok] - m[ok])/m[ok]**2, 1e-4, None)      # per-gene estimate, very noisy at n=3
mm = m[ok]
coef = np.polyfit(np.log(mm), np.log(0.02 + 8/mm), 1)       # the fitted trend
trend = np.exp(np.polyval(coef, np.log(mm)))
w = 0.75                                                    # shrink towards the trend
a_shrunk = np.exp((1-w)*np.log(a_hat) + w*np.log(trend))
sub = rng.choice(len(mm), 900, replace=False)
a2.scatter(mm[sub], a_hat[sub], s=3, color="#C9CFCA", linewidths=0, label="per-gene estimate (n = 3)")
a2.scatter(mm[sub], a_shrunk[sub], s=3, color=GREEN, alpha=.75, linewidths=0, label="after shrinkage")
o = np.argsort(mm)
a2.plot(mm[o], trend[o], color=ATOM, linewidth=1.6, label="fitted mean–dispersion trend")
a2.set_xscale("log"); a2.set_yscale("log")
a2.set_xlabel("mean count"); a2.set_ylabel("dispersion  α")
a2.legend(fontsize=7, labelcolor=MUTED, loc="upper right")
a2.set_title("B.  noisy estimates are pulled onto the trend", fontsize=8, color=MUTED, loc="left", pad=8)
fig.tight_layout()
fig.savefig(OUT/"de-dispersion.svg", bbox_inches="tight", pad_inches=.05); plt.close(fig)
print("spread of per-gene alpha before:", round(np.std(np.log(a_hat)),2), " after:", round(np.std(np.log(a_shrunk)),2))

# --- false positives from treating cells as samples ---
fig, ax = plt.subplots(figsize=(5.0, 2.9))
nsub = 6                                   # subjects per condition, no real difference
ncell = [10, 50, 200, 1000, 5000]
from scipy import stats
cellp, pbp = [], []
for nc in ncell:
    cp, bp = [], []
    for _ in range(60):
        # a shared per-subject offset: cells inside one subject are NOT independent
        off = rng.normal(0, .6, nsub*2)
        cells = [rng.normal(off[s], 1, nc) for s in range(nsub*2)]
        A = np.concatenate(cells[:nsub]); B = np.concatenate(cells[nsub:])
        cp.append(stats.ttest_ind(A, B).pvalue)
        pa = [c.mean() for c in cells[:nsub]]; pb = [c.mean() for c in cells[nsub:]]
        bp.append(stats.ttest_ind(pa, pb).pvalue)
    cellp.append(np.mean(np.array(cp) < .05)); pbp.append(np.mean(np.array(bp) < .05))
ax.plot(ncell, np.array(cellp)*100, "o-", color=ATOM, markersize=4, label="cells as samples")
ax.plot(ncell, np.array(pbp)*100, "o-", color=GREEN, markersize=4, label="pseudobulk (subjects as samples)")
ax.axhline(5, color=MUTED, linestyle="--", linewidth=.9)
ax.text(12, 7.5, "5% — what the test promises", fontsize=7.5, color=MUTED)
ax.set_xscale("log"); ax.set_xlabel("cells per subject"); ax.set_ylabel("false positives  (%)")
ax.set_ylim(-3, 100); ax.legend(fontsize=7.5, labelcolor=MUTED, loc="center right")
fig.savefig(OUT/"pseudobulk-fpr.svg", bbox_inches="tight", pad_inches=.05); plt.close(fig)
print("false positive rate, cells as samples:", [round(v*100) for v in cellp])
print("false positive rate, pseudobulk      :", [round(v*100) for v in pbp])
