---
title: "AgreementPred: when you cannot train, vote"
date: 2025-06-24
description: "Natural products carry almost no pharmacological labels · similarity fused across 22 of 29 molecular representations · how much they agree used as the confidence · where the labels come from · and the baseline that still wins on precision"
category: review
updated: 2025-07
lang: en
topic: Cheminformatics
subtopic: Prediction
venue: Digital Discovery
venueYear: 2025
group: agreementpred
tags: [review, molecular representation, similarity, natural products]
---

> Sutcharitchan, Chayanis, et al. "AgreementPred: a cheminformatic framework for drug and natural product category recommendation based on multi-representation structural similarity data fusion." *Digital Discovery*, vol. 4, no. 11, 2025, pp. 3304–3319, [doi.org/10.1039/d5dd00329f](https://doi.org/10.1039/d5dd00329f).

## The problem: no labels to learn from

Natural products are a real source of drugs — ephedrine, artemisinin, paclitaxel — and the field has moved from single isolated compounds towards the combined effects of multi-component extracts. Understanding those requires knowing what each constituent does pharmacologically.

<mark>And that is the data that does not exist.</mark> Synthetic drugs come with standardised classification: ATC (anatomical therapeutic chemical) codes, MeSH (medical subject headings) terms, catalogued side effects. Natural products do not. ChEMBL and NPASS carry target-level activity — IC₅₀, Kᵢ — but going from "binds this target" to "is used clinically for this" is a leap the data does not support, because the datasets are incomplete, not just small.

So the usual move, train a classifier on labelled examples, has no foothold. Most frameworks that do this were built for conventional drugs and inherit their label distribution.

## Where the labels come from

The method is a recommender, so the labelled side is the whole asset. It is assembled from six
public databases with a resolvable PubChem CID: **DrugBank**, **SIDER**, **LOTUS**, **NPASS**,
**HERB 2.0** and **TM-MC 2.0**. That pull returned 331,326 PubChem records, of which only
**9,721 carried a classification annotation** — the ratio is the premise of the paper restated
as a number.

Annotations are ATC and MeSH strings taken from PubChem, which arrive as ontology chains
(`Enzyme Inhibitors > HMG-CoA Reductase Inhibitors|…`). They are normalised by stripping codes,
lowercasing and de-duplicating, but **deliberately not merged by hand**: *antiparkinsonian agent*
and *antiparkinson agents* sit in different ontology chains, and collapsing them would break
traceability back to the source. That choice is why the label space stays large.

| Dataset | What it is | Pairs | Unique labels |
| --- | --- | --- | --- |
| **Annotated-Compound** | the 9,721 annotated compounds, the pool every search runs against | 54,675 | **1,520** |
| **AnnoCom1000** | 1,000 sampled from it, for development | 5,612 | 872 |
| **DrugBank1000** | 1,000 drugs, to test the drug end | 6,978 | 971 |
| **NP1000** | 1,000 natural products, to test the end that matters | 3,995 | 544 |
| **Annotated-SE** | 1,376 drugs mapped to SIDER side effects | 139,516 | 4,216 |

Read the last column. The natural-product set carries 544 distinct labels against the drug
set's 971 — the label scarcity the method exists to address is visible in its own training data.
The side-effect set is the opposite extreme: 101 annotations per drug on average against 5.6 for
categories, and a few terms like headache and nausea are so common that even random compounds
score well on it. The paper says so, which is why the side-effect numbers should not be read
alongside the category ones.

## The idea

Give up on training a label predictor and **recommend by similarity instead** — with two twists that make it more than nearest-neighbour lookup.

<figure>
<img src="/assets/fig/agreementpred-f1.jpg" alt="The AgreementPred framework: similarity under many molecular representations, fused, then filtered by an agreement-score threshold" width="2012" height="874" loading="lazy">
<figcaption><b>The whole framework in one line.</b> An annotated compound and an unannotated natural product are each encoded under many representations; the similarity searches are pooled to recover annotations that any single representation would miss, and an <b>agreement-score threshold</b> then discards the ones only a few representations supported. <mark>Fusion buys recall, the threshold buys back precision.</mark>
<br><span class="credit">Sutcharitchan et al., <a href="https://doi.org/10.1039/d5dd00329f"><i>Digital Discovery</i> <b>4</b>, 3304&ndash;3319 (2025)</a>, Fig. 1 &#183; <a href="https://creativecommons.org/licenses/by-nc/4.0/">CC BY-NC 4.0</a></span></figcaption>
</figure>

**Twist one: fuse across representations.** The paper evaluates **29 molecular representations** — 28 [fingerprints](../descriptors-fingerprints-en/) plus InfoGraph, an unsupervised learned embedding — then drops the redundant ones and fuses the remaining **22**. The pruning is explicit: within each family, representations correlating above Pearson **r = 0.75** are collapsed to one, which removes seven fingerprints (TT, ASP, Daylight, CDKFP, EC2048, MHFP, PH2) specifically to stop near-duplicates from inflating the agreement. The set spans genuinely different notions of "similar":

| Family | What it encodes |
| --- | --- |
| ECFP (extended-connectivity fingerprint) | circular environments around each atom |
| Atom pair, AP2D, SPFP | atom pairs indexed by topological distance |
| Pharmacophore (PHFP, PH2, PH3) | pharmacophoric features, as pairs and triplets |
| EState | electrotopological state |
| Graph FP | path and subgraph patterns |

These disagree by design. ECFP calls two molecules similar when their local neighbourhoods match; a pharmacophore fingerprint calls them similar when the *features that touch a protein* are arranged alike. Two molecules can be close under one and far under the other.

**Twist two: how much they agree is the signal.** Rather than averaging the representations into one score, the framework keeps them separate and computes an **agreement score** — how many representations independently recommend the same category. Predictions below a threshold are discarded.

The paper's rationale for keeping them separate is this. A consensus across representations that encode *different* notions of similarity is much stronger evidence than a high score under any one of them — and it converts an unanswerable question (which fingerprint is right?) into a usable one (do they agree?).

## Scale, and the rationale

Applied to **321,605 unannotated compounds**, of which **321,596** came back with something: roughly **2.89 million** predicted category assignments in total. Each prediction comes with its **most similar compound (MSC)** — the annotated molecule that drove it — so a human can check the reasoning rather than taking a score on faith.

## What it was measured against

Three baselines, on three tasks. **SD-ATC** predicts ATC classes from a kernel fingerprint by
network-based inference; **iSEA** averages similarity over three fingerprints; **EC1024** is plain
single-fingerprint nearest-neighbour lookup, included as the control that matters most. The ATC
benchmark is the 1,151 approved drugs from iSEA's own paper, of which 1,107 had a usable CID.

| | AgreementPred | EC1024 (MSC = 1) | EC1024 (MSC = 2) | iSEA | SD-ATC |
| --- | --- | --- | --- | --- | --- |
| ATC level 2 — recall | 0.670 | 0.523 | 0.601 | **0.748** | 0.671 |
| ATC level 2 — precision | 0.322 | **0.491** | 0.363 | 0.098 | 0.085 |
| ATC level 4 — recall | **0.529** | 0.369 | 0.459 | — | 0.478 |
| ATC level 4 — precision | 0.311 | **0.365** | 0.307 | — | 0.060 |
| AnnoCom1000 — recall | **0.772** | 0.607 | 0.685 | — | 0.374 |
| AnnoCom1000 — precision | 0.487 | **0.574** | 0.510 | — | 0.173 |

Against the published methods the margin is not close: **three to four times the precision** of
iSEA and SD-ATC at comparable recall. SD-ATC in particular falls apart on AnnoCom1000 (0.374 /
0.173), which is fair — it was built for ATC and this task is not ATC.

<mark class="blue">The column worth staring at is EC1024 at MSC = 1, which wins precision in all three tasks.
Fusing 22 representations buys recall and does not beat one good fingerprint on precision.</mark>
The paper claims superiority in the *balance* of the two, and that claim is exactly right — but it
is a narrower claim than "fusion is better", and the bolded cells in its own table say so.

Two caveats on the comparison itself. iSEA has no entry for the two harder tasks because it needs
a thousand similarity calculations per compound–class pair and does not scale to a label space of
this size; its one number was **quoted from the original paper rather than re-run**. And the
single-representation control is EC1024 at its best setting, which is the honest way to do it.

## What I would question

- **Agreement is still unweighted.** The r > 0.75 pruning handles near-duplicates, so the obvious objection is already answered. What remains is that the 22 survivors vote equally — a pharmacophore fingerprint and a path fingerprint count the same even though they disagree far more with each other than either does with a third circular fingerprint. Agreement among *distant* representations should be worth more, and nothing in the score says so.
- **The threshold trades recall for precision, and recall is the point.** Filtering raises precision, and what this is for is finding pharmacology nobody has recorded. The predictions that get filtered out are also where the novel ones live.
- **Validation is circular in the way similarity methods usually are.** Evaluated on annotated compounds, the method is scored on recovering labels that exist; the 321,605 compounds it is actually aimed at have no ground truth by construction. That is not a flaw the authors could fix, but it bounds what the numbers mean.

## Why I read it

It is the opposite approach to mine, on the same problem. I spend pre-training on **learning** a representation because no hand-built one is right. AgreementPred accepts that no single representation is right and **votes over many** instead.

Both are answers to "which representation?" — one by learning past the question, one by refusing to answer it. And the honest comparison is that the voting approach works today on data where mine has nothing to train on. A few thousand natural products with no pharmacological labels is not a pre-training corpus.

It also sharpened something about [fingerprints](../descriptors-fingerprints-en/). I had thought of the choice of fingerprint as a nuisance parameter to be swept. Treating the **spread across fingerprints as a quantity in its own right** had not occurred to me, and it is cheap to compute for any similarity-based claim. For a recommendation system meant to seed mechanistic studies I would take the per-prediction rationale over another point of accuracy.

## Summary

- Natural products have target-level activity data but almost no pharmacological-category labels, so supervised training has no foothold
- AgreementPred recommends by **similarity fused across 22 representations**, chosen from 29 evaluated — 28 fingerprints plus one learned embedding
- The fingerprints encode genuinely different notions of similarity, so they disagree by design
- The **agreement score** — how many representations independently agree — filters predictions, trading recall for precision
- Applied at scale: 321,605 compounds in, 321,596 with a recommendation, ~2.89M assignments, each carrying its most similar annotated compound as a rationale
- Labels come from six databases, and only **9,721 of 331,326 PubChem records** carried one — the premise restated as a number
- Against iSEA and SD-ATC the precision is **three to four times higher** at comparable recall; against a single good fingerprint it wins recall and **loses precision**
- Near-duplicate representations are pruned at r > 0.75, so what remains is that the survivors vote with equal weight
- The idea worth stealing: **spread across representations is itself a measurable quantity**

## References

- Sutcharitchan et al., [AgreementPred](https://doi.org/10.1039/d5dd00329f), *Digital Discovery* **4**(11) (2025) — the paper reviewed here
- Zhu et al., [NPASS: natural product activity and species source database](https://doi.org/10.1093/nar/gkx1026), *Nucleic Acids Res.* (2018)
- Bajusz, Rácz & Héberger, [Why is Tanimoto index an appropriate choice for fingerprint-based similarity calculations?](https://doi.org/10.1186/s13321-015-0069-3), *J. Cheminform.* (2015)
