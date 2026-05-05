---
type: Fixed
pr: 3150
---
**`stats.json` decimal phase ordering now has explicit regression coverage** — added a fixture ensuring `06.7/06.8/06.9` remain present when `06.10` exists, preventing dropped-phase regressions in mixed decimal phase ranges.