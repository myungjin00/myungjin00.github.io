---
title: "Five ways to split a molecular dataset, and what each one assumes"
date: 2026-10-19
description: "Random, temporal, metadata, scaffold and representation-based splits, each with the assumption it encodes about train–test similarity — and the failure modes the perspective is unusually direct about."
category: review
updated: 2026-11
lang: en
topic: Cheminformatics
subtopic: Evaluation
venue: ChemRxiv
venueYear: 2026
group: data-splitting
tags: [review, evaluation, scaffold split, benchmark]
---

> Truong, Cao-Minh, et al. "Small-Molecule Data Splitting for Machine Learning in Drug Design." *ChemRxiv*, 2026, [doi.org/10.26434/chemrxiv.15009691/v1](https://doi.org/10.26434/chemrxiv.15009691/v1). Preprint.

## Why the split matters

<mark class="blue">The split decides what question the score answers.</mark> Train / validation / test have one job each — fit, select, estimate — but the *relationship* between the training and test molecules is what determines whether 0.85 means "works on analogues of what it saw" or "works on new chemistry".

<figure>
<img src="/assets/fig/split-comparison.svg" alt="Test RMSE under random and scaffold splits on three datasets" loading="lazy" />
<figcaption><b>Why the choice is not cosmetic.</b> ECFP4 (extended-connectivity fingerprint) + random forest, three seeds, run for my <a href="../mpp-en/">property-prediction note</a> rather than taken from this paper. Moving from a random split to a scaffold split costs 20% on Lipophilicity, 46% on ESOL and 125% on FreeSolv — a swing no modelling change produces.</figcaption>
</figure>

## The five families of split

| Family | Principle | Good for | Quietly fails when |
| --- | --- | --- | --- |
| Random | shuffle, optionally keep class balance | sanity checks, comparing representations, tuning | no control of similarity at all — analogues sit on both sides |
| Temporal | order by measurement date, train on the past | retrospective evaluation of a real project | chronology ≠ structural separation |
| Metadata | group by project, assay, lab, patent, source | transfer across experimental contexts | different sources still contain the same molecules |
| Scaffold | group by a core, keep groups whole | assessment by structural class, interpretable | the definition makes the groups; different scaffolds can be nearly identical |
| Representation | split by similarity or distance in a representation | direct control of how similar the sets are | depends on representation, metric and allocation rule |

The paper gives each family the same four headings, so the families are set side by side rather than narrated.

## What the paper observes

**Temporal order does not give you prospective validation.** A historical holdout cannot capture that *future* sampling was itself guided by models and by what the team chose to make. And the dates in a database are inclusion dates, which are not experiment dates and not publication dates. <mark>A time split is more honest than a random split and still not a prospective test.</mark>

**Different sources are not different molecules.** Splitting by assay, patent or source dataset sounds like separation, and the same compound routinely appears in several. The paper is blunt that exact SMILES (simplified molecular-input line-entry system) matching is not sufficient for deduplication — structures have to be standardised and identity verified first.

**Scaffold groups are uneven, and a shared scaffold does not imply shared potency.** A handful of large scaffolds dominate while most are singletons — one molecule each — so a scaffold split is also an unbalanced split. And within one scaffold you get [activity cliffs](../activity-cliff-en/) — same core, order-of-magnitude different activity. Scaffold separation is a structural claim, not an activity claim.

**Different scaffold labels do not guarantee structural separation.** A Bemis–Murcko scaffold is what is left after stripping the side chains, keeping the ring systems and the linkers between them; two of them can differ by a single atom and still be two groups, so the split can report separation it has not achieved.

**Representation splits make allocation a separate decision.** Clustering is one choice and what you do with the clusters is another, and the second changes the question:

| | What it does | Scenario it creates |
| --- | --- | --- |
| cluster-stratified | sample from every cluster into both sets | preserves coverage; interpolative |
| cluster-shuffle | whole clusters to one side | structural separation; extrapolative |

Named methods: Kennard–Stone (pick training compounds for coverage, which leaves an interpolative and therefore optimistic test set), OptiSim (balance diversity against representativeness), and AVE (asymmetric validation embedding), which explicitly minimises the difference in cross-partition nearest-neighbour distances between actives and decoys (presumed inactives), and is what the LIT-PCBA benchmark is built on.

## The closing recommendations

The closing section, nearly verbatim:

- **Match the split to the intended application.** Related compounds are appropriate for lead optimisation; scaffold hopping needs real structural separation.
- **High train–test similarity is not by itself data leakage.** Those are two different problems, and conflating them leads to over-correcting.
- **Partition assignment varies**, and controlling it improves reproducibility.
- **Evaluate across a spectrum of similarity levels** — the SPECTRA protocol: train and test at several fixed similarity levels and report the whole curve rather than one point. Budget permitting.
- **No single split fully characterises a model.**

## What I would question

- **It is a preprint, and it is a perspective.** No new experiments, so the claims rest on the cited literature. That is a reasonable thing for a perspective to be, but it means the quantitative weight of each failure mode is not established here.
- **It names the problem with scaffold splits and leaves the field there.** Scaffolds are uneven, definition-dependent and leaky, and the recommendation is to consider similarity-based alternatives. Which one, and at which threshold, is left open — and that is exactly the decision a practitioner is stuck on.
- **Cost is mentioned but not quantified.** SPECTRA-style evaluation across similarity levels is clearly better and clearly more expensive; the paper does not say by how much, which is what decides whether anyone does it.

## Why I read it

I had [made this argument before](../evaluation-protocol-en/) with a single comparison, and this paper is the full taxonomy. Everything I report on [MoleculeNet](../mpp-en/) and [MoleculeACE](../activity-cliff-en/) rests on a split, and until this I had one working rule — scaffold over random, state which — which this paper shows is too coarse. In particular, **"scaffold split" is not one protocol**: the core definition, the handling of singletons and the class balance are all choices, and papers that disagree about them are not comparable even when both say "scaffold".

The practical change I took away is to report the **cross-split similarity** alongside the metric, instead of trusting that the split name implies it. I had half-believed that a time split was close enough to a prospective test, and that belief did not survive it. The recommendation I keep coming back to is the last one: the common practice of picking the scaffold split because it is the strict one and reporting a single number is still picking one question and answering it.

## Summary

- The split decides which question the score answers, so it should match the intended use
- Five families: random, temporal, metadata, scaffold, representation-based
- Temporal order does not give prospective validation, and database dates are not experiment dates
- Different sources share molecules; exact SMILES matching is not enough to deduplicate
- Scaffold groups are uneven, definition-dependent, and a shared scaffold does not imply shared activity
- Representation splits separate clustering from allocation — cluster-stratified is interpolative, cluster-shuffle is extrapolative
- High train–test similarity is not automatically leakage, and no single split characterises a model

## References

- Truong et al., [Small-molecule data splitting for machine learning in drug design](https://doi.org/10.26434/chemrxiv.15009691/v1), ChemRxiv (2026) — the preprint reviewed here
- Sheridan, [Time-split cross-validation as a method for estimating the goodness of prospective prediction](https://doi.org/10.1021/ci400084k), *J. Chem. Inf. Model.* (2013)
- Wallach & Heifets, [Most ligand-based classification benchmarks reward memorization rather than generalization](https://doi.org/10.1021/acs.jcim.7b00403), *J. Chem. Inf. Model.* (2018) — AVE
