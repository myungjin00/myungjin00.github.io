"""Activation functions and their derivatives, computed with torch autograd."""
import matplotlib; matplotlib.use("Agg")
import matplotlib.pyplot as plt, numpy as np, pathlib, torch
OUT = pathlib.Path("/data1/project/myungjin/site-lab/public/assets/fig")
G, B, A, L, M, S = "#1E4A39", "#2E5878", "#C2703C", "#D3D8CE", "#6E7873", "#7E9C8B"
plt.rcParams.update({"figure.dpi":100,"savefig.transparent":True,"font.size":10,"axes.labelsize":10,
 "xtick.labelsize":9.5,"ytick.labelsize":9.5,"axes.edgecolor":L,"axes.linewidth":.8,"axes.labelcolor":M,
 "xtick.color":M,"ytick.color":M,"axes.spines.top":False,"axes.spines.right":False,
 "legend.frameon":False,"font.family":["DejaVu Sans"]})

# dashed cool = the classical pair that lost, solid = what is used now
FNS = [("sigmoid", torch.sigmoid,              B, "--"),
       ("tanh",    torch.tanh,                 M, "--"),
       ("ReLU",    torch.relu,                 A, "-"),
       ("GELU",    torch.nn.functional.gelu,   G, "-"),
       ("SiLU",    torch.nn.functional.silu,   S, "-")]

x = torch.linspace(-6, 6, 2401, requires_grad=True)
fig, axs = plt.subplots(1, 2, figsize=(7.2, 3.1))
peak = {}
for name, f, col, ls in FNS:
    y = f(x)
    g, = torch.autograd.grad(y.sum(), x, retain_graph=False, create_graph=False)
    axs[0].plot(x.detach(), y.detach(), color=col, linestyle=ls, linewidth=1.8, label=name)
    axs[1].plot(x.detach(), g, color=col, linestyle=ls, linewidth=1.8, label=name)
    peak[name] = g.max().item()

axs[0].set_ylim(-1.6, 3.2); axs[0].set_title("the functions", fontsize=10.5, color=M, pad=7)
axs[1].set_ylim(-0.15, 1.3); axs[1].set_title("their derivatives", fontsize=10.5, color=M, pad=7)
for ax in axs:
    ax.axhline(0, color=L, linewidth=.8, zorder=0)
    ax.axvline(0, color=L, linewidth=.8, zorder=0)
    ax.set_xlim(-6, 6); ax.set_xlabel("input  $x$")
axs[0].set_ylabel("output"); axs[1].set_ylabel("$d/dx$")
axs[1].axhline(1, color=L, linestyle=":", linewidth=1, zorder=0)
axs[1].legend(fontsize=9, labelcolor=M, loc="upper left", borderaxespad=.4, handlelength=1.8)

fig.tight_layout(); fig.savefig(OUT/"activations.svg", bbox_inches="tight", pad_inches=.06)
plt.close(fig)
print("max derivative:", {k: round(v, 4) for k, v in peak.items()})
# the claims the note makes, checked rather than asserted
assert abs(peak["sigmoid"] - 0.25) < 1e-3 and abs(peak["tanh"] - 1.0) < 1e-3
assert abs(peak["ReLU"] - 1.0) < 1e-9
with torch.no_grad():
    xs = torch.linspace(-3, 0, 3001)
    print("GELU min:", round(torch.nn.functional.gelu(xs).min().item(), 4),
          "at x =", round(xs[torch.nn.functional.gelu(xs).argmin()].item(), 3))
    print("SiLU min:", round(torch.nn.functional.silu(xs).min().item(), 4),
          "at x =", round(xs[torch.nn.functional.silu(xs).argmin()].item(), 3))
    print("sigmoid'(4) =", round((torch.sigmoid(torch.tensor(4.)) *
                                  (1 - torch.sigmoid(torch.tensor(4.)))).item(), 5))
    print("0.25**10 =", 0.25**10)
print("wrote activations.svg")
