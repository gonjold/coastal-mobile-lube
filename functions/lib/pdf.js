// functions/lib/pdf.js
// Wrapper around puppeteer-core + @sparticuz/chromium for use in Cloud Functions.
// Designed to run in Cloud Functions Gen 2 with Node 22 runtime.
// LOCAL DEV NOTE: This will not work locally — @sparticuz/chromium ships a
// Linux-only Chromium binary tuned for Lambda/Cloud Functions environments.

const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');

/**
 * Renders an HTML string to a Letter-size PDF buffer.
 * @param {string} html - Fully-formed HTML document
 * @param {object} [options] - Optional puppeteer page.pdf options to merge
 * @returns {Promise<Buffer>}
 */
async function generatePdfFromHtml(html, options = {}) {
  let browser;
  try {
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });

    const pdfBuffer = await page.pdf({
      format: 'Letter',
      printBackground: true,
      margin: { top: '0.5in', right: '0.5in', bottom: '0.5in', left: '0.5in' },
      ...options,
    });

    return pdfBuffer;
  } finally {
    if (browser) {
      await browser.close().catch(() => {}); // best-effort
    }
  }
}

module.exports = { generatePdfFromHtml };
