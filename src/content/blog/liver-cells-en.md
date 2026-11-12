---
title: "What the liver is made of"
date: 2026-02-20
description: "The liver is not one kind of cell · the lobule, and why blood flows one way through it · the five cell types worth knowing and what each one does · zonation, where position changes a cell's job · what goes wrong in fatty liver disease, cell by cell"
category: concept
updated: 2026-03
lang: en
group: liver-cells
topic: Bioinformatics
subtopic: Cell biology
tags: [liver, MASLD, cell types, single-cell]
---

I came to this from the computational side: a project on aging and fatty liver disease, with a pile of liver RNA-seq to analyse. You cannot interpret a differential-expression result in liver without knowing which cells are in there and what each of them does.

## The liver as a mixture of cell types

A liver sample is a mixture. [Bulk RNA-seq](../bulk-vs-sc-en/) measures the average over that mixture, so when a gene goes up twofold, there are two very different explanations: **every cell made a bit more of it, or one small population made a great deal more.** In the liver that distinction is usually the whole finding, because the cell type that drives disease is often a minority of the cells present.

## The architecture

The liver's repeating unit is the **lobule**. Blood enters at the corners and drains to a vein in the middle, and everything is arranged around that flow.

<figure>
<img src="/assets/fig/liver-atlas-fig10.png" alt="Map of the human liver: the lobule, the portal triad, the central vein, and every cell type with its marker genes" width="1971" height="2399">
<figcaption><b>The map worth keeping.</b> Top: the liver, one lobule, and a slice through it. Bottom: that slice with every cell type labelled, and the marker genes used to identify each one in the legend. The <b>portal triad</b> (incoming blood plus the bile duct) is on the left, the <b>central vein</b> on the right, and blood runs between them through narrow channels called sinusoids.
<br><span class="credit">MacParland et al., <a href="https://doi.org/10.1038/s41467-018-06318-7"><i>Nat. Commun.</i> <b>9</b>, 4383 (2018)</a> &#183; paper figure, Figure 10</span></figcaption>
</figure>

Two things to take from that picture. Blood flows **one way**, from the portal triad to the central vein, so cells near the start see a different chemical environment from cells near the end. And the channel the blood runs through is not an ordinary blood vessel — it is lined with a leaky endothelium that lets plasma touch the liver cells directly.

## Five cell types, and what each does

| Cell | Share | Job | Markers |
| --- | --- | --- | --- |
| Hepatocyte | ~60–80% | the work: metabolism, detoxification, making proteins and bile | *ALB*, *APOA1*, *CYP* genes |
| LSEC (liver sinusoidal endothelial cell) | ~15–20% | lines the sinusoid; deliberately leaky, so plasma reaches hepatocytes | *CLEC4G*, *STAB2*, *LYVE1* |
| Kupffer cell (resident macrophage) | ~10–15% | the liver's own immune cell: eats debris and bacteria from the gut | *CD68*, *MARCO*, *CD5L* |
| Hepatic stellate cell (HSC) | ~1–5% | stores vitamin A when quiet; makes scar tissue when activated | *ACTA2*, *COL1A1*, *RBP1* |
| Cholangiocyte | ~1–3% | lines the bile duct and carries bile away | *KRT7*, *KRT19*, *EPCAM* |

Plus the passengers: T cells, NK (natural killer) cells, B cells, plasma cells, recruited monocytes. The liver has an unusually large resident immune population, because everything absorbed from the gut passes through it first.

<mark class="blue">The stellate cell is the one to remember.</mark> It is a few percent of the cells and does almost nothing visible in a healthy liver — and it is the cell that produces fibrosis, which is what determines outcome in chronic liver disease.

## Zonation: the same cell, a different job

Hepatocytes are not interchangeable. Where a hepatocyte sits along the blood flow changes which genes it expresses and which reactions it runs. This is **zonation**.

| | Zone 1 (periportal, blood arrives) | Zone 3 (pericentral, blood leaves) |
| --- | --- | --- |
| oxygen | high | low |
| makes glucose (gluconeogenesis) | yes | no |
| stores glucose (glycolysis, lipogenesis) | no | yes |
| drug metabolism (*CYP* enzymes) | low | high |
| damaged first by | toxins arriving in blood | low oxygen, paracetamol, fat |

Two practical consequences. Zone 3 carries most of the drug-metabolising enzymes, so **paracetamol damage shows up there first**. And fat accumulates in zone 3 too, which is why early fatty liver is described as pericentral.

For analysis: two hepatocyte clusters in your data may be zone 1 and zone 3 rather than two cell types, and calling them "hepatocyte subtypes" would be wrong.

## What that looks like as data

<figure>
<img src="/assets/fig/liver-atlas-fig2.png" alt="Quality filtering, clusters and the annotated t-SNE of 8,444 human liver cells" width="2014" height="2341">
<figcaption><b>From cells to labels.</b> <b>(a)</b> quality filtering first &mdash; cells with too few transcripts or too much mitochondrial RNA are dropped. <b>(c)</b> the 20 clusters, still anonymous. <b>(d)</b> marker genes per cluster, which is how the names get assigned. <b>(f)</b> the same map with the names on it. Note six separate hepatocyte clusters: those are mostly zonation, not six cell types.
<br><span class="credit">MacParland et al., <a href="https://doi.org/10.1038/s41467-018-06318-7"><i>Nat. Commun.</i> <b>9</b>, 4383 (2018)</a> &#183; paper figure, Figure 2</span></figcaption>
</figure>

That is the [clustering](../clustering-en/) workflow applied to a real tissue: filter, cluster, then name the clusters from their marker genes. The naming is the step that requires the biology above — the algorithm produces group 11 and group 13, and only the markers tell you one is periportal LSEC and the other is portal endothelium.

> The disease names and the two staging axes — steatosis grade and fibrosis stage — have [their own note](../masld-staging-en/).

## What goes wrong in fatty liver disease

MASLD — metabolic dysfunction-associated steatotic liver disease, previously NAFLD, non-alcoholic fatty liver disease — is now the most common chronic liver condition. It progresses in a sequence, and each step belongs to a different cell.

1. **Fat accumulates in hepatocytes.** More coming in than going out. On its own this is reversible and often harmless.
2. **Stressed hepatocytes signal distress** and some die. Zone 3 goes first.
3. **Kupffer cells react**, and monocytes are recruited from the blood. This is the switch from steatosis to steatohepatitis — fat plus inflammation.
4. **Stellate cells activate.** They stop storing vitamin A, turn into myofibroblast-like cells, and start laying down collagen.
5. **Fibrosis accumulates**, and if it continues, cirrhosis.

<mark>Fibrosis stage, not the amount of fat, is what predicts outcome.</mark> That is why so much MASLD work focuses on the stellate cell, a cell type that is a few percent of the sample and effectively invisible in bulk data.

It is also why the steps matter for analysis. A bulk comparison of diseased against healthy liver returns inflammation and collagen genes, which is true and tells you almost nothing — you cannot tell whether the stellate cells changed their behaviour or whether there are simply more of them. Separating those two requires [single-cell data](../bulk-vs-sc-en/), and comparing conditions on it requires [pseudobulk](../de-tools-en/).

## Things that bite you in liver data specifically

- **Hepatocytes are large and fragile.** They break during dissociation, so a droplet-based scRNA-seq (single-cell RNA-seq) run of liver is typically depleted of exactly the cell type that makes up most of the tissue. This is why liver work increasingly uses single-nucleus RNA-seq instead.
- **Ambient RNA is albumin.** Hepatocytes that burst release enormous amounts of *ALB*, which then contaminates every other cell. An immune cell that appears to express albumin is almost always contamination, not biology.
- **Stellate cells are rare and will be missed** unless you enrich or sequence deeply.
- **Zonation looks like cell types.** Expect hepatocyte clusters to split by zone, and check *CYP2E1* (zone 3) against *PCK1* (zone 1) before naming them.

## Summary

- The liver is a mixture, and in disease the driving cell type is usually a **minority** of it
- The lobule is the repeating unit: blood runs one way from the **portal triad** to the **central vein**
- Five cell types carry the story: hepatocyte, LSEC, Kupffer cell, **stellate cell**, cholangiocyte
- **Zonation** means position changes a hepatocyte's job — zone 1 makes glucose, zone 3 metabolises drugs and accumulates fat first
- MASLD goes fat → stress → inflammation → stellate activation → fibrosis, one cell type per step
- **Fibrosis stage predicts outcome**, and fibrosis comes from a cell that is a few percent of the sample
- Liver data specifically: hepatocytes break (use nuclei), albumin contaminates everything, and zonation masquerades as cell types

## References

- MacParland et al., [Single cell RNA sequencing of human liver reveals distinct intrahepatic macrophage populations](https://doi.org/10.1038/s41467-018-06318-7), *Nat. Commun.* **9**, 4383 (2018) — the atlas both figures come from
- Ben-Moshe & Itzkovitz, [Spatial heterogeneity in the mammalian liver](https://doi.org/10.1038/s41575-019-0134-x), *Nat. Rev. Gastroenterol. Hepatol.* (2019) — zonation
- Loomba, Friedman & Shulman, [Mechanisms and disease consequences of nonalcoholic fatty liver disease](https://doi.org/10.1016/j.cell.2021.04.015), *Cell* (2021)
