# AI design exploration record

Project: Greenhouse Gas Emissions — CMSC471 Assignment 2, Fall 2026.

This is a record of design reasoning performed by Codex during this implementation, not a fabricated transcript, a human usability study, or a record of student work. The student reflections remain placeholders. AI also generated code; that alone is not the basis of the proposed extra-credit claim.

## The user’s design brief

The student requested two interactive white-hat/black-hat visualizations using the supplied OECD CSV, placeholders for the write-ups, and an attempt at AI extra credit through novel, reflective, documented use beyond code generation.

## Grounding before ideation

Inspection found 792 observations across 94 reference areas, covering 2015–2024. The filtered export contains one combined-GHG measure, per person, excluding LULUCF. It cannot support a sector-by-sector story or the assignment’s historical 1990–2018 range. The file’s unit multiplier is 10³ kilograms, equivalent to tonnes per person. These findings constrained the design before a narrative was chosen.

## Alternatives considered by AI

The guiding question was: how can a visitor discover that a convincing chart can use authentic values and still mislead?

| Design alternative | Intended experience | Critique and decision |
| --- | --- | --- |
| Two charts with a static explanatory reveal | Read each visualization and then an explanation of the manipulation | Clear and achievable, but the explanation asks the reader to trust the author again. Kept the explanation, but rejected it as the only learning interaction. |
| A free-form misleading-chart editor | Let readers choose countries, endpoints, scales, and claims themselves | Potentially playful, but too many simultaneous choices make it difficult to attribute a changed impression to one decision. A small dataset could also encourage invented functionality, such as unavailable sector comparisons. Rejected for this assignment. |
| Guided counterfactual repairs | Undo sample selection, endpoint selection, and scale emphasis independently on the original briefing | Selected. Readers can isolate one rhetorical choice while retaining the same source observations. A persistent comparison panel prevents the reader from having to remember the original percentage while scrolling. |

## Chosen interaction and its reasoning

The white hat is an open-ended explorer: consistent zero-based axes, absolute and indexed views, visible unavailable values, explicit estimates, and a country-only snapshot. The published OECD series is labeled as an aggregate. Country averages are not presented as population-weighted totals.

The black hat uses real values with a selective narrative: the six OECD members with the greatest 2015–2020 declines, an equal-weight mean of their indexed series, a 2020 endpoint, an index axis beginning at 70, and a causal-sounding headline. The six-country decline is 23.4332673%; the published OECD per-person aggregate declines 12.6736758% over the same interval. These are different summaries, not interchangeable estimates of one quantity.

Three independent repairs expose different mechanisms:

1. Replace the winners’ average with the published OECD aggregate. This deliberately changes both population represented and aggregation method; the UI says so. It is a benchmark comparison, not a controlled estimate of sampling bias alone.
2. Extend the series to 2024. This reveals the rebound and subsequent path without guessing future values. The original series remains visible only through 2020 in the comparison view.
3. Restore a zero baseline. The points and computed percentage remain identical; only the encoding changes.

The current and original lines also share a fixed zero-based comparison chart. The larger briefing shows the selected scale. This makes it possible to compare the original framing and the current framing without normalizing each chart independently.

## AI cognitive walkthrough and limits

This is AI self-critique, not participant evidence.

| Walkthrough question | Finding | Implementation decision |
| --- | --- | --- |
| Can a visitor compare a changed percentage without remembering the original? | A distant briefing makes comparison a memory task. | Added original/current readouts and a comparison chart beside the repair workflow. |
| Does restoring context establish that climate policy caused the change? | No. The dataset contains no causal identification. | Repaired headings use descriptive language; the audit explicitly rejects the causal inference. |
| Can a short line be mistaken for zero after the last reported year? | Yes, especially for the US, which stops in 2022 here. | Preserve missing observations and state that gaps are unavailable, not zero. Display unavailable rows in the snapshot. |
| Can equal weighting be mistaken for a regional aggregate? | Yes. A six-country average gives small and large countries equal influence. | Identify the mean as equal-weighted, and use the published OECD aggregate for the repair instead of manufacturing a weighted estimate without population data. |
| Does an index hide absolute inequality? | Yes. Equal starting values can conceal very different per-person levels. | Start the white hat with absolute values; offer indexing as an explicitly labeled alternative. |
| Could the black hat be too obvious? | Yes. Readers arrive knowing this is an ethics assignment. The 2020 cutoff and cropped axis are discoverable. | Keep the briefing visually restrained and explanatory audit collapsible. Do not claim measured subtlety without testing. |

## Verification performed

The data-preparation script validates dimensions, unique area/year keys, units, and status flags. Model tests cover missingness, indexing, cohort selection, ranking, CSV quoting, and the independent repair states. Browser QA checks desktop/mobile rendering and actual controls. Exact verification results are in the README; these checks validate behavior, not persuasive effectiveness.

## Reflection to complete by the student

- [What suggestions did you accept, reject, or revise? Why?]
- [What did AI overlook about your audience or the ethics of the briefing?]
- [What did actual readers believe before and after using each repair? Record the procedure and real observations; do not invent participants or results.]
- [Did a repair change their confidence, their interpretation, or both?]
- [Which verification did you perform independently?]
- [How would you improve the design after that evidence?]

## Proposed extra-credit claim

AI supported the exploration and critique of an interaction for teaching visualization rhetoric. The artifact is a counterfactual framing lab, with documented alternatives, rejection criteria, AI self-critique, verifiable transformations, and explicit limitations. It runs locally in the browser and makes no runtime AI calls. Novelty and effectiveness have not been established by a user study. Extra credit is subject to the instructor’s evaluation and the team’s completed reflection.

## Student feedback on the initial interface

The student found the initial page too polished and asked to remove slogans and the perspective branding. The implementation was revised to a plain assignment title, system fonts, neutral backgrounds, conventional controls, and shorter explanations. This feedback illustrates a limitation of the AI’s initial design: visual polish did not match the student’s intended presentation. The interactive comparison and its calculations remain in place. The student will handle write-ups, publication, and the demo recording.
