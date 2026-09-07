# Standard Nuxt reproduction for Vite #23446

A small Nuxt 4.5.2 application with 48 ordinary `Lazy` Vue components and scoped CSS. No Drupal, Stir layer, Nuxt UI, custom chunking, artificial CPU delay, external content, or private dependencies.

`stock/` and `patched/` contain identical application source and Nuxt configuration. Both pin Vite 8.2.2. The only intentional build difference is the pnpm dependency patch in `patched/package.json`, corresponding to https://github.com/vitejs/vite/pull/23446. Lockfiles are included.

This is a synthetic component fixture, not the private production site behind the PR's 607 → 453 ms TBT case study. It reproduces the unnecessary promise settlements; it does not promise the same TBT improvement. A completely empty starter would not meaningfully exercise the shared lazy-import dependency path.

## Run

Use Node 22.12+ (or a newer supported Node LTS) and pnpm 10.

```sh
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
pnpm --dir stock install --frozen-lockfile
pnpm --dir stock build
pnpm --dir patched install --frozen-lockfile
pnpm --dir patched build
pnpm test
```

The test starts production servers on localhost ports 4178 and 4179, then shuts them down. Keep these ports free. Set `CHROME_PATH` to use another Chromium executable.

It observes `Promise.resolve(undefined)` calls during startup, verifies 48 rendered components, clicks a button to check hydration, rejects browser errors/hydration warnings, and compares script request and stylesheet counts. Instrumentation exists only in the test browser, not the application. Other Nuxt versions may themselves create empty resolutions, so the assertion compares variants rather than requiring an absolute zero.

Observed on Chromium 153.0.8010.12: stock **144**, patched **0** empty resolutions; **52** script requests and **48** stylesheet links in both variants. See `verification.json` for the exact browser version and recorded output.

## Optional performance comparison

```sh
node profile.mjs
```

This runs three interleaved mobile Lighthouse measurements per variant with applied browser throttling (`throttlingMethod: 'devtools'`), fresh Chrome per run, and no promise instrumentation. Reports go into `reports/`. Run on an otherwise idle machine; use medians and inspect individual runs. There is deliberately no flaky timing threshold in the regression test. The mechanism check and end-to-end TBT are different evidence.

To inspect manually, start each build in separate terminals:

```sh
cd stock
PORT=4178 node .output/server/index.mjs
```

```sh
cd patched
PORT=4179 node .output/server/index.mjs
```

The existing Vite PR regression also covers a CSS-bearing import loaded twice. This project supplies the requested standalone Nuxt consumer; it does not replace Vite's own correctness/CSS/error tests.

## Recorded local measurements

Three interleaved runs with Lighthouse 13.4.1, Chromium 153.0.8010.12 and Node 26.8.1 on macOS:

| Metric | Stock | Patched |
| --- | --- | --- |
| TBT runs (ms) | 90.15 / 90.36 / 86.89 | 80.90 / 84.38 / 71.76 |
| Median TBT (ms) | 90.15 | 80.90 |
| Median LCP (ms) | 660.72 | 651.29 |
| Script requests | 52 | 52 |

This is a small local difference (~9 ms), not evidence that the production site's 154 ms reduction generalizes. Three runs do not establish statistical significance. The deterministic mechanism test is stronger evidence of the removed work. All package versions/integrities and application source were compared between variants; only Vite's patch identity differs. See `lighthouse-summary.json` for every sample.
