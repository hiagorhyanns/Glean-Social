const express = require('express');
const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// rota básica
app.get('/', (req, res) => {
  res.send('Servidor rodando 🚀');
});

// teste puppeteer
app.get('/test', async (req, res) => {
  try {
    const browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true
    });

    const page = await browser.newPage();
    await page.goto('https://example.com', { waitUntil: 'domcontentloaded' });

    const title = await page.title();

    await browser.close();

    res.json({ success: true, title });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// start server
app.listen(PORT, () => {
  console.log('Server ON na porta ' + PORT);
});
