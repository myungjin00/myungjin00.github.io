---
title: "Activation functions: why a network needs one, and which to pick"
date: 2024-12-06
description: "Why a stack of linear layers collapses · sigmoid, tanh and the vanishing gradient · what ReLU fixed and what dies · GELU, SiLU and the gated family · softmax is a different kind of thing"
category: concept
updated: 2025-01
lang: en
group: activations
topic: Machine learning
subtopic: Basics
tags: [activation function, ReLU, GELU, deep learning]
---

Every layer in every network you have ever run has one, usually written `nn.ReLU()` and never thought about again. Without it a network of any depth is a single linear map, which is why the choice of non-linearity has a history: two early choices were abandoned over the gradient they pass, and the transformers switched again.

## Without an activation, depth does nothing

A linear layer computes $Wx + b$. Stack two of them with nothing in between and you get

$$
W_2(W_1 x) = (W_2 W_1) x
$$

which is one linear map again — so a hundred stacked linear layers have exactly the expressive power of one. Depth buys nothing at all. <mark class="blue">The non-linearity between the layers is the entire reason depth means anything.</mark>

That is not an analogy. The product matrix reproduces the two-layer output to floating-point precision:

```python
import torch
torch.manual_seed(43)

W1 = torch.nn.Linear(8, 16, bias=False)
W2 = torch.nn.Linear(16, 4, bias=False)
x = torch.randn(5, 8)

stacked = W2(W1(x))                        # two layers, nothing between them
collapsed = x @ (W2.weight @ W1.weight).T  # the single matrix W2·W1

print("two linear layers vs one matrix:", torch.allclose(stacked, collapsed, atol=1e-6))
with_relu = W2(torch.relu(W1(x)))
print("with a ReLU between them:       ", torch.allclose(with_relu, collapsed, atol=1e-6))
print("largest difference:              ", (with_relu - collapsed).abs().max().item())
# two linear layers vs one matrix: True
# with a ReLU between them:        False
# largest difference:              0.33910638093948364
```

One `torch.relu` call is the difference between a model that can only draw a hyperplane and a model that is a universal approximator.

## The classical pair, and why they lost

**Sigmoid**, also called the logistic function, squashes anything into $(0, 1)$:

$$
\sigma(x) = \frac{1}{1 + e^{-x}}
$$

**Tanh** is the same shape rescaled into $(-1, 1)$, which makes it zero-centred — a real advantage over sigmoid, whose output is always positive and so pushes all the gradients of a layer in the same direction.

Both were standard, and both lost to the same problem: the **vanishing gradient**. Backpropagation multiplies the derivative of every layer's activation along the chain, so what reaches the first layer is a product of all of them. The maximum derivative is what decides whether that product survives.

| | maximum derivative | where it occurs |
| --- | --- | --- |
| sigmoid | **0.25** | at $x = 0$ |
| tanh | **1.0** | at $x = 0$ |

Sigmoid's 0.25 is the killer. Even in the best case — every unit sitting exactly at its most favourable input — ten layers multiply the gradient by $0.25^{10} \approx 9.5 \times 10^{-7}$, and the real case is far worse because units are not at zero. At $x = 4$ the sigmoid derivative is already 0.0177. Tanh's ceiling of 1.0 makes it the better of the two, but it saturates just as flatly once the input leaves a narrow band around zero.

Here is what that does to a 20-layer stack, with each initialisation gain matched to its activation so the comparison is fair:

```python
import torch

def first_layer_grad(name, act, depth=20, width=64):
    torch.manual_seed(43)
    layers = []
    for _ in range(depth):
        lin = torch.nn.Linear(width, width)
        torch.nn.init.xavier_normal_(lin.weight, gain=torch.nn.init.calculate_gain(name))
        torch.nn.init.zeros_(lin.bias)
        layers += [lin, act()]
    net = torch.nn.Sequential(*layers)
    net(torch.randn(256, width)).pow(2).mean().backward()
    return net[0].weight.grad.norm().item(), net[-2].weight.grad.norm().item()

for name, act in [("sigmoid", torch.nn.Sigmoid), ("tanh", torch.nn.Tanh), ("relu", torch.nn.ReLU)]:
    f, l = first_layer_grad(name, act)
    print(f"{name:8s} layer 1 grad norm = {f:.2e}   layer 20 = {l:.2e}")
# sigmoid  layer 1 grad norm = 2.13e-14   layer 20 = 1.24e-01
# tanh     layer 1 grad norm = 1.83e-01   layer 20 = 7.66e-02
# relu     layer 1 grad norm = 7.47e-01   layer 20 = 2.05e+00
```

The last layer of the sigmoid network gets a perfectly ordinary gradient of 0.124. The first layer gets $2.13 \times 10^{-14}$ — thirteen orders of magnitude down, which with any sane learning rate is zero. <mark>The early layers of a deep sigmoid network do not learn slowly; they do not learn.</mark> That is why deep networks did not train before 2010.

Sigmoid has exactly one job left: **the output of a binary classifier**, where turning one logit — the raw unnormalised score a model emits before any squashing — into one probability in $(0,1)$ is what the loss expects. That is a different job from being a hidden-layer activation.

## ReLU, and what it actually fixed

$$
\mathrm{ReLU}(x) = \max(0, x)
$$

ReLU (rectified linear unit) does three things at once.

- **The derivative is exactly 1 for every positive input.** Multiply 1 by itself twenty times and you still have 1, so the gradient crosses a deep stack undiminished. That property is what made depth trainable.
- **It is as cheap as an operation gets** — a comparison and a select, no exponential.
- **It makes activations sparse.** Roughly half the units output exactly zero on any given input, which is cheap to store and seems to help.

The cost is the **dying ReLU**. A unit whose pre-activation is negative for *every* example in the dataset outputs zero for all of them, and since the derivative of ReLU is zero on the negative side, its gradient is zero too. No gradient means no update, and no update means the input stays negative. The unit is dead permanently, and nothing in training can bring it back.

During a step the bias absorbs the gradient like any other parameter, so a single large update — from a learning rate that is too high, or an outlier batch — can push the bias far enough negative that no input in the dataset ever lifts the pre-activation above zero again. That is also the fix: **a dying-ReLU problem is almost always a learning-rate problem**, and dropping the rate removes it far more reliably than swapping the activation.

<figure>
<img src="/assets/fig/activations.svg" alt="Five activation functions and their derivatives, plotted over the input range minus six to six" loading="lazy" />
<figcaption><b>The right panel is the argument.</b> Both derivatives of the classical pair (dashed) fall to zero away from the origin, and sigmoid never exceeds 0.25 even at its best point &mdash; multiplied down a deep stack that is nothing. ReLU holds a flat 1 for every positive input. GELU and SiLU, introduced below, do roughly the same thing with a smooth edge instead of a kink. Computed with torch autograd for this note.</figcaption>
</figure>

## Three variants that patch ReLU

Three variants exist to stop units dying, all by giving the negative side a non-zero slope.

| | What it changes |
| --- | --- |
| **Leaky ReLU** | negative inputs get a small fixed slope, usually 0.01, instead of zero |
| **PReLU** (parametric rectified linear unit) | the same slope, but learned per channel rather than fixed |
| **ELU** (exponential linear unit) | negative side is $\alpha(e^x - 1)$, so it curves smoothly down to $-\alpha$ instead of running straight |

In practice none of them reliably beats plain ReLU by enough to matter. Each has a paper showing a gain on some benchmark, and each fails to reproduce it elsewhere. That is why ReLU survived — these variants fix a problem that a sensible learning rate had mostly already fixed, and they cost either a hyperparameter or an exponential to do it.

## GELU, and why the transformers use it

GELU (Gaussian error linear unit) is

$$
\mathrm{GELU}(x) = x \cdot \Phi(x)
$$

where $\Phi$ is the cumulative distribution function (CDF) of the standard normal. Read it as a soft gate: instead of ReLU's hard decision at zero, the input is weighted by the probability that it exceeds a standard normal draw. Large inputs are passed almost unchanged ($\Phi \to 1$), large negative inputs are almost fully suppressed, and in between the gate opens gradually.

Two properties follow.

- **It is smooth.** The derivative is continuous everywhere, where ReLU's jumps from 0 to 1 at the origin. This is the property GELU is chosen for.
- **It is non-monotonic.** Because $x$ is negative while $\Phi(x)$ is still appreciable, the curve dips below zero before coming back: I measured the minimum at **−0.17, at about $x = -0.75$**. A small negative region, but it means the function is not order-preserving.

The empirical gain over ReLU is small, and GELU is everywhere by **inheritance, not evidence**. BERT used it, GPT used it, and every transformer implementation since has copied the choice. If you are training a transformer, use GELU because the rest of the recipe was tuned with it — not because of a decisive result, which does not exist.

Frameworks offer two forms. The exact one calls the error function; the older **tanh approximation** exists because `erf` used to be slow on the hardware of the time:

$$
\mathrm{GELU}(x) \approx 0.5\,x\left(1 + \tanh\!\left[\sqrt{2/\pi}\,(x + 0.044715\,x^3)\right]\right)
$$

```python
import torch
x = torch.linspace(-6, 6, 20001)
e = torch.nn.functional.gelu(x, approximate="none")
a = torch.nn.functional.gelu(x, approximate="tanh")
print("exact vs tanh-approx, max |diff| =", (e - a).abs().max().item())
# exact vs tanh-approx, max |diff| = 0.0004737377166748047
```

They differ by at most 0.00047 across the whole useful range, so the choice is irrelevant to accuracy. It is not irrelevant to reproduction: a checkpoint trained with one and evaluated with the other is a mismatch, and some ports have shipped that bug.

## SiLU, Swish and the gated family

SiLU (sigmoid linear unit) replaces the normal CDF with a plain sigmoid:

$$
\mathrm{SiLU}(x) = x \cdot \sigma(x)
$$

It was published twice — as SiLU by Elfwing and colleagues in a reinforcement-learning paper, and rediscovered by an automated function search as **Swish** — and it is nearly the same curve as GELU, within 0.193 everywhere on $[-6, 6]$. It is cheaper, since a sigmoid beats an error function, and it is what most modern vision backbones and LLM (large language model) stacks actually run.

The gated variants go one step further. A GLU (gated linear unit) splits a projection into two halves and lets one half multiply the other through an activation:

$$
\mathrm{SwiGLU}(x) = \big(\mathrm{SiLU}(xW_1)\big) \odot (xW_2)
$$

Each name is its activation plus GLU: **SwiGLU** is the SiLU (Swish) version written above, **GeGLU** the same with GELU in place of SiLU. These are what Llama-class models use in the feed-forward block, and they do appear to help. Splitting the projection means you need two weight matrices where there was one, so a GLU block has more parameters than the block it replaces. **A fair comparison holds the parameter count fixed** — in practice by narrowing the hidden dimension to roughly two thirds — and a comparison that does not is measuring width, not gating.

## The comparison

| | Formula | Range | Differentiable at 0 | Used now for | The one thing |
| --- | --- | --- | --- | --- | --- |
| **sigmoid** | $1/(1+e^{-x})$ | $(0, 1)$ | yes | binary classifier output | max derivative 0.25, so it kills deep stacks |
| **tanh** | $\tanh x$ | $(-1, 1)$ | yes | gates in LSTM (long short-term memory) and GRU (gated recurrent unit) networks | zero-centred, but saturates just as flatly |
| **ReLU** | $\max(0, x)$ | $[0, \infty)$ | no — a kink | the default for plain networks and CNNs (convolutional neural networks) | derivative exactly 1 when positive; units can die |
| **Leaky ReLU** | $\max(0.01x, x)$ | $(-\infty, \infty)$ | no — a kink | GAN (generative adversarial network) discriminators, occasionally | nothing dies, but it rarely beats ReLU |
| **ELU** | $x$, else $\alpha(e^x - 1)$ | $(-\alpha, \infty)$ | yes at $\alpha = 1$ | rare | smooth and zero-centred, at the cost of an exponential |
| **GELU** | $x\,\Phi(x)$ | $\approx(-0.17, \infty)$ | yes | transformers — BERT, GPT | smooth and non-monotonic; the default by inheritance |
| **SiLU** | $x\,\sigma(x)$ | $\approx(-0.278, \infty)$ | yes | modern vision backbones and LLMs | GELU's shape, cheaper; also called Swish |
| **softmax** | $e^{z_i} / \sum_j e^{z_j}$ | $(0, 1)$, summing to 1 | yes | multi-class output, and inside attention | operates on a vector, not elementwise |

## Softmax is a different kind of thing

Softmax is listed above, but it is not the same kind of operation as the rest. Every other row is **elementwise**: each unit is transformed on its own, knowing nothing about its neighbours. Softmax takes a whole vector of logits and returns a distribution over them — non-negative, summing to one — so each output depends on every input. Raise one logit and every other probability falls.

That makes it an output layer for multi-class classification, not a hidden-layer activation. Two practical consequences. In PyTorch you pass **raw logits** to `nn.CrossEntropyLoss`, which applies log-softmax internally; applying softmax yourself first and then feeding it in applies the operation twice and quietly flattens the gradients. And a binary problem takes a sigmoid on one logit, not a softmax over two.

It does appear mid-network in one place that matters: inside **attention**, over the pairwise scores, where it is what turns similarities into weights that sum to one. There it is a weighting mechanism rather than a hidden-layer non-linearity; [attention](../attention-en/) works it out.

## What to actually do

- **Plain feed-forward network or CNN** — ReLU.
- **Inside a transformer** — GELU or SiLU. Follow whatever the architecture you are copying used.
- **Binary output** — sigmoid on a single logit, or nothing at all if the loss expects logits.
- **Multi-class output** — softmax, and usually not written explicitly because the loss does it.

Then stop. **The activation is almost never where a model's problem is.** If a model is not learning, the cause is in the learning rate, the data, the labels or the loss far more often than in the choice of non-linearity, so swapping ReLU for GELU to rescue a stuck run changes the variable least likely to be responsible. [The training loop](../training-basics-en/) has the list of things to check first.

## Summary

- Without a non-linearity a stack of linear layers collapses to a single matrix — verified above to floating-point precision
- Sigmoid's derivative peaks at 0.25 and tanh's at 1.0; compounded over depth, sigmoid's leaves the first layer of a 20-layer stack with a gradient of $2 \times 10^{-14}$
- Sigmoid's one surviving job is the output of a binary classifier
- ReLU's derivative is exactly 1 when positive, which is why depth became trainable; its cost is units that die permanently, usually from too high a learning rate
- Leaky ReLU, PReLU and ELU each fix that and none reliably beats plain ReLU
- GELU is $x\,\Phi(x)$ — smooth, slightly non-monotonic, and the transformer default mostly by inheritance
- SiLU is the same shape with a sigmoid, and SwiGLU-style gating is what Llama-class models use — compare it at fixed parameter count
- Softmax is an output layer over a vector, not an elementwise activation

## References

- Nair & Hinton, [Rectified Linear Units Improve Restricted Boltzmann Machines](https://icml.cc/Conferences/2010/papers/432.pdf) (ICML 2010) — where ReLU entered general use
- Hendrycks & Gimpel, [Gaussian Error Linear Units (GELUs)](https://arxiv.org/abs/1606.08415) (2016) — the $x\Phi(x)$ formulation and the tanh approximation
- Elfwing et al., [Sigmoid-Weighted Linear Units for Neural Network Function Approximation in Reinforcement Learning](https://arxiv.org/abs/1702.03118) (2017) — SiLU, later rediscovered as Swish
- Shazeer, [GLU Variants Improve Transformer](https://arxiv.org/abs/2002.05202) (2020) — SwiGLU and GeGLU, compared at matched parameter count
