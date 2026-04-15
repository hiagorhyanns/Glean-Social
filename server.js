const express = require('express');
const puppeteer = require('puppeteer-core');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Servidor rodando 🚀');
});

app.get('/test', async (req, res) => {
  let browser;

  try {
    browser = await puppeteer.launch({
      headless: true,
      executablePath: '/usr/bin/chromium-browser', // caminho padrão Railway
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();
    await page.goto('https://example.com');

    const title = await page.title();

    await browser.close();

    res.json({ success: true, title });

  } catch (error) {
    if (browser) await browser.close();

    res.json({
      success: false,
      error: error.message,
      hint: 'Provavelmente Chromium não existe no ambiente Railway'
    });
  }
});

app.listen(PORT, () => {
  console.log('Server ON na porta ' + PORT);
});
