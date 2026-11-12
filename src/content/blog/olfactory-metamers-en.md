---
title: "A distance for smell, and the metamers it predicts"
date: 2024-07-19
description: "Twenty-one physicochemical descriptors collapsed into a single angle, fitted on 49,788 similarity judgements — close enough that two mixtures with no molecules in common can be built to smell the same."
category: review
updated: 2024-08
lang: en
topic: Cheminformatics
subtopic: Representation
venue: Nature
venueYear: 2020
group: olfactory-metamers
tags: [review, molecular representation, similarity, perception]
---

> Ravia, Aharon, et al. "A measure of smell enables the creation of olfactory metamers." *Nature*, vol. 588, no. 7836, 2020, pp. 118–123, [doi.org/10.1038/s41586-020-2891-7](https://doi.org/10.1038/s41586-020-2891-7).

## What the paper is after

Vision and hearing are **digitised**. We can state a colour as three numbers and reproduce it on any screen, because perception was mapped onto physical structure well enough to define a distance. Smell has never had that, and the obstacle is that no one could say what "distance" means between two odours.

The specific target is a **metamer**: two stimuli that are physically different and perceptually identical. In vision they are routine — every colour on a screen is a metamer of a spectrum. <mark>The claim here is that two odour mixtures with no molecules in common can be built to smell the same.</mark> You cannot do that without a working distance.

## The measure

Each odorant is a vector in a space of **21 physicochemical descriptors**, and the distance between two is the **angle** between their vectors, in radians. A single number, from structure alone. Every correlation here is negative by construction: the model returns a distance and people report a similarity, so a wider angle should mean less alike.

The paper's step forward is about **intensity**. The earlier version of this model worked on laboratory mixtures where all components were at matched perceived intensity, and degraded on real-world mixtures where they are not:

| | Correlation with human similarity |
| --- | --- |
| matched-intensity components | r = −0.57 |
| real-world, varying intensity | r = −0.48 |
| excluding identical-mixture comparisons | r = −0.50 matched, −0.30 real-world |

The last row removes comparisons of a mixture with itself. Those sit at zero distance and perfect similarity, so they prop up the correlation; without them the real-world model falls to r = −0.30.

The fix is to weight each component's contribution by its **perceived intensity**, through a sigmoidal function, fitted once to find universal parameters (α = −1.3, β = 0.07) that maximise the correlation between vector length and perceived intensity across all single molecules. Intensity is measured, not predicted — they tried predicting it from structure, succeeded for some molecules and not others, and dropped it.

## Generalisation to unseen molecules

Experiment 2 repeated the design on **44 molecules never used before**, forming 14 new mixtures. Nothing was refitted.

| | old model | new model | change |
| --- | --- | --- | --- |
| all comparisons | r = −0.58 | r = −0.76 | correlation ×1.3, variance explained ×1.7 |
| excluding identical pairs | r = −0.38 | r = −0.69 | correlation ×1.8, variance explained ×3.3 |

<figure>
<img src="/assets/fig/olfactory-fig2.jpg" alt="Scatter plots of perceived similarity against angle distance for the old and the intensity-weighted model" width="1062" height="956" loading="lazy">
<figcaption><b>The four numbers in the table above, as they look.</b> Perceived similarity against angle distance, on the 44 molecules the model had never seen. <b>(b)</b> is the old model and <b>(c)</b> the intensity-weighted one; in each, red is all comparisons and black is the same analysis with identical-mixture pairs removed. The black line is the one to read — it goes from <i>r</i> = &minus;0.38 to &minus;0.69 without anything being refitted. <b>(d)</b> is experiment 3: predicted against rated similarity for the three perfumer mixtures.
<br><span class="credit">Ravia et al., <a href="https://doi.org/10.1038/s41586-020-2891-7"><i>Nature</i> <b>588</b>, 118&ndash;123 (2020)</a> &#183; paper figure, Figure 2</span></figcaption>
</figure>

<mark>A model usually does worse on data it was not fitted on. This one did better.</mark> Parameters found on experiment 1 transferred unchanged to a disjoint molecule set.

Experiment 3 is the demonstration. A master perfumer supplied formulas for **rose, violet and asafoetida**; participants rated component intensities; the model predicted pairwise similarity from structure and intensity alone; then 31 people smelled the mixtures.

| Pair | Predicted | Observed | |
| --- | --- | --- | --- |
| violet–rose | 0.75 ± 0.05 | 0.79 ± 0.18 | P = 0.81 |
| rose–asafoetida | 0.26 ± 0.05 | 0.21 ± 0.17 | P = 0.79 |
| violet–asafoetida | 0.32 ± 0.05 | 0.24 ± 0.20 | P = 0.69 |

Predictions made before anyone smelled anything, matching to within the noise.

## Making the metamers

Experiments 1 to 3 build and validate the distance. The remaining four spend it, and this is the
part the title is about — the whole study runs to **199 participants over about four years**.

First the distance has to be calibrated in perceptual units, which means finding the **just-noticeable
difference** (JND): how far apart in radians two mixtures must be before anyone can tell them apart.
Experiment 4 built 100 new mixtures and ran 50 pairwise comparisons, ten times each, at 0.0125,
0.025, 0.05, 0.2 and 0.4 radians. Combined with earlier data the JND lands between **0.0125 and
0.05 radians, averaging 0.026**.

Then the payoff. Experiment 6 put 25 participants through **8,000 trials** of a same–different
task on 40 pairs separated by 0.0125 to 0.2 radians, with intensity cues equalised so nothing but
quality could be used. <mark class="blue">Below the JND, people could not tell the mixtures apart —
including pairs built to share no molecules at all.</mark> That is a metamer in the strict sense: two
physically disjoint stimuli that are perceptually the same, which is what vision has had since
trichromacy and smell has not.

Experiment 7 then asks whether the group result hides individual variation, since a group failing
to discriminate does not mean every person failed.

## What I would question

- **r = 0.76 squares to 0.58, so 42% of the variance is unexplained.** The authors answer this by noting that colour and auditory similarity carry comparable variability in human judgements, which is a fair comparison and still means the measure is a population average. It says little about any individual nose.
- **Intensity has to be measured.** The model needs perceived intensity per component, which is a psychophysics experiment, not a calculation. The attempt to predict it from structure partly worked and was abandoned — so the pipeline is not structure-to-percept end to end, which is how it is easy to read it.
- **Twenty-one descriptors, chosen in advance.** The space is hand-built, as [molecular descriptors](../descriptors-fingerprints-en/) always are. It works, which raises the question of whether a learned representation would do better or whether the hand-built one is carrying a prior that a learned one would have to rediscover from data nobody has.

## Why I read it

It was background for the [2024 DREAM olfactory challenge](../../research/), and it is the cleanest demonstration I know of something I spend most of my time on: **turning a molecule into a vector such that distance means something.**

The difference is what the distance is validated against. In [property prediction](../mpp-en/) a representation is judged by whether a model on top of it predicts a measured endpoint. Here it is judged against **human perceptual similarity**, which is noisier, more expensive and far more direct — there is no model in between to absorb the error.

The result worth carrying is the generalisation. A 21-dimensional hand-built space, with one intensity correction and two universal parameters, transferred to an unseen molecule set and got *better*. That is not what an overfitted descriptor space does, and it is a reminder that a small, well-chosen representation can beat a large learned one when the data to learn from does not exist.

## Summary

- Vision and hearing are digitised because perception was mapped to structure; smell had no working distance
- Each odorant is a vector of 21 physicochemical descriptors; distance is the angle between them
- The advance is weighting each component by perceived intensity through a sigmoid, with two universal parameters
- Removing self-comparisons shows the old model's real performance: r = −0.30 on real-world mixtures
- On 44 unseen molecules the new model reached r = −0.76, better than on the data it was fitted on
- A perfumer's rose, violet and asafoetida were predicted before anyone smelled them, matching within noise
- Below about 0.05 radians two mixtures are indiscriminable — a metamer, with no molecules in common

## References

- Ravia et al., [A measure of smell enables the creation of olfactory metamers](https://doi.org/10.1038/s41586-020-2891-7), *Nature* **588** (2020) — the paper reviewed here
- Snitz et al., [Predicting odor perceptual similarity from odor structure](https://doi.org/10.1371/journal.pcbi.1003184), *PLoS Comput. Biol.* (2013) — the earlier model this improves
- Lee et al., [A principal odor map unifies diverse tasks in olfactory perception](https://doi.org/10.1126/science.ade4401), *Science* (2023) — the learned-representation counterpart
