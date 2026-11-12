---
title: "Senescence and SASP: the cells that stop dividing but keep signalling"
date: 2026-04-24
description: "A cell that arrests permanently but refuses to die, and then secretes · why SASP makes senescence a tissue problem rather than a cell problem · why there is no single marker · SenMayo and the gene sets · and what it does in a fatty liver"
category: concept
updated: 2026-05
lang: en
group: sasp
topic: Bioinformatics
subtopic: Cell biology
tags: [senescence, SASP, aging, MASLD]
---

My project is aging and liver disease, and the two meet at one cell state.

A cell that takes enough damage has three options: repair, die, or stop dividing permanently. The third is senescence. It sounds like a safe outcome — a damaged cell that cannot become a tumour — and it would be, except that the arrested cell does not go quiet. It starts secreting a cocktail of inflammatory signals called the SASP — the senescence-associated secretory phenotype — and those signals change the behaviour of everything around it. That is why a small number of senescent cells can drive a tissue-level disease.

## Why cells do this at all

Senescence is not a failure mode; it is a programme.

| Where it is useful | What it does |
| --- | --- |
| Tumour suppression | a cell with damaged DNA arrests instead of dividing with the damage |
| Wound healing | transient senescent cells recruit immune cells and help remodelling, then are cleared |
| Development | programmed senescence shapes some embryonic structures |

In each case the arrest is **temporary in effect** — the immune system clears the senescent cell afterwards. The pathology is what happens when clearance fails. With age, senescent cells accumulate because immune surveillance declines at the same time as the damage increases, and the transient signal becomes a permanent one.

## The SASP: what a senescent cell does to its neighbours

<figure>
<img src="/assets/fig/masld-senescence-f2.jpg" alt="Senescent hepatocytes releasing SASP factors and the effects on surrounding cells" width="1504" height="1137">
<figcaption><b>Why a few cells matter.</b> Senescent cells secrete cytokines, chemokines, proteases and growth factors. Those act on neighbours — recruiting immune cells, activating fibroblast-like cells, and pushing nearby healthy cells into senescence themselves.
<br><span class="credit">Sung et al., <a href="https://doi.org/10.1097/HC9.0000000000001055"><i>Hepatol. Commun.</i> <b>10</b>, e01055 (2026)</a> &#183; paper figure, Figure 2</span></figcaption>
</figure>

The **SASP** is the set of things a senescent cell releases:

- inflammatory cytokines — IL-6, IL-1β, IL-8
- chemokines — CXCL1, CXCL2, recruiting immune cells
- matrix proteases — MMPs (matrix metalloproteinases), which remodel the tissue around them
- growth factors — including ones that push neighbouring cells towards senescence

<mark>This is what makes senescence a tissue problem rather than a cell problem.</mark> An arrested cell that merely sat there would be harmless at 1% of a tissue. One that secretes IL-6 and recruits macrophages is not, and the **bystander effect** — senescent cells inducing senescence in healthy neighbours — means the population grows without new damage.

It also explains why the field talks about removing them. **Senolytics** kill senescent cells selectively; **senomorphics** leave the cells but suppress the SASP. Two different bets about whether the arrest or the secretion is the problem.

## There is no single marker

This is the part that bites in analysis.

| Marker | What it is | Why it is not enough |
| --- | --- | --- |
| p16 (*CDKN2A*) | cell-cycle inhibitor | lowly expressed; also induced without senescence |
| p21 (*CDKN1A*) | cell-cycle inhibitor | transient in ordinary stress responses too |
| SA-β-gal (senescence-associated β-galactosidase) | lysosomal activity stain | histology only, and not specific |
| lamin B1 loss | nuclear envelope | a decrease, so needs a reference |
| γH2AX | DNA damage foci | marks damage, not arrest |

<mark class="blue">No single one of these identifies a senescent cell, so senescence is scored as a **combination** — which means it is scored as a gene set, with all the problems that brings.</mark>

The sets in use:

| Set | What it is |
| --- | --- |
| SenMayo | 125 genes, weighted toward the SASP, built and validated for single-cell data |
| SHGS (senescent hepatocyte gene signature) | 100 genes, obtained by inducing senescence in hepatocytes rather than curating the literature — liver-specific. The paper scores it with [GSVA (gene set variation analysis)](../gene-sets-en/) on bulk |
| CellAge | 866 curated manipulations, each a gene shown to drive or block senescence — a causal list, not an expression signature |
| Reactome / MSigDB senescence sets | pathway-derived, broader and noisier |

SenMayo is the one designed for the job — its emphasis on secreted factors rather than arrest markers is deliberate, because the SASP genes are more highly expressed and survive dropout better than *CDKN2A* does.

## Not all of these are the same kind of list

<mark>SenMayo and SHGS are **expression signatures**: genes that go up in a senescent cell, so a cell can be scored against them. CellAge is a **causal list**: genes that, when knocked down or overexpressed, push a cell into or out of senescence.</mark>

Many causal genes are not themselves induced — a tumour suppressor can be required for the arrest without changing its own expression level. So scoring cells against CellAge answers something closer to *could this cell become senescent* than *is it*, and treating it as a third scoring set is the mistake to avoid. It belongs in the interpretation step, not the scoring step.

**SHGS is the one closest to my own data**, because it was not curated from papers: senescence was induced in hepatocytes in vitro and in vivo and the 100 differentially expressed genes that survived were kept. That makes it small, liver-specific, and biased toward the late senescent state — which is also its limitation, since none of that transfers to another tissue.

## In a fatty liver

<figure>
<img src="/assets/fig/masld-senescence-f1.jpg" alt="Metabolic stress driving hepatocyte senescence in MASLD" width="1600" height="738">
<figcaption><b>The route in.</b> Free fatty acids accumulate, the resulting stress damages hepatocytes, and damaged hepatocytes arrest rather than divide — which is also why a steatotic liver regenerates poorly.
<br><span class="credit">Sung et al., <a href="https://doi.org/10.1097/HC9.0000000000001055"><i>Hepatol. Commun.</i> <b>10</b>, e01055 (2026)</a> &#183; paper figure, Figure 1</span></figcaption>
</figure>

In MASLD (metabolic dysfunction-associated steatotic liver disease) the sequence connects directly to [what the liver is made of](../liver-cells-en/) and to [staging](../masld-staging-en/):

1. Fat accumulates in hepatocytes; lipotoxic stress damages them.
2. Damaged hepatocytes arrest instead of dividing — so the liver's regenerative capacity falls at the moment it is needed.
3. Those senescent hepatocytes secrete the SASP.
4. SASP factors recruit immune cells and activate hepatic stellate cells.
5. Activated stellate cells lay down collagen — [fibrosis](../masld-staging-en/), which is the axis that predicts outcome.

So senescence is a plausible mechanistic link between aging and fibrosis progression.

## What bites in the data

- **A senescence score in scRNA-seq (single-cell RNA sequencing) is unreliable per cell.** *CDKN2A* is lowly expressed and is dropped by dropout. Scores are only interpretable aggregated — per cell type, per sample.
- **A SASP-weighted set scores inflammation.** SenMayo is heavy on secreted inflammatory factors, which is what makes it detectable and also what makes it hard to separate from any other inflammatory state. A high SenMayo score in inflamed tissue is not by itself evidence of senescence.
- **Senescence is a state, not a type.** It will not come out as its own cluster. It is a gradient within hepatocytes, within stellate cells, within macrophages — which is a [clustering](../clustering-en/) problem, not a cell-type-annotation problem.
- **Proliferation markers are the obvious negative control** and are often missing. A senescent cell must not be cycling; checking *MKI67* costs nothing.

## Summary

- Senescence is **permanent cell-cycle arrest without death** — useful against tumours and in wound healing, pathological when clearance fails
- The **SASP** is what the arrested cell secretes: cytokines, chemokines, proteases, growth factors
- SASP makes senescence **non-cell-autonomous** — a small population changes the whole tissue, and the bystander effect grows it
- **No single marker is definitive**, so senescence is scored as a gene set — SenMayo and SHGS are expression signatures you can score a cell against; **CellAge is a causal list and is not one**
- SenMayo weights secreted factors on purpose, because they survive dropout where *CDKN2A* does not
- In MASLD: lipotoxic stress → hepatocyte arrest → SASP → stellate activation → fibrosis
- Score it aggregated, not per cell; check proliferation as a negative control; and remember a SASP score is partly an inflammation score

## References

- Sung et al., [Hepatocyte senescence in metabolic dysfunction-associated steatotic liver disease](https://doi.org/10.1097/HC9.0000000000001055), *Hepatol. Commun.* **10** (2026) — the figures above
- Saul et al., [A new gene set identifies senescent cells and predicts senescence-associated pathways across tissues](https://doi.org/10.1038/s41467-022-32552-1), *Nat. Commun.* (2022) — SenMayo
- Du et al., [Targeting senescent hepatocytes for treatment of metabolic dysfunction-associated steatotic liver disease and multi-organ dysfunction](https://doi.org/10.1038/s41467-025-57616-w), *Nat. Commun.* **16**, 3038 (2025) — SHGS
- Avelar et al., [A multidimensional systems biology analysis of cellular senescence in aging and disease](https://doi.org/10.1186/s13059-020-01990-9), *Genome Biol.* **21**, 91 (2020) — CellAge
- Gorgoulis et al., [Cellular senescence: defining a path forward](https://doi.org/10.1016/j.cell.2019.10.005), *Cell* (2019) — why no single marker works
