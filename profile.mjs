import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import lighthouse from 'lighthouse'
import { launch } from 'chrome-launcher'
import { chromium } from '@playwright/test'
const servers = []
const results = []
await mkdir('reports', { recursive: true })
try {
  for (const [i, variant] of ['stock', 'patched'].entries()) {
    servers.push(spawn(process.execPath, ['.output/server/index.mjs'], { cwd: variant, env: { ...process.env, PORT: String(4178+i), HOST: '127.0.0.1' }, stdio: 'ignore' }))
    let ready = false
    for (let attempt = 0; attempt < 100; attempt++) {
      try { if ((await fetch(`http://127.0.0.1:${4178+i}`)).ok) { ready = true; break } } catch {}
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    assert.ok(ready)
  }
  for (let run = 1; run <= 3; run++) {
    for (const variant of run === 2 ? ['patched', 'stock'] : ['stock', 'patched']) {
      const chrome = await launch({ chromePath: process.env.CHROME_PATH || chromium.executablePath(), chromeFlags: ['--headless', '--no-sandbox'] })
      try {
        const { lhr } = await lighthouse(`http://127.0.0.1:${variant === 'stock' ? 4178 : 4179}/`, { port: chrome.port, output: 'json', onlyCategories: ['performance'], logLevel: 'error', throttlingMethod: 'devtools' })
        assert.equal(lhr.runtimeError, undefined)
        await writeFile(`reports/${variant}-${run}.json`, JSON.stringify(lhr))
        const a = lhr.audits
        const result = { variant, run, tbt: a['total-blocking-time'].numericValue, lcp: a['largest-contentful-paint'].numericValue, scripts: a['network-requests'].details.items.filter(item => item.resourceType === 'Script').length }
        results.push(result)
        console.log(JSON.stringify(result))
      } finally { await chrome.kill() }
    }
  }
  await writeFile('reports/summary.json', JSON.stringify(results, null, 2) + '\n')
} finally { for (const server of servers) server.kill('SIGTERM') }
