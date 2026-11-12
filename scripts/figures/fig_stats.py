"""Multiple testing: the p-value histogram, and Benjamini-Hochberg finding the cutoff.

The null half reuses the note's simulation verbatim (default_rng(0), 20,000 tests, k = 5),
so the numbers in the prose and the numbers in the figure are the same run.
"""
import matplotlib; matplotlib.use("Agg")
import matplotlib.pyplot as plt, numpy as np, pathlib
from scipy import stats
OUT = pathlib.Path("/data1/project/myungjin/site-lab/public/assets/fig")
G, B, A, L, M, S = "#1E4A39", "#2E5878", "#C2703C", "#D3D8CE", "#6E7873", "#7E9C8B"
plt.rcParams.update({"figure.dpi":100,"savefig.transparent":True,"font.size":10,"axes.labelsize":10,
 "xtick.labelsize":9.5,"ytick.labelsize":9.5,"axes.edgecolor":L,"axes.linewidth":.8,"axes.labelcolor":M,
 "xtick.color":M,"ytick.color":M,"axes.spines.top":False,"axes.spines.right":False,
 "legend.frameon":False,"font.family":["DejaVu Sans"]})

rng = np.random.default_rng(0)
n, k, n_true, delta, alpha = 20_000, 5, 300, 3.5, 0.05

# ---- exactly the note's code, same seed, same order of draws ----
p_null = stats.ttest_ind(rng.normal(size=(n, k)), rng.normal(size=(n, k)), axis=1).pvalue
print("null only  : raw p < 0.05 =", (p_null < .05).sum(),
      "| Bonferroni =", (p_null < .05 / n).sum(),
      "| smallest raw p =", f"{p_null.min():.2e}")
assert (p_null < .05).sum() == 946 and f"{p_null.min():.2e}" == "1.83e-05"   # agrees with the prose

# ---- 300 more genes that really differ, mean shifted by 3.5 SD ----
p_true = stats.ttest_ind(rng.normal(size=(n_true, k)),
                         rng.normal(loc=delta, size=(n_true, k)), axis=1).pvalue
p = np.concatenate([p_null, p_true])
truth = np.concatenate([np.zeros(n, bool), np.ones(n_true, bool)])
m = len(p)

def bh(pv):                                     # Benjamini-Hochberg adjusted p-values
    o = np.argsort(pv)
    q = np.minimum.accumulate((pv[o] * len(pv) / np.arange(1, len(pv) + 1))[::-1])[::-1]
    out = np.empty_like(q); out[o] = np.minimum(q, 1.0)
    return out

padj = bh(p)
rej = padj < alpha
tp, fp = int((rej & truth).sum()), int((rej & ~truth).sum())
print(f"with {n_true} real effects: BH padj < {alpha} rejects {rej.sum()} "
      f"({tp} real, {fp} false, realised FDR {fp/max(rej.sum(),1):.3f}) | "
      f"Bonferroni rejects {(p < alpha/m).sum()} | power {tp/n_true:.2f}")
ps = np.sort(p)
kmax = int(rej.sum())                            # BH cutoff rank
print("BH p-value cutoff", f"{ps[kmax-1]:.2e}", "vs Bonferroni cutoff", f"{alpha/m:.2e}")

fig, axs = plt.subplots(1, 2, figsize=(7.2, 3.3))
ax = axs[0]
bins = np.linspace(0, 1, 41)
ax.hist(p_null, bins=bins, color=S, label=f"{n:,} null tests")
ax.hist(p_true, bins=bins, bottom=np.histogram(p_null, bins=bins)[0],
        color=A, label=f"{n_true} real effects")
ax.axhline(n / 40, color=B, linestyle="--", linewidth=1.1, zorder=3)
ax.text(.42, n / 40 + 40, "flat: what the null looks like", fontsize=9, color=B)
ax.set_xlabel("p-value"); ax.set_ylabel("tests per bin")
ax.legend(fontsize=9, labelcolor=M, loc="upper right", borderaxespad=.3)
ax.set_title("every p-value in one run", fontsize=10.5, color=M, pad=7)

ax = axs[1]
r = np.arange(1, 601)
ax.plot(r, ps[:600], color=M, linewidth=1.8, label="sorted p-values")
ax.plot(r, r / m * alpha, color=A, linewidth=1.5, linestyle="--",
        label=r"$i/m \cdot \alpha$   ($\alpha$ = 0.05)")
ax.axhline(alpha / m, color=B, linewidth=1.2, linestyle=":", label="Bonferroni threshold")
ax.axvline(kmax, color=G, linewidth=1.2)
ax.annotate(f"BH stops here\n{kmax} called, {fp} of them false",
            xy=(kmax, ps[kmax-1]), xytext=(kmax + 45, ps[kmax-1] / 90),
            fontsize=9, color=G, ha="left",
            arrowprops=dict(arrowstyle="-", color=G, lw=.9))
ax.set_yscale("log"); ax.set_xlim(0, 600)
ax.set_xlabel("rank $i$ of the sorted p-value"); ax.set_ylabel("p-value")
ax.legend(fontsize=8.6, labelcolor=M, loc="upper left", borderaxespad=.3)
ax.set_title("Benjamini-Hochberg", fontsize=10.5, color=M, pad=7)

fig.tight_layout(); fig.savefig(OUT/"multiple-testing.svg", bbox_inches="tight", pad_inches=.06)
plt.close(fig)
print("wrote multiple-testing.svg")
