"""Two figures for the MPP note, both computed from the real MoleculeNet files."""
import matplotlib; matplotlib.use("Agg")
import matplotlib.pyplot as plt, numpy as np, pandas as pd, pathlib
from rdkit import Chem, RDLogger
from rdkit.Chem import rdFingerprintGenerator
from rdkit.Chem.Scaffolds import MurckoScaffold
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error
RDLogger.DisableLog("rdApp.*")

OUT = pathlib.Path("/data1/project/myungjin/site-lab/public/assets/fig")
D = pathlib.Path("/data1/project/myungjin/SJoINT/data/raw/moleculenet")
GREEN, BLUE, ATOM, LINE, MUTED = "#1E4A39", "#2E5878", "#C2703C", "#D3D8CE", "#6E7873"
plt.rcParams.update({"figure.dpi":100,"savefig.transparent":True,"font.size":8,
    "axes.labelsize":8,"xtick.labelsize":7.5,"ytick.labelsize":7.5,"axes.edgecolor":LINE,
    "axes.linewidth":.8,"axes.labelcolor":MUTED,"xtick.color":MUTED,"ytick.color":MUTED,
    "axes.spines.top":False,"axes.spines.right":False,"legend.frameon":False,
    "font.family":["DejaVu Sans"]})

# ---------- 1. dataset sizes ----------
SETS = [("FreeSolv","regression"),("ESOL","regression"),("Lipophilicity","regression"),
        ("BACE","classification"),("BBBP","classification"),("ClinTox","classification"),
        ("SIDER","classification"),("Tox21","classification"),("ToxCast","classification")]
# count molecules RDKit can parse, not raw rows — that is the convention the benchmark tables use
SMILES_COL = {"BACE":"mol","BBBP":"smiles","ClinTox":"smiles","ESOL":"smiles",
              "FreeSolv":"smiles","Lipophilicity":"smiles","SIDER":"smiles",
              "Tox21":"smiles","ToxCast":"smiles"}
n = {}
for s, _ in SETS:
    df = pd.read_csv(D/f"{s}.csv")
    col = SMILES_COL[s] if SMILES_COL[s] in df.columns else [c for c in df.columns if "smile" in c.lower() or c=="mol"][0]
    n[s] = int(sum(Chem.MolFromSmiles(str(v)) is not None for v in df[col]))
order = sorted(SETS, key=lambda t: n[t[0]])
fig, ax = plt.subplots(figsize=(6.4, 2.9))
y = np.arange(len(order))
cols = [GREEN if k == "regression" else BLUE for _, k in order]
ax.barh(y, [n[s] for s, _ in order], color=cols, alpha=.85, height=.62)
ax.set_yticks(y); ax.set_yticklabels([s for s, _ in order])
for i, (s, _) in enumerate(order):
    ax.text(n[s]*1.04, i, f"{n[s]:,}", va="center", fontsize=7.5, color=MUTED)
ax.set_xscale("log"); ax.set_xlim(300, 30000)
ax.set_xlabel("molecules RDKit parses (log scale)")
ax.axvspan(300, 2000, color=ATOM, alpha=.07, linewidth=0)
ax.text(620, len(order)-.4, "under 2,000 — too small to train a deep model from scratch",
        fontsize=7.5, color=ATOM)
from matplotlib.patches import Patch
ax.legend(handles=[Patch(facecolor=GREEN, alpha=.85, label="regression"),
                   Patch(facecolor=BLUE, alpha=.85, label="classification")],
          loc="lower right", fontsize=7.5, labelcolor=MUTED)
fig.savefig(OUT/"moleculenet-sizes.svg", bbox_inches="tight", pad_inches=.05); plt.close(fig)
print("sizes:", {s: n[s] for s, _ in order})

# ---------- 2. random vs scaffold split, actually run ----------
def featurise(smis):
    gen = rdFingerprintGenerator.GetMorganGenerator(radius=2, fpSize=2048)
    X, keep = [], []
    for i, s in enumerate(smis):
        m = Chem.MolFromSmiles(s)
        if m is None: continue
        X.append(np.array(gen.GetFingerprint(m), dtype=np.uint8)); keep.append(i)
    return np.array(X), keep

def scaffold_split(smis, frac=.8, seed=0):
    groups = {}
    for i, s in enumerate(smis):
        m = Chem.MolFromSmiles(s)
        sc = MurckoScaffold.MurckoScaffoldSmiles(mol=m, includeChirality=False) if m else ""
        groups.setdefault(sc, []).append(i)
    sets = sorted(groups.values(), key=len, reverse=True)
    tr, te, cut = [], [], int(len(smis)*frac)
    for g in sets:
        (tr if len(tr) + len(g) <= cut else te).extend(g)
    return np.array(tr), np.array(te)

res = {}
for name, scol, ycol in [("ESOL","smiles","measured log solubility in mols per litre"),
                         ("Lipophilicity","smiles","exp"),
                         ("FreeSolv","smiles","expt")]:
    df = pd.read_csv(D/f"{name}.csv")
    ycol = ycol if ycol in df.columns else [c for c in df.columns if df[c].dtype != object][-1]
    df = df[[scol, ycol]].dropna().reset_index(drop=True)
    X, keep = featurise(df[scol]); y = df[ycol].values[keep]; smis = df[scol].values[keep]
    rs, ss = [], []
    for seed in range(3):
        rng = np.random.default_rng(seed); idx = rng.permutation(len(y)); cut = int(len(y)*.8)
        tr, te = idx[:cut], idx[cut:]
        m = RandomForestRegressor(n_estimators=300, random_state=seed, n_jobs=-1).fit(X[tr], y[tr])
        rs.append(mean_squared_error(y[te], m.predict(X[te]))**.5)
        tr, te = scaffold_split(smis, seed=seed)
        m = RandomForestRegressor(n_estimators=300, random_state=seed, n_jobs=-1).fit(X[tr], y[tr])
        ss.append(mean_squared_error(y[te], m.predict(X[te]))**.5)
    res[name] = (np.mean(rs), np.std(rs), np.mean(ss), np.std(ss), len(y))
    print(f"{name:14s} n={len(y):5d}  random {np.mean(rs):.3f}±{np.std(rs):.3f}   scaffold {np.mean(ss):.3f}±{np.std(ss):.3f}")

fig, ax = plt.subplots(figsize=(5.2, 2.9))
names = list(res); x = np.arange(len(names)); w = .3
r_m = [res[k][0] for k in names]; r_s = [res[k][1] for k in names]
s_m = [res[k][2] for k in names]; s_s = [res[k][3] for k in names]
ax.bar(x-w/2, r_m, w, yerr=r_s, color=GREEN, alpha=.85, capsize=3, error_kw=dict(ecolor=MUTED, lw=.9), label="random split")
ax.bar(x+w/2, s_m, w, yerr=s_s, color=ATOM, alpha=.85, capsize=3, error_kw=dict(ecolor=MUTED, lw=.9), label="scaffold split")
for i in range(len(names)):
    ax.text(x[i], max(r_m[i], s_m[i])+.12, f"+{(s_m[i]-r_m[i])/r_m[i]*100:.0f}%", ha="center", fontsize=7.5, color=ATOM)
ax.set_xticks(x); ax.set_xticklabels([f"{k}\nn={res[k][4]:,}" for k in names])
ax.set_ylabel("test RMSE  (lower is better)")
ax.legend(fontsize=7.5, labelcolor=MUTED)
fig.savefig(OUT/"split-comparison.svg", bbox_inches="tight", pad_inches=.05); plt.close(fig)
print("done")
