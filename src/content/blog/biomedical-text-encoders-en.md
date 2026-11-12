---
title: "Reading what is written about a drug"
date: 2026-11-12
description: "Prose about a compound carries pharmacology its structure does not · where the text comes from · the label leakage waiting in an indication field · the encoder lineage from BioBERT onward · what BLURB settles and what it cannot · which checkpoint to reach for · and whether decoder LLMs replaced any of this"
category: concept
updated: 2026-11
lang: en
group: biomedical-text-encoders
topic: Bioinformatics
subtopic: Representation
tags: [BioBERT, text embeddings, drug repurposing, label leakage]
---

Two different things get called chemical language models. One is [the molecule written as a string](../chemical-language-models-en/) — a re-encoding of the structure, nothing added. The other is the prose people have written about the compound: what it is used for, how it is thought to work, what goes wrong when patients take it, and thousands of abstracts.

This note is about the second. It is a different input with a different failure mode, and the failure mode is the interesting part — <mark class="blue">text is the input most likely to quietly hand the model its own label.</mark>

## Where the text comes from

| source | what the text is |
| --- | --- |
| DrugBank | curated prose per drug — indication, pharmacodynamics, mechanism of action, interactions |
| SIDER | side-effect terms read off drug labels, coded to a vocabulary |
| DisGeNET | gene–disease associations, scored, drawn from curation and from text mining |
| PubMed abstracts | the raw literature, and the corpus the biomedical encoders are pretrained on |

Several of these sit on the [databases page](../databases/) with their scale and access terms.

## What text buys that structure does not

It carries **pharmacology**, which a structure does not state.

Two drugs built on unrelated scaffolds, prescribed for the same condition, are far apart in fingerprint space and close together in text — because the sentences written about them are nearly the same sentences. That similarity is not derivable from the atoms. It is exactly the signal a [repurposing](../repurposing-en/) method wants, and it is the honest reason to add a text view rather than a second structural one.

## The trap: the label is in the input

Encode DrugBank's indication text, then train a model to predict therapeutic category. The score will be excellent, and it means nothing: **the text says what the drug is used for.**

This is label leakage wearing the clothes of representation learning. It is easy to miss because nothing about the pipeline looks wrong — a corpus, an encoder, a fine-tuning step, a held-out test set. The leak is not in the procedure, it is in the fields.

Three ways to keep it honest:

- **Strip the fields that state the outcome.** If the target is indication, the indication and mechanism text cannot be in the input. Dropping only the exact phrase is not enough — a mechanism sentence usually names the disease anyway, and when one study deleted every intervention-identifying field from a trial protocol, a language model still recovered the drug class 45% of the time.
- **Hold out by drug**, never by sentence, or the same drug's prose appears on both sides of the split.
- **Ablate the text.** Remove the indication sentences and retrain. If performance collapses to nothing, the model had been reading the answer; if it holds up, there was a representation underneath. This is the same reflex as the label shuffle in the [leakage checklist](../evaluation-protocol-en/).

## Named in 2026 — for genes and for trials, not yet for drugs

Until this year the failure had been measured but never called a validity threat. Three studies from 2026 name it, and they disagree about how big it is — which is the useful part.

**Gene summaries.** The Alliance of Genome Resources turns Gene Ontology annotations into sentences, NCBI Gene displays them, and a gene-embedding model takes them as input. Those summaries cover 6,172 of 19,256 human protein-coding genes. Embedding the same corpus without them and refitting the probe cut per-gene AUROC by **0.078** among genes with one to ten publications (95% bootstrap interval 0.072–0.084). A plain TF-IDF encoder benefited from the summaries too, which rules out encoder sophistication as the explanation.

**Trial protocols.** An intervention-blind test withheld every field identifying which drug was tested, then asked what survived in the remaining text: a language model recovered the withheld drug class **45% of the time**. The authors treat their own measurement as a lower bound because of it.

**Oncology trial abstracts, and a measurement that comes out small.** The one peer-reviewed study of the three took 250 two-arm oncology trials and removed the evidence in stages. On title plus abstract the models scored 0.96–0.97; on the title alone, 0.79–0.88; on **the DOI alone**, 0.63–0.67 against a 58.4% majority baseline. So an identifier does carry signal, and the authors call it limited. Then they flipped the outcome sentence to contradict the real result, and the models followed the flipped text at 0.96–0.99. On that task the model was mostly reading, not recognising.

Taken together: the leak is real, it is measurable, and its size is a property of the dataset rather than a constant. <mark>What does not vary is that deleting the field which states the answer does not delete the answer.</mark>

The drug case — DrugBank's description, indication and pharmacodynamics fields against therapeutic class or mechanism of action — has not been audited. The method is fully specified by the gene paper: embed the corpus with and without the outcome-bearing fields, refit the probe, report the per-drug delta stratified by how much has been written about each compound, and include a TF-IDF control.

Before this year, the mechanism had been measured twice on the drug side and reported as a finding rather than a problem.

**In a prompt.** A benchmark of large language models across eight chemistry tasks found GPT-4 scoring F1 **0.977** on HIV activity prediction — then noted that the prompt contained the phrase *inhibit HIV replication*. Stripping the label semantics out of the prompt dropped it to **0.554**, and accuracy from 0.986 to 0.628. The paper lists this among its discoveries, phrased as property prediction being easier when label semantics are in the prompt.

**In a database field.** A knowledge-graph model that added DrugBank free text as node features was asked to predict a drug's ATC (anatomical therapeutic chemical) class. Its own error analysis works the example: cidofovir's description calls it *an injectable antiviral medication*, the correct class is *direct acting antivirals*, and the text model ranks the right answer 1st where the structure-only model ranks it 25th. Also framed as the text helping.

The nearest thing to a published critique argues that indication is simply the wrong prediction target, because the features encode it — a model whose only input is **which** target proteins have any affinity data at all predicts a 14-class therapeutic category at 47.3% against 7.14% for chance ([Kim et al.](https://proceedings.mlr.press/v209/kim23a.html), CHIL 2023).

What the field does mitigate is narrower than the problem. The standard precaution, in molecule-text work, is to replace the molecule's **name** with the words "The molecule" — which removes the name and leaves any sentence stating its class or role completely intact. And an uncontrolled instance is easy to find: a 2025 paper predicts drug–side-effect pairs at AUC 0.915 from the cosine similarity between a biomedical BERT embedding of the **drug name** and one of the **side-effect term**, with no structure in the model at all, over a corpus of PubMed abstracts that state those very relationships.

So this sits inside the *illegitimate feature* class of the general leakage taxonomy, and the drug-description species of it is the one nobody has audited.

## So does adding text actually help prediction?

Barely, and the one place it reliably helps is the place you should look at hardest.

The cleanest published comparison puts task-specific models beside instruction-tuned language models on the same six MoleculeNet sets:

| | ESOL (RMSE) | Lipophilicity (RMSE) | BBBP (acc) | ClinTox (acc) | HIV (acc) | SIDER (acc) |
| --- | --- | --- | --- | --- | --- | --- |
| task-specific model | **0.819** | **0.612** | 85.3 | 92.4 | 97.0 | 70.0 |
| GPT-4 | 2.570 | 1.545 | 62.9 | 50.0 | 59.6 | 57.6 |
| best instruction-tuned 7B | 1.150 | 1.010 | 74.6 | 93.1 | 96.7 | 70.7 |

Read the columns, not the rows. Where the text model matches or edges ahead — ClinTox, HIV, SIDER — those are accuracies on heavily imbalanced binary sets, sitting near what predicting the majority class would give you, which is exactly the number [a bad metric choice hides](../metrics-en/). The two columns that cannot be gamed that way are the two regression RMSEs, and there the text model is **40 to 65% worse** and GPT-4 two and a half to a little over three times worse.

A controlled comparison of representations points the same way: a plain ECFP4 fingerprint with a small network beat both graph pretraining and an LLM-written-text representation outright on SIDER and BACE, and the text method's headline ClinTox win carried a standard deviation of **±17.63** — wide enough to contain the graph-pretraining baselines it was compared against.

Which brings the argument back round. The one reproducible "text helps property prediction" result in this literature is concentrated on **ClinTox** — MoleculeSTM reports its large gain there on its graph branch and close to nothing elsewhere. ClinTox is 1,478 molecules whose label is clinical-trial failure, and whose negatives are approved drugs: precisely the molecules whose DrugBank and PubChem text describes them as approved. That is the indication field again, one dataset down.

I have not found a paper that runs the ablation separating the two explanations. Until someone does, the field's headline evidence that text teaches chemistry is equally consistent with text restating the label on a small, imbalanced set.

One adjacent 2026 result is worth the scope it comes with. A [task-conditioned encoder](https://arxiv.org/abs/2602.04696) was given the correct natural-language description of each toxicity task, then a randomly chosen one: AUROC fell from **97.5** to **92.4**, and a random out-of-distribution string scored 92.5 — no better than the in-distribution one. The spreads overlap at one standard deviation, so read it as a direction rather than a clean separation. So roughly five points sat in the *meaning* of the text rather than in having a conditioning vector at all. That is a clean demonstration, but note what the text was — a description of the task, not prose about the compound.

## Where text is used, task by task

Property prediction is not where this technique mostly lives. Counting papers, prose about a drug is used most in **drug–drug interaction** and in **repurposing**. In property prediction the "text" is almost always a *molecule caption* — a PubChem record description or an LLM-written paragraph — rather than clinical drug prose. In adverse-event prediction, per-drug prose is nearly absent.

What matters is which papers **remove the text and report what happens**. Most do not. These do:

| task | paper | what the ablation shows |
| --- | --- | --- |
| zero-shot DDI | [TextDDI](https://doi.org/10.18653/v1/2023.emnlp-main.918), EMNLP (2023) | drug ID only F1 21.1 → name only 42.1 → truncated prose 48.0 → selected prose **52.5** |
| side effects | [PromptSE](https://doi.org/10.1038/s41598-026-55667-7), *Sci. Rep.* **16** (2026) | text is worth **+0.131** AUPR with no molecular features and **+0.007** once they are added, and two of four metrics get worse |
| repurposing | [Asada et al.](https://doi.org/10.3389/frma.2021.670206), *Front. Res. Metr. Anal.* **6** (2021) | text **hurt** DistMult's macro-averaged MRR in all three injection modes and TransE in two of three, and no-text was best on four of the eight relations |
| repurposing | [LLaDR](https://doi.org/10.18653/v1/2025.findings-emnlp.751), Findings of EMNLP (2025) | +0.057 to +0.076 MRR at a fixed backbone, degrading as more of the text is masked |
| property prediction | [MolCap-Arena](https://arxiv.org/abs/2411.00737), ICLR workshop (2025) | the best captioner adds 2.03 ROC-AUC over a text-free graph network — and an **empty-caption control scores 82.97 against the graph model's 82.96** |
| DDI | [Im & Ko](https://doi.org/10.3390/biomedicines13102355), *Biomedicines* **13** (2025) | text alone 0.9584 beats structure alone 0.9495; together 0.9655 |
| repurposing | [HeTDR](https://doi.org/10.1016/j.patter.2021.100307), *Patterns* **2** (2021) | removing the BioBERT text features costs 0.043 AUROC |
| side effects | [HMMF](https://doi.org/10.1186/s12859-024-05806-6), *BMC Bioinform.* **25** (2024) | dropping **structure** costs almost nothing — 0.9412 against the full model's 0.9428 |
| DDI | [Shtar et al.](https://doi.org/10.1186/s12859-022-05083-1), *BMC Bioinform.* **23** (2022) | text loses on the full dataset, 0.78 against 0.79 AUC, and wins on drugs with fewer than three known interactions, 0.76 against 0.63 |

One pattern runs through all of it. <mark>Text pays when structure is missing or the compound is unseen</mark> — zero-shot, cold-start, a drug with no interaction record — and the payment shrinks or reverses once molecular features are in the model.

The empty-caption control is the sharpest single number here. A fusion model with **nothing** in its text channel scores what the plain graph model scores, which means any reported gain has to come from the words rather than from the extra parameters — and most reported gains have never been tested that way.

The experiment that would settle the argument is still missing: **no paper reports a with-and-without-text ablation under a cold-start or scaffold split.** The papers that run cold-start experiments run their ablations warm.

One last thing to watch in this literature. Several of its most-cited papers do not use prose at all. DeepDDI takes drug names and structures and *generates* its sentences as output. DDIMDL uses structured feature tables. Decagon uses binary side-effect indicators. More than one model calls SMILES "text". Check what actually went into the model before citing it as evidence about language.

## Beyond interactions: where it loses, and where nobody has tried

Outside property prediction, interactions and repurposing, the picture is less flattering than the volume of papers suggests.

| task | what the evidence supports |
| --- | --- |
| assay-description text for binding affinity | **the best-supported case** — three independent with-and-without-text ablations, all positive and all modest |
| clinical trial outcome | contested; the one clean ablation finds the eligibility criteria freely removable, with only the brief summary carrying signal |
| protein-description text for function transfer | gains are large, and the input text paraphrases the label |
| pharmacovigilance narratives | **not supported** — see below |
| target prioritisation from literature | **not supported** — see below |
| ADMET and pharmacokinetics from prose | **no qualifying work exists** |

Two of those deserve their numbers.

**Pharmacovigilance.** Across roughly thirty candidate papers there are three admissible comparisons of narrative text against the coded fields of the same reports. The best-measured one classifies possible Guillain–Barré cases: narrative text reaches **AUC 0.777** where the MedDRA-coded approach reaches **0.904**. Text loses by 0.127, and the paper's own conclusion is that signs and symptoms alone are not sufficient for case classification — preferable only when specificity is the priority.

**Target prioritisation.** One study scored its language model's gene rankings against raw PubMed publication frequency: Spearman **ρ = 0.795** with no retrieval at all, against a validation benchmark carrying the same bias at ρ = 0.802. A model that has retrieved nothing ranks genes about as well as counting papers does, judged against a reference built from those papers. That is the literature bias above, measured.

And the empty cell is worth saying out loud. Nobody has published prose-as-input work for ADMET or pharmacokinetics. If that is where you wanted a drug's description to earn its place, there is no precedent to follow and no baseline to beat.

## Two limits that do not go away

**Literature bias.** A well-studied drug has more text, so text coverage tracks how much attention a compound has received rather than how it behaves. This is the [same complaint that applies to GO (Gene Ontology) annotations](../gene-sets-en/): a famous entry looks well-connected partly because it is famous.

**A novel compound has no text at all.** The prose exists because the drug has been studied, approved, prescribed and written up — which is the opposite of the case where a prediction would change a decision. A text view is strongest exactly where it is least needed, and silent on the scaffold that came out of a screen last week. The [structure view](../descriptors-fingerprints-en/) has no such gap: every molecule has a structure.

## The lineage

You do not pretrain this from scratch. You start from a biomedical encoder, and the lineage is short enough to hold in your head.

| model | venue | corpus and approach | weights |
| --- | --- | --- | --- |
| [SciBERT](https://doi.org/10.18653/v1/D19-1371) | EMNLP-IJCNLP (2019) | 1.14M Semantic Scholar papers, 3.17B tokens, mostly biomedical; **own vocabulary, from scratch** | `allenai/scibert_scivocab_uncased` |
| [ClinicalBERT](https://doi.org/10.18653/v1/W19-1909) | Clinical NLP Workshop at NAACL (2019) | about 2 million MIMIC-III notes, continued from BioBERT | `emilyalsentzer/Bio_ClinicalBERT` |
| [BlueBERT](https://doi.org/10.18653/v1/W19-5006) | BioNLP Workshop at ACL (2019) | PubMed plus MIMIC-III; introduced the **BLUE** benchmark | `bionlp/bluebert_pubmed_mimic_uncased_L-12_H-768_A-12` |
| [BioBERT](https://doi.org/10.1093/bioinformatics/btz682) | *Bioinformatics* **36** (2020) | general BERT, pretraining **continued** on 4.5B words of PubMed and 13.5B of PMC, keeping BERT's original vocabulary | `dmis-lab/biobert-base-cased-v1.2` |
| [PubMedBERT](https://doi.org/10.1145/3458754) | *ACM Trans. Comput. Healthc.* **3** (2021) | 14M PubMed abstracts, about 3.2B words, pretrained **from scratch with an in-domain vocabulary**; introduced **BLURB** | `microsoft/BiomedNLP-BiomedBERT-base-uncased-abstract-fulltext` |
| [SapBERT](https://doi.org/10.18653/v1/2021.naacl-main.334) | NAACL (2021) | metric learning over every UMLS synonym surface form | `cambridgeltl/SapBERT-from-PubMedBERT-fulltext` |
| [LinkBERT](https://doi.org/10.18653/v1/2022.acl-long.551) | ACL (2022) | the same PubMed corpus **plus citation links**, so a paper is seen beside the papers it cites | `michiyasunaga/BioLinkBERT-base` |
| [GatorTron](https://doi.org/10.1038/s41746-022-00742-2) | *npj Digit. Med.* **5** (2022) | over 82 billion words of de-identified EHR narrative; 345M, 3.9B and 8.9B parameters | `UFNLP/gatortron-base` |
| [KRISSBERT](https://doi.org/10.18653/v1/2022.findings-emnlp.61) | Findings of EMNLP (2022) | self-supervised mentions over 3.47M UMLS entities; links by **contextual** prototype | `microsoft/BiomedNLP-KRISSBERT-PubMed-UMLS-EL` |
| [MedCPT](https://doi.org/10.1093/bioinformatics/btad651) | *Bioinformatics* **39** (2023) | contrastive training on 255M PubMed search logs; a query tower and a document tower | `ncbi/MedCPT-Query-Encoder` |
| [BioLORD-2023](https://doi.org/10.1093/jamia/ocae029) | *JAMIA* **31** (2024) | concept definitions and relations, as a sentence-embedding model | `FremyCompany/BioLORD-2023` |

Two findings in that table matter more than the ordering.

**PubMedBERT's finding**: for a domain this distinct, pretraining from scratch beats adapting a general model, because the vocabulary itself was wrong before. The mechanism is visible in one line of tokenisation — `cyclooxygenase` is a single token for PubMedBERT and eight word fragments for BioBERT, [measured here](../huggingface-practice-en/).

**LinkBERT's finding**: the corpus is not a bag of documents. Feeding linked articles into one context buys more than another sweep over the same abstracts. Both are arguments about the corpus, not the architecture; both models are plain BERT underneath.

## What BLURB settles, and what it cannot

BLURB bundles named-entity recognition, relation extraction, PICO extraction, sentence similarity, document classification and question answering, and reports a macro average. Eleven rows from the leaderboard, as it stood in November 2026:

| model | BLURB macro |
| --- | --- |
| BioLinkBERT-large | **84.30** |
| BioM-ALBERT-xxlarge-PMC | 84.10 |
| BioLinkBERT-base | 83.39 |
| PubMedBERT-large | 82.91 |
| BioELECTRA-base | 82.60 |
| PubMedBERT-base (abstracts) | 81.16 |
| BioBERT | 80.34 |
| SciBERT | 78.86 |
| ClinicalBERT | 77.29 |
| BlueBERT | 76.27 |
| BERT-base | 76.11 |

Three cautions before quoting any of it.

- **Five of these eleven rows are third-party.** BioBERT, SciBERT, ClinicalBERT, BlueBERT and plain BERT never reported BLURB — those numbers come from PubMedBERT's own Table 6. More than one value for PubMedBERT-base circulates; the one above is the figure in its own Table 6, and the leaderboard carries a higher one from a later fine-tuning study.
- **More text is not better text.** PubMedBERT trained on abstracts scores 81.16; on abstracts plus full text, 81.01 — a small regression, reaching 81.50 only with 60% more training. The abstracts-plus-full-text checkpoint is nonetheless the one everyone downloads. Do not claim full text helps.
- **BLURB is literature-only, so it cannot choose a clinical encoder.** ClinicalBERT sits near the bottom of this table and remains the most-downloaded model in the family, because hospital notes are a different dialect and BLURB does not contain any.

## Which one to reach for

| the text you have | reach for | why |
| --- | --- | --- |
| abstracts, literature | **BiomedBERT-base**, or BioLinkBERT-large for the best published number | the ordering holds across the papers that report it, not just the leaderboard |
| clinical notes | **BioClinical ModernBERT**, with Bio_ClinicalBERT to reproduce older work | reported to beat both ClinicalBERT and GatorTron on 4 of 5 clinical tasks at 150M parameters with an 8,192-token context — though it is still a preprint |
| mention string to dictionary entry | **SapBERT** | no fine-tuning needed, and the task is surface-form normalisation |
| mention plus context to a concept ID | **KRISSBERT** | 77.4 against SapBERT's 66.4 averaged over seven datasets, because it disambiguates |
| retrieval over articles | **MedCPT** | still the endorsed default for retrieval-augmented generation over PubMed |

One thing the 2024–2026 literature has reversed: a domain-specific embedder is **not** reliably better than a strong general one. MedCPT's own paper showed a 330M domain model beating a 175B general model in 2023. Since then the cleanest head-to-head puts general-purpose BGE-large slightly ahead of MedCPT on biomedical retrieval, and a 2026 reasoning-heavy medical benchmark finds domain pretraining buying nothing at 7B scale. Scale now buys more than domain, and nobody is good at the hard version of the task.

## The bibliographic record is getting worse

Something in that recommendation table deserves to be said out loud. From 2023 onward, only a handful of these models carry a peer-reviewed venue — MedCPT in *Bioinformatics* and BioLORD-2023 in *JAMIA* among them. BioClinical ModernBERT, Clinical ModernBERT, the ModernBERT-bio variants, MedTE and most of the 2025–2026 embedding models are **arXiv preprints**, and some widely used checkpoints have no paper at all.

Usage runs the other way from citability. Counting downloads in the month to 12 November 2026:

| checkpoint | downloads | paper |
| --- | --- | --- |
| `emilyalsentzer/Bio_ClinicalBERT` | 2,394,513 | a 2019 workshop paper |
| `microsoft/BiomedNLP-BiomedBERT-base-...` | 1,924,950 | *ACM Trans. Comput. Healthc.* (2021) |
| `cambridgeltl/SapBERT-from-PubMedBERT-fulltext` | 1,406,322 | NAACL (2021) |
| `NeuML/pubmedbert-base-embeddings` | 742,483 | **none** |
| `ncbi/MedCPT-Query-Encoder` | 64,929 | *Bioinformatics* (2023) |
| `michiyasunaga/BioLinkBERT-large` | 18,065 | ACL (2022) |

The best-scoring model on BLURB is downloaded 130 times less often than a 2019 workshop model, and the most-used sentence embedder in the family has no publication behind it. **Which model is good, which is citable and which is actually deployed are three different orderings**, and it is worth knowing which one you are reading when someone recommends a checkpoint.

## Encoder or decoder

The generative work moved to decoder LLMs. The encoders did not die, and for the job in this note they are usually still right.

- On 12 biomedical NLP benchmarks, fine-tuning beat zero- and few-shot LLMs on most tasks, with closed-source models ahead only on reasoning-style question answering (*Nat. Commun.* **16**, 3280, 2025).
- On 938,150 prescriptions across 11 categories, a fine-tuned Bio+Clinical BERT reached F1 0.97–0.98 against zero-shot GPT-4's 0.71–0.86 (*Commun. Med.* **5**, 83, 2025).
- On systematic-review screening, a PubMedBERT and BioLinkBERT ensemble beat four zero-shot frontier models, which also showed badly miscalibrated confidence (*J. Clin. Epidemiol.* **200**, 112514, 2026).

The exceptions are real and growing — 8B-class LLMs now beat 300M encoders on several biomedical named-entity tasks, at one to two orders of magnitude more inference cost.

For **embedding** specifically the architecture question has dissolved, and the way it dissolved is worth noticing. The recipe that turns a decoder LLM into a strong text encoder begins by **removing the causal mask** — that is, by making the decoder bidirectional, like BERT. So decoders did not replace encoders for embeddings; larger bidirectional models replaced smaller ones.

## Using one

One practical result, measured rather than quoted, in the [HuggingFace note](../huggingface-practice-en/):

A raw masked-language checkpoint is a strong starting point for [fine-tuning](../transfer-learning-en/) and a bad similarity metric. PubMedBERT puts two paraphrases of the same pharmacology at cosine 0.988 — and an unrelated sentence about birds at 0.957. The whole space is compressed into a narrow band. The three biomedical checkpoints with a usable spread were all trained further on pairs.

And if you plan to run both views, structure and text, the question that decides whether it was worth it is the [multimodal](../multimodal-en/) one: the two views have to disagree somewhere.

## Summary

- Prose about a drug is a different input from its structure, and it carries **pharmacology the structure does not state**
- Two unrelated scaffolds used for one condition look alike in text — that is the signal, and the reason to add a text view
- **The trap is leakage**: indication text states the therapeutic category, so strip the outcome fields, hold out by drug, and ablate the text to check — and note that deleting the field does not delete the answer, since a trial protocol stripped of every drug field still gives up the drug class 45% of the time
- The mechanism was **named as a validity threat in 2026**, for gene summaries against GO terms and for trial protocols against drug class; the drug-description version of that audit is unclaimed
- Prose is used mostly for **interactions and repurposing**, and the ablations agree: text pays when structure is missing or the drug is unseen, and the gain shrinks once molecular features are added
- **Text barely helps property prediction**, and the one reproducible gain sits on ClinTox, whose negatives are the approved drugs the text describes as approved
- Text is biased toward well-studied drugs and **absent for a novel compound**, which is the case you wanted a model for
- PubMedBERT showed from-scratch pretraining with an in-domain vocabulary beats continuing from general BERT; LinkBERT showed citation links beat more of the same abstracts
- **BLURB ranks literature encoders and cannot choose a clinical one** — and its own numbers say full text does not help
- Outside interactions the record thins fast: **assay-description text is the best-supported case**, pharmacovigilance narratives lose to coded fields by 0.127 AUC, literature-based target scores correlate 0.795 with publication count, and for ADMET nobody has tried
- Reach for BiomedBERT on abstracts, BioClinical ModernBERT on notes, SapBERT or KRISSBERT for linking, MedCPT for retrieval
- A domain embedder is **no longer reliably better than a strong general one**; at 7B scale domain pretraining buys little
- Encoders still win on fine-tuned classification for cost and calibration, and the decoder embedders that beat them work by removing the causal mask

## References

- Windisch et al., [Evidence use and identifier-conditioned prior knowledge in LLM classification of oncology trials](https://doi.org/10.2196/95565), *JMIR AI* **5**, e95565 (2026) — progressive content removal and counterfactual testing, the method the drug version needs
- Woo et al., [The contribution of the Vaccine Adverse Event Text Mining system to the classification of possible Guillain-Barré syndrome reports](https://doi.org/10.4338/aci-2012-11-ra-0049), *Appl. Clin. Inform.* **4**, 88–99 (2013) — where narrative text loses to coded fields
- Khan et al., [Automating candidate gene prioritization with large language models](https://doi.org/10.1093/bioinformatics/btaf541), *Bioinformatics* **41** (2025) — the correlation with publication count
- Wu et al., [When gene summaries reveal the answers: Gene Ontology circularity in gene embedding benchmarks](https://arxiv.org/abs/2611.11118) (2026) — the mechanism measured, for genes
- Koyun, [Does your trial simulator know what the drug does?](https://arxiv.org/abs/2611.05907) (2026) — a language model recovers the withheld drug class 45% of the time
- Guo et al., [What can large language models do in chemistry? A comprehensive benchmark on eight tasks](https://arxiv.org/abs/2305.18365) (NeurIPS Datasets and Benchmarks 2023) — the measured prompt ablation, HIV F1 0.977 to 0.554
- Asada et al., [Representing a heterogeneous pharmaceutical knowledge-graph with textual information](https://doi.org/10.3389/frma.2021.670206), *Front. Res. Metr. Anal.* **6** (2021) — the DrugBank description to ATC worked example
- Jeon et al., [Predicting drug–side effect relationships from parametric knowledge](https://doi.org/10.2196/67513), *JMIR Med. Inform.* **13**, e67513 (2025) — an uncontrolled instance
- Kapoor & Narayanan, [Leakage and the reproducibility crisis in machine-learning-based science](https://doi.org/10.1016/j.patter.2023.100804), *Patterns* **4**, 100804 (2023) — the taxonomy this belongs to
- Yu et al., [LlaSMol: advancing large language models for chemistry with a large-scale, comprehensive, high-quality instruction tuning dataset](https://arxiv.org/abs/2402.09391) (COLM 2024) — the property-prediction panel above
- Qian et al., [Can large language models empower molecular property prediction?](https://arxiv.org/abs/2307.07443) (2023) — the controlled representation comparison
- Liu et al., [Multi-modal molecule structure–text model for text-based retrieval and editing](https://doi.org/10.1038/s42256-023-00759-6), *Nat. Mach. Intell.* **5**, 1447–1457 (2023) — MoleculeSTM
- Lee et al., [BioBERT: a pre-trained biomedical language representation model for biomedical text mining](https://doi.org/10.1093/bioinformatics/btz682), *Bioinformatics* **36**, 1234–1240 (2020)
- Beltagy et al., [SciBERT: a pretrained language model for scientific text](https://doi.org/10.18653/v1/D19-1371), *EMNLP-IJCNLP* (2019)
- Alsentzer et al., [Publicly available clinical BERT embeddings](https://doi.org/10.18653/v1/W19-1909), *Clinical NLP Workshop* (2019)
- Peng et al., [Transfer learning in biomedical natural language processing](https://doi.org/10.18653/v1/W19-5006), *BioNLP Workshop* (2019) — BlueBERT and the BLUE benchmark
- Gu et al., [Domain-specific language model pretraining for biomedical natural language processing](https://doi.org/10.1145/3458754), *ACM Trans. Comput. Healthc.* **3**, 1–23 (2021) — PubMedBERT and BLURB
- Liu et al., [Self-alignment pretraining for biomedical entity representations](https://doi.org/10.18653/v1/2021.naacl-main.334), *NAACL* (2021) — SapBERT
- Yasunaga et al., [LinkBERT: pretraining language models with document links](https://doi.org/10.18653/v1/2022.acl-long.551), *ACL* (2022)
- Yang et al., [A large language model for electronic health records](https://doi.org/10.1038/s41746-022-00742-2), *npj Digit. Med.* **5**, 194 (2022) — GatorTron
- Zhang et al., [Knowledge-rich self-supervision for biomedical entity linking](https://doi.org/10.18653/v1/2022.findings-emnlp.61), *Findings of EMNLP* (2022) — KRISSBERT
- Jin et al., [MedCPT: contrastive pre-trained transformers with large-scale PubMed search logs](https://doi.org/10.1093/bioinformatics/btad651), *Bioinformatics* **39** (2023)
- Remy et al., [BioLORD-2023: semantic textual representations fusing large language models and clinical knowledge graph insights](https://doi.org/10.1093/jamia/ocae029), *JAMIA* **31**, 1844–1855 (2024)
- Chen et al., [Benchmarking large language models for biomedical natural language processing](https://doi.org/10.1038/s41467-025-56989-2), *Nat. Commun.* **16**, 3280 (2025)
- Yuan et al., [Transformers and large language models are efficient feature extractors for electronic health records](https://doi.org/10.1038/s43856-025-00790-1), *Commun. Med.* **5**, 83 (2025)
- Pitre et al., [A biomedical BERT ensemble (TITAN-SR) outperformed active-learning and large language model chatbots for systematic review title and abstract screening](https://doi.org/10.1016/j.jclinepi.2026.112514), *J. Clin. Epidemiol.* **200**, 112514 (2026)
- BehnamGhader et al., [LLM2Vec: large language models are secretly powerful text encoders](https://arxiv.org/abs/2404.05961) (COLM 2024)
