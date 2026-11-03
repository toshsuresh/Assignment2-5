# Greenhouse Gas Emissions

CMSC471 Assignment 2: White Hat/Black Hat Visualization. Static, interactive website using the supplied OECD greenhouse-gas export.

## Run locally

No dependency installation or API key is needed. Use Python 3 and Node.js 20 or later for the checks.

```sh
npm start
```

Open **http://127.0.0.1:8002**. Serve the folder over HTTP; double-clicking `index.html` cannot reliably load the data module.

## Included

- White hat: country/aggregate comparison with date controls, absolute/indexed values, zero-based scales, estimate-aware tooltips, explicit missing data, a searchable/sortable country snapshot, and CSV download.
- Black hat: a credible-looking editorial briefing using six cherry-picked OECD countries, an equal-weight index, a 2020 cutoff, a cropped index scale, and a causal headline.
- Framing lab: three independent repairs, live original/current percentages, a fixed-scale comparison chart, and a detailed reveal. The cohort repair changes both the represented countries and aggregation method; it is not an isolated sampling experiment.
- Page sections for sources, proposed extra credit, AI design evidence, and clearly marked write-up/teamwork/reflection placeholders.

## Data provenance

`data/oecd-ghg-original.csv` is a byte-for-byte copy of the supplied file named `OECD.ENV.EPI,DSD_AIR_GHG@DF_AIR_GHG,,filtered,2026-11-01 19-18-15.csv`.

Unlike the assignment’s historical label, this export contains **2015–2024**, **792 observations**, **89 countries/territories plus five aggregates**, one combined greenhouse-gas measure, and no sector breakdown. Values exclude LULUCF. `KG_CO2E_PS` with `UNIT_MULT=3` means thousands of kg per person, equivalent to **tonnes CO₂e per person**. Do not divide the numeric observations by 1,000 again.

The source snapshot is pinned; this website does not query a live API. Missing observations are never filled. Forty observations are marked estimated. Source precision is preserved internally and rounded only for display. The OECD aggregate is used as published, without averaging or adding country per-person values.

Regenerate and verify:

```sh
npm run prepare-data
npm run check
```

`scripts/prepare_data.py` validates every row and records the source SHA-256 in `data/emissions.json`. `model.mjs` contains the calculations. `app.mjs` renders SVG charts and binds controls. All data paths are relative.

Publishing is handled separately by the student. This repository has no automated deployment workflow.

## Remaining student submission work

- [ ] Complete white-hat and black-hat write-ups, roughly 200–500 words each.
- [ ] Add real team member names, division of work, total people-hours, and development commentary.
- [ ] Complete the AI reflection and any real reader evaluation. The AI design record is evidence of exploration, not a human study or a promise of extra credit.
- [ ] Register a team of 2–3 or address the assignment’s solo-work policy.
- [ ] Publish and verify the public webpage.
- [ ] Record and watch a brief demo of the finished page.
- [ ] Include an **Extra Credit Features** declaration in Canvas if claiming credit.
- [ ] Submit a ZIP containing the deployed URL and demo video to Canvas-ELMS.

Suggested demo sequence: show the absolute trend and missing US years; switch to indexed values; change areas and snapshot year; read the original briefing; apply each repair individually; show the audit, source, and reflection sections. Use your actual finished page when recording.

## Verification record

Data validation and all seven model tests pass (`npm run check`). Browser checks covered the chart controls, missing observations, all eight combinations of comparison settings, and desktop/mobile layouts. Publishing, recording, and completing the write-ups are being handled by the student.

## References

- [OECD Data Explorer — greenhouse gas inventories](https://data-explorer.oecd.org/vis?df%5Bag%5D=OECD.ENV.EPI&df%5Bid%5D=DSD_AIR_GHG%40DF_AIR_GHG&df%5Bds%5D=dsDisseminateFinalDMZ)
- [OECD — Understanding datasets on greenhouse gas emissions](https://www.oecd.org/en/blogs/2024/06/understanding-datasets-on-greenhouse-gas-emissions.html)
- Supplied course assignment brief, CMSC471, Fall 2026.
- [AI design exploration and reflection prompts](docs/ai-design-log.md).

Original project layout and SVG chart implementation; no visualization template was adapted. The page uses Arial/system sans-serif and has no external font dependencies.
