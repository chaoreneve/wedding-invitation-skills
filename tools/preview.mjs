import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

// Run local servers for output/classic on 8000 and output/witness on 8001 first.
const browser = await chromium.launch({ headless: true, executablePath: process.env.WEDDING_BROWSER_PATH });
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  await mkdir('docs/previews', { recursive: true });
  for (const [name, port] of [['classic', 8000], ['witness', 8001]]) {
    await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'networkidle' });
    await page.screenshot({ path: `docs/previews/${name}.png` });
  }
} finally {
  await browser.close();
}
