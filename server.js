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
    res.json({ success: false, error: error.message });
  }
});

app.get('/extract', async (req, res) => {
  const username = req.query.user;

  if (!username) {
    return res.json({ error: 'Passe ?user=' });
  }

  let browser;

  try {
    const executablePath = await chromium.executablePath();

    browser = await puppeteer.launch({
      args: chromium.args,
      executablePath,
      headless: chromium.headless
    });

    const page = await browser.newPage();

    // 🔐 aplica cookies (login)
    if (process.env.IG_COOKIES) {
      const cookies = JSON.parse(process.env.IG_COOKIES);
      await page.setCookie(...cookies);
    }

    await page.goto(`https://www.instagram.com/${username}/`, {
      waitUntil: 'domcontentloaded'
    });

    await delay(3000, 5000);

    const btn = await page.$('a[href$="/followers/"]');

    if (!btn) {
      return res.json({
        error: 'Não conseguiu abrir seguidores (cookie inválido ou não logado)'
      });
    }

    await btn.click();
    await delay(3000, 5000);

    const users = new Map();

    for (let i = 0; i < 10; i++) {
      const data = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('div[role="dialog"] li')).map(el => {
          const username = el.querySelector('a')?.innerText;
          const img = el.querySelector('img')?.src;
          const name = el.querySelector('span')?.innerText;

          return { username, img, name };
        });
      });

      data.forEach(u => u.username && users.set(u.username, u));

      await page.evaluate(() => {
        const el = document.querySelector('div[role="dialog"] ul');
        el.scrollTop += 500;
      });

      await delay(1500, 3000);
    }

    await browser.close();

    res.json({
      total: users.size,
      data: Array.from(users.values())
    });

  } catch (err) {
    if (browser) await browser.close();
    res.json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log('Server ON');
});
