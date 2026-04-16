const express = require('express');
const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');

const app = express();
const PORT = process.env.PORT || 10000;

const delay = (min = 800, max = 2000) =>
  new Promise(r => setTimeout(r, Math.random() * (max - min) + min));

app.get('/', (req, res) => {
  res.send('OK');
});

app.get('/test', async (req, res) => {
  let browser;

  try {
    const executablePath = await chromium.executablePath();

    browser = await puppeteer.launch({
      args: chromium.args,
      executablePath,
      headless: chromium.headless
    });

    const page = await browser.newPage();
    await page.goto('https://example.com', { waitUntil: 'domcontentloaded' });

    const title = await page.title();

    await browser.close();

    res.json({ success: true, title });

  } catch (error) {
    if (browser) await browser.close();

    res.json({
      success: false,
      error: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log('Server ON');
});
