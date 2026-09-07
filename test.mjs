import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { writeFile } from 'node:fs/promises'
import { chromium } from '@playwright/test'
const servers = []
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined })
const results = []
try {
  for (const [i, variant] of ['stock', 'patched'].entries()) {
    servers.push(spawn(process.execPath, ['.output/server/index.mjs'], { cwd: variant, env: { ...process.env, PORT: String(4178+i), HOST: '127.0.0.1' }, stdio: 'ignore' }))
    let ready = false
    for (let attempt = 0; attempt < 100; attempt++) {
      try { if ((await fetch(`http://127.0.0.1:${4178+i}`)).ok) { ready = true; break } } catch {}
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    assert.ok(ready, `${variant} server did not start`)
  }
  for (const variant of ['stock', 'patched']) {
    const context = await browser.newContext()
    const page = await context.newPage()
    const errors = []
    const requests = []
    page.on('pageerror', e => errors.push(e.message))
    page.on('console', message => { if (message.type() === 'warning' && /hydration/i.test(message.text())) errors.push(message.text()) })
    page.on('response', response => { if (response.status() >= 400) errors.push(response.url()) })
    page.on('request', request => requests.push(request.resourceType()))
    await page.addInitScript(() => {
      const originalResolve = Promise.resolve
      window.__emptyResolutions = 0
      Promise.resolve = function (...args) {
        if (args.length === 1 && args[0] === undefined) window.__emptyResolutions++
        return originalResolve.apply(this, args)
      }
    })
    await page.goto(`http://127.0.0.1:${variant === 'stock' ? 4178 : 4179}/`)
    await page.waitForFunction(() => window.__appReady === true)
    await page.locator('button').first().click()
    await page.waitForFunction(() => document.querySelector('button').textContent.includes('1'))
    const result = await page.evaluate(() => ({ emptyResolutions: window.__emptyResolutions, sections: document.querySelectorAll('section').length, styles: document.querySelectorAll('link[rel="stylesheet"]').length }))
    assert.deepEqual(errors, [])
    assert.equal(result.sections, 48)
    results.push({ variant, ...result, scripts: requests.filter(type => type === 'script').length })
    await context.close()
  }
  assert.ok(results[0].emptyResolutions > results[1].emptyResolutions, 'The standard Nuxt fixture must actually reproduce the extra settlements')
  assert.equal(results[0].scripts, results[1].scripts)
  assert.equal(results[0].styles, results[1].styles)
  await writeFile('results.json', JSON.stringify({ browser: browser.version(), results }, null, 2) + '\n')
  console.log(JSON.stringify(results, null, 2))
  console.log('PASS: matching content, interactivity, CSS and script requests; fewer empty settlements. This is not a TBT assertion.')
} finally {
  await browser.close()
  for (const server of servers) server.kill('SIGTERM')
}
