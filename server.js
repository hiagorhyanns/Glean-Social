const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const PORT = process.env.PORT || 10000;

app.get('/', (req, res) => {
  res.send('Servidor rodando 🚀');
});

// TESTE
app.get('/test', async (req, res) => {
  let browser;

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage'
      ]
    });

    const page = await browser.newPage();

    await page.goto('https://example.com', {
      waitUntil: 'domcontentloaded'
    });

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

// INSTAGRAM
app.get('/extract', async (req, res) => {
  const username = req.query.user;

  if (!username) {
    return res.json({ error: 'Informe ?user=' });
  }

  let browser;

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled'
      ]
    });

    const page = await browser.newPage();

    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36'
    );

    const cookies = JSON.parse(process.env.IG_COOKIES || '[]');

    await page.goto('https://www.instagram.com/', {
      waitUntil: 'domcontentloaded'
    });

    if (cookies.length > 0) {
      await page.setCookie(...cookies);
    }

    await page.reload({
      waitUntil: 'networkidle2'
    });

    await page.goto(`https://www.instagram.com/${username}/`, {
      waitUntil: 'networkidle2'
    });

    const loginInput = await page.$('input[name="username"]');

    if (loginInput) {
      throw new Error('Não está logado (cookies inválidos)');
    }

    const name = await page.evaluate(() => {
      const el = document.querySelector('h2');
      return el ? el.innerText : null;
    });

    await browser.close();

    res.json({
      success: true,
      user: username,
      name
    });

  } catch (error) {
    if (browser) await browser.close();

    res.json({
      success: false,
      error: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log('Server ON na porta ' + PORT);
});
