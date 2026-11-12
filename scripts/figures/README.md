# Figure generators

Every computed figure under `public/assets/fig/` is produced by a script here, so any number a
note claims about its own figure can be re-derived rather than taken on trust.

Run with the project Python (matplotlib, numpy, scikit-learn, rdkit):

```bash
python scripts/figures/fig_batch3.py
```

Each script writes straight into `public/assets/fig/` and seeds its random number generator, so
re-running reproduces the committed SVG exactly.

Figures sourced from papers are **not** generated here — they are reproduced under their stated
licence, with the attribution in the figure caption.

---

`../check.py` runs thirty checks over the notes — frontmatter, emphasis budget, heading levels,
link targets, figure provenance, banned Korean renderings, citation formats and the rest. Run it
after `npm run build`; it exits with the number of checks that found something.

The Korean checks test for a wrong *sense*, not a forbidden character, so they carry context
exceptions: 기울기 is right for the slope of an activation and wrong for a gradient, 거래 is right
in 거래 네트워크, 농축 is right for concentrating cells. Add to those exceptions rather than
silencing a check.
